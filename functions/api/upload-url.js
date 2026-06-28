// ============================================================
// /functions/api/upload-url.js  —  Cloudflare Pages Function
// ------------------------------------------------------------
// Mints a short-lived, browser-uploadable PUT URL for Cloudflare R2.
//
// Flow:
//   1. Browser POSTs { filename, contentType } with a Supabase JWT in the
//      Authorization header.
//   2. We verify that JWT against Supabase's /auth/v1/user endpoint.
//   3. We build a per-object key and PRESIGN an S3 PUT request to R2 using
//      AWS Signature Version 4 — implemented from scratch with Web Crypto
//      (crypto.subtle) so the function stays ZERO-dependency on the Workers
//      runtime (no aws-sdk, no npm).
//   4. We return { uploadUrl, key, publicUrl }. The browser then does a plain
//      PUT (no auth header, no extra signed headers) straight to R2 — big
//      files never transit our server.
//
// SECURITY NOTE: this is the most sensitive file in the kit. The presign must
// be byte-exact or R2 rejects the upload with SignatureDoesNotMatch, so every
// step below is commented. Secrets (R2 keys, service role) live only in
// Cloudflare env and never reach the browser.
// ============================================================

// --- CORS ---------------------------------------------------
// Permissive CORS so the static frontend (possibly a different origin during
// local dev / preview) can call this endpoint and read the JSON response.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

// Small helper: JSON response with CORS headers attached.
function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

// ------------------------------------------------------------
// Web Crypto primitives for SigV4
// ------------------------------------------------------------

const encoder = new TextEncoder();

// Lowercase hex encoding of a byte buffer (SigV4 expects lowercase hex).
function toHex(buffer) {
  const bytes = new Uint8Array(buffer);
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

// SHA-256 of a string -> lowercase hex digest.
async function sha256Hex(message) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(message));
  return toHex(digest);
}

// HMAC-SHA256(key, message) -> raw bytes (ArrayBuffer).
// `key` may be either an ArrayBuffer/Uint8Array (from a previous round) or a
// string (the initial "AWS4" + secret). We normalize to bytes before importing.
async function hmac(key, message) {
  const keyBytes = typeof key === 'string' ? encoder.encode(key) : key;
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message));
}

// Derive the SigV4 signing key:
//   kDate    = HMAC("AWS4" + secret, date)
//   kRegion  = HMAC(kDate,   region)
//   kService = HMAC(kRegion, service)
//   kSigning = HMAC(kService,"aws4_request")
// Each HMAC consumes the *raw bytes* of the previous one (a classic SigV4 gotcha).
async function getSigningKey(secretKey, dateStamp, region, service) {
  const kDate = await hmac('AWS4' + secretKey, dateStamp);
  const kRegion = await hmac(kDate, region);
  const kService = await hmac(kRegion, service);
  const kSigning = await hmac(kService, 'aws4_request');
  return kSigning;
}

// RFC-3986 encoding for query-string values. encodeURIComponent leaves
// !'()* unescaped, but SigV4's canonical query string requires them escaped,
// so we percent-encode those four extra characters by hand.
function rfc3986(str) {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase(),
  );
}

// Encode an object-key path for the canonical URI. Each "/" separates path
// segments and must stay literal; everything inside a segment is rfc3986-encoded.
function encodeKeyPath(key) {
  return key
    .split('/')
    .map((segment) => rfc3986(segment))
    .join('/');
}

// ------------------------------------------------------------
// CORS preflight
// ------------------------------------------------------------
export async function onRequestOptions() {
  // 204 No Content with the CORS headers satisfies the browser preflight.
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// ------------------------------------------------------------
// POST /api/upload-url
// ------------------------------------------------------------
export async function onRequestPost(context) {
  const { request, env } = context;

  // --- 1) Parse and validate the request body ----------------
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  const { filename, contentType, size, projectId } = payload || {};
  if (!filename || typeof filename !== 'string') return json({ error: 'filename is required' }, 400);
  if (!projectId || typeof projectId !== 'string') return json({ error: 'projectId is required' }, 400);

  // Bind the byte length so a presigned URL can't be reused for a bigger file.
  // Single-PUT to R2 is capped at ~5 GiB; larger files need multipart (Phase 3).
  const MAX_SINGLE_PUT = 5 * 1024 * 1024 * 1024 - 5 * 1024 * 1024; // 4.995 GiB
  const len = Number(size);
  if (!Number.isFinite(len) || len <= 0) return json({ error: 'size (bytes) is required' }, 400);
  if (len > MAX_SINGLE_PUT) {
    return json({ error: 'File too large for a single upload (max ~5 GiB). Multipart upload is required for bigger files.' }, 413);
  }

  // Allowlist the MIME type — only images and video may be stored & served.
  const ct = String(contentType || '');
  if (!/^image\//.test(ct) && !/^video\//.test(ct)) {
    return json({ error: 'Only image/* and video/* uploads are allowed' }, 415);
  }

  // --- 2) Verify the Supabase JWT AND authorize the project --
  // The client sends `Authorization: Bearer <access_token>`. We (a) confirm the
  // token is valid, then (b) confirm the user is a MEMBER of projectId's
  // workspace by querying as that user — RLS only returns the project row if
  // they belong to it, so a non-member gets [] -> 403. Everything fails CLOSED.
  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Missing bearer token' }, 401);
  let workspaceId;
  try {
    const userResp = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: authHeader },
    });
    if (!userResp.ok) return json({ error: 'Unauthorized' }, 401);

    const projResp = await fetch(
      `${env.SUPABASE_URL}/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&select=workspace_id`,
      { headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: authHeader } },
    );
    const rows = projResp.ok ? await projResp.json() : [];
    if (!Array.isArray(rows) || rows.length === 0) {
      return json({ error: 'Not a member of this project' }, 403);
    }
    workspaceId = rows[0].workspace_id;
  } catch {
    return json({ error: 'Auth check failed' }, 401); // fail closed on network error
  }

  // --- 3) Build a workspace-scoped, sanitized object key ------
  // Prefix with the workspace id (for attribution / lifecycle rules) and a UUID
  // so two users uploading "final.mp4" never clobber each other.
  const safeName = filename.replace(/[^\w.-]+/g, '_').slice(0, 120);
  const key = `ws/${workspaceId}/${crypto.randomUUID()}-${safeName}`;

  // --- 4) AWS SigV4 query-string presign for an R2 PUT -------
  const region = 'auto';
  const service = 's3';
  const host = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  // Path-style addressing: /<bucket>/<key>. The bucket name is a literal path
  // segment; the key gets per-segment RFC-3986 encoding.
  const canonicalUri = `/${env.R2_BUCKET}/${encodeKeyPath(key)}`;

  // SigV4 timestamps: amzDate = YYYYMMDDTHHMMSSZ, dateStamp = YYYYMMDD (UTC).
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ''); // 20260621T010203Z
  const dateStamp = amzDate.slice(0, 8); // 20260621

  const expires = 3600; // URL valid for 1 hour
  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  // For a presigned URL the auth material rides in the query string. We sign
  // host + content-length + content-type, so the eventual PUT is bound to the
  // EXACT byte length and MIME type we authorized (a member can't reuse the URL
  // for a bigger or different-typed file). Payload stays UNSIGNED so the browser
  // streams the body without us hashing gigabytes. Names lowercased + sorted.
  const signedHeaders = 'content-length;content-type;host';

  // Build the canonical query string. These params MUST be:
  //   - URI-encoded (key and value),
  //   - sorted by encoded key name (byte order).
  // We assemble as [encKey, encVal] pairs, sort by encKey, then join.
  const queryParams = [
    ['X-Amz-Algorithm', algorithm],
    ['X-Amz-Credential', `${env.R2_ACCESS_KEY_ID}/${credentialScope}`],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(expires)],
    ['X-Amz-SignedHeaders', signedHeaders],
  ];
  const canonicalQueryString = queryParams
    .map(([k, v]) => [rfc3986(k), rfc3986(v)])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('&');

  // Canonical headers block: one "name:value\n" line per signed header, with
  // names lowercased, values trimmed, and lines sorted by header name.
  const canonicalHeaders =
    `content-length:${len}\n` +
    `content-type:${ct}\n` +
    `host:${host}\n`;

  // Canonical request:
  //   METHOD \n URI \n QUERY \n CANONICAL_HEADERS \n SIGNED_HEADERS \n PAYLOAD_HASH
  // Payload hash literal is "UNSIGNED-PAYLOAD" for presigned PUTs.
  const payloadHash = 'UNSIGNED-PAYLOAD';
  const canonicalRequest = [
    'PUT',
    canonicalUri,
    canonicalQueryString,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  // String to sign:
  //   ALGORITHM \n AMZ_DATE \n CREDENTIAL_SCOPE \n hex(SHA256(canonicalRequest))
  const hashedCanonicalRequest = await sha256Hex(canonicalRequest);
  const stringToSign = [
    algorithm,
    amzDate,
    credentialScope,
    hashedCanonicalRequest,
  ].join('\n');

  // Signature = hex( HMAC( signingKey, stringToSign ) )
  const signingKey = await getSigningKey(
    env.R2_SECRET_ACCESS_KEY,
    dateStamp,
    region,
    service,
  );
  const signature = toHex(await hmac(signingKey, stringToSign));

  // Final presigned URL = endpoint + canonical query + the computed signature.
  // X-Amz-Signature is appended AFTER signing (it is never part of the signed
  // canonical query string).
  const uploadUrl =
    `https://${host}${canonicalUri}?${canonicalQueryString}` +
    `&X-Amz-Signature=${signature}`;

  // Public URL the app stores as versions.r2_key's served location. We keep
  // `key` itself in the DB; publicUrl is the convenience CDN/public-bucket URL.
  const publicUrl = env.R2_PUBLIC_BASE.replace(/\/$/, '') + '/' + key;

  // The browser's PUT MUST send exactly this Content-Type and a body of exactly
  // `len` bytes (the browser sets Content-Length automatically from the File),
  // since both are now part of the signature. We echo them back for clarity.
  return json({ uploadUrl, key, publicUrl, contentType: ct, size: len });
}

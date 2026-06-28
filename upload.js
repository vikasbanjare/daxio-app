// Daxio direct-to-R2 uploader.
//
// Big files (images, video — up to ~20GB) never pass through our server.
// Instead we:
//   1. Ask a Pages Function (/api/upload-url) to mint a short-lived presigned
//      PUT URL for Cloudflare R2, authenticating with the caller's Supabase JWT.
//   2. PUT the raw file bytes straight to that URL from the browser, streaming
//      upload progress back to the caller.
//
// The function returns { uploadUrl, key, publicUrl }. We hand back
// { r2_key, publicUrl } so the caller can persist it on a `versions` row
// (see data.js -> addVersion).

import { getAccessToken } from './supabase.js';

/**
 * Upload a single File to R2 via a presigned URL.
 *
 * @param {File} file                 The file to upload (from an <input> or drop).
 * @param {object}   opts
 * @param {string}   opts.projectId    The project to upload into (must be one you belong to).
 * @param {(p:number)=>void} [opts.onProgress]  Called with progress 0..1 during PUT.
 * @returns {Promise<{ r2_key: string, publicUrl: string }>}
 * @throws on auth failure, a non-OK upload-url response, or a failed PUT.
 */
export async function uploadFile(file, { projectId, onProgress } = {}) {
  if (!projectId) throw new Error('uploadFile requires a projectId');
  const contentType = file.type || 'application/octet-stream';

  // --- Step 1: get a presigned PUT URL from our Pages Function. -----------
  // The function verifies the Supabase JWT + project membership, and signs the
  // exact size + content-type, so we send all four.
  const token = await getAccessToken();

  const res = await fetch('/api/upload-url', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({
      filename: file.name,
      contentType,
      size: file.size,
      projectId
    })
  });

  if (!res.ok) {
    // Surface the server's error text to make debugging easier.
    const detail = await res.text().catch(() => '');
    throw new Error(
      'Failed to get upload URL (' + res.status + ')' + (detail ? ': ' + detail : '')
    );
  }

  const { uploadUrl, key, publicUrl } = await res.json();

  // --- Step 2: PUT the file straight to R2. -------------------------------
  // We use XMLHttpRequest (not fetch) because it exposes upload progress
  // events, which the UI needs for a progress bar on multi-GB files.
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);

    // Content-Type and Content-Length are part of the signature, so they MUST
    // match. We send the same Content-Type we declared; the browser sets
    // Content-Length automatically from the File's byte length.
    xhr.setRequestHeader('Content-Type', contentType);

    // Report fractional progress (0..1) as bytes go out.
    xhr.upload.onprogress = (e) => {
      if (typeof onProgress === 'function' && e.lengthComputable) {
        onProgress(e.loaded / e.total);
      }
    };

    xhr.onload = () => {
      // R2 returns 200 on a successful PUT.
      if (xhr.status === 200) {
        if (typeof onProgress === 'function') onProgress(1); // ensure we hit 100%.
        resolve();
      } else {
        reject(new Error('Upload failed (' + xhr.status + ')'));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed: network error'));
    xhr.onabort = () => reject(new Error('Upload aborted'));

    xhr.send(file);
  });

  // --- Step 3: hand back the stored object's key + public URL. ------------
  return { r2_key: key, publicUrl };
}

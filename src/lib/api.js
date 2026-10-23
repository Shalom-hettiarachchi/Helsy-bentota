// Talks to the PHP API in public/api (same website, so no extra setup).

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message)
    this.status = status
    this.data = data
  }
}

export async function api(path, { method = 'GET', body, csrf, signal } = {}) {
  const headers = { Accept: 'application/json' }
  const opts = { method, headers, credentials: 'same-origin', cache: 'no-store', signal }
  if (body instanceof FormData) {
    opts.body = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  if (csrf) headers['X-CSRF-Token'] = csrf

  let res
  try {
    res = await fetch(`/api/${path}`, opts)
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new ApiError('Could not reach the server. Please check your connection and try again.')
  }
  const text = await res.text().catch(() => '')
  let data = null
  try {
    data = JSON.parse(text)
  } catch {
    // not JSON (e.g. PHP not running)
  }
  if (data && typeof data === 'object' && data.ok === false) {
    throw new ApiError(data.error || `The server returned an error (${res.status}). Please try again.`, res.status, data)
  }
  if (!res.ok || !data || typeof data !== 'object' || data.ok !== true) {
    // Show what actually came back, so a wrong setup is easy to spot.
    const type = res.headers.get('content-type') || 'unknown type'
    const sample = text.replace(/\s+/g, ' ').trim().slice(0, 160) || '(empty)'
    throw new ApiError(
      `The server did not send a proper reply (status ${res.status}, ${type}) for /api/${path.split('?')[0]}. ` +
        `It sent: ${sample}`,
      res.status,
      data,
    )
  }
  return data
}

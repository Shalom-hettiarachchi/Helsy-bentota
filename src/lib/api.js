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
  let data = null
  try {
    data = await res.json()
  } catch {
    // not JSON (e.g. PHP not running)
  }
  if (res.ok && !data) {
    throw new ApiError(
      'The server did not send a proper reply. PHP may not be running for /api, or it is older than PHP 8.1.',
      res.status,
    )
  }
  if (!res.ok || !data || data.ok === false) {
    throw new ApiError(data?.error || `The server returned an error (${res.status}). Please try again.`, res.status, data)
  }
  return data
}

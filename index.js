/**
 * Reverse proxy Worker: forwards all requests to baseHost.
 * Note: baseHost has NO trailing slash, because pathname already starts with "/".
 */
const baseHost = 'https://cnvmp3.com/v55'

async function handleRequest (request) {
  const requestUrl = new URL(request.url)
  const targetUrl = baseHost + requestUrl.pathname + requestUrl.search

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD'

  const proxyRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: hasBody ? request.body : undefined,
    redirect: 'manual', // don't silently follow redirects to the origin domain
    // Only cache safe, idempotent requests
    cf: request.method === 'GET'
      ? { cacheTtl: 10, cacheEverything: true }
      : undefined
  })

  const response = await fetch(proxyRequest)

  // Copy status, statusText, and headers; the copy has mutable headers
  const proxied = new Response(response.body, response)

  // Keep redirects on your own domain
  const location = proxied.headers.get('Location')
  if (location) {
    proxied.headers.set('Location', location.replace(baseHost, requestUrl.origin))
  }

  return proxied
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

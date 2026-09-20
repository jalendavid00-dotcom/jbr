// Shared helper — not a route itself (files under _lib/ are ignored by
// Cloudflare Pages Functions routing).

export function isAuthorized(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '').trim();
  return Boolean(env.ADMIN_PASSWORD) && token === env.ADMIN_PASSWORD;
}

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function unauthorized() {
  return json({ error: 'unauthorized' }, 401);
}

// POST /api/admin/set-eta — body: { id, eta } (auth required)
// Sets or changes the free-text estimated delivery window for a shipment.
// An empty eta clears it. Not written to the update log on purpose.

import { isAuthorized, json, unauthorized } from './_lib/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!isAuthorized(request, env)) return unauthorized();

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'invalid_body' }, 400);
  }

  const id = (body.id || '').toString().trim().toUpperCase();
  if (!id) return json({ error: 'missing_id' }, 400);
  const eta = (body.eta || '').toString().trim().slice(0, 120);

  try {
    const res = await env.DB
      .prepare('UPDATE shipments SET eta = ? WHERE id = ?')
      .bind(eta || null, id)
      .run();
    if (res.meta && res.meta.changes === 0) return json({ error: 'not_found' }, 404);
  } catch (e) {
    return json({ error: 'eta_column_missing' }, 500);
  }

  return json({ ok: true, id, eta: eta || null });
}

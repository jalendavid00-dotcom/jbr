// POST /api/admin/delete-shipment — body: { id } (auth required)
// Deletes a shipment and every update logged against it. Irreversible —
// once gone, that tracking number returns "not found" to anyone who
// still has the link.

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

  await env.DB.prepare('DELETE FROM updates WHERE shipment_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM shipments WHERE id = ?').bind(id).run();

  return json({ ok: true });
}

// POST /api/admin/advance  — body: { id }. Moves a shipment to its next
// stage (pickup -> clearance -> delivered) and stamps the timestamp.

import { isAuthorized, json, unauthorized } from './_lib/auth.js';

const STAGE_FIELDS = ['pickup_at', 'clearance_at', 'delivered_at'];

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

  const row = await env.DB.prepare('SELECT * FROM shipments WHERE id = ?').bind(id).first();
  if (!row) return json({ error: 'not_found' }, 404);
  if (row.stage >= 2) return json({ error: 'already_delivered' }, 400);

  const nextStage = row.stage + 1;
  const field = STAGE_FIELDS[nextStage]; // fixed lookup table, not user input — safe to interpolate
  const now = new Date().toISOString();

  await env.DB
    .prepare(`UPDATE shipments SET stage = ?, ${field} = ? WHERE id = ?`)
    .bind(nextStage, now, id)
    .run();

  return json({ id, stage: nextStage, [field]: now });
}

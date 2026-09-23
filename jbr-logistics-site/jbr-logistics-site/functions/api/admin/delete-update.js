// POST /api/admin/delete-update — body: { updateId } (auth required)
// Removes one entry from a shipment's update log. There is no edit
// endpoint by design — fixing a mistake means deleting the wrong entry
// and posting a correct one, so the log never silently changes shape.

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

  const updateId = parseInt(body.updateId, 10);
  if (!updateId) return json({ error: 'missing_update_id' }, 400);

  await env.DB.prepare('DELETE FROM updates WHERE id = ?').bind(updateId).run();

  return json({ ok: true });
}

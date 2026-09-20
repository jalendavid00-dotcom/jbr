// GET /api/track/:id  — public, no auth. Returns the shipment or 404.

export async function onRequestGet(context) {
  const { params, env } = context;
  const id = (params.id || '').toString().trim().toUpperCase();

  if (!id) {
    return new Response(JSON.stringify({ error: 'missing_id' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const row = await env.DB
    .prepare('SELECT * FROM shipments WHERE id = ?')
    .bind(id)
    .first();

  if (!row) {
    return new Response(JSON.stringify({ found: false }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { results: updates } = await env.DB
    .prepare('SELECT color, message, created_at FROM updates WHERE shipment_id = ? ORDER BY created_at DESC')
    .bind(id)
    .all();

  return new Response(JSON.stringify({ found: true, shipment: row, updates }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

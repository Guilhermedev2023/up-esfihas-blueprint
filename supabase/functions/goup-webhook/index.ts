import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GOUP_WEBHOOK_TOKEN = Deno.env.get('GOUP_WEBHOOK_TOKEN') || '';

const STATUS_MAP: Record<string, string> = {
  dispatched: 'saiu_entrega',
  em_rota: 'saiu_entrega',
  on_the_way: 'saiu_entrega',
  picked_up: 'saiu_entrega',
  delivered: 'finalizado',
  concluido: 'finalizado',
  completed: 'finalizado',
  cancelled: 'cancelado',
  canceled: 'cancelado',
  cancelado: 'cancelado',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Health check / URL validation (goup pings the URL before saving)
  if (req.method === 'GET' || req.method === 'HEAD') {
    return new Response(
      JSON.stringify({ ok: true, service: 'goup-webhook', ready: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    if (!GOUP_WEBHOOK_TOKEN) {
      return new Response(JSON.stringify({ error: 'Server misconfigured: GOUP_WEBHOOK_TOKEN missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization') || '';
    const tokenHeader = req.headers.get('X-Webhook-Token') || req.headers.get('x-webhook-token') || '';
    const expected = `Bearer ${GOUP_WEBHOOK_TOKEN}`;
    const authorized = authHeader === expected || tokenHeader === GOUP_WEBHOOK_TOKEN;

    if (!authorized) {
      await supabase.from('goup_sync_logs').insert({
        action: 'webhook_unauthorized',
        status: 'error',
        response_body: { received_auth: authHeader.slice(0, 20) },
      });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));

    const goupStatus: string = body.status || body.event || body.delivery_status || '';
    const externalId: string | undefined = body.external_id || body.order_id || body.reference;
    const goupDeliveryId: string | undefined = body.id || body.delivery_id || body.goup_delivery_id;

    const mapped = STATUS_MAP[String(goupStatus).toLowerCase()];

    let pedidoId: string | null = null;

    if (externalId || goupDeliveryId) {
      let query = supabase.from('pedidos').select('id, numero').limit(1);
      if (externalId) query = query.eq('id', externalId);
      else if (goupDeliveryId) query = query.eq('goup_delivery_id', goupDeliveryId);
      const { data: found } = await query.maybeSingle();
      pedidoId = found?.id || null;

      if (pedidoId) {
        const updates: Record<string, unknown> = { goup_status: goupStatus };
        if (goupDeliveryId) updates.goup_delivery_id = goupDeliveryId;
        if (mapped) updates.status = mapped;
        await supabase.from('pedidos').update(updates).eq('id', pedidoId);
      }
    }

    await supabase.from('goup_sync_logs').insert({
      pedido_id: pedidoId,
      action: 'webhook_received',
      status: mapped ? 'mapped' : 'unmapped',
      request_body: body,
      response_body: { mapped_status: mapped || null, goup_status: goupStatus },
    });

    return new Response(JSON.stringify({ ok: true, mapped }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from('goup_sync_logs').insert({
      action: 'webhook_error',
      status: 'error',
      response_body: { error: message },
    });
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

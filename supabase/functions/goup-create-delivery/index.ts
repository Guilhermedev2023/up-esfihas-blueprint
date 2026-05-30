import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GOUP_API_TOKEN = Deno.env.get('GOUP_API_TOKEN') || '';
const GOUP_API_URL = Deno.env.get('GOUP_API_URL') || 'https://goup.entregas.io/api/v1/orders';

async function sendToGoup(payload: Record<string, unknown>) {
  const res = await fetch(GOUP_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GOUP_API_TOKEN}`,
      'X-Integration-Type': 'foody_delivery',
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  let json: unknown = null;
  try { json = JSON.parse(text); } catch { /* not json */ }
  return { ok: res.ok, status: res.status, body: json ?? text };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Auth: only admins can trigger this
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const token = authHeader.replace('Bearer ', '');
  const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
  if (claimsErr || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', claims.claims.sub)
    .eq('role', 'admin')
    .maybeSingle();
  if (!roleRow) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let pedidoId: string | undefined;
  try {
    const body = await req.json();
    pedidoId = body?.pedido_id;
    if (!pedidoId) {
      return new Response(JSON.stringify({ error: 'pedido_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: pedido, error: pedErr } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id', pedidoId)
      .maybeSingle();
    if (pedErr || !pedido) {
      return new Response(JSON.stringify({ error: 'Pedido not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let customerName = 'Cliente';
    if (pedido.user_id) {
      const { data: prof } = await supabase
        .from('profiles').select('nome').eq('user_id', pedido.user_id).maybeSingle();
      if (prof?.nome) customerName = prof.nome;
    }

    const end = (pedido.endereco || {}) as Record<string, unknown>;
    const items = Array.isArray(pedido.items) ? pedido.items : [];

    const payload = {
      external_id: pedido.id,
      reference: String(pedido.numero),
      customer: {
        name: customerName,
        phone: pedido.telefone,
      },
      delivery_address: {
        street: end.rua || end.endereco || '',
        number: end.numero || '',
        complement: end.complemento || '',
        neighborhood: end.bairro || '',
        city: end.cidade || 'Florianópolis',
        state: end.estado || 'SC',
        zipcode: end.cep || '',
      },
      items: items.map((i: any) => ({
        name: i.nome || i.product_name || 'Item',
        quantity: i.quantidade || i.quantity || 1,
        unit_price: Number(i.preco || i.unit_price || 0),
      })),
      subtotal: Number(pedido.subtotal || 0),
      delivery_fee: Number(pedido.taxa_entrega || 0),
      total: Number(pedido.total || 0),
      payment_method: pedido.metodo_pagamento,
      change_for: pedido.troco ? Number(pedido.troco) : null,
      notes: pedido.observacao_pagamento || '',
    };

    // Retry: immediate, then 5s, then 30s
    const delays = [0, 5000, 30000];
    let lastResult: Awaited<ReturnType<typeof sendToGoup>> | null = null;
    for (let attempt = 0; attempt < delays.length; attempt++) {
      if (delays[attempt] > 0) await new Promise(r => setTimeout(r, delays[attempt]));
      lastResult = await sendToGoup(payload);
      await supabase.from('goup_sync_logs').insert({
        pedido_id: pedidoId,
        action: 'create_delivery',
        status: lastResult.ok ? 'success' : `http_${lastResult.status}`,
        request_body: { attempt: attempt + 1, payload },
        response_body: typeof lastResult.body === 'object' ? lastResult.body : { raw: lastResult.body },
      });
      if (lastResult.ok) break;
    }

    if (lastResult?.ok) {
      const respBody = lastResult.body as Record<string, unknown>;
      const goupId = (respBody?.id || respBody?.delivery_id || respBody?.order_id) as string | undefined;
      await supabase
        .from('pedidos')
        .update({
          goup_delivery_id: goupId || null,
          goup_status: 'created',
          goup_last_error: null,
        })
        .eq('id', pedidoId);
      return new Response(JSON.stringify({ ok: true, goup_delivery_id: goupId, response: lastResult.body }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      const errMsg = `goup HTTP ${lastResult?.status}: ${typeof lastResult?.body === 'string' ? lastResult?.body : JSON.stringify(lastResult?.body)}`.slice(0, 500);
      await supabase
        .from('pedidos')
        .update({ goup_last_error: errMsg, goup_status: 'error' })
        .eq('id', pedidoId);
      return new Response(JSON.stringify({ ok: false, error: errMsg }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await supabase.from('goup_sync_logs').insert({
      pedido_id: pedidoId || null,
      action: 'create_delivery_exception',
      status: 'error',
      response_body: { error: message },
    });
    if (pedidoId) {
      await supabase.from('pedidos').update({ goup_last_error: message, goup_status: 'error' }).eq('id', pedidoId);
    }
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

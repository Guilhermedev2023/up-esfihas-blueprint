import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const GOUP_API_TOKEN = Deno.env.get('GOUP_API_TOKEN') || '';
const GOUP_API_URL = Deno.env.get('GOUP_API_URL') || 'https://goup.entregas.io/api/v1/orders';

async function sendToGoup(payload: Record<string, unknown>) {
  console.log('[goup] POST', GOUP_API_URL, 'payload keys:', Object.keys(payload));
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
  console.log('[goup] response status=', res.status, 'body snippet:', text.slice(0, 300));
  return { ok: res.ok, status: res.status, body: json ?? text };
}

function jsonResponse(payload: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);

  let pedidoId: string | undefined;
  let supabase: ReturnType<typeof createClient> | null = null;

  try {
    supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // ---- Auth ----
    const authHeader = req.headers.get('Authorization') || '';
    if (!authHeader.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Não autenticado. Faça login como administrador.' }, 401);
    }
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      console.warn('[goup] claims error:', claimsErr?.message);
      return jsonResponse({ error: 'Sessão inválida. Faça login novamente.' }, 401);
    }
    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', claims.claims.sub)
      .eq('role', 'admin')
      .maybeSingle();
    if (!roleRow) return jsonResponse({ error: 'Apenas administradores podem designar entregas.' }, 403);

    // ---- Body ----
    const body = await req.json().catch(() => ({}));
    pedidoId = body?.pedido_id;
    console.log('[goup] requested for pedido_id=', pedidoId);
    if (!pedidoId) return jsonResponse({ error: 'pedido_id é obrigatório no corpo da requisição.' }, 400);

    // ---- Config check ----
    if (!GOUP_API_TOKEN) {
      const errMsg = 'Integração goup não configurada: variável GOUP_API_TOKEN ausente. Configure nas variáveis de ambiente da função.';
      console.error('[goup]', errMsg);
      await supabase.from('pedidos').update({ goup_last_error: errMsg, goup_status: 'error' }).eq('id', pedidoId);
      return jsonResponse({ ok: false, error: errMsg, code: 'missing_goup_token' }, 503);
    }

    // ---- Load order ----
    const { data: pedido, error: pedErr } = await supabase
      .from('pedidos').select('*').eq('id', pedidoId).maybeSingle();
    if (pedErr || !pedido) {
      console.error('[goup] pedido not found', pedErr?.message);
      return jsonResponse({ error: 'Pedido não encontrado no banco de dados.' }, 404);
    }

    // ---- Customer name ----
    let customerName = 'Cliente';
    if (pedido.user_id) {
      const { data: prof } = await supabase
        .from('profiles').select('nome').eq('user_id', pedido.user_id).maybeSingle();
      if (prof?.nome) customerName = prof.nome;
    }

    const end = (pedido.endereco || {}) as Record<string, any>;
    const items = Array.isArray(pedido.items) ? pedido.items : [];

    // ---- Validate required fields ----
    const missing: string[] = [];
    if (!pedido.telefone) missing.push('telefone');
    if (!end.rua && !end.endereco) missing.push('endereço (rua)');
    if (!end.numero) missing.push('endereço (número)');
    if (!end.bairro) missing.push('endereço (bairro)');
    if (!items.length) missing.push('itens');
    if (missing.length) {
      const errMsg = `Dados obrigatórios ausentes: ${missing.join(', ')}.`;
      console.warn('[goup]', errMsg);
      await supabase.from('pedidos').update({ goup_last_error: errMsg, goup_status: 'error' }).eq('id', pedidoId);
      return jsonResponse({ ok: false, error: errMsg, code: 'missing_required_fields' }, 422);
    }

    // ---- Geolocation (non-blocking) ----
    const lat = end.latitude ?? end.lat ?? null;
    const lng = end.longitude ?? end.lng ?? null;
    if (lat == null || lng == null) {
      console.warn('[goup] coordenadas ausentes — enviando sem lat/lng (aguardando geolocalização)');
    }

    const payload = {
      external_id: pedido.id,
      reference: String(pedido.numero),
      customer: { name: customerName, phone: pedido.telefone },
      delivery_address: {
        street: end.rua || end.endereco || '',
        number: end.numero || '',
        complement: end.complemento || '',
        neighborhood: end.bairro || '',
        city: end.cidade || 'Florianópolis',
        state: end.estado || 'SC',
        zipcode: end.cep || '',
        latitude: lat,
        longitude: lng,
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

    console.log('[goup] dispatch pedido=', pedido.numero, 'cliente=', customerName, 'total=', pedido.total, 'coords=', lat, lng);

    // Retry: immediate, then 5s, then 30s
    const delays = [0, 5000, 30000];
    let lastResult: Awaited<ReturnType<typeof sendToGoup>> | null = null;
    for (let attempt = 0; attempt < delays.length; attempt++) {
      if (delays[attempt] > 0) await new Promise(r => setTimeout(r, delays[attempt]));
      try {
        lastResult = await sendToGoup(payload);
      } catch (netErr) {
        const m = netErr instanceof Error ? netErr.message : String(netErr);
        console.error('[goup] network error attempt', attempt + 1, m);
        lastResult = { ok: false, status: 0, body: { error: `Erro de rede: ${m}` } };
      }
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
      await supabase.from('pedidos').update({
        goup_delivery_id: goupId || null,
        goup_status: 'created',
        goup_last_error: null,
      }).eq('id', pedidoId);
      return jsonResponse({ ok: true, goup_delivery_id: goupId, response: lastResult.body }, 200);
    } else {
      const respText = typeof lastResult?.body === 'string'
        ? lastResult?.body
        : JSON.stringify(lastResult?.body);
      const httpCode = lastResult?.status ?? 0;
      let friendly = 'Erro ao criar entrega no serviço goup.';
      if (httpCode === 0) friendly = 'Não foi possível alcançar o serviço de entrega (erro de rede).';
      else if (httpCode === 401 || httpCode === 403) friendly = 'Credenciais inválidas no serviço goup.';
      else if (httpCode === 404) friendly = 'Endpoint goup não encontrado. Verifique GOUP_API_URL.';
      else if (httpCode >= 500) friendly = 'Serviço goup indisponível no momento.';
      const errMsg = `${friendly} (HTTP ${httpCode}) ${respText}`.slice(0, 800);
      await supabase.from('pedidos').update({ goup_last_error: errMsg, goup_status: 'error' }).eq('id', pedidoId);
      return jsonResponse({ ok: false, error: errMsg, http_status: httpCode }, 200);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[goup] unhandled exception:', message, stack);
    try {
      if (supabase) {
        await supabase.from('goup_sync_logs').insert({
          pedido_id: pedidoId || null,
          action: 'create_delivery_exception',
          status: 'error',
          response_body: { error: message, stack },
        });
        if (pedidoId) {
          await supabase.from('pedidos').update({ goup_last_error: message, goup_status: 'error' }).eq('id', pedidoId);
        }
      }
    } catch { /* swallow logging errors */ }
    return jsonResponse({ ok: false, error: `Erro interno: ${message}`, stack }, 200);
  }
});

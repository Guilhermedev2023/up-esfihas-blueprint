// Meta Conversions API (server-side events) for UP Esfihas.
//
// Secrets (Lovable Cloud > Secrets):
//   META_PIXEL_ID          - Pixel / dataset id (same id used in index.html)
//   META_CAPI_TOKEN        - Conversions API access token (Events Manager > Settings)
//   META_TEST_EVENT_CODE   - optional, e.g. TEST12345 while validating in "Test events"
//
// Actions:
//   event           - browser mirror of ViewContent / AddToCart / InitiateCheckout / AddPaymentInfo
//   purchase        - called by the buyer's browser right after a pay-on-delivery order is saved
//   purchase_server - called by stripe-webhook (service role) after a card payment succeeds
//
// Purchase values always come from the `pedidos` table, never from the browser.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const GRAPH_VERSION = Deno.env.get("META_GRAPH_VERSION") ?? "v24.0";
const PIXEL_ID = Deno.env.get("META_PIXEL_ID") ?? "";
const CAPI_TOKEN = Deno.env.get("META_CAPI_TOKEN") ?? "";
const TEST_EVENT_CODE = Deno.env.get("META_TEST_EVENT_CODE") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const BROWSER_EVENTS = new Set(["ViewContent", "AddToCart", "InitiateCheckout", "AddPaymentInfo"]);
const NON_PURCHASE_STATUSES = new Set(["aguardando_pagamento", "cancelado"]);

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// ---------- hashing & normalization (Meta customer information parameters) ----------
const sha256 = async (value: string): Promise<string> => {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
};

const hashIf = async (value: string | null | undefined): Promise<string[] | undefined> => {
  const v = (value ?? "").trim();
  return v ? [await sha256(v)] : undefined;
};

const normText = (v?: string | null) =>
  (v ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z]/g, "");

const normPhone = (v?: string | null) => {
  let digits = (v ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits;
};

interface Profile {
  user_id: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
}

const buildUserData = async (
  profile: Profile | null,
  ctx: { fbp?: string | null; fbc?: string | null; user_agent?: string | null; client_ip?: string | null },
) => {
  const userData: Record<string, unknown> = {};
  if (ctx.client_ip) userData.client_ip_address = ctx.client_ip;
  if (ctx.user_agent) userData.client_user_agent = ctx.user_agent;
  if (ctx.fbp) userData.fbp = ctx.fbp;
  if (ctx.fbc) userData.fbc = ctx.fbc;

  if (profile) {
    const [first, ...rest] = (profile.nome ?? "").trim().split(/\s+/);
    userData.em = await hashIf(profile.email?.toLowerCase());
    userData.ph = await hashIf(normPhone(profile.telefone));
    userData.fn = await hashIf(normText(first));
    userData.ln = await hashIf(normText(rest.join(" ")));
    userData.external_id = await hashIf(profile.user_id);
    // Delivery area is fixed: Florianópolis / SC / Brasil
    userData.ct = await hashIf("florianopolis");
    userData.st = await hashIf("sc");
    userData.country = await hashIf("br");
  }

  for (const k of Object.keys(userData)) if (userData[k] === undefined) delete userData[k];
  return userData;
};

const getProfile = async (userId: string | null): Promise<Profile | null> => {
  if (!userId) return null;
  const { data } = await admin
    .from("profiles")
    .select("user_id, nome, email, telefone")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return data as Profile;
  const { data: authUser } = await admin.auth.admin.getUserById(userId);
  return authUser?.user ? { user_id: userId, nome: null, email: authUser.user.email ?? null, telefone: null } : null;
};

const clientIp = (req: Request) =>
  req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

// ---------- custom_data ----------
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : undefined;
};

const sanitizeCustomData = (raw: Record<string, unknown> = {}) => {
  const contents = Array.isArray(raw.contents)
    ? (raw.contents as Record<string, unknown>[]).slice(0, 50).map((c) => ({
      id: String(c.id ?? ""),
      quantity: Math.max(1, Math.round(Number(c.quantity) || 1)),
      item_price: num(c.item_price),
      title: c.title ? String(c.title).slice(0, 200) : undefined,
      category: c.category ? String(c.category).slice(0, 100) : undefined,
      delivery_category: "home_delivery",
    })).filter((c) => c.id)
    : undefined;

  const data: Record<string, unknown> = {
    currency: "BRL",
    value: num(raw.value),
    content_type: "product",
    content_ids: Array.isArray(raw.content_ids) ? (raw.content_ids as unknown[]).slice(0, 50).map(String) : undefined,
    content_name: raw.content_name ? String(raw.content_name).slice(0, 500) : undefined,
    content_category: raw.content_category ? String(raw.content_category).slice(0, 200) : undefined,
    contents,
    num_items: raw.num_items !== undefined ? Math.round(Number(raw.num_items)) : undefined,
    payment_type: raw.payment_type ? String(raw.payment_type).slice(0, 50) : undefined,
  };
  for (const k of Object.keys(data)) if (data[k] === undefined) delete data[k];
  return data;
};

interface PedidoItem {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  categoria?: string;
}

const purchaseCustomData = (pedido: Record<string, unknown>) => {
  const items = (Array.isArray(pedido.items) ? pedido.items : []) as PedidoItem[];
  const contents = items.map((i) => ({
    id: String(i.id),
    quantity: Number(i.quantidade) || 1,
    item_price: num(i.preco),
    title: i.nome?.trim(),
    category: i.categoria,
    delivery_category: "home_delivery",
  }));
  const endereco = (pedido.endereco ?? {}) as Record<string, unknown>;
  return {
    currency: "BRL",
    value: num(pedido.total),
    order_id: String(pedido.numero),
    content_type: "product",
    content_ids: contents.map((c) => c.id),
    content_name: contents.map((c) => c.title).filter(Boolean).join(" + "),
    content_category: Array.from(new Set(contents.map((c) => c.category).filter(Boolean))).join(", "),
    contents,
    num_items: contents.reduce((s, c) => s + c.quantity, 0),
    // Custom parameters (usable in custom conversions / breakdowns)
    payment_type: String(pedido.metodo_pagamento ?? ""),
    bairro: String(endereco.bairro ?? "").trim(),
    shipping: num(pedido.taxa_entrega),
  };
};

// ---------- send ----------
const sendToMeta = async (event: Record<string, unknown>) => {
  if (!PIXEL_ID || !CAPI_TOKEN) {
    console.error("META_PIXEL_ID ou META_CAPI_TOKEN não configurados");
    return { ok: false, error: "missing_config" };
  }
  const body: Record<string, unknown> = { data: [event] };
  if (TEST_EVENT_CODE) body.test_event_code = TEST_EVENT_CODE;

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events?access_token=${encodeURIComponent(CAPI_TOKEN)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  const result = await res.json().catch(() => ({}));
  if (!res.ok) console.error(`Meta CAPI ${event.event_name} erro`, JSON.stringify(result));
  else console.log(`Meta CAPI ${event.event_name} ok`, JSON.stringify(result));
  return { ok: res.ok, result };
};

const sendPurchase = async (
  pedidoId: string,
  ctx: { fbp?: string | null; fbc?: string | null; user_agent?: string | null; client_ip?: string | null; event_source_url?: string | null },
  requesterUserId: string | null,
) => {
  const { data: pedido, error } = await admin.from("pedidos").select("*").eq("id", pedidoId).maybeSingle();
  if (error || !pedido) return json({ error: "pedido_nao_encontrado" }, 404);
  if (requesterUserId && pedido.user_id !== requesterUserId) return json({ error: "forbidden" }, 403);
  if (NON_PURCHASE_STATUSES.has(String(pedido.status))) return json({ skipped: pedido.status });

  const profile = await getProfile(pedido.user_id);
  const event = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: pedido.id, // same eventID used by fbq('track','Purchase') in the browser
    action_source: "website",
    event_source_url: ctx.event_source_url || "https://upesfihasartesanais.com.br/pagamento",
    user_data: await buildUserData(profile, ctx),
    custom_data: purchaseCustomData(pedido),
  };
  const sent = await sendToMeta(event);
  return json({ sent: sent.ok });
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const isServiceRole = !!token && token === SERVICE_ROLE_KEY;

    let userId: string | null = null;
    if (token && !isServiceRole && token !== ANON_KEY) {
      const { data } = await admin.auth.getUser(token);
      userId = data.user?.id ?? null;
    }

    const body = await req.json();
    const action = String(body.action ?? "");

    if (action === "purchase_server") {
      if (!isServiceRole) return json({ error: "forbidden" }, 403);
      return await sendPurchase(String(body.pedido_id), body, null);
    }

    if (action === "purchase") {
      if (!userId) return json({ error: "unauthorized" }, 401);
      return await sendPurchase(String(body.pedido_id), { ...body, client_ip: clientIp(req) }, userId);
    }

    if (action === "event") {
      const eventName = String(body.event_name ?? "");
      if (!BROWSER_EVENTS.has(eventName)) return json({ error: "evento_nao_permitido" }, 400);
      const profile = await getProfile(userId);
      const event = {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: String(body.event_id ?? crypto.randomUUID()).slice(0, 100),
        action_source: "website",
        event_source_url: body.event_source_url ? String(body.event_source_url).slice(0, 1000) : undefined,
        user_data: await buildUserData(profile, {
          fbp: body.fbp,
          fbc: body.fbc,
          user_agent: body.user_agent ?? req.headers.get("user-agent"),
          client_ip: clientIp(req),
        }),
        custom_data: sanitizeCustomData(body.custom_data),
      };
      const sent = await sendToMeta(event);
      return json({ sent: sent.ok });
    }

    return json({ error: "acao_invalida" }, 400);
  } catch (err) {
    console.error("meta-capi erro:", err);
    return json({ error: err instanceof Error ? err.message : "erro" }, 500);
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return new Response(JSON.stringify({ error: "Webhook secret not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature header" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const pedidoId = paymentIntent.metadata?.pedido_id;

    if (pedidoId) {
      await supabase
        .from("pedidos")
        .update({ status: "pendente", metodo_pagamento: "card_online" })
        .eq("id", pedidoId);

      console.log(`Pedido ${pedidoId} pagamento confirmado`);

      // Meta Conversions API: server Purchase (deduplicated with the browser Pixel by event_id = pedido id)
      try {
        const md = paymentIntent.metadata ?? {};
        const res = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/meta-capi`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            action: "purchase_server",
            pedido_id: pedidoId,
            fbp: md.meta_fbp || null,
            fbc: md.meta_fbc || null,
            user_agent: md.meta_ua || null,
            client_ip: md.meta_ip || null,
            event_source_url: md.meta_url || null,
          }),
        });
        console.log(`Meta CAPI Purchase pedido ${pedidoId}: ${res.status}`);
      } catch (err) {
        console.error("Meta CAPI Purchase falhou:", err);
      }
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const pedidoId = paymentIntent.metadata?.pedido_id;

    if (pedidoId) {
      await supabase
        .from("pedidos")
        .update({ status: "cancelado" })
        .eq("id", pedidoId);

      console.log(`Pagamento falhou para pedido ${pedidoId}`);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
});

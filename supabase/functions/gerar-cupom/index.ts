import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function gerarCodigo(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'UP-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { telefone } = await req.json();
    if (!telefone) return new Response(JSON.stringify({ error: 'Telefone obrigatório' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if promo segundo_pedido is active
    const { data: promo } = await supabase
      .from('promocoes')
      .select('*')
      .eq('tipo', 'segundo_pedido')
      .eq('ativo', true)
      .maybeSingle();

    if (!promo) return new Response(JSON.stringify({ cupom: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Check if coupon already exists for this phone
    const { data: existing } = await supabase
      .from('cupons_desconto')
      .select('id')
      .eq('telefone', telefone)
      .limit(1);

    if (existing && existing.length > 0) {
      return new Response(JSON.stringify({ cupom: null, message: 'Cupom já gerado' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const codigo = gerarCodigo();
    const expiresAt = promo.validade_dias
      ? new Date(Date.now() + promo.validade_dias * 86400000).toISOString()
      : null;

    const { data: cupom, error } = await supabase
      .from('cupons_desconto')
      .insert({
        codigo,
        telefone,
        desconto_porcentagem: promo.desconto_porcentagem || 10,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ cupom }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

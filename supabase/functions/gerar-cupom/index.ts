import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const authClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = claimsData.claims.sub;

    // Use service role client for data operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get user's phone from profile - only allow generating coupon for own phone
    const { data: profile } = await supabase
      .from('profiles')
      .select('telefone')
      .eq('user_id', userId)
      .single();

    if (!profile?.telefone) {
      return new Response(JSON.stringify({ error: 'Perfil sem telefone cadastrado' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const telefone = profile.telefone;

    // Check if promo segundo_pedido is active
    const { data: promo } = await supabase
      .from('promocoes')
      .select('*')
      .eq('tipo', 'segundo_pedido')
      .eq('ativo', true)
      .maybeSingle();

    if (!promo) return new Response(JSON.stringify({ cupom: null }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Verify user has at least one order before issuing second-order coupon
    const { data: orderCount } = await supabase.rpc('contar_pedidos_por_telefone', { _telefone: telefone });
    if (!orderCount || orderCount < 1) {
      return new Response(JSON.stringify({ cupom: null, message: 'Necessário ter pelo menos 1 pedido' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

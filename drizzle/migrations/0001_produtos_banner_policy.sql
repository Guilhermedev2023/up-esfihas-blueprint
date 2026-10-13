CREATE POLICY "Produtos vinculados a banners ativos sao visiveis"
ON public.produtos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.banner_promocional b
    WHERE b.produto_id = produtos.id
      AND b.ativo = true
  )
);
-- Add RLS policy for admins to view all orders
CREATE POLICY "Admins can view all orders"
  ON public.pedidos 
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Add RLS policy for admins to update order status
CREATE POLICY "Admins can update order status"
  ON public.pedidos
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
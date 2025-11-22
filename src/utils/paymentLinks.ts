// Mapeamento de produtos para links de pagamento da InfinitePay
export const paymentLinks: Record<string, string> = {
  // Esfiha de Carne Unitária
  "Carne": "https://checkout.infinitepay.io/christopher-rubin-623?items=[{\"name\":\"Esfiha+de+Carne\",\"price\":595,\"quantity\":1}]&redirect_url=https://wa.me/5548991506966?text=Seu%20pedido%20j%C3%A1%20esta%20sendo%20preparado%2C%20muito%20obrigado!",
  
  // Combo Carne 10 unidades
  "Combo Carne (10 unidades)": "https://checkout.infinitepay.io/christopher-rubin-623?items=[{\"name\":\"Combo+Carne+(10+unidades)\",\"price\":3499,\"quantity\":1}]&redirect_url=https://wa.me/5548991506966?text=Seu%20pedido%20j%C3%A1%20esta%20sendo%20preparado%2C%20muito%20obrigado!",
};

// URL do WhatsApp para pagamento na entrega
export const whatsappUrl = "https://wa.me/5548991506966?text=Seu%20pedido%20j%C3%A1%20esta%20sendo%20preparado%2C%20muito%20obrigado!";

// Função para obter o link de pagamento de um produto
export const getPaymentLink = (productName: string): string | null => {
  return paymentLinks[productName] || null;
};

import { CartItem } from '@/contexts/CartContext';

interface OrderDetails {
  nome: string;
  telefone: string;
  endereco: string;
  bairro: string;
  items: CartItem[];
  total: number;
  metodoPagamento: 'pix' | 'entrega';
}

export const generateWhatsAppMessage = (order: OrderDetails): string => {
  const itemsList = order.items
    .map(item => `${item.quantidade}x ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2)}`)
    .join('\n');

  if (order.metodoPagamento === 'pix') {
    return `Olá, acabei de fazer meu pedido pelo site e pagar no PIX. Segue o comprovante!

Nome: ${order.nome}
Telefone: ${order.telefone}
Endereço: ${order.endereco}
Bairro: ${order.bairro}

Pedido:
${itemsList}

Total: R$ ${order.total.toFixed(2)}`;
  } else {
    return `Olá, acabei de fazer meu pedido pelo site!

Nome: ${order.nome}
Telefone: ${order.telefone}
Endereço: ${order.endereco}
Bairro: ${order.bairro}

Pedido:
${itemsList}

Total: R$ ${order.total.toFixed(2)}
Forma de pagamento: Na entrega (cartão ou dinheiro)`;
  }
};

export const sendToWhatsApp = (message: string) => {
  const whatsappNumber = '5548991506966';
  const encodedMessage = encodeURIComponent(message);
  window.location.href = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
};

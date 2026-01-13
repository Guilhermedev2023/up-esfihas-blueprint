import { CartItem } from '@/contexts/CartContext';

interface OrderAddress {
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
}

interface OrderDetails {
  nome: string;
  telefone: string;
  endereco: OrderAddress;
  items: CartItem[];
  subtotal: number;
  taxaEntrega: number;
  total: number;
  metodoPagamento: 'pix' | 'entrega';
  observacoes?: string;
}

export const generateWhatsAppMessage = (order: OrderDetails): string => {
  const itemsList = order.items
    .map(item => `${item.quantidade}x ${item.nome} - R$ ${(item.preco * item.quantidade).toFixed(2)}`)
    .join('\n');

  const enderecoCompleto = order.endereco.complemento 
    ? `${order.endereco.rua}, ${order.endereco.numero}, ${order.endereco.complemento}`
    : `${order.endereco.rua}, ${order.endereco.numero}`;

  const observacoesText = order.observacoes ? `\n\nObservações: ${order.observacoes}` : '';

  if (order.metodoPagamento === 'pix') {
    return `Olá, acabei de fazer meu pedido pelo site e pagar no PIX. Segue o comprovante!

Nome: ${order.nome}
Telefone: ${order.telefone}

📍 Endereço de entrega:
${enderecoCompleto}
Bairro: ${order.endereco.bairro}

🛒 Pedido:
${itemsList}

Subtotal: R$ ${order.subtotal.toFixed(2)}
Taxa de entrega: R$ ${order.taxaEntrega.toFixed(2)}
💰 Total: R$ ${order.total.toFixed(2)}${observacoesText}`;
  } else {
    return `Olá, acabei de fazer meu pedido pelo site!

Nome: ${order.nome}
Telefone: ${order.telefone}

📍 Endereço de entrega:
${enderecoCompleto}
Bairro: ${order.endereco.bairro}

🛒 Pedido:
${itemsList}

Subtotal: R$ ${order.subtotal.toFixed(2)}
Taxa de entrega: R$ ${order.taxaEntrega.toFixed(2)}
💰 Total: R$ ${order.total.toFixed(2)}

💳 Forma de pagamento: Na entrega (cartão ou dinheiro)${observacoesText}`;
  }
};

export const sendToWhatsApp = (message: string) => {
  const whatsappNumber = '5548991506966';
  const encodedMessage = encodeURIComponent(message);
  window.location.href = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
};

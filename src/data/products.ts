export interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
  categoria: string;
}

export const products: Product[] = [
  // Esfihas Unitárias
  {
    id: "carne-unit",
    nome: "Carne",
    descricao: "Massa artesanal recheada com carne temperada e ingredientes selecionados",
    preco: 5.95,
    imagem: "/images/esfiha-carne.png",
    categoria: "Unitárias"
  },
  {
    id: "queijo-unit",
    nome: "Queijo",
    descricao: "Massa artesanal com muito queijo derretido",
    preco: 4.99,
    imagem: "/images/esfiha-queijo.png",
    categoria: "Unitárias"
  },
  {
    id: "strogonoff-unit",
    nome: "Strogonoff de Frango",
    descricao: "Delicioso strogonoff de frango cremoso",
    preco: 7.49,
    imagem: "/images/esfiha-strogonoff.png",
    categoria: "Unitárias"
  },
  {
    id: "bacon-unit",
    nome: "Bacon com Catupiry",
    descricao: "Bacon crocante com catupiry cremoso",
    preco: 7.49,
    imagem: "/images/esfiha-bacon.png",
    categoria: "Unitárias"
  },
  {
    id: "vegetariana-unit",
    nome: "Vegetariana",
    descricao: "Mix de vegetais frescos e temperados",
    preco: 4.95,
    imagem: "/images/esfiha-queijo.png",
    categoria: "Unitárias"
  },
  {
    id: "chocolate-unit",
    nome: "Chocolate Branco",
    descricao: "Massa doce com recheio de chocolate branco",
    preco: 5.95,
    imagem: "/images/esfiha-queijo.png",
    categoria: "Unitárias"
  },
  {
    id: "nutella-unit",
    nome: "Creme de Avelã",
    descricao: "Recheio cremoso de avelã irresistível",
    preco: 5.95,
    imagem: "/images/esfiha-strogonoff.png",
    categoria: "Unitárias"
  },

  // Combos
  {
    id: "combo5-carne",
    nome: "Combo Carne (5 unidades)",
    descricao: "5 esfihas de carne selecionada",
    preco: 17.50,
    imagem: "/images/esfiha-carne.png",
    categoria: "Combos"
  },
  {
    id: "combo5-queijo",
    nome: "Combo Queijo (5 unidades)",
    descricao: "5 esfihas de queijo derretido",
    preco: 15.99,
    imagem: "/images/esfiha-queijo.png",
    categoria: "Combos"
  },
  {
    id: "combo5-strogonoff",
    nome: "Combo Strogonoff (5 unidades)",
    descricao: "5 esfihas de strogonoff de frango",
    preco: 19.99,
    imagem: "/images/esfiha-strogonoff.png",
    categoria: "Combos"
  },
  {
    id: "combo5-bacon",
    nome: "Combo Bacon (5 unidades)",
    descricao: "5 esfihas de bacon com catupiry",
    preco: 19.99,
    imagem: "/images/esfiha-bacon.png",
    categoria: "Combos"
  },
  {
    id: "combo10-carne",
    nome: "Combo Carne (10 unidades)",
    descricao: "10 esfihas de carne selecionada",
    preco: 34.99,
    imagem: "/images/esfiha-carne.png",
    categoria: "Combos"
  },
  {
    id: "combo10-queijo",
    nome: "Combo Queijo (10 unidades)",
    descricao: "10 esfihas de queijo derretido",
    preco: 31.99,
    imagem: "/images/esfiha-queijo.png",
    categoria: "Combos"
  },
  {
    id: "combo10-strogonoff",
    nome: "Combo Strogonoff (10 unidades)",
    descricao: "10 esfihas de strogonoff de frango",
    preco: 39.99,
    imagem: "/images/esfiha-strogonoff.png",
    categoria: "Combos"
  },
  {
    id: "combo10-bacon",
    nome: "Combo Bacon (10 unidades)",
    descricao: "10 esfihas de bacon com catupiry",
    preco: 39.99,
    imagem: "/images/esfiha-bacon.png",
    categoria: "Combos"
  },

  // Bebidas
  {
    id: "bebida-coca-lata",
    nome: "Coca-Cola Lata 350ml",
    descricao: "Refrigerante Coca-Cola lata gelada",
    preco: 5.00,
    imagem: "/images/coca-lata.webp",
    categoria: "Bebidas"
  },
  {
    id: "bebida-coca-600",
    nome: "Coca-Cola 600ml",
    descricao: "Refrigerante Coca-Cola garrafa 600ml",
    preco: 8.00,
    imagem: "/images/coca-600ml.webp",
    categoria: "Bebidas"
  },
  {
    id: "bebida-guarana",
    nome: "Guaraná Antarctica Lata 350ml",
    descricao: "Refrigerante Guaraná Antarctica lata gelada",
    preco: 5.00,
    imagem: "/images/guarana-lata.webp",
    categoria: "Bebidas"
  },
  {
    id: "bebida-agua-sem-gas",
    nome: "Água Mineral Sem Gás 500ml",
    descricao: "Água mineral sem gás",
    preco: 3.00,
    imagem: "/images/agua-sem-gas.jpg",
    categoria: "Bebidas"
  },
  {
    id: "bebida-agua-com-gas",
    nome: "Água Mineral Com Gás 500ml",
    descricao: "Água mineral com gás",
    preco: 3.50,
    imagem: "/images/agua-sem-gas.jpg",
    categoria: "Bebidas"
  },
];

export const categories = [
  "Unitárias",
  "Combos",
  "Bebidas"
];

export const categoryImages: Record<string, string> = {
  "Unitárias": "/images/esfiha-carne.png",
  "Combos": "/images/esfiha-bacon.png",
  "Bebidas": "/images/coca-lata.webp",
  "Todas": "/images/esfiha-strogonoff.png"
};

export interface Product {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  imagem: string;
  categoria: string;
}

export const products: Product[] = [
  // Esfihas Unitárias Salgadas
  {
    id: "carne-unit",
    nome: "Carne",
    descricao: "Massa artesanal recheada com carne temperada e ingredientes selecionados",
    preco: 5.95,
    imagem: "/images/carne.jpg",
    categoria: "Unitárias"
  },
  {
    id: "queijo-unit",
    nome: "Queijo",
    descricao: "Massa artesanal com muito queijo derretido",
    preco: 4.99,
    imagem: "/images/queijo.jpg",
    categoria: "Unitárias"
  },
  {
    id: "strogonoff-unit",
    nome: "Strogonoff de Frango",
    descricao: "Delicioso strogonoff de frango cremoso",
    preco: 7.49,
    imagem: "/images/strogonoff.jpg",
    categoria: "Unitárias"
  },
  {
    id: "bacon-unit",
    nome: "Bacon com Catupiry",
    descricao: "Bacon crocante com catupiry cremoso",
    preco: 7.49,
    imagem: "/images/bacon.jpg",
    categoria: "Unitárias"
  },
  {
    id: "vegetariana-unit",
    nome: "Vegetariana",
    descricao: "Mix de vegetais frescos e temperados",
    preco: 4.95,
    imagem: "/images/vegetariana-5.jpg",
    categoria: "Unitárias"
  },

  // Combos 5 Unidades
  {
    id: "combo5-carne",
    nome: "Combo Carne (5 unidades)",
    descricao: "5 esfihas de carne selecionada",
    preco: 17.50,
    imagem: "/images/carne.jpg",
    categoria: "Combos 5un"
  },
  {
    id: "combo5-queijo",
    nome: "Combo Queijo (5 unidades)",
    descricao: "5 esfihas de queijo derretido",
    preco: 15.99,
    imagem: "/images/queijo.jpg",
    categoria: "Combos 5un"
  },
  {
    id: "combo5-strogonoff",
    nome: "Combo Strogonoff (5 unidades)",
    descricao: "5 esfihas de strogonoff de frango",
    preco: 19.99,
    imagem: "/images/strogonoff.jpg",
    categoria: "Combos 5un"
  },
  {
    id: "combo5-bacon",
    nome: "Combo Bacon (5 unidades)",
    descricao: "5 esfihas de bacon com catupiry",
    preco: 19.99,
    imagem: "/images/bacon.jpg",
    categoria: "Combos 5un"
  },
  {
    id: "combo5-vegetariana",
    nome: "Combo Vegetariana (5 unidades)",
    descricao: "5 esfihas vegetarianas com mix de vegetais frescos",
    preco: 16.99,
    imagem: "/images/vegetariana-5.jpg",
    categoria: "Combos 5un"
  },

  // Combos 10 Unidades
  {
    id: "combo10-carne",
    nome: "Combo Carne (10 unidades)",
    descricao: "10 esfihas de carne selecionada",
    preco: 34.99,
    imagem: "/images/carne.jpg",
    categoria: "Combos 10un"
  },
  {
    id: "combo10-queijo",
    nome: "Combo Queijo (10 unidades)",
    descricao: "10 esfihas de queijo derretido",
    preco: 31.99,
    imagem: "/images/queijo.jpg",
    categoria: "Combos 10un"
  },
  {
    id: "combo10-strogonoff",
    nome: "Combo Strogonoff (10 unidades)",
    descricao: "10 esfihas de strogonoff de frango",
    preco: 39.99,
    imagem: "/images/strogonoff.jpg",
    categoria: "Combos 10un"
  },
  {
    id: "combo10-bacon",
    nome: "Combo Bacon (10 unidades)",
    descricao: "10 esfihas de bacon com catupiry",
    preco: 39.99,
    imagem: "/images/bacon.jpg",
    categoria: "Combos 10un"
  },
  {
    id: "combo10-vegetariana",
    nome: "Combo Vegetariana (10 unidades)",
    descricao: "10 esfihas vegetarianas com mix de vegetais frescos",
    preco: 32.99,
    imagem: "/images/vegetariana-10.jpg",
    categoria: "Combos 10un"
  },
  {
    id: "combo-especial",
    nome: "Combo Especial (5 Carne e 5 Queijo)",
    descricao: "Mix perfeito com 5 esfihas de carne e 5 de queijo",
    preco: 33.99,
    imagem: "/images/combo-especial.jpg",
    categoria: "Combos 10un"
  },

  // Esfihas Doces Unitárias
  {
    id: "chocolate-branco-unit",
    nome: "Chocolate Branco com Confete",
    descricao: "Massa doce com recheio de chocolate branco e confetes coloridos",
    preco: 5.95,
    imagem: "/images/chocolate-branco-5.jpg",
    categoria: "Doces Unitárias"
  },
  {
    id: "chocolate-meio-amargo-unit",
    nome: "Chocolate Meio Amargo",
    descricao: "Massa doce com recheio de chocolate meio amargo",
    preco: 5.95,
    imagem: "/images/chocolate-meio-amargo.jpg",
    categoria: "Doces Unitárias"
  },

  // Esfihas Doces Combos
  {
    id: "combo5-chocolate-branco",
    nome: "Combo Chocolate Branco com Confete (5 unidades)",
    descricao: "5 esfihas doces de chocolate branco com confetes coloridos",
    preco: 24.99,
    imagem: "/images/chocolate-branco-5.jpg",
    categoria: "Doces Combos"
  },
  {
    id: "combo10-chocolate-branco",
    nome: "Combo Chocolate Branco com Confete (10 unidades)",
    descricao: "10 esfihas doces de chocolate branco com confetes coloridos",
    preco: 47.99,
    imagem: "/images/chocolate-branco-10.jpg",
    categoria: "Doces Combos"
  },
  {
    id: "combo10-chocolate-meio-amargo",
    nome: "Combo Chocolate Meio Amargo (10 unidades)",
    descricao: "10 esfihas doces de chocolate meio amargo",
    preco: 47.99,
    imagem: "/images/chocolate-meio-amargo.jpg",
    categoria: "Doces Combos"
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
  "Combos 5un",
  "Combos 10un",
  "Doces Unitárias",
  "Doces Combos",
  "Bebidas"
];

export const categoryBanners: Record<string, string> = {
  "Unitárias": "Esfihas Unitárias",
  "Combos 5un": "Combos (5 Unidades)",
  "Combos 10un": "Combos (10 Unidades)",
  "Doces Unitárias": "Esfihas Doces Unitárias",
  "Doces Combos": "Esfihas Doces Combos",
  "Bebidas": "Bebidas"
};

export const categoryImages: Record<string, string> = {
  "Unitárias": "/images/carne.jpg",
  "Combos 5un": "/images/vegetariana-5.jpg",
  "Combos 10un": "/images/combo-especial.jpg",
  "Doces Unitárias": "/images/chocolate-branco-5.jpg",
  "Doces Combos": "/images/chocolate-branco-10.jpg",
  "Bebidas": "/images/coca-lata.webp",
  "Todas": "/images/strogonoff.jpg"
};

// Images for hero slider
export const heroImages = [
  "/images/carne.jpg",
  "/images/queijo.jpg",
  "/images/strogonoff.jpg",
  "/images/bacon.jpg",
  "/images/combo-especial.jpg",
  "/images/chocolate-branco-5.jpg"
];

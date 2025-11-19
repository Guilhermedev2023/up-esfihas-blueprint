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
    categoria: "Esfihas Salgadas"
  },
  {
    id: "queijo-unit",
    nome: "Queijo",
    descricao: "Massa artesanal com muito queijo derretido",
    preco: 4.99,
    imagem: "/images/queijo.jpg",
    categoria: "Esfihas Salgadas"
  },
  {
    id: "strogonoff-unit",
    nome: "Strogonoff de Frango",
    descricao: "Delicioso strogonoff de frango cremoso",
    preco: 7.49,
    imagem: "/images/strogonoff.jpg",
    categoria: "Esfihas Salgadas"
  },
  {
    id: "bacon-unit",
    nome: "Bacon com Catupiry",
    descricao: "Bacon crocante com catupiry cremoso",
    preco: 7.49,
    imagem: "/images/bacon.jpg",
    categoria: "Esfihas Salgadas"
  },
  {
    id: "vegetariana-unit",
    nome: "Vegetariana",
    descricao: "Mix de vegetais frescos e temperados",
    preco: 4.95,
    imagem: "/images/vegetariana.jpg",
    categoria: "Esfihas Salgadas"
  },

  // Esfihas Doces
  {
    id: "chocolate-unit",
    nome: "Chocolate Branco",
    descricao: "Massa doce com recheio de chocolate branco",
    preco: 5.95,
    imagem: "/images/chocolate-branco.jpg",
    categoria: "Esfihas Doces"
  },
  {
    id: "nutella-unit",
    nome: "Creme de Avelã",
    descricao: "Recheio cremoso de avelã irresistível",
    preco: 5.95,
    imagem: "/images/nutella.jpg",
    categoria: "Esfihas Doces"
  },

  // Combos 5 Esfihas
  {
    id: "combo5-carne",
    nome: "Combo Carne (5 unidades)",
    descricao: "5 esfihas de carne selecionada",
    preco: 17.50,
    imagem: "/images/carne.jpg",
    categoria: "Combos 5 Esfihas"
  },
  {
    id: "combo5-queijo",
    nome: "Combo Queijo (5 unidades)",
    descricao: "5 esfihas de queijo derretido",
    preco: 15.99,
    imagem: "/images/queijo.jpg",
    categoria: "Combos 5 Esfihas"
  },
  {
    id: "combo5-strogonoff",
    nome: "Combo Strogonoff (5 unidades)",
    descricao: "5 esfihas de strogonoff de frango",
    preco: 19.99,
    imagem: "/images/strogonoff.jpg",
    categoria: "Combos 5 Esfihas"
  },
  {
    id: "combo5-bacon",
    nome: "Combo Bacon (5 unidades)",
    descricao: "5 esfihas de bacon com catupiry",
    preco: 19.99,
    imagem: "/images/bacon.jpg",
    categoria: "Combos 5 Esfihas"
  },
  {
    id: "combo5-vegetariana",
    nome: "Combo Vegetariana (5 unidades)",
    descricao: "5 esfihas vegetarianas",
    preco: 15.99,
    imagem: "/images/vegetariana.jpg",
    categoria: "Combos 5 Esfihas"
  },

  // Combos 10 Esfihas
  {
    id: "combo10-carne",
    nome: "Combo Carne (10 unidades)",
    descricao: "10 esfihas de carne selecionada",
    preco: 34.99,
    imagem: "/images/carne.jpg",
    categoria: "Combos 10 Esfihas"
  },
  {
    id: "combo10-queijo",
    nome: "Combo Queijo (10 unidades)",
    descricao: "10 esfihas de queijo derretido",
    preco: 31.99,
    imagem: "/images/queijo.jpg",
    categoria: "Combos 10 Esfihas"
  },
  {
    id: "combo10-strogonoff",
    nome: "Combo Strogonoff (10 unidades)",
    descricao: "10 esfihas de strogonoff de frango",
    preco: 39.99,
    imagem: "/images/strogonoff.jpg",
    categoria: "Combos 10 Esfihas"
  },
  {
    id: "combo10-bacon",
    nome: "Combo Bacon (10 unidades)",
    descricao: "10 esfihas de bacon com catupiry",
    preco: 39.99,
    imagem: "/images/bacon.jpg",
    categoria: "Combos 10 Esfihas"
  },
  {
    id: "combo10-vegetariana",
    nome: "Combo Vegetariana (10 unidades)",
    descricao: "10 esfihas vegetarianas",
    preco: 31.99,
    imagem: "/images/vegetariana.jpg",
    categoria: "Combos 10 Esfihas"
  },
];

export const categories = [
  "Esfihas Salgadas",
  "Esfihas Doces",
  "Combos 5 Esfihas",
  "Combos 10 Esfihas"
];


export interface ShopItem {
  name: string;
  price: number;
  icon?: React.ElementType; // Opcional: para ícones no futuro
}

export interface ShopCategory {
  name: string;
  items: ShopItem[];
}

export const itemPrices: Record<string, number> = {
  "espada": 80, "machado": 85, "adaga": 60, "lança": 75, "arco": 90, "cajado": 100, "katana": 120, "tridente": 110, "foice": 130, "alabarda": 140,
  "escudo": 60, "capa": 50, "couraça": 95, "elmo": 70, "botas": 40, "luvas": 30, "armadura leve": 100, "armadura pesada": 140, "escama": 85, "manto": 60,
  "anel mágico": 200, "colar de mana": 190, "livro antigo": 180, "orbe de fogo": 210, "gema azul": 160, "runas": 170, "poção de invisibilidade": 220, "tomo arcano": 230, "cristal sagrado": 250, "talismã": 240,
  "poção de vida": 30, "poção de energia": 35, "ração": 20, "tocha": 10, "corda": 15, "kit de primeiros socorros": 50, "água encantada": 45, "flechas": 25, "óleo de arma": 40, "bálsamo": 30,
  "grifo de guerra": 1000, "cavalo de elite": 900, "capa da sombra": 850, "espada flamejante": 1200, "armadura celestial": 1500, "chave dourada": 750, "relíquia dos antigos": 1300, "elmo do trovão": 1100, "martelo divino": 1400, "asa etérea": 2000
};

export const shopCategoriesData: ShopCategory[] = [
  {
    name: "Armas",
    items: ['espada', 'machado', 'adaga', 'lança', 'arco', 'cajado', 'katana', 'tridente', 'foice', 'alabarda'].map(name => ({ name, price: itemPrices[name] }))
  },
  {
    name: "Armaduras",
    items: ['escudo', 'capa', 'couraça', 'elmo', 'botas', 'luvas', 'armadura leve', 'armadura pesada', 'escama', 'manto'].map(name => ({ name, price: itemPrices[name] }))
  },
  {
    name: "Itens Mágicos",
    items: ['anel mágico', 'colar de mana', 'livro antigo', 'orbe de fogo', 'gema azul', 'runas', 'poção de invisibilidade', 'tomo arcano', 'cristal sagrado', 'talismã'].map(name => ({ name, price: itemPrices[name] }))
  },
  {
    name: "Suprimentos",
    items: ['poção de vida', 'poção de energia', 'ração', 'tocha', 'corda', 'kit de primeiros socorros', 'água encantada', 'flechas', 'óleo de arma', 'bálsamo'].map(name => ({ name, price: itemPrices[name] }))
  },
  {
    name: "Raros/Caros",
    items: ['grifo de guerra', 'cavalo de elite', 'capa da sombra', 'espada flamejante', 'armadura celestial', 'chave dourada', 'relíquia dos antigos', 'elmo do trovão', 'martelo divino', 'asa etérea'].map(name => ({ name, price: itemPrices[name] }))
  }
];

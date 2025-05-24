
import type { LucideIcon } from 'lucide-react';
import {
  Sword, Axe, PocketKnife, Crosshair, Wand2, Shield, Shirt,
  HardHat, Footprints, Hand, Layers, Diamond, Target,
  BookOpen, Flame, Gem, Sigma, EyeOff, BookMarked, Medal,
  HeartPulse, BatteryCharging, Beef, IterationCw, BriefcaseMedical, GlassWater, ArrowRight, PaintBucket, Vegan,
  Bird, CloudDrizzle, KeyRound, Scroll, Hammer, Feather, Box, PawPrint
} from 'lucide-react';

export interface ShopItem {
  name: string;
  price: number;
  icon: LucideIcon;
}

export interface ShopCategory {
  name: string;
  items: ShopItem[];
}

// Mapeamento de nomes de itens para seus ícones e preços
const itemDetails: Record<string, { price: number; icon: LucideIcon }> = {
  // Armas
  "espada": { price: 80, icon: Sword },
  "machado": { price: 85, icon: Axe },
  "adaga": { price: 60, icon: PocketKnife },
  "lança": { price: 75, icon: Crosshair }, // Melhorado
  "arco": { price: 90, icon: Target },
  "cajado": { price: 100, icon: Wand2 },
  "katana": { price: 120, icon: Sword },
  "tridente": { price: 110, icon: Crosshair }, // Melhorado
  "foice": { price: 130, icon: Axe },       // Melhorado
  "alabarda": { price: 140, icon: Axe },    // Melhorado

  // Armaduras
  "escudo": { price: 60, icon: Shield },
  "capa": { price: 50, icon: Shirt },
  "couraça": { price: 95, icon: Shield },
  "elmo": { price: 70, icon: HardHat },
  "botas": { price: 40, icon: Footprints },
  "luvas": { price: 30, icon: Hand },
  "armadura leve": { price: 100, icon: Shirt },
  "armadura pesada": { price: 140, icon: Shield },
  "escama": { price: 85, icon: Layers },
  "manto": { price: 60, icon: Shirt },

  // Itens Mágicos
  "anel mágico": { price: 200, icon: Gem },
  "colar de mana": { price: 190, icon: Gem }, // Melhorado
  "livro antigo": { price: 180, icon: BookOpen },
  "orbe de fogo": { price: 210, icon: Flame },
  "gema azul": { price: 160, icon: Gem },
  "runas": { price: 170, icon: Sigma },
  "poção de invisibilidade": { price: 220, icon: EyeOff },
  "tomo arcano": { price: 230, icon: BookMarked },
  "cristal sagrado": { price: 250, icon: Diamond },
  "talismã": { price: 240, icon: Medal },

  // Suprimentos
  "poção de vida": { price: 30, icon: HeartPulse },
  "poção de energia": { price: 35, icon: BatteryCharging },
  "ração": { price: 20, icon: Beef },
  "tocha": { price: 10, icon: Flame },
  "corda": { price: 15, icon: IterationCw },
  "kit de primeiros socorros": { price: 50, icon: BriefcaseMedical },
  "água encantada": { price: 45, icon: GlassWater },
  "flechas": { price: 25, icon: ArrowRight },
  "óleo de arma": { price: 40, icon: PaintBucket },
  "bálsamo": { price: 30, icon: Vegan },

  // Raros/Caros
  "grifo de guerra": { price: 1000, icon: Bird },
  "cavalo de elite": { price: 900, icon: PawPrint }, // Melhorado
  "capa da sombra": { price: 850, icon: CloudDrizzle },
  "espada flamejante": { price: 1200, icon: Sword },    // Melhorado
  "armadura celestial": { price: 1500, icon: Shield },  // Melhorado
  "chave dourada": { price: 750, icon: KeyRound },
  "relíquia dos antigos": { price: 1300, icon: Scroll },
  "elmo do trovão": { price: 1100, icon: HardHat }, // Melhorado
  "martelo divino": { price: 1400, icon: Hammer },
  "asa etérea": { price: 2000, icon: Feather },
};

// Helper para criar um ShopItem a partir do nome
const createShopItem = (name: string): ShopItem => {
  const detail = itemDetails[name];
  if (!detail) {
    console.warn(`Detalhes não encontrados para o item: ${name}. Usando ícone padrão.`);
    return { name, price: 0, icon: Box }; // Fallback para item não encontrado
  }
  return { name, price: detail.price, icon: detail.icon };
};

export const shopCategoriesData: ShopCategory[] = [
  {
    name: "Armas",
    items: ['espada', 'machado', 'adaga', 'lança', 'arco', 'cajado', 'katana', 'tridente', 'foice', 'alabarda'].map(createShopItem)
  },
  {
    name: "Armaduras",
    items: ['escudo', 'capa', 'couraça', 'elmo', 'botas', 'luvas', 'armadura leve', 'armadura pesada', 'escama', 'manto'].map(createShopItem)
  },
  {
    name: "Itens Mágicos",
    items: ['anel mágico', 'colar de mana', 'livro antigo', 'orbe de fogo', 'gema azul', 'runas', 'poção de invisibilidade', 'tomo arcano', 'cristal sagrado', 'talismã'].map(createShopItem)
  },
  {
    name: "Suprimentos",
    items: ['poção de vida', 'poção de energia', 'ração', 'tocha', 'corda', 'kit de primeiros socorros', 'água encantada', 'flechas', 'óleo de arma', 'bálsamo'].map(createShopItem)
  },
  {
    name: "Raros/Caros",
    items: ['grifo de guerra', 'cavalo de elite', 'capa da sombra', 'espada flamejante', 'armadura celestial', 'chave dourada', 'relíquia dos antigos', 'elmo do trovão', 'martelo divino', 'asa etérea'].map(createShopItem)
  }
];

// Exportar itemPrices para manter compatibilidade se shopActions o usar diretamente
export const itemPrices: Record<string, number> = Object.fromEntries(
  Object.entries(itemDetails).map(([name, { price }]) => [name, price])
);


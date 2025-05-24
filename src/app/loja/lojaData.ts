
import type { LucideIcon } from 'lucide-react';
import {
  Sword, Axe, PocketKnife, Crosshair, Wand2, Shield, Shirt, VenetianMask,
  HardHat, Footprints, Hand, Layers, CircleDollarSign, Diamond, Target, Fish, // Added Fish here
  BookOpen, Flame, Gem, Sigma, EyeOff, BookMarked, Medal, HelpCircle,
  HeartPulse, BatteryCharging, Beef, IterationCw, BriefcaseMedical, GlassWater, ArrowRight, PaintBucket, Vegan,
  Bird, Option, CloudDrizzle, KeyRound, Scroll, Hammer, Feather, Box, Zap, Sparkles, Package, ShoppingBasket, Tent,
  Grape, Apple, Carrot, Utensils, Lollipop, Shell, PawPrint, Anchor, Bone, Wheat, Leaf, Sprout, Sun, Moon, Wind, Snowflake, Map, Telescope, Microscope, FlaskConical, Beaker, TestTube2, Brain, Speech, Users, Building, Castle, MountainSnow, Palmtree, Ship, Plane, Rocket, Car, TrainTrack, TramFront, Bus, Bicycle, Construction, Drama, DraftingCompass, Scale, Coins, Percent, BadgeHelp, BadgeInfo, BadgePercent, BadgePlus, BadgeMinus, Handshake, ShieldAlert, ShieldCheck, ShieldOff, ShieldQuestion, GanttChartSquare, CookingPot
} from 'lucide-react';

export interface ShopItem {
  name: string;
  price: number;
  icon: LucideIcon;
  color?: string; // Optional color for the icon
}

export interface ShopCategory {
  name: string;
  items: ShopItem[];
}

// Helper to create item details for PlayerStatsCard and Shop
const createItemDetail = (name: string, price: number, icon: LucideIcon, color?: string) => ({ name, price, icon, color });

export const itemDetails: Record<string, { icon: LucideIcon, price: number, color?: string }> = {
  // Armas
  'espada curta': { icon: Sword, price: 50, color: 'text-gray-400' },
  'machado de lenhador': { icon: Axe, price: 70, color: 'text-yellow-700' },
  'adaga': { icon: PocketKnife, price: 30, color: 'text-gray-500' },
  'arco curto': { icon: Crosshair, price: 60, color: 'text-lime-600' },
  'cajado simples': { icon: Wand2, price: 40, color: 'text-purple-500' },
  'lança': { icon: Crosshair, price: 80, color: 'text-amber-600' }, // Using Crosshair as a spear-like
  'tridente': { icon: Crosshair, price: 120, color: 'text-cyan-500' }, // Using Crosshair as a trident-like
  'foice': { icon: Axe, price: 90, color: 'text-neutral-500' },
  'alabarda': { icon: Axe, price: 150, color: 'text-red-700' },
  'espada longa': { icon: Sword, price: 100, color: 'text-gray-300' },
  'machado de batalha': { icon: Axe, price: 130, color: 'text-orange-700' },
  'besta leve': { icon: Target, price: 110, color: 'text-green-700' },
  'varinha mágica': { icon: Wand2, price: 90, color: 'text-pink-500' },
  'espada flamejante': { icon: Sword, price: 250, color: 'text-red-500' },
  // Armaduras
  'escudo de madeira': { icon: Shield, price: 40, color: 'text-yellow-600' },
  'roupas de viajante': { icon: Shirt, price: 20, color: 'text-green-600' },
  'máscara simples': { icon: VenetianMask, price: 15, color: 'text-gray-400' },
  'elmo de couro': { icon: HardHat, price: 30, color: 'text-yellow-700' },
  'botas de caminhada': { icon: Footprints, price: 25, color: 'text-orange-500' },
  'luvas de trabalho': { icon: Hand, price: 10, color: 'text-yellow-800' },
  'armadura de couro': { icon: Layers, price: 80, color: 'text-amber-700' },
  'escudo de ferro': { icon: Shield, price: 90, color: 'text-gray-400' },
  'elmo de ferro': { icon: HardHat, price: 70, color: 'text-gray-500' },
  'grevas de aço': { icon: Footprints, price: 60, color: 'text-neutral-400' }, // Using Footprints as Greaves
  'peitoral de placas': { icon: Shirt, price: 200, color: 'text-slate-400' }, // Using Shirt as a placeholder
  'manto sombrio': { icon: VenetianMask, price: 120, color: 'text-indigo-700' }, // Using VenetianMask
  // Acessórios
  'amuleto da sorte': { icon: Diamond, price: 50, color: 'text-green-400' },
  'anel mágico': { icon: Gem, price: 70, color: 'text-blue-400' }, // Changed from Ring
  'cinto de utilidades': { icon: Layers, price: 30, color: 'text-yellow-700' },
  'colar de mana': { icon: Gem, price: 60, color: 'text-purple-400' },
  'brincos de agilidade': { icon: Feather, price: 40, color: 'text-sky-400' },
  // Ferramentas
  'kit de primeiros socorros': { icon: BriefcaseMedical, price: 25, color: 'text-red-500' },
  'tocha': { icon: Flame, price: 5, color: 'text-orange-500' }, // Changed from Torch
  'corda (10m)': { icon: IterationCw, price: 10, color: 'text-yellow-700' }, // IterationCw for rope
  'mapa da região': { icon: Map, price: 15, color: 'text-lime-700' },
  'luneta': { icon: Telescope, price: 40, color: 'text-blue-600' },
  'kit de escalada': { icon: MountainSnow, price: 50, color: 'text-gray-500' },
  'vara de pescar': { icon: Anchor, price: 20, color: 'text-cyan-600' }, // Using Anchor
  'picareta': { icon: Construction, price: 30, color: 'text-orange-600' },
  'pá': { icon: Construction, price: 25, color: 'text-yellow-600' },
  // Consumíveis
  'poção de cura': { icon: BriefcaseMedical, price: 30, color: 'text-red-400' }, // Re-using for potion
  'poção de mana': { icon: GlassWater, price: 30, color: 'text-blue-400' }, // Using GlassWater
  'antídoto': { icon: BriefcaseMedical, price: 20, color: 'text-green-400' }, // Re-using
  'ração de viagem': { icon: Beef, price: 10, color: 'text-yellow-800' },
  'elixir de força': { icon: Zap, price: 50, color: 'text-orange-400' },
  'bomba de fumaça': { icon: CloudDrizzle, price: 15, color: 'text-gray-500' },
  // Itens Mágicos e Raros
  'orbe do poder': { icon: Gem, price: 500, color: 'text-purple-600' },
  'pergaminho de teleporte': { icon: Scroll, price: 100, color: 'text-blue-500' },
  'pena de fênix': { icon: Feather, price: 300, color: 'text-orange-400' },
  'chave mestra': { icon: KeyRound, price: 150, color: 'text-yellow-500' },
  'gema da alma': { icon: Diamond, price: 1000, color: 'text-red-600' },
  // Outros
  'tenda': { icon: Tent, price: 50, color: 'text-green-700' },
  'saco de dormir': { icon: Package, price: 20, color: 'text-lime-800' }, // Using Package
  'mochila grande': { icon: ShoppingBasket, price: 40, color: 'text-yellow-700' },
  'fogo de artifício': { icon: Sparkles, price: 5, color: 'text-red-500' },
  'presente misterioso': { icon: Package, price: 100, color: 'text-purple-500' },
  'mapa do tesouro': { icon: Scroll, price: 75, color: 'text-amber-600' },
  // Comidas (para expandir consumíveis)
  'maçã': { icon: Apple, price: 5, color: 'text-red-500' },
  'pão': { icon: Beef, price: 7, color: 'text-yellow-700' }, // Placeholder
  'queijo': { icon: Sigma, price: 10, color: 'text-yellow-400' }, // Placeholder
  'peixe grelhado': { icon: Fish, price: 15, color: 'text-orange-500' },
  'garrafa de água': { icon: GlassWater, price: 3, color: 'text-blue-300' },
  'cenoura': { icon: Carrot, price: 4, color: 'text-orange-500'},
  'uva': { icon: Grape, price: 6, color: 'text-purple-500'},
  'bife': {icon: Beef, price: 20, color: 'text-red-700'},
  // Itens de Quest
  'artefato antigo': { icon: Gem, price: 0, color: 'text-yellow-400' }, // Price 0 suggests quest item
  'carta selada': { icon: Scroll, price: 0, color: 'text-amber-500' },
  'osso de dragão': { icon: Bone, price: 0, color: 'text-gray-300' },
  // Montarias (placeholders)
  'cavalo': { icon: PawPrint, price: 200, color: 'text-yellow-700' },
  'grifo': { icon: Bird, price: 1000, color: 'text-sky-500' },
  'lobo de montaria': { icon: PawPrint, price: 500, color: 'text-gray-500' },
  'cavalo de elite': {icon: PawPrint, price: 1500, color: 'text-red-600'},

};


export const shopCategoriesData: ShopCategory[] = [
  {
    name: "Armas",
    items: [
      createItemDetail('espada curta', 50, Sword, 'text-gray-400'),
      createItemDetail('machado de lenhador', 70, Axe, 'text-yellow-700'),
      createItemDetail('adaga', 30, PocketKnife, 'text-gray-500'),
      createItemDetail('arco curto', 60, Crosshair, 'text-lime-600'),
      createItemDetail('cajado simples', 40, Wand2, 'text-purple-500'),
      createItemDetail('lança', 80, Crosshair, 'text-amber-600'),
      createItemDetail('tridente', 120, Crosshair, 'text-cyan-500'),
      createItemDetail('foice', 90, Axe, 'text-neutral-500'),
      createItemDetail('alabarda', 150, Axe, 'text-red-700'),
      createItemDetail('espada longa', 100, Sword, 'text-gray-300'),
      createItemDetail('machado de batalha', 130, Axe, 'text-orange-700'),
      createItemDetail('besta leve', 110, Target, 'text-green-700'),
      createItemDetail('varinha mágica', 90, Wand2, 'text-pink-500'),
      createItemDetail('espada flamejante', 250, Sword, 'text-red-500'),
    ],
  },
  {
    name: "Armaduras",
    items: [
      createItemDetail('escudo de madeira', 40, Shield, 'text-yellow-600'),
      createItemDetail('roupas de viajante', 20, Shirt, 'text-green-600'),
      createItemDetail('máscara simples', 15, VenetianMask, 'text-gray-400'),
      createItemDetail('elmo de couro', 30, HardHat, 'text-yellow-700'),
      createItemDetail('botas de caminhada', 25, Footprints, 'text-orange-500'),
      createItemDetail('luvas de trabalho', 10, Hand, 'text-yellow-800'),
      createItemDetail('armadura de couro', 80, Layers, 'text-amber-700'),
      createItemDetail('escudo de ferro', 90, Shield, 'text-gray-400'),
      createItemDetail('elmo de ferro', 70, HardHat, 'text-gray-500'),
      createItemDetail('grevas de aço', 60, Footprints, 'text-neutral-400'),
      createItemDetail('peitoral de placas', 200, Shirt, 'text-slate-400'),
      createItemDetail('manto sombrio', 120, VenetianMask, 'text-indigo-700'),
    ],
  },
  {
    name: "Acessórios",
    items: [
      createItemDetail('amuleto da sorte', 50, Diamond, 'text-green-400'),
      createItemDetail('anel mágico', 70, Gem, 'text-blue-400'),
      createItemDetail('cinto de utilidades', 30, Layers, 'text-yellow-700'),
      createItemDetail('colar de mana', 60, Gem, 'text-purple-400'),
      createItemDetail('brincos de agilidade', 40, Feather, 'text-sky-400'),
    ],
  },
  {
    name: "Ferramentas",
    items: [
      createItemDetail('kit de primeiros socorros', 25, BriefcaseMedical, 'text-red-500'),
      createItemDetail('tocha', 5, Flame, 'text-orange-500'),
      createItemDetail('corda (10m)', 10, IterationCw, 'text-yellow-700'),
      createItemDetail('mapa da região', 15, Map, 'text-lime-700'),
      createItemDetail('luneta', 40, Telescope, 'text-blue-600'),
      createItemDetail('kit de escalada', 50, MountainSnow, 'text-gray-500'),
      createItemDetail('vara de pescar', 20, Anchor, 'text-cyan-600'),
      createItemDetail('picareta', 30, Construction, 'text-orange-600'),
      createItemDetail('pá', 25, Construction, 'text-yellow-600'),
    ],
  },
  {
    name: "Consumíveis",
    items: [
      createItemDetail('poção de cura', 30, BriefcaseMedical, 'text-red-400'),
      createItemDetail('poção de mana', 30, GlassWater, 'text-blue-400'),
      createItemDetail('antídoto', 20, BriefcaseMedical, 'text-green-400'),
      createItemDetail('ração de viagem', 10, Beef, 'text-yellow-800'),
      createItemDetail('elixir de força', 50, Zap, 'text-orange-400'),
      createItemDetail('bomba de fumaça', 15, CloudDrizzle, 'text-gray-500'),
      createItemDetail('maçã', 5, Apple, 'text-red-500'),
      createItemDetail('pão', 7, Beef, 'text-yellow-700'),
      createItemDetail('queijo', 10, Sigma, 'text-yellow-400'),
      createItemDetail('peixe grelhado', 15, Fish, 'text-orange-500'),
      createItemDetail('garrafa de água', 3, GlassWater, 'text-blue-300'),
      createItemDetail('cenoura', 4, Carrot, 'text-orange-500'),
      createItemDetail('uva', 6, Grape, 'text-purple-500'),
      createItemDetail('bife', 20, Beef, 'text-red-700'),
    ],
  },
  {
    name: "Itens Mágicos e Raros",
    items: [
      createItemDetail('orbe do poder', 500, Gem, 'text-purple-600'),
      createItemDetail('pergaminho de teleporte', 100, Scroll, 'text-blue-500'),
      createItemDetail('pena de fênix', 300, Feather, 'text-orange-400'),
      createItemDetail('chave mestra', 150, KeyRound, 'text-yellow-500'),
      createItemDetail('gema da alma', 1000, Diamond, 'text-red-600'),
    ],
  },
  {
    name: "Outros",
    items: [
      createItemDetail('tenda', 50, Tent, 'text-green-700'),
      createItemDetail('saco de dormir', 20, Package, 'text-lime-800'),
      createItemDetail('mochila grande', 40, ShoppingBasket, 'text-yellow-700'),
      createItemDetail('fogo de artifício', 5, Sparkles, 'text-red-500'),
      createItemDetail('presente misterioso', 100, Package, 'text-purple-500'),
      createItemDetail('mapa do tesouro', 75, Scroll, 'text-amber-600'),
    ],
  },
   {
    name: "Itens de Quest (Não Compráveis)",
    items: [
      createItemDetail('artefato antigo', 0, Gem, 'text-yellow-400'),
      createItemDetail('carta selada', 0, Scroll, 'text-amber-500'),
      createItemDetail('osso de dragão', 0, Bone, 'text-gray-300'),
    ],
  },
  {
    name: "Montarias",
    items: [
      createItemDetail('cavalo', 200, PawPrint, 'text-yellow-700'),
      createItemDetail('grifo', 1000, Bird, 'text-sky-500'),
      createItemDetail('lobo de montaria', 500, PawPrint, 'text-gray-500'),
      createItemDetail('cavalo de elite', 1500, PawPrint, 'text-red-600'),
    ],
  },
];


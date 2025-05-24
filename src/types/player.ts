
export interface Player {
  nome?: string;
  vida?: number;
  ouro?: number;
  nivel?: number;
  xp?: number;
  energia?: number;
  mana?: number;
  senha?: string;
  inventario?: Record<string, number>;
  // Allows for other potential fields from the API
  [key: string]: any; 
}

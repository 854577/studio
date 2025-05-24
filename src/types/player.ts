
export interface Player {
  nome?: string;
  vida?: number;
  ouro?: number; 
  nivel?: number;
  xp?: number;
  energia?: number;
  mana?: number;
  saldoBRL?: number; 
  inventario?: Record<string, number>;
  senha?: string; // Campo para a senha (para prototipagem)
  // Allows for other potential fields from the API
  [key: string]: any; 
}

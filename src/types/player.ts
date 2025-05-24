
export interface Player {
  nome?: string;
  vida?: number;
  ouro?: number; 
  nivel?: number;
  xp?: number;
  energia?: number;
  mana?: number;
  // saldoBRL?: number; // Removido
  inventario?: Record<string, number>;
  senha?: string;
  id?: string; // Campo para ID, caso seja retornado pela API
  [key: string]: any; 
}

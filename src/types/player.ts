export interface Player {
  nome?: string;
  vida?: number;
  ouro?: number; // Alterado de dinheiro para ouro
  nivel?: number;
  xp?: number;
  // Allows for other potential fields from the API
  [key: string]: any; 
}

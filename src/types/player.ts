export interface Player {
  nome?: string;
  vida?: number;
  ouro?: number;
  nivel?: number;
  xp?: number;
  // Allows for other potential fields from the API
  [key: string]: any; 
}

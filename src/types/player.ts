export interface Player {
  nome?: string;
  vida?: number;
  dinheiro?: number;
  nivel?: number;
  xp?: number;
  // Allows for other potential fields from the API
  [key: string]: any; 
}

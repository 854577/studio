
'use client';

import { useState, type FormEvent } from 'react';
import type { Player } from '@/types/player';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Heart, CircleDollarSign, Star, User, BarChart3, Search, AlertCircle, Info } from 'lucide-react';

export default function HomePage() {
  const [playerIdInput, setPlayerIdInput] = useState<string>('');
  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedId = playerIdInput.trim();
    if (!trimmedId) {
      setError('Player ID cannot be empty.');
      setPlayerData(null);
      return;
    }

    setLoading(true);
    setError(null);
    setPlayerData(null);

    try {
      const response = await fetch('https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios.json');
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText} (status ${response.status})`);
      }
      const allPlayersData: Record<string, Player> | null = await response.json();

      if (allPlayersData && typeof allPlayersData === 'object' && allPlayersData[trimmedId]) {
        setPlayerData(allPlayersData[trimmedId]);
      } else if (allPlayersData === null || typeof allPlayersData !== 'object') {
        setError('Invalid data format received from API or no players found.');
      } else {
        setError(`Player ID "${trimmedId}" not found.`);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 sm:p-8 pt-12 sm:pt-20">
      <header className="mb-10 sm:mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-2 tracking-tight">RPG himiko</h1>
        <p className="text-md sm:text-lg text-muted-foreground">Player Information Lookup</p>
      </header>

      <form onSubmit={handleSearch} className="w-full max-w-md mb-8 flex items-stretch gap-2 sm:gap-3">
        <Input
          type="text"
          value={playerIdInput}
          onChange={(e) => setPlayerIdInput(e.target.value)}
          placeholder="nome do usuário"
          className="flex-grow text-base h-12"
          aria-label="Nome do usuário Input"
        />
        <Button 
          type="submit" 
          disabled={loading || !playerIdInput.trim()} 
          className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground px-4 sm:px-6"
          aria-label="Search Player"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground"></div>
          ) : (
            <Search size={20} />
          )}
          <span className="ml-2 hidden sm:inline">Search</span>
        </Button>
      </form>

      {error && (
        <Alert variant="destructive" className="w-full max-w-md mb-8 shadow-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && !error && (
         <Card className="w-full max-w-lg shadow-2xl animate-pulse bg-card border border-border/50">
          <CardHeader className="pb-4">
            <div className="h-8 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="h-16 bg-muted/50 rounded-lg p-4"></div>
            <div className="h-16 bg-muted/50 rounded-lg p-4"></div>
            <div className="h-16 bg-muted/50 rounded-lg p-4"></div>
            <div className="h-16 bg-muted/50 rounded-lg p-4"></div>
          </CardContent>
        </Card>
      )}

      {playerData && !loading && !error && (
        <Card className="w-full max-w-lg shadow-2xl bg-card border border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl sm:text-3xl text-primary flex items-center">
              <User size={30} className="mr-3 shrink-0 text-primary" />
              {playerData.nome}
            </CardTitle>
            {playerData.nome && <CardDescription className="mt-1">Displaying stats for {playerData.nome}</CardDescription>}
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {playerData.vida !== undefined && (
              <div className="flex items-center p-4 bg-card-foreground/5 rounded-lg border border-border/30 transition-shadow hover:shadow-lg">
                <Heart size={24} className="mr-3 text-destructive shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">Health</p>
                  <p className="text-lg font-bold text-foreground">{playerData.vida}</p>
                </div>
              </div>
            )}
            {playerData.dinheiro !== undefined && (
              <div className="flex items-center p-4 bg-card-foreground/5 rounded-lg border border-border/30 transition-shadow hover:shadow-lg">
                <CircleDollarSign size={24} className="mr-3 text-foreground shrink-0" /> 
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">Money</p>
                  <p className="text-lg font-bold text-foreground">{playerData.dinheiro.toLocaleString()}</p>
                </div>
              </div>
            )}
            {playerData.nivel !== undefined && (
              <div className="flex items-center p-4 bg-card-foreground/5 rounded-lg border border-border/30 transition-shadow hover:shadow-lg">
                <Star size={24} className="mr-3 text-foreground shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">Level</p>
                  <p className="text-lg font-bold text-foreground">{playerData.nivel}</p>
                </div>
              </div>
            )}
            {playerData.xp !== undefined && (
              <div className="flex items-center p-4 bg-card-foreground/5 rounded-lg border border-border/30 transition-shadow hover:shadow-lg">
                <BarChart3 size={24} className="mr-3 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-muted-foreground">Experience (XP)</p>
                  <p className="text-lg font-bold text-foreground">{playerData.xp.toLocaleString()}</p>
                </div>
              </div>
            )}
            {Object.entries(playerData)
              .filter(([key]) => !['nome', 'vida', 'dinheiro', 'nivel', 'xp', 'id'].includes(key) && playerData[key] !== undefined && playerData[key] !== null && String(playerData[key]).trim() !== "")
              .map(([key, value]) => (
                <div key={key} className="flex items-center p-4 bg-card-foreground/5 rounded-lg border border-border/30 transition-shadow hover:shadow-lg sm:col-span-2">
                  <Info size={24} className="mr-3 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground capitalize">{key.replace(/_/g, ' ').toLowerCase()}</p>
                    <p className="text-lg font-bold text-foreground">{String(value)}</p>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

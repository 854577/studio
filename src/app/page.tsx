
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import type { Player } from '@/types/player';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Heart, CircleDollarSign, Star, User, BarChart3, Search, AlertCircle, Info, Briefcase, Fish, Bed, Zap, Sparkles, Dumbbell } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';

export default function HomePage() {
  const [playerIdInput, setPlayerIdInput] = useState<string>('');
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  type ActionType = 'trabalhar' | 'pescar' | 'dormir' | 'treinar';
  const ACTION_COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hora em milissegundos

  const [actionCooldownEndTimes, setActionCooldownEndTimes] = useState<Record<ActionType, number>>({
    trabalhar: 0,
    pescar: 0,
    dormir: 0,
    treinar: 0,
  });

  const [timeLeftForAction, setTimeLeftForAction] = useState<Record<ActionType, string | null>>({
    trabalhar: null,
    pescar: null,
    dormir: null,
    treinar: null,
  });

  useEffect(() => {
    if (typeof window !== 'undefined' && currentPlayerId) {
      const loadedCooldowns: Record<ActionType, number> = { trabalhar: 0, pescar: 0, dormir: 0, treinar: 0 };
      (['trabalhar', 'pescar', 'dormir', 'treinar'] as ActionType[]).forEach(action => {
        const endTime = localStorage.getItem(`cooldown_${action}_${currentPlayerId}`);
        if (endTime) {
          loadedCooldowns[action] = parseInt(endTime, 10);
        }
      });
      setActionCooldownEndTimes(loadedCooldowns);
    } else {
      setActionCooldownEndTimes({ trabalhar: 0, pescar: 0, dormir: 0, treinar: 0 });
      setTimeLeftForAction({ trabalhar: null, pescar: null, dormir: null, treinar: null });
    }
  }, [currentPlayerId]);

  useEffect(() => {
    const intervalIds: NodeJS.Timeout[] = [];

    (['trabalhar', 'pescar', 'dormir', 'treinar'] as ActionType[]).forEach(action => {
      const endTime = actionCooldownEndTimes[action];
      
      const updateDisplay = () => {
        const now = Date.now();
        const remainingTime = endTime - now;

        if (remainingTime > 0) {
          const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
          const seconds = Math.floor((remainingTime / 1000) % 60);
          setTimeLeftForAction(prev => ({
            ...prev,
            [action]: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
          }));
        } else {
          setTimeLeftForAction(prev => ({ ...prev, [action]: null }));
          if (currentPlayerId && localStorage.getItem(`cooldown_${action}_${currentPlayerId}`)) {
             localStorage.removeItem(`cooldown_${action}_${currentPlayerId}`);
          }
        }
      };

      if (endTime > Date.now()) {
        updateDisplay(); 
        const id = setInterval(updateDisplay, 1000);
        intervalIds.push(id);
      } else {
         setTimeLeftForAction(prev => ({ ...prev, [action]: null }));
         if (currentPlayerId && localStorage.getItem(`cooldown_${action}_${currentPlayerId}`)) {
             localStorage.removeItem(`cooldown_${action}_${currentPlayerId}`);
          }
      }
    });

    return () => {
      intervalIds.forEach(clearInterval);
    };
  }, [actionCooldownEndTimes, currentPlayerId]);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedId = playerIdInput.trim();
    if (!trimmedId) {
      setError('Player ID cannot be empty.');
      setPlayerData(null);
      setCurrentPlayerId(null); 
      return;
    }

    setLoading(true);
    setError(null);
    setPlayerData(null);
    setCurrentPlayerId(null); 

    try {
      const response = await fetch('https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios.json');
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText} (status ${response.status})`);
      }
      const allPlayersData: Record<string, Player> | null = await response.json();

      if (allPlayersData && typeof allPlayersData === 'object' && allPlayersData[trimmedId]) {
        setPlayerData(allPlayersData[trimmedId]);
        setCurrentPlayerId(trimmedId); 
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
  
  const handlePlayerAction = async (actionType: ActionType) => {
    if (!playerData || !currentPlayerId) {
      setError("Busque um jogador primeiro para realizar ações.");
      toast({
        title: "Erro",
        description: "Busque um jogador primeiro para realizar ações.",
        variant: "destructive",
      });
      return;
    }
    
    const now = Date.now();
    if (actionCooldownEndTimes[actionType] > now) {
      toast({
        title: "Ação em Cooldown",
        description: `Você precisa esperar ${timeLeftForAction[actionType]} para ${actionType} novamente.`,
        variant: "destructive",
      });
      return;
    }

    let goldEarned = 0;
    let xpEarned = 0;
    let actionTitle = "";

    switch (actionType) {
      case 'trabalhar':
        goldEarned = Math.floor(Math.random() * 41) + 10; 
        xpEarned = Math.floor(Math.random() * 16) + 5;   
        actionTitle = "Você trabalhou duro!";
        break;
      case 'pescar':
        goldEarned = Math.floor(Math.random() * 26) + 5;  
        xpEarned = Math.floor(Math.random() * 13) + 3;   
        actionTitle = "Boa pescaria!";
        break;
      case 'dormir':
        xpEarned = Math.floor(Math.random() * 10) + 1;   
        actionTitle = "Você descansou bem.";
        break;
      case 'treinar':
        xpEarned = Math.floor(Math.random() * 21) + 5; // 5 a 25 XP
        actionTitle = "Treino intenso!";
        break;
    }
    
    const newOuro = (playerData.ouro || 0) + goldEarned;
    const newXp = (playerData.xp || 0) + xpEarned;

    setPlayerData(prevData => {
      if (!prevData) return null;
      return {
        ...prevData,
        ouro: newOuro,
        xp: newXp,
      };
    });

    try {
      const firebaseResponse = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${currentPlayerId}.json`, {
        method: 'PATCH', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ouro: newOuro,
          xp: newXp,
        }),
      });

      if (!firebaseResponse.ok) {
        let errorDetail = `Status: ${firebaseResponse.status} - ${firebaseResponse.statusText}`;
        try {
            const errorData = await firebaseResponse.json();
            if (errorData && errorData.error) {
                errorDetail = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
            }
        } catch (e) {
          console.warn("Could not parse Firebase error response JSON", e)
        }
        const errorMessage = `Falha ao salvar no Firebase: ${errorDetail}. Verifique as regras de segurança do seu Firebase Realtime Database para 'rpgUsuarios/${currentPlayerId}'.`;
        console.error('Firebase save error details:', {
            message: errorMessage,
            path: `rpgUsuarios/${currentPlayerId}`,
            status: firebaseResponse.status,
            statusText: firebaseResponse.statusText,
        });
        throw new Error(errorMessage);
      }

      toast({
        title: actionTitle,
        description: `Você ganhou ${goldEarned > 0 ? `${goldEarned} de ouro e ` : ''}${xpEarned} XP. Dados salvos no servidor!`,
      });

    } catch (err) {
      console.error('Detalhes do erro ao salvar no Firebase:', {
        message: err instanceof Error ? err.message : String(err),
        playerId: currentPlayerId,
        dataAttemptedToSave: { ouro: newOuro, xp: newXp },
        originalError: err
      });
      toast({
        title: "Erro ao Salvar no Servidor",
        description: err instanceof Error ? err.message : "Não foi possível salvar os dados no servidor. Suas recompensas foram aplicadas localmente.",
        variant: "destructive",
      });
    }

    const newCooldownEndTime = now + ACTION_COOLDOWN_DURATION;
    setActionCooldownEndTimes(prev => ({ ...prev, [actionType]: newCooldownEndTime }));
    if (typeof window !== 'undefined' && currentPlayerId) {
      localStorage.setItem(`cooldown_${actionType}_${currentPlayerId}`, newCooldownEndTime.toString());
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
          className={cn(
            "flex-grow text-base h-12",
            "input-focus-rgb-ring" 
          )}
          aria-label="Nome do usuário Input"
        />
        <Button 
          type="submit" 
          disabled={loading || !playerIdInput.trim()} 
          className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground px-4 sm:px-6 transition-transform duration-200 ease-in-out hover:scale-[1.03]"
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
             <div className="h-16 bg-muted/50 rounded-lg p-4"></div>
            <div className="h-16 bg-muted/50 rounded-lg p-4"></div>
          </CardContent>
        </Card>
      )}

      {playerData && !loading && !error && (
        <>
          <Card className={cn(
            "w-full max-w-lg shadow-2xl bg-card border-border/50 relative overflow-hidden",
            playerData && "animated-rgb-border"
            )}>
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
              {playerData.ouro !== undefined && (
                <div className="flex items-center p-4 bg-card-foreground/5 rounded-lg border border-border/30 transition-shadow hover:shadow-lg">
                  <CircleDollarSign size={24} className="mr-3 text-[hsl(var(--chart-5))] shrink-0" /> 
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground">Ouro</p>
                    <p className="text-lg font-bold text-foreground">{playerData.ouro.toLocaleString()}</p>
                  </div>
                </div>
              )}
              {playerData.nivel !== undefined && (
                <div className="flex items-center p-4 bg-card-foreground/5 rounded-lg border border-border/30 transition-shadow hover:shadow-lg">
                  <Star size={24} className="mr-3 text-[hsl(var(--chart-4))] shrink-0" />
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
              {playerData.energia !== undefined && (
                <div className="flex items-center p-4 bg-card-foreground/5 rounded-lg border border-border/30 transition-shadow hover:shadow-lg">
                  <Zap size={24} className="mr-3 text-[hsl(var(--chart-4))] shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground">Energia</p>
                    <p className="text-lg font-bold text-foreground">{playerData.energia}</p>
                  </div>
                </div>
              )}
              {playerData.mana !== undefined && (
                <div className="flex items-center p-4 bg-card-foreground/5 rounded-lg border border-border/30 transition-shadow hover:shadow-lg">
                  <Sparkles size={24} className="mr-3 text-[hsl(var(--chart-1))] shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-muted-foreground">Mana</p>
                    <p className="text-lg font-bold text-foreground">{playerData.mana}</p>
                  </div>
                </div>
              )}
              {Object.entries(playerData)
                .filter(([key]) => !['nome', 'vida', 'ouro', 'nivel', 'xp', 'id', 'dinheiro', 'energia', 'mana'].includes(key) && playerData[key] !== undefined && playerData[key] !== null && String(playerData[key]).trim() !== "")
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

          <Card className={cn(
            "w-full max-w-lg mt-8 shadow-xl bg-card border-border/50 relative overflow-hidden",
             playerData && "animated-rgb-border"
            )}>
            <CardHeader>
              <CardTitle className="text-xl flex items-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 lucide lucide-gamepad-2"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/><path d="M6 18h4"/><path d="M14 18h4"/></svg>
                Ações do Jogador
              </CardTitle>
              <CardDescription>Realize ações para ganhar recompensas.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              {(['trabalhar', 'pescar', 'dormir', 'treinar'] as ActionType[]).map((action) => {
                const Icon = action === 'trabalhar' ? Briefcase : action === 'pescar' ? Fish : action === 'dormir' ? Bed : Dumbbell;
                const currentCooldown = timeLeftForAction[action];
                const isDisabled = !!currentCooldown;
                return (
                  <Button
                    key={action}
                    onClick={() => handlePlayerAction(action)}
                    disabled={isDisabled}
                    className="w-full py-6 text-sm flex flex-col items-center justify-center h-auto min-h-[7rem] transition-transform duration-200 ease-in-out hover:scale-[1.03] disabled:transform-none"
                    variant={isDisabled ? "secondary" : "default"}
                  >
                    <Icon className={`mb-2 h-8 w-8 ${isDisabled ? 'text-muted-foreground' : ''}`} />
                    <span className="font-semibold">{action.charAt(0).toUpperCase() + action.slice(1)}</span>
                    {isDisabled && <span className="text-xs text-muted-foreground mt-0.5">({currentCooldown})</span>}
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


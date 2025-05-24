
'use client';

import { useState, type FormEvent, useEffect } from 'react';
import type { Player } from '@/types/player';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Search, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import PlayerStatsCard, { PlayerStatsSkeleton } from '@/components/app/PlayerStatsCard';
import PlayerActionsCard from '@/components/app/PlayerActionsCard';
import RechargeCard from '@/components/app/RechargeCard'; // Novo componente

export type ActionType = 'trabalhar' | 'pescar' | 'dormir' | 'treinar';
export const ACTION_COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hora em milissegundos

export default function HomePage() {
  const [playerIdInput, setPlayerIdInput] = useState<string>('');
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
    let updatedPlayerData = { ...playerData };

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
        xpEarned = Math.floor(Math.random() * 21) + 5; 
        actionTitle = "Treino concluído!";
        break;
    }
    
    updatedPlayerData.ouro = (playerData.ouro || 0) + goldEarned;
    updatedPlayerData.xp = (playerData.xp || 0) + xpEarned;
    
    setPlayerData(updatedPlayerData);

    const newCooldownEndTime = now + ACTION_COOLDOWN_DURATION;
    setActionCooldownEndTimes(prev => ({ ...prev, [actionType]: newCooldownEndTime }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(`cooldown_${actionType}_${currentPlayerId}`, newCooldownEndTime.toString());
    }

    toast({
      title: actionTitle,
      description: `Você ganhou ${goldEarned > 0 ? `${goldEarned} de ouro e ` : ''}${xpEarned} XP.`,
    });

    try {
      const updatePath = `https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${currentPlayerId}.json`;
      const response = await fetch(updatePath, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ouro: updatedPlayerData.ouro, xp: updatedPlayerData.xp }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Firebase save error response body:', errorBody);
        const errorData = JSON.parse(errorBody || '{}');
        throw new Error(`Failed to save to Firebase: ${response.statusText} (status ${response.status}). Path: ${updatePath}. Details: ${JSON.stringify(errorData)}`);
      }
      toast({
        title: "Progresso Salvo!",
        description: "Suas recompensas foram salvas no banco de dados.",
      });
    } catch (saveError) {
      console.error('Firebase save error:', saveError);
      toast({
        title: "Erro ao Salvar",
        description: `Não foi possível salvar os dados no Firebase. ${saveError instanceof Error ? saveError.message : 'Erro desconhecido.'}`,
        variant: "destructive",
      });
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 sm:p-8 pt-12 sm:pt-20">
      <header className="mb-10 sm:mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-2 tracking-tight">RPG himiko</h1>
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

      {loading && !error && <PlayerStatsSkeleton />}

      {!loading && !error && playerData && (
        <>
          <PlayerStatsCard playerData={playerData} />
          <PlayerActionsCard
            onAction={handlePlayerAction}
            timeLeftForAction={timeLeftForAction}
            isDisabled={!playerData || !currentPlayerId}
          />
          <RechargeCard 
            playerId={currentPlayerId} 
            playerName={playerData?.nome}
            isDisabled={!playerData || !currentPlayerId} 
          />
        </>
      )}
      
      <footer className="w-full max-w-lg mt-12 pt-8 border-t border-border/30 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} Yuri Draco. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

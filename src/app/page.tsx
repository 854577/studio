
'use client';

import React from 'react'; 
import { useState, type FormEvent, useEffect } from 'react';
import type { Player } from '@/types/player';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'; // Added Card imports
import { Search, AlertCircle, ShoppingBag } from 'lucide-react'; 
import { useToast } from "@/hooks/use-toast";
import PlayerStatsCard, { PlayerStatsSkeleton } from '@/components/app/PlayerStatsCard';
import PlayerActionsCard from '@/components/app/PlayerActionsCard';
import RechargeCard from '@/components/app/RechargeCard';
import { Dialog, DialogContent as ShadDialogContent, DialogHeader as ShadDialogHeader, DialogTitle as ShadDialogTitle } from '@/components/ui/dialog'; // Renamed to avoid conflict
import { Briefcase, Fish, Bed, Dumbbell } from 'lucide-react'; 
import Link from 'next/link'; 

export type ActionType = 'trabalhar' | 'pescar' | 'dormir' | 'treinar';
export const ACTION_COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hora em milissegundos

export const actionConfig: Record<ActionType, { label: string; icon: React.ElementType; modalTitle: string }> = {
  trabalhar: { label: 'Trabalhar', icon: Briefcase, modalTitle: 'Trabalhando...' },
  pescar: { label: 'Pescar', icon: Fish, modalTitle: 'Pescando...' },
  dormir: { label: 'Dormir', icon: Bed, modalTitle: 'Descansando...' },
  treinar: { label: 'Treinar', icon: Dumbbell, modalTitle: 'Treinando...' },
};

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

  const [activeActionAnimation, setActiveActionAnimation] = useState<ActionType | null>(null);
  const [isActionInProgress, setIsActionInProgress] = useState<boolean>(false);

  // Efeito para carregar playerId da URL na montagem
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('playerId');
    if (pid) {
      setPlayerIdInput(pid);
      // Disparar busca automaticamente se pid existir
      // Criar um evento sintético ou chamar handleSearch diretamente
      // Para simplificar, vamos apenas preencher o input e o usuário pode clicar em buscar
      // ou você pode adaptar handleSearch para ser chamado aqui.
      // Se quiser busca automática:
      handleSearch(undefined, pid.trim());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    const fetchPlayerData = async (id: string) => {
      setLoading(true); 
      try {
        const response = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${id}.json`);
        if (!response.ok) {
           if (response.status === 404 || (await response.clone().json()) === null) { 
            setError(`Player ID "${id}" not found.`);
          } else {
            throw new Error(`API request failed: ${response.statusText} (status ${response.status})`);
          }
          setPlayerData(null);
          return;
        }
        const fetchedPlayerData: Player | null = await response.json();

        if (fetchedPlayerData) {
          setPlayerData(fetchedPlayerData);
          setError(null); 
        } else {
          if (!error) setError(`Player ID "${id}" not found or data format invalid.`);
          setPlayerData(null);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        if (!error) setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching data.');
        setPlayerData(null);
      } finally {
        setLoading(false);
      }
    };

    if (currentPlayerId) {
      fetchPlayerData(currentPlayerId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayerId]); 

  useEffect(() => {
    if (typeof window !== 'undefined' && currentPlayerId) {
      const loadedCooldowns: Record<ActionType, number> = { trabalhar: 0, pescar: 0, dormir: 0, treinar: 0 };
      (Object.keys(actionConfig) as ActionType[]).forEach(action => {
        const endTimeString = localStorage.getItem(`cooldown_${action}_${currentPlayerId}`);
        if (endTimeString) {
          const endTime = parseInt(endTimeString, 10);
          if (endTime > Date.now()) { 
            loadedCooldowns[action] = endTime;
          } else { 
            localStorage.removeItem(`cooldown_${action}_${currentPlayerId}`);
          }
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

    (Object.keys(actionConfig) as ActionType[]).forEach(action => {
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

  const handleSearch = async (event?: FormEvent, idFromUrl?: string) => { 
    if (event) event.preventDefault(); 
    
    const trimmedId = idFromUrl || playerIdInput.trim();
    if (!trimmedId) {
      setError('Player ID cannot be empty.');
      setPlayerData(null);
      setCurrentPlayerId(null);
      return;
    }

    setLoading(true);
    setError(null);
    setPlayerData(null); 

    if (typeof window !== 'undefined' && !idFromUrl) {
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('playerId', trimmedId);
      window.history.pushState({}, '', currentUrl.toString());
    }
    
    setCurrentPlayerId(trimmedId); 
  };
  
  const handlePlayerAction = async (actionType: ActionType) => {
    if (!playerData || !currentPlayerId || isActionInProgress) {
      toast({
        title: "Erro",
        description: isActionInProgress ? "Aguarde a ação atual terminar." : "Busque um jogador primeiro para realizar ações.",
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

    setIsActionInProgress(true);
    setActiveActionAnimation(actionType);

    setTimeout(async () => {
      if (!playerData || !currentPlayerId) { // Double check here
        console.error("Player data or ID became null during action processing.");
        setActiveActionAnimation(null);
        setIsActionInProgress(false);
        toast({ title: "Erro", description: "Dados do jogador não disponíveis para completar a ação. Tente novamente.", variant: "destructive" });
        return;
      }

      let goldEarned = 0;
      let xpEarned = 0;
      let actionToastTitle = "";
      let updatedPlayerData = { ...playerData }; 

      const randomReward = () => Math.floor(Math.random() * (500 - 100 + 1)) + 100;

      switch (actionType) {
        case 'trabalhar':
          goldEarned = randomReward(); 
          xpEarned = randomReward();   
          actionToastTitle = "Você trabalhou duro!";
          break;
        case 'pescar':
          goldEarned = randomReward();  
          xpEarned = randomReward();   
          actionToastTitle = "Boa pescaria!";
          break;
        case 'dormir':
          xpEarned = randomReward();   
          actionToastTitle = "Você descansou bem.";
          break;
        case 'treinar':
          xpEarned = randomReward(); 
          actionToastTitle = "Treino concluído!";
          break;
      }
      
      updatedPlayerData.ouro = (playerData.ouro || 0) + goldEarned;
      updatedPlayerData.xp = (playerData.xp || 0) + xpEarned;
      
      setPlayerData(updatedPlayerData);

      const newCooldownEndTime = Date.now() + ACTION_COOLDOWN_DURATION;
      setActionCooldownEndTimes(prev => ({ ...prev, [actionType]: newCooldownEndTime }));
      if (typeof window !== 'undefined') {
        localStorage.setItem(`cooldown_${actionType}_${currentPlayerId}`, newCooldownEndTime.toString());
      }

      toast({
        title: actionToastTitle,
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
          let errorData = {};
          try {
            errorData = JSON.parse(errorBody); 
          } catch (parseError) {
            console.warn('Could not parse Firebase error response as JSON:', parseError);
            errorData = { message: errorBody || 'Unknown Firebase error structure.' };
          }
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
          description: `Não foi possível salvar os dados no Firebase. ${saveError instanceof Error ? saveError.message : 'Erro desconhecido.'}. Verifique as regras de segurança do Firebase e o console para mais detalhes.`,
          variant: "destructive",
          duration: 7000, 
        });
      } finally {
        setActiveActionAnimation(null);
        setIsActionInProgress(false);
      }
    }, 1500); 
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 sm:p-8 pt-12 sm:pt-20">
      <header className="mb-10 sm:mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-2 tracking-tight">RPG himiko</h1>
      </header>

      <form onSubmit={(e) => handleSearch(e)} className="w-full max-w-md mb-8 flex items-stretch gap-2 sm:gap-3">
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
          {loading && !playerData ? ( 
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

      {loading && !playerData && !error && <PlayerStatsSkeleton />}
      
      {!loading && playerData && !error && currentPlayerId && (
        <>
          <PlayerStatsCard playerData={playerData} />
          <PlayerActionsCard
            onAction={handlePlayerAction}
            timeLeftForAction={timeLeftForAction}
            actionConfig={actionConfig} 
            isDisabled={!playerData || !currentPlayerId || isActionInProgress} 
          />
          <RechargeCard 
            playerId={currentPlayerId} 
            playerName={playerData?.nome}
            isDisabled={!playerData || !currentPlayerId} 
          />
          <Card className="w-full max-w-lg mt-8 shadow-xl bg-card border-border/50">
            <CardHeader>
                <CardTitle className="text-xl flex items-center">
                    <ShoppingBag size={24} className="mr-2 text-primary" />
                    Loja do Jogador
                </CardTitle>
                <CardDescription>Compre itens e equipamentos para sua aventura.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full py-3 text-base" variant="outline">
                    <Link href={`/loja?playerId=${currentPlayerId}`}>
                        Acessar Loja
                    </Link>
                </Button>
            </CardContent>
          </Card>
        </>
      )}
       {loading && playerData && !error && currentPlayerId && ( 
        <>
          <div className="w-full max-w-lg text-center my-2">
            <span className="text-sm text-muted-foreground italic">Atualizando dados...</span>
          </div>
          <PlayerStatsCard playerData={playerData} />
           <PlayerActionsCard
            onAction={handlePlayerAction}
            timeLeftForAction={timeLeftForAction}
            actionConfig={actionConfig} 
            isDisabled={!playerData || !currentPlayerId || isActionInProgress}
          />
          <RechargeCard 
            playerId={currentPlayerId} 
            playerName={playerData?.nome}
            isDisabled={!playerData || !currentPlayerId} 
          />
          <Card className="w-full max-w-lg mt-8 shadow-xl bg-card border-border/50">
            <CardHeader>
                <CardTitle className="text-xl flex items-center">
                     <ShoppingBag size={24} className="mr-2 text-primary" />
                    Loja do Jogador
                </CardTitle>
                <CardDescription>Compre itens e equipamentos para sua aventura.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full py-3 text-base" variant="outline" disabled>
                    <Link href={`/loja?playerId=${currentPlayerId}`}>
                        Acessar Loja (Carregando...)
                    </Link>
                </Button>
            </CardContent>
          </Card>
        </>
      )}

      {activeActionAnimation && actionConfig[activeActionAnimation] && (
        <Dialog open={!!activeActionAnimation} onOpenChange={() => {setActiveActionAnimation(null); setIsActionInProgress(false);}}>
          <ShadDialogContent className="sm:max-w-[280px] p-6 flex flex-col items-center justify-center bg-card/95 backdrop-blur-sm shadow-2xl rounded-lg border-border/50">
            <ShadDialogHeader className="mb-3">
              <ShadDialogTitle className="text-center text-xl font-semibold text-primary">
                {actionConfig[activeActionAnimation].modalTitle}
              </ShadDialogTitle>
            </ShadDialogHeader>
            <div className="animate-pulse text-primary">
              {React.createElement(actionConfig[activeActionAnimation].icon, { size: 72, strokeWidth: 1.5 })}
            </div>
          </ShadDialogContent>
        </Dialog>
      )}
      
      <footer className="w-full max-w-lg mt-12 pt-8 border-t border-border/30 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} Yuri Draco. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}


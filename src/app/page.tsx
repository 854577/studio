
'use client';

import React from 'react'; // Adicionado React aqui
import { useState, type FormEvent, useEffect } from 'react';
import type { Player } from '@/types/player';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Search, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import PlayerStatsCard, { PlayerStatsSkeleton } from '@/components/app/PlayerStatsCard';
import PlayerActionsCard from '@/components/app/PlayerActionsCard';
import RechargeCard from '@/components/app/RechargeCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Briefcase, Fish, Bed, Dumbbell } from 'lucide-react'; // Importar ícones explicitamente se usados no Dialog

export type ActionType = 'trabalhar' | 'pescar' | 'dormir' | 'treinar';
export const ACTION_COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hora em milissegundos

// Adicionando modalTitle e mantendo icon para o PlayerActionsCard e o Dialog de animação
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


  useEffect(() => {
    const fetchPlayerData = async (id: string) => {
      setLoading(true); 
      try {
        const response = await fetch('https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios.json');
        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText} (status ${response.status})`);
        }
        const allPlayersData: Record<string, Player> | null = await response.json();

        if (allPlayersData && typeof allPlayersData === 'object' && allPlayersData[id]) {
          setPlayerData(allPlayersData[id]);
          setError(null); 
        } else {
          // Mantém o erro existente se já houver um, para não sobrescrever um erro de busca com "not found"
          if (!error) setError(`Player ID "${id}" not found or data format invalid.`);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        // Mantém o erro existente se já houver um
        if (!error) setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };

    if (currentPlayerId) {
      fetchPlayerData(currentPlayerId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayerId]); // Removido 'error' da dependência para evitar loop se fetchPlayerData chamar setError

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
            // Cooldown expirado, remover do localStorage
            localStorage.removeItem(`cooldown_${action}_${currentPlayerId}`);
          }
        }
      });
      setActionCooldownEndTimes(loadedCooldowns);
    } else {
      // Resetar cooldowns se não houver currentPlayerId
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
          // Garante a remoção do localStorage se o timer expirar enquanto a página está aberta
          if (currentPlayerId && localStorage.getItem(`cooldown_${action}_${currentPlayerId}`)) {
             localStorage.removeItem(`cooldown_${action}_${currentPlayerId}`);
          }
        }
      };

      if (endTime > Date.now()) {
        updateDisplay(); // Chamar uma vez para exibir imediatamente
        const id = setInterval(updateDisplay, 1000);
        intervalIds.push(id);
      } else {
         // Garante que, se o cooldown já expirou ao carregar, o tempo é nulo e limpa o localStorage
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
    setPlayerData(null); // Limpa dados do jogador anterior ao iniciar nova busca

    try {
      const response = await fetch('https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios.json');
      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText} (status ${response.status})`);
      }
      const allPlayersData: Record<string, Player> | null = await response.json();

      if (allPlayersData && typeof allPlayersData === 'object' && allPlayersData[trimmedId]) {
        setPlayerData(allPlayersData[trimmedId]);
        setCurrentPlayerId(trimmedId); // Define o ID do jogador atual após busca bem-sucedida
      } else if (allPlayersData === null || typeof allPlayersData !== 'object') {
        setError('Invalid data format received from API or no players found.');
        setCurrentPlayerId(null);
      } else {
        setError(`Player ID "${trimmedId}" not found.`);
        setCurrentPlayerId(null);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching data.');
      setCurrentPlayerId(null);
    } finally {
      setLoading(false);
    }
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
      // Verificação de playerData e currentPlayerId DENTRO do setTimeout
      if (!playerData || !currentPlayerId) {
        console.error("Player data or ID became null during action processing.");
        setActiveActionAnimation(null);
        setIsActionInProgress(false);
        toast({ title: "Erro", description: "Dados do jogador não disponíveis para completar a ação. Tente novamente.", variant: "destructive" });
        return;
      }

      let goldEarned = 0;
      let xpEarned = 0;
      let actionToastTitle = "";
      let updatedPlayerData = { ...playerData }; // Criar cópia para modificação

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
          // Dormir não dá ouro, apenas XP
          xpEarned = randomReward();   
          actionToastTitle = "Você descansou bem.";
          break;
        case 'treinar':
          // Treinar não dá ouro, apenas XP
          xpEarned = randomReward(); 
          actionToastTitle = "Treino concluído!";
          break;
      }
      
      // Atualizar os valores na cópia
      updatedPlayerData.ouro = (playerData.ouro || 0) + goldEarned;
      updatedPlayerData.xp = (playerData.xp || 0) + xpEarned;
      
      // Atualizar o estado local com a cópia modificada
      setPlayerData(updatedPlayerData);

      // Configurar novo cooldown
      const newCooldownEndTime = Date.now() + ACTION_COOLDOWN_DURATION;
      setActionCooldownEndTimes(prev => ({ ...prev, [actionType]: newCooldownEndTime }));
      if (typeof window !== 'undefined') {
        localStorage.setItem(`cooldown_${actionType}_${currentPlayerId}`, newCooldownEndTime.toString());
      }

      // Exibir toast com as recompensas
      toast({
        title: actionToastTitle,
        description: `Você ganhou ${goldEarned > 0 ? `${goldEarned} de ouro e ` : ''}${xpEarned} XP.`,
      });

      // Tentar salvar no Firebase
      try {
        const updatePath = `https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${currentPlayerId}.json`;
        const response = await fetch(updatePath, {
          method: 'PATCH', // Usar PATCH para atualizar apenas os campos especificados
          headers: {
            'Content-Type': 'application/json',
          },
          // Enviar apenas os campos atualizados
          body: JSON.stringify({ ouro: updatedPlayerData.ouro, xp: updatedPlayerData.xp }),
        });

        if (!response.ok) {
          // Tentar ler o corpo do erro
          const errorBody = await response.text(); // Ler como texto primeiro
          console.error('Firebase save error response body:', errorBody);
          let errorData = {};
          try {
            errorData = JSON.parse(errorBody); // Tentar parsear como JSON
          } catch (parseError) {
            console.warn('Could not parse Firebase error response as JSON:', parseError);
            // Usar o texto puro se não for JSON
            errorData = { message: errorBody || 'Unknown Firebase error structure.' };
          }
          // Lançar um erro mais detalhado
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
          duration: 7000, // Aumentar duração para erros importantes
        });
        // Opcional: Reverter o estado local se o salvamento falhar? 
        // setPlayerData(playerData); // Reverte para os dados antes da ação
        // setActionCooldownEndTimes(prev => ({ ...prev, [actionType]: 0 })); // Remove cooldown
        // localStorage.removeItem(`cooldown_${actionType}_${currentPlayerId}`);
      } finally {
        setActiveActionAnimation(null);
        setIsActionInProgress(false);
      }
    }, 1500); // Duração da animação em ms
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
          {loading && !playerData ? ( // Mostrar spinner apenas se estiver carregando e não houver dados antigos
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

      {/* Skeleton loader quando 'loading' é true E não há 'playerData' ou 'error' */}
      {loading && !playerData && !error && <PlayerStatsSkeleton />}
      
      {/* Exibe os dados do jogador se não estiver carregando E houver dados E não houver erro */}
      {!loading && playerData && !error && (
        <>
          <PlayerStatsCard playerData={playerData} />
          <PlayerActionsCard
            onAction={handlePlayerAction}
            timeLeftForAction={timeLeftForAction}
            actionConfig={actionConfig} // Passar actionConfig
            isDisabled={!playerData || !currentPlayerId || isActionInProgress} // Desabilita se não houver dados do jogador ou ação em progresso
          />
          <RechargeCard 
            playerId={currentPlayerId} 
            playerName={playerData?.nome}
            isDisabled={!playerData || !currentPlayerId} // Desabilita se não houver dados do jogador
          />
        </>
      )}
       {/* Exibe os dados antigos do jogador (se houver) com um indicador de atualização, se 'loading' é true E já existe 'playerData' E não há erro */}
       {loading && playerData && !error && ( 
        <>
          <div className="w-full max-w-lg text-center my-2">
            <span className="text-sm text-muted-foreground italic">Atualizando dados...</span>
          </div>
          <PlayerStatsCard playerData={playerData} />
           <PlayerActionsCard
            onAction={handlePlayerAction}
            timeLeftForAction={timeLeftForAction}
            actionConfig={actionConfig} // Passar actionConfig
            isDisabled={!playerData || !currentPlayerId || isActionInProgress}
          />
          <RechargeCard 
            playerId={currentPlayerId} 
            playerName={playerData?.nome}
            isDisabled={!playerData || !currentPlayerId} 
          />
        </>
      )}

      {/* Modal de Animação da Ação */}
      {activeActionAnimation && (
        <Dialog open={!!activeActionAnimation} onOpenChange={() => {/* O diálogo é controlado por activeActionAnimation e fecha quando ele é null */}}>
          <DialogContent className="sm:max-w-[280px] p-6 flex flex-col items-center justify-center bg-card/95 backdrop-blur-sm shadow-2xl rounded-lg border-border/50">
            <DialogHeader className="mb-3">
              <DialogTitle className="text-center text-xl font-semibold text-primary">
                {actionConfig[activeActionAnimation].modalTitle}
              </DialogTitle>
            </DialogHeader>
            <div className="animate-pulse text-primary">
              {React.createElement(actionConfig[activeActionAnimation].icon, { size: 72, strokeWidth: 1.5 })}
            </div>
          </DialogContent>
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

    

    

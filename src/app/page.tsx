
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
import RechargeCard from '@/components/app/RechargeCard';

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

  // Efeito para buscar dados do jogador quando currentPlayerId muda (após uma busca bem sucedida)
  // e também para recarregar os dados se o jogador já estiver definido (ex: após uma recarga de saldo)
  useEffect(() => {
    const fetchPlayerData = async (id: string) => {
      setLoading(true); // Indicar carregamento ao re-buscar
      try {
        const response = await fetch('https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios.json');
        if (!response.ok) {
          throw new Error(`API request failed: ${response.statusText} (status ${response.status})`);
        }
        const allPlayersData: Record<string, Player> | null = await response.json();

        if (allPlayersData && typeof allPlayersData === 'object' && allPlayersData[id]) {
          setPlayerData(allPlayersData[id]);
        } else {
          // Se o jogador não for encontrado após uma recarga, pode ter sido um erro, ou o ID mudou.
          // Mantemos o erro da busca original se houver, ou informamos que não foi encontrado.
          if (!error) setError(`Player ID "${id}" not found or data format invalid.`);
        }
      } catch (err) {
        console.error('Fetch error:', err);
        if (!error) setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching data.');
      } finally {
        setLoading(false);
      }
    };

    if (currentPlayerId) {
      fetchPlayerData(currentPlayerId);
    }
  }, [currentPlayerId]); // Removido 'error' da dependência para evitar re-fetch desnecessário em caso de erro de busca.

  // Efeito para carregar e gerenciar cooldowns
  useEffect(() => {
    if (typeof window !== 'undefined' && currentPlayerId) {
      const loadedCooldowns: Record<ActionType, number> = { trabalhar: 0, pescar: 0, dormir: 0, treinar: 0 };
      (['trabalhar', 'pescar', 'dormir', 'treinar'] as ActionType[]).forEach(action => {
        const endTimeString = localStorage.getItem(`cooldown_${action}_${currentPlayerId}`);
        if (endTimeString) {
          const endTime = parseInt(endTimeString, 10);
          if (endTime > Date.now()) { // Só carrega se ainda estiver ativo
            loadedCooldowns[action] = endTime;
          } else { // Se expirou, remove do localStorage para garantir limpeza
            localStorage.removeItem(`cooldown_${action}_${currentPlayerId}`);
          }
        }
      });
      setActionCooldownEndTimes(loadedCooldowns);
    } else {
      // Resetar cooldowns se não houver jogador atual
      setActionCooldownEndTimes({ trabalhar: 0, pescar: 0, dormir: 0, treinar: 0 });
      setTimeLeftForAction({ trabalhar: null, pescar: null, dormir: null, treinar: null });
    }
  }, [currentPlayerId]);

  // Efeito para atualizar a exibição do tempo restante do cooldown
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
          // Se o cooldown expirou e o item ainda existe no localStorage (improvável devido à lógica de carregamento, mas como garantia)
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
         // Garantir limpeza do localStorage se o cooldown expirou e o item ainda existir
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
    // setCurrentPlayerId(null); // Será definido após busca bem-sucedida

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
    let updatedPlayerData = { ...playerData }; // Copia os dados atuais do jogador

    // Min 100, Max 500: Math.floor(Math.random() * (500 - 100 + 1)) + 100  => Math.floor(Math.random() * 401) + 100
    const randomReward = () => Math.floor(Math.random() * 401) + 100;

    switch (actionType) {
      case 'trabalhar':
        goldEarned = randomReward(); 
        xpEarned = randomReward();   
        actionTitle = "Você trabalhou duro!";
        break;
      case 'pescar':
        goldEarned = randomReward();  
        xpEarned = randomReward();   
        actionTitle = "Boa pescaria!";
        break;
      case 'dormir':
        // Dormir não dá ouro, apenas XP
        xpEarned = randomReward();   
        actionTitle = "Você descansou bem.";
        break;
      case 'treinar':
        // Treinar não dá ouro, apenas XP
        xpEarned = randomReward(); 
        actionTitle = "Treino concluído!";
        break;
    }
    
    // Atualiza os dados do jogador localmente
    updatedPlayerData.ouro = (playerData.ouro || 0) + goldEarned;
    updatedPlayerData.xp = (playerData.xp || 0) + xpEarned;
    
    setPlayerData(updatedPlayerData); // Reflete a mudança na UI imediatamente

    // Configura o cooldown
    const newCooldownEndTime = now + ACTION_COOLDOWN_DURATION;
    setActionCooldownEndTimes(prev => ({ ...prev, [actionType]: newCooldownEndTime }));
    if (typeof window !== 'undefined') {
      localStorage.setItem(`cooldown_${actionType}_${currentPlayerId}`, newCooldownEndTime.toString());
    }

    // Notifica o usuário sobre a recompensa
    toast({
      title: actionTitle,
      description: `Você ganhou ${goldEarned > 0 ? `${goldEarned} de ouro e ` : ''}${xpEarned} XP.`,
    });

    // Tenta salvar os dados atualizados no Firebase
    try {
      const updatePath = `https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${currentPlayerId}.json`;
      const response = await fetch(updatePath, {
        method: 'PATCH', // PATCH atualiza apenas os campos fornecidos
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ouro: updatedPlayerData.ouro, xp: updatedPlayerData.xp }),
      });

      if (!response.ok) {
        // Tenta obter mais detalhes do erro do Firebase
        const errorBody = await response.text();
        console.error('Firebase save error response body:', errorBody);
        // Tenta parsear, mas pode falhar se não for JSON
        let errorData = {};
        try {
          errorData = JSON.parse(errorBody);
        } catch (parseError) {
          console.warn('Could not parse Firebase error response as JSON:', parseError);
          errorData = { message: errorBody || 'Unknown Firebase error structure.' };
        }
        throw new Error(`Failed to save to Firebase: ${response.statusText} (status ${response.status}). Path: ${updatePath}. Details: ${JSON.stringify(errorData)}`);
      }
      // Notifica o usuário sobre o sucesso do salvamento
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
      // Opcional: Reverter a atualização local se o salvamento falhar?
      // setPlayerData(playerData); // Reverte para o estado anterior se o save falhar
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
          {loading && !playerData ? ( // Mostra spinner apenas na busca inicial
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

      {loading && !playerData && !error && <PlayerStatsSkeleton />} {/* Skeleton apenas na busca inicial e sem erro */}
      
      {!loading && playerData && !error && ( // Se não está carregando E tem dados E não tem erro
        <>
          <PlayerStatsCard playerData={playerData} />
          <PlayerActionsCard
            onAction={handlePlayerAction}
            timeLeftForAction={timeLeftForAction}
            isDisabled={!playerData || !currentPlayerId} // Desabilita se não houver jogador
          />
          <RechargeCard 
            playerId={currentPlayerId} 
            playerName={playerData?.nome}
            isDisabled={!playerData || !currentPlayerId} 
          />
        </>
      )}
       {loading && playerData && !error && ( // Se está carregando MAS JÁ TEM DADOS (ex: recarregando após recarga), mostra os dados atuais e um indicador sutil
        <>
          <div className="w-full max-w-lg text-center my-2">
            <span className="text-sm text-muted-foreground italic">Atualizando dados...</span>
          </div>
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

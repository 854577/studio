
'use client';

import React, { Suspense } from 'react';
import { useState, type FormEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Player } from '@/types/player';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, AlertCircle, ShoppingBag, KeyRound, Briefcase, Fish, Bed, Dumbbell, UserRound } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import PlayerStatsCard, { PlayerStatsSkeleton } from '@/components/app/PlayerStatsCard';
import PlayerActionsCard from '@/components/app/PlayerActionsCard';
import { Dialog, DialogContent as ShadDialogContent, DialogHeader as ShadDialogHeader, DialogTitle as ShadDialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';

export type ActionType = 'trabalhar' | 'pescar' | 'dormir' | 'treinar';
export const ACTION_COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hora em milissegundos

export const actionConfig = {
  trabalhar: { label: 'Trabalhar', icon: Briefcase, modalTitle: 'Trabalhando...' },
  pescar: { label: 'Pescar', icon: Fish, modalTitle: 'Pescando...' },
  dormir: { label: 'Dormir', icon: Bed, modalTitle: 'Descansando...' },
  treinar: { label: 'Treinar', icon: Dumbbell, modalTitle: 'Treinando...' },
};

function HomePageContent() {
  const searchParams = useSearchParams();
  const [playerIdInput, setPlayerIdInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
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
    const pidFromUrl = searchParams.get('playerId');
    const storedPlayerId = typeof window !== 'undefined' ? sessionStorage.getItem('currentPlayerId') : null;
    const storedPlayerDataString = typeof window !== 'undefined' ? sessionStorage.getItem('playerData') : null;

    if (pidFromUrl) {
      setPlayerIdInput(pidFromUrl);

      if (storedPlayerId && pidFromUrl === storedPlayerId) {
        if (storedPlayerDataString) {
          try {
            const parsedPlayerData: Player = JSON.parse(storedPlayerDataString);
            // Verifica se existe o nome do jogador ou se o objeto não está vazio
            if (parsedPlayerData && (parsedPlayerData.nome || Object.keys(parsedPlayerData).length > 0)) {
              setCurrentPlayerId(pidFromUrl);
              setPlayerData(parsedPlayerData);
              setError(null);
              return; 
            } else {
              // Se os dados parseados forem inválidos, limpa o sessionStorage
              if (typeof window !== 'undefined') {
                sessionStorage.removeItem('currentPlayerId');
                sessionStorage.removeItem('playerData');
              }
            }
          } catch (e) {
            console.error("Falha ao parsear playerData do sessionStorage", e);
            if (typeof window !== 'undefined') {
              sessionStorage.removeItem('currentPlayerId');
              sessionStorage.removeItem('playerData');
            }
          }
        }
      }
      
      // Se o pid da URL mudou e não corresponde ao jogador logado na sessão, limpa o jogador atual
      if (currentPlayerId && pidFromUrl !== currentPlayerId) {
        setPlayerData(null);
        setCurrentPlayerId(null); 
        setPasswordInput('');
        setError(null);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('currentPlayerId');
          sessionStorage.removeItem('playerData');
        }
      }
    } else {
      // Se não há pid na URL, e tínhamos um jogador logado, limpa tudo.
      if (currentPlayerId) {
        setPlayerIdInput('');
        setPasswordInput('');
        setCurrentPlayerId(null);
        setPlayerData(null);
        setError(null);
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('currentPlayerId');
          sessionStorage.removeItem('playerData');
        }
      }
    }
  }, [searchParams, currentPlayerId]);


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
            localStorage.removeItem(`cooldown_${action}_${currentPlayerId}`); // Limpa cooldown expirado
          }
        }
      });
      setActionCooldownEndTimes(loadedCooldowns);
    } else {
      // Se não há currentPlayerId, reseta os cooldowns para o estado inicial
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
        updateDisplay(); // Chama uma vez para exibir imediatamente
        const id = setInterval(updateDisplay, 1000);
        intervalIds.push(id);
      } else {
        // Garante que o tempo seja nulo se não houver cooldown ativo
         setTimeLeftForAction(prev => ({ ...prev, [action]: null }));
         // Remove do localStorage se existir e estiver expirado
         if (currentPlayerId && localStorage.getItem(`cooldown_${action}_${currentPlayerId}`)) {
             localStorage.removeItem(`cooldown_${action}_${currentPlayerId}`);
          }
      }
    });
    return () => {
      intervalIds.forEach(clearInterval);
    };
  }, [actionCooldownEndTimes, currentPlayerId]);

  const handleSearch = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    const trimmedId = playerIdInput.trim();
    const trimmedPassword = passwordInput.trim();

    if (!trimmedId) {
      setError('O nome do usuário não pode estar vazio.');
      setPlayerData(null); setCurrentPlayerId(null);
      if (typeof window !== 'undefined') { sessionStorage.removeItem('currentPlayerId'); sessionStorage.removeItem('playerData'); }
      // Não limpar passwordInput aqui, pode ser que o usuário só esqueceu o nome
      return;
    }
    if (!trimmedPassword) {
      setError('A senha não pode estar vazia.');
      // Não limpar playerData ou currentPlayerId aqui, pode ser que o usuário só esqueceu a senha para o jogador já no input
      return;
    }

    setLoading(true);
    setError(null);
    // Limpar playerData antes da busca garante que o form de login desapareça se a busca for para um novo jogador
    // e que o skeleton apareça.
    if (currentPlayerId !== trimmedId) { // Se está buscando um jogador diferente do logado (ou nenhum logado)
        setPlayerData(null);
    }


    try {
      const response = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${trimmedId}.json`);
      if (!response.ok) {
        if (response.status === 404 || (await response.clone().json()) === null) { // Verifica se o corpo da resposta é null
          setError(`Nome de usuário ou senha inválidos.`);
        } else {
          throw new Error(`Falha na API: ${response.statusText} (status ${response.status})`);
        }
        setPlayerData(null); setCurrentPlayerId(null);
        setPasswordInput(''); // Limpar senha em caso de falha na busca
        if (typeof window !== 'undefined') { sessionStorage.removeItem('currentPlayerId'); sessionStorage.removeItem('playerData'); }
        setLoading(false);
        return;
      }
      const fetchedPlayerData: Player | null = await response.json();

      if (fetchedPlayerData && fetchedPlayerData.senha !== undefined) {
        if (fetchedPlayerData.senha === trimmedPassword) {
          setPlayerData(fetchedPlayerData);
          setError(null); // Sucesso no login
          setCurrentPlayerId(trimmedId);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('currentPlayerId', trimmedId);
            sessionStorage.setItem('playerData', JSON.stringify(fetchedPlayerData));
            const currentUrl = new URL(window.location.href);
            currentUrl.searchParams.set('playerId', trimmedId);
            window.history.pushState({}, '', currentUrl.toString());
          }
          // Não limpar passwordInput aqui em caso de sucesso, o formulário vai sumir
        } else {
          setError(`Nome de usuário ou senha inválidos.`);
          setPlayerData(null); setCurrentPlayerId(null);
          setPasswordInput(''); // Limpar senha se a senha estiver incorreta
          if (typeof window !== 'undefined') { sessionStorage.removeItem('currentPlayerId'); sessionStorage.removeItem('playerData'); }
        }
      } else {
        setError(`Nome de usuário ou senha inválidos.`);
        setPlayerData(null); setCurrentPlayerId(null);
        setPasswordInput(''); // Limpar senha se jogador não encontrado ou sem campo senha
        if (typeof window !== 'undefined') { sessionStorage.removeItem('currentPlayerId'); sessionStorage.removeItem('playerData'); }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido ao buscar dados.');
      setPlayerData(null); setCurrentPlayerId(null);
      setPasswordInput(''); // Limpar senha em caso de erro de fetch
      if (typeof window !== 'undefined') { sessionStorage.removeItem('currentPlayerId'); sessionStorage.removeItem('playerData'); }
    } finally {
      setLoading(false);
      // Não limpar passwordInput aqui no 'finally' para o caso de erro onde o usuário pode querer corrigir só um campo
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
        description: `Você precisa esperar ${timeLeftForAction[actionType]} para ${actionConfig[actionType].label.toLowerCase()} novamente.`,
        variant: "destructive",
      });
      return;
    }

    setIsActionInProgress(true);
    setActiveActionAnimation(actionType);

    setTimeout(async () => {
      // Re-verificar playerData e currentPlayerId aqui, pois podem ter mudado
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
      let updatedPlayerData = { ...playerData }; // Cria uma cópia para modificar
      const randomReward = () => Math.floor(Math.random() * (500 - 100 + 1)) + 100;

      switch (actionType) {
        case 'trabalhar': goldEarned = randomReward(); xpEarned = randomReward(); actionToastTitle = "Você trabalhou duro!"; break;
        case 'pescar': goldEarned = randomReward(); xpEarned = randomReward(); actionToastTitle = "Boa pescaria!"; break;
        case 'dormir': xpEarned = randomReward(); actionToastTitle = "Você descansou bem."; break;
        case 'treinar': xpEarned = randomReward(); actionToastTitle = "Treino concluído!"; break;
      }
      updatedPlayerData.ouro = (playerData.ouro || 0) + goldEarned;
      updatedPlayerData.xp = (playerData.xp || 0) + xpEarned;
      setPlayerData(updatedPlayerData); // Atualiza o estado local com as recompensas
      if (typeof window !== 'undefined') { // Atualiza também o sessionStorage
        sessionStorage.setItem('playerData', JSON.stringify(updatedPlayerData));
      }

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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ouro: updatedPlayerData.ouro, xp: updatedPlayerData.xp }),
        });
        if (!response.ok) {
          const errorBody = await response.text(); console.error('Firebase save error response body:', errorBody);
          let errorData; try { errorData = JSON.parse(errorBody); } catch (parseError) { errorData = { message: errorBody || 'Unknown Firebase error.' }; }
          throw new Error(`Falha ao salvar no Firebase: ${response.statusText} (status ${response.status}). Detalhes: ${JSON.stringify(errorData)}`);
        }
        toast({ title: "Progresso Salvo!", description: "Suas recompensas foram salvas no banco de dados." });
      } catch (saveError) {
        console.error('Firebase save error:', saveError);
        // Atualiza o estado de erro global da página se o save falhar
        setError(`Erro ao salvar: ${saveError instanceof Error ? saveError.message : 'Desconhecido'}. Ouro e XP podem não ter sido salvos no servidor.`);
        toast({
          title: "Erro ao Salvar",
          description: `Não foi possível salvar os dados no Firebase. ${saveError instanceof Error ? saveError.message : 'Erro desconhecido.'}`,
          variant: "destructive", duration: 7000,
        });
      } finally {
        setActiveActionAnimation(null);
        setIsActionInProgress(false);
      }
    }, 1500); // Duração da animação
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 sm:p-8 pt-12 sm:pt-20">
      <header className="mb-10 sm:mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-2 tracking-tight">RPG himiko</h1>
      </header>

      {/* Skeleton Loader - Mostrado apenas durante o carregamento inicial de um jogador */}
      {loading && !playerData && <PlayerStatsSkeleton />}

      {/* Error Alert - Mostrado se houver erro e não estiver logado/carregando dados de jogador */}
      {error && !playerData && !loading && (
        <Alert variant="destructive" className="w-full max-w-md mb-6 shadow-lg animate-in fade-in-0 duration-500">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro de Acesso</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Login Form - Mostrado se não houver dados de jogador E não estiver carregando */}
      {!playerData && !loading && (
        <Card className="w-full max-w-md mb-8 animate-in fade-in-0 slide-in-from-top-12 duration-700 ease-out shadow-2xl border-border/50">
          <CardHeader className="pt-8 pb-4">
            <CardTitle className="text-3xl text-center font-bold tracking-tight text-primary">
              Bem-vindo!
            </CardTitle>
            <CardDescription className="text-center pt-1 text-muted-foreground">
              Acesse seu perfil para continuar sua aventura.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <form onSubmit={handleSearch} className="space-y-6">
              <div>
                <Label htmlFor="playerIdInput" className="sr-only">Nome do usuário</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserRound className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="playerIdInput"
                    type="text"
                    value={playerIdInput}
                    onChange={(e) => setPlayerIdInput(e.target.value)}
                    placeholder="Nome do usuário"
                    className="pl-10 h-12 text-base block w-full rounded-md border-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    aria-label="Nome do usuário Input"
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="passwordInput" className="sr-only">Senha</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="passwordInput"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Senha"
                    className="pl-10 h-12 text-base block w-full rounded-md border-input shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    aria-label="Password Input"
                    required
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading || !playerIdInput.trim() || !passwordInput.trim()}
                className="h-12 w-full flex justify-center items-center bg-primary hover:bg-primary/90 text-primary-foreground text-base font-semibold rounded-md shadow-md transition-transform duration-150 ease-in-out hover:scale-105 active:scale-95"
                aria-label="Buscar Jogador"
              >
                {loading && !playerData ? ( // Mostrar spinner apenas se estiver carregando e não tiver dados de jogador (login)
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground"></div>
                ) : (
                  <Search size={20} className="mr-2" />
                )}
                Buscar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}


      {/* Player Data Section - Mostrado se os dados do jogador estiverem carregados e não houver erro de login */}
      {!loading && playerData && !error && currentPlayerId && (
        <div className="w-full max-w-lg animate-in fade-in-0 duration-500">
          <PlayerStatsCard playerData={playerData} />
          <PlayerActionsCard
            onAction={handlePlayerAction}
            timeLeftForAction={timeLeftForAction}
            actionConfig={actionConfig}
            isDisabled={!playerData || !currentPlayerId || isActionInProgress}
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
        </div>
      )}

      {/* Erro Pós-Login (ex: erro ao salvar ação) */}
      {error && playerData && !loading && (
        <Alert variant="destructive" className="w-full max-w-md mt-6 shadow-lg animate-in fade-in-0 duration-500">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Ocorreu um Problema</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {activeActionAnimation && actionConfig[activeActionAnimation] && (
        <Dialog open={!!activeActionAnimation} onOpenChange={() => { setActiveActionAnimation(null); setIsActionInProgress(false); }}>
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

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando...</div>}>
      <HomePageContent />
    </Suspense>
  );
}


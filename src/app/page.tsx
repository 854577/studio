
'use client';

import React, { useState, type FormEvent, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Player } from '@/types/player';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, AlertCircle, UserRound, KeyRound, ShoppingBag, Dices } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import PlayerStatsCard from '@/components/app/PlayerStatsCard';
import PlayerActionsCard from '@/components/app/PlayerActionsCard';

const ACTION_COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hora em milissegundos
type ActionType = 'trabalhar' | 'pescar' | 'dormir' | 'treinar';

const actionConfig: Record<ActionType, { icon: React.ElementType, goldRange: [number, number], xpRange: [number, number], title: string, modalTitle: string }> = {
  trabalhar: { icon: UserRound, goldRange: [100, 500], xpRange: [100, 500], title: "Você trabalhou duro!", modalTitle: "Trabalhando..." }, // Placeholder icon
  pescar: { icon: UserRound, goldRange: [100, 500], xpRange: [100, 500], title: "Boa pescaria!", modalTitle: "Pescando..." }, // Placeholder icon
  dormir: { icon: UserRound, goldRange: [0, 0], xpRange: [100, 500], title: "Você descansou bem.", modalTitle: "Descansando..." }, // Placeholder icon
  treinar: { icon: UserRound, goldRange: [0, 0], xpRange: [100, 500], title: "Treino intenso!", modalTitle: "Treinando..." }, // Placeholder icon
};


function HomePageInternal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [playerIdInput, setPlayerIdInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null); // Erros gerais (pós-login)
  const [loginError, setLoginError] = useState<string | null>(null); // Erros específicos de login


  const [actionCooldownEndTimes, setActionCooldownEndTimes] = useState<Record<ActionType, number>>({
    trabalhar: 0, pescar: 0, dormir: 0, treinar: 0,
  });
  const [timeLeftForAction, setTimeLeftForAction] = useState<Record<ActionType, string | null>>({
    trabalhar: null, pescar: null, dormir: null, treinar: null,
  });

  const [activeActionAnimation, setActiveActionAnimation] = useState<ActionType | null>(null);
  const [isActionInProgress, setIsActionInProgress] = useState<boolean>(false);

 useEffect(() => {
    const pidFromUrl = searchParams.get('playerId');

    if (pidFromUrl) {
      const sessionPlayerId = sessionStorage.getItem('currentPlayerId');
      const sessionPlayerData = sessionStorage.getItem('playerData');

      if (sessionPlayerId === pidFromUrl && sessionPlayerData) {
        try {
          const parsedData = JSON.parse(sessionPlayerData);
          setPlayerData(parsedData);
          setCurrentPlayerId(sessionPlayerId);
          setPlayerIdInput(pidFromUrl);
          // Não limpar a senha aqui se estamos restaurando a sessão
        } catch (e) {
          console.error("Failed to parse session player data", e);
          sessionStorage.removeItem('currentPlayerId');
          sessionStorage.removeItem('playerData');
          // Limpar senha se a restauração da sessão falhar e o ID da URL é diferente do jogador carregado (se houver)
          if (currentPlayerId && pidFromUrl !== currentPlayerId) {
            setPasswordInput('');
          }
        }
      } else {
        // Se o ID da URL é diferente do jogador atual (e havia um jogador atual), é um novo contexto de login
        if (currentPlayerId && pidFromUrl !== currentPlayerId) {
          setPlayerData(null);
          setCurrentPlayerId(null);
          setPasswordInput(''); // Limpar senha para novo login
          setLoginError(null);
          setError(null);
        } else if (!currentPlayerId) { // Se não havia jogador atual, apenas preenche o input de ID
           // Não limpar a senha aqui, pode ser uma tentativa de login direto via URL
        }
        setPlayerIdInput(pidFromUrl);
      }
    } else {
      // Se não há playerId na URL, limpar tudo, incluindo a senha, se havia um jogador logado
      if (currentPlayerId) {
        setPlayerData(null);
        setCurrentPlayerId(null);
        setPlayerIdInput('');
        setPasswordInput('');
        sessionStorage.removeItem('currentPlayerId');
        sessionStorage.removeItem('playerData');
        setLoginError(null);
        setError(null);
      }
    }
  }, [searchParams, currentPlayerId]); // Adicionado currentPlayerId aqui para reavaliar se ele mudar externamente


  useEffect(() => {
    if (typeof window !== 'undefined' && currentPlayerId) {
      const loadedCooldowns: Record<ActionType, number> = { trabalhar: 0, pescar: 0, dormir: 0, treinar: 0 };
      (Object.keys(actionConfig) as ActionType[]).forEach(action => {
        const endTimeStr = localStorage.getItem(`cooldown_${action}_${currentPlayerId}`);
        if (endTimeStr) {
          const endTime = parseInt(endTimeStr, 10);
          if (endTime > Date.now()) { 
            loadedCooldowns[action] = endTime;
          } else {
            localStorage.removeItem(`cooldown_${action}_${currentPlayerId}`); 
          }
        }
      });
      setActionCooldownEndTimes(loadedCooldowns);
    } else {
      // Limpa os cooldowns se não houver jogador logado
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
          setTimeLeftForAction(prev => ({ ...prev, [action]: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` }));
        } else {
          setTimeLeftForAction(prev => ({ ...prev, [action]: null }));
          if (currentPlayerId && localStorage.getItem(`cooldown_${action}_${currentPlayerId}`)) {
            localStorage.removeItem(`cooldown_${action}_${currentPlayerId}`);
          }
        }
      };

      if (endTime > Date.now()) {
        updateDisplay(); // Chamada inicial para exibir o tempo sem esperar 1 segundo
        const id = setInterval(updateDisplay, 1000);
        intervalIds.push(id);
      } else {
         // Garante que, se o cooldown já expirou no carregamento, ele seja limpo visualmente e do localStorage
        setTimeLeftForAction(prev => ({ ...prev, [action]: null }));
        if (currentPlayerId && localStorage.getItem(`cooldown_${action}_${currentPlayerId}`)) {
            localStorage.removeItem(`cooldown_${action}_${currentPlayerId}`);
        }
      }
    });
    return () => intervalIds.forEach(clearInterval);
  }, [actionCooldownEndTimes, currentPlayerId]);

  const handleSearch = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    const trimmedId = playerIdInput.trim();

    if (!trimmedId || !passwordInput) {
      setLoginError('Nome de usuário e senha são obrigatórios.');
      setPlayerData(null); // Garante que dados antigos não sejam exibidos
      setCurrentPlayerId(null);
      sessionStorage.removeItem('currentPlayerId');
      sessionStorage.removeItem('playerData');
      // Não limpar passwordInput aqui, o usuário pode querer corrigir.
      return;
    }

    setLoading(true);
    setLoginError(null);
    setError(null); 
    // Não limpar playerData e currentPlayerId aqui para evitar piscar a UI se já estiver logado e for erro de senha
    
    try {
      const response = await fetch('https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios.json');
      if (!response.ok) throw new Error(`API request failed: ${response.statusText} (status ${response.status})`);
      
      const allPlayersData: Record<string, Player> | null = await response.json();
      const fetchedPlayerData = allPlayersData ? allPlayersData[trimmedId] : null;

      if (fetchedPlayerData && fetchedPlayerData.senha !== undefined) {
        if (fetchedPlayerData.senha === passwordInput) {
          setPlayerData(fetchedPlayerData);
          setCurrentPlayerId(trimmedId);
          // Não limpar passwordInput aqui, o formulário vai sumir
          if (searchParams.get('playerId') !== trimmedId) {
             window.history.pushState(null, '', `?playerId=${trimmedId}`);
          }
          sessionStorage.setItem('currentPlayerId', trimmedId);
          sessionStorage.setItem('playerData', JSON.stringify(fetchedPlayerData));
          // Não limpar passwordInput aqui, pois o formulário de login some
        } else {
          setLoginError('Nome de usuário ou senha inválidos.');
          setPlayerData(null); 
          setCurrentPlayerId(null);
          setPasswordInput(''); // Limpar senha em caso de falha
          sessionStorage.removeItem('currentPlayerId');
          sessionStorage.removeItem('playerData');
        }
      } else {
        setLoginError('Nome de usuário ou senha inválidos.');
        setPlayerData(null);
        setCurrentPlayerId(null);
        setPasswordInput(''); // Limpar senha em caso de falha
        sessionStorage.removeItem('currentPlayerId');
        sessionStorage.removeItem('playerData');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setLoginError(`Erro ao buscar dados: ${errorMessage}`);
      setPlayerData(null);
      setCurrentPlayerId(null);
      setPasswordInput(''); // Limpar senha em caso de falha
      sessionStorage.removeItem('currentPlayerId');
      sessionStorage.removeItem('playerData');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerAction = async (actionType: ActionType) => {
    if (!playerData || !currentPlayerId) {
      setError("Busque um jogador primeiro para realizar ações.");
      toast({ title: "Erro", description: "Busque um jogador primeiro para realizar ações.", variant: "destructive" });
      return;
    }

    const now = Date.now();
    if (actionCooldownEndTimes[actionType] > now) {
      toast({ title: "Ação em Cooldown", description: `Você precisa esperar ${timeLeftForAction[actionType]} para ${actionType} novamente.`, variant: "destructive" });
      return;
    }
    
    setIsActionInProgress(true);
    setActiveActionAnimation(actionType);

    // Simula a duração da animação e depois processa a ação
    setTimeout(async () => {
      // Refetch playerData to ensure we have the latest before calculating rewards
      // This also acts as a check if playerData became null during animation
      if (!currentPlayerId) { // Checagem adicional
        setActiveActionAnimation(null);
        setIsActionInProgress(false);
        setError("ID do jogador não encontrado. Por favor, faça login novamente.");
        toast({ title: "Erro", description: "ID do jogador não encontrado.", variant: "destructive" });
        return;
      }

      let currentPlayerDataForAction: Player | null = null;
      try {
        const response = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${currentPlayerId}.json`);
        if (!response.ok) throw new Error('Falha ao buscar dados atualizados do jogador.');
        currentPlayerDataForAction = await response.json();

        if (!currentPlayerDataForAction) { // Se o jogador foi deletado ou algo assim
          throw new Error('Não foi possível encontrar os dados atualizados do jogador.');
        }

      } catch (fetchErr) {
        setActiveActionAnimation(null);
        setIsActionInProgress(false);
        const message = fetchErr instanceof Error ? fetchErr.message : "Erro desconhecido ao buscar dados do jogador.";
        setError(message);
        toast({ title: "Erro de Sincronização", description: message, variant: "destructive" });
        return;
      }


      const config = actionConfig[actionType];
      const goldEarned = config.goldRange[0] === 0 && config.goldRange[1] === 0 ? 0 : Math.floor(Math.random() * (config.goldRange[1] - config.goldRange[0] + 1)) + config.goldRange[0];
      const xpEarned = config.xpRange[0] === 0 && config.xpRange[1] === 0 ? 0 : Math.floor(Math.random() * (config.xpRange[1] - config.xpRange[0] + 1)) + config.xpRange[0];
      
      const newOuro = (currentPlayerDataForAction.ouro || 0) + goldEarned;
      const newXp = (currentPlayerDataForAction.xp || 0) + xpEarned;

      const updatedLocalPlayerData = { ...currentPlayerDataForAction, ouro: newOuro, xp: newXp };
      setPlayerData(updatedLocalPlayerData); // Atualiza localmente primeiro para feedback rápido
      sessionStorage.setItem('playerData', JSON.stringify(updatedLocalPlayerData));


      try {
        const firebaseResponse = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${currentPlayerId}.json`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ouro: newOuro, xp: newXp }),
        });
        if (!firebaseResponse.ok) {
          let errorDetail = `Status: ${firebaseResponse.status} - ${firebaseResponse.statusText}`;
          try { const errorData = await firebaseResponse.json(); if (errorData && errorData.error) errorDetail = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error); } catch (e) { /* ignore */ }
          throw new Error(`Falha ao salvar no Firebase: ${errorDetail}. Tentando salvar em rpgUsuarios/${currentPlayerId}.json`);
        }
        toast({ title: config.title, description: `Você ganhou ${goldEarned > 0 ? `${goldEarned} de ouro e ` : ''}${xpEarned} XP. Dados salvos no servidor!` });
      } catch (err) {
        console.error('Detalhes do erro ao salvar no Firebase:', { message: err instanceof Error ? err.message : String(err), playerId: currentPlayerId, dataAttemptedToSave: { ouro: newOuro, xp: newXp }, originalError: err });
        // O estado local já foi atualizado, então o usuário vê as recompensas.
        // A mensagem de erro informa sobre a falha no salvamento no servidor.
        setError(err instanceof Error ? err.message : "Não foi possível salvar os dados no servidor.");
        toast({ title: "Erro ao Salvar no Servidor", description: err instanceof Error ? err.message : "Não foi possível salvar os dados no servidor. Suas recompensas foram aplicadas localmente.", variant: "destructive" });
      }

      const newCooldownEndTime = Date.now() + ACTION_COOLDOWN_DURATION;
      setActionCooldownEndTimes(prev => ({ ...prev, [actionType]: newCooldownEndTime }));
      if (typeof window !== 'undefined') localStorage.setItem(`cooldown_${actionType}_${currentPlayerId}`, newCooldownEndTime.toString());
      
      setActiveActionAnimation(null);
      setIsActionInProgress(false);

    }, 1500); // Duração da animação em milissegundos
  };

  const currentYear = new Date().getFullYear();

  // Determina o conteúdo a ser renderizado
  let contentToRender;
  if (loading && !playerData) {
    contentToRender = <PlayerStatsCard isLoading={true} />;
  } else if (!playerData && !loading) { // Formulário de Login
    contentToRender = (
      <>
        {loginError && (
          <Alert variant="destructive" className="w-full max-w-md mb-6 shadow-lg">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Erro de Login</AlertTitle>
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}
        <Card className="w-full max-w-md p-6 pt-4 shadow-xl sm:p-8 sm:pt-6 bg-card border-border/50 animate-in fade-in-0 slide-in-from-top-8 duration-500">
          <CardHeader className="p-0 pb-4 mb-4 text-center border-b">
            <CardTitle className="text-2xl text-primary">Bem-vindo!</CardTitle>
            <CardDescription>Acesse seu perfil para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="relative">
                <UserRound className="absolute w-5 h-5 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={playerIdInput}
                  onChange={(e) => { setPlayerIdInput(e.target.value); setLoginError(null); }}
                  placeholder="Nome de usuário"
                  className="pl-10 text-base h-11"
                  aria-label="Nome de usuário Input"
                />
              </div>
              <div className="relative">
                <KeyRound className="absolute w-5 h-5 left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setLoginError(null);}}
                  placeholder="Senha"
                  className="pl-10 text-base h-11"
                  aria-label="Password Input"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !playerIdInput.trim() || !passwordInput}
                className="w-full h-12 text-base font-semibold transition-transform bg-primary hover:bg-primary/90 text-primary-foreground active:scale-95"
                aria-label="Buscar Jogador"
              >
                {loading ? (
                  <div className="w-5 h-5 border-t-2 border-b-2 rounded-full animate-spin border-primary-foreground"></div>
                ) : (
                  <Search size={20} />
                )}
                <span className="ml-2">Buscar</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </>
    );
  } else if (playerData && !loginError && !loading) { // Dados do Jogador
    contentToRender = (
      <div className="w-full max-w-4xl">
         {error && ( // Erro geral pós-login
          <Alert variant="destructive" className="w-full max-w-md mx-auto mb-6 shadow-lg">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Ocorreu um Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <PlayerStatsCard playerData={playerData} />
        <PlayerActionsCard
          playerData={playerData}
          currentPlayerId={currentPlayerId}
          onAction={handlePlayerAction}
          actionCooldownEndTimes={actionCooldownEndTimes}
          timeLeftForAction={timeLeftForAction}
          isActionInProgress={isActionInProgress}
          disabled={!playerData || !currentPlayerId || isActionInProgress}
        />
         <Card className="w-full max-w-lg mt-8 shadow-xl bg-card border-border/50 mx-auto">
          <CardHeader>
              <CardTitle className="flex items-center text-xl">
                  <ShoppingBag size={24} className="mr-2 text-primary" />
                  Loja do Jogador
              </CardTitle>
              <CardDescription>Compre itens para sua aventura.</CardDescription>
          </CardHeader>
          <CardContent>
              <Button 
                  onClick={() => router.push(`/loja?playerId=${currentPlayerId}`)} 
                  className="w-full"
                  disabled={!currentPlayerId}
              >
                  Acessar Loja
              </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 pt-12 bg-background text-foreground sm:p-8 sm:pt-20">
      
      <header className="mb-10 text-center sm:mb-12">
        <h1 className="flex items-center justify-center text-5xl font-extrabold tracking-tight sm:text-6xl">
          <Dices size={44} className="mr-3 text-primary shrink-0" />
          <span className="text-muted-foreground">RPG</span>
          <span className="ml-2 text-primary">himiko</span>
        </h1>
      </header>

      {contentToRender}
      
      {activeActionAnimation && actionConfig[activeActionAnimation] && (
        <Dialog open={!!activeActionAnimation} onOpenChange={() => {/* controlada pelo estado */}}>
          <DialogContent className="sm:max-w-[280px] p-8">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="mb-4 text-2xl">{actionConfig[activeActionAnimation].modalTitle}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center animate-pulse text-primary">
              {React.createElement(actionConfig[activeActionAnimation].icon, { size: 72, strokeWidth: 1.5 })}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <footer className="w-full max-w-lg mt-12 mb-8 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; {currentYear} Yuri Draco. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="w-10 h-10 border-t-4 border-b-4 rounded-full animate-spin border-primary"></div><p className="ml-4 text-lg">Carregando...</p></div>}>
      <HomePageInternal />
    </Suspense>
  );
}

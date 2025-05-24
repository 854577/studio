
'use client';

import React, { useState, type FormEvent, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Player } from '@/types/player';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, AlertCircle, UserRound, KeyRound, ShoppingBag, Dices, Loader2, Gamepad2 } from 'lucide-react'; //Gamepad2 adicionado
import { useToast } from "@/hooks/use-toast";
import PlayerStatsCard from '@/components/app/PlayerStatsCard';
import PlayerActionsCard from '@/components/app/PlayerActionsCard';

const ACTION_COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hora em milissegundos
type ActionType = 'trabalhar' | 'pescar' | 'dormir' | 'treinar';

export const actionConfig: Record<ActionType, { icon: React.ElementType, goldRange: [number, number], xpRange: [number, number], title: string, modalTitle: string }> = {
  trabalhar: { icon: Briefcase, goldRange: [100, 500], xpRange: [100, 500], title: "Você trabalhou duro!", modalTitle: "Trabalhando..." },
  pescar: { icon: Fish, goldRange: [100, 500], xpRange: [100, 500], title: "Boa pescaria!", modalTitle: "Pescando..." },
  dormir: { icon: Bed, goldRange: [0, 0], xpRange: [100, 500], title: "Você descansou bem.", modalTitle: "Descansando..." },
  treinar: { icon: Dumbbell, goldRange: [0, 0], xpRange: [100, 500], title: "Treino intenso!", modalTitle: "Treinando..." },
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
  const [error, setError] = useState<string | null>(null); // Erro geral pós-login
  const [loginError, setLoginError] = useState<string | null>(null); // Erro específico do login


  const [actionCooldownEndTimes, setActionCooldownEndTimes] = useState<Record<ActionType, number>>({
    trabalhar: 0, pescar: 0, dormir: 0, treinar: 0,
  });
  const [timeLeftForAction, setTimeLeftForAction] = useState<Record<ActionType, string | null>>({
    trabalhar: null, pescar: null, dormir: null, treinar: null,
  });

  const [activeActionAnimation, setActiveActionAnimation] = useState<ActionType | null>(null);
  const [isActionInProgress, setIsActionInProgress] = useState<boolean>(false);
  const [currentActionLoading, setCurrentActionLoading] = useState<ActionType | null>(null);

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
          // Não limpamos passwordInput aqui, pois o usuário já está "logado" na sessão
        } catch (e) {
          console.error("Failed to parse session player data", e);
          sessionStorage.removeItem('currentPlayerId');
          sessionStorage.removeItem('playerData');
          // Se falhar ao carregar da sessão, e o ID da URL for diferente, limpar tudo
           if (currentPlayerId && pidFromUrl !== currentPlayerId) {
            setPasswordInput(''); 
            setPlayerData(null);
            setCurrentPlayerId(null);
          }
        }
      } else {
        // Se não há sessão correspondente, ou o ID da URL é para um novo jogador
        if (currentPlayerId && pidFromUrl !== currentPlayerId) {
          setPlayerData(null); 
          setCurrentPlayerId(null); 
          setPasswordInput(''); 
          setLoginError(null); // Limpa erro de login anterior
          setError(null); // Limpa erro geral anterior
        }
        setPlayerIdInput(pidFromUrl); 
      }
    } else {
      // Se não há playerId na URL, considera logout
      if (currentPlayerId) { // Havia um jogador logado?
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
  }, [searchParams, currentPlayerId]); // Adicionado currentPlayerId para reavaliar se ele mudar externamente


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
            // Cooldown expirado, remover do localStorage
            localStorage.removeItem(`cooldown_${action}_${currentPlayerId}`); 
          }
        }
      });
      setActionCooldownEndTimes(loadedCooldowns);
    } else {
      // Se não há currentPlayerId, reseta os cooldowns na memória
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
          // Limpar do localStorage se o timer interno expirar
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
        // Garantir que o estado visual seja null se já expirou
        setTimeLeftForAction(prev => ({ ...prev, [action]: null }));
        // E limpar do localStorage se ainda existir por alguma razão
         if (currentPlayerId && localStorage.getItem(`cooldown_${action}_${currentPlayerId}`)) {
            localStorage.removeItem(`cooldown_${action}_${currentPlayerId}`);
        }
      }
    });
    // Limpar intervalos quando o componente desmontar ou as dependências mudarem
    return () => intervalIds.forEach(clearInterval);
  }, [actionCooldownEndTimes, currentPlayerId]);

  const handleSearch = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    const trimmedId = playerIdInput.trim();

    if (!trimmedId || !passwordInput) {
      setLoginError('Nome de usuário e senha são obrigatórios.');
      setPlayerData(null); 
      setCurrentPlayerId(null);
      sessionStorage.removeItem('currentPlayerId');
      sessionStorage.removeItem('playerData');
      return;
    }

    setLoading(true);
    setLoginError(null);
    setError(null); 
    setPlayerData(null); // Limpa dados antigos antes da nova busca
    setCurrentPlayerId(null); // Limpa jogador antigo
    
    try {
      const response = await fetch('https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios.json');
      if (!response.ok) throw new Error(`API request failed: ${response.statusText} (status ${response.status})`);
      
      const allPlayersData: Record<string, Player> | null = await response.json();
      const fetchedPlayerData = allPlayersData ? allPlayersData[trimmedId] : null;

      if (fetchedPlayerData && fetchedPlayerData.senha !== undefined) {
        if (fetchedPlayerData.senha === passwordInput) {
          setPlayerData(fetchedPlayerData);
          setCurrentPlayerId(trimmedId);
          if (searchParams.get('playerId') !== trimmedId) {
             window.history.pushState(null, '', `?playerId=${trimmedId}`);
          }
          sessionStorage.setItem('currentPlayerId', trimmedId);
          sessionStorage.setItem('playerData', JSON.stringify(fetchedPlayerData));
          // Não limpar passwordInput aqui para login bem-sucedido
        } else {
          setLoginError('Nome de usuário ou senha inválidos.');
          setPasswordInput(''); 
          sessionStorage.removeItem('currentPlayerId');
          sessionStorage.removeItem('playerData');
        }
      } else {
        setLoginError('Nome de usuário ou senha inválidos.');
        setPasswordInput('');
        sessionStorage.removeItem('currentPlayerId');
        sessionStorage.removeItem('playerData');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setLoginError(`Erro ao buscar dados: ${errorMessage}`);
      setPasswordInput(''); 
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
    setCurrentActionLoading(actionType); 

    // Pequeno delay para o spinner aparecer antes do diálogo de animação
    await new Promise(resolve => setTimeout(resolve, 300)); 
    
    setActiveActionAnimation(actionType);
    setCurrentActionLoading(null); // Limpa o loading do botão específico

    setTimeout(async () => {
      // Re-verificar playerData e currentPlayerId pois podem ter mudado
      if (!currentPlayerId || !playerData) { 
        setActiveActionAnimation(null);
        setIsActionInProgress(false);
        const msg = !currentPlayerId ? "ID do jogador não encontrado." : "Dados do jogador não encontrados.";
        setError(`${msg} Por favor, faça login novamente.`);
        toast({ title: "Erro de Sessão", description: msg, variant: "destructive" });
        return;
      }

      let currentPlayerDataForAction: Player | null = null;
      try {
        // Buscar os dados MAIS RECENTES do jogador antes de aplicar a ação
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

      // Atualiza o estado local IMEDIATAMENTE para feedback visual
      const updatedLocalPlayerData = { ...currentPlayerDataForAction, ouro: newOuro, xp: newXp };
      setPlayerData(updatedLocalPlayerData); // ATENÇÃO: Isso usa currentPlayerDataForAction que foi recém-buscado
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
        setError(err instanceof Error ? err.message : "Não foi possível salvar os dados no servidor.");
        toast({ title: "Erro ao Salvar no Servidor", description: err instanceof Error ? err.message : "Não foi possível salvar os dados no servidor. Suas recompensas foram aplicadas localmente.", variant: "destructive" });
      }

      const newCooldownEndTime = Date.now() + ACTION_COOLDOWN_DURATION;
      setActionCooldownEndTimes(prev => ({ ...prev, [actionType]: newCooldownEndTime }));
      if (typeof window !== 'undefined') localStorage.setItem(`cooldown_${actionType}_${currentPlayerId}`, newCooldownEndTime.toString());
      
      setActiveActionAnimation(null);
      setIsActionInProgress(false);

    }, 1200); // Duração da animação
  };

  const currentYear = new Date().getFullYear();

  let contentToRender;

  if (loading && !playerData && !loginError) {
    contentToRender = (
      <div className="flex flex-col items-center justify-center flex-grow mt-10">
        <Loader2 className="w-16 h-16 text-primary " />
        <p className="mt-4 text-lg text-muted-foreground">Buscando informações do jogador...</p>
      </div>
    );
  } else if (!playerData && !loading) { // Tela de Login
    contentToRender = (
      <div className="flex flex-col items-center justify-center flex-grow w-full max-w-md px-4 ">
        {loginError && (
          <Alert variant="destructive" className="w-full mb-6 shadow-lg">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Erro de Login</AlertTitle>
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}
        <Card className="w-full p-6 pt-4 shadow-xl sm:p-8 sm:pt-6 bg-card border-border/50 ">
          <CardHeader className="p-0 pb-6 mb-6 text-center border-b border-border/30">
            <CardTitle className="text-3xl font-bold text-primary">Bem-vindo!</CardTitle>
            <CardDescription className="mt-1 text-muted-foreground">Acesse seu perfil para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 ">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="relative">
                <UserRound className="absolute w-5 h-5 left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={playerIdInput}
                  onChange={(e) => { setPlayerIdInput(e.target.value); setLoginError(null); }}
                  placeholder="Nome de usuário"
                  className="pl-12 text-base rounded-md h-12 focus-visible:ring-primary focus-visible:ring-2 "
                  aria-label="Nome de usuário Input"
                />
              </div>
              <div className="relative">
                <KeyRound className="absolute w-5 h-5 left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setLoginError(null);}}
                  placeholder="Senha"
                  className="pl-12 text-base rounded-md h-12 focus-visible:ring-primary focus-visible:ring-2 "
                  aria-label="Password Input"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !playerIdInput.trim() || !passwordInput}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-md "
                aria-label="Buscar Jogador"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 " />
                ) : (
                  <Search size={20} />
                )}
                <span className="ml-2">Buscar</span>
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  } else if (playerData && !loginError && !loading) { // Perfil do Jogador
    contentToRender = (
      <div className="w-full max-w-5xl px-2 space-y-8 ">
         {error && ( // Erro geral pós-login
          <Alert variant="destructive" className="w-full max-w-md mx-auto my-4 shadow-lg">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Ocorreu um Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <PlayerStatsCard playerData={playerData} isLoading={loading && !!currentPlayerId && !playerData} />

        <Accordion type="multiple" defaultValue={['player-actions']} className="w-full space-y-6">
          <AccordionItem value="player-actions" className="bg-card border border-border/50 rounded-lg shadow-md overflow-hidden">
            <AccordionTrigger className="px-6 py-4 text-xl font-semibold text-primary hover:text-primary/90 hover:no-underline data-[state=open]:border-b data-[state=open]:border-border/30">
              <Gamepad2 size={24} className="mr-3" /> Ações do Jogador 
            </AccordionTrigger>
            <AccordionContent className="p-4 sm:p-6">
              <PlayerActionsCard
                playerData={playerData}
                currentPlayerId={currentPlayerId}
                onAction={handlePlayerAction}
                actionCooldownEndTimes={actionCooldownEndTimes}
                timeLeftForAction={timeLeftForAction}
                isActionInProgress={isActionInProgress}
                currentActionLoading={currentActionLoading}
                disabled={!playerData || !currentPlayerId || isActionInProgress}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="shop-link" className="bg-card border border-border/50 rounded-lg shadow-md overflow-hidden">
            <AccordionTrigger className="px-6 py-4 text-xl font-semibold text-primary hover:text-primary/90 hover:no-underline data-[state=open]:border-b data-[state=open]:border-border/30">
               Loja do Aventureiro
            </AccordionTrigger>
            <AccordionContent className="p-4 sm:p-6">
               <Button 
                  onClick={() => router.push(`/loja?playerId=${currentPlayerId}`)} 
                  className="w-full h-12 text-base bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md"
                  disabled={!currentPlayerId}
                  variant="secondary"
              >
                  <ShoppingBag size={20} className="mr-2" />
                  Acessar Loja
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    );
  } else if (loading && playerData) { // Carregando, mas já tem dados (skeleton para transição suave)
     contentToRender = (
      <div className="w-full max-w-5xl px-2 space-y-8 ">
        <PlayerStatsCard playerData={null} isLoading={true} />
         <div className="bg-card border border-border/50 rounded-lg shadow-md overflow-hidden p-6 space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-20 bg-muted rounded"></div>
                <div className="h-20 bg-muted rounded"></div>
            </div>
        </div>
         <div className="bg-card border border-border/50 rounded-lg shadow-md overflow-hidden p-6 space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-12 bg-muted rounded w-full"></div>
        </div>
      </div>
    );
  }


  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 pt-10 sm:pt-12 bg-background text-foreground">
      
      <header className="mb-8 text-center sm:mb-10">
        <h1 className="flex items-center justify-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          <Dices size={40} className="mr-3 text-primary shrink-0 sm:size-48 lg:size-52" />
          <span className="text-muted-foreground">RPG</span>
          <span className="ml-2 text-primary">himiko</span>
        </h1>
      </header>

      <div className="flex flex-col items-center justify-center w-full flex-grow">
        {contentToRender}
      </div>
      
      {activeActionAnimation && actionConfig[activeActionAnimation] && (
        <Dialog open={!!activeActionAnimation} onOpenChange={(open) => { if(!open) setActiveActionAnimation(null); }}>
          <DialogContent className="sm:max-w-[320px] p-8 bg-card border-border/50 rounded-lg shadow-2xl">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="mb-4 text-2xl font-semibold text-primary">{actionConfig[activeActionAnimation].modalTitle}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center text-primary">
              {React.createElement(actionConfig[activeActionAnimation].icon, { size: 80, strokeWidth: 1.5 })}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <footer className="w-full py-8 mt-12 text-center border-t border-border/20">
        <p className="text-xs text-muted-foreground">
          &copy; {currentYear} Yuri Draco. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

// Adicionando importações que podem estar faltando para os ícones de ação
import { Briefcase, Fish, Bed, Dumbbell } from 'lucide-react';

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="w-16 h-16 " />
        <p className="mt-4 text-lg text-muted-foreground">Carregando aplicação...</p>
      </div>
    }>
      <HomePageInternal />
    </Suspense>
  );
}
    

    
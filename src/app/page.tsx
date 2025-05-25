
'use client';

import React, { useState, type FormEvent, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Player } from '@/types/player';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Search, AlertCircle, UserRound, KeyRound, ShoppingBag, Dices, Loader2, Gamepad2, Briefcase, Fish, Bed, Dumbbell, Settings, Pencil, Lock, Edit, Users } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import PlayerStatsCard from '@/components/app/PlayerStatsCard';
import PlayerActionsCard from '@/components/app/PlayerActionsCard';
import CompactPlayerStats from '@/components/app/CompactPlayerStats'; // Novo componente
import { cn } from '@/lib/utils';
import { updatePlayerNameAction, updatePlayerPasswordAction } from './actions/playerActions';

const ACTION_COOLDOWN_DURATION = 60 * 60 * 1000; // 1 hora em milissegundos
type ActionType = 'trabalhar' | 'pescar' | 'dormir' | 'treinar';

interface ActionConfig {
  icon: React.ElementType;
  goldRange: [number, number];
  xpRange: [number, number];
  title: string;
  modalTitle: string;
}

export const actionConfig: Record<ActionType, ActionConfig> = {
  trabalhar: { icon: Briefcase, goldRange: [100, 500], xpRange: [100, 500], title: "Você trabalhou duro!", modalTitle: "Trabalhando..." },
  pescar: { icon: Fish, goldRange: [100, 500], xpRange: [100, 500], title: "Boa pescaria!", modalTitle: "Pescando..." },
  dormir: { icon: Bed, goldRange: [100, 500], xpRange: [100, 500], title: "Você descansou bem.", modalTitle: "Descansando..." },
  treinar: { icon: Dumbbell, goldRange: [100, 500], xpRange: [100, 500], title: "Treino intenso!", modalTitle: "Treinando..." },
};

const ADMIN_PLAYER_ID = '5521994361356';

function HomePageInternal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [playerIdInput, setPlayerIdInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);
  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [actionCooldownEndTimes, setActionCooldownEndTimes] = useState<Record<ActionType, number>>({
    trabalhar: 0, pescar: 0, dormir: 0, treinar: 0,
  });
  const [timeLeftForAction, setTimeLeftForAction] = useState<Record<ActionType, string | null>>({
    trabalhar: null, pescar: null, dormir: null, treinar: null,
  });

  const [activeActionAnimation, setActiveActionAnimation] = useState<ActionType | null>(null);
  const [isActionInProgress, setIsActionInProgress] = useState<boolean>(false);
  const [currentActionLoading, setCurrentActionLoading] = useState<ActionType | null>(null);

  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [allPlayers, setAllPlayers] = useState<Record<string, Player> | null>(null);
  const [loadingAllPlayers, setLoadingAllPlayers] = useState<boolean>(false);
  const [adminPanelError, setAdminPanelError] = useState<string | null>(null);

  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<{ id: string; player: Player } | null>(null);
  const [editUserNewName, setEditUserNewName] = useState('');
  const [editUserNewPassword, setEditUserNewPassword] = useState('');
  const [isUpdatingOtherUserName, setIsUpdatingOtherUserName] = useState(false);
  const [isUpdatingOtherUserPassword, setIsUpdatingOtherUserPassword] = useState(false);

  const fetchAllPlayers = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingAllPlayers(true);
    setAdminPanelError(null);
    try {
      const response = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios.json`);
      if (!response.ok) {
        throw new Error(`Falha ao buscar todos os jogadores: ${response.statusText} (status ${response.status})`);
      }
      const data: Record<string, Player> | null = await response.json();
      setAllPlayers(data);
    } catch (err) {
      console.error("Erro ao buscar todos os jogadores:", err);
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      setAdminPanelError(errorMessage);
    } finally {
      setLoadingAllPlayers(false);
    }
  }, [isAdmin]);


  useEffect(() => {
    const pidFromUrl = searchParams.get('playerId');
    const sessionPlayerId = sessionStorage.getItem('currentPlayerId');
    const sessionPlayerData = sessionStorage.getItem('playerData');
    const sessionIsAdmin = sessionStorage.getItem('isAdmin');

    if (pidFromUrl) {
      setPlayerIdInput(pidFromUrl);
      if (sessionPlayerId === pidFromUrl && sessionPlayerData) {
        try {
          const parsedData = JSON.parse(sessionPlayerData);
          setPlayerData(parsedData);
          setCurrentPlayerId(sessionPlayerId);
          setIsAdmin(sessionIsAdmin === 'true');
        } catch (e) {
          console.error("Falha ao parsear dados do jogador da sessão", e);
          sessionStorage.removeItem('currentPlayerId');
          sessionStorage.removeItem('playerData');
          sessionStorage.removeItem('isAdmin');
          if (currentPlayerId && pidFromUrl !== currentPlayerId) {
            setPasswordInput('');
            setPlayerData(null);
            setCurrentPlayerId(null);
            setIsAdmin(false);
            setLoginError(null);
            setError(null);
          }
        }
      } else {
        if (currentPlayerId && pidFromUrl !== currentPlayerId) {
          setPlayerData(null);
          setCurrentPlayerId(null);
          setIsAdmin(false);
          setPasswordInput('');
          setLoginError(null);
          setError(null);
          sessionStorage.removeItem('currentPlayerId');
          sessionStorage.removeItem('playerData');
          sessionStorage.removeItem('isAdmin');
        }
      }
    } else {
      if (currentPlayerId) {
        setPlayerData(null);
        setCurrentPlayerId(null);
        setIsAdmin(false);
        setPlayerIdInput('');
        setPasswordInput('');
        sessionStorage.removeItem('currentPlayerId');
        sessionStorage.removeItem('playerData');
        sessionStorage.removeItem('isAdmin');
        setLoginError(null);
        setError(null);
      }
    }
  }, [searchParams, currentPlayerId]);


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
    return () => intervalIds.forEach(clearInterval);
  }, [actionCooldownEndTimes, currentPlayerId]);

  const handleSearch = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    const trimmedId = playerIdInput.trim();

    if (!trimmedId || !passwordInput) {
      setLoginError('Nome de usuário e senha são obrigatórios.');
      setPlayerData(null);
      setCurrentPlayerId(null);
      setIsAdmin(false);
      sessionStorage.removeItem('currentPlayerId');
      sessionStorage.removeItem('playerData');
      sessionStorage.removeItem('isAdmin');
      return;
    }

    setLoading(true);
    setLoginError(null);
    setError(null);
    setPlayerData(null);
    setCurrentPlayerId(null);
    setIsAdmin(false);

    try {
      const response = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${trimmedId}.json`);
      if (!response.ok) throw new Error(`API request failed: ${response.statusText} (status ${response.status})`);

      const fetchedPlayerData: Player | null = await response.json();

      if (fetchedPlayerData && fetchedPlayerData.senha !== undefined) {
        if (fetchedPlayerData.senha === passwordInput) {
          const currentIsAdmin = trimmedId === ADMIN_PLAYER_ID;
          const playerDataToSet = { ...fetchedPlayerData, nome: fetchedPlayerData.nome || trimmedId };
          setPlayerData(playerDataToSet);
          setCurrentPlayerId(trimmedId);
          setIsAdmin(currentIsAdmin);

          if (searchParams.get('playerId') !== trimmedId) {
            router.push(`/?playerId=${trimmedId}`, { scroll: false });
          }
          sessionStorage.setItem('currentPlayerId', trimmedId);
          sessionStorage.setItem('playerData', JSON.stringify(playerDataToSet));
          sessionStorage.setItem('isAdmin', String(currentIsAdmin));
        } else {
          setLoginError('Nome de usuário ou senha inválidos.');
          setPasswordInput('');
          sessionStorage.removeItem('currentPlayerId');
          sessionStorage.removeItem('playerData');
          sessionStorage.removeItem('isAdmin');
        }
      } else {
        setLoginError('Jogador não encontrado ou sem dados de senha.');
        setPasswordInput('');
        sessionStorage.removeItem('currentPlayerId');
        sessionStorage.removeItem('playerData');
        sessionStorage.removeItem('isAdmin');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setLoginError(`Erro ao buscar dados: ${errorMessage}`);
      setPasswordInput('');
      sessionStorage.removeItem('currentPlayerId');
      sessionStorage.removeItem('playerData');
      sessionStorage.removeItem('isAdmin');
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

    await new Promise(resolve => setTimeout(resolve, 300));

    setActiveActionAnimation(actionType);
    setCurrentActionLoading(null);


    setTimeout(async () => {
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
        const response = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${currentPlayerId}.json`);
        if (!response.ok) throw new Error('Falha ao buscar dados atualizados do jogador para a ação.');
        currentPlayerDataForAction = await response.json();

        if (!currentPlayerDataForAction) {
          throw new Error('Não foi possível encontrar os dados atualizados do jogador para a ação.');
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
      const goldEarned = Math.floor(Math.random() * (config.goldRange[1] - config.goldRange[0] + 1)) + config.goldRange[0];
      const xpEarned = Math.floor(Math.random() * (config.xpRange[1] - config.xpRange[0] + 1)) + config.xpRange[0];

      const newOuro = (currentPlayerDataForAction.ouro || 0) + goldEarned;
      const newXp = (currentPlayerDataForAction.xp || 0) + xpEarned;

      const updatedLocalPlayerData = { ...currentPlayerDataForAction, nome: currentPlayerDataForAction.nome || currentPlayerId, ouro: newOuro, xp: newXp };
      setPlayerData(updatedLocalPlayerData); // Update local state immediately for responsiveness
      sessionStorage.setItem('playerData', JSON.stringify(updatedLocalPlayerData));


      try {
        const firebaseResponse = await fetch(
          `https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${currentPlayerId}.json`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ouro: newOuro, xp: newXp }),
          }
        );
        if (!firebaseResponse.ok) {
          let errorDetail = `Status: ${firebaseResponse.status} - ${firebaseResponse.statusText}`;
          try { const errorData = await firebaseResponse.json(); if (errorData && errorData.error) errorDetail = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error); } catch (e) { /* ignore parsing error */ }
          throw new Error(`Falha ao salvar no Firebase (${currentPlayerId}): ${errorDetail}. As recompensas foram aplicadas localmente mas não salvas no servidor.`);
        }
        toast({ title: config.title, description: `Você ganhou ${goldEarned > 0 ? `${goldEarned} de ouro e ` : ''}${xpEarned} XP. Dados salvos no servidor!` });
      } catch (err) {
        console.error('Detalhes do erro ao salvar no Firebase:', { message: err instanceof Error ? err.message : String(err), playerId: currentPlayerId, dataAttemptedToSave: { ouro: newOuro, xp: newXp }, originalError: err });
        setError(err instanceof Error ? err.message : "Não foi possível salvar os dados no servidor. Suas recompensas foram aplicadas localmente.");
        toast({ title: "Erro ao Salvar no Servidor", description: err instanceof Error ? err.message : "Não foi possível salvar os dados no servidor. Suas recompensas foram aplicadas localmente.", variant: "destructive" });
      }


      const newCooldownEndTime = Date.now() + ACTION_COOLDOWN_DURATION;
      setActionCooldownEndTimes(prev => ({ ...prev, [actionType]: newCooldownEndTime }));
      if (typeof window !== 'undefined') localStorage.setItem(`cooldown_${actionType}_${currentPlayerId}`, newCooldownEndTime.toString());

      setActiveActionAnimation(null);
      setIsActionInProgress(false);

    }, 1200);
  };

  const handleChangeName = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentPlayerId || !newName.trim()) {
      toast({ title: "Erro", description: "Novo nome não pode estar vazio.", variant: "destructive" });
      return;
    }
    setIsUpdatingName(true);
    const result = await updatePlayerNameAction(currentPlayerId, newName);
    setIsUpdatingName(false);

    if (result.success && result.updatedPlayer?.nome && playerData) {
      toast({ title: "Sucesso!", description: result.message });
      const updatedData = { ...playerData, nome: result.updatedPlayer.nome };
      setPlayerData(updatedData);
      sessionStorage.setItem('playerData', JSON.stringify(updatedData));
      setNewName('');
    } else {
      toast({ title: "Erro ao Alterar Nome", description: result.message, variant: "destructive" });
    }
  };

  const handleChangePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentPlayerId || !newPassword) {
      toast({ title: "Erro", description: "Nova senha não pode estar vazia.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 4) {
      toast({ title: "Erro", description: "A nova senha deve ter pelo menos 4 caracteres.", variant: "destructive" });
      return;
    }
    setIsUpdatingPassword(true);
    const result = await updatePlayerPasswordAction(currentPlayerId, newPassword);
    setIsUpdatingPassword(false);

    if (result.success && result.updatedPlayer?.senha && playerData) {
      toast({ title: "Sucesso!", description: result.message });
      const updatedData = { ...playerData, senha: result.updatedPlayer.senha };
      setPlayerData(updatedData);
      sessionStorage.setItem('playerData', JSON.stringify(updatedData));
      setNewPassword('');
    } else {
      toast({ title: "Erro ao Alterar Senha", description: result.message, variant: "destructive" });
    }
  };

  const handleOpenEditUserDialog = (id: string, player: Player) => {
    setEditingUser({ id, player });
    setEditUserNewName(player.nome || id);
    setEditUserNewPassword(''); // Don't prefill password
    setIsEditUserDialogOpen(true);
  };

  const handleUpdateOtherUserName = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingUser || !editUserNewName.trim()) {
      toast({ title: "Erro", description: "Novo nome não pode estar vazio.", variant: "destructive" });
      return;
    }
    setIsUpdatingOtherUserName(true);
    const result = await updatePlayerNameAction(editingUser.id, editUserNewName);
    setIsUpdatingOtherUserName(false);

    if (result.success) {
      toast({ title: "Sucesso!", description: `Nome de ${editingUser.id} atualizado para ${editUserNewName}.` });
      // Optionally refresh allPlayers list or update in place
      if (allPlayers && result.updatedPlayer?.nome) {
        setAllPlayers(prev => ({
            ...prev,
            [editingUser.id]: {
                ...(prev ? prev[editingUser.id] : {}),
                nome: result.updatedPlayer.nome
            }
        }));
      }
      setIsEditUserDialogOpen(false);
    } else {
      toast({ title: "Erro ao Alterar Nome", description: result.message, variant: "destructive" });
    }
  };

  const handleUpdateOtherUserPassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingUser || !editUserNewPassword) {
      toast({ title: "Erro", description: "Nova senha não pode estar vazia.", variant: "destructive" });
      return;
    }
    if (editUserNewPassword.length < 4) {
      toast({ title: "Erro", description: "A nova senha deve ter pelo menos 4 caracteres.", variant: "destructive" });
      return;
    }
    setIsUpdatingOtherUserPassword(true);
    const result = await updatePlayerPasswordAction(editingUser.id, editUserNewPassword);
    setIsUpdatingOtherUserPassword(false);

    if (result.success) {
      toast({ title: "Sucesso!", description: `Senha de ${editingUser.id} atualizada.` });
      // Optionally update local allPlayers state if it stores password (it shouldn't)
      setIsEditUserDialogOpen(false);
    } else {
      toast({ title: "Erro ao Alterar Senha", description: result.message, variant: "destructive" });
    }
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
  } else if (!playerData && !loading) {
    contentToRender = (
      <div className="flex flex-col items-center justify-center flex-grow w-full max-w-md px-4">
        {loginError && (
          <Alert variant="destructive" className="w-full mb-6 shadow-lg card-glow">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Erro de Login</AlertTitle>
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}
        <Card className={cn("w-full p-6 pt-4 shadow-xl sm:p-8 sm:pt-6 bg-card border-border/50 card-glow data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-[2%]")}>
          <CardHeader className="p-0 pb-6 mb-6 text-center border-b border-border/30">
            <CardTitle className="text-3xl font-bold text-primary">Bem-vindo!</CardTitle>
            <CardDescription className="mt-1 text-muted-foreground">Acesse seu perfil para continuar.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="relative">
                <UserRound className="absolute w-5 h-5 left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  value={playerIdInput}
                  onChange={(e) => { setPlayerIdInput(e.target.value); setLoginError(null); }}
                  placeholder="Nome de usuário"
                  className="pl-12 text-base rounded-md h-12 focus-visible:ring-primary focus-visible:ring-2 shadow-sm"
                  aria-label="Nome de usuário Input"
                />
              </div>
              <div className="relative">
                <KeyRound className="absolute w-5 h-5 left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setLoginError(null); }}
                  placeholder="Senha"
                  className="pl-12 text-base rounded-md h-12 focus-visible:ring-primary focus-visible:ring-2 shadow-sm"
                  aria-label="Password Input"
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !playerIdInput.trim() || !passwordInput}
                className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-transform active:scale-95 shadow-md hover:shadow-lg"
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
  } else if (playerData && !loginError && !loading) {
    contentToRender = (
      <div className="w-full max-w-5xl px-2 space-y-8 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-[1%]">
        {error && !loginError && (
          <Alert variant="destructive" className="w-full max-w-md mx-auto my-4 shadow-lg card-glow">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Ocorreu um Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <PlayerStatsCard playerData={playerData} isLoading={loading && !!currentPlayerId && !playerData} />

        <Accordion type="multiple" defaultValue={['player-actions']} className="w-full space-y-6">
          <AccordionItem value="player-actions" className="bg-card border border-border/50 rounded-lg shadow-xl overflow-hidden card-glow">
            <AccordionTrigger className="px-6 py-4 text-xl font-semibold text-primary hover:text-primary/90 hover:no-underline data-[state=open]:border-b data-[state=open]:border-border/30 [&[data-state=open]>svg]:[transform:rotate(0deg)]">
              <Gamepad2 size={24} className="mr-3 data-[state=open]:rotate-0" /> Ações do Jogador
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

          <AccordionItem value="shop-link" className="bg-card border border-border/50 rounded-lg shadow-xl overflow-hidden card-glow">
            <AccordionTrigger className="px-6 py-4 text-xl font-semibold text-primary hover:text-primary/90 hover:no-underline data-[state=open]:border-b data-[state=open]:border-border/30 [&[data-state=open]>svg]:[transform:rotate(0deg)]">
              Loja do Aventureiro
            </AccordionTrigger>
            <AccordionContent className="p-4 sm:p-6">
              <Button
                onClick={() => router.push(`/loja?playerId=${currentPlayerId}`)}
                className="w-full h-12 text-base bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-md shadow-md hover:shadow-lg"
                disabled={!currentPlayerId}
                variant="secondary"
              >
                <ShoppingBag size={20} className="mr-2" />
                Acessar Loja
              </Button>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="account-settings" className="bg-card border border-border/50 rounded-lg shadow-xl overflow-hidden card-glow">
            <AccordionTrigger className="px-6 py-4 text-xl font-semibold text-primary hover:text-primary/90 hover:no-underline data-[state=open]:border-b data-[state=open]:border-border/30 [&[data-state=open]>svg]:[transform:rotate(0deg)]">
              <Settings size={24} className="mr-3" /> Configurações da Conta
            </AccordionTrigger>
            <AccordionContent className="p-4 sm:p-6 space-y-6">
              <Card className="bg-card/80 border-border/50 shadow-lg card-glow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-primary"><Pencil size={20} className="mr-2" />Alterar Nome</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangeName} className="space-y-4">
                    <Input
                      type="text"
                      placeholder="Novo nome"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="text-base rounded-md h-11 focus-visible:ring-primary focus-visible:ring-2 shadow-sm"
                    />
                    <Button type="submit" disabled={isUpdatingName || !newName.trim()} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md">
                      {isUpdatingName ? <Loader2 className="w-5 h-5 mr-2 " /> : 'Salvar Nome'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border/50 shadow-lg card-glow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-primary"><Lock size={20} className="mr-2" />Alterar Senha</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input
                      type="password"
                      placeholder="Nova senha"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="text-base rounded-md h-11 focus-visible:ring-primary focus-visible:ring-2 shadow-sm"
                    />
                    <Button type="submit" disabled={isUpdatingPassword || !newPassword.trim() || newPassword.length < 4} className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md">
                      {isUpdatingPassword ? <Loader2 className="w-5 h-5 mr-2 " /> : 'Salvar Senha'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </AccordionContent>
          </AccordionItem>

          {isAdmin && (
            <AccordionItem value="admin-panel" className="bg-card border border-border/50 rounded-lg shadow-xl overflow-hidden card-glow">
              <AccordionTrigger
                className="px-6 py-4 text-xl font-semibold text-accent hover:text-accent/90 hover:no-underline data-[state=open]:border-b data-[state=open]:border-border/30 [&[data-state=open]>svg]:[transform:rotate(0deg)]"
                onClick={() => { if (!allPlayers) fetchAllPlayers(); }}
              >
                <Users size={24} className="mr-3" /> Painel do Administrador
              </AccordionTrigger>
              <AccordionContent className="p-4 sm:p-6">
                {loadingAllPlayers && (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-10 h-10 text-primary " />
                    <p className="ml-3 text-muted-foreground">Carregando todos os jogadores...</p>
                  </div>
                )}
                {adminPanelError && (
                  <Alert variant="destructive" className="card-glow">
                    <AlertCircle className="w-4 h-4" />
                    <AlertTitle>Erro no Painel Admin</AlertTitle>
                    <AlertDescription>{adminPanelError}</AlertDescription>
                  </Alert>
                )}
                {allPlayers && !loadingAllPlayers && (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto">
                    {Object.entries(allPlayers).map(([id, p]) => (
                      <Card key={id} className="bg-card/70 border-border/50 card-glow">
                        <CardHeader className='p-4'>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg text-primary">{p.nome || id}</CardTitle>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditUserDialog(id, p)}
                              className="ml-auto"
                            >
                              <Pencil size={16} className="mr-2" /> Editar
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className='p-4 pt-0'>
                          <CompactPlayerStats player={p} />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

        </Accordion>
      </div>
    );
  } else if (loading && playerData) {
    contentToRender = (
      <div className="w-full max-w-5xl px-2 space-y-8">
        <PlayerStatsCard playerData={playerData} isLoading={true} />
        <div className="bg-card border border-border/50 rounded-lg shadow-xl overflow-hidden p-6 space-y-4 card-glow">
          <div className="h-8 bg-muted rounded w-1/3 "></div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted rounded "></div>)}
          </div>
        </div>
        <div className="bg-card border border-border/50 rounded-lg shadow-xl overflow-hidden p-6 space-y-4 card-glow">
          <div className="h-8 bg-muted rounded w-1/3 "></div>
          <div className="h-12 bg-muted rounded w-full "></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 pt-10 sm:pt-12 bg-background text-foreground">

      <header className="mb-8 text-center sm:mb-10">
        <h1 className="flex items-center justify-center text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
          <Dices size={40} className="mr-3 text-primary shrink-0 sm:mr-4 sm:size-12 lg:size-14" />
          <span className="text-muted-foreground">RPG</span>
          <span className="ml-2 text-primary">himiko</span>
        </h1>
      </header>

      <div className="flex flex-col items-center justify-center w-full flex-grow">
        {contentToRender}
      </div>

      {activeActionAnimation && actionConfig[activeActionAnimation] && (
        <Dialog open={!!activeActionAnimation} onOpenChange={(open) => { if (!open) setActiveActionAnimation(null); }}>
          <DialogContent className="sm:max-w-[320px] p-8 bg-card border-border/50 rounded-lg shadow-2xl card-glow">
            <DialogHeader className="items-center text-center">
              <DialogTitle className="mb-4 text-2xl font-semibold text-primary">{actionConfig[activeActionAnimation].modalTitle}</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center text-primary">
              {React.createElement(actionConfig[activeActionAnimation].icon, { size: 80, strokeWidth: 1.5, className: "" })}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {editingUser && (
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent className="sm:max-w-md bg-card border-border/50 card-glow">
            <DialogHeader>
              <DialogTitle className="text-primary">Editar Usuário: {editingUser.player.nome || editingUser.id}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <form onSubmit={handleUpdateOtherUserName} className="space-y-3">
                <Label htmlFor="editUserNewName" className="text-muted-foreground">Novo Nome</Label>
                <Input
                  id="editUserNewName"
                  value={editUserNewName}
                  onChange={(e) => setEditUserNewName(e.target.value)}
                  className="col-span-3"
                  placeholder="Novo nome do usuário"
                />
                <Button type="submit" disabled={isUpdatingOtherUserName || !editUserNewName.trim()} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isUpdatingOtherUserName ? <Loader2 className="mr-2 h-4 w-4 " /> : <Pencil className="mr-2 h-4 w-4" />}
                  Salvar Nome
                </Button>
              </form>
              <form onSubmit={handleUpdateOtherUserPassword} className="space-y-3">
                <Label htmlFor="editUserNewPassword" className="text-muted-foreground">Nova Senha</Label>
                <Input
                  id="editUserNewPassword"
                  type="password"
                  value={editUserNewPassword}
                  onChange={(e) => setEditUserNewPassword(e.target.value)}
                  className="col-span-3"
                  placeholder="Nova senha (mín. 4 caracteres)"
                />
                <Button type="submit" disabled={isUpdatingOtherUserPassword || !editUserNewPassword.trim() || editUserNewPassword.length < 4} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  {isUpdatingOtherUserPassword ? <Loader2 className="mr-2 h-4 w-4 " /> : <Lock className="mr-2 h-4 w-4" />}
                  Salvar Senha
                </Button>
              </form>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
            </DialogFooter>
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


export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="w-16 h-16 text-primary " />
        <p className="mt-4 text-lg text-muted-foreground">Carregando aplicação...</p>
      </div>
    }>
      <HomePageInternal />
    </Suspense>
  );
}

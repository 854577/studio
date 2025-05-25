
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
import { Label } from '@/components/ui/label';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertCircle, UserRound, KeyRound, ShoppingBag, Dices, Loader2, Gamepad2, Settings, Pencil, Lock, Users, Trash2, PlusCircle, Briefcase, Fish, Bed, Dumbbell, Store } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import PlayerStatsCard from '@/components/app/PlayerStatsCard';
import PlayerActionsCard from '@/components/app/PlayerActionsCard';
import CompactPlayerStats from '@/components/app/CompactPlayerStats';
import { cn } from '@/lib/utils';
import { updatePlayerNameAction, updatePlayerPasswordAction, adminUpdatePlayerFullAction } from './actions/playerActions';
import { itemDetails as allShopItems } from './loja/lojaData'; 


const ADMIN_PLAYER_IDS = ['5521994361356', 'HimikoToga', 'himiko'];

// Define ActionType locally as it was previously (implicitly or explicitly)
type ActionType = 'trabalhar' | 'pescar' | 'dormir' | 'treinar';


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


  const actionConfig: Record<ActionType, { title: string, modalTitle: string, icon: React.ElementType, goldRange: [number, number], xpRange: [number, number] }> = {
    trabalhar: { title: 'Trabalho Concluído!', modalTitle: 'Trabalhando...', icon: Briefcase, goldRange: [100, 500], xpRange: [100, 500] },
    pescar: { title: 'Pesca Realizada!', modalTitle: 'Pescando...', icon: Fish, goldRange: [100, 500], xpRange: [100, 500] },
    dormir: { title: 'Descanso Finalizado!', modalTitle: 'Dormindo...', icon: Bed, goldRange: [0,0], xpRange: [100, 500] }, 
    treinar: { title: 'Treino Concluído!', modalTitle: 'Treinando...', icon: Dumbbell, goldRange: [0,0], xpRange: [100, 500] }, 
  };


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
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserData, setEditingUserData] = useState<Partial<Player> | null>(null);
  
  const [adminNewItemName, setAdminNewItemName] = useState<string>('');
  const [adminNewItemQuantity, setAdminNewItemQuantity] = useState<number>(1);
  const [isUpdatingFullPlayer, setIsUpdatingFullPlayer] = useState(false);


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
          setLoginError(null);
          // Password input intentionally not cleared here to allow seamless re-display of login form if needed later by other logic
        } catch (e) {
          console.error("Falha ao parsear dados do jogador da sessão", e);
          sessionStorage.removeItem('currentPlayerId');
          sessionStorage.removeItem('playerData');
          sessionStorage.removeItem('isAdmin');
          setPlayerData(null);
          setCurrentPlayerId(null);
          setIsAdmin(false);
          setPasswordInput(''); // Clear password if session is broken
          setLoginError(null);
          setError(null);
        }
      } else {
        // pidFromUrl exists, but no matching session or no session data at all
        if (currentPlayerId && pidFromUrl !== currentPlayerId) {
          // Navigating to a different player profile via URL
          setPlayerData(null);
          setCurrentPlayerId(null);
          setIsAdmin(false);
          setPasswordInput(''); // Clear password for new login context
          setLoginError(null);
          setError(null);
          sessionStorage.removeItem('currentPlayerId');
          sessionStorage.removeItem('playerData');
          sessionStorage.removeItem('isAdmin');
        } else if (!currentPlayerId) {
          // No current player, but pid in URL (e.g. direct navigation, or returning to a specific player after session clear)
           // Don't clear password input here, allow handleSearch to manage it
           setLoginError(null);
           setError(null);
        }
        // If currentPlayerId === pidFromUrl but no sessionPlayerData, it implies a fresh load for this player
        // The password field might be empty or pre-filled by browser, let login proceed.
      }
    } else {
      // No playerId in URL
      if (currentPlayerId) { // If there was a player active, effectively log them out
        setPlayerData(null);
        setCurrentPlayerId(null);
        setIsAdmin(false);
        setPlayerIdInput('');
        setPasswordInput(''); // Clear password on logout
        sessionStorage.removeItem('currentPlayerId');
        sessionStorage.removeItem('playerData');
        sessionStorage.removeItem('isAdmin');
        setLoginError(null);
        setError(null);
      } else {
        // No pid in URL and no current player, ensure inputs are clear
        setPlayerIdInput('');
        setPasswordInput('');
      }
    }
  }, [searchParams]); // Removed currentPlayerId from dependencies to avoid potential loops and rely on pidFromUrl and session


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
    
    try {
      const response = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${trimmedId}.json`);
      if (!response.ok) throw new Error(`API request failed: ${response.statusText} (status ${response.status})`);

      const fetchedPlayerData: Player | null = await response.json();

      if (fetchedPlayerData && fetchedPlayerData.senha !== undefined) {
        if (fetchedPlayerData.senha === passwordInput) {
          const currentIsAdmin = ADMIN_PLAYER_IDS.includes(trimmedId);
          const playerDataToSet = { ...fetchedPlayerData, nome: fetchedPlayerData.nome || trimmedId };
          
          setPlayerData(playerDataToSet);
          setCurrentPlayerId(trimmedId);
          setIsAdmin(currentIsAdmin);

          // Update URL only if it's different, to avoid redundant history entries
          if (searchParams.get('playerId') !== trimmedId) {
            router.replace(`/?playerId=${trimmedId}`, { scroll: false });
          }
          sessionStorage.setItem('currentPlayerId', trimmedId);
          sessionStorage.setItem('playerData', JSON.stringify(playerDataToSet));
          sessionStorage.setItem('isAdmin', String(currentIsAdmin));
          // Do NOT clear passwordInput here if login is successful
        } else {
          setLoginError('Nome de usuário ou senha inválidos.');
          setPasswordInput(''); 
          setPlayerData(null); setCurrentPlayerId(null); setIsAdmin(false);
          sessionStorage.removeItem('currentPlayerId');
          sessionStorage.removeItem('playerData');
          sessionStorage.removeItem('isAdmin');
        }
      } else {
        setLoginError('Jogador não encontrado ou sem dados de senha.');
        setPasswordInput(''); 
        setPlayerData(null); setCurrentPlayerId(null); setIsAdmin(false);
        sessionStorage.removeItem('currentPlayerId');
        sessionStorage.removeItem('playerData');
        sessionStorage.removeItem('isAdmin');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setLoginError(`Erro ao buscar dados: ${errorMessage}`);
      setPasswordInput(''); 
      setPlayerData(null); setCurrentPlayerId(null); setIsAdmin(false);
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
      toast({ title: "Ação em Cooldown", description: `Você precisa esperar ${timeLeftForAction[actionType]} para ${actionConfig[actionType].modalTitle.toLowerCase().replace('...','')} novamente.`, variant: "destructive" });
      return;
    }
    
    setIsActionInProgress(true);
    setCurrentActionLoading(actionType); 

    await new Promise(resolve => setTimeout(resolve, 150)); 

    setActiveActionAnimation(actionType);


    setTimeout(async () => {
      if (!currentPlayerId || !playerData) { 
        setActiveActionAnimation(null); 
        setIsActionInProgress(false); 
        setCurrentActionLoading(null);
        const msg = !currentPlayerId ? "ID do jogador não encontrado." : "Dados do jogador não encontrados.";
        setError(`${msg} Por favor, faça login novamente.`);
        toast({ title: "Erro de Sessão", description: msg, variant: "destructive" });
        return;
      }

      let currentPlayerDataForAction: Player | null = null;
      try {
        const response = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${currentPlayerId}.json`);
        if (!response.ok) {
          throw new Error('Falha ao buscar dados atualizados do jogador para a ação.');
        }
        currentPlayerDataForAction = await response.json();

        if (!currentPlayerDataForAction) {
          throw new Error('Não foi possível encontrar os dados atualizados do jogador para a ação.');
        }
      } catch (fetchErr) {
        setActiveActionAnimation(null);
        setIsActionInProgress(false);
        setCurrentActionLoading(null);
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
      setPlayerData(updatedLocalPlayerData); 
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

      const newCooldownEndTime = Date.now() + (60 * 60 * 1000); 
      setActionCooldownEndTimes(prev => ({ ...prev, [actionType]: newCooldownEndTime }));
      if (typeof window !== 'undefined') localStorage.setItem(`cooldown_${actionType}_${currentPlayerId}`, newCooldownEndTime.toString());

      setActiveActionAnimation(null); 
      setIsActionInProgress(false); 
      setCurrentActionLoading(null);

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
    setEditingUserId(id);
    const initialEditingData: Partial<Player> = {
        nome: player.nome || id,
        senha: '', 
        vida: player.vida ?? 0,
        ouro: player.ouro ?? 0,
        nivel: player.nivel ?? 1,
        xp: player.xp ?? 0,
        energia: player.energia ?? 0,
        mana: player.mana ?? 0,
        inventario: player.inventario ? { ...player.inventario } : {},
    };
    setEditingUserData(initialEditingData);
    setAdminNewItemName('');
    setAdminNewItemQuantity(1);
    setIsEditUserDialogOpen(true);
  };

  const handleEditingUserDataChange = (field: keyof Player, value: string | number | Record<string, number>) => {
    setEditingUserData(prev => {
      if (!prev) return null;
      if (['vida', 'ouro', 'nivel', 'xp', 'energia', 'mana'].includes(field as string) && typeof value === 'string') {
        const numValue = parseInt(value, 10);
        return { ...prev, [field]: isNaN(numValue) ? 0 : numValue }; 
      }
      return { ...prev, [field]: value };
    });
  };
  
  const handleAdminInventoryItemQuantityChange = (itemName: string, quantityStr: string) => {
    const quantity = parseInt(quantityStr, 10);
    setEditingUserData(prev => {
        if (!prev || !prev.inventario) return prev;
        const newInventario = { ...prev.inventario };
        if (!isNaN(quantity) && quantity > 0) {
            newInventario[itemName] = quantity;
        } else if (!isNaN(quantity) && quantity <= 0) {
            delete newInventario[itemName]; 
        }
        return { ...prev, inventario: newInventario };
    });
  };

  const handleAdminRemoveInventoryItem = (itemName: string) => {
    setEditingUserData(prev => {
        if (!prev || !prev.inventario) return prev;
        const newInventario = { ...prev.inventario };
        delete newInventario[itemName];
        return { ...prev, inventario: newInventario };
    });
  };

  const handleAdminAddNewInventoryItem = () => {
    if (!adminNewItemName || adminNewItemQuantity <= 0) {
        toast({ title: "Erro", description: "Selecione um item e defina uma quantidade válida.", variant: "destructive" });
        return;
    }
    setEditingUserData(prev => {
        if (!prev) return prev;
        const newInventario = { ...(prev.inventario || {}) };
        newInventario[adminNewItemName] = (newInventario[adminNewItemName] || 0) + adminNewItemQuantity;
        return { ...prev, inventario: newInventario };
    });
    setAdminNewItemName(''); 
    setAdminNewItemQuantity(1);
  };


  const handleAdminUpdatePlayer = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingUserId || !editingUserData) {
      toast({ title: "Erro", description: "Nenhum usuário selecionado para edição.", variant: "destructive" });
      return;
    }

    setIsUpdatingFullPlayer(true);
    const payload: Partial<Player> = { ...editingUserData };

    if (!payload.senha?.trim()) {
      delete payload.senha;
    }

    const result = await adminUpdatePlayerFullAction(editingUserId, payload);
    setIsUpdatingFullPlayer(false);

    if (result.success && result.updatedPlayer) {
      toast({ title: "Sucesso!", description: `Dados de ${editingUserData.nome || editingUserId} atualizados.` });
      
      if (allPlayers) {
        setAllPlayers(prev => {
            if (!prev || !editingUserId) return null;
            const updatedPlayerLocally = { ...prev[editingUserId], ...result.updatedPlayer };
            if (result.updatedPlayer.inventario === undefined && payload.inventario && Object.keys(payload.inventario).length === 0) {
                updatedPlayerLocally.inventario = {}; 
            } else if (result.updatedPlayer.inventario === null) {
                updatedPlayerLocally.inventario = {};
            }
            return { ...prev, [editingUserId]: updatedPlayerLocally };
        });
      }
      if (currentPlayerId === editingUserId && playerData) {
        const updatedCurrentPlayerData = { ...playerData, ...result.updatedPlayer };
         if (result.updatedPlayer.inventario === undefined && payload.inventario && Object.keys(payload.inventario).length === 0) {
            updatedCurrentPlayerData.inventario = {};
        } else if (result.updatedPlayer.inventario === null) {
            updatedCurrentPlayerData.inventario = {};
        }
        setPlayerData(updatedCurrentPlayerData);
        sessionStorage.setItem('playerData', JSON.stringify(updatedCurrentPlayerData));
      }
      setIsEditUserDialogOpen(false);
      setEditingUserData(null);
      setEditingUserId(null);
    } else {
      toast({ title: "Erro ao Atualizar Jogador", description: result.message, variant: "destructive" });
    }
  };

  const currentYear = new Date().getFullYear();
  let contentToRender;

  if (loading && !playerData && !loginError) {
    contentToRender = (
      <div className="flex flex-col items-center justify-center flex-grow mt-10 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
        <Loader2 className="w-16 h-16 text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Buscando informações do jogador...</p>
      </div>
    );
  } else if (!playerData && !loading) {
    contentToRender = (
      <div className="flex flex-col items-center justify-center flex-grow w-full max-w-md px-4">
        {loginError && (
          <Alert variant="destructive" className="w-full mb-6 shadow-lg card-glow data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Erro de Login</AlertTitle>
            <AlertDescription>{loginError}</AlertDescription>
          </Alert>
        )}
        <Card className={cn(
          "w-full p-6 pt-4 shadow-xl sm:p-8 sm:pt-6 bg-card border-border/50 card-glow",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:slide-in-from-top-[2%]"
        )}
        data-state="open" 
        >
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
                  <Loader2 className="w-5 h-5" />
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
      <div className="w-full max-w-5xl px-2 space-y-8 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-[1%]"
        style={{ '--animate-duration': '300ms' } as React.CSSProperties}
        data-state="open" 
      >
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
              {isAdmin && (
                <Card className="bg-card/80 border-border/50 shadow-lg card-glow">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center text-primary"><Pencil size={20} className="mr-2" />Alterar Seu Nome</CardTitle>
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
                        {isUpdatingName ? <Loader2 className="w-5 h-5 mr-2" /> : 'Salvar Nome'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
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
                      {isUpdatingPassword ? <Loader2 className="w-5 h-5 mr-2" /> : 'Salvar Senha'}
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
                onClick={() => { if (!allPlayers && !loadingAllPlayers) fetchAllPlayers(); }}
              >
                <Users size={24} className="mr-3" /> Painel do Administrador
              </AccordionTrigger>
              <AccordionContent className="p-4 sm:p-6">
                {loadingAllPlayers && (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="w-10 h-10 text-primary" />
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
                {!loadingAllPlayers && allPlayers && Object.keys(allPlayers).length === 0 && (
                  <p className="text-center text-muted-foreground">Nenhum outro jogador encontrado.</p>
                )}
                {allPlayers && !loadingAllPlayers && Object.keys(allPlayers).length > 0 && (
                  <div className="max-h-[500px] overflow-y-auto pr-2">
                    <div className="space-y-4">
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
                  </div>
                )}
                 <Button 
                    variant="outline" 
                    onClick={fetchAllPlayers} 
                    disabled={loadingAllPlayers}
                    className="mt-4 w-full"
                  >
                    {loadingAllPlayers ? <Loader2 className="mr-2 h-4 w-4" /> : null}
                    Atualizar Lista de Jogadores
                  </Button>
              </AccordionContent>
            </AccordionItem>
          )}

        </Accordion>
      </div>
    );
  } else if (loading && playerData) { 
    contentToRender = (
      <div className="w-full max-w-5xl px-2 space-y-8 ">
        <PlayerStatsCard playerData={playerData} isLoading={true} />
        <div className="bg-card border border-border/50 rounded-lg shadow-xl overflow-hidden p-6 space-y-4 card-glow">
          <div className="h-8 bg-muted rounded w-1/3"></div> 
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-muted rounded"></div>)}
          </div>
        </div>
         <div className="bg-card border border-border/50 rounded-lg shadow-xl overflow-hidden p-6 space-y-4 card-glow">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-12 bg-muted rounded w-full"></div>
        </div>
      </div>
    );
  } else { 
     contentToRender = (
      <div className="flex flex-col items-center justify-center flex-grow mt-10">
        <Alert variant="destructive" className="max-w-md card-glow">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Estado Inesperado</AlertTitle>
            <AlertDescription>Por favor, tente recarregar a página ou fazer login novamente.</AlertDescription>
        </Alert>
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
              {React.createElement(actionConfig[activeActionAnimation].icon, { size: 80, strokeWidth: 1.5 })}
            </div>
          </DialogContent>
        </Dialog>
      )}

    {isEditUserDialogOpen && editingUserId && editingUserData && (
        <Dialog open={isEditUserDialogOpen} onOpenChange={setIsEditUserDialogOpen}>
          <DialogContent className="sm:max-w-2xl bg-card border-border/50 card-glow">
            <DialogHeader>
              <DialogTitle className="text-primary">Editar Usuário: {editingUserData.nome || editingUserId}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] p-1">
              <form onSubmit={handleAdminUpdatePlayer} className="space-y-4 p-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="adminEditName" className="text-muted-foreground">Nome</Label>
                    <Input
                      id="adminEditName"
                      value={editingUserData.nome || ''}
                      onChange={(e) => handleEditingUserDataChange('nome', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminEditPassword" className="text-muted-foreground">Nova Senha (deixe em branco para não alterar)</Label>
                    <Input
                      id="adminEditPassword"
                      type="password"
                      placeholder="Nova Senha (mín. 4 caracteres)"
                      value={editingUserData.senha || ''}
                      onChange={(e) => handleEditingUserDataChange('senha', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Stats */}
                <h3 className="text-lg font-semibold text-primary pt-2">Estatísticas</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(['vida', 'ouro', 'nivel', 'xp', 'energia', 'mana'] as (keyof Player)[]).map(statKey => (
                    <div key={statKey}>
                      <Label htmlFor={`adminEdit${statKey}`} className="capitalize text-muted-foreground">{statKey}</Label>
                      <Input
                        id={`adminEdit${statKey}`}
                        type="number"
                        value={editingUserData[statKey] as number ?? 0}
                        onChange={(e) => handleEditingUserDataChange(statKey, e.target.value)}
                        className="mt-1"
                        min="0" 
                      />
                    </div>
                  ))}
                </div>

                {/* Inventory */}
                <h3 className="text-lg font-semibold text-primary pt-2">Inventário</h3>
                <div className="space-y-3">
                  {editingUserData.inventario && Object.entries(editingUserData.inventario).map(([itemName, quantity]) => (
                    <div key={itemName} className="flex items-center gap-2 p-2 border rounded-md bg-background/50">
                      <span className="flex-grow capitalize text-sm">{itemName}</span>
                      <Input
                        type="number"
                        value={quantity}
                        onChange={(e) => handleAdminInventoryItemQuantityChange(itemName, e.target.value)}
                        className="w-20 h-8 text-sm"
                        min="0"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleAdminRemoveInventoryItem(itemName)} className="text-destructive hover:text-destructive/80 h-8 w-8">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                   {editingUserData.inventario && Object.keys(editingUserData.inventario).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">Inventário vazio.</p>
                  )}
                </div>
                
                <Card className="p-3 bg-background/30 card-glow">
                    <Label className="text-muted-foreground">Adicionar Novo Item ao Inventário</Label>
                    <div className="flex items-end gap-2 mt-1">
                    <div className="flex-grow">
                        <Label htmlFor="adminNewItemNameSelect" className="sr-only">Item</Label>
                        <Select value={adminNewItemName} onValueChange={setAdminNewItemName}>
                        <SelectTrigger id="adminNewItemNameSelect" className="h-9">
                            <SelectValue placeholder="Selecione um item" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.keys(allShopItems).sort().map(itemName => (
                            <SelectItem key={itemName} value={itemName} className="capitalize">
                                {itemName}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="adminNewItemQuantityInput" className="sr-only">Quantidade</Label>
                        <Input
                        id="adminNewItemQuantityInput"
                        type="number"
                        value={adminNewItemQuantity}
                        onChange={(e) => setAdminNewItemQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-20 h-9"
                        min="1"
                        />
                    </div>
                    <Button type="button" onClick={handleAdminAddNewInventoryItem} variant="outline" size="sm" className="h-9">
                        <PlusCircle size={16} className="mr-1" /> Adicionar
                    </Button>
                    </div>
                </Card>
                
                <DialogFooter className="pt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                  </DialogClose>
                  <Button type="submit" disabled={isUpdatingFullPlayer} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {isUpdatingFullPlayer ? <Loader2 className="mr-2 h-4 w-4" /> : <Pencil className="mr-2 h-4 w-4" />}
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </form>
            </ScrollArea>
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
        <Loader2 className="w-16 h-16 text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Carregando aplicação...</p>
      </div>
    }>
      <HomePageInternal />
    </Suspense>
  );
}

    

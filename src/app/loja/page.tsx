
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { shopCategoriesData, type ShopItem } from './lojaData';
import { purchaseItemAction } from '@/app/actions/shopActions';
import type { Player } from '@/types/player';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from "@/hooks/use-toast";
import { CircleDollarSign, ShoppingCart, ChevronLeft, Coins, Warehouse, Package, Gem } from 'lucide-react'; // Adicionado Package e Gem
import { Skeleton } from '@/components/ui/skeleton';

function LojaContent() {
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');
  const { toast } = useToast();

  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [isLoadingPlayer, setIsLoadingPlayer] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null); // Store item name being purchased

  const fetchPlayerData = async (id: string) => {
    setIsLoadingPlayer(true);
    setPlayerData(null); 
    try {
      const response = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${id}.json`);
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados do jogador. Status: ${response.status}`);
      }
      const data: Player | null = await response.json();
      if (!data) { 
         throw new Error(`Jogador com ID "${id}" não encontrado.`);
      }
      setPlayerData({ ...data, nome: data.nome || id }); 
    } catch (error) {
      console.error("Erro ao buscar dados do jogador:", error);
      toast({
        title: "Erro ao Carregar Jogador",
        description: error instanceof Error ? error.message : "Não foi possível carregar dados do jogador.",
        variant: "destructive",
      });
      setPlayerData(null); 
    } finally {
      setIsLoadingPlayer(false);
    }
  };

  useEffect(() => {
    if (playerId) {
      fetchPlayerData(playerId);
    } else {
      setIsLoadingPlayer(false);
      setPlayerData(null); 
      toast({
        title: "Loja Indisponível",
        description: "Nenhum ID de jogador fornecido para acessar a loja.",
        variant: "destructive"
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]); 

  const handlePurchase = async (item: ShopItem) => {
    if (!playerId || !playerData) {
      toast({ title: "Erro", description: "ID do jogador não disponível ou dados do jogador não carregados.", variant: "destructive" });
      return;
    }
    if ((playerData.ouro || 0) < item.price) {
      toast({ title: "Ouro Insuficiente", description: `Você não tem ouro suficiente para comprar ${item.name}.`, variant: "destructive" });
      return;
    }

    setIsPurchasing(item.name);
    const result = await purchaseItemAction(playerId, item.name, item.price);
    setIsPurchasing(null);

    if (result.success) {
      toast({
        title: "Compra Realizada!",
        description: result.message,
      });
      setPlayerData(prevData => {
        if (!prevData) return null; 
        return {
          ...prevData,
          ouro: result.newOuro,
          inventario: result.updatedInventory,
        };
      });
    } else {
      toast({
        title: "Falha na Compra",
        description: result.message,
        variant: "destructive",
      });
       if (result.message.includes("não encontrado")) {
        setPlayerData(null);
      }
    }
  };
  
  const currentYear = new Date().getFullYear();

  if (isLoadingPlayer && !playerData) { 
    return (
      <div className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 sm:p-8 pt-12">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-6 w-64 mb-8" />
        <div className="w-full max-w-2xl space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!playerId || !playerData) { 
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 text-center">
        <Warehouse size={64} className="mb-4 text-muted-foreground" />
        <h1 className="text-3xl font-bold mb-2">Loja Indisponível</h1>
        <p className="text-muted-foreground mb-6">
          {playerId ? "Não foi possível carregar os dados do jogador." : "Nenhum jogador selecionado."} Por favor, retorne à página inicial e busque por um jogador para acessar a loja.
        </p>
        <Button asChild variant="outline">
          <Link href="/">
            <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para a Página Inicial
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-background text-foreground p-4 sm:p-8 pt-12">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary mb-2 tracking-tight flex items-center justify-center">
          <ShoppingBasket size={40} className="mr-3" /> Loja do Aventureiro
        </h1>
        <p className="text-muted-foreground">Bem-vindo(a) à loja, {playerData.nome || playerId}!</p>
      </header>

      <Card className="w-full max-w-2xl mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Coins size={24} className="mr-2 text-[hsl(var(--chart-5))]" />
            Seu Ouro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-foreground">
            {(playerData.ouro || 0).toLocaleString()} Ouro
          </p>
        </CardContent>
      </Card>

      <Accordion type="multiple" className="w-full max-w-2xl">
        {shopCategoriesData.map((category) => (
          <AccordionItem value={category.name} key={category.name}>
            <AccordionTrigger className="text-xl font-semibold hover:no-underline">
              {category.name}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2">
                {category.items.map((item) => {
                  const IconComponent = item.icon || Package; // Fallback para ícone Package
                  return (
                    <Card key={item.name} className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3 pt-4 items-center text-center">
                        <IconComponent size={36} className="mb-2 text-primary" />
                        <CardTitle className="text-lg capitalize">{item.name}</CardTitle>
                        <CardDescription className="text-sm">
                          Preço: {item.price.toLocaleString()} <span className="text-xs">Ouro</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2">
                        <Button
                          onClick={() => handlePurchase(item)}
                          disabled={isPurchasing === item.name || (playerData.ouro || 0) < item.price}
                          className="w-full"
                          variant={(playerData.ouro || 0) < item.price ? "secondary": "default"}
                        >
                          {isPurchasing === item.name ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground"></div>
                          ) : (
                            <>
                              <ShoppingCart size={18} className="mr-2" /> Comprar
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <Button asChild variant="outline" className="mt-12">
        <Link href={`/?playerId=${playerId}`}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para Perfil
        </Link>
      </Button>

      <footer className="w-full max-w-lg mt-12 pt-8 border-t border-border/30 text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {currentYear} Yuri Draco. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

export default function LojaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-background text-foreground p-6 text-xl">Carregando loja...</div>}>
      <LojaContent />
    </Suspense>
  );
}

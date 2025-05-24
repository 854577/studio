
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
import { CircleDollarSign, ShoppingCart, ChevronLeft, Coins, Warehouse } from 'lucide-react';
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
    try {
      const response = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${id}.json`);
      if (!response.ok) {
        throw new Error(`Jogador não encontrado ou erro na API (${response.status})`);
      }
      const data: Player = await response.json();
      if (!data) { // Firebase returns null for non-existent paths
         throw new Error(`Jogador com ID "${id}" não encontrado.`);
      }
      setPlayerData({ ...data, nome: data.nome || id }); // Garante que playerData tenha um nome
    } catch (error) {
      console.error("Erro ao buscar dados do jogador:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível carregar dados do jogador.",
        variant: "destructive",
      });
      setPlayerData(null); // Garante que não há dados de jogador se a busca falhar
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
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  const handlePurchase = async (item: ShopItem) => {
    if (!playerId || !playerData) {
      toast({ title: "Erro", description: "ID do jogador não disponível.", variant: "destructive" });
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
      // Atualizar dados do jogador localmente
      setPlayerData(prevData => ({
        ...prevData!,
        ouro: result.newOuro,
        inventario: result.updatedInventory,
      }));
    } else {
      toast({
        title: "Falha na Compra",
        description: result.message,
        variant: "destructive",
      });
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
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
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
          <ShoppingCart size={40} className="mr-3" /> Loja do Jogador
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
                {category.items.map((item) => (
                  <Card key={item.name} className="flex flex-col justify-between shadow-md hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg capitalize">{item.name}</CardTitle>
                      <CardDescription>Preço: {item.price.toLocaleString()} Ouro</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                ))}
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

// Adicionando Suspense Boundary para useSearchParams
export default function LojaPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Carregando loja...</div>}>
      <LojaContent />
    </Suspense>
  );
}

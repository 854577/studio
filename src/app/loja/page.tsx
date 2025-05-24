
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Player } from '@/types/player';
import { shopCategoriesData, type ShopItem } from './lojaData';
import { purchaseItemAction } from '../actions/shopActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, CircleDollarSign, AlertCircle, ShoppingCart, Loader2, ShoppingBasket } from 'lucide-react';
import { cn } from '@/lib/utils';

function LojaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerId = searchParams.get('playerId');
  const { toast } = useToast();

  const [playerData, setPlayerData] = useState<Player | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [purchasingItemId, setPurchasingItemId] = useState<string | null>(null);

  const fetchPlayerData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`https://himiko-info-default-rtdb.firebaseio.com/rpgUsuarios/${id}.json`);
      if (!response.ok) {
        throw new Error(`Falha ao buscar dados do jogador: ${response.statusText} (status ${response.status})`);
      }
      const data: Player | null = await response.json();
      if (data) {
        setPlayerData({ ...data, nome: data.nome || id });
      } else {
        setError(`Jogador com ID "${id}" não encontrado.`);
        setPlayerData(null);
      }
    } catch (err) {
      console.error("Erro ao buscar dados do jogador:", err);
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      setError(errorMessage);
      setPlayerData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (playerId) {
      fetchPlayerData(playerId);
    } else {
      setError("ID do jogador não fornecido na URL.");
      setLoading(false);
    }
  }, [playerId, fetchPlayerData]);

  const handlePurchase = async (item: ShopItem) => {
    if (!playerId || !playerData) {
      toast({ title: "Erro", description: "Não foi possível identificar o jogador.", variant: "destructive" });
      return;
    }
    if (playerData.ouro === undefined || playerData.ouro < item.price) {
      toast({ title: "Ouro Insuficiente", description: `Você não tem ouro suficiente para comprar ${item.name}.`, variant: "destructive" });
      return;
    }

    setPurchasingItemId(item.name);
    const result = await purchaseItemAction(playerId, item.name, item.price);
    setPurchasingItemId(null);

    if (result.success) {
      toast({ title: "Compra Realizada!", description: result.message });
      if (result.updatedPlayer) {
        setPlayerData(result.updatedPlayer);
        // Optionally update sessionStorage if you use it for player data across pages
        sessionStorage.setItem('playerData', JSON.stringify(result.updatedPlayer));
      } else {
        // Re-fetch player data if updatedPlayer is not returned to ensure UI consistency
        fetchPlayerData(playerId);
      }
    } else {
      toast({ title: "Erro na Compra", description: result.message, variant: "destructive" });
    }
  };

  if (loading && !playerData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background text-foreground">
        <Loader2 className="w-16 h-16 text-primary " />
        <p className="mt-6 text-xl text-muted-foreground">Carregando loja...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background text-foreground">
        <Alert variant="destructive" className="max-w-lg shadow-lg">
          <AlertCircle className="w-5 h-5" />
          <AlertTitle className="text-lg">Erro ao Carregar Loja</AlertTitle>
          <AlertDescription className="text-base">{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push(playerId ? `/?playerId=${playerId}` : '/')} className="mt-8 text-base h-11 rounded-md">
          <ArrowLeft className="w-5 h-5 mr-2" /> Voltar para Perfil
        </Button>
      </div>
    );
  }

  if (!playerData) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-background text-foreground">
        <Alert className="max-w-lg shadow-lg">
          <AlertCircle className="w-5 h-5" />
          <AlertTitle className="text-lg">Jogador Não Encontrado</AlertTitle>
          <AlertDescription className="text-base">Não foi possível carregar os dados do jogador para a loja.</AlertDescription>
        </Alert>
         <Button variant="outline" onClick={() => router.push(playerId ? `/?playerId=${playerId}` : '/')} className="mt-8 text-base h-11 rounded-md">
          <ArrowLeft className="w-5 h-5 mr-2" /> Voltar para Perfil
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10 mx-auto max-w-6xl px-4 ">
      <header className="mb-10 text-center border-b pb-6 border-border/30">
        <h1 className="flex items-center justify-center mb-3 text-5xl font-extrabold tracking-tight text-primary sm:text-6xl">
          <ShoppingBasket size={50} className="mr-4" /> Loja do Aventureiro
        </h1>
        <p className="text-lg text-muted-foreground">Bem-vindo(a) à loja, <span className="font-semibold text-primary">{playerData.nome || playerId}</span>!</p>
        <div className="flex items-center justify-center mt-6 text-2xl font-bold text-yellow-400 bg-card/50 py-3 px-6 rounded-lg shadow-md max-w-xs mx-auto border border-border/30">
          <CircleDollarSign className="w-8 h-8 mr-3" />
          Seu Ouro: {playerData.ouro !== undefined ? playerData.ouro.toLocaleString() : 'N/A'}
        </div>
      </header>

      <Accordion type="multiple" className="w-full space-y-6">
        {shopCategoriesData.map((category) => (
          <AccordionItem value={category.name} key={category.name} className="bg-card border border-border/50 rounded-lg shadow-md overflow-hidden">
            <AccordionTrigger className="px-6 py-4 text-2xl font-semibold text-primary hover:text-primary/90 hover:no-underline data-[state=open]:border-b data-[state=open]:border-border/30 [&[data-state=open]>svg]:[transform:rotate(0deg)]">
              {category.name}
            </AccordionTrigger>
            <AccordionContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {category.items.map((item) => (
                  <Card key={item.name} className="flex flex-col overflow-hidden shadow-md bg-card/80 border-border/50 hover:shadow-xl hover:border-primary transition-shadow duration-200">
                    <CardHeader className="items-center p-4 sm:p-5 text-center">
                      <item.icon size={48} className={cn("mb-3", item.color || "text-primary")} />
                      <CardTitle className="text-xl font-semibold truncate" title={item.name}>{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-between flex-grow p-4 pt-0 sm:p-5">
                      <CardDescription className="mb-4 text-center text-base">
                        Preço: <span className="font-semibold text-yellow-400">{item.price.toLocaleString()}</span> ouro
                      </CardDescription>
                      <Button
                        onClick={() => handlePurchase(item)}
                        disabled={purchasingItemId === item.name || (playerData.ouro !== undefined && playerData.ouro < item.price)}
                        className="w-full mt-auto text-base h-11 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md"
                      >
                        {purchasingItemId === item.name ? (
                          <Loader2 className="w-5 h-5 mr-2 " />
                        ) : (
                          <ShoppingCart className="w-5 h-5 mr-2" />
                        )}
                        Comprar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 text-center">
        <Link href={playerId ? `/?playerId=${playerId}` : '/'} passHref>
          <Button variant="outline" className="text-base h-11 rounded-md">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar para Perfil
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function LojaPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
        <Loader2 className="w-16 h-16 " />
        <p className="mt-6 text-xl text-muted-foreground">Carregando...</p>
      </div>
    }>
      <LojaContent />
    </Suspense>
  );
}

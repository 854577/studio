
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
        setPlayerData({ ...data, nome: data.nome || id }); // Garante que o nome é exibido
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
        setPlayerData(result.updatedPlayer); // Atualiza os dados do jogador localmente
         // Salva no sessionStorage para refletir na página principal ao voltar
        sessionStorage.setItem('playerData', JSON.stringify(result.updatedPlayer));
      } else {
        // Se updatedPlayer não vier, refaz o fetch para garantir consistência.
        fetchPlayerData(playerId);
      }
    } else {
      toast({ title: "Erro na Compra", description: result.message, variant: "destructive" });
    }
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="mt-4 text-lg text-muted-foreground">Carregando dados da loja e do jogador...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Erro ao Carregar Loja</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => router.push('/')} className="mt-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Início
        </Button>
      </div>
    );
  }

  if (!playerData) {
     return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <Alert className="max-w-md">
          <AlertCircle className="w-4 h-4" />
          <AlertTitle>Jogador Não Encontrado</AlertTitle>
          <AlertDescription>Não foi possível carregar os dados do jogador para a loja.</AlertDescription>
        </Alert>
         <Button variant="outline" onClick={() => router.push(playerId ? `/?playerId=${playerId}` : '/')} className="mt-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para Perfil
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 mx-auto max-w-5xl">
      <header className="mb-8 text-center">
        <h1 className="flex items-center justify-center mb-2 text-4xl font-extrabold tracking-tight text-primary sm:text-5xl">
          <ShoppingBasket size={40} className="mr-3" /> Loja do Aventureiro
        </h1>
        <p className="text-muted-foreground">Bem-vindo(a) à loja, {playerData.nome || playerId}!</p>
        <div className="flex items-center justify-center mt-4 text-lg font-semibold text-yellow-400">
          <CircleDollarSign className="w-6 h-6 mr-2" />
          Seu Ouro: {playerData.ouro !== undefined ? playerData.ouro.toLocaleString() : 'N/A'}
        </div>
      </header>

      <Accordion type="multiple" collapsible className="w-full">
        {shopCategoriesData.map((category) => (
          <AccordionItem value={category.name} key={category.name}>
            <AccordionTrigger className="text-xl font-semibold text-primary hover:text-primary/90">
              {category.name}
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-2">
                {category.items.map((item) => (
                  <Card key={item.name} className="flex flex-col overflow-hidden transition-all duration-200 shadow-md hover:shadow-xl bg-card/80 border-border/50">
                    <CardHeader className="items-center p-4 text-center">
                      <item.icon size={40} className={cn("mb-2", item.color || "text-accent")} />
                      <CardTitle className="text-lg truncate" title={item.name}>{item.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-between flex-grow p-4 pt-0">
                      <CardDescription className="mb-3 text-center">
                        Preço: <span className="font-semibold text-yellow-400">{item.price.toLocaleString()}</span> ouro
                      </CardDescription>
                      <Button
                        onClick={() => handlePurchase(item)}
                        disabled={purchasingItemId === item.name || (playerData.ouro !== undefined && playerData.ouro < item.price)}
                        className="w-full mt-auto bg-primary hover:bg-primary/90"
                      >
                        {purchasingItemId === item.name ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <ShoppingCart className="w-4 h-4 mr-2" />
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
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Perfil
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function LojaPage() {
  return (
    // Suspense é necessário porque LojaContent usa useSearchParams
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>}>
      <LojaContent />
    </Suspense>
  );
}

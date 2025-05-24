
// src/app/payment/pending/page.tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Hourglass, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function PaymentPendingPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const playerId = searchParams.get('playerId');
  const amount = searchParams.get('amount'); 

  useEffect(() => {
    toast({
      title: "Pagamento Pendente",
      description: "Seu pagamento está pendente de confirmação. Você será notificado assim que for aprovado e seu saldo atualizado.",
      duration: 8000,
    });
    console.log("Página de Pagamento Pendente:");
    console.log("Player ID (param):", playerId);
    console.log("Amount (param):", amount);
    console.log("Todos os parâmetros:", Object.fromEntries(searchParams.entries()));

  }, [playerId, amount, searchParams, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <Hourglass className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          <CardTitle className="text-3xl">Pagamento Pendente</CardTitle>
          <CardDescription className="text-lg">
            Seu pagamento está aguardando confirmação.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Assim que o pagamento for aprovado, seu saldo (BRL) será atualizado.
            Isso pode levar algum tempo dependendo do método de pagamento (ex: boleto).
          </p>
          {playerId && <p className="text-sm">Jogador: <span className="font-mono">{playerId}</span></p>}
          {amount && <p className="text-sm">Valor: <span className="font-mono">R$ {parseFloat(amount).toFixed(2)}</span></p>}
          
          <div className="mt-6">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar para a Página Inicial
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


// src/app/payment/success/page.tsx
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Parâmetros que podem vir do Mercado Pago ou da nossa preferência
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference'); // Nosso playerId
  const merchantOrderId = searchParams.get('merchant_order_id');
  
  // Parâmetros que adicionamos na back_url
  const playerIdParam = searchParams.get('playerId');
  const amountParam = searchParams.get('amount');

  useEffect(() => {
    // Aqui você NÃO deve creditar o ouro diretamente apenas baseado nesta página.
    // Esta página é apenas um feedback visual para o usuário.
    // A lógica de crédito REAL deve acontecer no seu webhook (`notification_url`)
    // que é chamado diretamente pelo Mercado Pago de forma segura.

    // Você pode exibir uma mensagem de sucesso mais detalhada.
    toast({
      title: "Pagamento em Processamento!",
      description: `Seu pagamento de R$ ${amountParam || 'N/A'} para ${playerIdParam || externalReference || 'jogador'} está sendo processado. O saldo será atualizado em breve se aprovado.`,
      duration: 10000, // Duração maior para o usuário ler
    });

    // Log para desenvolvimento/debug
    console.log("Página de Sucesso de Pagamento:");
    console.log("Payment ID:", paymentId);
    console.log("Status:", status);
    console.log("External Reference (Player ID):", externalReference);
    console.log("Merchant Order ID:", merchantOrderId);
    console.log("Player ID (param):", playerIdParam);
    console.log("Amount (param):", amountParam);

  }, [paymentId, status, externalReference, merchantOrderId, playerIdParam, amountParam, toast]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl">Pagamento Realizado!</CardTitle>
          <CardDescription className="text-lg">
            Obrigado! Seu pagamento foi recebido e está sendo processado.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            O seu saldo de ouro será atualizado em breve assim que o pagamento for confirmado.
            Isso pode levar alguns instantes.
          </p>
          {paymentId && <p className="text-sm">ID do Pagamento: <span className="font-mono">{paymentId}</span></p>}
          {playerIdParam && <p className="text-sm">Jogador: <span className="font-mono">{playerIdParam}</span></p>}
          {amountParam && <p className="text-sm">Valor: <span className="font-mono">R$ {amountParam}</span></p>}
          
          <div className="mt-6">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar para a Página Inicial
              </Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-6">
            Lembre-se: A atualização do saldo é feita após a confirmação final do Mercado Pago via webhook.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

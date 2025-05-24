
// src/app/payment/failure/page.tsx
'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export default function PaymentFailurePage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const playerId = searchParams.get('playerId');
  // Outros parâmetros do Mercado Pago podem estar presentes, como 'status', 'payment_id', etc.

  useEffect(() => {
    toast({
      title: "Falha no Pagamento",
      description: "Ocorreu um problema ao processar seu pagamento. Por favor, tente novamente.",
      variant: "destructive",
      duration: 8000,
    });
     // Log para desenvolvimento/debug
     console.log("Página de Falha de Pagamento:");
     console.log("Player ID (param):", playerId);
     console.log("Todos os parâmetros:", Object.fromEntries(searchParams.entries()));
  }, [playerId, searchParams, toast]);


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <CardTitle className="text-3xl">Falha no Pagamento</CardTitle>
          <CardDescription className="text-lg">
            Não foi possível processar seu pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Verifique os dados do seu cartão, saldo disponível ou tente um método de pagamento diferente.
            Se o problema persistir, entre em contato com o suporte.
          </p>
          {playerId && <p className="text-sm">Jogador: <span className="font-mono">{playerId}</span></p>}

          <div className="mt-6">
            <Button asChild className="w-full sm:w-auto">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar para a Página Inicial e Tentar Novamente
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

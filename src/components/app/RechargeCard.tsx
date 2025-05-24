
'use client';

import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { CreditCard, AlertCircle, Wallet } from 'lucide-react'; // Adicionado Wallet
import { useToast } from "@/hooks/use-toast";
import { createPaymentPreference } from '@/app/actions/paymentActions'; 

interface RechargeCardProps {
  playerId: string | null;
  playerName?: string; 
  isDisabled: boolean;
}

const RechargeCard: React.FC<RechargeCardProps> = ({ playerId, playerName, isDisabled }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleRechargeSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!playerId) {
      setError("ID do jogador não encontrado. Busque um jogador primeiro.");
      return;
    }

    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Por favor, insira um valor de recarga válido.");
      return;
    }
    
    if (amount < 1) {
        setError("O valor mínimo para recarga é R$ 1,00.");
        return;
    }

    setIsLoading(true);

    try {
      const result = await createPaymentPreference(playerId, playerName, amount);

      if (result.error) {
        setError(result.error);
        toast({
          title: "Erro na Recarga",
          description: result.error,
          variant: "destructive",
        });
      } else if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        setError("Não foi possível obter a URL de checkout. Tente novamente.");
        toast({
            title: "Erro Inesperado",
            description: "Não foi possível obter a URL de checkout. Tente novamente.",
            variant: "destructive",
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ocorreu um erro desconhecido.";
      setError(errorMessage);
      toast({
        title: "Erro ao Processar Recarga",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-lg mt-8 shadow-xl bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Wallet className="mr-2 h-6 w-6 text-primary" /> 
            Recarregar Saldo
          </CardTitle>
          <CardDescription>Adicione saldo (BRL) à conta do jogador utilizando Mercado Pago.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => { setIsDialogOpen(true); setError(null); setRechargeAmount(''); }}
            disabled={isDisabled || !playerId}
            className="w-full py-3 text-base"
            variant="outline"
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Recarregar com Mercado Pago
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
            setError(null);
            setRechargeAmount('');
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Recarregar Saldo (BRL)</DialogTitle>
            <DialogDescription>
              Digite o valor em BRL que deseja adicionar ao saldo de {playerName || 'o jogador selecionado'}. O pagamento será processado pelo Mercado Pago.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleRechargeSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="amount" className="text-right col-span-1">
                  Valor (R$)
                </label>
                <Input
                  id="amount"
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  placeholder="Ex: 10.00"
                  className="col-span-3"
                  min="1" 
                  step="0.01" 
                  required
                />
              </div>
              {error && (
                <div className="col-span-4 p-3 bg-destructive/10 border border-destructive/50 text-destructive text-sm rounded-md flex items-start">
                   <AlertCircle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                   <span className="flex-1">{error}</span>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading || !rechargeAmount.trim() || parseFloat(rechargeAmount) < 1}>
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground"></div>
                ) : (
                  'Ir para Pagamento'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RechargeCard;

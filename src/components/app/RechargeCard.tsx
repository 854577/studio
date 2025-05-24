
'use client';

import { useState, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { CreditCard, AlertCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { createPaymentPreference } from '@/app/actions/paymentActions'; // Server Action

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
    
    // Limitar o valor para evitar problemas, ex: mínimo R$1.00
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
        // Redirecionar para o checkout do Mercado Pago
        window.location.href = result.checkoutUrl;
        // O Dialog não será fechado aqui, pois o usuário será redirecionado.
        // Se o redirecionamento falhar, ele verá a mensagem de erro.
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
      // Não fechar o diálogo automaticamente em caso de erro, para o usuário ver a mensagem.
      // Se houver sucesso com checkoutUrl, o redirecionamento acontece.
    }
  };

  return (
    <>
      <Card className="w-full max-w-lg mt-8 shadow-xl bg-card border-border/50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <CreditCard className="mr-2 h-6 w-6 text-primary" />
            Recarregar Ouro
          </CardTitle>
          <CardDescription>Adicione ouro à conta do jogador utilizando Mercado Pago.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setIsDialogOpen(true)}
            disabled={isDisabled || !playerId}
            className="w-full py-3 text-base"
            variant="outline"
          >
            <CreditCard className="mr-2 h-5 w-5" />
            Recarregar com Mercado Pago
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Recarregar Ouro</DialogTitle>
            <DialogDescription>
              Digite o valor que deseja recarregar para {playerName || 'o jogador selecionado'}. O pagamento será processado pelo Mercado Pago.
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
                  min="1" // Mínimo de R$1,00
                  step="0.01" // Para centavos
                  required
                />
              </div>
              {error && (
                <div className="col-span-4 p-2 bg-destructive/10 border border-destructive/50 text-destructive text-sm rounded-md flex items-center">
                   <AlertCircle className="h-4 w-4 mr-2 shrink-0" />
                   {error}
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline" onClick={() => { setError(null); setRechargeAmount(''); }}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading || !rechargeAmount.trim()}>
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

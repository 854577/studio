
'use client';

import type { Player } from '@/types/player';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, CircleDollarSign, Star, User, BarChart3, Zap, Sparkles, Wallet, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { itemDetails } from '@/app/loja/lojaData'; 

interface PlayerStatItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number | undefined;
  iconColor?: string;
  isLoading?: boolean;
}

const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return 'N/A';
  if (num < 1000) return num.toLocaleString();
  if (num < 1000000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  if (num < 1000000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
};

const PlayerStatItem: React.FC<PlayerStatItemProps> = ({ icon: Icon, label, value, iconColor, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-2 space-y-1.5 rounded-lg bg-card/70 border border-border/30 shadow-md min-h-[70px]">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="w-12 h-3" />
        <Skeleton className="w-8 h-3.5" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center p-2 space-y-1.5 text-center rounded-lg bg-card/70 border border-border/30 shadow-md min-h-[70px] overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <Icon size={22} className={iconColor || 'text-primary'} />
      <p className="text-[11px] font-medium text-muted-foreground truncate w-full" title={label}>{label}</p>
      <p className="text-xs font-semibold text-foreground break-words w-full" title={String(value)}>
        {typeof value === 'number' ? formatNumber(value) : (value || 'N/A')}
      </p>
    </div>
  );
};

interface PlayerStatsCardProps {
  playerData: Player | null;
  isLoading?: boolean;
}

const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ playerData, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl shadow-2xl bg-card border-border/50">
        <CardHeader className="flex flex-col items-center gap-4 p-4 text-center sm:flex-row sm:p-6 sm:text-left">
          <Skeleton className="w-20 h-20 rounded-full sm:w-24 sm:h-24" />
          <div className="space-y-2">
            <Skeleton className="w-40 h-7 sm:w-56" />
            <Skeleton className="w-32 h-5 sm:w-40" />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {[...Array(7)].map((_, index) => ( 
              <PlayerStatItem key={`skel-stat-${index}`} icon={User} label="Carregando" value="0" isLoading={true} />
            ))}
          </div>
          <Skeleton className="w-1/3 h-5 mt-4 mb-2 ml-1 sm:ml-0" /> 
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
             {[...Array(5)].map((_, index) => (
              <div key={`skel-inv-${index}`} className="flex flex-col items-center justify-center p-2 space-y-1 rounded-lg bg-card/70 border border-border/30 shadow-md min-h-[70px]">
                <Skeleton className="w-6 h-6 rounded-md" />
                <Skeleton className="w-12 h-3" />
                <Skeleton className="w-8 h-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!playerData) return null;

  const personalizedInitial = "H";
  let fallbackName = personalizedInitial + "?";
  if (playerData.nome && playerData.nome.length > 0) {
    fallbackName = personalizedInitial + playerData.nome.substring(0, 1).toUpperCase();
  }


  const mainStats = [
    { icon: Wallet, label: 'Saldo (BRL)', value: playerData.saldoBRL !== undefined ? playerData.saldoBRL.toFixed(2) : 'N/A', color: 'text-green-500' },
    { icon: Heart, label: 'Vida', value: playerData.vida, color: 'text-destructive' },
    { icon: CircleDollarSign, label: 'Ouro', value: playerData.ouro, color: 'text-[hsl(var(--chart-5))]' },
    { icon: Star, label: 'Level', value: playerData.nivel, color: 'text-[hsl(var(--chart-4))]' },
    { icon: BarChart3, label: 'XP', value: playerData.xp, color: 'text-muted-foreground' },
    { icon: Zap, label: 'Energia', value: playerData.energia, color: 'text-[hsl(var(--chart-4))]' },
    { icon: Sparkles, label: 'Mana', value: playerData.mana, color: 'text-[hsl(var(--chart-1))]' },
  ];

  const ignoredKeys = ['nome', 'vida', 'ouro', 'nivel', 'xp', 'energia', 'mana', 'senha', 'id', 'inventario', 'saldoBRL', 'dinheiro'];
  const otherStats = Object.entries(playerData)
    .filter(([key]) => !ignoredKeys.includes(key.toLowerCase()) && playerData[key] !== undefined && playerData[key] !== null && playerData[key] !== '')
    .map(([key, value]) => {
      let displayValue = String(value);
      if (typeof value === 'string' && value.includes('@s.whatsapp.net')) {
        displayValue = value.split('@s.whatsapp.net')[0];
      }
      return {
        icon: User, 
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: displayValue,
        color: 'text-foreground'
      };
    });

  const inventoryItems = playerData.inventario ? Object.entries(playerData.inventario) : [];

  return (
    <Card className="w-full max-w-4xl overflow-hidden shadow-2xl bg-card border-border/50">
      <CardHeader className="flex flex-col items-center gap-4 p-4 text-center border-b sm:flex-row sm:p-6 sm:text-left border-border/30">
        <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-primary shadow-lg">
          <AvatarImage src={`https://placehold.co/120x120.png`} alt={playerData.nome || 'Avatar'} data-ai-hint="character avatar"/>
          <AvatarFallback className="text-3xl">{fallbackName}</AvatarFallback>
        </Avatar>
        <div className="mt-2 sm:mt-0">
          <CardTitle className="text-3xl sm:text-4xl font-bold text-primary break-words">{playerData.nome || 'Nome Desconhecido'}</CardTitle>
          <CardDescription className="mt-1 text-base text-muted-foreground">Perfil Detalhado do Jogador</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-3">
        {(mainStats.length > 0 || otherStats.length > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {mainStats.map(stat => stat.value !== undefined && (
              <PlayerStatItem key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} iconColor={stat.color} />
            ))}
            {otherStats.map(stat => (
              <PlayerStatItem key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} iconColor={stat.color} />
            ))}
          </div>
        )}

        {inventoryItems.length > 0 && (
          <>
            <h3 className="col-span-full text-lg font-semibold text-primary mb-2 sm:mb-3 px-1 sm:px-0 border-t border-border/30 pt-3">Inventário</h3>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {inventoryItems.map(([itemName, quantity]) => {
                const itemDetail = itemDetails[itemName.toLowerCase()];
                const IconComponent = itemDetail ? itemDetail.icon : Package;
                return (
                  <div key={itemName} className="flex flex-col items-center justify-center p-2 space-y-1 text-center rounded-lg bg-card/70 border border-border/30 shadow-md min-h-[70px] overflow-hidden hover:shadow-lg transition-shadow duration-200">
                    <IconComponent size={22} className={itemDetail?.color || 'text-accent'} />
                    <p className="text-[11px] font-medium text-muted-foreground capitalize truncate w-full" title={itemName}>{itemName}</p>
                    <p className="text-xs font-semibold text-foreground">x{quantity}</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PlayerStatsCard;

    

'use client';

import type { Player } from '@/types/player';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, CircleDollarSign, Star, User, TrendingUp, Zap, Sparkles, Package, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { itemDetails } from '@/app/loja/lojaData';
import { cn } from '@/lib/utils';

interface PlayerStatItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number | undefined;
  iconColor?: string;
  isLoading?: boolean;
}

const formatNumber = (num: number | undefined): string => {
  if (num === undefined || num === null) return 'N/A';
  if (Math.abs(num) < 1000) return num.toLocaleString();

  const tier = Math.floor(Math.log10(Math.abs(num)) / 3);
  if (tier === 0) return num.toLocaleString();

  const suffix = ["", "K", "M", "B", "T"][tier];
  const scale = Math.pow(1000, tier);
  const scaled = num / scale;

  return parseFloat(scaled.toFixed(1)) + suffix;
};


const PlayerStatItem: React.FC<PlayerStatItemProps> = ({ icon: Icon, label, value, iconColor, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-2 space-y-1.5 rounded-lg bg-card/70 shadow-md min-h-[70px] overflow-hidden border-border/30 card-glow">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="w-12 h-3 truncate" />
        <Skeleton className="w-8 h-3.5" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center p-2 space-y-1.5 text-center rounded-lg bg-card/70 shadow-md min-h-[70px] overflow-hidden hover:shadow-lg transition-shadow duration-200 border-border/30 card-glow">
      <Icon size={22} className={cn(iconColor || 'text-primary', "shrink-0")} />
      <p className="text-[11px] font-medium text-muted-foreground truncate w-full" title={label}>{label}</p>
      <p className="text-xs font-semibold text-foreground break-words w-full overflow-hidden" title={String(value)}>
        {typeof value === 'number' ? formatNumber(value) : (value || 'N/A')}
      </p>
    </div>
  );
};

interface PlayerStatsCardProps {
  playerData: Player | null;
  isLoading?: boolean;
  className?: string;
  onAvatarClick?: () => void; // Callback for avatar click
}

const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ playerData, isLoading, className, onAvatarClick }) => {
  if (isLoading) {
    return (
      <Card className={cn("w-full max-w-5xl overflow-hidden shadow-2xl bg-card card-glow", className)}>
        <CardHeader className="flex flex-col items-center gap-4 p-4 text-center border-b sm:flex-row sm:p-6 sm:text-left border-border/30">
          <Skeleton className="w-20 h-20 rounded-full sm:w-24 sm:h-24" />
          <div className="space-y-2">
            <Skeleton className="w-40 h-7 sm:w-56" />
            <Skeleton className="w-32 h-5 sm:w-40" />
          </div>
        </CardHeader>
        <CardContent className="p-1.5 sm:p-2">
           <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 p-2 sm:gap-2 sm:p-3">
            {[...Array(6)].map((_, index) => (
              <PlayerStatItem key={`skel-stat-${index}`} icon={User} label="Carregando" value="0" isLoading={true} />
            ))}
          </div>
          <Skeleton className="w-1/3 h-5 mt-3 mb-1.5 ml-1 sm:ml-0" />
          <div className="grid grid-cols-5 gap-1.5 p-2 sm:gap-2 sm:p-3">
            {[...Array(5)].map((_, index) => (
              <div key={`skel-inv-${index}`} className="flex flex-col items-center justify-center p-2 space-y-1 rounded-lg bg-card/70 shadow-md min-h-[70px] border border-border/30 card-glow">
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

  let fallbackInitial = "?";
  if (playerData.nome && playerData.nome.length > 0) {
    fallbackInitial = playerData.nome.substring(0, 1).toUpperCase();
  }


  const mainStats = [
    { icon: Heart, label: 'Vida', value: playerData.vida, color: 'text-destructive' },
    { icon: CircleDollarSign, label: 'Ouro', value: playerData.ouro, color: 'text-[hsl(var(--chart-5))]' },
    { icon: Star, label: 'Level', value: playerData.nivel, color: 'text-[hsl(var(--chart-4))]' },
    { icon: TrendingUp, label: 'XP', value: playerData.xp, color: 'text-muted-foreground' },
    { icon: Zap, label: 'Energia', value: playerData.energia, color: 'text-[hsl(var(--chart-4))]' },
    { icon: Sparkles, label: 'Mana', value: playerData.mana, color: 'text-[hsl(var(--chart-1))]' },
  ];

  const ignoredKeys = ['nome', 'vida', 'ouro', 'nivel', 'xp', 'energia', 'mana', 'senha', 'id', 'inventario', 'foto'];
  const otherStats = Object.entries(playerData)
    .filter(([key]) => !ignoredKeys.includes(key.toLowerCase()) && playerData[key] !== undefined && playerData[key] !== null && String(playerData[key]).trim() !== '')
    .map(([key, value]) => {
      let displayValue = String(value);
      if (typeof value === 'string' && value.includes('@s.whatsapp.net')) {
        displayValue = value.split('@s.whatsapp.net')[0];
      }
      return {
        icon: User, // Placeholder, could be dynamic based on key
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: displayValue,
        color: 'text-foreground' 
      };
    });

  const inventoryItems = playerData.inventario ? Object.entries(playerData.inventario).filter(([_, quantity]) => quantity > 0) : [];

  return (
    <Card className={cn("w-full max-w-5xl overflow-hidden shadow-2xl bg-card card-glow", className)}>
      <CardHeader className="flex flex-col items-center gap-4 p-4 text-center border-b sm:flex-row sm:p-6 sm:text-left border-border/30">
        <button
          type="button"
          onClick={onAvatarClick}
          className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label="Alterar foto de perfil"
          title="Clique para alterar a foto de perfil"
        >
          <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-primary shadow-lg cursor-pointer hover:opacity-80 transition-opacity">
            <AvatarImage src={playerData.foto || `https://placehold.co/120x120.png`} alt={playerData.nome || 'Avatar'} data-ai-hint="character face"/>
            <AvatarFallback className="text-3xl bg-primary text-primary-foreground">{fallbackInitial}</AvatarFallback>
          </Avatar>
        </button>
        <div className="mt-2 sm:mt-0">
          <CardTitle className="text-3xl sm:text-4xl font-bold text-primary break-words max-w-xs sm:max-w-md md:max-w-lg">{playerData.nome || 'Nome Desconhecido'}</CardTitle>
          <CardDescription className="mt-1 text-base text-muted-foreground">Perfil Detalhado do Jogador</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-1.5 sm:p-2">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 p-2 sm:gap-2 sm:p-3">
          {mainStats.map(stat => stat.value !== undefined && (
            <PlayerStatItem key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} iconColor={stat.color} />
          ))}
          {otherStats.map(stat => (
            <PlayerStatItem key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} iconColor={stat.color} />
          ))}
        </div>

        {inventoryItems.length > 0 && (
          <>
            <h3 className="col-span-full text-lg font-semibold text-primary mb-1.5 sm:mb-2 px-1 sm:px-0 border-t border-border/30 pt-3 mt-3">Inventário</h3>
            <div className="grid grid-cols-5 gap-1.5 p-2 sm:gap-2 sm:p-3">
              {inventoryItems.map(([itemName, quantity]) => {
                const itemDetail = itemDetails[itemName.toLowerCase()];
                const IconComponent = itemDetail ? itemDetail.icon : Package;
                return (
                  <div
                    key={itemName}
                    className="flex flex-col items-center justify-center p-2 space-y-1 text-center rounded-lg bg-card/70 shadow-md min-h-[70px] overflow-hidden hover:shadow-lg transition-shadow duration-200 border-border/30 card-glow"
                  >
                    <IconComponent size={22} className={cn(itemDetail?.color || 'text-accent', "shrink-0")} />
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


'use client';

import React from 'react';
import type { Player } from '@/types/player';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, CircleDollarSign, Star, User, BarChart3, Zap, Sparkles, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { itemDetails } from '@/app/loja/lojaData'; // Importar itemDetails

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
      <div className="flex flex-col items-center justify-center p-2 space-y-1 rounded-lg bg-card/50 border border-border/30 shadow-md min-h-[70px]">
        <Skeleton className="w-6 h-6 rounded-full" />
        <Skeleton className="w-12 h-3" />
        <Skeleton className="w-8 h-4" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center p-2 space-y-1 text-center rounded-lg bg-card/50 border border-border/30 shadow-md hover:shadow-lg transition-shadow duration-200 min-h-[70px] overflow-hidden">
      <Icon size={20} className={iconColor || 'text-primary'} />
      <p className="text-xs font-medium text-muted-foreground truncate w-full" title={label}>{label}</p>
      <p className="text-sm font-semibold text-foreground break-words w-full" title={String(value)}>
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
      <Card className="w-full max-w-4xl mb-8 shadow-2xl bg-card border-border/50 animate-in fade-in-0 slide-in-from-top-8 duration-500">
        <CardHeader className="flex flex-row items-center gap-4 p-4 sm:p-6">
          <Skeleton className="w-16 h-16 rounded-full sm:w-20 sm:h-20" />
          <div className="space-y-2">
            <Skeleton className="w-32 h-6 sm:w-48" />
            <Skeleton className="w-24 h-4 sm:w-32" />
          </div>
        </CardHeader>
        <CardContent className="p-2 sm:p-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2">
            {[...Array(6)].map((_, index) => (
              <PlayerStatItem key={`skel-stat-${index}`} icon={User} label="Loading" value="0" isLoading={true} />
            ))}
          </div>
          <Skeleton className="w-1/3 h-5 mt-4 ml-1 sm:ml-0" /> {/* Placeholder for "Outras Informações" or "Inventário" title */}
          <div className="grid grid-cols-5 gap-1.5 mt-1.5 sm:gap-2">
             {[...Array(5)].map((_, index) => (
              <PlayerStatItem key={`skel-inv-${index}`} icon={User} label="Loading" value="0" isLoading={true} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!playerData) return null;

  const mainStats = [
    { icon: Heart, label: 'Vida', value: playerData.vida, color: 'text-destructive' },
    { icon: CircleDollarSign, label: 'Ouro', value: playerData.ouro, color: 'text-[hsl(var(--chart-5))]' },
    { icon: Star, label: 'Level', value: playerData.nivel, color: 'text-[hsl(var(--chart-4))]' },
    { icon: BarChart3, label: 'XP', value: playerData.xp, color: 'text-muted-foreground' },
    { icon: Zap, label: 'Energia', value: playerData.energia, color: 'text-[hsl(var(--chart-4))]' },
    { icon: Sparkles, label: 'Mana', value: playerData.mana, color: 'text-[hsl(var(--chart-1))]' },
  ];

  const ignoredKeys = ['nome', 'vida', 'ouro', 'nivel', 'xp', 'energia', 'mana', 'senha', 'id', 'dinheiro', 'inventario'];
  const otherStats = Object.entries(playerData)
    .filter(([key]) => !ignoredKeys.includes(key.toLowerCase()) && playerData[key] !== undefined && playerData[key] !== null && playerData[key] !== '')
    .map(([key, value]) => {
      let displayValue = String(value);
      if (typeof value === 'string' && value.includes('@s.whatsapp.net')) {
        displayValue = value.split('@s.whatsapp.net')[0];
      }
      return {
        icon: User, // Generic icon for other stats
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: displayValue,
        color: 'text-foreground'
      };
    });

  const inventoryItems = playerData.inventario ? Object.entries(playerData.inventario) : [];

  return (
    <Card className="w-full max-w-4xl mb-8 overflow-hidden shadow-2xl bg-card border-border/50">
      <CardHeader className="flex flex-row items-center gap-4 p-4 sm:p-6">
        <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-primary">
          <AvatarImage src={`https://placehold.co/100x100.png`} alt={playerData.nome || 'Avatar'} data-ai-hint="character avatar" />
          <AvatarFallback>{playerData.nome ? playerData.nome.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary break-all">{playerData.nome || 'Nome Desconhecido'}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">Perfil do Jogador</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-3">
        {(mainStats.length > 0 || otherStats.length > 0) && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
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
            <h3 className="col-span-full text-lg font-semibold text-primary mb-1.5 sm:mb-2 px-1 sm:px-0">Inventário</h3>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {inventoryItems.map(([itemName, quantity]) => {
                const itemDetail = itemDetails[itemName.toLowerCase()];
                const IconComponent = itemDetail ? itemDetail.icon : Package;
                return (
                  <div key={itemName} className="flex flex-col items-center justify-center p-2 space-y-1 text-center rounded-lg bg-card/50 border border-border/30 shadow-md hover:shadow-lg transition-shadow duration-200 min-h-[70px] overflow-hidden">
                    <IconComponent size={20} className={itemDetail?.color || 'text-primary'} />
                    <p className="text-xs font-medium text-muted-foreground capitalize truncate w-full" title={itemName}>{itemName}</p>
                    <p className="text-sm font-semibold text-foreground">x{quantity}</p>
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

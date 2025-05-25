
'use client';

import type { Player } from '@/types/player';
import { CircleDollarSign, Star, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CompactPlayerStatsProps {
  player: Player;
  className?: string;
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

const CompactPlayerStats: React.FC<CompactPlayerStatsProps> = ({ player, className }) => {
  const stats = [
    { label: 'Ouro', value: player.ouro, icon: CircleDollarSign, color: 'text-yellow-500' },
    { label: 'Nível', value: player.nivel, icon: Star, color: 'text-amber-500' },
    { label: 'XP', value: player.xp, icon: TrendingUp, color: 'text-sky-500' },
  ];

  return (
    <div className={cn("grid grid-cols-3 gap-2 text-xs", className)}>
      {stats.map(stat => (
        <div key={stat.label} className="flex flex-col items-center p-1 bg-card/50 rounded-md border border-border/30">
          <stat.icon size={16} className={cn("mb-0.5", stat.color)} />
          <span className="text-muted-foreground text-[10px]">{stat.label}</span>
          <span className="font-semibold text-foreground">{formatNumber(stat.value)}</span>
        </div>
      ))}
    </div>
  );
};

export default CompactPlayerStats;

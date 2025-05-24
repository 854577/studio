
import type { Player } from '@/types/player';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, CircleDollarSign, Star, User, BarChart3, Info, Zap, Sparkles, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PlayerStatItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconClassName?: string;
}

const PlayerStatItem: React.FC<PlayerStatItemProps> = ({ icon: Icon, label, value, iconClassName }) => (
  <div className="flex items-center p-3 sm:p-4 bg-card-foreground/5 rounded-lg border border-border/30 transition-shadow hover:shadow-lg hover:border-primary/50">
    <Icon size={20} className={`mr-2 sm:mr-2.5 shrink-0 ${iconClassName || ''}`} />
    <div className="overflow-hidden">
      <p className="font-semibold text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
      <p className="text-sm sm:text-base font-bold text-foreground break-words">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
    </div>
  </div>
);

interface PlayerStatsCardProps {
  playerData: Player;
}

const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ playerData }) => {
  const orderedKeys: (keyof Player)[] = ['saldoBRL', 'vida', 'ouro', 'nivel', 'xp', 'energia', 'mana'];
  
  const mainStats = orderedKeys.map(key => {
    if (playerData[key] === undefined || playerData[key] === null) return null;

    let icon = Info;
    let label = key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    let iconClassName = 'text-muted-foreground';
    let value: string | number = playerData[key] as string | number;

    switch (key) {
      case 'saldoBRL':
        icon = Wallet;
        label = 'Saldo (BRL)';
        value = (playerData.saldoBRL ?? 0).toFixed(2);
        iconClassName = 'text-green-500'; // Consistent color for BRL
        break;
      case 'vida':
        icon = Heart;
        label = 'Vida';
        value = playerData.vida ?? 0;
        iconClassName = 'text-destructive';
        break;
      case 'ouro':
        icon = CircleDollarSign;
        label = 'Ouro';
        value = playerData.ouro ?? 0;
        iconClassName = 'text-[hsl(var(--chart-5))]';
        break;
      case 'nivel':
        icon = Star;
        label = 'Level';
        value = playerData.nivel ?? 0;
        iconClassName = 'text-[hsl(var(--chart-4))]';
        break;
      case 'xp':
        icon = BarChart3;
        label = 'Experience (XP)';
        value = playerData.xp ?? 0;
        iconClassName = 'text-muted-foreground';
        break;
      case 'energia':
        icon = Zap;
        label = 'Energia';
        value = playerData.energia ?? 0;
        iconClassName = 'text-[hsl(var(--chart-4))]';
        break;
      case 'mana':
        icon = Sparkles;
        label = 'Mana';
        value = playerData.mana ?? 0;
        iconClassName = 'text-[hsl(var(--chart-1))]';
        break;
    }
    return <PlayerStatItem key={key} icon={icon} label={label} value={value} iconClassName={iconClassName} />;
  }).filter(Boolean);

  const otherStats = Object.entries(playerData)
    .filter(([key, value]) => 
      !orderedKeys.includes(key as keyof Player) &&
      key !== 'nome' && 
      key !== 'senha' &&
      key !== 'id' &&
      value !== undefined && 
      value !== null && 
      String(value).trim() !== ""
    )
    .map(([key, rawValue]) => {
      let displayValue = String(rawValue);
      if (typeof displayValue === 'string' && displayValue.includes('@s.whatsapp.net')) {
        displayValue = displayValue.replace('@s.whatsapp.net', '');
      }
      return (
        <PlayerStatItem 
          key={key}
          icon={Info} 
          label={key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} 
          value={displayValue} 
          iconClassName="text-muted-foreground" 
        />
      );
    });

  return (
    <Card className="w-full shadow-2xl bg-card border border-border/50 overflow-hidden">
      <CardHeader className="pb-4 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-primary/50 shrink-0">
          <AvatarImage 
            src={`https://placehold.co/128x128.png?text=${(playerData.nome || 'P').charAt(0).toUpperCase()}`} 
            alt={playerData.nome || 'Player Avatar'}
            data-ai-hint="abstract geometric"
          />
          <AvatarFallback><User size={40} /></AvatarFallback>
        </Avatar>
        <div className="text-center sm:text-left overflow-hidden">
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary break-words">
            {playerData.nome || 'Jogador Desconhecido'}
          </CardTitle>
          {playerData.nome && <CardDescription className="mt-1 text-sm sm:text-base truncate">Exibindo estatísticas para {playerData.nome}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 pt-2 pb-4 px-4 sm:px-6">
        {mainStats}
        {otherStats}
      </CardContent>
    </Card>
  );
};

export const PlayerStatsSkeleton: React.FC = () => (
  <Card className="w-full shadow-2xl animate-pulse bg-card border border-border/50 overflow-hidden">
    <CardHeader className="pb-4 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
      <Skeleton className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-muted shrink-0" />
      <div className="text-center sm:text-left flex-grow overflow-hidden">
        <Skeleton className="h-8 bg-muted rounded w-3/4 sm:w-48 mx-auto sm:mx-0 mb-2" />
        <Skeleton className="h-4 bg-muted rounded w-1/2 sm:w-32 mx-auto sm:mx-0" />
      </div>
    </CardHeader>
    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 pt-2 pb-4 px-4 sm:px-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center p-3 sm:p-4 bg-muted/50 rounded-lg border border-border/30">
          <Skeleton className="h-5 w-5 bg-muted rounded-full mr-2 sm:mr-2.5 shrink-0" />
          <div className="flex-grow overflow-hidden">
            <Skeleton className="h-3.5 bg-muted rounded w-1/3 mb-1" />
            <Skeleton className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default PlayerStatsCard;

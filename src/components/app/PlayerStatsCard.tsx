
import type { Player } from '@/types/player';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, CircleDollarSign, Star, User, BarChart3, Info, Zap, Sparkles, Wallet, Package } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { itemDetails } from '@/app/loja/lojaData';

interface PlayerStatItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconClassName?: string;
}

const formatNumberWithAbbreviation = (num: number): string => {
  if (isNaN(num) || num === null) return String(num); // Handle non-numeric or null values
  if (Math.abs(num) < 1000) {
    return num.toLocaleString();
  }
  const suffixes = ["", "K", "M", "B", "T"];
  const i = Math.floor(Math.log10(Math.abs(num)) / 3);
  
  if (i >= suffixes.length) {
    return num.toLocaleString();
  }

  const shortValue = (num / Math.pow(1000, i));
  const formattedValue = shortValue % 1 !== 0 ? shortValue.toFixed(1) : shortValue.toFixed(0);
  
  return formattedValue + suffixes[i];
};


const PlayerStatItem: React.FC<PlayerStatItemProps> = ({ icon: Icon, label, value, iconClassName }) => (
  <div className="flex items-center p-2 bg-card-foreground/5 rounded-lg border border-border/30 transition-shadow hover:shadow-lg hover:border-primary/50">
    <Icon size={18} className={`mr-2 shrink-0 ${iconClassName || ''}`} />
    <div className="overflow-hidden">
      <p className="font-semibold text-xs text-muted-foreground truncate" title={label}>{label}</p>
      <p className="text-sm font-bold text-foreground break-words" title={String(value)}>
        {typeof value === 'number' ? formatNumberWithAbbreviation(value) : value}
      </p>
    </div>
  </div>
);

interface PlayerStatsCardProps {
  playerData: Player;
}

const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ playerData }) => {
  const orderedKeys: (keyof Player)[] = ['vida', 'ouro', 'nivel', 'xp', 'energia', 'mana'];
  
  const mainStats = orderedKeys.map(key => {
    const rawValue = playerData[key];
    if (rawValue === undefined || rawValue === null) return null;

    let icon = Info;
    let label = key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    let iconClassName = 'text-muted-foreground';
    let value: string | number = rawValue as string | number;

    switch (key) {
      case 'vida': icon = Heart; label = 'Vida'; iconClassName = 'text-destructive'; break;
      case 'ouro': icon = CircleDollarSign; label = 'Ouro'; iconClassName = 'text-[hsl(var(--chart-5))]'; break;
      case 'nivel': icon = Star; label = 'Level'; iconClassName = 'text-[hsl(var(--chart-4))]'; break;
      case 'xp': icon = BarChart3; label = 'XP'; iconClassName = 'text-muted-foreground'; break;
      case 'energia': icon = Zap; label = 'Energia'; iconClassName = 'text-[hsl(var(--chart-4))]'; break;
      case 'mana': icon = Sparkles; label = 'Mana'; iconClassName = 'text-[hsl(var(--chart-1))]'; break;
    }
    return <PlayerStatItem key={key} icon={icon} label={label} value={value} iconClassName={iconClassName} />;
  }).filter(Boolean);

  const otherStats = Object.entries(playerData)
    .filter(([key, value]) => 
      !orderedKeys.includes(key as keyof Player) &&
      key !== 'nome' && 
      key !== 'senha' &&
      key !== 'id' &&
      key !== 'inventario' &&
      value !== undefined && 
      value !== null && 
      String(value).trim() !== ""
    )
    .map(([key, rawValue]) => {
      let displayValue = String(rawValue);
      if (typeof rawValue === 'string' && rawValue.includes('@s.whatsapp.net')) {
        displayValue = rawValue.replace('@s.whatsapp.net', '');
      }
      const numericValue = parseFloat(displayValue);
      const valueToDisplay = !isNaN(numericValue) && String(numericValue) === displayValue ? numericValue : displayValue;

      return (
        <PlayerStatItem 
          key={key}
          icon={Info} 
          label={key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} 
          value={valueToDisplay} 
          iconClassName="text-muted-foreground" 
        />
      );
    });

  const inventoryArray = playerData.inventario ? Object.entries(playerData.inventario) : [];

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
      <CardContent className="grid grid-cols-5 gap-1.5 p-2 sm:gap-2 sm:p-3">
        {mainStats}
        {otherStats}
        
        {inventoryArray.length > 0 && (
          <CardTitle className="col-span-full mt-3 mb-1 pt-3 border-t text-lg font-semibold text-primary">
            Inventário
          </CardTitle>
        )}
        {inventoryArray.map(([itemName, quantity]) => {
          const itemDetail = itemDetails[itemName.toLowerCase()];
          const IconComponent = itemDetail ? itemDetail.icon : Package;
          return (
            <div 
              key={itemName} 
              className="flex flex-col items-center text-center p-2 bg-card-foreground/5 rounded-lg border border-border/30 transition-shadow hover:shadow-lg hover:border-primary/50"
              title={`${itemName} (x${quantity})`}
            >
              <IconComponent size={24} className="mb-1 text-primary" />
              <p className="text-xs font-medium text-muted-foreground capitalize truncate w-full">{itemName}</p>
              <p className="text-sm font-bold text-foreground">x{String(quantity)}</p>
            </div>
          );
        })}
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
    <CardContent className="grid grid-cols-5 gap-1.5 p-2 sm:gap-2 sm:p-3">
      {[...Array(10)].map((_, i) => ( 
        <div key={i} className="flex flex-col items-center p-2 bg-muted/50 rounded-lg border border-border/30">
          <Skeleton className="h-6 w-6 bg-muted rounded-md mb-1" />
          <Skeleton className="h-3 bg-muted rounded w-10/12 mb-0.5" />
          <Skeleton className="h-3.5 bg-muted rounded w-1/2" />
        </div>
      ))}
    </CardContent>
  </Card>
);

export default PlayerStatsCard;

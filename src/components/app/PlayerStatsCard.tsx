
import type { Player } from '@/types/player';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, CircleDollarSign, Star, User, BarChart3, Info, Zap, Sparkles } from 'lucide-react'; // Removido Wallet
import { Skeleton } from '@/components/ui/skeleton';

interface PlayerStatItemProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconClassName?: string;
}

const PlayerStatItem: React.FC<PlayerStatItemProps> = ({ icon: Icon, label, value, iconClassName }) => (
  <div className="flex items-center p-4 bg-card-foreground/5 rounded-lg border border-border/30 transition-shadow hover:shadow-lg">
    <Icon size={24} className={`mr-3 shrink-0 ${iconClassName || ''}`} />
    <div>
      <p className="font-semibold text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-bold text-foreground">{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  </div>
);

interface PlayerStatsCardProps {
  playerData: Player;
}

const PlayerStatsCard: React.FC<PlayerStatsCardProps> = ({ playerData }) => {
  // Ordem desejada: Vida, Ouro, Level, XP, depois Energia, Mana. SaldoBRL foi removido.
  const orderedKeys: (keyof Player)[] = ['vida', 'ouro', 'nivel', 'xp', 'energia', 'mana'];
  
  const mainStats = orderedKeys.map(key => {
    if (playerData[key] === undefined || playerData[key] === null) return null;

    let icon = Info;
    let label = key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    let iconClassName = 'text-muted-foreground';
    let value: string | number = String(playerData[key]);

    switch (key) {
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
    .filter(([key]) => 
      !orderedKeys.includes(key as keyof Player) &&
      key !== 'nome' && 
      key !== 'senha' &&
      key !== 'id' && // Não mostrar o ID do jogador
      playerData[key] !== undefined && 
      playerData[key] !== null && 
      String(playerData[key]).trim() !== ""
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
    <Card className="w-full max-w-lg shadow-2xl bg-card border border-border/50">
      <CardHeader className="pb-4 flex flex-row items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={`https://placehold.co/128x128.png?text=${(playerData.nome || 'P').charAt(0)}`} alt={playerData.nome || 'Player Avatar'} data-ai-hint="abstract geometric" />
          <AvatarFallback><User size={30} /></AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-2xl sm:text-3xl text-primary">
            {playerData.nome || 'Jogador não encontrado'}
          </CardTitle>
          {playerData.nome && <CardDescription className="mt-1">Exibindo estatísticas para {playerData.nome}</CardDescription>}
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {mainStats}
        {otherStats}
      </CardContent>
    </Card>
  );
};

export const PlayerStatsSkeleton: React.FC = () => (
  <Card className="w-full max-w-lg shadow-2xl animate-pulse bg-card border border-border/50">
    <CardHeader className="pb-4 flex flex-row items-center space-x-4">
      <Skeleton className="h-16 w-16 rounded-full" />
      <div>
        <Skeleton className="h-8 bg-muted rounded w-48 mb-2" />
        <Skeleton className="h-4 bg-muted rounded w-32" />
      </div>
    </CardHeader>
    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
      {[...Array(6)].map((_, i) => ( // Ajustado para 6 itens principais
        <div key={i} className="flex items-center p-4 bg-muted/50 rounded-lg border border-border/30">
          <Skeleton className="h-6 w-6 bg-muted rounded-full mr-3 shrink-0" />
          <div className="flex-grow">
            <Skeleton className="h-4 bg-muted rounded w-1/3 mb-1" />
            <Skeleton className="h-5 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default PlayerStatsCard;


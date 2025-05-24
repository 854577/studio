
import type { Player } from '@/types/player';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, CircleDollarSign, Star, User, BarChart3, Info, Zap, Sparkles, Wallet } from 'lucide-react';

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
      <p className="text-lg font-bold text-foreground">{typeof value === 'number' && label !== "Saldo (BRL)" ? value.toLocaleString() : value}</p>
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
    let value: string | number = String(playerData[key]);

    switch (key) {
      case 'saldoBRL':
        icon = Wallet;
        label = 'Saldo (BRL)';
        value = (playerData.saldoBRL ?? 0).toFixed(2);
        iconClassName = 'text-[hsl(var(--chart-2))]';
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
    .filter(([key]) => 
      !orderedKeys.includes(key as keyof Player) &&
      key !== 'nome' && 
      key !== 'senha' && // Explicitly filter out 'senha'
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
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl sm:text-3xl text-primary flex items-center">
          <User size={30} className="mr-3 shrink-0 text-primary" />
          {playerData.nome || 'Jogador não encontrado'}
        </CardTitle>
        {playerData.nome && <CardDescription className="mt-1">Exibindo estatísticas para {playerData.nome}</CardDescription>}
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
    <CardHeader className="pb-4">
      <div className="h-8 bg-muted rounded w-3/4"></div>
      <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
    </CardHeader>
    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
      {[...Array(7)].map((_, i) => ( 
        <div key={i} className="flex items-center p-4 bg-muted/50 rounded-lg border border-border/30">
          <div className="h-6 w-6 bg-muted rounded-full mr-3 shrink-0"></div>
          <div className="flex-grow">
            <div className="h-4 bg-muted rounded w-1/3 mb-1"></div>
            <div className="h-5 bg-muted rounded w-1/2"></div>
          </div>
        </div>
      ))}
    </CardContent>
  </Card>
);

export default PlayerStatsCard;


import type { Player } from '@/types/player';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, CircleDollarSign, Star, User, BarChart3, Info, Zap, Sparkles } from 'lucide-react';

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
  return (
    <Card className="w-full max-w-lg shadow-2xl bg-card border border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl sm:text-3xl text-primary flex items-center">
          <User size={30} className="mr-3 shrink-0 text-primary" />
          {playerData.nome}
        </CardTitle>
        {playerData.nome && <CardDescription className="mt-1">Displaying stats for {playerData.nome}</CardDescription>}
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {playerData.vida !== undefined && (
          <PlayerStatItem icon={Heart} label="Health" value={playerData.vida} iconClassName="text-destructive" />
        )}
        {playerData.ouro !== undefined && (
          <PlayerStatItem icon={CircleDollarSign} label="Ouro" value={playerData.ouro} iconClassName="text-[hsl(var(--chart-5))]" />
        )}
        {playerData.nivel !== undefined && (
          <PlayerStatItem icon={Star} label="Level" value={playerData.nivel} iconClassName="text-[hsl(var(--chart-4))]" />
        )}
        {playerData.xp !== undefined && (
          <PlayerStatItem icon={BarChart3} label="Experience (XP)" value={playerData.xp} iconClassName="text-muted-foreground" />
        )}
        {playerData.energia !== undefined && (
          <PlayerStatItem icon={Zap} label="Energia" value={playerData.energia} iconClassName="text-[hsl(var(--chart-4))]" />
        )}
        {playerData.mana !== undefined && (
          <PlayerStatItem icon={Sparkles} label="Mana" value={playerData.mana} iconClassName="text-[hsl(var(--chart-1))]" />
        )}
        {Object.entries(playerData)
          .filter(([key]) => 
            !['nome', 'vida', 'ouro', 'dinheiro', 'nivel', 'xp', 'id', 'energia', 'mana'].includes(key) && 
            playerData[key] !== undefined && 
            playerData[key] !== null && 
            String(playerData[key]).trim() !== ""
          )
          .map(([key, value]) => (
            <PlayerStatItem 
              key={key}
              icon={Info} 
              label={key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())} // Capitalize each word
              value={String(value)} 
              iconClassName="text-muted-foreground" 
              />
          ))}
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
      {[...Array(6)].map((_, i) => (
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

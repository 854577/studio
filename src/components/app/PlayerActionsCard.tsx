
'use client';

import React from 'react';
import type { Player } from '@/types/player';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Fish, Bed, Dumbbell, Loader2 } from 'lucide-react';
// import { actionConfig } from '@/app/page'; // Importar actionConfig // No longer needed here

type ActionType = 'trabalhar' | 'pescar' | 'dormir' | 'treinar';

interface PlayerActionsCardProps {
  playerData: Player | null;
  currentPlayerId: string | null;
  onAction: (actionType: ActionType) => Promise<void>;
  actionCooldownEndTimes: Record<ActionType, number>;
  timeLeftForAction: Record<ActionType, string | null>;
  isActionInProgress: boolean;
  currentActionLoading: ActionType | null; 
  disabled?: boolean;
  className?: string;
}

const actionButtonConfigClient: Record<ActionType, { label: string, icon: React.ElementType, variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" }> = {
  trabalhar: { label: "Trabalhar", icon: Briefcase, variant: "secondary" },
  pescar: { label: "Pescar", icon: Fish, variant: "secondary" },
  dormir: { label: "Dormir", icon: Bed, variant: "secondary" },
  treinar: { label: "Treinar", icon: Dumbbell, variant: "secondary" },
};

const PlayerActionsCard: React.FC<PlayerActionsCardProps> = ({
  playerData,
  currentPlayerId,
  onAction,
  actionCooldownEndTimes,
  timeLeftForAction,
  isActionInProgress,
  currentActionLoading,
  disabled,
  className,
}) => {
  if (!playerData || !currentPlayerId) return null;

  return (
    <Card className={`w-full max-w-4xl shadow-xl bg-card border-border/50 ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl font-semibold text-primary">Ações do Jogador</CardTitle>
        <CardDescription>Realize atividades para ganhar recompensas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {(Object.keys(actionButtonConfigClient) as ActionType[]).map((actionType) => {
            const config = actionButtonConfigClient[actionType];
            const Icon = config.icon;
            const cooldownTime = timeLeftForAction[actionType];
            const isDisabledByGlobal = disabled || isActionInProgress;
            const isThisActionDisabled = isDisabledByGlobal || !!cooldownTime;
            const isLoadingThisAction = currentActionLoading === actionType;


            return (
              <Button
                key={actionType}
                onClick={() => onAction(actionType)}
                disabled={isThisActionDisabled || isLoadingThisAction} 
                variant={config.variant || "default"}
                className="flex flex-col items-center justify-center w-full h-auto p-4 py-5 space-y-2.5 rounded-lg shadow-md min-h-[100px] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {isLoadingThisAction ? (
                  <Loader2 size={32} className="text-primary-foreground" />
                ) : (
                  <Icon size={32} className={isThisActionDisabled ? "text-muted-foreground" : "text-primary-foreground"} />
                )}
                <span className="text-sm font-semibold">{config.label}</span>
                {cooldownTime && !isLoadingThisAction && ( 
                  <span className="text-xs text-destructive-foreground opacity-90">({cooldownTime})</span>
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerActionsCard;

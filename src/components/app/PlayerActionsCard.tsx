
'use client';

import React from 'react';
import type { Player } from '@/types/player';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Fish, Bed, Dumbbell, Zap } from 'lucide-react'; // Assuming Zap for Treinar is okay, or replace

type ActionType = 'trabalhar' | 'pescar' | 'dormir' | 'treinar';

interface PlayerActionsCardProps {
  playerData: Player | null;
  currentPlayerId: string | null;
  onAction: (actionType: ActionType) => Promise<void>;
  actionCooldownEndTimes: Record<ActionType, number>;
  timeLeftForAction: Record<ActionType, string | null>;
  isActionInProgress: boolean;
  disabled?: boolean;
}

const actionButtonConfig: Record<ActionType, { label: string, icon: React.ElementType, variant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" }> = {
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
  disabled,
}) => {
  if (!playerData || !currentPlayerId) return null;

  return (
    <Card className="w-full max-w-4xl shadow-xl bg-card border-border/50">
      <CardHeader>
        <CardTitle className="text-xl text-primary">Ações do Jogador</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-4">
          {(Object.keys(actionButtonConfig) as ActionType[]).map((actionType) => {
            const config = actionButtonConfig[actionType];
            const Icon = config.icon;
            const cooldownTime = timeLeftForAction[actionType];
            const isDisabled = disabled || isActionInProgress || !!cooldownTime;

            return (
              <Button
                key={actionType}
                onClick={() => onAction(actionType)}
                disabled={isDisabled}
                variant={config.variant || "default"}
                className="flex flex-col items-center justify-center w-full h-auto p-4 space-y-2 transition-transform duration-150 ease-in-out transform rounded-lg shadow-md min-h-[90px] hover:scale-105 active:scale-95"
              >
                <Icon size={28} className={isDisabled ? "text-muted-foreground" : "text-primary-foreground"} />
                <span className="text-sm font-medium">{config.label}</span>
                {cooldownTime && (
                  <span className="text-xs text-destructive-foreground opacity-80">({cooldownTime})</span>
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

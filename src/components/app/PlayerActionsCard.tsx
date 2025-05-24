
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Fish, Bed, Dumbbell } from 'lucide-react';
import type { ActionType } from '@/app/page'; // Assuming ActionType is exported from page.tsx or a shared types file

interface PlayerActionsCardProps {
  onAction: (actionType: ActionType) => void;
  timeLeftForAction: Record<ActionType, string | null>;
  isDisabled: boolean;
}

const actionConfig: Record<ActionType, { label: string; icon: React.ElementType }> = {
  trabalhar: { label: 'Trabalhar', icon: Briefcase },
  pescar: { label: 'Pescar', icon: Fish },
  dormir: { label: 'Dormir', icon: Bed },
  treinar: { label: 'Treinar', icon: Dumbbell },
};

const PlayerActionsCard: React.FC<PlayerActionsCardProps> = ({ onAction, timeLeftForAction, isDisabled }) => {
  return (
    <Card className="w-full max-w-lg mt-8 shadow-xl bg-card border-border/50">
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 lucide lucide-gamepad-2"><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/><path d="M6 18h4"/><path d="M14 18h4"/></svg>
          Ações do Jogador
        </CardTitle>
        <CardDescription>Realize ações para ganhar recompensas.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {(Object.keys(actionConfig) as ActionType[]).map((action) => {
          const { label, icon: Icon } = actionConfig[action];
          const currentCooldown = timeLeftForAction[action];
          const buttonIsDisabled = isDisabled || !!currentCooldown;
          return (
            <Button
              key={action}
              onClick={() => onAction(action)}
              disabled={buttonIsDisabled}
              className="w-full py-4 text-sm sm:text-base flex flex-col h-auto items-center justify-center"
              variant={buttonIsDisabled ? "secondary" : "default"}
            >
              <Icon className={`mb-1 h-5 w-5 ${buttonIsDisabled ? 'text-muted-foreground' : ''}`} />
              <div className="flex flex-col items-center text-center">
                <span className="font-semibold">{label}</span>
                {currentCooldown && <span className="text-xs text-muted-foreground">({currentCooldown})</span>}
              </div>
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default PlayerActionsCard;

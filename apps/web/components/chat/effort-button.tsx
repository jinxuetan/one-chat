import type { Effort } from "@/lib/ai/config";
import { Button } from "@workspace/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";
import { Brain, ChevronDown } from "lucide-react";
import { useState } from "react";

interface EffortButtonProps {
  effort: Effort;
  onEffortChange: (effort: Effort) => void;
  disabled?: boolean;
}

const BrainLow = ({ className }: { className?: string }) => (
  <Brain className={className} strokeWidth={1.5} fill="none" />
);

const BrainMedium = ({ className }: { className?: string }) => (
  <Brain className={className} strokeWidth={2} fill="none" />
);

const BrainHigh = ({ className }: { className?: string }) => (
  <Brain
    className={className}
    strokeWidth={2.5}
    fill="currentColor"
    fillOpacity={0.2}
  />
);

const EFFORT_CONFIG = {
  low: {
    label: "Low",
    description: "Quick responses",
    icon: BrainLow,
    intensity: "Light processing",
  },
  medium: {
    label: "Medium",
    description: "Balanced reasoning",
    icon: BrainMedium,
    intensity: "Standard processing",
  },
  high: {
    label: "High",
    description: "Deep thinking",
    icon: BrainHigh,
    intensity: "Intensive processing",
  },
} as const;

export const EffortButton = ({
  effort,
  onEffortChange,
  disabled = false,
}: EffortButtonProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleEffortSelect = (newEffort: Effort) => {
    onEffortChange(newEffort);
    setIsPopoverOpen(false);
  };

  const currentConfig = EFFORT_CONFIG[effort];
  const CurrentIcon = currentConfig.icon;

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 px-2.5">
          <CurrentIcon className="size-3.5 text-foreground" />
          <span className="font-medium text-foreground">
            {currentConfig.label}
          </span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-48 p-1" align="start" sideOffset={6}>
        <div className="space-y-px">
          {(
            Object.entries(EFFORT_CONFIG) as [
              Effort,
              (typeof EFFORT_CONFIG)[Effort],
            ][]
          ).map(([effortLevel, config]) => {
            const IconComponent = config.icon;
            return (
              <button
                key={effortLevel}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                  effort === effortLevel
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:bg-accent/60 hover:text-accent-foreground"
                )}
                onClick={() => handleEffortSelect(effortLevel)}
                disabled={disabled}
              >
                <IconComponent className="size-3.5 shrink-0 text-current" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{config.label}</div>
                  <div className="text-muted-foreground">
                    {config.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

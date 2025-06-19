"use client";

import { useUserSettings } from "@/hooks/use-user-settings";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { useSidebar } from "@workspace/ui/components/sidebar";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { Bot, Briefcase, Settings2, User, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRESET_TRAITS = [
  "friendly",
  "witty",
  "concise",
  "curious",
  "empathetic",
  "creative",
  "patient",
  "analytical",
  "enthusiastic",
  "professional",
  "casual",
  "encouraging",
];

export const UserSettingsDialog = ({
  open,
  onOpenChange,
}: UserSettingsDialogProps) => {
  const { open: sidebarOpen } = useSidebar();
  const { settings, updateSettings, resetSettings } = useUserSettings();

  // Local state for form inputs
  const [formData, setFormData] = useState({
    name: settings.name,
    occupation: settings.occupation,
    traits: settings.traits,
    additionalContext: settings.additionalContext,
    responseStyle: settings.responseStyle,
    usePersonalization: settings.usePersonalization,
  });

  const [newTrait, setNewTrait] = useState("");

  useEffect(() => {
    // Sync local form state when settings from the hook change (e.g., after a reset)
    setFormData({
      name: settings.name,
      occupation: settings.occupation,
      traits: settings.traits,
      additionalContext: settings.additionalContext,
      responseStyle: settings.responseStyle,
      usePersonalization: settings.usePersonalization,
    });
  }, [settings]);

  const handleInputChange = useCallback(
    (field: string, value: string | boolean | string[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleAddTrait = useCallback(
    (trait: string) => {
      if (trait && !formData.traits.includes(trait)) {
        const updatedTraits = [...formData.traits, trait];
        handleInputChange("traits", updatedTraits);
        setNewTrait("");
      }
    },
    [formData.traits, handleInputChange]
  );

  const handleRemoveTrait = useCallback(
    (trait: string) => {
      const updatedTraits = formData.traits.filter((t) => t !== trait);
      handleInputChange("traits", updatedTraits);
    },
    [formData.traits, handleInputChange]
  );

  const handleSave = useCallback(() => {
    updateSettings(formData);
    onOpenChange(false);
  }, [formData, updateSettings, onOpenChange]);

  const handleReset = useCallback(() => {
    resetSettings();
  }, [resetSettings]);

  const handleCancel = useCallback(() => {
    // Revert form data to the initial settings from the hook
    setFormData({
      name: settings.name,
      occupation: settings.occupation,
      traits: settings.traits,
      additionalContext: settings.additionalContext,
      responseStyle: settings.responseStyle,
      usePersonalization: settings.usePersonalization,
    });
    onOpenChange(false);
  }, [settings, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[90dvh] w-[95vw] max-w-4xl overflow-y-auto md:min-w-3xl",
          sidebarOpen && "md:left-[calc(50%+8rem)]"
        )}
      >
        <DialogHeader>
          <DialogTitle>Customize Your AI Experience</DialogTitle>
          <DialogDescription>
            Personalize how the AI responds to you. Your settings are synced
            across your devices.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 py-4">
          {/* User Profile Section */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 border-border/50 border-b pb-6 md:grid-cols-3 md:gap-x-8 md:pb-8">
            <div>
              <h2 className="flex items-center gap-2 font-medium text-base text-foreground">
                <User className="size-4" />
                User Profile
              </h2>
              <p className="mt-1 text-muted-foreground text-sm">
                This information helps the AI understand who you are.
              </p>
            </div>
            <div className="space-y-6 md:col-span-2">
              <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-3 sm:items-center">
                <label
                  htmlFor="name"
                  className="flex items-center gap-2 font-medium text-sm sm:col-span-1"
                >
                  <User className="size-3.5" />
                  Name
                </label>
                <div className="sm:col-span-2">
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    maxLength={50}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-3 sm:items-center">
                <label
                  htmlFor="occupation"
                  className="flex items-center gap-2 font-medium text-sm sm:col-span-1"
                >
                  <Briefcase className="size-3.5" />
                  Occupation
                </label>
                <div className="sm:col-span-2">
                  <Input
                    id="occupation"
                    placeholder="Engineer, student, etc."
                    value={formData.occupation}
                    onChange={(e) =>
                      handleInputChange("occupation", e.target.value)
                    }
                    maxLength={100}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* AI Customization Section */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 border-border/50 border-b pb-6 md:grid-cols-3 md:gap-x-8 md:pb-8">
            <div>
              <h2 className="flex items-center gap-2 font-medium text-base text-foreground">
                <Bot className="size-4" />
                AI Customization
              </h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Tailor the AI's personality and response style.
              </p>
            </div>
            <div className="space-y-6 md:col-span-2">
              <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-3">
                <span className="font-medium text-sm sm:col-span-1 sm:pt-2">
                  Personality Traits
                </span>
                <div className="space-y-3 sm:col-span-2">
                  <div className="flex min-h-[2.25rem] flex-wrap gap-2 rounded-md border bg-muted/20 p-2">
                    {formData.traits.map((trait) => (
                      <Badge
                        key={trait}
                        variant="secondary"
                        className="cursor-pointer gap-1"
                        onClick={() => handleRemoveTrait(trait)}
                      >
                        {trait}
                        <X className="size-3" />
                      </Badge>
                    ))}
                    {formData.traits.length === 0 && (
                      <div className="flex items-center text-muted-foreground text-sm">
                        Add traits below...
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a trait..."
                      value={newTrait}
                      onChange={(e) => setNewTrait(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newTrait.trim()) {
                          e.preventDefault();
                          handleAddTrait(newTrait.trim());
                        }
                      }}
                      maxLength={100}
                      disabled={formData.traits.length >= 50}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleAddTrait(newTrait.trim())}
                      disabled={
                        !newTrait.trim() || formData.traits.length >= 50
                      }
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_TRAITS.filter(
                      (trait) => !formData.traits.includes(trait)
                    )
                      .slice(0, 8)
                      .map((trait) => (
                        <Button
                          key={trait}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddTrait(trait)}
                          disabled={formData.traits.length >= 50}
                          className="h-7 text-xs"
                        >
                          + {trait}
                        </Button>
                      ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-3">
                <label
                  htmlFor="additional-context"
                  className="font-medium text-sm sm:col-span-1 sm:pt-2"
                >
                  Additional Context
                </label>
                <div className="sm:col-span-2">
                  <Textarea
                    id="additional-context"
                    placeholder="Interests, values, or preferences for the AI to keep in mind"
                    value={formData.additionalContext}
                    onChange={(e) =>
                      handleInputChange("additionalContext", e.target.value)
                    }
                    maxLength={3000}
                    rows={4}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-3 sm:items-center">
                <label
                  htmlFor="response-style"
                  className="font-medium text-sm sm:col-span-1"
                >
                  Response Style
                </label>
                <div className="sm:col-span-2">
                  <Select
                    value={formData.responseStyle}
                    onValueChange={(value) =>
                      handleInputChange("responseStyle", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">
                        Concise - Brief and to the point
                      </SelectItem>
                      <SelectItem value="balanced">
                        Balanced - Standard responses
                      </SelectItem>
                      <SelectItem value="detailed">
                        Detailed - Comprehensive explanations
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Personalization Toggle Section */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-3 md:gap-x-8">
            <div>
              <h2 className="flex items-center gap-2 font-medium text-base text-foreground">
                <Settings2 className="size-4" />
                Personalization
              </h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Toggle whether these personalizations are active.
              </p>
            </div>
            <div className="flex items-center rounded-lg border p-4 md:col-span-2">
              <div className="flex-1 space-y-1">
                <p className="font-medium text-sm">Enable Personalization</p>
                <p className="text-muted-foreground text-sm">
                  Use your settings to personalize AI responses.
                </p>
              </div>
              <Switch
                checked={formData.usePersonalization}
                onCheckedChange={(checked) =>
                  handleInputChange("usePersonalization", checked)
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            className="w-full sm:mr-auto sm:w-auto"
            onClick={handleReset}
          >
            Reset to Defaults
          </Button>
          <div className="flex w-full flex-col-reverse gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleSave}>
              Save Preferences
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

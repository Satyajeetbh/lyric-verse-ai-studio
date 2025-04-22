
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ThemeOption } from "@/lib/types";
import { themeOptions } from "@/lib/themes";

interface ThemeSelectorProps {
  onThemeSelect: (theme: ThemeOption) => void;
  selectedTheme: ThemeOption | null;
  onGenerateBackground: (theme: ThemeOption) => Promise<void>;
  isGenerating: boolean;
}

export function ThemeSelector({
  onThemeSelect,
  selectedTheme,
  onGenerateBackground,
  isGenerating
}: ThemeSelectorProps) {
  const [customPrompt, setCustomPrompt] = useState("");
  
  const handleThemeSelect = (themeId: string) => {
    const theme = themeOptions.find(t => t.id === themeId);
    if (theme) {
      onThemeSelect(theme);
    }
  };
  
  const handleGenerateClick = async () => {
    if (!selectedTheme) {
      toast.error("Please select a theme first");
      return;
    }
    
    await onGenerateBackground(selectedTheme);
  };

  return (
    <Card className="bg-secondary/50">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Choose a Visual Theme</h3>
        
        <RadioGroup 
          value={selectedTheme?.id || ""}
          onValueChange={handleThemeSelect}
          className="grid grid-cols-2 gap-4 mb-6"
        >
          {themeOptions.map((theme) => (
            <label
              key={theme.id}
              className={`relative flex flex-col h-40 rounded-lg border-2 cursor-pointer p-4 hover:bg-muted/50 transition-colors ${
                selectedTheme?.id === theme.id
                  ? "border-primary"
                  : "border-border"
              }`}
            >
              <RadioGroupItem
                value={theme.id}
                id={theme.id}
                className="sr-only"
              />
              <div className="h-20 rounded bg-muted mb-2">
                {/* Preview image would go here */}
              </div>
              <div>
                <h4 className="font-medium text-sm">{theme.name}</h4>
                <p className="text-xs text-muted-foreground">
                  {theme.description}
                </p>
              </div>
            </label>
          ))}
        </RadioGroup>
        
        <div className="flex justify-center mt-4">
          <Button 
            onClick={handleGenerateClick}
            disabled={!selectedTheme || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                Generating Background...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate AI Background
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

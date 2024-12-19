import React from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RotateCw, RotateCcw, Maximize2, Palette } from "lucide-react";

interface ScreenControlsProps {
  selectedScreen: {
    id: string;
    name: string;
    isActive: boolean;
    currentContent?: {
      type: "video" | "image";
      title: string;
      url: string;
      rotation?: number;
      scale?: number;
      backgroundColor?: string;
    };
  } | null;
  onUpdateScreen: (screenId: string, updates: any) => void;
}

export const ScreenControls: React.FC<ScreenControlsProps> = ({
  selectedScreen,
  onUpdateScreen,
}) => {
  if (!selectedScreen) {
    return (
      <Card className="p-4">
        <p className="text-center text-muted-foreground">
          Selecione uma tela para ajustar seu conteúdo
        </p>
      </Card>
    );
  }

  const handleRotationChange = (value: number[]) => {
    onUpdateScreen(selectedScreen.id, {
      rotation: value[0],
    });
  };

  const handleQuickRotate = (degrees: number) => {
    const currentRotation = selectedScreen.currentContent?.rotation || 0;
    const newRotation = (currentRotation + degrees) % 360;
    onUpdateScreen(selectedScreen.id, {
      rotation: newRotation,
    });
  };

  const handleScaleChange = (value: number[]) => {
    onUpdateScreen(selectedScreen.id, {
      scale: value[0],
    });
  };

  const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateScreen(selectedScreen.id, {
      backgroundColor: event.target.value,
    });
  };

  // Calculate scale percentage (now up to 5000%)
  const scalePercentage = Math.round(((selectedScreen.currentContent?.scale || 1) - 0.5) * 10000);

  return (
    <Card className="p-4 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RotateCw className="w-4 h-4" />
            <Label>Rotação</Label>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuickRotate(-90)}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleQuickRotate(90)}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Slider
          defaultValue={[selectedScreen.currentContent?.rotation || 0]}
          max={360}
          step={1}
          onValueChange={handleRotationChange}
        />
        <div className="text-right text-sm text-muted-foreground">
          {selectedScreen.currentContent?.rotation || 0}°
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Maximize2 className="w-4 h-4" />
            <Label>Tamanho</Label>
          </div>
          <span className="text-sm text-muted-foreground">{scalePercentage}%</span>
        </div>
        <Slider
          defaultValue={[selectedScreen.currentContent?.scale || 1]}
          min={0.5}
          max={50} // Aumentado para permitir 5000% de zoom
          step={0.1}
          onValueChange={handleScaleChange}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <Label>Cor de Fundo</Label>
        </div>
        <div className="flex gap-2">
          <Input
            type="color"
            value={selectedScreen.currentContent?.backgroundColor || "#000000"}
            onChange={handleColorChange}
            className="w-12 h-10 p-1 cursor-pointer"
          />
          <Input
            type="text"
            value={selectedScreen.currentContent?.backgroundColor || "#000000"}
            onChange={handleColorChange}
            className="flex-1"
            placeholder="Digite um código de cor (ex: #000000)"
          />
        </div>
      </div>
    </Card>
  );
};
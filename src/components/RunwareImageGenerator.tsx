import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { toast } from "sonner";
import { RunwareService, GenerateImageParams, GeneratedImage } from "@/services/runware";
import { supabase } from "@/integrations/supabase/client";
import { RunwarePromptInput } from "./runware/RunwarePromptInput";
import { RunwareModelSettings } from "./runware/RunwareModelSettings";
import { RunwareGeneratedImages } from "./runware/RunwareGeneratedImages";

interface RunwareImageGeneratorProps {
  onImageGenerated: (imageUrl: string) => void;
  onImageSaved?: () => void;
  slideshowEnabled?: boolean;
  slideshowInterval?: number;
  activeScreens?: { id: string }[];
}

export const RunwareImageGenerator: React.FC<RunwareImageGeneratorProps> = ({
  onImageGenerated,
  onImageSaved,
  slideshowEnabled = false,
  slideshowInterval = 5000,
  activeScreens = [],
}) => {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [model, setModel] = useState("runware:100@1");
  const [numberResults, setNumberResults] = useState(1);
  const [outputFormat, setOutputFormat] = useState<"WEBP" | "PNG" | "JPEG">("WEBP");
  const [cfgScale, setCfgScale] = useState(1);
  const [guidance, setGuidance] = useState(3.5);
  const [scheduler, setScheduler] = useState("FlowMatchEulerDiscreteScheduler");
  const [strength, setStrength] = useState(1);
  const [promptWeighting, setPromptWeighting] = useState<"compel" | "sdEmbeds" | null>(null);
  const [seed, setSeed] = useState<string>("");
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Por favor, digite um prompt para gerar a imagem");
      return;
    }

    // Se o slideshow estiver habilitado, ajustar o número de resultados com base nas telas ativas
    if (slideshowEnabled && activeScreens.length > 0) {
      setNumberResults(activeScreens.length * 2); // Gerar 2 imagens por tela ativa
    }

    setIsGenerating(true);

    try {
      const { data: { RUNWARE_API_KEY }, error } = await supabase.functions.invoke('get-runware-key');
      
      if (error || !RUNWARE_API_KEY) {
        throw new Error("Não foi possível obter a chave da API do Runware");
      }

      const runwareService = new RunwareService(RUNWARE_API_KEY);
      
      const params: GenerateImageParams = {
        positivePrompt: prompt,
        model,
        numberResults,
        outputFormat,
        CFGScale: cfgScale,
        guidance,
        scheduler,
        strength,
        seed: seed ? Number(seed) : null,
        lora: [],
      };

      if (model !== "runware:100@1" && promptWeighting) {
        params.promptWeighting = promptWeighting;
      }

      console.log("Generating images with params:", params);
      const result = await runwareService.generateImage(params);
      console.log("Generated images result:", result);
      
      setGeneratedImages(result);
      
      // Handle slideshow generation if enabled
      if (slideshowEnabled && activeScreens.length > 0) {
        // Distribuir as imagens entre as telas ativas
        const imagesPerScreen = Math.ceil(result.length / activeScreens.length);
        let currentImageIndex = 0;

        for (const screen of activeScreens) {
          const screenImages = result.slice(
            currentImageIndex,
            currentImageIndex + imagesPerScreen
          );
          
          for (const image of screenImages) {
            if (image.imageURL) {
              // Salvar imagem com flag de slideshow
              const response = await fetch(image.imageURL);
              const blob = await response.blob();
              const file = new File([blob], `ai-image-${Date.now()}.webp`, { type: 'image/webp' });
              
              const filePath = `ai-generated/${file.name}`;
              const { error: uploadError } = await supabase.storage
                .from('media')
                .upload(filePath, file);

              if (uploadError) throw uploadError;

              const { error: insertError } = await supabase
                .from('media_items')
                .insert({
                  title: "Imagem Gerada por IA (Slideshow)",
                  type: "image",
                  file_path: filePath,
                  file_size: file.size,
                  is_slideshow: true,
                });

              if (insertError) throw insertError;
            }
          }
          currentImageIndex += imagesPerScreen;
        }
        
        if (onImageSaved) {
          onImageSaved();
        }
        
        toast.success(`${result.length} imagens geradas e distribuídas entre ${activeScreens.length} telas!`);
      } else {
        result.forEach((image: GeneratedImage) => {
          if (image.imageURL) {
            onImageGenerated(image.imageURL);
          }
        });
        toast.success(`${result.length} ${result.length === 1 ? 'imagem gerada' : 'imagens geradas'} com sucesso!`);
      }
    } catch (error) {
      console.error("Erro ao gerar imagem:", error);
      toast.error("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Gerar Imagem com IA</h3>
      
      <div className="space-y-4">
        <RunwarePromptInput
          prompt={prompt}
          setPrompt={setPrompt}
          isGenerating={isGenerating}
        />

        <RunwareModelSettings
          model={model}
          setModel={setModel}
          numberResults={numberResults}
          setNumberResults={setNumberResults}
          outputFormat={outputFormat}
          setOutputFormat={setOutputFormat}
          cfgScale={cfgScale}
          setCfgScale={setCfgScale}
          guidance={guidance}
          setGuidance={setGuidance}
          scheduler={scheduler}
          setScheduler={setScheduler}
          strength={strength}
          setStrength={setStrength}
          promptWeighting={promptWeighting}
          setPromptWeighting={setPromptWeighting}
          seed={seed}
          setSeed={setSeed}
          isGenerating={isGenerating}
        />

        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full flex items-center gap-2"
        >
          <Wand2 className="w-4 h-4" />
          {isGenerating ? "Gerando..." : "Gerar"}
        </Button>

        <RunwareGeneratedImages 
          images={generatedImages} 
          onImageSaved={onImageSaved}
        />
      </div>
    </Card>
  );
};
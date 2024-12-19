import React, { useState } from "react";
import { MediaGallery } from "@/components/MediaGallery";
import { ScreenGrid } from "@/components/ScreenGrid";
import { ScreenControls } from "@/components/ScreenControls";
import { FileUpload } from "@/components/FileUpload";
import { RunwareImageGenerator } from "@/components/RunwareImageGenerator";
import { ImageSlider } from "@/components/ImageSlider";
import { SessionManager } from "@/components/SessionManager";
import { useScreens } from "@/hooks/useScreens";
import { useMediaItems } from "@/hooks/useMediaItems";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useSlideshow } from "@/hooks/useSlideshow";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import type { Database } from "@/integrations/supabase/types";
import type { Session } from "@/hooks/useSessions";
import { useSessions } from "@/hooks/useSessions";
import { toast } from "sonner";

type MediaItem = Database["public"]["Tables"]["media_items"]["Row"] & {
  url: string;
};

const Index = () => {
  const { 
    screens, 
    selectedScreen, 
    handleScreenSelect, 
    handleUpdateScreen, 
    handleMediaDrop, 
    handleRemoveScreen, 
    addNewScreen, 
    resetScreens 
  } = useScreens();
  const { mediaItems, loadMediaItems } = useMediaItems();
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const { saveSession } = useSessions();
  const { 
    slideshowEnabled, 
    setSlideshowEnabled,
    slideshowInterval,
    setSlideshowInterval,
    updateSlideshowSettings,
    loadSlideshowSettings
  } = useSlideshow();

  const handleImageGenerated = (imageUrl: string) => {
    setGeneratedImages((prev) => [...prev, imageUrl]);
  };

  const handleGeneratedImageSelect = (imageUrl: string) => {
    if (selectedScreen) {
      const mediaItem: MediaItem = {
        id: crypto.randomUUID(),
        title: "Imagem Gerada por IA",
        type: "image",
        url: imageUrl,
        file_path: `ai-generated/ai-image-${Date.now()}.webp`,
        file_size: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      handleMediaDrop(mediaItem, selectedScreen.id);
    }
  };

  const handleLoadSession = (session: Session) => {
    resetScreens(session.screens);
    loadSlideshowSettings(session);
    toast.success("Sessão carregada com sucesso!");
  };

  const handleSaveSession = async (name: string) => {
    await saveSession(name, screens, mediaItems);
    toast.success("Sessão salva com sucesso!");
  };

  const handleNewSession = () => {
    resetScreens([]);
    toast.success("Nova sessão iniciada!");
  };

  const handleSlideshowToggle = async (checked: boolean) => {
    setSlideshowEnabled(checked);
    if (selectedSession) {
      await updateSlideshowSettings(selectedSession.id, checked, slideshowInterval);
      toast.success(checked ? "Slideshow ativado!" : "Slideshow desativado!");
    }
  };

  const handleIntervalChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value);
    if (!isNaN(value) && value >= 1000) {
      setSlideshowInterval(value);
      if (selectedSession) {
        await updateSlideshowSettings(selectedSession.id, slideshowEnabled, value);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Central de Controle</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={handleNewSession}
            >
              <Plus className="w-4 h-4" />
              Nova Sessão
            </Button>
            <SessionManager
              onLoadSession={handleLoadSession}
              onSaveSession={handleSaveSession}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-lg shadow-sm">
              <ScreenControls 
                selectedScreen={selectedScreen}
                onUpdateScreen={handleUpdateScreen}
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <RunwareImageGenerator 
                onImageGenerated={handleImageGenerated}
                onImageSaved={loadMediaItems}
                slideshowEnabled={slideshowEnabled}
                slideshowInterval={slideshowInterval}
              />
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Slideshow</label>
                  <Switch
                    checked={slideshowEnabled}
                    onCheckedChange={handleSlideshowToggle}
                  />
                </div>
                {slideshowEnabled && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Intervalo (ms)
                    </label>
                    <Input
                      type="number"
                      min="1000"
                      step="1000"
                      value={slideshowInterval}
                      onChange={handleIntervalChange}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
              <ImageSlider images={generatedImages} onSelect={handleGeneratedImageSelect} />
            </div>
          </div>
          
          <div className="lg:col-span-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Telas Ativas</h2>
                <Button 
                  onClick={addNewScreen}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Nova Tela
                </Button>
              </div>
              <ScreenGrid 
                screens={screens} 
                onScreenSelect={handleScreenSelect} 
                onDrop={handleMediaDrop}
                onRemoveScreen={handleRemoveScreen}
              />
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-200px)]">
              <h2 className="text-xl font-semibold p-4 border-b">Galeria de Mídia</h2>
              <MediaGallery 
                items={mediaItems} 
                onSelect={(item) => selectedScreen && handleMediaDrop(item, selectedScreen.id)} 
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h2 className="text-xl font-semibold mb-4">Upload</h2>
              <FileUpload onUploadComplete={loadMediaItems} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;

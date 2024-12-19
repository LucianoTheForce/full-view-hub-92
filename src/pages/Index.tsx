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
import type { Database } from "@/integrations/supabase/types";
import type { Session } from "@/hooks/useSessions";

type MediaItem = Database["public"]["Tables"]["media_items"]["Row"] & {
  url: string;
};

const Index = () => {
  const { screens, selectedScreen, handleScreenSelect, handleUpdateScreen, handleMediaDrop, handleRemoveScreen, addNewScreen } = useScreens();
  const { mediaItems, loadMediaItems } = useMediaItems();
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);

  const handleImageGenerated = (imageUrl: string) => {
    setGeneratedImages((prev) => [...prev, imageUrl]);
  };

  const handleGeneratedImageSelect = (imageUrl: string) => {
    if (selectedScreen) {
      handleMediaDrop({
        type: "image",
        title: "Imagem Gerada por IA",
        url: imageUrl
      }, selectedScreen.id);
    }
  };

  const handleLoadSession = (session: Session) => {
    // Implementar a lógica para carregar a sessão
    console.log("Carregando sessão:", session);
  };

  const handleSaveSession = async (name: string) => {
    // Implementar a lógica para salvar a sessão
    console.log("Salvando sessão:", name);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Central de Controle</h1>
          <SessionManager
            onLoadSession={handleLoadSession}
            onSaveSession={handleSaveSession}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Coluna da Esquerda - Controles e Geração de Imagens */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <ScreenControls 
                selectedScreen={selectedScreen}
                onUpdateScreen={handleUpdateScreen}
              />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4">
              <RunwareImageGenerator 
                onImageGenerated={handleImageGenerated} 
                onImageSaved={loadMediaItems}
              />
              <ImageSlider images={generatedImages} onSelect={handleGeneratedImageSelect} />
            </div>
          </div>

          {/* Coluna Central - Telas */}
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

          {/* Coluna da Direita - Galeria e Upload */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-200px)]">
              <h2 className="text-xl font-semibold p-4 border-b">Galeria de Mídia</h2>
              <MediaGallery 
                items={mediaItems} 
                onSelect={(item) => handleMediaDrop(item, selectedScreen?.id || '')} 
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
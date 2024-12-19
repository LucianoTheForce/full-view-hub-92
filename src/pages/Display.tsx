import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ScreenContent {
  type: "video" | "image";
  url: string;
  title: string;
  rotation?: number;
  scale?: number;
  backgroundColor?: string;
}

const Display = () => {
  const { screenId } = useParams();
  const [content, setContent] = useState<ScreenContent | null>(null);

  useEffect(() => {
    // Função para carregar o conteúdo do localStorage
    const loadInitialContent = () => {
      try {
        const screens = JSON.parse(localStorage.getItem('screens') || '[]');
        const currentScreen = screens.find((s: any) => s.id === screenId);
        console.log('Initial screen content:', currentScreen);
        
        if (currentScreen?.currentContent) {
          console.log('Setting initial content:', currentScreen.currentContent);
          setContent(currentScreen.currentContent);
        }
      } catch (error) {
        console.error('Error loading initial content:', error);
      }
    };

    // Função para configurar o canal de tempo real
    const setupRealtimeChannel = () => {
      const channel = supabase.channel(`screen_${screenId}`)
        .on('broadcast', { event: 'content_update' }, (payload) => {
          console.log('Received broadcast update:', payload);
          if (payload.payload?.screenId === screenId && payload.payload?.content) {
            console.log('Updating content from broadcast:', payload.payload.content);
            setContent(payload.payload.content);
          }
        })
        .subscribe((status) => {
          console.log(`Subscription status for screen ${screenId}:`, status);
        });

      return channel;
    };

    // Carregar conteúdo inicial e configurar canal
    loadInitialContent();
    const channel = setupRealtimeChannel();

    // Atualizar título da página
    document.title = `Tela ${screenId}`;

    // Cleanup
    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  }, [screenId]);

  // Loading state
  if (!content) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-white">Carregando...</div>
      </div>
    );
  }

  // Estilos para o conteúdo
  const contentStyle = {
    transform: `rotate(${content.rotation || 0}deg) scale(${content.scale || 1})`,
    transition: 'transform 0.3s ease-in-out',
  };

  return (
    <div 
      className="relative w-screen h-screen flex items-center justify-center"
      style={{ backgroundColor: content.backgroundColor || 'black' }}
    >
      {content.type === "video" ? (
        <video
          key={content.url} // Força o recarregamento do vídeo quando a URL muda
          src={content.url}
          className="w-full h-full object-contain"
          style={contentStyle}
          autoPlay
          loop
          muted
          playsInline
          controls
        />
      ) : (
        <img 
          key={content.url} // Força o recarregamento da imagem quando a URL muda
          src={content.url} 
          alt={content.title} 
          className="w-full h-full object-contain"
          style={contentStyle}
        />
      )}
    </div>
  );
};

export default Display;
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Display = () => {
  const { screenId } = useParams();
  const [content, setContent] = useState<{
    type: "video" | "image";
    url: string;
    title: string;
    rotation?: number;
    scale?: number;
    backgroundColor?: string;
  } | null>(null);

  useEffect(() => {
    const loadScreenContent = async () => {
      try {
        // Carregar conteúdo inicial do localStorage
        const screens = JSON.parse(localStorage.getItem('screens') || '[]');
        const currentScreen = screens.find((s: any) => s.id === screenId);
        console.log('Loading initial content for screen:', screenId, currentScreen);
        if (currentScreen?.currentContent) {
          setContent(currentScreen.currentContent);
        }

        // Inscrever no canal do Supabase para atualizações em tempo real
        const channel = supabase.channel(`screen_${screenId}`)
          .on('broadcast', { event: 'content_update' }, (payload) => {
            console.log('Received broadcast update:', payload);
            if (payload.payload?.screenId === screenId && payload.payload?.content) {
              setContent(payload.payload.content);
            }
          })
          .subscribe((status) => {
            console.log(`Subscription status for screen ${screenId}:`, status);
          });

        return () => {
          console.log(`Unsubscribing from screen ${screenId}`);
          channel.unsubscribe();
        };
      } catch (error) {
        console.error('Error in loadScreenContent:', error);
      }
    };

    loadScreenContent();
    document.title = `Tela ${screenId}`;
  }, [screenId]);

  if (!content) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-white">Carregando...</div>
      </div>
    );
  }

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
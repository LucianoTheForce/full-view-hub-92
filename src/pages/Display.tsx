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

interface Screen {
  id: string;
  name: string;
  isActive: boolean;
  currentContent?: ScreenContent;
}

const Display = () => {
  const { screenId } = useParams();
  const [content, setContent] = useState<ScreenContent | null>(() => {
    try {
      // Tentar carregar do localStorage
      const savedScreens = window.localStorage.getItem('screens');
      console.log('Tentando carregar do localStorage:', { savedScreens, screenId });
      
      if (!savedScreens) {
        console.log('Nenhuma tela encontrada no localStorage');
        return null;
      }

      let screens: Screen[];
      try {
        screens = JSON.parse(savedScreens);
        console.log('Telas parseadas:', screens);
      } catch (parseError) {
        console.error('Erro ao fazer parse das telas:', parseError);
        return null;
      }

      if (!Array.isArray(screens)) {
        console.error('Dados inválidos no localStorage - não é um array');
        return null;
      }

      const currentScreen = screens.find(s => String(s.id) === String(screenId));
      console.log('Tela encontrada:', currentScreen);

      if (!currentScreen) {
        console.log(`Nenhuma tela encontrada com ID ${screenId}`);
        return null;
      }

      if (!currentScreen.currentContent) {
        console.log('Tela encontrada mas sem conteúdo');
        return null;
      }

      console.log('Conteúdo encontrado:', currentScreen.currentContent);
      return currentScreen.currentContent;
    } catch (error) {
      console.error('Erro ao carregar conteúdo inicial:', error);
      return null;
    }
  });

  useEffect(() => {
    console.log('Configurando canal em tempo real para tela:', screenId);
    
    const channel = supabase.channel(`screen_${screenId}`)
      .on('broadcast', { event: 'content_update' }, (payload) => {
        console.log('Recebido broadcast:', payload);
        if (payload.payload?.screenId === screenId && payload.payload?.content) {
          console.log('Atualizando conteúdo do broadcast:', payload.payload.content);
          setContent(payload.payload.content);
        }
      })
      .subscribe((status) => {
        console.log(`Status da inscrição para tela ${screenId}:`, status);
      });

    // Tentar recarregar do localStorage periodicamente se não houver conteúdo
    let retryInterval: number | null = null;
    if (!content) {
      retryInterval = window.setInterval(() => {
        const savedScreens = window.localStorage.getItem('screens');
        if (savedScreens) {
          try {
            const screens = JSON.parse(savedScreens);
            const currentScreen = screens.find(s => String(s.id) === String(screenId));
            if (currentScreen?.currentContent) {
              console.log('Conteúdo encontrado em retry:', currentScreen.currentContent);
              setContent(currentScreen.currentContent);
              if (retryInterval) window.clearInterval(retryInterval);
            }
          } catch (error) {
            console.error('Erro ao tentar recarregar:', error);
          }
        }
      }, 1000);
    }

    document.title = `Tela ${screenId}`;

    return () => {
      console.log('Limpando recursos...');
      supabase.removeChannel(channel);
      if (retryInterval) window.clearInterval(retryInterval);
    };
  }, [screenId, content]);

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
          key={content.url}
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
          key={content.url}
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
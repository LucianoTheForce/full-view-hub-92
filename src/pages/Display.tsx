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
  const [content, setContent] = useState<ScreenContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('Iniciando configuração para tela:', screenId);
    
    // Função para tentar carregar o conteúdo inicial
    const loadInitialContent = () => {
      try {
        const savedScreens = window.localStorage.getItem('screens');
        console.log('Dados do localStorage:', { savedScreens, screenId });
        
        if (savedScreens) {
          const screens = JSON.parse(savedScreens) as Screen[];
          const currentScreen = screens.find(s => String(s.id) === String(screenId));
          
          if (currentScreen?.currentContent) {
            console.log('Conteúdo encontrado:', currentScreen.currentContent);
            setContent(currentScreen.currentContent);
            return true;
          }
        }
        return false;
      } catch (error) {
        console.error('Erro ao carregar conteúdo:', error);
        return false;
      }
    };

    // Configurar canal do Supabase
    const channel = supabase.channel(`screen_${screenId}`, {
      config: {
        broadcast: { self: true }
      }
    });

    // Inscrever no canal
    channel
      .on('broadcast', { event: 'content_update' }, (payload) => {
        console.log('Recebido broadcast:', payload);
        if (payload.payload?.screenId === screenId && payload.payload?.content) {
          console.log('Atualizando conteúdo:', payload.payload.content);
          setContent(payload.payload.content);
          setIsLoading(false);
        }
      })
      .subscribe(async (status) => {
        console.log('Status da inscrição:', status);
        
        if (status === 'SUBSCRIBED') {
          // Tentar carregar conteúdo inicial
          const loaded = loadInitialContent();
          if (loaded) {
            setIsLoading(false);
          }

          // Solicitar conteúdo atual
          channel.send({
            type: 'broadcast',
            event: 'request_content',
            payload: { screenId }
          });
        }
      });

    document.title = `Tela ${screenId}`;

    // Limpar recursos
    return () => {
      console.log('Limpando recursos...');
      supabase.removeChannel(channel);
    };
  }, [screenId]);

  if (isLoading && !content) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-white">Carregando...</div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black">
        <div className="text-white">Aguardando conteúdo...</div>
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
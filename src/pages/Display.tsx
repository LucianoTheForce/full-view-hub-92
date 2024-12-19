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
      const savedScreens = localStorage.getItem('screens');
      console.log('Saved screens from localStorage:', savedScreens);
      
      if (!savedScreens) {
        console.log('No screens found in localStorage');
        return null;
      }

      const screens = JSON.parse(savedScreens) as Screen[];
      console.log('Parsed screens:', screens);
      console.log('Looking for screen with ID:', screenId);
      
      const currentScreen = screens.find(s => String(s.id) === String(screenId));
      console.log('Found screen:', currentScreen);
      
      if (!currentScreen?.currentContent) {
        console.log('No content found for screen');
        return null;
      }

      console.log('Returning content:', currentScreen.currentContent);
      return currentScreen.currentContent;
    } catch (error) {
      console.error('Error loading initial content:', error);
      return null;
    }
  });

  useEffect(() => {
    console.log('Setting up realtime channel for screen:', screenId);
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

    document.title = `Tela ${screenId}`;

    return () => {
      console.log('Cleaning up subscription');
      supabase.removeChannel(channel);
    };
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
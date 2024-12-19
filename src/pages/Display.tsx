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
    // Initialize content from localStorage during state initialization
    try {
      const screens = JSON.parse(localStorage.getItem('screens') || '[]') as Screen[];
      const currentScreen = screens.find(s => s.id === screenId);
      console.log('Initial load - Found screen:', currentScreen);
      return currentScreen?.currentContent || null;
    } catch (error) {
      console.error('Error loading initial content:', error);
      return null;
    }
  });

  useEffect(() => {
    // Setup realtime channel for updates
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

    // Update page title
    document.title = `Tela ${screenId}`;

    // Cleanup subscription
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

  // Content styles
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
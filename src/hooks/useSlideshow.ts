import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@/hooks/useSessions";

export const useSlideshow = () => {
  const [slideshowEnabled, setSlideshowEnabled] = useState(false);
  const [slideshowInterval, setSlideshowInterval] = useState(5000);

  const updateSlideshowSettings = async (sessionId: string, enabled: boolean, interval: number) => {
    const { error } = await supabase
      .from("sessions")
      .update({
        slideshow_enabled: enabled,
        slideshow_interval: interval,
      })
      .eq("id", sessionId);

    if (error) {
      console.error("Error updating slideshow settings:", error);
      throw error;
    }
  };

  const loadSlideshowSettings = (session: Session | null) => {
    if (session) {
      setSlideshowEnabled(session.slideshow_enabled || false);
      setSlideshowInterval(session.slideshow_interval || 5000);
    }
  };

  return {
    slideshowEnabled,
    setSlideshowEnabled,
    slideshowInterval,
    setSlideshowInterval,
    updateSlideshowSettings,
    loadSlideshowSettings,
  };
};
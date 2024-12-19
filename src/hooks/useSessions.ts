import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface Session {
  id: string;
  name: string;
  screens: any[];
  mediaItems: any[];
  createdAt: string;
  slideshow_enabled?: boolean;
  slideshow_interval?: number;
}

type SessionRow = Database['public']['Tables']['sessions']['Row'];

const mapSessionRowToSession = (row: SessionRow): Session => ({
  id: row.id,
  name: row.name,
  screens: row.screens as any[],
  mediaItems: row.media_items as any[],
  createdAt: row.created_at,
  slideshow_enabled: row.slideshow_enabled,
  slideshow_interval: row.slideshow_interval,
});

export const useSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions((data || []).map(mapSessionRowToSession));
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      toast.error('Não foi possível carregar as sessões');
    } finally {
      setIsLoading(false);
    }
  };

  const saveSession = async (name: string, screens: any[], mediaItems: any[]) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          name,
          screens,
          media_items: mediaItems,
        })
        .select()
        .single();

      if (error) throw error;

      setSessions(prev => [mapSessionRowToSession(data), ...prev]);
      toast.success('Sessão salva com sucesso!');
      return mapSessionRowToSession(data);
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
      toast.error('Não foi possível salvar a sessão');
      throw error;
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      setSessions(prev => prev.filter(session => session.id !== sessionId));
      toast.success('Sessão excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir sessão:', error);
      toast.error('Não foi possível excluir a sessão');
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  return {
    sessions,
    isLoading,
    saveSession,
    deleteSession,
    loadSessions,
  };
};
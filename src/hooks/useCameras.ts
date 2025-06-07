
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Camera {
  id: string;
  name: string;
  device_id: string;
  is_active: boolean;
}

export const useCameras = (vesselId?: string) => {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCameras = async () => {
    if (!vesselId) return;

    try {
      const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .eq('vessel_id', vesselId)
        .order('name');

      if (error) throw error;
      setCameras(data || []);
    } catch (error) {
      console.error('Error fetching cameras:', error);
      toast({
        title: "Error",
        description: "Failed to load camera data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCameras();
  }, [vesselId]);

  return { cameras, loading };
};

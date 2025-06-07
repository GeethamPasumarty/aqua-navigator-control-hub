
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Vessel {
  id: string;
  name: string;
  battery_percentage: number;
  signal_strength: 'none' | 'weak' | 'good' | 'excellent';
  latitude?: number;
  longitude?: number;
}

export const useVesselData = () => {
  const [vessel, setVessel] = useState<Vessel | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchVessel = async () => {
    try {
      const { data, error } = await supabase
        .from('vessels')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;
      setVessel(data);
    } catch (error) {
      console.error('Error fetching vessel:', error);
      toast({
        title: "Error",
        description: "Failed to load vessel data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateVessel = async (updates: Partial<Vessel>) => {
    if (!vessel) return;

    try {
      const { error } = await supabase
        .from('vessels')
        .update(updates)
        .eq('id', vessel.id);

      if (error) throw error;
      setVessel(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating vessel:', error);
      toast({
        title: "Error",
        description: "Failed to update vessel data",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchVessel();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('vessel-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'vessels'
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setVessel(payload.new as Vessel);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { vessel, loading, updateVessel };
};

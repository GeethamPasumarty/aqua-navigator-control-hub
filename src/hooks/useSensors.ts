
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Sensor {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning';
  last_updated: string;
}

export const useSensors = (vesselId?: string) => {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSensors = async () => {
    if (!vesselId) return;

    try {
      const { data, error } = await supabase
        .from('sensors')
        .select('*')
        .eq('vessel_id', vesselId)
        .order('name');

      if (error) throw error;
      
      const formattedSensors = data.map(sensor => ({
        ...sensor,
        last_updated: new Date(sensor.last_updated).toLocaleTimeString()
      }));
      
      setSensors(formattedSensors);
    } catch (error) {
      console.error('Error fetching sensors:', error);
      toast({
        title: "Error",
        description: "Failed to load sensor data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSensorStatus = async (sensorId: string, status: 'online' | 'offline' | 'warning') => {
    try {
      const { error } = await supabase
        .from('sensors')
        .update({ 
          status, 
          last_updated: new Date().toISOString() 
        })
        .eq('id', sensorId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating sensor:', error);
      toast({
        title: "Error",
        description: "Failed to update sensor status",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSensors();

    if (!vesselId) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel('sensor-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sensors',
        filter: `vessel_id=eq.${vesselId}`
      }, (payload) => {
        fetchSensors(); // Refetch to ensure proper formatting
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vesselId]);

  return { sensors, loading, updateSensorStatus, setSensors };
};


import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Waypoint {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order_index: number;
}

export const useWaypoints = (vesselId?: string) => {
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWaypoints = async () => {
    if (!vesselId) return;

    try {
      const { data, error } = await supabase
        .from('waypoints')
        .select('*')
        .eq('vessel_id', vesselId)
        .order('order_index');

      if (error) throw error;
      setWaypoints(data || []);
    } catch (error) {
      console.error('Error fetching waypoints:', error);
      toast({
        title: "Error",
        description: "Failed to load waypoints",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addWaypoint = async (waypoint: { name: string; latitude: number; longitude: number }) => {
    if (!vesselId) return;

    try {
      const { error } = await supabase
        .from('waypoints')
        .insert({
          vessel_id: vesselId,
          ...waypoint,
          order_index: waypoints.length + 1
        });

      if (error) throw error;
      
      toast({
        title: "Waypoint Added",
        description: `${waypoint.name} (${waypoint.latitude.toFixed(4)}, ${waypoint.longitude.toFixed(4)})`
      });
    } catch (error) {
      console.error('Error adding waypoint:', error);
      toast({
        title: "Error",
        description: "Failed to add waypoint",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchWaypoints();

    if (!vesselId) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel('waypoint-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'waypoints',
        filter: `vessel_id=eq.${vesselId}`
      }, () => {
        fetchWaypoints();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vesselId]);

  return { waypoints, loading, addWaypoint };
};

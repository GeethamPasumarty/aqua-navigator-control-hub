
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LogEntry {
  id: string;
  type: 'system' | 'emergency';
  message: string;
  timestamp: string;
}

export const useLogs = (vesselId?: string) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLogs = async () => {
    if (!vesselId) return;

    try {
      const { data, error } = await supabase
        .from('system_logs')
        .select('*')
        .eq('vessel_id', vesselId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const formattedLogs: LogEntry[] = (data || []).map(log => ({
        id: log.id,
        type: log.type as 'system' | 'emergency',
        message: log.message,
        timestamp: new Date(log.created_at).toLocaleTimeString()
      }));
      
      setLogs(formattedLogs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: "Error",
        description: "Failed to load system logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addLogEntry = async (entry: { type: 'system' | 'emergency'; message: string }) => {
    if (!vesselId) return;

    try {
      const { error } = await supabase
        .from('system_logs')
        .insert({
          vessel_id: vesselId,
          ...entry
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error adding log entry:', error);
      toast({
        title: "Error",
        description: "Failed to add log entry",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchLogs();

    if (!vesselId) return;

    // Subscribe to real-time updates
    const channel = supabase
      .channel('log-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'system_logs',
        filter: `vessel_id=eq.${vesselId}`
      }, () => {
        fetchLogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [vesselId]);

  return { logs, loading, addLogEntry };
};


import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Info } from 'lucide-react';

export interface LogEntry {
  id: string;
  type: 'system' | 'emergency';
  message: string;
  timestamp: string;
}

interface LogPanelProps {
  title: string;
  entries: LogEntry[];
  type: 'system' | 'emergency';
}

const LogPanel: React.FC<LogPanelProps> = ({ title, entries, type }) => {
  const filteredEntries = entries.filter(entry => entry.type === type);
  
  return (
    <div className="bg-white rounded-lg border border-marine-border overflow-hidden">
      <div className="p-2 border-b border-marine-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center">
          {type === 'emergency' ? (
            <AlertCircle size={14} className="mr-1 text-marine-red" />
          ) : (
            <Info size={14} className="mr-1 text-marine-blue-dark" />
          )}
          {title}
        </h3>
        <span className="text-xs text-gray-500">
          {filteredEntries.length} entries
        </span>
      </div>
      
      <ScrollArea className="h-[200px]">
        {filteredEntries.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredEntries.map(entry => (
              <div key={entry.id} className="p-2 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <span className={`text-sm ${type === 'emergency' ? 'text-marine-red' : 'text-gray-700'}`}>
                    {entry.message}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {entry.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-gray-500">
            No {type} logs to display
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default LogPanel;

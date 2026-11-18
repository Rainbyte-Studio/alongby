import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner: React.FC<{ label?: string }> = ({ label = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-neutral-500">
      <Loader2 className="w-6 h-6 animate-spin text-neutral-800 mb-3" />
      <span className="text-xs font-medium text-neutral-500">{label}</span>
    </div>
  );
};

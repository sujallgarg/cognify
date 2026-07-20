'use client';

import React from 'react';
import { Activity } from 'lucide-react';

interface OperationLog {
  title: string;
  time: string;
}

interface RecentOperationsProps {
  operations: OperationLog[];
}

export default function RecentOperations({ operations }: RecentOperationsProps) {
  return (
    <div className="bg-[#09090B] border border-[#18181B] rounded-xl p-6 flex flex-col space-y-4">
      <div className="flex items-center gap-2 border-b border-[#18181B] pb-3">
        <Activity className="h-4.5 w-4.5 text-[#22C55E]" />
        <h3 className="font-semibold text-white text-sm">Recent Operations</h3>
      </div>

      <div className="flex flex-col space-y-4 text-xs">
        {operations.length > 0 ? (
          operations.map((op, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="w-0.5 bg-[#18181B] relative">
                <div className="absolute top-1.5 left-[-3px] w-2 h-2 rounded-full bg-[#22C55E]" />
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="text-white font-medium">{op.title}</p>
                <p className="text-[#71717A]">{op.time}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-[#71717A] italic py-2">No operations logged yet.</p>
        )}
      </div>
    </div>
  );
}

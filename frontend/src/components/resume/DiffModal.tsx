'use client';

import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { X, Check, ArrowRight } from 'lucide-react';

interface DiffItem {
  path: string;
  action: 'replace' | 'add' | 'remove';
  value: any;
  oldValue?: any;
  reason: string;
}

interface DiffModalProps {
  diffs: DiffItem[];
  onConfirm: () => void;
  onClose: () => void;
}

export const DiffModal = ({ diffs, onConfirm, onClose }: DiffModalProps) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200" padding="none">
        <div className="p-6 border-b-4 border-black flex justify-between items-center bg-hyper-blue text-white">
          <h2 className="text-2xl font-space font-black uppercase tracking-tight">Review Tailoring Changes</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-canvas space-y-6">
          {diffs.map((diff, idx) => (
            <div key={idx} className="border-2 border-black bg-white shadow-brutalist overflow-hidden">
              <div className="px-4 py-2 bg-black text-white flex justify-between items-center">
                <span className="font-mono text-xs uppercase tracking-widest">{diff.path}</span>
                <span className={`px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter ${
                  diff.action === 'replace' ? 'bg-yellow-400 text-black' : 'bg-green-500 text-white'
                }`}>
                  {diff.action}
                </span>
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-gray-500">Current</span>
                  <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm line-through opacity-60">
                    {diff.oldValue || 'None'}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-hyper-blue">Proposed</span>
                  <div className="p-3 bg-green-50 border border-green-200 text-green-900 text-sm font-bold">
                    {diff.value}
                  </div>
                </div>
              </div>
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex items-start gap-2">
                <div className="mt-1 p-0.5 bg-black rounded-full">
                  <ArrowRight size={10} className="text-white" />
                </div>
                <p className="text-xs italic text-gray-600">{diff.reason}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t-4 border-black flex justify-end gap-4 bg-white">
          <Button variant="outline" onClick={onClose}>Discard Changes</Button>
          <Button variant="primary" onClick={onConfirm} className="flex gap-2 items-center">
            <Check size={20} />
            Apply Improvements
          </Button>
        </div>
      </Card>
    </div>
  );
};

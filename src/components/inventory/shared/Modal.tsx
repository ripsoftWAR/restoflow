import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}

export default function Modal({ title, subtitle, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-pp-text/40 backdrop-blur-sm p-4">
      <div className="bg-pp-surface w-full max-w-md rounded-pp-lg p-5 shadow-pp-xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 bg-pp-bg rounded-full text-pp-text-muted hover:text-pp-text-secondary transition-colors"
        >
          <X size={15} />
        </button>
        <p className="text-[14px] font-bold text-pp-text pr-8">{title}</p>
        <p className="text-[11px] text-pp-text-muted mt-1 mb-4">{subtitle}</p>
        {children}
      </div>
    </div>
  );
}

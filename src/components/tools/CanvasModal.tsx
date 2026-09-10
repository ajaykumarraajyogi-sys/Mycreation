import React from 'react';
import { X, Ratio, Smartphone, Monitor, Square } from 'lucide-react';
import { AspectRatio } from '../../types';

interface CanvasModalProps {
  currentAspectRatio: AspectRatio;
  onClose: () => void;
  onSelectAspectRatio: (ratio: AspectRatio) => void;
}

export const CanvasModal: React.FC<CanvasModalProps> = ({
  currentAspectRatio,
  onClose,
  onSelectAspectRatio,
}) => {
  const ratios: { id: AspectRatio; label: string; sub: string; icon: any }[] = [
    {
      id: '9:16',
      label: '9:16 Vertical',
      sub: 'TikTok, Shorts, Reels',
      icon: Smartphone,
    },
    {
      id: '16:9',
      label: '16:9 Landscape',
      sub: 'YouTube, Widescreen',
      icon: Monitor,
    },
    {
      id: '1:1',
      label: '1:1 Square',
      sub: 'Instagram Feed',
      icon: Square,
    },
  ];

  return (
    <div className="bg-neutral-900 border-t border-neutral-800 p-4 shadow-2xl z-30 select-none animate-in slide-in-from-bottom duration-200">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-100 font-semibold text-sm">
            <Ratio className="w-4 h-4 text-cyan-400" />
            <span>Canvas Aspect Ratio</span>
          </div>
          <button
            id="canvas-close-btn"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 grid grid-cols-3 gap-3">
          {ratios.map((r) => {
            const isSelected = currentAspectRatio === r.id;
            const Icon = r.icon;

            return (
              <button
                key={r.id}
                id={`canvas-ratio-${r.id.replace(':', '-')}`}
                onClick={() => onSelectAspectRatio(r.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${
                  isSelected
                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400/50 shadow-md shadow-cyan-950/40'
                    : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                    isSelected ? 'bg-cyan-500/30 text-cyan-300' : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold mb-0.5">{r.label}</span>
                <span className="text-[10px] text-neutral-400 text-center leading-tight">
                  {r.sub}
                </span>
              </button>
            );
          })}
        </div>

        <div className="pt-1">
          <button
            id="canvas-done-btn"
            onClick={onClose}
            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-medium text-xs rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

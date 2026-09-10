import React from 'react';
import { X, FastForward, Gauge } from 'lucide-react';
import { VideoClip } from '../../types';
import { formatShortTime } from '../../utils/timeFormat';

interface SpeedModalProps {
  clip: VideoClip | null;
  onClose: () => void;
  onUpdateSpeed: (clipId: string, speed: number) => void;
}

export const SpeedModal: React.FC<SpeedModalProps> = ({
  clip,
  onClose,
  onUpdateSpeed,
}) => {
  if (!clip) return null;

  const speeds = [0.5, 1, 1.5, 2];
  const rawDuration = clip.trimEnd - clip.trimStart;

  return (
    <div className="bg-neutral-900 border-t border-neutral-800 p-4 shadow-2xl z-30 select-none animate-in slide-in-from-bottom duration-200">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-100 font-semibold text-sm">
            <FastForward className="w-4 h-4 text-amber-400" />
            <span>Playback Speed</span>
          </div>
          <button
            id="speed-close-btn"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-4">
          <div className="grid grid-cols-4 gap-2.5">
            {speeds.map((s) => {
              const isSelected = clip.speed === s;
              const newDuration = rawDuration / s;

              return (
                <button
                  key={s}
                  id={`speed-btn-${s}x`}
                  onClick={() => onUpdateSpeed(clip.id, s)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-md shadow-amber-950/30 ring-1 ring-amber-400/50'
                      : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 text-neutral-300'
                  }`}
                >
                  <span className="text-base font-mono mb-1">{s}x</span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {formatShortTime(newDuration)}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-center text-neutral-400">
            Current clip length: <strong className="text-neutral-100">{formatShortTime(rawDuration / clip.speed)}</strong>
          </p>
        </div>

        <div className="pt-1">
          <button
            id="speed-done-btn"
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

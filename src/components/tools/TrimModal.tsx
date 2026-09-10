import React from 'react';
import { X, Scissors, ArrowLeftToLine, ArrowRightToLine } from 'lucide-react';
import { VideoClip } from '../../types';
import { formatShortTime, formatTime } from '../../utils/timeFormat';

interface TrimModalProps {
  clip: VideoClip | null;
  currentTime: number;
  onClose: () => void;
  onUpdateTrim: (clipId: string, trimStart: number, trimEnd: number) => void;
}

export const TrimModal: React.FC<TrimModalProps> = ({
  clip,
  currentTime,
  onClose,
  onUpdateTrim,
}) => {
  if (!clip) return null;

  const minDuration = 0.3;

  const handleStartChange = (val: number) => {
    const clamped = Math.max(0, Math.min(clip.trimEnd - minDuration, val));
    onUpdateTrim(clip.id, clamped, clip.trimEnd);
  };

  const handleEndChange = (val: number) => {
    const clamped = Math.min(clip.duration, Math.max(clip.trimStart + minDuration, val));
    onUpdateTrim(clip.id, clip.trimStart, clamped);
  };

  const setStartToPlayhead = () => {
    handleStartChange(currentTime);
  };

  const setEndToPlayhead = () => {
    handleEndChange(currentTime);
  };

  const effectiveDuration = (clip.trimEnd - clip.trimStart) / clip.speed;

  return (
    <div className="bg-neutral-900 border-t border-neutral-800 p-4 shadow-2xl z-30 select-none animate-in slide-in-from-bottom duration-200">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-100 font-semibold text-sm">
            <Scissors className="w-4 h-4 text-indigo-400" />
            <span>Trim Clip: {clip.name}</span>
          </div>
          <button
            id="trim-close-btn"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Trim Controls */}
        <div className="py-3 space-y-4">
          {/* Visual Range Display */}
          <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
            <span>Trimmed Length: <strong className="text-indigo-400">{formatShortTime(effectiveDuration)}</strong></span>
            <span>Total Original: {formatShortTime(clip.duration)}</span>
          </div>

          {/* Range Sliders */}
          <div className="space-y-3 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800">
            {/* Start Point */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-neutral-400 font-medium">Start Point</span>
                <span className="font-mono text-neutral-200">{formatTime(clip.trimStart)}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max={clip.duration}
                  step="0.05"
                  value={clip.trimStart}
                  onChange={(e) => handleStartChange(parseFloat(e.target.value))}
                  className="flex-1 accent-indigo-500 cursor-pointer"
                />
                <button
                  onClick={setStartToPlayhead}
                  className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center gap-1 transition"
                  title="Set start to current playhead"
                >
                  <ArrowLeftToLine className="w-3 h-3 text-indigo-400" />
                  <span>At Head</span>
                </button>
              </div>
            </div>

            {/* End Point */}
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-neutral-400 font-medium">End Point</span>
                <span className="font-mono text-neutral-200">{formatTime(clip.trimEnd)}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max={clip.duration}
                  step="0.05"
                  value={clip.trimEnd}
                  onChange={(e) => handleEndChange(parseFloat(e.target.value))}
                  className="flex-1 accent-indigo-500 cursor-pointer"
                />
                <button
                  onClick={setEndToPlayhead}
                  className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded flex items-center gap-1 transition"
                  title="Set end to current playhead"
                >
                  <ArrowRightToLine className="w-3 h-3 text-indigo-400" />
                  <span>At Head</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Done Button */}
        <div className="pt-2 flex justify-end">
          <button
            id="trim-done-btn"
            onClick={onClose}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition active:scale-95 shadow-md shadow-indigo-950/40"
          >
            Apply Trim
          </button>
        </div>
      </div>
    </div>
  );
};

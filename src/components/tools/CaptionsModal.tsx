import React, { useState } from 'react';
import { X, Subtitles, Plus, Sparkles, Trash2, Check } from 'lucide-react';
import { Subtitle } from '../../types';
import { formatTime } from '../../utils/timeFormat';

interface CaptionsModalProps {
  subtitles: Subtitle[];
  currentTime: number;
  totalDuration: number;
  onClose: () => void;
  onAddSubtitle: (sub: Subtitle) => void;
  onSetSubtitles: (subs: Subtitle[]) => void;
  onDeleteSubtitle: (id: string) => void;
  onRequestAiCaptions: () => void;
}

export const CaptionsModal: React.FC<CaptionsModalProps> = ({
  subtitles,
  currentTime,
  totalDuration,
  onClose,
  onAddSubtitle,
  onSetSubtitles,
  onDeleteSubtitle,
  onRequestAiCaptions,
}) => {
  const [newText, setNewText] = useState('');
  const [start, setStart] = useState(Math.max(0, Math.round(currentTime * 10) / 10));
  const [end, setEnd] = useState(Math.min(totalDuration, Math.round((currentTime + 2.5) * 10) / 10));

  const handleAdd = () => {
    if (!newText.trim()) return;
    onAddSubtitle({
      id: `sub-${Date.now()}`,
      text: newText.trim(),
      startTime: start,
      endTime: Math.max(start + 0.5, end),
    });
    setNewText('');
    setStart(Math.min(totalDuration, end));
    setEnd(Math.min(totalDuration, end + 2.5));
  };

  return (
    <div className="bg-neutral-900 border-t border-neutral-800 p-4 shadow-2xl z-30 select-none animate-in slide-in-from-bottom duration-200">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-100 font-semibold text-sm">
            <Subtitles className="w-4 h-4 text-amber-400" />
            <span>Subtitles & Captions</span>
          </div>
          <button
            id="captions-close-btn"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* AI Auto-generate button */}
        <button
          id="captions-ai-btn"
          onClick={onRequestAiCaptions}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-600/30 to-orange-600/30 hover:from-amber-600/40 hover:to-orange-600/40 border border-amber-500/40 rounded-xl flex items-center justify-center gap-2 text-amber-200 font-semibold text-xs shadow-md shadow-amber-950/20 active:scale-95 transition"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>✨ Auto-Generate Captions with Gemini AI</span>
        </button>

        {/* Existing Subtitles */}
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
            <span>Timed Captions ({subtitles.length})</span>
            {subtitles.length > 0 && (
              <button
                onClick={() => onSetSubtitles([])}
                className="text-red-400 hover:text-red-300 normal-case font-normal"
              >
                Clear All
              </button>
            )}
          </div>

          {subtitles.length === 0 ? (
            <p className="text-xs text-neutral-500 italic py-2 text-center">
              No subtitles yet. Add one below or click Auto-Generate!
            </p>
          ) : (
            subtitles.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/70 border border-neutral-800 text-xs"
              >
                <div className="truncate mr-2">
                  <span className="font-mono text-[10px] text-amber-400 block">
                    {formatTime(s.startTime)} ➔ {formatTime(s.endTime)}
                  </span>
                  <span className="text-neutral-200 font-medium">{s.text}</span>
                </div>

                <button
                  onClick={() => onDeleteSubtitle(s.id)}
                  className="text-neutral-500 hover:text-red-400 p-1 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Manual Add Subtitle */}
        <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800 space-y-2.5">
          <span className="text-xs font-semibold text-neutral-200 block">+ Add Subtitle</span>

          <input
            type="text"
            placeholder="Subtitle text..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3 py-1.5 text-xs text-neutral-100 focus:outline-none focus:border-amber-400"
          />

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-neutral-400 block mb-1">Start (s)</span>
              <input
                type="number"
                step="0.1"
                min="0"
                max={totalDuration}
                value={start}
                onChange={(e) => setStart(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-900 border border-neutral-750 rounded px-2 py-1 text-neutral-200 font-mono"
              />
            </div>
            <div>
              <span className="text-neutral-400 block mb-1">End (s)</span>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max={totalDuration}
                value={end}
                onChange={(e) => setEnd(parseFloat(e.target.value) || 0)}
                className="w-full bg-neutral-900 border border-neutral-750 rounded px-2 py-1 text-neutral-200 font-mono"
              />
            </div>
          </div>

          <button
            id="captions-add-btn"
            onClick={handleAdd}
            className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs rounded-lg transition active:scale-95 shadow-md shadow-amber-950/40"
          >
            Add Subtitle
          </button>
        </div>

        <div className="pt-1">
          <button
            id="captions-done-btn"
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

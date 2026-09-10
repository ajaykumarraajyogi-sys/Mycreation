import React, { useState } from 'react';
import { X, Type, Plus, Trash2, Edit2, Check } from 'lucide-react';
import { TextOverlay } from '../../types';
import { formatTime } from '../../utils/timeFormat';

interface TextModalProps {
  overlays: TextOverlay[];
  currentTime: number;
  totalDuration: number;
  onClose: () => void;
  onAddOverlay: (overlay: TextOverlay) => void;
  onUpdateOverlay: (overlay: TextOverlay) => void;
  onDeleteOverlay: (id: string) => void;
}

export const TextModal: React.FC<TextModalProps> = ({
  overlays,
  currentTime,
  totalDuration,
  onClose,
  onAddOverlay,
  onUpdateOverlay,
  onDeleteOverlay,
}) => {
  const [editingOverlayId, setEditingOverlayId] = useState<string | null>(null);

  // New overlay form states
  const [text, setText] = useState('My Awesome Video');
  const [startTime, setStartTime] = useState(Math.max(0, Math.round(currentTime * 10) / 10));
  const [duration, setDuration] = useState(3.0);
  const [color, setColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('rgba(0, 0, 0, 0.7)');
  const [fontSize, setFontSize] = useState(26);
  const [posY, setPosY] = useState(30); // 30% from top

  const colorPresets = ['#ffffff', '#facc15', '#38bdf8', '#f43f5e', '#4ade80', '#c084fc'];

  const handleCreate = () => {
    if (!text.trim()) return;
    const newOverlay: TextOverlay = {
      id: `text-${Date.now()}`,
      text: text.trim(),
      startTime,
      endTime: Math.min(totalDuration, startTime + duration),
      x: 50, // centered horizontally
      y: posY,
      fontSize,
      color,
      backgroundColor: bgColor,
      fontWeight: 'bold',
    };
    onAddOverlay(newOverlay);
    setText('');
  };

  return (
    <div className="bg-neutral-900 border-t border-neutral-800 p-4 shadow-2xl z-30 select-none animate-in slide-in-from-bottom duration-200">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-100 font-semibold text-sm">
            <Type className="w-4 h-4 text-cyan-400" />
            <span>Text Overlays</span>
          </div>
          <button
            id="text-close-btn"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Existing Overlays List */}
        {overlays.length > 0 && (
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
              Active Overlays ({overlays.length})
            </span>
            {overlays.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 rounded-lg bg-neutral-950/70 border border-neutral-800 text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-neutral-200 truncate">{item.text}</span>
                  <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                    ({item.startTime.toFixed(1)}s - {item.endTime.toFixed(1)}s)
                  </span>
                </div>
                <button
                  onClick={() => onDeleteOverlay(item.id)}
                  className="text-neutral-500 hover:text-red-400 p-1"
                  title="Delete Overlay"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Overlay Form */}
        <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-200">+ Add New Text</span>
          </div>

          <input
            type="text"
            placeholder="Type overlay text here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700/80 rounded-lg px-3 py-1.5 text-sm text-neutral-100 focus:outline-none focus:border-cyan-500"
          />

          {/* Color & Size Controls */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-neutral-400 block mb-1">Color</span>
              <div className="flex items-center gap-1.5">
                {colorPresets.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ backgroundColor: c }}
                    className={`w-5 h-5 rounded-full border transition-all ${
                      color === c ? 'scale-110 border-white ring-2 ring-cyan-500' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-neutral-400 mb-1">
                <span>Font Size</span>
                <span className="font-mono text-neutral-200">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="44"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Position & Timing */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-neutral-850">
            <div>
              <span className="text-neutral-400 block mb-1">Vertical Position</span>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  onClick={() => setPosY(20)}
                  className={`px-2 py-1 rounded border flex-1 ${
                    posY === 20 ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'border-neutral-800 text-neutral-400'
                  }`}
                >
                  Top
                </button>
                <button
                  onClick={() => setPosY(50)}
                  className={`px-2 py-1 rounded border flex-1 ${
                    posY === 50 ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'border-neutral-800 text-neutral-400'
                  }`}
                >
                  Center
                </button>
                <button
                  onClick={() => setPosY(80)}
                  className={`px-2 py-1 rounded border flex-1 ${
                    posY === 80 ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' : 'border-neutral-800 text-neutral-400'
                  }`}
                >
                  Bottom
                </button>
              </div>
            </div>

            <div>
              <span className="text-neutral-400 block mb-1">Duration: {duration}s</span>
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          <button
            id="text-add-btn"
            onClick={handleCreate}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg transition active:scale-95 shadow-md shadow-cyan-950/40"
          >
            Insert Text Overlay
          </button>
        </div>

        <div className="pt-1">
          <button
            id="text-done-btn"
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

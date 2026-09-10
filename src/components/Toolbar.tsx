import React from 'react';
import {
  Scissors,
  Split,
  FastForward,
  Music,
  Sliders,
  Ratio,
  Type,
  Subtitles,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface ToolbarProps {
  activeTool: string | null;
  onSelectTool: (tool: string | null) => void;
  onSplitClip: () => void;
  onDeleteSelectedClip: () => void;
  hasSelectedClip: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  onSplitClip,
  onDeleteSelectedClip,
  hasSelectedClip,
}) => {
  const tools = [
    {
      id: 'trim',
      label: 'Trim',
      icon: Scissors,
      disabled: !hasSelectedClip,
      highlight: false,
    },
    {
      id: 'split',
      label: 'Split',
      icon: Split,
      disabled: !hasSelectedClip,
      onClick: onSplitClip,
      highlight: false,
    },
    {
      id: 'speed',
      label: 'Speed',
      icon: FastForward,
      disabled: !hasSelectedClip,
      highlight: false,
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: Music,
      disabled: false,
      highlight: false,
    },
    {
      id: 'filter',
      label: 'Filter',
      icon: Sliders,
      disabled: false,
      highlight: false,
    },
    {
      id: 'canvas',
      label: 'Canvas',
      icon: Ratio,
      disabled: false,
      highlight: false,
    },
    {
      id: 'text',
      label: 'Text',
      icon: Type,
      disabled: false,
      highlight: false,
    },
    {
      id: 'captions',
      label: 'Captions',
      icon: Subtitles,
      disabled: false,
      highlight: false,
    },
    {
      id: 'ai',
      label: 'AI Studio',
      icon: Sparkles,
      disabled: false,
      highlight: true,
    },
  ];

  return (
    <div className="h-16 sm:h-18 bg-neutral-950 border-t border-neutral-800 px-2 sm:px-4 flex items-center justify-between overflow-x-auto no-scrollbar gap-1 sm:gap-2 z-20 select-none">
      <div className="flex items-center gap-1 sm:gap-1.5 min-w-max mx-auto">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              id={`toolbar-${tool.id}-btn`}
              onClick={() => {
                if (tool.onClick) {
                  tool.onClick();
                } else {
                  onSelectTool(isActive ? null : tool.id);
                }
              }}
              disabled={tool.disabled}
              className={`flex flex-col items-center justify-center min-w-[54px] sm:min-w-[62px] h-13 sm:h-14 px-2 py-1 rounded-xl transition-all ${
                tool.disabled
                  ? 'opacity-30 cursor-not-allowed text-neutral-600'
                  : isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                  : tool.highlight
                  ? 'text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/40 active:scale-95'
                  : 'text-neutral-400 hover:text-neutral-100 hover:bg-neutral-900 active:scale-95'
              }`}
              title={tool.label}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 mb-0.5 ${tool.highlight ? 'animate-pulse' : ''}`} />
              </div>
              <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                {tool.label}
              </span>
            </button>
          );
        })}

        {hasSelectedClip && (
          <button
            id="toolbar-delete-btn"
            onClick={onDeleteSelectedClip}
            className="flex flex-col items-center justify-center min-w-[54px] sm:min-w-[62px] h-13 sm:h-14 px-2 py-1 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/30 active:scale-95 transition"
            title="Delete Selected Clip"
          >
            <Trash2 className="w-5 h-5 mb-0.5" />
            <span className="text-[11px] font-medium tracking-tight">Delete</span>
          </button>
        )}
      </div>
    </div>
  );
};

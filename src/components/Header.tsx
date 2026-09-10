import React, { useState } from 'react';
import { Undo2, Redo2, Download, Film, Sparkles, FolderPlus, Edit3, Check } from 'lucide-react';

interface HeaderProps {
  projectName: string;
  onUpdateProjectName: (name: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenExport: () => void;
  onOpenAi: () => void;
  onLoadSamples: () => void;
  clipCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  onUpdateProjectName,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenExport,
  onOpenAi,
  onLoadSamples,
  clipCount,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(projectName);

  const handleSaveName = () => {
    if (tempName.trim()) {
      onUpdateProjectName(tempName.trim());
    } else {
      setTempName(projectName);
    }
    setIsEditingName(false);
  };

  return (
    <header className="h-14 bg-neutral-950 border-b border-neutral-800/80 px-3 sm:px-4 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand & Project Title */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 via-indigo-600 to-cyan-400 flex items-center justify-center shadow-md shadow-indigo-950/50 shrink-0">
          <Film className="w-4 h-4 text-white" />
        </div>

        {isEditingName ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
              autoFocus
              className="bg-neutral-900 border border-indigo-500/60 rounded px-2 py-0.5 text-sm text-neutral-100 font-medium focus:outline-none focus:ring-1 focus:ring-indigo-400 w-36 sm:w-48"
            />
            <button
              id="header-save-name-btn"
              onClick={handleSaveName}
              className="p-1 text-emerald-400 hover:bg-neutral-800 rounded transition"
              title="Save project name"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => {
              setTempName(projectName);
              setIsEditingName(true);
            }}
            className="group flex items-center gap-1.5 cursor-pointer max-w-[130px] sm:max-w-xs truncate"
            title="Click to rename project"
          >
            <span className="text-sm font-semibold text-neutral-100 truncate tracking-tight">
              {projectName}
            </span>
            <Edit3 className="w-3 h-3 text-neutral-500 group-hover:text-neutral-300 opacity-60 group-hover:opacity-100 transition shrink-0" />
          </div>
        )}
      </div>

      {/* Center Actions: Undo / Redo */}
      <div className="flex items-center gap-1 bg-neutral-900/90 rounded-lg p-0.5 border border-neutral-800">
        <button
          id="header-undo-btn"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo"
          title="Undo (Ctrl+Z)"
          className={`p-1.5 rounded-md transition flex items-center justify-center ${
            canUndo
              ? 'text-neutral-200 hover:text-white hover:bg-neutral-800 active:scale-95'
              : 'text-neutral-600 cursor-not-allowed opacity-40'
          }`}
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          id="header-redo-btn"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Redo"
          title="Redo (Ctrl+Y)"
          className={`p-1.5 rounded-md transition flex items-center justify-center ${
            canRedo
              ? 'text-neutral-200 hover:text-white hover:bg-neutral-800 active:scale-95'
              : 'text-neutral-600 cursor-not-allowed opacity-40'
          }`}
        >
          <Redo2 className="w-4 h-4" />
        </button>
      </div>

      {/* Right Actions: AI Assistant, Sample Demo, Export */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {clipCount === 0 && (
          <button
            id="header-demo-samples-btn"
            onClick={onLoadSamples}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-indigo-300 bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/60 rounded-lg transition active:scale-95"
            title="Load sample demo clips"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Load Demo</span>
          </button>
        )}

        <button
          id="header-ai-assistant-btn"
          onClick={onOpenAi}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-700/50 rounded-lg transition active:scale-95 shadow-sm shadow-cyan-950/30"
          title="Open AI Editing Assistant"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden xs:inline">AI Studio</span>
        </button>

        <button
          id="header-export-btn"
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 rounded-lg shadow-md shadow-indigo-950/50 transition cursor-pointer"
          title="Export video file"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};

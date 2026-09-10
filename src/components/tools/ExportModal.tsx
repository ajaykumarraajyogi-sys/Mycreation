import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Film,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  RotateCcw,
} from 'lucide-react';
import { ProjectState } from '../../types';
import { VideoExporter, ExportProgress, ExportResult } from '../../utils/videoExporter';
import { formatTime, getTotalTimelineDuration } from '../../utils/timeFormat';

interface ExportModalProps {
  project: ProjectState;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ project, onClose }) => {
  const [status, setStatus] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const exporterRef = useRef<VideoExporter | null>(null);

  const totalDuration = getTotalTimelineDuration(project.clips);

  const handleStartExport = async () => {
    if (project.clips.length === 0) {
      setErrorMessage('Please add at least one video clip before exporting.');
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);
    setResult(null);

    const exporter = new VideoExporter();
    exporterRef.current = exporter;

    try {
      const res = await exporter.exportProject(project, (prog) => {
        setStatus(prog);
      });

      setResult(res);

      // Auto-trigger browser download
      const a = document.createElement('a');
      a.href = res.url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err: any) {
      if (err?.message?.includes('cancelled')) {
        setErrorMessage('Export was cancelled.');
      } else {
        console.error('Export error:', err);
        setErrorMessage(err?.message || 'Failed to render and export video.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleCancelExport = () => {
    if (exporterRef.current) {
      exporterRef.current.cancel();
    }
    setIsExporting(false);
  };

  const getResolutionText = () => {
    switch (project.aspectRatio) {
      case '9:16':
        return '720 x 1280 (Vertical HD)';
      case '1:1':
        return '720 x 720 (Square HD)';
      case '16:9':
      default:
        return '1280 x 720 (Widescreen 720p)';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-100 font-semibold text-sm">
            <Film className="w-4 h-4 text-indigo-400" />
            <span>Export Video Project</span>
          </div>
          {!isExporting && (
            <button
              id="export-close-btn"
              onClick={onClose}
              className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Idle Configuration Screen */}
        {!isExporting && !result && (
          <div className="space-y-4">
            <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-neutral-850">
                <span className="text-neutral-400">Project Name</span>
                <span className="text-neutral-100 font-semibold truncate max-w-[200px]">
                  {project.projectName}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-850">
                <span className="text-neutral-400">Aspect Ratio</span>
                <span className="text-neutral-200 font-mono">{project.aspectRatio}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-850">
                <span className="text-neutral-400">Resolution</span>
                <span className="text-neutral-200">{getResolutionText()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-850">
                <span className="text-neutral-400">Total Duration</span>
                <span className="text-indigo-400 font-mono font-semibold">
                  {formatTime(totalDuration)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-850">
                <span className="text-neutral-400">Clips Count</span>
                <span className="text-neutral-200">{project.clips.length} clip(s)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-neutral-400">Color Filter</span>
                <span className="text-neutral-200 capitalize">{project.filter}</span>
              </div>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed text-center">
              Video is rendered locally in your browser with synchronized cuts, overlays, and audio mix.
            </p>

            <button
              id="export-start-btn"
              onClick={handleStartExport}
              disabled={project.clips.length === 0}
              className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-indigo-950/60 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Start Video Rendering</span>
            </button>
          </div>
        )}

        {/* In-Progress Exporting Screen */}
        {isExporting && status && (
          <div className="py-4 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-indigo-950/80 border border-indigo-700/60 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-neutral-100">
                {status.stage === 'preparing' && 'Preparing Media Tracks...'}
                {status.stage === 'rendering' && 'Rendering Video Frames...'}
                {status.stage === 'encoding' && 'Finalizing Video Encoding...'}
                {status.stage === 'completed' && 'Export Complete!'}
              </h4>
              <p className="text-xs font-mono text-neutral-400">
                {formatTime(status.currentTime)} / {formatTime(status.totalTime)} (
                {Math.round(status.progress * 100)}%)
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden border border-neutral-800">
              <div
                className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-150 rounded-full"
                style={{ width: `${Math.round(status.progress * 100)}%` }}
              />
            </div>

            <button
              onClick={handleCancelExport}
              className="px-4 py-1.5 text-xs font-medium text-neutral-400 hover:text-red-300 rounded-lg hover:bg-neutral-800 transition"
            >
              Cancel Export
            </button>
          </div>
        )}

        {/* Completed Export Screen */}
        {result && (
          <div className="space-y-4">
            <div className="bg-emerald-950/30 border border-emerald-800/50 p-3 rounded-xl flex items-center gap-2.5 text-emerald-300 text-xs">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold block">Video Exported Successfully!</span>
                <span className="text-[11px] text-emerald-400/80">{result.filename}</span>
              </div>
            </div>

            {/* Video Preview Player */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden border border-neutral-800 shadow-lg">
              <video
                src={result.url}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex gap-2">
              <a
                id="export-download-again-btn"
                href={result.url}
                download={result.filename}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-indigo-950/50 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Again</span>
              </a>

              <button
                id="export-finish-btn"
                onClick={onClose}
                className="py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

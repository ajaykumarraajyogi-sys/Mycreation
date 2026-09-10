import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Check,
  Copy,
  Wand2,
  Ratio,
  Clock,
  Subtitles,
  Hash,
  FileText,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { ProjectState, AiAssistantResponse, AiAction } from '../../types';
import { getTotalTimelineDuration } from '../../utils/timeFormat';

interface AiAssistantDrawerProps {
  project: ProjectState;
  onClose: () => void;
  onApplyAiActions: (actions: AiAction[]) => void;
  initialPrompt?: string;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  project,
  onClose,
  onApplyAiActions,
  initialPrompt = '',
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [response, setResponse] = useState<AiAssistantResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [hasAppliedActions, setHasAppliedActions] = useState(false);

  const quickPrompts = [
    { label: 'YouTube Shorts', text: 'Make this video suitable for YouTube Shorts' },
    { label: 'Create Captions', text: 'Create captions for this video' },
    { label: 'Make 30 Seconds', text: 'Make the video 30 seconds' },
    { label: 'Suggest Title', text: 'Suggest a title for this video' },
    { label: 'Description & Tags', text: 'Create a description and hashtags' },
  ];

  const handleSendPrompt = async (textToSend?: string) => {
    const query = (textToSend || prompt).trim();
    if (!query || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);
    setHasAppliedActions(false);

    try {
      const projectContext = {
        projectName: project.projectName,
        clipCount: project.clips.length,
        clips: project.clips.map((c, i) => ({
          index: i,
          name: c.name,
          nativeDuration: c.duration,
          trimStart: c.trimStart,
          trimEnd: c.trimEnd,
          speed: c.speed,
          effectiveDuration: (c.trimEnd - c.trimStart) / c.speed,
        })),
        totalDuration: getTotalTimelineDuration(project.clips),
        aspectRatio: project.aspectRatio,
        filter: project.filter,
        textOverlays: project.textOverlays.map((t) => t.text),
        subtitles: project.subtitles.map((s) => s.text),
        hasBackgroundAudio: !!project.backgroundAudio,
      };

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          projectContext,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${res.status}`);
      }

      const data: AiAssistantResponse = await res.json();
      setResponse(data);
      if (textToSend) {
        setPrompt(textToSend);
      }
    } catch (err: any) {
      console.error('AI assistant error:', err);
      setErrorMessage(
        err?.message || 'Failed to communicate with AI Assistant. Please verify your GEMINI_API_KEY.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApply = () => {
    if (response?.actions && response.actions.length > 0) {
      onApplyAiActions(response.actions);
      setHasAppliedActions(true);
    }
  };

  return (
    <div className="bg-neutral-900 border-t border-neutral-800 p-4 shadow-2xl z-30 select-none animate-in slide-in-from-bottom duration-200 max-h-[75vh] flex flex-col">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col min-h-0 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2 text-neutral-100 font-semibold text-sm">
            <div className="w-6 h-6 rounded-md bg-cyan-950/80 border border-cyan-700/50 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            </div>
            <span>Gemini AI Editing Assistant</span>
          </div>
          <button
            id="ai-close-btn"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Prompts Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 shrink-0">
          {quickPrompts.map((qp) => (
            <button
              key={qp.label}
              onClick={() => {
                setPrompt(qp.text);
                handleSendPrompt(qp.text);
              }}
              disabled={isLoading}
              className="px-2.5 py-1 bg-neutral-950/80 hover:bg-neutral-800 border border-neutral-800 hover:border-cyan-500/40 rounded-full text-[11px] text-neutral-300 hover:text-cyan-200 whitespace-nowrap transition active:scale-95 disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>

        {/* Prompt Input Form */}
        <div className="flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Ask AI: e.g. Make suitable for Shorts, add captions..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
            disabled={isLoading}
            className="flex-1 bg-neutral-950 border border-neutral-750 rounded-xl px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-cyan-500 transition"
          />
          <button
            id="ai-submit-btn"
            onClick={() => handleSendPrompt()}
            disabled={isLoading || !prompt.trim()}
            className="p-2 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-cyan-950/40"
            title="Send to AI Assistant"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-xl flex items-start gap-2 text-xs text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* AI Output Result Display */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
          {isLoading && (
            <div className="py-8 flex flex-col items-center justify-center text-center text-neutral-400 space-y-2">
              <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              <p className="text-xs font-medium">Analyzing video clips and generating instructions...</p>
            </div>
          )}

          {!isLoading && !response && !errorMessage && (
            <div className="py-6 text-center text-neutral-500 space-y-1">
              <p className="text-xs">Select a quick prompt above or ask any editing question.</p>
              <p className="text-[11px] text-neutral-600">
                Gemini analyzes your clips, durations, aspect ratio, and crafts optimized actions.
              </p>
            </div>
          )}

          {!isLoading && response && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {/* Message from AI */}
              <div className="bg-neutral-950/80 border border-neutral-800 p-3 rounded-xl space-y-1.5">
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Analysis & Recommendations</span>
                </div>
                <p className="text-neutral-200 text-xs leading-relaxed whitespace-pre-line">
                  {response.message}
                </p>
              </div>

              {/* Action Apply Button if actions exist */}
              {response.actions && response.actions.length > 0 && (
                <div className="bg-indigo-950/40 border border-indigo-700/50 p-3 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-indigo-300">
                      ⚡ {response.actions.length} Project Action{response.actions.length > 1 ? 's' : ''} Ready
                    </span>
                    <span className="text-[10px] text-indigo-400 font-mono">1-Tap Apply</span>
                  </div>

                  <ul className="text-[11px] text-neutral-300 space-y-1 list-disc list-inside">
                    {response.actions.map((act, i) => (
                      <li key={i}>
                        {act.type === 'setAspectRatio' && `Change Aspect Ratio to ${act.aspectRatio}`}
                        {act.type === 'setFilter' && `Apply ${act.filter} color filter`}
                        {act.type === 'addCaptions' && `Add ${act.captions?.length || 0} timed captions`}
                        {act.type === 'addTextOverlay' && `Add text overlay: "${act.text}"`}
                        {act.type === 'setClipSpeed' && `Adjust clip speed to ${act.speed}x`}
                        {act.type === 'trimClip' && `Trim clip to ${act.trimEnd}s`}
                      </li>
                    ))}
                  </ul>

                  <button
                    id="ai-apply-actions-btn"
                    onClick={handleApply}
                    disabled={hasAppliedActions}
                    className={`w-full py-2 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 ${
                      hasAppliedActions
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40'
                    }`}
                  >
                    {hasAppliedActions ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Applied to Project!</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Apply Changes to Video Studio</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Title Suggestion */}
              {response.suggestedTitle && (
                <div className="bg-neutral-950/70 border border-neutral-800 p-2.5 rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold block">
                      Suggested Title
                    </span>
                    <span className="text-xs font-semibold text-neutral-100 truncate block">
                      {response.suggestedTitle}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(response.suggestedTitle!, 'title')}
                    className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md transition shrink-0"
                    title="Copy Title"
                  >
                    {copiedField === 'title' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              {/* Description & Hashtags */}
              {response.suggestedDescription && (
                <div className="bg-neutral-950/70 border border-neutral-800 p-2.5 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                      Description
                    </span>
                    <button
                      onClick={() => handleCopy(response.suggestedDescription!, 'desc')}
                      className="p-1 text-neutral-400 hover:text-white"
                      title="Copy Description"
                    >
                      {copiedField === 'desc' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                    {response.suggestedDescription}
                  </p>
                </div>
              )}

              {response.suggestedHashtags && response.suggestedHashtags.length > 0 && (
                <div className="bg-neutral-950/70 border border-neutral-800 p-2.5 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-500 uppercase font-semibold">
                      Trending Hashtags
                    </span>
                    <button
                      onClick={() => handleCopy(response.suggestedHashtags!.join(' '), 'tags')}
                      className="p-1 text-neutral-400 hover:text-white"
                      title="Copy Hashtags"
                    >
                      {copiedField === 'tags' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {response.suggestedHashtags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-neutral-900 border border-neutral-800 text-cyan-300 text-[11px] rounded-md font-mono"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

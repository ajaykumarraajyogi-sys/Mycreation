import React, { useRef, useState, useEffect } from 'react';
import {
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Music,
  Type,
  MessageSquare,
  VolumeX,
} from 'lucide-react';
import { ProjectState, VideoClip } from '../types';
import {
  formatShortTime,
  getClipEffectiveDuration,
  getTotalTimelineDuration,
} from '../utils/timeFormat';

interface TimelineProps {
  project: ProjectState;
  onTimeUpdate: (newTime: number) => void;
  onSelectClip: (id: string) => void;
  onDeleteClip: (id: string) => void;
  onMoveClip: (index: number, direction: 'left' | 'right') => void;
  onAddVideoClick: () => void;
  onAddAudioClick: () => void;
  onOpenTool: (tool: string) => void;
  onTrimClip: (clipId: string, newTrimStart: number, newTrimEnd: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  project,
  onTimeUpdate,
  onSelectClip,
  onDeleteClip,
  onMoveClip,
  onAddVideoClick,
  onAddAudioClick,
  onOpenTool,
  onTrimClip,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [pixelsPerSecond, setPixelsPerSecond] = useState(40); // Zoom level
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Trimming drag state
  const [trimDrag, setTrimDrag] = useState<{
    clipId: string;
    handle: 'start' | 'end';
    initialX: number;
    initialTrimStart: number;
    initialTrimEnd: number;
    clipDuration: number;
    speed: number;
  } | null>(null);

  const totalDuration = Math.max(10, getTotalTimelineDuration(project.clips));
  const timelinePixelWidth = Math.max(600, totalDuration * pixelsPerSecond + 200);

  // Auto-scroll timeline to keep playhead in view during playback
  useEffect(() => {
    if (!project.isPlaying || !scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const playheadPx = project.currentTime * pixelsPerSecond;
    const scrollLeft = container.scrollLeft;
    const clientWidth = container.clientWidth;

    if (playheadPx > scrollLeft + clientWidth - 100) {
      container.scrollLeft = playheadPx - clientWidth + 150;
    } else if (playheadPx < scrollLeft) {
      container.scrollLeft = Math.max(0, playheadPx - 50);
    }
  }, [project.currentTime, project.isPlaying, pixelsPerSecond]);

  // Scrubbing via pointer interaction
  const handleTimelineClickOrDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (trimDrag) return;
    if (!scrollContainerRef.current) return;

    const rect = scrollContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left + scrollContainerRef.current.scrollLeft;
    const calculatedTime = Math.max(0, Math.min(totalDuration, clickX / pixelsPerSecond));
    onTimeUpdate(calculatedTime);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    handleTimelineClickOrDrag(e);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (trimDrag) {
      const deltaX = e.clientX - trimDrag.initialX;
      const deltaSeconds = (deltaX / pixelsPerSecond) * trimDrag.speed;

      if (trimDrag.handle === 'start') {
        const minDuration = 0.3;
        const newStart = Math.max(
          0,
          Math.min(trimDrag.initialTrimEnd - minDuration, trimDrag.initialTrimStart + deltaSeconds)
        );
        onTrimClip(trimDrag.clipId, newStart, trimDrag.initialTrimEnd);
      } else {
        const minDuration = 0.3;
        const newEnd = Math.min(
          trimDrag.clipDuration,
          Math.max(trimDrag.initialTrimStart + minDuration, trimDrag.initialTrimEnd + deltaSeconds)
        );
        onTrimClip(trimDrag.clipId, trimDrag.initialTrimStart, newEnd);
      }
      return;
    }

    if (isScrubbing) {
      handleTimelineClickOrDrag(e);
    }
  };

  const handlePointerUp = () => {
    setIsScrubbing(false);
    setTrimDrag(null);
  };

  // Generate ruler markers
  const rulerInterval = pixelsPerSecond < 25 ? 5 : pixelsPerSecond < 60 ? 2 : 1;
  const rulerMarkers: number[] = [];
  for (let s = 0; s <= totalDuration + 5; s += rulerInterval) {
    rulerMarkers.push(s);
  }

  // Calculate cumulative start positions for each clip
  let accumulatedTime = 0;
  const clipPositions = project.clips.map((clip) => {
    const start = accumulatedTime;
    const effDur = getClipEffectiveDuration(clip);
    accumulatedTime += effDur;
    return {
      clip,
      start,
      effDur,
      widthPx: Math.max(36, effDur * pixelsPerSecond),
      leftPx: start * pixelsPerSecond,
    };
  });

  return (
    <div className="bg-neutral-950 border-t border-neutral-800/80 flex flex-col select-none z-20">
      {/* Timeline Controls Header */}
      <div className="h-10 px-3 bg-neutral-900/60 border-b border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <button
            id="timeline-add-clip-btn"
            onClick={onAddVideoClick}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 font-medium rounded-md transition"
            title="Add Video Clip"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add Video</span>
          </button>

          <button
            id="timeline-add-audio-btn"
            onClick={onAddAudioClick}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 font-medium rounded-md transition"
            title="Add Audio / Music"
          >
            <Music className="w-3.5 h-3.5 text-pink-400" />
            <span>Add Audio</span>
          </button>
        </div>

        {/* Zoom & Fit */}
        <div className="flex items-center gap-1">
          <button
            id="timeline-zoom-out-btn"
            onClick={() => setPixelsPerSecond((p) => Math.max(15, p - 10))}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-1">{Math.round(pixelsPerSecond)}px/s</span>
          <button
            id="timeline-zoom-in-btn"
            onClick={() => setPixelsPerSecond((p) => Math.min(120, p + 10))}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable Tracks Canvas */}
      <div
        ref={scrollContainerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative h-44 sm:h-48 overflow-x-auto overflow-y-hidden bg-neutral-950 cursor-pointer"
        style={{ scrollBehavior: isScrubbing ? 'auto' : 'smooth' }}
      >
        <div
          className="relative h-full"
          style={{ width: `${timelinePixelWidth}px`, minWidth: '100%' }}
        >
          {/* Time Ruler */}
          <div className="h-6 border-b border-neutral-800/80 bg-neutral-900/40 relative">
            {rulerMarkers.map((time) => (
              <div
                key={time}
                style={{ left: `${time * pixelsPerSecond}px` }}
                className="absolute top-0 bottom-0 flex flex-col items-start border-l border-neutral-700/60 pl-1"
              >
                <span className="text-[10px] font-mono text-neutral-500 pointer-events-none">
                  {formatShortTime(time)}
                </span>
              </div>
            ))}
          </div>

          {/* Track 1: Video Clips */}
          <div className="h-20 sm:h-22 relative border-b border-neutral-800/60 py-1.5 px-0 flex items-center">
            {clipPositions.length === 0 ? (
              <div
                onClick={onAddVideoClick}
                className="ml-4 h-16 w-60 border-2 border-dashed border-neutral-700/80 hover:border-indigo-500 rounded-lg flex items-center justify-center gap-2 text-neutral-400 hover:text-indigo-400 transition bg-neutral-900/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="text-xs font-medium">Click to Add Video Clips</span>
              </div>
            ) : (
              clipPositions.map(({ clip, leftPx, widthPx }, index) => {
                const isSelected = clip.id === project.selectedClipId;

                return (
                  <div
                    key={clip.id}
                    id={`timeline-clip-${clip.id}`}
                    style={{
                      left: `${leftPx}px`,
                      width: `${widthPx}px`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectClip(clip.id);
                    }}
                    className={`absolute h-16 sm:h-18 rounded-lg overflow-hidden border transition-all select-none group cursor-pointer ${
                      isSelected
                        ? 'border-indigo-400 ring-2 ring-indigo-500/40 z-10 shadow-lg shadow-indigo-950/60'
                        : 'border-neutral-700/70 hover:border-neutral-500 bg-neutral-900/80'
                    }`}
                  >
                    {/* Thumbnail background */}
                    {clip.thumbnailUrl ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-35 group-hover:opacity-45 transition"
                        style={{ backgroundImage: `url(${clip.thumbnailUrl})` }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-r from-neutral-900 to-indigo-950/40" />
                    )}

                    {/* Clip content details */}
                    <div className="relative h-full flex flex-col justify-between p-1.5 z-10">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[11px] font-semibold text-neutral-100 truncate drop-shadow-md">
                          {clip.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {clip.isMuted && (
                            <VolumeX className="w-3 h-3 text-red-400" title="Muted" />
                          )}
                          {clip.speed !== 1 && (
                            <span className="text-[9px] font-bold px-1 py-0.2 bg-amber-500/80 text-black rounded font-mono">
                              {clip.speed}x
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-neutral-300 font-mono">
                        <span>{formatShortTime(getClipEffectiveDuration(clip))}</span>

                        {/* Clip actions on hover / selected */}
                        {isSelected && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-0.5 bg-neutral-950/80 rounded px-1 py-0.5 border border-neutral-700"
                          >
                            {index > 0 && (
                              <button
                                onClick={() => onMoveClip(index, 'left')}
                                className="p-0.5 hover:text-white"
                                title="Move clip earlier"
                              >
                                <ChevronLeft className="w-3 h-3" />
                              </button>
                            )}
                            {index < project.clips.length - 1 && (
                              <button
                                onClick={() => onMoveClip(index, 'right')}
                                className="p-0.5 hover:text-white"
                                title="Move clip later"
                              >
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            )}
                            <button
                              onClick={() => onDeleteClip(clip.id)}
                              className="p-0.5 text-red-400 hover:text-red-300 ml-0.5"
                              title="Delete clip"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Left & Right Trim Handles on Selected Clip */}
                    {isSelected && (
                      <>
                        <div
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setTrimDrag({
                              clipId: clip.id,
                              handle: 'start',
                              initialX: e.clientX,
                              initialTrimStart: clip.trimStart,
                              initialTrimEnd: clip.trimEnd,
                              clipDuration: clip.duration,
                              speed: clip.speed,
                            });
                          }}
                          className="absolute left-0 top-0 bottom-0 w-3 bg-indigo-500 hover:bg-indigo-400 cursor-ew-resize flex items-center justify-center z-20 transition"
                          title="Drag to trim start"
                        >
                          <div className="w-0.5 h-4 bg-white/80 rounded" />
                        </div>

                        <div
                          onPointerDown={(e) => {
                            e.stopPropagation();
                            setTrimDrag({
                              clipId: clip.id,
                              handle: 'end',
                              initialX: e.clientX,
                              initialTrimStart: clip.trimStart,
                              initialTrimEnd: clip.trimEnd,
                              clipDuration: clip.duration,
                              speed: clip.speed,
                            });
                          }}
                          className="absolute right-0 top-0 bottom-0 w-3 bg-indigo-500 hover:bg-indigo-400 cursor-ew-resize flex items-center justify-center z-20 transition"
                          title="Drag to trim end"
                        >
                          <div className="w-0.5 h-4 bg-white/80 rounded" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Track 2: Audio Track */}
          <div
            onClick={() => onOpenTool('audio')}
            className="h-8 border-b border-neutral-800/60 relative flex items-center px-2 hover:bg-neutral-900/30 transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] mr-2">
              <Music className="w-3 h-3 text-pink-400" />
              <span>Audio</span>
            </div>

            {project.backgroundAudio ? (
              <div
                style={{
                  width: `${Math.min(
                    timelinePixelWidth,
                    (project.backgroundAudio.duration || 30) * pixelsPerSecond
                  )}px`,
                }}
                className="h-6 bg-pink-950/70 border border-pink-700/60 rounded-md px-2 flex items-center justify-between text-pink-200 text-[10px] shadow-sm"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-semibold truncate">{project.backgroundAudio.name}</span>
                  {project.backgroundAudio.isMuted && (
                    <VolumeX className="w-3 h-3 text-red-400" />
                  )}
                </div>
                <span className="font-mono text-pink-300">
                  {project.backgroundAudio.volume}%
                </span>
              </div>
            ) : (
              <span className="text-[10px] text-neutral-600 italic">
                + Tap to add background music
              </span>
            )}
          </div>

          {/* Track 3: Text & Subtitle Overlays */}
          <div
            onClick={() => onOpenTool('text')}
            className="h-8 relative flex items-center px-2 hover:bg-neutral-900/30 transition cursor-pointer"
          >
            <div className="flex items-center gap-1.5 text-neutral-500 text-[11px] mr-2">
              <Type className="w-3 h-3 text-cyan-400" />
              <span>Text</span>
            </div>

            {/* Render text overlays */}
            {project.textOverlays.map((overlay) => (
              <div
                key={overlay.id}
                style={{
                  left: `${overlay.startTime * pixelsPerSecond}px`,
                  width: `${Math.max(30, (overlay.endTime - overlay.startTime) * pixelsPerSecond)}px`,
                }}
                className="absolute h-5 bg-cyan-950/80 border border-cyan-600/70 rounded px-1.5 flex items-center text-cyan-200 text-[10px] truncate shadow-sm"
              >
                <span className="truncate">{overlay.text}</span>
              </div>
            ))}

            {/* Render subtitles */}
            {project.subtitles.map((sub) => (
              <div
                key={sub.id}
                style={{
                  left: `${sub.startTime * pixelsPerSecond}px`,
                  width: `${Math.max(24, (sub.endTime - sub.startTime) * pixelsPerSecond)}px`,
                }}
                className="absolute h-5 bg-amber-950/80 border border-amber-600/70 rounded px-1 flex items-center text-amber-200 text-[9px] truncate shadow-sm top-1.5"
              >
                <MessageSquare className="w-2.5 h-2.5 mr-0.5 shrink-0" />
                <span className="truncate">{sub.text}</span>
              </div>
            ))}

            {project.textOverlays.length === 0 && project.subtitles.length === 0 && (
              <span className="text-[10px] text-neutral-600 italic">
                + Tap to add text overlays or captions
              </span>
            )}
          </div>

          {/* Draggable Vertical Playhead Needle */}
          <div
            style={{ left: `${project.currentTime * pixelsPerSecond}px` }}
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 pointer-events-none z-30 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
          >
            {/* Top Handle Head */}
            <div className="absolute -top-0 -left-1.5 w-3.5 h-4 bg-red-500 rounded-b-sm flex items-center justify-center shadow-md">
              <div className="w-1 h-1.5 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

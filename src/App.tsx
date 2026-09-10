import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { Timeline } from './components/Timeline';
import { Toolbar } from './components/Toolbar';
import { TrimModal } from './components/tools/TrimModal';
import { SpeedModal } from './components/tools/SpeedModal';
import { FilterModal } from './components/tools/FilterModal';
import { CanvasModal } from './components/tools/CanvasModal';
import { AudioModal } from './components/tools/AudioModal';
import { TextModal } from './components/tools/TextModal';
import { CaptionsModal } from './components/tools/CaptionsModal';
import { AiAssistantDrawer } from './components/tools/AiAssistantDrawer';
import { ExportModal } from './components/tools/ExportModal';

import {
  ProjectState,
  VideoClip,
  TextOverlay,
  Subtitle,
  AudioTrack,
  AspectRatio,
  FilterType,
  AiAction,
} from './types';
import { SAMPLE_VIDEOS, createGeneratedFallbackClip } from './data/sampleClips';
import { generateThumbnailFromVideoUrl } from './utils/thumbnailGenerator';
import {
  findClipAtTime,
  getClipEffectiveDuration,
  getTotalTimelineDuration,
} from './utils/timeFormat';

const INITIAL_PROJECT: ProjectState = {
  projectName: 'AI Video Project',
  aspectRatio: '9:16', // Mobile-first default
  filter: 'none',
  clips: [],
  selectedClipId: null,
  textOverlays: [],
  subtitles: [],
  backgroundAudio: null,
  currentTime: 0,
  isPlaying: false,
};

export default function App() {
  const [project, setProject] = useState<ProjectState>(INITIAL_PROJECT);
  const [history, setHistory] = useState<ProjectState[]>([INITIAL_PROJECT]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Active modal/tool drawer
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string>('');

  // File input ref for video upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Push new snapshot to undo/redo history
  const pushState = useCallback((newProject: ProjectState) => {
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, newProject];
    });
    setHistoryIndex((prev) => prev + 1);
    setProject(newProject);
  }, [historyIndex]);

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setHistoryIndex(prevIndex);
      setProject({
        ...history[prevIndex],
        isPlaying: false, // pause on undo
      });
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setProject({
        ...history[nextIndex],
        isPlaying: false, // pause on redo
      });
    }
  }, [history, historyIndex]);

  // Play / Pause toggle
  const handleTogglePlay = useCallback(() => {
    setProject((prev) => {
      const totalDur = getTotalTimelineDuration(prev.clips);
      let time = prev.currentTime;
      if (time >= totalDur && totalDur > 0) {
        time = 0; // loop back to start if at end
      }
      return {
        ...prev,
        currentTime: time,
        isPlaying: !prev.isPlaying,
      };
    });
  }, []);

  // Time scrubber update
  const handleTimeUpdate = useCallback((newTime: number) => {
    setProject((prev) => ({
      ...prev,
      currentTime: newTime,
    }));
  }, []);

  // Select clip
  const handleSelectClip = useCallback((clipId: string | null) => {
    setProject((prev) => ({
      ...prev,
      selectedClipId: clipId,
    }));
  }, []);

  // Upload video files handler
  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const newClips: VideoClip[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('video/')) continue;

      const url = URL.createObjectURL(file);

      // Extract duration and dimensions
      const metadata = await new Promise<{ duration: number; width: number; height: number }>(
        (resolve) => {
          const v = document.createElement('video');
          v.src = url;
          v.preload = 'metadata';
          v.onloadedmetadata = () => {
            resolve({
              duration: v.duration || 5,
              width: v.videoWidth || 1080,
              height: v.videoHeight || 1920,
            });
          };
          v.onerror = () => {
            resolve({ duration: 5, width: 1080, height: 1920 });
          };
        }
      );

      // Generate thumbnail
      const thumb = await generateThumbnailFromVideoUrl(url, 0.5);

      newClips.push({
        id: `clip-${Date.now()}-${i}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        duration: metadata.duration,
        trimStart: 0,
        trimEnd: metadata.duration,
        speed: 1,
        volume: 100,
        isMuted: false,
        thumbnailUrl: thumb,
        width: metadata.width,
        height: metadata.height,
      });
    }

    if (newClips.length > 0) {
      const updatedClips = [...project.clips, ...newClips];
      pushState({
        ...project,
        clips: updatedClips,
        selectedClipId: newClips[0].id,
      });
    }
  };

  // Load sample demo clips
  const handleLoadSamples = async () => {
    const sampleClips: VideoClip[] = [];

    // First, try to add real sample videos
    for (let i = 0; i < Math.min(2, SAMPLE_VIDEOS.length); i++) {
      const sample = SAMPLE_VIDEOS[i];
      sampleClips.push({
        id: `sample-${Date.now()}-${i}`,
        name: sample.name,
        url: sample.url,
        duration: sample.duration,
        trimStart: 0,
        trimEnd: Math.min(10, sample.duration),
        speed: 1,
        volume: 100,
        isMuted: false,
        thumbnailUrl: sample.thumbnailUrl,
      });
    }

    // Add a generated animated dynamic fallback clip as 3rd clip
    try {
      const fallback = await createGeneratedFallbackClip(
        'AI Studio Motion',
        '#6366f1',
        '#06b6d4',
        6
      );
      sampleClips.push(fallback);
    } catch {
      // fallback creation error ignored
    }

    const defaultOverlays: TextOverlay[] = [
      {
        id: 'overlay-intro',
        text: '🔥 Viral Clip Hook',
        startTime: 0.5,
        endTime: 3.5,
        x: 50,
        y: 25,
        fontSize: 26,
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        fontWeight: 'bold',
      },
    ];

    const defaultSubtitles: Subtitle[] = [
      {
        id: 'sub-1',
        text: 'Welcome to AI Video Studio!',
        startTime: 0.5,
        endTime: 3.5,
      },
      {
        id: 'sub-2',
        text: 'Edit, trim, split and export effortlessly.',
        startTime: 3.8,
        endTime: 7.0,
      },
    ];

    pushState({
      ...project,
      clips: [...project.clips, ...sampleClips],
      selectedClipId: sampleClips[0]?.id || null,
      textOverlays: project.textOverlays.length === 0 ? defaultOverlays : project.textOverlays,
      subtitles: project.subtitles.length === 0 ? defaultSubtitles : project.subtitles,
      currentTime: 0,
    });
  };

  // Trim clip
  const handleTrimClip = (clipId: string, newTrimStart: number, newTrimEnd: number) => {
    const updatedClips = project.clips.map((c) =>
      c.id === clipId ? { ...c, trimStart: newTrimStart, trimEnd: newTrimEnd } : c
    );
    pushState({
      ...project,
      clips: updatedClips,
    });
  };

  // Split clip at playhead
  const handleSplitClip = () => {
    const mapping = findClipAtTime(project.clips, project.currentTime);
    if (!mapping) return;

    const clip = mapping.clip;
    const splitInternalTime = mapping.clipInternalTime;

    // Must have at least 0.3s on either side of the split
    if (
      splitInternalTime - clip.trimStart < 0.3 ||
      clip.trimEnd - splitInternalTime < 0.3
    ) {
      return;
    }

    const firstHalf: VideoClip = {
      ...clip,
      id: `clip-${Date.now()}-a`,
      name: `${clip.name} (Part 1)`,
      trimEnd: splitInternalTime,
    };

    const secondHalf: VideoClip = {
      ...clip,
      id: `clip-${Date.now()}-b`,
      name: `${clip.name} (Part 2)`,
      trimStart: splitInternalTime,
    };

    const updatedClips = [...project.clips];
    updatedClips.splice(mapping.clipIndex, 1, firstHalf, secondHalf);

    pushState({
      ...project,
      clips: updatedClips,
      selectedClipId: secondHalf.id,
    });
  };

  // Delete clip
  const handleDeleteClip = (clipId: string) => {
    const updatedClips = project.clips.filter((c) => c.id !== clipId);
    pushState({
      ...project,
      clips: updatedClips,
      selectedClipId: updatedClips[0]?.id || null,
      currentTime: Math.min(project.currentTime, getTotalTimelineDuration(updatedClips)),
    });
  };

  // Reorder clips (move left / right)
  const handleMoveClip = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= project.clips.length) return;

    const updatedClips = [...project.clips];
    const [moved] = updatedClips.splice(index, 1);
    updatedClips.splice(targetIndex, 0, moved);

    pushState({
      ...project,
      clips: updatedClips,
      selectedClipId: moved.id,
    });
  };

  // Playback speed
  const handleUpdateSpeed = (clipId: string, speed: number) => {
    const updatedClips = project.clips.map((c) =>
      c.id === clipId ? { ...c, speed } : c
    );
    pushState({
      ...project,
      clips: updatedClips,
    });
  };

  // Clip audio (volume / mute)
  const handleUpdateClipAudio = (clipId: string, volume: number, isMuted: boolean) => {
    const updatedClips = project.clips.map((c) =>
      c.id === clipId ? { ...c, volume, isMuted } : c
    );
    pushState({
      ...project,
      clips: updatedClips,
    });
  };

  // Background audio
  const handleSetBackgroundAudio = (audio: AudioTrack | null) => {
    pushState({
      ...project,
      backgroundAudio: audio,
    });
  };

  const handleUpdateBackgroundAudioVolume = (volume: number, isMuted: boolean) => {
    if (!project.backgroundAudio) return;
    pushState({
      ...project,
      backgroundAudio: {
        ...project.backgroundAudio,
        volume,
        isMuted,
      },
    });
  };

  // Filter
  const handleSelectFilter = (filter: FilterType) => {
    pushState({
      ...project,
      filter,
    });
  };

  // Canvas / Aspect ratio
  const handleSelectAspectRatio = (aspectRatio: AspectRatio) => {
    pushState({
      ...project,
      aspectRatio,
    });
  };

  // Text Overlays
  const handleAddOverlay = (overlay: TextOverlay) => {
    pushState({
      ...project,
      textOverlays: [...project.textOverlays, overlay],
    });
  };

  const handleUpdateOverlay = (overlay: TextOverlay) => {
    pushState({
      ...project,
      textOverlays: project.textOverlays.map((o) => (o.id === overlay.id ? overlay : o)),
    });
  };

  const handleDeleteOverlay = (id: string) => {
    pushState({
      ...project,
      textOverlays: project.textOverlays.filter((o) => o.id !== id),
    });
  };

  // Subtitles
  const handleAddSubtitle = (sub: Subtitle) => {
    pushState({
      ...project,
      subtitles: [...project.subtitles, sub],
    });
  };

  const handleSetSubtitles = (subs: Subtitle[]) => {
    pushState({
      ...project,
      subtitles: subs,
    });
  };

  const handleDeleteSubtitle = (id: string) => {
    pushState({
      ...project,
      subtitles: project.subtitles.filter((s) => s.id !== id),
    });
  };

  // Execute AI Actions
  const handleApplyAiActions = (actions: AiAction[]) => {
    let nextProject = { ...project };

    for (const action of actions) {
      if (action.type === 'setAspectRatio' && action.aspectRatio) {
        nextProject.aspectRatio = action.aspectRatio;
      } else if (action.type === 'setFilter' && action.filter) {
        nextProject.filter = action.filter;
      } else if (action.type === 'addCaptions' && action.captions) {
        const newSubs: Subtitle[] = action.captions.map((c, i) => ({
          id: `ai-sub-${Date.now()}-${i}`,
          text: c.text,
          startTime: c.startTime,
          endTime: c.endTime,
        }));
        nextProject.subtitles = [...nextProject.subtitles, ...newSubs];
      } else if (action.type === 'addTextOverlay' && action.text) {
        const newOverlay: TextOverlay = {
          id: `ai-overlay-${Date.now()}`,
          text: action.text,
          startTime: action.startTime || 0,
          endTime: action.endTime || 3,
          x: 50,
          y: action.y || 25,
          fontSize: action.fontSize || 28,
          color: action.color || '#ffffff',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          fontWeight: 'bold',
        };
        nextProject.textOverlays = [...nextProject.textOverlays, newOverlay];
      } else if (action.type === 'setClipSpeed' && action.speed) {
        const idx = action.clipIndex ?? 0;
        if (nextProject.clips[idx]) {
          nextProject.clips = nextProject.clips.map((c, i) =>
            i === idx ? { ...c, speed: action.speed! } : c
          );
        }
      } else if (action.type === 'trimClip' && action.trimEnd !== undefined) {
        const idx = action.clipIndex ?? 0;
        if (nextProject.clips[idx]) {
          nextProject.clips = nextProject.clips.map((c, i) =>
            i === idx
              ? {
                  ...c,
                  trimStart: action.trimStart ?? c.trimStart,
                  trimEnd: action.trimEnd!,
                }
              : c
          );
        }
      }
    }

    pushState(nextProject);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (project.selectedClipId) {
          e.preventDefault();
          handleDeleteClip(project.selectedClipId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleTogglePlay, project.selectedClipId]);

  // Selected clip helper
  const selectedClip = project.clips.find((c) => c.id === project.selectedClipId) || null;

  return (
    <div className="flex flex-col h-screen w-screen bg-neutral-950 text-neutral-100 overflow-hidden font-sans select-none">
      {/* Hidden File Input for Video Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        multiple
        onChange={(e) => {
          if (e.target.files) handleFilesUpload(e.target.files);
          e.target.value = '';
        }}
        className="hidden"
      />

      {/* Top Header */}
      <Header
        projectName={project.projectName}
        onUpdateProjectName={(name) => pushState({ ...project, projectName: name })}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAi={() => setActiveTool('ai')}
        onLoadSamples={handleLoadSamples}
        clipCount={project.clips.length}
      />

      {/* Main Center Video Preview */}
      <VideoPlayer
        project={project}
        onTimeUpdate={handleTimeUpdate}
        onTogglePlay={handleTogglePlay}
        onUploadClick={() => fileInputRef.current?.click()}
        onLoadSamples={handleLoadSamples}
        onSelectClip={handleSelectClip}
      />

      {/* Multi-Track Timeline */}
      <Timeline
        project={project}
        onTimeUpdate={handleTimeUpdate}
        onSelectClip={handleSelectClip}
        onDeleteClip={handleDeleteClip}
        onMoveClip={handleMoveClip}
        onAddVideoClick={() => fileInputRef.current?.click()}
        onAddAudioClick={() => setActiveTool('audio')}
        onOpenTool={(tool) => setActiveTool(tool)}
        onTrimClip={handleTrimClip}
      />

      {/* Bottom Action Toolbar */}
      <Toolbar
        activeTool={activeTool}
        onSelectTool={(tool) => setActiveTool(tool)}
        onSplitClip={handleSplitClip}
        onDeleteSelectedClip={() => {
          if (project.selectedClipId) handleDeleteClip(project.selectedClipId);
        }}
        hasSelectedClip={!!project.selectedClipId}
      />

      {/* Tool Modals & Drawers */}
      {activeTool === 'trim' && (
        <TrimModal
          clip={selectedClip}
          currentTime={project.currentTime}
          onClose={() => setActiveTool(null)}
          onUpdateTrim={handleTrimClip}
        />
      )}

      {activeTool === 'speed' && (
        <SpeedModal
          clip={selectedClip}
          onClose={() => setActiveTool(null)}
          onUpdateSpeed={handleUpdateSpeed}
        />
      )}

      {activeTool === 'filter' && (
        <FilterModal
          currentFilter={project.filter}
          onClose={() => setActiveTool(null)}
          onSelectFilter={handleSelectFilter}
        />
      )}

      {activeTool === 'canvas' && (
        <CanvasModal
          currentAspectRatio={project.aspectRatio}
          onClose={() => setActiveTool(null)}
          onSelectAspectRatio={handleSelectAspectRatio}
        />
      )}

      {activeTool === 'audio' && (
        <AudioModal
          selectedClip={selectedClip}
          backgroundAudio={project.backgroundAudio}
          onClose={() => setActiveTool(null)}
          onUpdateClipAudio={handleUpdateClipAudio}
          onSetBackgroundAudio={handleSetBackgroundAudio}
          onUpdateBackgroundAudioVolume={handleUpdateBackgroundAudioVolume}
        />
      )}

      {activeTool === 'text' && (
        <TextModal
          overlays={project.textOverlays}
          currentTime={project.currentTime}
          totalDuration={getTotalTimelineDuration(project.clips)}
          onClose={() => setActiveTool(null)}
          onAddOverlay={handleAddOverlay}
          onUpdateOverlay={handleUpdateOverlay}
          onDeleteOverlay={handleDeleteOverlay}
        />
      )}

      {activeTool === 'captions' && (
        <CaptionsModal
          subtitles={project.subtitles}
          currentTime={project.currentTime}
          totalDuration={getTotalTimelineDuration(project.clips)}
          onClose={() => setActiveTool(null)}
          onAddSubtitle={handleAddSubtitle}
          onSetSubtitles={handleSetSubtitles}
          onDeleteSubtitle={handleDeleteSubtitle}
          onRequestAiCaptions={() => {
            setAiInitialPrompt('Create captions for this video');
            setActiveTool('ai');
          }}
        />
      )}

      {activeTool === 'ai' && (
        <AiAssistantDrawer
          project={project}
          onClose={() => {
            setActiveTool(null);
            setAiInitialPrompt('');
          }}
          onApplyAiActions={handleApplyAiActions}
          initialPrompt={aiInitialPrompt}
        />
      )}

      {/* Video Export Modal */}
      {isExportOpen && (
        <ExportModal
          project={project}
          onClose={() => setIsExportOpen(false)}
        />
      )}
    </div>
  );
}

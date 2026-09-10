import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Upload,
  Sparkles,
  Layers,
} from 'lucide-react';
import { ProjectState, VideoClip, TextOverlay, Subtitle } from '../types';
import {
  findClipAtTime,
  formatTime,
  getTotalTimelineDuration,
  getClipEffectiveDuration,
} from '../utils/timeFormat';
import { getFilterCss } from '../utils/filterStyles';

interface VideoPlayerProps {
  project: ProjectState;
  onTimeUpdate: (newTime: number) => void;
  onTogglePlay: () => void;
  onUploadClick: () => void;
  onLoadSamples: () => void;
  onSelectClip: (id: string | null) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  project,
  onTimeUpdate,
  onTogglePlay,
  onUploadClick,
  onLoadSamples,
  onSelectClip,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  const totalDuration = getTotalTimelineDuration(project.clips);
  const activeMapping = findClipAtTime(project.clips, project.currentTime);
  const activeClip = activeMapping?.clip || null;

  // Sync Video Element with active clip and internal playback time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!activeClip) {
      video.pause();
      return;
    }

    // Switch source if clip changed
    if (video.src !== activeClip.url && activeClip.url) {
      setIsVideoLoading(true);
      video.src = activeClip.url;
      video.load();
    }

    // Set speed and volume
    video.playbackRate = activeClip.speed || 1;
    video.volume = activeClip.isMuted ? 0 : Math.min(1, (activeClip.volume || 100) / 100);
    video.muted = activeClip.isMuted;

    // Sync playhead position
    if (activeMapping) {
      const targetTime = activeMapping.clipInternalTime;
      // Only seek if drift is > 0.15s to prevent stutter during normal playback
      if (Math.abs(video.currentTime - targetTime) > 0.15) {
        video.currentTime = targetTime;
      }
    }

    if (project.isPlaying) {
      video.play().catch(() => {
        // autoplay restriction might occur if not user-interacted
      });
    } else {
      video.pause();
    }
  }, [activeClip?.id, activeClip?.url, activeClip?.speed, activeClip?.isMuted, activeClip?.volume, project.isPlaying]);

  // Handle playhead seeking when paused
  useEffect(() => {
    const video = videoRef.current;
    if (!video || project.isPlaying || !activeMapping) return;

    if (Math.abs(video.currentTime - activeMapping.clipInternalTime) > 0.05) {
      video.currentTime = activeMapping.clipInternalTime;
    }
  }, [project.currentTime, project.isPlaying, activeMapping]);

  // Synchronize Background Audio
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!project.backgroundAudio) {
      audio.pause();
      return;
    }

    if (audio.src !== project.backgroundAudio.url) {
      audio.src = project.backgroundAudio.url;
      audio.load();
    }

    audio.volume = project.backgroundAudio.isMuted
      ? 0
      : Math.min(1, (project.backgroundAudio.volume || 100) / 100);
    audio.muted = project.backgroundAudio.isMuted;

    if (project.isPlaying) {
      audio.currentTime = project.currentTime % (project.backgroundAudio.duration || 30);
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [project.backgroundAudio, project.isPlaying]);

  // Playback ticking loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      if (project.isPlaying) {
        const delta = (now - lastTimestamp) / 1000;
        const newTime = project.currentTime + delta;

        if (newTime >= totalDuration) {
          onTimeUpdate(totalDuration);
          onTogglePlay(); // stop at end
        } else {
          onTimeUpdate(newTime);
        }
      }
      lastTimestamp = now;
      if (project.isPlaying) {
        animationFrameId = requestAnimationFrame(loop);
      }
    };

    if (project.isPlaying) {
      lastTimestamp = performance.now();
      animationFrameId = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [project.isPlaying, project.currentTime, totalDuration]);

  // Aspect ratio styling
  const getAspectRatioClasses = () => {
    switch (project.aspectRatio) {
      case '9:16':
        return 'aspect-[9/16] max-h-[50vh] sm:max-h-[58vh] max-w-[340px]';
      case '1:1':
        return 'aspect-square max-h-[48vh] sm:max-h-[55vh] max-w-[440px]';
      case '16:9':
      default:
        return 'aspect-[16/9] max-h-[48vh] sm:max-h-[55vh] max-w-[680px]';
    }
  };

  // Step backward / forward
  const handleStep = (seconds: number) => {
    const next = Math.max(0, Math.min(totalDuration, project.currentTime + seconds));
    onTimeUpdate(next);
  };

  // Skip to previous clip or next clip
  const handleSkipClip = (direction: 'prev' | 'next') => {
    if (!activeMapping) return;
    if (direction === 'prev') {
      if (activeMapping.clipIndex > 0) {
        let target = 0;
        for (let i = 0; i < activeMapping.clipIndex - 1; i++) {
          target += getClipEffectiveDuration(project.clips[i]);
        }
        onTimeUpdate(target);
        onSelectClip(project.clips[activeMapping.clipIndex - 1].id);
      } else {
        onTimeUpdate(0);
      }
    } else {
      if (activeMapping.clipIndex < project.clips.length - 1) {
        let target = 0;
        for (let i = 0; i <= activeMapping.clipIndex; i++) {
          target += getClipEffectiveDuration(project.clips[i]);
        }
        onTimeUpdate(target);
        onSelectClip(project.clips[activeMapping.clipIndex + 1].id);
      }
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Active overlays and subtitles
  const currentOverlays = project.textOverlays.filter(
    (o) => project.currentTime >= o.startTime && project.currentTime <= o.endTime
  );
  const currentSubtitle = project.subtitles.find(
    (s) => project.currentTime >= s.startTime && project.currentTime <= s.endTime
  );

  const filterStyle = {
    filter: getFilterCss(project.filter),
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      className="relative flex-1 bg-neutral-950 flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden select-none"
    >
      {/* Aspect Ratio Badge & Info */}
      <div className="absolute top-3 left-4 z-20 flex items-center gap-2 pointer-events-none">
        <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase bg-neutral-900/90 text-neutral-300 border border-neutral-800 rounded-md backdrop-blur-md shadow-sm">
          {project.aspectRatio === '9:16'
            ? '9:16 Shorts/Reels'
            : project.aspectRatio === '1:1'
            ? '1:1 Square'
            : '16:9 YouTube'}
        </span>
        {project.filter !== 'none' && (
          <span className="px-2 py-0.5 text-[11px] font-semibold tracking-wider capitalize bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 rounded-md backdrop-blur-md">
            {project.filter}
          </span>
        )}
      </div>

      {/* Main Preview Container */}
      <div
        className={`relative w-full ${getAspectRatioClasses()} bg-black rounded-xl overflow-hidden shadow-2xl border border-neutral-800/80 flex items-center justify-center transition-all duration-300`}
      >
        {project.clips.length === 0 ? (
          /* Empty State when no clips uploaded */
          <div className="flex flex-col items-center justify-center p-6 text-center max-w-sm">
            <div className="w-14 h-14 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
              <Upload className="w-6 h-6 animate-bounce" />
            </div>
            <h3 className="text-base font-semibold text-neutral-100 mb-1">
              Start Your Video Project
            </h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Upload video clips from your phone or laptop, or try with pre-loaded demo footage.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <button
                id="player-upload-btn"
                onClick={onUploadClick}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white text-xs font-semibold rounded-lg shadow-lg shadow-indigo-950/50 transition cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Videos</span>
              </button>
              <button
                id="player-demo-btn"
                onClick={onLoadSamples}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 text-xs font-semibold rounded-lg border border-neutral-700 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Load Demo</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Video Preview */
          <>
            <video
              ref={videoRef}
              playsInline
              crossOrigin="anonymous"
              style={filterStyle}
              onLoadedData={() => setIsVideoLoading(false)}
              onWaiting={() => setIsVideoLoading(true)}
              onPlaying={() => setIsVideoLoading(false)}
              className="w-full h-full object-cover pointer-events-none"
            />

            {/* Hidden background audio player */}
            <audio ref={audioRef} crossOrigin="anonymous" loop />

            {/* Active Text Overlays */}
            {currentOverlays.map((overlay) => (
              <div
                key={overlay.id}
                style={{
                  left: `${overlay.x}%`,
                  top: `${overlay.y}%`,
                  transform: 'translate(-50%, -50%)',
                  color: overlay.color,
                  backgroundColor: overlay.backgroundColor,
                  fontSize: `${Math.max(14, overlay.fontSize * 0.85)}px`,
                  fontWeight: overlay.fontWeight,
                }}
                className="absolute z-10 px-3 py-1 rounded-md shadow-lg pointer-events-none text-center whitespace-pre-wrap select-none leading-tight transition-all"
              >
                {overlay.text}
              </div>
            ))}

            {/* Active Subtitle */}
            {currentSubtitle && (
              <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center px-4 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-sm text-white font-bold text-sm sm:text-base px-3.5 py-1.5 rounded-lg border border-white/10 shadow-xl max-w-[90%] text-center">
                  {currentSubtitle.text}
                </div>
              </div>
            )}

            {/* Big Play/Pause Center Tap Area */}
            <button
              id="player-center-play-pause-btn"
              onClick={onTogglePlay}
              aria-label={project.isPlaying ? 'Pause' : 'Play'}
              className={`absolute inset-0 z-10 flex items-center justify-center bg-black/20 hover:bg-black/40 transition cursor-pointer ${
                project.isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'
              }`}
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 active:scale-95 text-white flex items-center justify-center shadow-xl shadow-black/50 backdrop-blur-md transition">
                {project.isPlaying ? (
                  <Pause className="w-7 h-7" />
                ) : (
                  <Play className="w-7 h-7 ml-1" />
                )}
              </div>
            </button>
          </>
        )}
      </div>

      {/* Floating Bottom Player Bar: Timecode & Transport */}
      {project.clips.length > 0 && (
        <div
          className={`mt-2 flex items-center gap-3 bg-neutral-900/90 border border-neutral-800/90 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md z-20 transition-opacity duration-200 ${
            showControls || !project.isPlaying ? 'opacity-100' : 'opacity-85'
          }`}
        >
          <button
            id="player-prev-clip-btn"
            onClick={() => handleSkipClip('prev')}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full transition"
            title="Previous Clip"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            id="player-step-back-btn"
            onClick={() => handleStep(-1)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full transition"
            title="Back 1s"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            id="player-play-btn"
            onClick={onTogglePlay}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-full transition shadow-md shadow-indigo-950/40"
            title={project.isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {project.isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          <button
            id="player-step-forward-btn"
            onClick={() => handleStep(1)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full transition"
            title="Forward 1s"
          >
            <RotateCcw className="w-3.5 h-3.5 scale-x-[-1]" />
          </button>

          <button
            id="player-next-clip-btn"
            onClick={() => handleSkipClip('next')}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full transition"
            title="Next Clip"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Timecode */}
          <div className="h-4 w-px bg-neutral-800 mx-1" />
          <div className="text-xs font-mono font-medium text-neutral-300 tracking-tight">
            <span className="text-indigo-400 font-semibold">{formatTime(project.currentTime)}</span>
            <span className="text-neutral-500 mx-1">/</span>
            <span>{formatTime(totalDuration)}</span>
          </div>

          <div className="h-4 w-px bg-neutral-800 mx-1" />
          <button
            id="player-fullscreen-btn"
            onClick={toggleFullscreen}
            className="p-1.5 text-neutral-400 hover:text-white rounded-full transition"
            title="Toggle Fullscreen"
          >
            <Maximize className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

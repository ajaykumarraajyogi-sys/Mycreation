import { ProjectState, VideoClip, TextOverlay, Subtitle } from '../types';
import { getClipEffectiveDuration, findClipAtTime, getTotalTimelineDuration } from './timeFormat';
import { getFilterCss } from './filterStyles';

export interface ExportProgress {
  progress: number; // 0 to 1
  currentTime: number;
  totalTime: number;
  stage: 'preparing' | 'rendering' | 'encoding' | 'completed' | 'error';
  errorMessage?: string;
}

export interface ExportResult {
  blob: Blob;
  url: string;
  filename: string;
}

export class VideoExporter {
  private isCancelled = false;

  public cancel() {
    this.isCancelled = true;
  }

  public async exportProject(
    project: ProjectState,
    onProgress: (status: ExportProgress) => void
  ): Promise<ExportResult> {
    this.isCancelled = false;
    const totalDuration = getTotalTimelineDuration(project.clips);

    if (project.clips.length === 0 || totalDuration <= 0) {
      throw new Error('Cannot export empty project. Please add at least one video clip.');
    }

    onProgress({
      progress: 0.05,
      currentTime: 0,
      totalTime: totalDuration,
      stage: 'preparing',
    });

    // Determine target canvas resolution
    let targetWidth = 1280;
    let targetHeight = 720;

    if (project.aspectRatio === '9:16') {
      targetWidth = 720;
      targetHeight = 1280;
    } else if (project.aspectRatio === '1:1') {
      targetWidth = 720;
      targetHeight = 720;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d', { alpha: false })!;

    // Create stream from canvas
    const canvasStream = canvas.captureStream(30);

    // Audio setup with Web Audio API
    let audioContext: AudioContext | null = null;
    let audioDest: MediaStreamAudioDestinationNode | null = null;
    let mixedStream = canvasStream;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioCtx();
      audioDest = audioContext.createMediaStreamDestination();

      // Combine video stream and audio destination
      const combinedStream = new MediaStream();
      canvasStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
      audioDest.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));
      mixedStream = combinedStream;
    } catch (e) {
      console.warn('AudioContext creation fallback for export:', e);
    }

    // Determine recorder MIME type
    let mimeType = 'video/webm;codecs=vp9,opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/mp4';
      }
    }

    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(mixedStream, {
        mimeType,
        videoBitsPerSecond: 4_000_000, // 4 Mbps high quality
      });
    } catch {
      mediaRecorder = new MediaRecorder(mixedStream);
    }

    const recordedChunks: Blob[] = [];
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };

    // Preload video elements for all clips
    const videoElements: Map<string, HTMLVideoElement> = new Map();
    for (const clip of project.clips) {
      const v = document.createElement('video');
      v.crossOrigin = 'anonymous';
      v.src = clip.url;
      v.muted = clip.isMuted;
      v.playsInline = true;
      v.preload = 'auto';
      await new Promise<void>((resolve) => {
        const onLoaded = () => {
          v.removeEventListener('loadeddata', onLoaded);
          v.removeEventListener('error', onError);
          resolve();
        };
        const onError = () => {
          v.removeEventListener('loadeddata', onLoaded);
          v.removeEventListener('error', onError);
          resolve(); // continue even if warning
        };
        v.addEventListener('loadeddata', onLoaded);
        v.addEventListener('error', onError);
        v.load();
      });
      videoElements.set(clip.id, v);
    }

    // Background audio element if present
    let bgAudioEl: HTMLAudioElement | null = null;
    if (project.backgroundAudio && !project.backgroundAudio.isMuted) {
      try {
        bgAudioEl = document.createElement('audio');
        bgAudioEl.crossOrigin = 'anonymous';
        bgAudioEl.src = project.backgroundAudio.url;
        bgAudioEl.volume = Math.min(1, (project.backgroundAudio.volume || 100) / 100);
        bgAudioEl.loop = true;
        bgAudioEl.preload = 'auto';
      } catch (e) {
        console.warn('Could not load background audio:', e);
      }
    }

    return new Promise((resolve, reject) => {
      mediaRecorder.onstop = () => {
        try {
          if (audioContext && audioContext.state !== 'closed') {
            audioContext.close().catch(() => {});
          }
          if (bgAudioEl) {
            bgAudioEl.pause();
          }
          // Stop media tracks
          mixedStream.getTracks().forEach((t) => t.stop());
        } catch {
          // ignore
        }

        if (this.isCancelled) {
          reject(new Error('Export was cancelled by the user.'));
          return;
        }

        const actualMime = recordedChunks[0]?.type || mimeType || 'video/webm';
        const blob = new Blob(recordedChunks, { type: actualMime });
        const url = URL.createObjectURL(blob);
        const ext = actualMime.includes('mp4') ? 'mp4' : 'webm';
        const cleanName = project.projectName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'video';
        const filename = `${cleanName}_${project.aspectRatio.replace(':', 'x')}.${ext}`;

        onProgress({
          progress: 1,
          currentTime: totalDuration,
          totalTime: totalDuration,
          stage: 'completed',
        });

        resolve({ blob, url, filename });
      };

      mediaRecorder.onerror = (err) => {
        reject(err);
      };

      mediaRecorder.start(100); // collect in 100ms chunks

      const fps = 30;
      const frameInterval = 1 / fps;
      let currentTimelineTime = 0;

      const filterCss = getFilterCss(project.filter);

      const renderNextFrame = async () => {
        if (this.isCancelled) {
          mediaRecorder.stop();
          return;
        }

        if (currentTimelineTime >= totalDuration) {
          onProgress({
            progress: 0.98,
            currentTime: totalDuration,
            totalTime: totalDuration,
            stage: 'encoding',
          });
          setTimeout(() => {
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
          }, 300);
          return;
        }

        const mapping = findClipAtTime(project.clips, currentTimelineTime);
        if (mapping) {
          const video = videoElements.get(mapping.clip.id);
          if (video) {
            // Seek video element
            const seekPromise = new Promise<void>((res) => {
              const onSeeked = () => {
                video.removeEventListener('seeked', onSeeked);
                res();
              };
              video.addEventListener('seeked', onSeeked);
              video.currentTime = mapping.clipInternalTime;
            });

            // If seek takes too long, fallback timeout
            await Promise.race([
              seekPromise,
              new Promise((res) => setTimeout(res, 80)),
            ]);

            // Clear canvas
            ctx.fillStyle = '#0a0a0c';
            ctx.fillRect(0, 0, targetWidth, targetHeight);

            // Draw video with filter and aspect ratio fit
            ctx.save();
            ctx.filter = filterCss;

            // Calculate scaling to fill or fit
            const vWidth = video.videoWidth || 640;
            const vHeight = video.videoHeight || 360;
            const hRatio = targetWidth / vWidth;
            const vRatio = targetHeight / vHeight;
            const ratio = Math.max(hRatio, vRatio); // center crop fill for cinematic look

            const drawWidth = vWidth * ratio;
            const drawHeight = vHeight * ratio;
            const shiftX = (targetWidth - drawWidth) / 2;
            const shiftY = (targetHeight - drawHeight) / 2;

            ctx.drawImage(video, shiftX, shiftY, drawWidth, drawHeight);
            ctx.restore();
          }
        } else {
          ctx.fillStyle = '#0a0a0c';
          ctx.fillRect(0, 0, targetWidth, targetHeight);
        }

        // Draw Text Overlays
        drawTextOverlays(ctx, project.textOverlays, currentTimelineTime, targetWidth, targetHeight);

        // Draw Subtitles
        drawSubtitles(ctx, project.subtitles, currentTimelineTime, targetWidth, targetHeight);

        currentTimelineTime += frameInterval;

        const progressVal = Math.min(0.95, currentTimelineTime / totalDuration);
        onProgress({
          progress: progressVal,
          currentTime: currentTimelineTime,
          totalTime: totalDuration,
          stage: 'rendering',
        });

        // Request next frame
        setTimeout(renderNextFrame, 16);
      };

      renderNextFrame();
    });
  }
}

function drawTextOverlays(
  ctx: CanvasRenderingContext2D,
  overlays: TextOverlay[],
  time: number,
  canvasWidth: number,
  canvasHeight: number
) {
  for (const overlay of overlays) {
    if (time >= overlay.startTime && time <= overlay.endTime) {
      ctx.save();
      const scale = canvasWidth / 720;
      const fontSize = Math.round(overlay.fontSize * scale);
      ctx.font = `${overlay.fontWeight === 'bold' ? 'bold ' : ''}${fontSize}px 'Inter', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const x = (overlay.x / 100) * canvasWidth;
      const y = (overlay.y / 100) * canvasHeight;

      const metrics = ctx.measureText(overlay.text);
      const textWidth = metrics.width;
      const paddingX = 14 * scale;
      const paddingY = 8 * scale;

      // Draw background pill if configured
      if (overlay.backgroundColor && overlay.backgroundColor !== 'transparent') {
        ctx.fillStyle = overlay.backgroundColor;
        const bgX = x - textWidth / 2 - paddingX;
        const bgY = y - fontSize / 2 - paddingY;
        const bgW = textWidth + paddingX * 2;
        const bgH = fontSize + paddingY * 2;
        const radius = 6 * scale;

        ctx.beginPath();
        ctx.roundRect(bgX, bgY, bgW, bgH, radius);
        ctx.fill();
      } else {
        // Shadow for readability
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 8 * scale;
      }

      ctx.fillStyle = overlay.color;
      ctx.fillText(overlay.text, x, y);
      ctx.restore();
    }
  }
}

function drawSubtitles(
  ctx: CanvasRenderingContext2D,
  subtitles: Subtitle[],
  time: number,
  canvasWidth: number,
  canvasHeight: number
) {
  const activeSub = subtitles.find((s) => time >= s.startTime && time <= s.endTime);
  if (!activeSub) return;

  ctx.save();
  const scale = canvasWidth / 720;
  const fontSize = Math.round(22 * scale);
  ctx.font = `bold ${fontSize}px 'Inter', sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const x = canvasWidth / 2;
  const y = canvasHeight - 80 * scale;

  const metrics = ctx.measureText(activeSub.text);
  const textWidth = metrics.width;
  const paddingX = 18 * scale;
  const paddingY = 9 * scale;

  // Dark translucent background pill
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  const bgX = x - textWidth / 2 - paddingX;
  const bgY = y - fontSize / 2 - paddingY;
  const bgW = textWidth + paddingX * 2;
  const bgH = fontSize + paddingY * 2;
  const radius = 8 * scale;

  ctx.beginPath();
  ctx.roundRect(bgX, bgY, bgW, bgH, radius);
  ctx.fill();

  // Highlight subtitle text in vibrant white or bright yellow
  ctx.fillStyle = '#ffffff';
  ctx.fillText(activeSub.text, x, y);
  ctx.restore();
}

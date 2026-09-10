import { VideoClip } from '../types';

/**
 * Formats seconds into MM:SS.SS format
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const hundredths = Math.floor((seconds % 1) * 100);

  const mStr = mins.toString().padStart(2, '0');
  const sStr = secs.toString().padStart(2, '0');
  const hStr = hundredths.toString().padStart(2, '0');

  return `${mStr}:${sStr}.${hStr}`;
}

/**
 * Formats seconds into simple MM:SS or SS.S
 */
export function formatShortTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(1);
  if (mins > 0) {
    const sInt = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${mins}:${sInt}s`;
  }
  return `${secs}s`;
}

/**
 * Calculates effective playback duration of a single clip taking trim and speed into account.
 */
export function getClipEffectiveDuration(clip: VideoClip): number {
  const rawDuration = Math.max(0, clip.trimEnd - clip.trimStart);
  const speed = clip.speed || 1;
  return rawDuration / speed;
}

/**
 * Calculates total duration across all clips in timeline.
 */
export function getTotalTimelineDuration(clips: VideoClip[]): number {
  return clips.reduce((acc, clip) => acc + getClipEffectiveDuration(clip), 0);
}

/**
 * Maps a global timeline time (seconds) to the specific active clip and its internal source video time.
 */
export interface ClipTimelineMapping {
  clip: VideoClip;
  clipIndex: number;
  clipTimelineStart: number;
  clipTimelineEnd: number;
  clipInternalTime: number;
}

export function findClipAtTime(
  clips: VideoClip[],
  globalTime: number
): ClipTimelineMapping | null {
  let accumulatedTime = 0;

  for (let i = 0; i < clips.length; i++) {
    const clip = clips[i];
    const effectiveDuration = getClipEffectiveDuration(clip);
    const clipEnd = accumulatedTime + effectiveDuration;

    // If globalTime falls within this clip, or is right at the end of the last clip
    if (globalTime >= accumulatedTime && (globalTime < clipEnd || i === clips.length - 1)) {
      const offsetWithinClip = Math.max(0, globalTime - accumulatedTime);
      const internalTime = clip.trimStart + offsetWithinClip * clip.speed;

      return {
        clip,
        clipIndex: i,
        clipTimelineStart: accumulatedTime,
        clipTimelineEnd: clipEnd,
        clipInternalTime: Math.min(clip.trimEnd, internalTime),
      };
    }

    accumulatedTime = clipEnd;
  }

  return null;
}

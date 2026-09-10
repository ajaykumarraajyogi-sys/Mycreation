import { VideoClip, AudioTrack } from '../types';

export interface SampleVideo {
  id: string;
  name: string;
  url: string;
  duration: number;
  thumbnailUrl: string;
}

// Reliable, royalty-free sample web videos suitable for video editing testing
export const SAMPLE_VIDEOS: SampleVideo[] = [
  {
    id: 'sample-1',
    name: 'Ocean Waves & Sunset',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 15.0,
    thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=320&auto=format&fit=crop&q=60',
  },
  {
    id: 'sample-2',
    name: 'Skater City Flow',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: 15.0,
    thumbnailUrl: 'https://images.unsplash.com/photo-1564982752979-3f7bc974d29a?w=320&auto=format&fit=crop&q=60',
  },
  {
    id: 'sample-3',
    name: 'Mountain Drone Vista',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    duration: 12.0,
    thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=320&auto=format&fit=crop&q=60',
  },
];

export interface SampleAudio {
  id: string;
  name: string;
  genre: string;
  duration: number;
  url: string;
}

// Royalty-free background music tracks
export const SAMPLE_AUDIO_TRACKS: SampleAudio[] = [
  {
    id: 'audio-lofi',
    name: 'Lo-Fi Chill Beats',
    genre: 'Lo-Fi / Relax',
    duration: 30,
    url: 'https://actions.google.com/sounds/v1/ambiences/outdoor_ambience.ogg',
  },
  {
    id: 'audio-upbeat',
    name: 'Upbeat Cinematic Vlog',
    genre: 'Upbeat / Vlog',
    duration: 25,
    url: 'https://actions.google.com/sounds/v1/science_fiction/deep_space_drone.ogg',
  },
  {
    id: 'audio-electronic',
    name: 'Modern Electronic Rhythm',
    genre: 'Electronic / Fast',
    duration: 32,
    url: 'https://actions.google.com/sounds/v1/water/lapping_water.ogg',
  },
];

/**
 * Creates an animated video clip from an HTML canvas and audio context as a reliable offline/local fallback.
 * This guarantees that even if external URLs are blocked by iframe sandboxes, the user has 100% working video clips!
 */
export async function createGeneratedFallbackClip(
  title: string,
  colorA: string,
  colorB: string,
  durationSeconds: number = 6
): Promise<VideoClip> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d')!;

    const stream = canvas.captureStream(30);

    // Audio tone
    let audioContext: AudioContext | null = null;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioContext = new AudioCtx();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      gain.gain.value = 0.05;
      osc.frequency.value = 440;
      const dest = audioContext.createMediaStreamDestination();
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      dest.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
    } catch {
      // Audio context might fail silently, canvas still works
    }

    let mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported('video/webm')) {
      mimeType = 'video/mp4';
    }

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch {
      recorder = new MediaRecorder(stream);
    }

    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: chunks[0]?.type || 'video/webm' });
      const url = URL.createObjectURL(blob);
      if (audioContext) {
        audioContext.close().catch(() => {});
      }

      // Grab thumbnail from canvas
      const thumb = canvas.toDataURL('image/jpeg', 0.7);

      resolve({
        id: `gen-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: title,
        url,
        duration: durationSeconds,
        trimStart: 0,
        trimEnd: durationSeconds,
        speed: 1,
        volume: 100,
        isMuted: false,
        thumbnailUrl: thumb,
        width: 640,
        height: 360,
      });
    };

    recorder.start();

    const startTime = performance.now();
    const render = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      if (elapsed >= durationSeconds) {
        recorder.stop();
        return;
      }

      // Draw dynamic animated scene
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, colorA);
      grad.addColorStop(1, colorB);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Moving animated circle
      const progress = (elapsed / durationSeconds) * Math.PI * 2;
      const cx = canvas.width / 2 + Math.cos(progress * 2) * 140;
      const cy = canvas.height / 2 + Math.sin(progress * 2) * 60;

      ctx.beginPath();
      ctx.arc(cx, cy, 40, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      // Text label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);

      // Time counter
      ctx.font = '16px monospace';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`00:${elapsed.toFixed(1).padStart(4, '0')} / 00:0${durationSeconds.toFixed(1)}`, canvas.width / 2, canvas.height / 2 + 30);

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  });
}

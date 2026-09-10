/**
 * Extracts a thumbnail image URL (data URI) from a video file or blob URL.
 */
export async function generateThumbnailFromVideoUrl(
  videoUrl: string,
  timeInSeconds: number = 0.5
): Promise<string> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve('');
      }
    }, 5000);

    video.onloadedmetadata = () => {
      const seekTime = Math.min(timeInSeconds, Math.max(0, video.duration / 2));
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      if (resolved) return;
      try {
        const canvas = document.createElement('canvas');
        const aspect = (video.videoWidth || 16) / (video.videoHeight || 9);
        canvas.width = 160;
        canvas.height = Math.round(160 / aspect);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.65);
          resolved = true;
          clearTimeout(timeout);
          resolve(dataUrl);
          return;
        }
      } catch (err) {
        console.warn('Could not extract video thumbnail:', err);
      }
      resolved = true;
      clearTimeout(timeout);
      resolve('');
    };

    video.onerror = () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        resolve('');
      }
    };
  });
}

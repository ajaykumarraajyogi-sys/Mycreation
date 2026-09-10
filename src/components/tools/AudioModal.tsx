import React, { useRef } from 'react';
import { X, Music, Volume2, VolumeX, Upload, Play, Check, Trash2 } from 'lucide-react';
import { AudioTrack, VideoClip } from '../../types';
import { SAMPLE_AUDIO_TRACKS } from '../../data/sampleClips';

interface AudioModalProps {
  selectedClip: VideoClip | null;
  backgroundAudio: AudioTrack | null;
  onClose: () => void;
  onUpdateClipAudio: (clipId: string, volume: number, isMuted: boolean) => void;
  onSetBackgroundAudio: (audio: AudioTrack | null) => void;
  onUpdateBackgroundAudioVolume: (volume: number, isMuted: boolean) => void;
}

export const AudioModal: React.FC<AudioModalProps> = ({
  selectedClip,
  backgroundAudio,
  onClose,
  onUpdateClipAudio,
  onSetBackgroundAudio,
  onUpdateBackgroundAudioVolume,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const audioObj = new Audio(url);
    audioObj.onloadedmetadata = () => {
      onSetBackgroundAudio({
        id: `audio-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        url,
        duration: audioObj.duration || 30,
        volume: 80,
        isMuted: false,
      });
    };
  };

  const handleSelectPresetAudio = (preset: typeof SAMPLE_AUDIO_TRACKS[0]) => {
    onSetBackgroundAudio({
      id: preset.id,
      name: preset.name,
      url: preset.url,
      duration: preset.duration,
      volume: 80,
      isMuted: false,
    });
  };

  return (
    <div className="bg-neutral-900 border-t border-neutral-800 p-4 shadow-2xl z-30 select-none animate-in slide-in-from-bottom duration-200">
      <div className="max-w-md mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2 text-neutral-100 font-semibold text-sm">
            <Music className="w-4 h-4 text-pink-400" />
            <span>Audio & Sound Mixer</span>
          </div>
          <button
            id="audio-close-btn"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-md hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Video Clip Audio (Original Audio) */}
        {selectedClip && (
          <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-200 font-medium truncate max-w-[200px]">
                Original Video Audio ({selectedClip.name})
              </span>
              <button
                id="audio-mute-clip-btn"
                onClick={() => onUpdateClipAudio(selectedClip.id, selectedClip.volume, !selectedClip.isMuted)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition ${
                  selectedClip.isMuted
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                }`}
              >
                {selectedClip.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                <span>{selectedClip.isMuted ? 'Muted' : 'Mute Audio'}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="200"
                disabled={selectedClip.isMuted}
                value={selectedClip.isMuted ? 0 : selectedClip.volume}
                onChange={(e) => onUpdateClipAudio(selectedClip.id, parseInt(e.target.value), false)}
                className="flex-1 accent-indigo-500 cursor-pointer disabled:opacity-40"
              />
              <span className="text-xs font-mono text-neutral-400 w-10 text-right">
                {selectedClip.isMuted ? '0%' : `${selectedClip.volume}%`}
              </span>
            </div>
          </div>
        )}

        {/* Section 2: Background Music */}
        <div className="bg-neutral-950/70 p-3 rounded-xl border border-neutral-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-neutral-200 font-medium">
              <Music className="w-3.5 h-3.5 text-pink-400" />
              <span>Background Music</span>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleCustomAudioUpload}
                className="hidden"
              />
              <button
                id="audio-upload-custom-btn"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium rounded-md transition"
              >
                <Upload className="w-3 h-3" />
                <span>Upload Audio</span>
              </button>

              {backgroundAudio && (
                <button
                  id="audio-remove-bg-btn"
                  onClick={() => onSetBackgroundAudio(null)}
                  className="p-1 text-neutral-500 hover:text-red-400 rounded transition"
                  title="Remove background music"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Active Background Audio Volume */}
          {backgroundAudio ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-xs text-pink-200 bg-pink-950/40 border border-pink-800/40 p-2 rounded-lg">
                <span className="font-semibold truncate">{backgroundAudio.name}</span>
                <button
                  onClick={() =>
                    onUpdateBackgroundAudioVolume(backgroundAudio.volume, !backgroundAudio.isMuted)
                  }
                  className="text-neutral-400 hover:text-white"
                >
                  {backgroundAudio.isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5 text-pink-300" />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="200"
                  disabled={backgroundAudio.isMuted}
                  value={backgroundAudio.isMuted ? 0 : backgroundAudio.volume}
                  onChange={(e) =>
                    onUpdateBackgroundAudioVolume(parseInt(e.target.value), false)
                  }
                  className="flex-1 accent-pink-500 cursor-pointer disabled:opacity-40"
                />
                <span className="text-xs font-mono text-neutral-400 w-10 text-right">
                  {backgroundAudio.isMuted ? '0%' : `${backgroundAudio.volume}%`}
                </span>
              </div>
            </div>
          ) : (
            /* Presets Library */
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-neutral-400 font-medium block">
                Or pick a royalty-free music preset:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {SAMPLE_AUDIO_TRACKS.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => handleSelectPresetAudio(track)}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-pink-500/40 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-pink-950/60 text-pink-400 flex items-center justify-center">
                        <Music className="w-3 h-3" />
                      </div>
                      <div>
                        <span className="text-xs font-medium text-neutral-200 block group-hover:text-pink-300 transition">
                          {track.name}
                        </span>
                        <span className="text-[10px] text-neutral-500">{track.genre}</span>
                      </div>
                    </div>

                    <button className="px-2 py-0.5 bg-pink-600/20 text-pink-300 text-[10px] font-semibold rounded hover:bg-pink-600/30">
                      Use Track
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-1">
          <button
            id="audio-done-btn"
            onClick={onClose}
            className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 font-medium text-xs rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

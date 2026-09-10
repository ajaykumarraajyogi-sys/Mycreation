export type AspectRatio = '9:16' | '16:9' | '1:1';

export type FilterType =
  | 'none'
  | 'cinematic'
  | 'warm'
  | 'cool'
  | 'vintage'
  | 'monochrome'
  | 'vivid'
  | 'cyberpunk';

export interface VideoClip {
  id: string;
  name: string;
  url: string;
  duration: number; // Native duration in seconds
  trimStart: number; // Trim in-point (seconds)
  trimEnd: number; // Trim out-point (seconds)
  speed: number; // 0.5, 1, 1.5, 2
  volume: number; // 0 to 200 (100 = default)
  isMuted: boolean;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
}

export interface TextOverlay {
  id: string;
  text: string;
  startTime: number; // Project timeline time (seconds)
  endTime: number; // Project timeline time (seconds)
  x: number; // Percentage 0 - 100
  y: number; // Percentage 0 - 100
  fontSize: number; // e.g. 24
  color: string;
  backgroundColor: string; // e.g. 'rgba(0,0,0,0.6)'
  fontWeight: 'normal' | 'bold' | '900';
}

export interface Subtitle {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface AudioTrack {
  id: string;
  name: string;
  url: string;
  duration: number;
  volume: number; // 0 to 200
  isMuted: boolean;
}

export interface ProjectState {
  projectName: string;
  aspectRatio: AspectRatio;
  filter: FilterType;
  clips: VideoClip[];
  selectedClipId: string | null;
  textOverlays: TextOverlay[];
  subtitles: Subtitle[];
  backgroundAudio: AudioTrack | null;
  currentTime: number; // Current playback time on global timeline
  isPlaying: boolean;
}

export interface AiAction {
  type:
    | 'setAspectRatio'
    | 'setFilter'
    | 'addCaptions'
    | 'addTextOverlay'
    | 'setClipSpeed'
    | 'trimClip'
    | 'adjustDuration';
  aspectRatio?: AspectRatio;
  filter?: FilterType;
  captions?: Array<{ text: string; startTime: number; endTime: number }>;
  text?: string;
  startTime?: number;
  endTime?: number;
  color?: string;
  fontSize?: number;
  y?: number;
  clipIndex?: number;
  speed?: number;
  trimStart?: number;
  trimEnd?: number;
  targetSeconds?: number;
}

export interface AiAssistantResponse {
  message: string;
  suggestedTitle?: string;
  suggestedDescription?: string;
  suggestedHashtags?: string[];
  actions?: AiAction[];
}

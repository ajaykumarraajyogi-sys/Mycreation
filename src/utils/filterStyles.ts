import { FilterType } from '../types';

export function getFilterCss(filter: FilterType): string {
  switch (filter) {
    case 'cinematic':
      return 'contrast(1.2) saturate(1.2) sepia(0.15) hue-rotate(-10deg)';
    case 'warm':
      return 'sepia(0.25) saturate(1.3) brightness(1.05)';
    case 'cool':
      return 'hue-rotate(25deg) saturate(1.1) contrast(1.05)';
    case 'vintage':
      return 'sepia(0.55) contrast(0.95) saturate(0.85) brightness(1.05)';
    case 'monochrome':
      return 'grayscale(1) contrast(1.25)';
    case 'vivid':
      return 'saturate(1.7) contrast(1.15) brightness(1.02)';
    case 'cyberpunk':
      return 'hue-rotate(185deg) saturate(1.5) contrast(1.25)';
    default:
      return 'none';
  }
}

export interface FilterOption {
  id: FilterType;
  label: string;
  previewColor: string;
}

export const FILTER_OPTIONS: FilterOption[] = [
  { id: 'none', label: 'Normal', previewColor: '#64748b' },
  { id: 'cinematic', label: 'Cinematic', previewColor: '#d97706' },
  { id: 'warm', label: 'Warm Glow', previewColor: '#ea580c' },
  { id: 'cool', label: 'Cool Dusk', previewColor: '#0284c7' },
  { id: 'vintage', label: 'Vintage', previewColor: '#a16207' },
  { id: 'monochrome', label: 'B&W Mono', previewColor: '#475569' },
  { id: 'vivid', label: 'Vivid Pop', previewColor: '#ec4899' },
  { id: 'cyberpunk', label: 'Cyberpunk', previewColor: '#8b5cf6' },
];

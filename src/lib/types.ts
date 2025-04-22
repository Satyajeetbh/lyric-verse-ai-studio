
export interface LyricLine {
  id: string;
  text: string;
  startTime: number; // in milliseconds
  endTime: number; // in milliseconds
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  audioFile: File | null;
  audioUrl: string;
  lyrics: LyricLine[];
}

export interface ThemeOption {
  id: string;
  name: string;
  description: string;
  previewUrl: string;
  prompt: string;
}

export type VideoStatus = 'idle' | 'preparing' | 'processing' | 'ready' | 'error';

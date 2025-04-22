
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LyricLine } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Format time from milliseconds to MM:SS format
export function formatTime(timeMs: number): string {
  const totalSeconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Parse lyrics from text to LyricLine[] format
export function parseLyrics(lyricsText: string): LyricLine[] {
  const lines = lyricsText.split('\n').filter(line => line.trim() !== '');
  
  return lines.map((line, index) => ({
    id: `line-${index}`,
    text: line,
    startTime: 0,
    endTime: 0
  }));
}

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

// Calculate the estimated duration for each line based on word count
export function estimateLineDurations(lyrics: LyricLine[], totalDuration: number): LyricLine[] {
  const totalWords = lyrics.reduce((sum, line) => sum + line.text.split(/\s+/).length, 0);
  const msPerWord = totalDuration / totalWords;
  
  let currentTime = 0;
  return lyrics.map(line => {
    const wordCount = line.text.split(/\s+/).length;
    const duration = wordCount * msPerWord;
    
    const startTime = currentTime;
    currentTime += duration;
    
    return {
      ...line,
      startTime,
      endTime: currentTime
    };
  });
}

// Simple debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

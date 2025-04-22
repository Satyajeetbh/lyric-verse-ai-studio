
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

// Parse SRT time format (00:00:00,000) to milliseconds
export function parseSrtTime(timeString: string): number {
  try {
    // Handle both comma and period as decimal separators
    const sanitizedTimeString = timeString.replace(',', '.');
    
    // Split into hours, minutes, and seconds
    const [timeSegment] = sanitizedTimeString.split(' '); // In case there are spaces
    const [hours, minutes, secondsWithMs] = timeSegment.split(':');
    
    if (!hours || !minutes || !secondsWithMs) {
      console.error('Invalid SRT time format:', timeString);
      return 0;
    }
    
    // Split seconds and milliseconds
    const [secs, ms] = secondsWithMs.includes('.')
      ? secondsWithMs.split('.')
      : [secondsWithMs, '0'];
    
    // Convert everything to milliseconds
    return (
      parseInt(hours) * 3600000 +
      parseInt(minutes) * 60000 +
      parseInt(secs) * 1000 +
      parseInt(ms.padEnd(3, '0').substring(0, 3))
    );
  } catch (error) {
    console.error('Error parsing SRT time:', timeString, error);
    return 0;
  }
}

// Parse SRT file content to LyricLine[] format
export function parseSrtFile(srtContent: string): LyricLine[] {
  try {
    console.log('Starting SRT parse of content length:', srtContent.length);
    
    // Split the content by double newlines to get each subtitle block
    const blocks = srtContent.trim().split(/\r?\n\r?\n/);
    console.log('Found blocks:', blocks.length);
    
    return blocks
      .map((block, index) => {
        // Split each block into lines
        const lines = block.split(/\r?\n/);
        console.log(`Block ${index} has ${lines.length} lines`);
        
        // First line is the number, second line is the timing
        if (lines.length < 3) {
          console.log(`Skipping block ${index} - not enough lines`);
          return null;
        }
        
        // Find the timing line (usually the second line)
        const timingLineIndex = lines.findIndex(line => line.includes('-->'));
        if (timingLineIndex === -1) {
          console.log(`Skipping block ${index} - no timing found`);
          return null;
        }
        
        const timingLine = lines[timingLineIndex];
        const [startTime, endTime] = timingLine.split('-->').map(t => t.trim());
        
        // Get all lines after the timing line as the text content
        const textLines = lines.slice(timingLineIndex + 1);
        const text = textLines.join(' ').trim();
        
        if (!text) {
          console.log(`Skipping block ${index} - empty text`);
          return null;
        }
        
        console.log(`Parsed block ${index}: ${startTime} --> ${endTime}: "${text}"`);
        
        return {
          id: generateId(),
          text,
          startTime: parseSrtTime(startTime),
          endTime: parseSrtTime(endTime)
        };
      })
      .filter(line => line !== null) as LyricLine[];
  } catch (error) {
    console.error('Error parsing SRT file:', error);
    return [];
  }
}

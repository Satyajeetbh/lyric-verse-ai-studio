
import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { formatTime } from "@/lib/utils";
import { LyricLine } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  Clock
} from "lucide-react";

interface LyricsSynchronizerProps {
  audioUrl: string;
  lyrics: LyricLine[];
  onLyricsSync: (syncedLyrics: LyricLine[]) => void;
}

export function LyricsSynchronizer({
  audioUrl,
  lyrics,
  onLyricsSync,
}: LyricsSynchronizerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [syncedLyrics, setSyncedLyrics] = useState<LyricLine[]>(lyrics);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (waveformRef.current && audioUrl) {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }

      const wavesurfer = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: "#8B5CF6",
        progressColor: "#6d28d9",
        cursorColor: "#f5f5f5",
        barWidth: 2,
        barGap: 3,
        barRadius: 3,
        height: 80,
        cursorWidth: 1,
      });

      wavesurfer.load(audioUrl);

      wavesurfer.on("ready", () => {
        wavesurferRef.current = wavesurfer;
        setDuration(wavesurfer.getDuration() * 1000);
      });

      wavesurfer.on("play", () => {
        setIsPlaying(true);
      });

      wavesurfer.on("pause", () => {
        setIsPlaying(false);
      });

      wavesurfer.on("timeupdate", (time) => {
        const timeMs = time * 1000;
        setCurrentTime(timeMs);
        
        // Find active lyric
        const index = syncedLyrics.findIndex(
          (line) => timeMs >= line.startTime && timeMs <= line.endTime
        );
        
        if (index !== -1 && index !== activeLyricIndex) {
          setActiveLyricIndex(index);
          if (autoScrollEnabled && lyricsContainerRef.current) {
            const lyricEl = document.getElementById(`lyric-${index}`);
            if (lyricEl) {
              lyricEl.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }
        } else if (index === -1 && activeLyricIndex !== -1) {
          setActiveLyricIndex(-1);
        }
      });

      return () => {
        wavesurfer.destroy();
      };
    }
  }, [audioUrl]);

  // Play/Pause controls
  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    if (wavesurferRef.current) {
      const currentSec = wavesurferRef.current.getCurrentTime();
      wavesurferRef.current.seekTo(
        (currentSec + seconds) / wavesurferRef.current.getDuration()
      );
    }
  };

  // Set start time for lyric
  const setLyricStartTime = (index: number) => {
    const updatedLyrics = [...syncedLyrics];
    updatedLyrics[index] = {
      ...updatedLyrics[index],
      startTime: currentTime,
    };
    
    // Update the end time of the previous lyric
    if (index > 0) {
      updatedLyrics[index - 1] = {
        ...updatedLyrics[index - 1],
        endTime: currentTime,
      };
    }
    
    setSyncedLyrics(updatedLyrics);
    onLyricsSync(updatedLyrics);
    
    // Auto advance to next lyric if available
    if (index < syncedLyrics.length - 1) {
      setActiveLyricIndex(index + 1);
    }
  };

  // Set end time for last lyric
  const finalizeSync = () => {
    const updatedLyrics = [...syncedLyrics];
    const lastIndex = updatedLyrics.length - 1;
    
    updatedLyrics[lastIndex] = {
      ...updatedLyrics[lastIndex],
      endTime: currentTime,
    };
    
    setSyncedLyrics(updatedLyrics);
    onLyricsSync(updatedLyrics);
  };

  // Auto-sync based on word count and duration
  const autoSync = () => {
    if (duration === 0) return;
    
    const totalWords = syncedLyrics.reduce(
      (sum, line) => sum + line.text.split(/\s+/).length, 
      0
    );
    
    const msPerWord = duration / totalWords;
    
    let currentMs = 0;
    const updatedLyrics = syncedLyrics.map((line) => {
      const wordCount = line.text.split(/\s+/).length;
      const lineDuration = wordCount * msPerWord;
      
      const startTime = currentMs;
      currentMs += lineDuration;
      
      return {
        ...line,
        startTime,
        endTime: currentMs,
      };
    });
    
    setSyncedLyrics(updatedLyrics);
    onLyricsSync(updatedLyrics);
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="bg-secondary/30 p-4 rounded-lg">
        <div ref={waveformRef} className="mb-4" />
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm">{formatTime(currentTime)}</span>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => skip(-5)}
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="default" 
              size="icon" 
              onClick={togglePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => skip(5)}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
          
          <span className="text-sm">{formatTime(duration)}</span>
        </div>
        
        <Slider
          value={[currentTime]}
          max={duration}
          step={100}
          onValueChange={(value) => {
            if (wavesurferRef.current) {
              wavesurferRef.current.seekTo(value[0] / duration);
            }
          }}
          className="mt-2"
        />
      </div>
      
      <div className="flex space-x-2 mb-4">
        <Button variant="outline" onClick={autoSync} className="flex-1">
          <Clock className="h-4 w-4 mr-2" />
          Auto-Sync Lyrics
        </Button>
        
        <Button variant="outline" onClick={finalizeSync} className="flex-1">
          Finalize Timing
        </Button>
      </div>
      
      <div 
        className="h-80 overflow-y-auto bg-secondary/30 rounded-lg p-4"
        ref={lyricsContainerRef}
      >
        {syncedLyrics.map((line, index) => (
          <div
            key={line.id}
            id={`lyric-${index}`}
            className={`p-3 mb-2 rounded-lg transition-colors ${
              index === activeLyricIndex
                ? "bg-primary/20 border border-primary/50"
                : "bg-secondary hover:bg-secondary/70"
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted-foreground">
                {formatTime(line.startTime)} - {formatTime(line.endTime)}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLyricStartTime(index)}
                className="h-6 text-xs"
              >
                Mark Timing
              </Button>
            </div>
            
            <p className="text-sm">{line.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

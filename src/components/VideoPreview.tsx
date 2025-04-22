
import { useRef, useEffect, useState } from "react";
import { LyricLine } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack,
  Download,
  RefreshCw,
} from "lucide-react";

interface VideoPreviewProps {
  backgroundUrl: string;
  audioUrl: string;
  lyrics: LyricLine[];
  onDownload: () => void;
  onRegenerate: () => void;
  isProcessing: boolean;
}

export function VideoPreview({
  backgroundUrl,
  audioUrl,
  lyrics,
  onDownload,
  onRegenerate,
  isProcessing,
}: VideoPreviewProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime * 1000);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
      updateAnimation();
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };

    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);

    return () => {
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Animation loop for smoother lyric transitions
  const updateAnimation = () => {
    if (audioRef.current) {
      const currentMs = audioRef.current.currentTime * 1000;
      
      // Find active lyric
      const index = lyrics.findIndex(
        (line) => currentMs >= line.startTime && currentMs <= line.endTime
      );
      
      if (index !== -1 && index !== activeLyricIndex) {
        setActiveLyricIndex(index);
      } else if (index === -1 && activeLyricIndex !== -1) {
        setActiveLyricIndex(-1);
      }
      
      animationRef.current = requestAnimationFrame(updateAnimation);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const skip = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime += seconds;
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div
        ref={videoRef}
        className="relative w-full aspect-video rounded-lg overflow-hidden bg-black shadow-xl"
      >
        {/* Dynamic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/60 z-10" />
        
        {/* Background with Ken Burns effect */}
        {backgroundUrl && (
          <img
            src={backgroundUrl}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover z-0 animate-ken-burns"
            style={{
              animation: 'kenBurns 20s ease infinite alternate'
            }}
          />
        )}
        
        {/* Lyrics display */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          {activeLyricIndex !== -1 && (
            <div className="text-center px-8 py-6 backdrop-blur-sm rounded-lg max-w-2xl transform transition-all duration-300 scale-100 opacity-100">
              <p 
                className="text-3xl font-bold text-white drop-shadow-lg animate-fade-in"
                style={{ 
                  textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                  animation: 'textFloat 3s ease infinite'
                }}
              >
                {lyrics[activeLyricIndex].text}
              </p>
            </div>
          )}
        </div>
        
        <audio ref={audioRef} src={audioUrl} className="hidden" />
      </div>
      
      {/* Controls */}
      <div className="flex justify-between items-center bg-secondary/10 p-4 rounded-lg backdrop-blur-sm">
        <span className="text-sm font-medium">
          {formatTime(currentTime)} / {formatTime(lyrics[lyrics.length - 1]?.endTime || 0)}
        </span>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => skip(-5)}
            className="hover:scale-105 transition-transform"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="default" 
            size="icon" 
            onClick={togglePlayPause}
            className="hover:scale-105 transition-transform"
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
            className="hover:scale-105 transition-transform"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={onRegenerate}
            disabled={isProcessing}
            className="hover:scale-105 transition-transform"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          
          <Button 
            variant="default" 
            onClick={onDownload}
            disabled={isProcessing}
            className="hover:scale-105 transition-transform"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}

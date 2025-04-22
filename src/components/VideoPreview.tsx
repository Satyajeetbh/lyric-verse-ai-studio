
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
        className="relative w-full aspect-video rounded-lg overflow-hidden bg-black"
      >
        {backgroundUrl && (
          <img
            src={backgroundUrl}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        )}
        
        <div className="absolute inset-0 flex items-center justify-center z-10">
          {activeLyricIndex !== -1 && (
            <div className="text-center px-6 py-4 bg-black/50 backdrop-blur-sm rounded-lg max-w-2xl">
              <p 
                className="text-2xl font-bold text-white drop-shadow-lg"
                style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}
              >
                {lyrics[activeLyricIndex].text}
              </p>
            </div>
          )}
        </div>
        
        <audio ref={audioRef} src={audioUrl} className="hidden" />
      </div>
      
      <div className="flex justify-between items-center">
        <span className="text-sm">
          {formatTime(currentTime)} / {formatTime(lyrics[lyrics.length - 1]?.endTime || 0)}
        </span>
        
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={() => skip(-5)}>
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button variant="default" size="icon" onClick={togglePlayPause}>
            {isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
          
          <Button variant="outline" size="icon" onClick={() => skip(5)}>
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={onRegenerate}
            disabled={isProcessing}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Regenerate
          </Button>
          
          <Button 
            variant="default" 
            onClick={onDownload}
            disabled={isProcessing}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}

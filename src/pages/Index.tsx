
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { generateId } from "@/lib/utils";
import { generateBackground } from "@/lib/openai";
import { ffmpegService } from "@/lib/ffmpeg";
import { LyricLine, Song, ThemeOption, VideoStatus } from "@/lib/types";
import { themeOptions } from "@/lib/themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AudioUpload } from "@/components/AudioUpload";
import { LyricsInput } from "@/components/LyricsInput";
import { ThemeSelector } from "@/components/ThemeSelector";
import { LyricsSynchronizer } from "@/components/LyricsSynchronizer";
import { VideoPreview } from "@/components/VideoPreview";
import { Music, Sparkles, FileText, Clock, Play } from "lucide-react";

const Index = () => {
  // App state
  const [currentStep, setCurrentStep] = useState<string>("upload");
  const [song, setSong] = useState<Song>({
    id: generateId(),
    title: "",
    audioFile: null,
    audioUrl: "",
    lyrics: [],
  });
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption | null>(null);
  const [backgroundUrl, setBackgroundUrl] = useState<string>("");
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>("idle");
  const [videoUrl, setVideoUrl] = useState<string>("");

  // Handle audio upload
  const handleAudioUpload = (file: File) => {
    const audioUrl = URL.createObjectURL(file);
    setSong({
      ...song,
      audioFile: file,
      audioUrl,
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
    });
    toast.success("Audio uploaded successfully!");
  };

  // Handle lyrics submission
  const handleLyricsSubmit = (lyrics: LyricLine[]) => {
    setSong({
      ...song,
      lyrics,
    });
    setCurrentStep("sync");
    toast.success("Lyrics added successfully!");
  };

  // Handle lyrics synchronization
  const handleLyricsSync = (syncedLyrics: LyricLine[]) => {
    setSong({
      ...song,
      lyrics: syncedLyrics,
    });
  };

  // Handle theme selection
  const handleThemeSelect = (theme: ThemeOption) => {
    setSelectedTheme(theme);
  };

  // Generate background with AI
  const handleGenerateBackground = async (theme: ThemeOption) => {
    try {
      setIsGeneratingBackground(true);
      const imageUrl = await generateBackground(theme.prompt);
      setBackgroundUrl(imageUrl);
      toast.success("Background generated successfully!");
      
      if (currentStep === "theme") {
        setCurrentStep("preview");
      }
    } catch (error) {
      console.error("Error generating background:", error);
      toast.error("Failed to generate background");
    } finally {
      setIsGeneratingBackground(false);
    }
  };

  // Create and download video
  const handleDownloadVideo = async () => {
    if (!song.audioFile || !backgroundUrl || song.lyrics.length === 0) {
      toast.error("Missing required elements for video creation");
      return;
    }

    try {
      setVideoStatus("preparing");
      
      // Fetch the background image as a file
      const bgResponse = await fetch(backgroundUrl);
      const bgBlob = await bgResponse.blob();
      const bgFile = new File([bgBlob], "background.jpg", { type: "image/jpeg" });
      
      setVideoStatus("processing");
      
      // Load FFmpeg if not already loaded
      await ffmpegService.load();
      
      // Create the video
      const videoBlob = await ffmpegService.createLyricVideo(
        song.audioFile,
        bgFile,
        song.lyrics
      );
      
      // Create object URL for download
      const videoUrl = URL.createObjectURL(videoBlob);
      setVideoUrl(videoUrl);
      setVideoStatus("ready");
      
      // Trigger download
      const a = document.createElement("a");
      a.href = videoUrl;
      a.download = `${song.title || "lyrics-video"}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success("Video downloaded successfully!");
    } catch (error) {
      console.error("Error creating video:", error);
      setVideoStatus("error");
      toast.error("Failed to create video");
    }
  };

  // Regenerate the background
  const handleRegenerateBackground = async () => {
    if (selectedTheme) {
      await handleGenerateBackground(selectedTheme);
    }
  };

  // Clean up URLs on unmount
  useEffect(() => {
    return () => {
      if (song.audioUrl) {
        URL.revokeObjectURL(song.audioUrl);
      }
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [song.audioUrl, videoUrl]);

  // Load FFmpeg on mount
  useEffect(() => {
    ffmpegService.load().catch((error) => {
      console.error("Error loading FFmpeg:", error);
    });
  }, []);

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-theme-purple to-theme-pink bg-clip-text text-transparent">
            LyricVerse AI Studio
          </h1>
          <p className="text-muted-foreground mt-2">
            Create stunning lyrics videos with AI-generated visuals
          </p>
        </header>

        <Tabs value={currentStep} onValueChange={setCurrentStep} className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="upload" className="flex items-center">
              <Music className="w-4 h-4 mr-2" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="sync" disabled={!song.audioUrl || song.lyrics.length === 0} className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              <span>Sync Lyrics</span>
            </TabsTrigger>
            <TabsTrigger value="theme" disabled={!song.audioUrl || song.lyrics.length === 0} className="flex items-center">
              <Sparkles className="w-4 h-4 mr-2" />
              <span>Theme</span>
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={!backgroundUrl} className="flex items-center">
              <Play className="w-4 h-4 mr-2" />
              <span>Preview</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Upload Audio</h2>
                <AudioUpload
                  onAudioUpload={handleAudioUpload}
                  audioFile={song.audioFile}
                />
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-4">Enter Lyrics</h2>
                <LyricsInput onLyricsSubmit={handleLyricsSubmit} />
              </div>
            </div>
            
            {song.audioUrl && song.lyrics.length > 0 && (
              <div className="flex justify-center">
                <Button onClick={() => setCurrentStep("sync")}>
                  Continue to Sync Lyrics
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="sync">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Synchronize Lyrics with Audio</h2>
                <p className="text-muted-foreground mb-6">
                  Adjust when each lyric line should appear in the video. Click "Mark Timing" as each line should appear.
                </p>
                
                {song.audioUrl && song.lyrics.length > 0 && (
                  <LyricsSynchronizer
                    audioUrl={song.audioUrl}
                    lyrics={song.lyrics}
                    onLyricsSync={handleLyricsSync}
                  />
                )}
                
                <div className="flex justify-end mt-6">
                  <Button onClick={() => setCurrentStep("theme")}>
                    Continue to Theme Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="theme">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Select Visual Theme</h2>
                <p className="text-muted-foreground mb-6">
                  Choose a theme for your lyrics video, and we'll generate a custom background using AI.
                </p>
                
                <ThemeSelector
                  onThemeSelect={handleThemeSelect}
                  selectedTheme={selectedTheme}
                  onGenerateBackground={handleGenerateBackground}
                  isGenerating={isGeneratingBackground}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Preview Your Lyrics Video</h2>
                
                {backgroundUrl && song.audioUrl && song.lyrics.length > 0 && (
                  <VideoPreview
                    backgroundUrl={backgroundUrl}
                    audioUrl={song.audioUrl}
                    lyrics={song.lyrics}
                    onDownload={handleDownloadVideo}
                    onRegenerate={handleRegenerateBackground}
                    isProcessing={videoStatus === "preparing" || videoStatus === "processing"}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;


import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { parseLyrics, parseSrtFile } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { LyricLine } from "@/lib/types";
import { FileText, Upload } from "lucide-react";

interface LyricsInputProps {
  onLyricsSubmit: (lyrics: LyricLine[]) => void;
}

export function LyricsInput({ onLyricsSubmit }: LyricsInputProps) {
  const [lyricsText, setLyricsText] = useState<string>("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (file.name.toLowerCase().endsWith('.srt')) {
          // Parse SRT file and submit directly
          const parsedLyrics = parseSrtFile(content);
          onLyricsSubmit(parsedLyrics);
        } else {
          // Regular text file, show in textarea
          setLyricsText(content);
        }
      };
      reader.readAsText(file);
    }
  }, [onLyricsSubmit]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/x-subrip': ['.srt'],
    },
    multiple: false,
  });

  const handleSubmit = () => {
    if (lyricsText.trim()) {
      const parsedLyrics = parseLyrics(lyricsText);
      onLyricsSubmit(parsedLyrics);
    }
  };

  const loadSampleLyrics = () => {
    const sampleLyrics = 
`Verse 1
I've been walking through the city lights
Thinking about the way things used to be
Every corner holds a memory
Of the times we spent, just you and me

Chorus
But now you're gone, and I'm still here
Caught between the past and what's to come
The echoes of your voice still linger near
In this city where we once belonged

Verse 2
The coffee shop where we first met
Still serves the same blend that you liked
I pass by it almost every day
Remembering the spark in your eyes`;

    setLyricsText(sampleLyrics);
  };

  return (
    <Card className="bg-secondary/50">
      <CardContent className="p-6">
        <div className="flex flex-col space-y-4">
          <div {...getRootProps()} className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            {isDragActive ? (
              <p>Drop the lyrics file here...</p>
            ) : (
              <div className="space-y-2">
                <p>Drag and drop a lyrics file here, or click to select</p>
                <p className="text-sm text-muted-foreground">Supports .txt and .srt files</p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">
              Or Enter Lyrics Manually
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadSampleLyrics}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Load Sample
            </Button>
          </div>

          <Textarea
            placeholder="Paste your lyrics here..."
            className="h-64 resize-none font-mono text-sm bg-background/50"
            value={lyricsText}
            onChange={(e) => setLyricsText(e.target.value)}
          />
          
          <p className="text-xs text-muted-foreground">
            Tip: Upload an .srt file for automatic timing sync, or enter lyrics manually and sync them later.
          </p>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 py-4 border-t border-border/50 bg-background/10">
        <Button 
          className="w-full" 
          disabled={!lyricsText.trim()} 
          onClick={handleSubmit}
        >
          Continue with These Lyrics
        </Button>
      </CardFooter>
    </Card>
  );
}

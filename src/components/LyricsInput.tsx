
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { parseLyrics, parseSrtFile } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { LyricLine } from "@/lib/types";
import { FileText, Upload } from "lucide-react";
import { toast } from "sonner";

interface LyricsInputProps {
  onLyricsSubmit: (lyrics: LyricLine[]) => void;
}

export function LyricsInput({ onLyricsSubmit }: LyricsInputProps) {
  const [lyricsText, setLyricsText] = useState<string>("");
  const [isSrtFile, setIsSrtFile] = useState<boolean>(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        
        if (file.name.toLowerCase().endsWith('.srt')) {
          console.log('SRT file detected, content length:', content.length);
          setIsSrtFile(true);
          setLyricsText(content);
          
          try {
            // Parse SRT file and show preview
            const parsedLyrics = parseSrtFile(content);
            console.log('Parsed SRT lyrics:', parsedLyrics);
            
            if (parsedLyrics.length > 0) {
              toast.success(`Successfully parsed ${parsedLyrics.length} synchronized lyrics`);
            } else {
              toast.error("Failed to parse SRT file. Please check the format.");
            }
          } catch (error) {
            console.error('Error processing SRT file:', error);
            toast.error("Error processing SRT file");
          }
        } else {
          // Regular text file, show in textarea
          setIsSrtFile(false);
          setLyricsText(content);
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/x-subrip': ['.srt'],
      'text/srt': ['.srt'],  // Additional MIME type for SRT files
    },
    multiple: false,
  });

  const handleSubmit = () => {
    if (lyricsText.trim()) {
      try {
        const parsedLyrics = isSrtFile 
          ? parseSrtFile(lyricsText)
          : parseLyrics(lyricsText);
        
        console.log('Submitting lyrics:', parsedLyrics);
        
        if (parsedLyrics.length === 0) {
          toast.error("No lyrics could be parsed. Please check the format.");
          return;
        }
        
        onLyricsSubmit(parsedLyrics);
        toast.success(`Lyrics ${isSrtFile ? 'with timing' : ''} submitted successfully!`);
      } catch (error) {
        console.error('Error submitting lyrics:', error);
        toast.error("Error processing lyrics");
      }
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
    setIsSrtFile(false);
  };

  const loadSampleSRT = () => {
    const sampleSRT = 
`1
00:00:01,000 --> 00:00:05,000
Verse 1

2
00:00:06,000 --> 00:00:10,000
I've been walking through the city lights

3
00:00:11,000 --> 00:00:15,000
Thinking about the way things used to be

4
00:00:16,000 --> 00:00:20,000
Every corner holds a memory

5
00:00:21,000 --> 00:00:25,000
Of the times we spent, just you and me

6
00:00:26,000 --> 00:00:30,000
Chorus

7
00:00:31,000 --> 00:00:35,000
But now you're gone, and I'm still here

8
00:00:36,000 --> 00:00:40,000
Caught between the past and what's to come

9
00:00:41,000 --> 00:00:45,000
The echoes of your voice still linger near

10
00:00:46,000 --> 00:00:50,000
In this city where we once belonged`;

    setLyricsText(sampleSRT);
    setIsSrtFile(true);
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
              Or Enter Lyrics {isSrtFile ? '(SRT format detected)' : 'Manually'}
            </label>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadSampleLyrics}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Load Sample Lyrics
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={loadSampleSRT}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                Load Sample SRT
              </Button>
            </div>
          </div>

          <Textarea
            placeholder={isSrtFile ? "SRT format detected - timing info will be preserved" : "Paste your lyrics here..."}
            className="h-64 resize-none font-mono text-sm bg-background/50"
            value={lyricsText}
            onChange={(e) => {
              setLyricsText(e.target.value);
              // Try to detect if it's an SRT format based on content
              const isSrt = e.target.value.includes('-->') && /\d\d:\d\d:\d\d/.test(e.target.value);
              setIsSrtFile(isSrt);
            }}
          />
          
          <p className="text-xs text-muted-foreground">
            {isSrtFile 
              ? "SRT format detected! Timing information will be used to synchronize lyrics automatically."
              : "Tip: Upload an .srt file for automatic timing sync, or enter lyrics manually and sync them later."}
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

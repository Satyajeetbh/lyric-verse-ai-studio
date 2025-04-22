
import { useState } from "react";
import { parseLyrics } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { LyricLine } from "@/lib/types";

interface LyricsInputProps {
  onLyricsSubmit: (lyrics: LyricLine[]) => void;
}

export function LyricsInput({ onLyricsSubmit }: LyricsInputProps) {
  const [lyricsText, setLyricsText] = useState<string>("");

  const handleSubmit = () => {
    if (lyricsText.trim()) {
      const parsedLyrics = parseLyrics(lyricsText);
      onLyricsSubmit(parsedLyrics);
    }
  };

  // Sample lyrics for easy testing
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
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">
              Enter Lyrics
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
          <p className="text-xs text-muted-foreground mt-2">
            Tip: Separate lines clearly. You can use line breaks to organize verses and choruses.
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

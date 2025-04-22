
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Music } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AudioUploadProps {
  onAudioUpload: (file: File) => void;
  audioFile: File | null;
}

export function AudioUpload({ onAudioUpload, audioFile }: AudioUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        if (file.type.startsWith("audio/")) {
          onAudioUpload(file);
        } else {
          toast.error("Please upload an audio file");
        }
      }
    },
    [onAudioUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "audio/*": [".mp3", ".wav", ".ogg", ".m4a"],
    },
    maxFiles: 1,
  });

  return (
    <Card className="bg-secondary/50 border-dashed">
      <CardContent className="p-6">
        {!audioFile ? (
          <div
            {...getRootProps()}
            className={`flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed ${
              isDragActive
                ? "border-primary bg-primary/10"
                : "border-muted-foreground/50"
            } cursor-pointer transition-colors`}
          >
            <input {...getInputProps()} />
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground mb-2">
              {isDragActive
                ? "Drop your audio file here"
                : "Drag and drop your audio file here"}
            </p>
            <p className="text-center text-muted-foreground text-sm mb-4">
              or click to browse (MP3, WAV, OGG)
            </p>
            <Button variant="secondary" size="sm">
              Select Audio File
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between p-4 rounded-lg border border-muted-foreground/20 bg-muted/50">
            <div className="flex items-center space-x-3">
              <Music className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{audioFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const rootEl = document.querySelector(
                  '[data-dropzone-root="true"]'
                );
                if (rootEl) {
                  (rootEl as HTMLElement).click();
                }
              }}
            >
              Replace
            </Button>
            <div data-dropzone-root="true" className="hidden" {...getRootProps()}>
              <input {...getInputProps()} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

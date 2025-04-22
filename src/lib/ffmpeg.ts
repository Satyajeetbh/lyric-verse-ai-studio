
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;

  async load() {
    if (this.loaded) return;

    this.ffmpeg = new FFmpeg();
    
    // Log FFmpeg messages
    this.ffmpeg.on('log', ({ message }) => {
      console.log('FFmpeg log:', message);
    });

    // Load FFmpeg
    await this.ffmpeg.load({
      coreURL: await toBlobURL('/ffmpeg-core.js', 'application/javascript'),
      wasmURL: await toBlobURL('/ffmpeg-core.wasm', 'application/wasm'),
    });

    this.loaded = true;
  }

  async createLyricVideo(
    audioFile: File,
    backgroundImageFile: File,
    lyrics: Array<{ text: string; startTime: number; endTime: number }>,
    progressCallback?: (progress: number) => void
  ): Promise<Blob> {
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not loaded');
    }

    // Make sure FFmpeg is loaded
    if (!this.loaded) {
      await this.load();
    }

    // Write files to memory
    await this.ffmpeg.writeFile('audio.mp3', await fetchFile(audioFile));
    await this.ffmpeg.writeFile('background.jpg', await fetchFile(backgroundImageFile));

    // Create subtitles file
    const subtitles = this.createSubtitlesFile(lyrics);
    await this.ffmpeg.writeFile('lyrics.srt', subtitles);

    // Create video with background image
    await this.ffmpeg.exec([
      '-loop', '1',
      '-i', 'background.jpg',
      '-i', 'audio.mp3',
      '-c:v', 'libx264',
      '-tune', 'stillimage',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-pix_fmt', 'yuv420p',
      '-shortest',
      '-vf', 'subtitles=lyrics.srt:force_style=\'FontName=Arial,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,BorderStyle=4,Outline=1,Shadow=0,MarginV=30\'',
      'output.mp4'
    ]);

    // Read the output file
    const data = await this.ffmpeg.readFile('output.mp4');
    
    // Return the output as a Blob
    return new Blob([data], { type: 'video/mp4' });
  }

  private createSubtitlesFile(lyrics: Array<{ text: string; startTime: number; endTime: number }>): string {
    return lyrics.map((line, index) => {
      const startTime = this.formatSubtitleTime(line.startTime);
      const endTime = this.formatSubtitleTime(line.endTime);
      
      return `${index + 1}\n${startTime} --> ${endTime}\n${line.text}\n`;
    }).join('\n');
  }

  private formatSubtitleTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const ms = milliseconds % 1000;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  }
}

// Export a singleton instance
export const ffmpegService = new FFmpegService();

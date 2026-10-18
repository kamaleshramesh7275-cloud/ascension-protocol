import subprocess
import shutil
import random
from pathlib import Path
from config import ASSETS_DIR, OUTPUT_DIR

def is_ffmpeg_installed() -> bool:
    """Checks whether FFmpeg is available in PATH or system."""
    return shutil.which("ffmpeg") is not None

def get_audio_duration(audio_path: str) -> float:
    """Gets the duration of the audio in seconds using ffprobe."""
    try:
        cmd = [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            str(audio_path)
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True)
        return float(res.stdout.strip())
    except Exception:
        # Fallback estimation (approx 150 words per minute)
        return 35.0

def create_synthetic_background(duration: float, output_bg_path: str) -> bool:
    """
    Generates a dark cybernetic animated background loop using native FFmpeg filters
    if the user does not have any local video assets saved yet. Zero assets required!
    """
    cmd = [
        "ffmpeg", "-y",
        "-f", "lavfi",
        "-i", f"color=c=0x0a0f1d:s=1080x1920:d={duration}:r=30",
        "-f", "lavfi",
        "-i", f"mandelbrot=s=1080x1920:d={duration}:r=30",
        "-filter_complex",
        "[1:v]format=rgba,colorchannelmixer=aa=0.08[glow];[0:v][glow]overlay=0:0[v]",
        "-map", "[v]",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-pix_fmt", "yuv420p",
        str(output_bg_path)
    ]
    try:
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        return True
    except Exception as e:
        # Ultra-light fallback: solid dark slate background
        cmd_fallback = [
            "ffmpeg", "-y",
            "-f", "lavfi",
            "-i", f"color=c=0x090d16:s=1080x1920:d={duration}:r=30",
            "-c:v", "libx264",
            "-preset", "veryfast",
            "-pix_fmt", "yuv420p",
            str(output_bg_path)
        ]
        subprocess.run(cmd_fallback, check=True)
        return True

def render_short_video(
    audio_path: str,
    srt_path: str,
    output_video_path: str,
    title_text: str = "ASCENSION PROTOCOL"
) -> bool:
    """
    Assembles audio, background video, dynamic kinetic subtitles, and branding watermark
    into a production-grade 1080x1920 MP4 vertical video.
    """
    if not is_ffmpeg_installed():
        print("[Video Compositor] Error: FFmpeg is not installed or not in PATH.")
        return False

    duration = get_audio_duration(audio_path)
    print(f"[Video Compositor] Audio duration: {duration:.2f}s")

    # 1. Pick background video or generate synthetic cybernetic canvas
    local_bg_videos = list(ASSETS_DIR.glob("*.mp4"))
    temp_bg = None

    if local_bg_videos:
        chosen_bg = random.choice(local_bg_videos)
        print(f"[Video Compositor] Using background asset: {chosen_bg.name}")
        bg_source = str(chosen_bg)
    else:
        print("[Video Compositor] No background assets found in background_assets/. Generating synthetic dark cybernetic background...")
        temp_bg = OUTPUT_DIR / "_temp_bg.mp4"
        create_synthetic_background(duration, str(temp_bg))
        bg_source = str(temp_bg)

    # Clean SRT path for FFmpeg filter on Windows
    clean_srt = str(Path(srt_path).resolve()).replace("\\", "/").replace(":", "\\:")

    # 2. Build FFmpeg command with burn-in subtitles & branding watermark
    # Subtitle style: Bold yellow with black outline, centered
    sub_style = "Fontname=Arial,Fontsize=18,PrimaryColour=&H0022FFFF,BackColour=&H80000000,Bold=1,Outline=2,Alignment=2,MarginV=320"
    
    cmd = [
        "ffmpeg", "-y",
        "-stream_loop", "-1",
        "-i", bg_source,
        "-i", str(audio_path),
        "-vf", (
            f"subtitles={clean_srt}:force_style='{sub_style}',"
            f"drawtext=text='ASCENSION PROTOCOL':fontcolor=0xfbbf24:fontsize=36:x=(w-text_w)/2:y=180:font='Arial':box=1:boxcolor=0x00000088:boxborderw=10,"
            f"drawtext=text='ascensions.in':fontcolor=0x22d3ee:fontsize=28:x=(w-text_w)/2:y=240:font='Arial'"
        ),
        "-t", str(duration + 0.3),
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-crf", "23",
        "-threads", "2",
        "-c:a", "aac",
        "-b:a", "128k",
        "-shortest",
        "-pix_fmt", "yuv420p",
        str(output_video_path)
    ]

    try:
        subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
        if temp_bg and temp_bg.exists():
            temp_bg.unlink()
        print(f"[Video Compositor] Video successfully rendered: {output_video_path}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[Video Compositor] FFmpeg Error: {e.stderr.decode('utf-8', errors='ignore')}")
        return False

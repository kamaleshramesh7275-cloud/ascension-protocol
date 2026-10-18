"""
Master Pipeline Runner for Ascension Protocol Autonomous Marketing Machine
Executes the full chain: Copywriting -> Voiceover -> Video Render -> Publishing -> Telegram Alert
"""
import os
import sys
import time
from datetime import datetime
from pathlib import Path

from config import OUTPUT_DIR, WEBSITE_URL, DEFAULT_UTM
from ai_copywriter import generate_script
from voice_engine import generate_voiceover
from video_compositor import render_short_video
from telegram_notifier import send_telegram_alert, send_telegram_video_preview
from publisher_youtube import upload_to_youtube_shorts
from publisher_instagram import publish_instagram_reel

def run_marketing_cycle(theme_override: str = None) -> dict:
    """
    Runs one complete, autonomous production and publishing cycle.
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    print(f"\n=======================================================")
    print(f"🚀 INITIATING AUTONOMOUS MARKETING CYCLE [{timestamp}]")
    print(f"=======================================================\n")

    # 1. Generate High-Converting Script
    print("[1/5] Generating tactical script via Free AI...")
    script_data = generate_script(theme_override)
    print(f"  Title: {script_data.get('title')}")
    print(f"  Hook: {script_data.get('hook')}")

    # File paths for this cycle
    audio_path = OUTPUT_DIR / f"voice_{timestamp}.mp3"
    srt_path = OUTPUT_DIR / f"subtitles_{timestamp}.srt"
    video_path = OUTPUT_DIR / f"reel_{timestamp}.mp4"

    # 2. Synthesize Free Neural Voiceover + Word-level Subtitles
    print("\n[2/5] Synthesizing neural voiceover via Edge-TTS...")
    voice_ok = generate_voiceover(
        text=script_data["voiceover_script"],
        output_audio_path=str(audio_path),
        output_srt_path=str(srt_path)
    )
    if not voice_ok:
        print("❌ Voice synthesis failed.")
        return {"success": False, "error": "Voice synthesis failed"}

    # 3. Assemble Vertical 9:16 Video via FFmpeg
    print("\n[3/5] Assembling 1080x1920 Short via FFmpeg...")
    video_ok = render_short_video(
        audio_path=str(audio_path),
        srt_path=str(srt_path),
        output_video_path=str(video_path),
        title_text=script_data.get("title", "ASCENSION PROTOCOL")
    )
    if not video_ok:
        print("❌ Video rendering failed.")
        return {"success": False, "error": "Video rendering failed"}

    # 4. Multi-Platform Auto-Publishing
    print("\n[4/5] Publishing across channels...")
    full_caption = f"{script_data.get('caption')}\n\n👉 Test your protocol: {WEBSITE_URL}{DEFAULT_UTM}\n\n{script_data.get('hashtags')}"
    
    yt_res = upload_to_youtube_shorts(
        video_path=str(video_path),
        title=script_data.get("title", "Ascension Protocol"),
        description=full_caption
    )
    
    # 5. Mobile Notification to Your Phone
    print("\n[5/5] Sending video preview and telemetry to Telegram...")
    telegram_msg = (
        f"⚔️ *Ascension Marketing Node Alert*\n"
        f"*Title:* {script_data.get('title')}\n"
        f"*Status:* Video rendered ({video_path.name})\n"
        f"*Funnel Link:* `{WEBSITE_URL}{DEFAULT_UTM}`\n"
        f"*YouTube:* {yt_res.get('status')}"
    )
    send_telegram_alert(telegram_msg)
    send_telegram_video_preview(str(video_path), caption=f"{script_data.get('title')}\n{script_data.get('hook')}")

    print(f"\n✅ CYCLE COMPLETE! Output saved to: {video_path}")
    return {
        "success": True,
        "video_path": str(video_path),
        "script": script_data,
        "youtube": yt_res
    }

if __name__ == "__main__":
    run_marketing_cycle()

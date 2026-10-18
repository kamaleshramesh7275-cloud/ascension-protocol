import requests
from pathlib import Path
from config import TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

def send_telegram_alert(message: str) -> bool:
    """
    Sends a text message alert to your mobile Telegram.
    """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        print("[Telegram Notifier] Notice: TELEGRAM_BOT_TOKEN or CHAT_ID not set in .env. Skipping alert.")
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": message,
        "parse_mode": "Markdown"
    }

    try:
        res = requests.post(url, json=payload, timeout=10)
        return res.ok
    except Exception as e:
        print(f"[Telegram Notifier] Failed to send message: {e}")
        return False

def send_telegram_video_preview(video_path: str, caption: str) -> bool:
    """
    Sends the rendered MP4 video directly to your phone so you can inspect it in real-time.
    """
    if not TELEGRAM_BOT_TOKEN or not TELEGRAM_CHAT_ID:
        return False

    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendVideo"
    try:
        with open(video_path, "rb") as video_file:
            files = {"video": video_file}
            data = {
                "chat_id": TELEGRAM_CHAT_ID,
                "caption": caption[:1024],  # Telegram max caption limit
                "supports_streaming": True
            }
            res = requests.post(url, data=data, files=files, timeout=60)
            return res.ok
    except Exception as e:
        print(f"[Telegram Notifier] Failed to upload video preview: {e}")
        return False

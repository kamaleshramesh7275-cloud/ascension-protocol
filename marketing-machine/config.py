import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

# 1. AI Engine Config (Groq Llama 3.3 70B - 100% Free Tier, zero credit card)
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# 2. Voice Engine Config (Microsoft Edge Neural Voice - Free & Unlimited)
# Recommended voices: "en-US-ChristopherNeural" (Deep, authoritative), "en-GB-RyanNeural"
VOICE_ACTOR = os.getenv("VOICE_ACTOR", "en-US-ChristopherNeural")
VOICE_RATE = os.getenv("VOICE_RATE", "+5%")
VOICE_PITCH = os.getenv("VOICE_PITCH", "-2Hz")

# 3. Telegram Remote Control & Alerts (Free Bot)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID", "")

# 4. Social Media Publishing (Official APIs)
YOUTUBE_CLIENT_SECRETS_FILE = os.getenv("YOUTUBE_CLIENT_SECRETS_FILE", str(BASE_DIR / "client_secret.json"))
INSTAGRAM_ACCESS_TOKEN = os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
INSTAGRAM_ACCOUNT_ID = os.getenv("INSTAGRAM_ACCOUNT_ID", "")

# 5. Directories
ASSETS_DIR = BASE_DIR / "background_assets"
OUTPUT_DIR = BASE_DIR / "generated_videos"
ASSETS_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

# 6. Ascension Protocol Target Funnel
WEBSITE_URL = "https://ascensions.in"
DEFAULT_UTM = "?utm_source=autonomous_ai&utm_medium=short_video&utm_campaign=daily_protocol"

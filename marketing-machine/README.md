# 🚀 Ascension Protocol: Autonomous AI Marketing Machine

A 100% Free, zero-cost autonomous marketing daemon designed to run on a low-spec secondary laptop.

---

## ⚡ 4-Step Quickstart on Your Secondary Laptop

### 1. Install Python & FFmpeg
- Install Python 3.10+ (Check *"Add python.exe to PATH"* during install).
- Download FFmpeg and add it to your PATH.

### 2. Install Python Dependencies
Open PowerShell or Terminal inside the `marketing-machine` folder:
```bash
pip install -r requirements.txt
```

### 3. Setup Your Free `.env`
Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```
Fill in your free **GROQ_API_KEY** (from [console.groq.com](https://console.groq.com/)) and **TELEGRAM_BOT_TOKEN** (from `@BotFather`).

### 4. Run Immediate Test or Launch Daemon

**To test generate a video immediately:**
```bash
python scheduler.py --now
```

**To start the 24/7 autonomous daemon:**
```bash
python scheduler.py
```

The daemon will run silently in the background, scheduled for **7:30 AM**, **1:30 PM**, and **7:30 PM IST**, and ping your phone on Telegram whenever a drop is created!

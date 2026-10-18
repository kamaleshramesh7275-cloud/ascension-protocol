#!/bin/bash
# ==============================================================================
# Ascension Protocol: 1-Click Linux Server Setup Script
# Installs Python3, FFmpeg, sets up background systemd daemon for 24/7 automation
# ==============================================================================

set -e

echo "=========================================================="
echo "⚡ ASCENSION PROTOCOL: 24/7 LINUX MARKETING NODE INSTALLER"
echo "=========================================================="

# 1. Update packages and install FFmpeg & Python
echo "[1/4] Installing Python3, Pip, and FFmpeg..."
sudo apt update -y
sudo apt install -y python3 python3-pip ffmpeg git

# 2. Prevent Laptop from Sleeping when Lid is Closed
echo "[2/4] Configuring Linux to ignore lid closing (24/7 Headless)..."
sudo sed -i 's/#HandleLidSwitch=suspend/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
sudo sed -i 's/HandleLidSwitch=suspend/HandleLidSwitch=ignore/' /etc/systemd/logind.conf
sudo systemctl restart systemd-logind

# 3. Copy Code to /opt/ascension-marketing & Install Requirements
echo "[3/4] Installing Python dependencies..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
sudo mkdir -p /opt/ascension-marketing
sudo cp -r "$SCRIPT_DIR"/* /opt/ascension-marketing/
cd /opt/ascension-marketing
sudo pip3 install --break-system-packages -r requirements.txt || sudo pip3 install -r requirements.txt

# 4. Install & Enable Systemd 24/7 Service
echo "[4/4] Registering 24/7 Systemd Service (Auto-restarts on crash/reboot)..."
sudo cp ascension-marketing.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable ascension-marketing
sudo systemctl restart ascension-marketing

echo "=========================================================="
echo "🎉 SUCCESS: ASCENSION MARKETING NODE IS LIVE ON LINUX!"
echo "Status check command: sudo systemctl status ascension-marketing"
echo "Live logs command:    sudo journalctl -u ascension-marketing -f"
echo "=========================================================="

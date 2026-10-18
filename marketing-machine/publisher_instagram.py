"""
Official Meta Instagram Graph API Reels Publisher (100% Free - Up to 50 posts/24 hours)
Supports official Reels container creation and media publishing.
"""
import requests
import time
from config import INSTAGRAM_ACCESS_TOKEN, INSTAGRAM_ACCOUNT_ID

def publish_instagram_reel(video_url: str, caption: str) -> dict:
    """
    Publishes a vertical video as an Instagram Reel using Meta's official Graph API.
    Requirements:
    1. An Instagram Creator or Business Account
    2. A Page Access Token with instagram_content_publish permissions
    """
    if not INSTAGRAM_ACCESS_TOKEN or not INSTAGRAM_ACCOUNT_ID:
        print("[Instagram Publisher] Notice: INSTAGRAM_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID not configured.")
        print("[Instagram Publisher] Video is preserved locally in generated_videos/ ready for publishing.")
        return {
            "success": False,
            "status": "AWAITING_META_CREDENTIALS",
            "message": "Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_ACCOUNT_ID in .env"
        }

    try:
        # Step 1: Create Reel Media Container
        create_url = f"https://graph.facebook.com/v19.0/{INSTAGRAM_ACCOUNT_ID}/media"
        container_payload = {
            "media_type": "REELS",
            "video_url": video_url,
            "caption": caption,
            "access_token": INSTAGRAM_ACCESS_TOKEN,
        }

        print("[Instagram Publisher] Creating Instagram Reels container on Meta servers...")
        res = requests.post(create_url, data=container_payload, timeout=30)
        data = res.json()

        if "id" not in data:
            print(f"[Instagram Publisher] Container creation error: {data}")
            return {"success": False, "error": data}

        container_id = data["id"]
        print(f"[Instagram Publisher] Container ID: {container_id}. Waiting for Meta transcoding...")

        # Step 2: Poll container status until ready
        status_url = f"https://graph.facebook.com/v19.0/{container_id}?fields=status_code&access_token={INSTAGRAM_ACCESS_TOKEN}"
        for _ in range(12):  # Poll up to 60 seconds
            time.sleep(5)
            status_res = requests.get(status_url, timeout=15)
            status_data = status_res.json()
            if status_data.get("status_code") == "FINISHED":
                break

        # Step 3: Publish the Reel
        publish_url = f"https://graph.facebook.com/v19.0/{INSTAGRAM_ACCOUNT_ID}/media_publish"
        publish_payload = {
            "creation_id": container_id,
            "access_token": INSTAGRAM_ACCESS_TOKEN,
        }
        pub_res = requests.post(publish_url, data=publish_payload, timeout=30)
        pub_data = pub_res.json()

        if "id" in pub_data:
            print(f"[Instagram Publisher] Reel published successfully! Media ID: {pub_data['id']}")
            return {"success": True, "media_id": pub_data["id"]}
        else:
            return {"success": False, "error": pub_data}

    except Exception as e:
        print(f"[Instagram Publisher] Unexpected error: {e}")
        return {"success": False, "error": str(e)}

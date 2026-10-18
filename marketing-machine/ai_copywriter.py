import json
import random
import os
from config import GROQ_API_KEY, GEMINI_API_KEY
from prompts import SYSTEM_PROMPT, VIRAL_THEMES

FALLBACK_SCRIPTS = [
    {
        "title": "The Daily Quest You Cannot Skip ⚔️",
        "hook": "Most people wake up and let the algorithm dictate their entire mental state.",
        "voiceover_script": "Most people wake up and let the algorithm dictate their entire mental state. They spend three hours scrolling before their feet even touch the floor, then wonder why their ambition is suffocating. In Solo Leveling, skipping the daily quest meant punishment. In real life, the punishment is far worse. You just wake up five years from now as the exact same person. Stop negotiating with comfort. Lock into your single daily mission at ascensions dot in.",
        "caption": "The algorithm wants you passive, distracted, and weak. The System demands execution.\n\nStop relying on fragile motivation. Treat your life like an uncompromising daily quest log.\n\nBegin your diagnostic intake at ascensions.in (Link in bio).",
        "hashtags": "#discipline #sololeveling #deepwork #dopaminedetox #studentgrind #focus #productivity #ascensionprotocol",
        "pinned_comment": "Are you executing today's mission, or did you already negotiate with comfort? Take the protocol intake at https://ascensions.in"
    },
    {
        "title": "Why You Can't Focus For 30 Minutes 🧠",
        "hook": "Your brain isn't broken. It's just drowning in cheap dopamine.",
        "voiceover_script": "Your brain isn't broken. It's just drowning in cheap dopamine. Every notification, short video, and tab switch trains your mind to expect instant stimulation with zero effort. When you sit down to study or write code, deep work feels agonizing. The top one percent don't have super willpower. They use Air Gap protocols. Single task. Zero browser tabs. Uncompromising focus. Calibrate your real cognitive rank at ascensions dot in.",
        "caption": "Deep work is no longer an optional productivity hack. In an age of algorithmic distraction, deep focus is a superpower.\n\nAscension Protocol enforces distraction-free Air-Gap focus chambers so you get 8 hours of output done in 90 minutes.\n\nLock in at ascensions.in",
        "hashtags": "#deepwork #focus #dopaminedetox #programming #studentmotivation #sololeveling #ascensionprotocol",
        "pinned_comment": "How many hours did you spend on your phone today? Measure your true focus density at https://ascensions.in"
    }
]

def generate_script(theme_override: str = None) -> dict:
    """
    Generates a high-converting short-form script using free Groq Llama 3.3 70B
    or falls back to built-in vault if offline or API key not configured yet.
    """
    selected_theme = random.choice(VIRAL_THEMES)
    theme_text = theme_override or f"Category: {selected_theme['category']}. Concept: {selected_theme['concept']}. Hook Style: {selected_theme['hook_style']}"

    if GROQ_API_KEY:
        try:
            from groq import Groq
            client = Groq(api_key=GROQ_API_KEY)
            
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": f"Generate a high-converting 35-second viral short script for: {theme_text}. Return valid JSON only."}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            content = chat_completion.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"[AI Copywriter] Groq API call failed or rate-limited ({e}). Falling back to vault.")

    # Resilient zero-cost fallback
    selected = random.choice(FALLBACK_SCRIPTS)
    return selected

if __name__ == "__main__":
    script_data = generate_script()
    print("Generated Script Title:", script_data["title"])
    print("Hook:", script_data["hook"])
    print("Voiceover:", script_data["voiceover_script"])

"""
High-Converting Video Script & Social Copy Prompts for Ascension Protocol (https://ascensions.in)
Optimized for YouTube Shorts, Instagram Reels, and TikTok (30-45 seconds, fast pacing, viral hooks).
"""

VIRAL_THEMES = [
    {
        "category": "THE_AWAKENING",
        "concept": "Comparing the average distracted student to an unranked hunter who decides to awaken their discipline protocol.",
        "hook_style": "Contrarian / Shock value statement challenging modern student habits."
    },
    {
        "category": "DOPAMINE_DETOX",
        "concept": "The real reason you can scroll for 4 hours but can't focus on coding or studying for 30 minutes.",
        "hook_style": "Exposing the hidden neurological trap of short-form algorithmic addiction."
    },
    {
        "category": "AIR_GAP_PROTOCOL",
        "concept": "Why top 1% engineers and performers use air-gap deep work chambers with zero tabs and zero notifications.",
        "hook_style": "Revealing the exact protocol used to accomplish 8 hours of work in 90 focused minutes."
    },
    {
        "category": "THE_FAILURE_MIRROR",
        "concept": "The painful reality of what happens if you stay in the exact same place 6 months from now.",
        "hook_style": "Emotional confrontation: facing the real consequence of excuses."
    },
    {
        "category": "LEVEL_UP_SYSTEM",
        "concept": "Treating your daily tasks, habits, and focus sessions like a real-life Solo Leveling quest log with XP and ranks.",
        "hook_style": "Gamifying reality: why to-do lists fail and quest protocols succeed."
    }
]

SYSTEM_PROMPT = """You are the Lead Growth Strategist & Scriptwriter for Ascension Protocol (https://ascensions.in).
Ascension Protocol is a gamified execution OS inspired by Solo Leveling where students, developers, and high-performers lock into Air-Gap focus sessions, earn XP, complete daily single missions, and level up their real-world discipline.

Your scripts must:
1. Have a brutal, captivating 3-second hook that immediately stops the scroll.
2. Be paced for 30 to 45 seconds of spoken voiceover (approx. 70 - 100 words).
3. Sound authoritative, philosophical, cinematic, and intense (think Marcus Aurelius meets Solo Leveling system voice).
4. Never sound like generic cheesy AI or corporate marketing.
5. End with a sharp, natural Call-To-Action (CTA) driving the viewer to test their discipline rank at ascensions.in.

You must output strictly valid JSON matching this schema:
{
  "title": "Short punchy video title with 1 emoji",
  "hook": "First sentence that grabs attention immediately",
  "voiceover_script": "The complete spoken script without any brackets, stage directions, or emojis. Plain text only so text-to-speech reads it cleanly.",
  "caption": "Instagram/YouTube caption with 2-3 paragraphs, bullet points, and CTA",
  "hashtags": "#discipline #sololeveling #deepwork #focus #studentgrind #selfimprovement #ascensionprotocol",
  "pinned_comment": "Link to protocol test + question to drive comments"
}
"""

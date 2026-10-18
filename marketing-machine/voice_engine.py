import asyncio
import os
from pathlib import Path
import edge_tts
from config import VOICE_ACTOR, VOICE_RATE, VOICE_PITCH

async def _generate_voiceover_async(text: str, output_audio: str, output_srt: str = None):
    """
    Synthesizes neural voiceover and generates synchronized subtitles
    using Microsoft Edge's free neural voice engine (100% free, unlimited, zero API key).
    """
    communicate = edge_tts.Communicate(
        text=text,
        voice=VOICE_ACTOR,
        rate=VOICE_RATE,
        pitch=VOICE_PITCH
    )

    if output_srt:
        submaker = edge_tts.SubMaker()
        with open(output_audio, "wb") as audio_file:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    audio_file.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    submaker.feed(chunk)

        with open(output_srt, "w", encoding="utf-8") as srt_file:
            srt_file.write(submaker.get_srt())
    else:
        await communicate.save(output_audio)

def generate_voiceover(text: str, output_audio_path: str, output_srt_path: str = None) -> bool:
    """
    Synchronous wrapper for easy invocation in standard Python scripts.
    """
    try:
        Path(output_audio_path).parent.mkdir(parents=True, exist_ok=True)
        asyncio.run(_generate_voiceover_async(text, output_audio_path, output_srt_path))
        return True
    except Exception as e:
        print(f"[Voice Engine] Error generating voiceover: {e}")
        return False

if __name__ == "__main__":
    test_text = "Most people wake up and let the algorithm dictate their entire mental state. Lock in at ascensions dot in."
    test_audio = "test_voiceover.mp3"
    test_srt = "test_subtitles.srt"
    success = generate_voiceover(test_text, test_audio, test_srt)
    print("Voiceover generated successfully:", success)

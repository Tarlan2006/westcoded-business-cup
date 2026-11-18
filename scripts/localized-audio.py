"""Build compact locale packs from the dictionaries and the existing English recordings."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import tempfile
import wave

ROOT = Path(__file__).resolve().parents[1]
AUDIO = ROOT / "public/audio"
def read(path):
    return json.loads(path.read_text(encoding="utf-8"))
def save(path, data):
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", required=True, choices=["kk", "en"])
    parser.add_argument("--model", type=Path)
    parser.add_argument("--english-source", type=Path, default=AUDIO)
    args = parser.parse_args()
    locale = args.lang
    directory = AUDIO / locale
    directory.mkdir(exist_ok=True)
    catalog = read(ROOT / "content/voice/catalog.json")
    messages = read(ROOT / f"src/i18n/content-{locale}.json")
    brand = (ROOT / "src/brand.ts").read_text().split("'")[1]
    if locale == "kk":
        from piper import PiperVoice
        from piper.phonemize_espeak import ESPEAK_DATA_DIR
        voice = PiperVoice.load(args.model, espeak_data_dir=os.environ.get("ESPEAK_DATA_PATH", ESPEAK_DATA_DIR))
        catalog += [{"id": key[6:]} for key in messages if key.startswith("voice.ui_")]
    ffmpeg = os.environ.get("FFMPEG")
    if not ffmpeg:
        from imageio_ffmpeg import get_ffmpeg_exe
        ffmpeg = get_ffmpeg_exe()
    clips, texts = {}, {}
    with tempfile.TemporaryDirectory() as tmp:
        for row in catalog:
            text = messages["voice." + row["id"]].replace("{brand}", brand)
            normalized = " ".join(text.split())
            if normalized not in texts:
                # Hash the text so repeated lines share a single recording.
                filename = hashlib.sha256(normalized.encode()).hexdigest()[:20] + ".mp3"
                target = directory / filename
                source = args.english_source / row.get("file", "").removeprefix("/audio/")
                if locale == "kk":
                    source = Path(tmp) / "speech.wav"
                    with wave.open(str(source), "wb") as wav:
                        voice.synthesize_wav(text.replace(brand, "Айдос"), wav)
                if source.resolve() == target.resolve() and target.is_file():
                    texts[normalized] = "/audio/" + locale + "/" + filename
                    clips[row["id"]] = texts[normalized]
                    continue
                subprocess.run([ffmpeg, "-v", "error", "-y", "-i", str(source), "-ac", "1",
                                "-ar", "16000", "-b:a", "24k", "-map_metadata", "-1", str(target)], check=True)
                texts[normalized] = "/audio/" + locale + "/" + filename
            clips[row["id"]] = texts[normalized]
    metadata = {"lang": locale, "voice": "kk-iseke-v1" if locale == "kk" else "aidos-luna-v1"}
    save(directory / "manifest.json", {**metadata, "clips": clips})
    save(directory / "voice-index.json", {**metadata, "texts": texts})
    print(locale, len(clips), "clips,", len(texts), "unique recordings")
if __name__ == "__main__":
    main()

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
    staged = path.with_suffix(".json.tmp")
    staged.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    staged.replace(path)
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", required=True, choices=["kk", "en"])
    parser.add_argument("--model", type=Path)
    parser.add_argument("--english-source", type=Path, default=AUDIO)
    parser.add_argument("--ask-only", action="store_true", help="Refresh only the Kazakh Ask recordings")
    args = parser.parse_args()
    locale = args.lang
    directory = AUDIO / locale
    directory.mkdir(exist_ok=True)
    catalog = read(ROOT / "content/voice/catalog.json")
    messages = read(ROOT / f"src/i18n/content-{locale}.json")
    ask_texts = set()
    if args.ask_only and locale != "kk":
        parser.error("--ask-only requires --lang kk")
    brand = (ROOT / "src/brand.ts").read_text().split("'")[1]
    if locale == "kk":
        from piper import PiperVoice
        from piper.phonemize_espeak import ESPEAK_DATA_DIR
        voice = PiperVoice.load(args.model, espeak_data_dir=os.environ.get("ESPEAK_DATA_PATH", ESPEAK_DATA_DIR))
        catalog += [{"id": key[6:]} for key in messages if key.startswith("voice.ui_")]
        ask_texts.update(row["answer"] for row in read(ROOT / "shared/faq-kk.json"))
        for topic, rows in read(ROOT / "shared/ask-examples-kk.json").items():
            for i, row in enumerate(rows):
                if "answer" in row:
                    key = f"ask_{topic}_{i}"
                    messages["voice." + key] = row["answer"]
                    catalog.append({"id": key})
                    ask_texts.add(row["answer"])
        if args.ask_only:
            catalog = [row for row in catalog if messages["voice." + row["id"]] in ask_texts]
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
                intermediate = Path(tmp) / "encoded.mp3"
                # Long Ask replies use mono speech encoding to keep both language packs below 6 MB.
                encoding = ["-abr", "1", "-b:a", "18k"] if text in ask_texts else ["-b:a", "24k"]
                subprocess.run([ffmpeg, "-v", "error", "-y", "-i", str(source), "-ac", "1",
                                "-ar", "16000", *encoding, "-map_metadata", "-1", str(intermediate)], check=True)
                target.write_bytes(intermediate.read_bytes())
                texts[normalized] = "/audio/" + locale + "/" + filename
            clips[row["id"]] = texts[normalized]
    metadata = {"lang": locale, "voice": "kk-iseke-v1" if locale == "kk" else "aidos-luna-v1"}
    if args.ask_only:
        clips = {**read(directory / "manifest.json")["clips"], **clips}
        texts = {**read(directory / "voice-index.json")["texts"], **texts}
    save(directory / "manifest.json", {**metadata, "clips": clips})
    save(directory / "voice-index.json", {**metadata, "texts": texts})
    print(locale, len(clips), "clips,", len(texts), "unique recordings")
if __name__ == "__main__":
    main()

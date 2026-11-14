# Audio credits

Mission Control's English voice clips were synthesized locally with [Piper](https://github.com/OHF-Voice/piper1-gpl) and the [en_US-hifi_tts_92-medium voice](https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/hifi_tts_92/medium).

The voice uses recordings by Cori Samuel (reader 92) from the [Hi-Fi TTS dataset](https://www.openslr.org/109/), compiled by Evelina Bakhturina, Vitaly Lavrukhin, Boris Ginsburg, and Yang Zhang. The dataset is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Mission Control supplies the scripts and trims, normalizes, and encodes the generated clips as MP3. [Piper voice provenance](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/LICENSING.md)

## Mascot live voice

The Mission Control mascot speaks in the browser with [Kyutai Pocket TTS](https://huggingface.co/kyutai/pocket-tts) (model weights licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)), run through [pocket-tts-js](https://github.com/vlapky/pocket-tts-js) (MIT) and the ONNX export [vlapky/pocket-tts-onnx](https://huggingface.co/vlapky/pocket-tts-onnx). The voice is cloned from `public/voice/host-reference.mp3`, a clip of the approved host voice designed with [OmniVoice](https://huggingface.co/k2-fsa/OmniVoice) (Apache-2.0) and raised three semitones.

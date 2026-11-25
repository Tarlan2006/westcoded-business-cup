# Audio credits

Mission Control's English voice clips were synthesized locally with [Piper](https://github.com/OHF-Voice/piper1-gpl) and the [en_US-hifi_tts_92-medium voice](https://huggingface.co/rhasspy/piper-voices/tree/main/en/en_US/hifi_tts_92/medium).

The voice uses recordings by Cori Samuel (reader 92) from the [Hi-Fi TTS dataset](https://www.openslr.org/109/), compiled by Evelina Bakhturina, Vitaly Lavrukhin, Boris Ginsburg, and Yang Zhang. The dataset is licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Mission Control supplies the scripts and trims, normalizes, and encodes the generated clips as MP3. [Piper voice provenance](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/LICENSING.md)

## Mascot live voice

The reference recordings in `content/voice` were designed with [OmniVoice](https://huggingface.co/k2-fsa/OmniVoice) (Apache-2.0) and raised three semitones. The live voice uses [Kyutai Pocket TTS](https://huggingface.co/kyutai/pocket-tts) (CC BY 4.0), [pocket-tts-js](https://github.com/vlapky/pocket-tts-js) (MIT), and the [vlapky ONNX export](https://huggingface.co/vlapky/pocket-tts-onnx).

## Animal sounds

The real animal sounds in `public/audio/animals` come from Wikimedia Commons. AIdos trims them, fades their edges, normalizes their loudness, and encodes them as MP3. Each adapted file keeps its source's license.

- `animal_cow.mp3`: [Single Cow Moo.ogg](https://commons.wikimedia.org/wiki/File:Single_Cow_Moo.ogg) by MichaeltheFox8621, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)
- `animal_cat.mp3`: [Meow of a Siamese cat - freemaster2.wav](https://commons.wikimedia.org/wiki/File:Meow_of_a_Siamese_cat_-_freemaster2.wav) by freemaster2, [CC0](https://creativecommons.org/publicdomain/zero/1.0/)
- `animal_dog.mp3`: [Barking of a dog.ogg](https://commons.wikimedia.org/wiki/File:Barking_of_a_dog.ogg) by Amada44, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)

Kazakh speech uses Piper kk_KZ-raya-x_low trained on ISSAI Kazakh TTS (CC BY 4.0). Model card: https://huggingface.co/rhasspy/piper-voices/blob/main/kk/kk_KZ/raya/x_low/MODEL_CARD . English speech retains the existing recordings, re-encoded in mono for the two-language pack.

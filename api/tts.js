import { TextToSpeechClient } from '@google-cloud/text-to-speech';

const key = JSON.parse(process.env.GCP_TTS_SERVICE_ACCOUNT_JSON || '{}');
const client = new TextToSpeechClient({ credentials: key });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { text, voice = 'en-US-Wavenet-D' } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text is required' });

  try {
    const [resp] = await client.synthesizeSpeech({
      input: { text },
      voice: { languageCode: 'en-US', name: voice },
      audioConfig: { audioEncoding: 'MP3' },
    });
    return res.status(200).json({ audioContent: resp.audioContent });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'tts failed' });
  }
}

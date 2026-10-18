import 'dotenv/config';
import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Зөвхөн зураг оруулна уу.'));
  }
});

app.use(express.static('.'));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, configured: Boolean(process.env.ANTHROPIC_API_KEY) });
});

app.post('/api/translate', upload.single('image'), async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'Сервер дээр ANTHROPIC_API_KEY тохируулаагүй байна.' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Эхлээд манганы зураг сонгоно уу.' });
    }

    const mediaType = req.file.mimetype;
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mediaType)) {
      return res.status(400).json({ error: 'JPG, PNG, GIF эсвэл WebP зураг ашиглана уу.' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1800,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType,
                data: req.file.buffer.toString('base64')
              }
            },
            {
              type: 'text',
              text: 'Энэ манга/комик зургийн харагдаж буй бүх текстийг унш. Япон, солонгос, англи болон бусад хэл байж болно. Дараа нь байгалийн, ойлгомжтой Монгол кирилл хэлээр орчуул. Яригчдын дараалал, ярианы бөмбөлөг тус бүрийг тусад нь хадгал. Эх текстийг олж чадахгүй хэсгийг [уншигдахгүй] гэж тэмдэглэ. Зөвхөн орчуулгын үр дүнг текстээр гарга.'
            }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || 'AI үйлчилгээ хүсэлтийг боловсруулж чадсангүй.';
      return res.status(response.status === 429 ? 429 : 502).json({ error: message });
    }

    const translation = (data.content || [])
      .filter(part => part.type === 'text')
      .map(part => part.text)
      .join('\n')
      .trim();

    if (!translation) return res.status(502).json({ error: 'AI текст буцаасангүй. Дахин оролдоно уу.' });
    res.json({ translation });
  } catch (error) {
    if (error?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Зураг 8 MB-аас бага байх ёстой.' });
    }
    console.error('Translation error:', error);
    res.status(500).json({ error: error.message || 'Серверийн алдаа гарлаа.' });
  }
});

app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || 'Хүсэлтийн алдаа.' });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`OneTeam server running on port ${port}`);
});
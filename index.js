import 'dotenv/config';
import express from 'express';
import multer from 'multer'
import fs from 'fs/promises';
import { GoogleGenAI } from "@google/genai";

const app = express();
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// **Set your default Gemini model here"**
const GEMINI_MODEL = "gemini-3.5-flash";

app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server ready on http://localhost"${PORT}'));


app.post('/generate-text', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: e.message });
  }
});


// Simpan file unggahan sementara di memori buffer
// const upload = multer({ storage: multer.memoryStorage() });

app.post('/generate-from-image', upload.single('image'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'File gambar wajib diunggah!' });
    }

    // Format file gambar menjadi inlineData (Base64)
    const imagePart = {
      inlineData: {
        data: file.buffer.toString('base64'),
        mimeType: file.mimetype
      }
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [prompt || 'Jelaskan gambar ini secara detail.', imagePart]
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

app.post('/generate-from-document', upload.single('document'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'File dokumen wajib diunggah!' });
    }

    // Format file dokumen menjadi inlineData (Base64)
    const docPart = {
      inlineData: {
        data: file.buffer.toString('base64'),
        mimeType: file.mimetype
      }
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [prompt || 'Rangkum isi dokumen ini secara jelas.', docPart]
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

app.post('/generate-from-audio', upload.single('audio'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: 'File audio wajib diunggah!' });
    }

    const audioPart = {
      inlineData: {
        data: file.buffer.toString('base64'),
        mimeType: file.mimetype
      }
    };

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: [prompt || 'Transkripsikan atau rangkum isi audio ini.', audioPart]
    });

    res.status(200).json({ result: response.text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});
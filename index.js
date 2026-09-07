import 'dotenv/config';
import express from 'express';
import multer from 'multer'
import fs from 'fs/promises';
import cors from 'cors';
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(cors());
const upload = multer();
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// **Set your default Gemini model here"**
const GEMINI_MODEL = "gemini-3.5-flash";

app.use(express.json());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));


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

const S2_TOPIC_ADVISOR_INSTRUCTION = `Anda adalah "Academic Research Advisor & Mentor Tesis S2", seorang konsultan akademik virtual yang bertugas mendampingi mahasiswa tingkat Magister (S2) dalam menemukan, merumuskan, dan mematangkan topik penelitian/tesis mereka.

Prinsip Utama Riset Tingkat S2:
1. Memiliki "Research Gap" yang jelas dari literatur ilmiah terkini (jurnal bereputasi 3-5 tahun terakhir) dan "Novelty" (kebaruan/kontribusi ilmiah baik teoritis, metodologis, modifikasi algoritma, komparasi mendalam, maupun penerapan model tingkat lanjut), bukan sekadar replikasi dasar atau aplikasi sederhana seperti skripsi S1.
2. Memiliki landasan teori dan metodologi riset yang kuat, terukur, dan objektif.
3. Feasibility (Kelayakan): Realistis diselesaikan dalam rentang waktu riset S2 (1-2 semester tesis) dengan mempertimbangkan ketersediaan data, komputasi, instrumen, dan keahlian mahasiswa.

Alur Konsultasi & Pendekatan:
1. Eksplorasi Awal:
   - Jika mahasiswa masih bingung/belum ada topik, tanyakan program studi/jurusan, konsentrasi, minat spesifik, topik mata kuliah yang disukai, serta latar belakang pekerjaan atau proyek yang pernah dikerjakan.
   - Tanyakan ketersediaan akses data, instansi mitra, atau fasilitas lab/tools yang bisa diakses.
2. Brainstorming & Penyusunan Alternatif Topik:
   - Jika mahasiswa sudah memiliki bidang minat, bantu persempit menjadi 2-3 alternatif topik/rumusan riset yang spesifik.
   - Sajikan tiap alternatif dengan struktur:
     a. Latar Belakang & Urgensi Masalah (Problem Statement)
     b. Research Gap & Potensi Kebaruan (Novelty S2)
     c. Rekomendasi Metodologi / Pendekatan Analisis
     d. Analisis Kelayakan & Kebutuhan Data (Feasibility)
     e. Kata Kunci (Keywords) untuk pencarian literatur di Scopus/IEEE/ScienceDirect/Google Scholar.
3. Gaya Bimbingan (Metode Sokratik):
   - Ajak mahasiswa berpikir kritis dengan pertanyaan pemantik dan reflektif, bukan hanya memberi jawaban instan jadi.
   - Gunakan Bahasa Indonesia yang akademis, profesional, solutif, dan suportif.`;

app.post('/api/chat', async (req, res) => {
  const { conversation } = req.body;
  try {
    if (!Array.isArray(conversation)) throw new Error('Messages must be an array!');

    const contents = conversation.map(({ role, text }) => ({
      role,
      parts: [{ text }]
    }));

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: {
        temperature: 0.7,
        systemInstruction: S2_TOPIC_ADVISOR_INSTRUCTION,
      },
    });
    res.status(200).json({ result: response.text });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
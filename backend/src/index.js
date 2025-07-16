// src/index.js
import express from 'express';
import cors from 'cors';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- configurações para __dirname em ES Module ---
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// --- carrega a chave JSON manualmente ---
const serviceAccount = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../serviceAccountKey.json'), 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

const app = express();
app.use(cors());
app.use(express.json());

// POST /links
app.post('/links', async (req, res) => {
  const { url, title, description, image } = req.body;
  if (!url) return res.status(400).json({ error: 'O campo "url" é obrigatório.' });

  try {
    const dup = await db.collection('links').where('url','==',url).limit(1).get();
    if (!dup.empty) return res.status(400).json({ error: 'Link já cadastrado.' });

    const docRef = await db.collection('links').add({
      url,
      title:       title || null,
      description: description || null,
      image:       image || null,
      createdAt:   admin.firestore.FieldValue.serverTimestamp()
    });
    const snap = await docRef.get();
    return res.status(201).json({ id: snap.id, ...snap.data() });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

// GET /links
app.get('/links', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  try {
    const snap = await db
      .collection('links')
      .orderBy('createdAt','desc')
      .limit(limit)
      .get();
    const links = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return res.json(links);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro interno.' });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));

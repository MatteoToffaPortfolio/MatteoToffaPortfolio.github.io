require('dotenv').config();
const express = require('express');
const cors = require('cors');
const Groq = require('groq-sdk');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// CORS: consente richieste solo dal tuo portfolio
// In sviluppo locale accetta tutto; in produzione metti il tuo dominio
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'];

app.use(cors({
  origin: (origin, cb) => {
    // Permetti richieste senza origin (es. file:// locale) e origini consentite
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Origine non consentita'));
  }
}));

app.use(express.json());

// Serve i file del widget (per sviluppo locale)
app.use('/widget', express.static(path.join(__dirname, 'widget')));

// Carica il profilo all'avvio
function loadProfile() {
  const profilePath = path.join(__dirname, 'profile.md');
  if (fs.existsSync(profilePath)) {
    return fs.readFileSync(profilePath, 'utf-8');
  }
  return '(Profilo non configurato)';
}

const profile = loadProfile();
console.log('✓ Profilo caricato');

// Sessioni in memoria
const sessions = {};

// ─── Chat endpoint ────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message || !sessionId) {
    return res.status(400).json({ error: 'message e sessionId obbligatori' });
  }

  if (!sessions[sessionId]) sessions[sessionId] = [];
  const history = sessions[sessionId];
  history.push({ role: 'user', content: message });
  if (history.length > 14) history.splice(0, history.length - 14);

  const systemPrompt = `Sei l'assistente personale di un developer nel suo portfolio online.
Il tuo compito è rispondere alle domande dei visitatori riguardo al tuo proprietario: chi è, i suoi progetti, le sue competenze, i contatti e i link utili.
Sii cordiale, diretto e professionale. Rispondi in italiano o inglese a seconda della lingua del visitatore.
Non inventare informazioni: se qualcosa non è nel profilo, dillo e suggerisci di contattare direttamente.

=== PROFILO ===
${profile}
=== FINE PROFILO ===`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        ...history,
      ],
      temperature: 0.5,
      max_tokens: 500,
    });

    const reply = completion.choices[0].message.content;
    history.push({ role: 'assistant', content: reply });
    res.json({ reply });
  } catch (error) {
    console.error('Errore:', error.message);
    if (error.status === 429) {
      return res.status(429).json({ error: 'Troppe richieste. Riprova tra qualche secondo.' });
    }
    res.status(500).json({ error: 'Errore del server.' });
  }
});

app.post('/api/reset', (req, res) => {
  const { sessionId } = req.body;
  if (sessionId && sessions[sessionId]) delete sessions[sessionId];
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`✓ Portfolio chatbot avviato su http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY) {
    console.warn('⚠ GROQ_API_KEY mancante nel file .env');
  }
});

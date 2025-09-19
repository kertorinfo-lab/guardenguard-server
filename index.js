// --- .env fájl betöltése ---
require('dotenv').config();

// --- Szükséges csomagok importálása ---
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

// --- Express szerver inicializálása ---
const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware beállítások ---
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

// --- API Végpontok (Routes) ---

app.get('/', (req, res) => {
  res.send('Szia! A GuardenGuard képelemző és chat szerver fut.');
});

// Végpont a képelemzéshez
app.post('/analyze-image', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: "Nincs kép megadva a kérésben." });
    }
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
        return res.status(500).json({ error: "OpenAI API kulcs nincs beállítva." });
    }

    const payload = {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Viselkedj úgy, mint egy tapasztalt kertész és növénypatológus. Elemezd a képen látható növényt. Azonosítsd a fajtáját, ha lehetséges. Vizsgáld meg, hogy látható-e rajta betegség, kártevő, vagy tápanyaghiány jele. Adj részletes, de közérthető leírást a problémáról és javasolj konkrét, gyakorlatias megoldásokat a kezelésére (pl. metszés, permetezés, tápoldatozás). A válaszod legyen segítőkész és magyar nyelvű."
            },
            {
              type: "image_url",
              image_url: { "url": `data:image/jpeg;base64,${image}` }
            }
          ]
        }
      ],
      max_tokens: 500
    };

    const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
      headers: { 'Authorization': `Bearer ${openaiApiKey}` }
    });
    res.status(200).json({ analysis: response.data.choices[0].message.content });
  } catch (error) {
    console.error("Hiba az OpenAI API hívás során (kép):", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Hiba a szerver oldali képelemzés során." });
  }
});

// ÚJ VÉGPONT: Szöveges chat kezelése
app.post('/chat', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Nincs kérdés (prompt) megadva." });
    }
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
        return res.status(500).json({ error: "OpenAI API kulcs nincs beállítva." });
    }

    const payload = {
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Te egy segítőkész kertész asszisztens vagy a GuardenGuard alkalmazásban. Válaszolj a felhasználók növényekkel, kertészkedéssel kapcsolatos kérdéseire röviden, közérthetően és barátságosan, magyar nyelven."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 300
    };

    const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
      headers: { 'Authorization': `Bearer ${openaiApiKey}` }
    });
    res.status(200).json({ response: response.data.choices[0].message.content });
  } catch (error) {
    console.error("Hiba az OpenAI API hívás során (chat):", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Hiba a szerver oldali válaszadás során." });
  }
});


// --- Szerver indítása ---
app.listen(PORT, () => {
  console.log(`A szerver elindult a http://localhost:${PORT} címen`);
});


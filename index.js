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
// A limit növelése, hogy nagyobb (base64 kódolt) képeket is tudjunk fogadni
app.use(bodyParser.json({ limit: '10mb' }));

// --- API Végpontok (Routes) ---

app.get('/', (req, res) => {
  res.send('Szia! A GuardenGuard képelemző szerver fut.');
});

// Végpont a képelemzéshez
app.post('/analyze-image', async (req, res) => {
  try {
    // A Flutter app egy base64 kódolt string-ként küldi a képet
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: "Nincs kép megadva a kérésben." });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey || openaiApiKey === "IDE_MASOLD_BE_AZ_OPENAI_API_KULCSODAT") {
        return res.status(500).json({ error: "OpenAI API kulcs nincs beállítva a szerveren." });
    }

    // A payload, amit az OpenAI API-nak küldünk
    const payload = {
      model: "gpt-4o", // A legújabb, képelemzésre képes modell
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
              image_url: {
                // A képet data URL formátumban adjuk át
                "url": `data:image/jpeg;base64,${image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500 // Korlátozzuk a válasz hosszát
    };

    // Kérés küldése az OpenAI API-hoz
    const response = await axios.post('https://api.openai.com/v1/chat/completions', payload, {
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const analysis = response.data.choices[0].message.content;
    
    // A válasz visszaküldése a Flutter appnak
    res.status(200).json({ analysis: analysis });

  } catch (error) {
    console.error("Hiba az OpenAI API hívás során:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: "Hiba a szerver oldali képelemzés során." });
  }
});

// --- Szerver indítása ---
app.listen(PORT, () => {
  console.log(`A szerver elindult a http://localhost:${PORT} címen`);
});


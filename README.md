# 🌱 EcoSpark AI

**EcoSpark AI** helps people discover practical ways to protect the environment through smart, sustainable choices. Our goal is to make sustainability simple and accessible for everyone.

Built with 💚 by **Inaya**

## ✨ Features

- 🤖 **AI Chatbot** — powered by Google Gemini, with a built-in offline knowledge base as a fallback so it always answers
- 🗂️ **8 Sustainability Categories** — Home, School, Business, Transportation, Energy, Recycling, Water Conservation, Community Projects
- 📊 **Eco Impact Score** — every answer is rated 🌱 Low / 🌿 Medium / 🌳 High Impact
- 🏆 **Green Challenge Generator** — fun weekly eco-missions at the press of a button
- 🎨 **Modern animated UI** — floating gradient blobs, falling leaves, scroll reveals, animated nature illustration; fully responsive on phone, tablet, and desktop

## 🚀 Running the site

It's a pure static site — no build step needed.

```bash
# any static server works, e.g.:
python3 -m http.server 8000
# then open http://localhost:8000
```

Or simply open `index.html` in a browser, or host it on GitHub Pages / Netlify / Vercel.

## 🔑 Gemini API key

The chatbot calls the Gemini API directly from the browser. The key lives in `config.js`, which is **gitignored** so it never ends up in the repository:

```bash
cp config.example.js config.js
# then open config.js and paste your Gemini API key
```

> ⚠️ Anything in client-side code is visible to visitors. Use a **restricted** API key (HTTP referrer restriction in Google AI Studio / Cloud Console) and rotate it after presentations. If no key is set or the API is unavailable, EcoSpark automatically answers from its built-in eco knowledge base — the demo always works.

## 🗂️ Project structure

| File | Purpose |
|---|---|
| `index.html` | Page structure: hero, categories, chatbot, challenges, about, footer |
| `style.css` | Green/blue nature theme, animations, responsive layout |
| `script.js` | Chat logic, Gemini integration + offline fallback, challenges, UI effects |
| `config.example.js` | Template for `config.js`, where your Gemini API key goes |

/* ============================================================
   EcoSpark AI — App logic
   Chat (Gemini API + offline fallback), impact scores,
   green challenges, and UI animations.
   ============================================================ */

"use strict";

/* ----------------------------------------------------------
   Gemini configuration
   The API key is loaded from config.js (gitignored) — copy
   config.example.js to config.js and paste your key there.
   Without a key, EcoSpark answers from its built-in knowledge.
---------------------------------------------------------- */
const GEMINI_API_KEY = window.ECOSPARK_CONFIG?.GEMINI_API_KEY || "";
// "gemini-flash-latest" always points to the newest Flash model,
// which is what free-tier AI Studio keys have quota for.
const GEMINI_MODEL = "gemini-flash-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are EcoSpark AI, a friendly, encouraging environmental assistant that helps people find eco-friendly and sustainable solutions for homes, schools, businesses, transportation, energy, recycling, water conservation and community projects.

Rules for every answer:
- Be positive, encouraging and educational. Use simple language suitable for all ages, including students.
- Start with a short title line beginning with an emoji, like "🌱 Eco-Friendly School Ideas".
- Give 4-6 practical, realistic, low-cost suggestions as bullet points (each starting with "• ").
- After the bullets, add a line exactly in this format: "Estimated Impact: 🌱 Low Impact" or "Estimated Impact: 🌿 Medium Impact" or "Estimated Impact: 🌳 High Impact" — choose the rating that honestly matches the combined suggestions.
- Then add a short "Environmental Benefit:" line (1-2 sentences) explaining WHY these actions help the planet.
- Never suggest anything harmful, unsafe, illegal or age-inappropriate.
- If the question is not about sustainability or the environment, gently steer the user back to eco topics in one friendly sentence.
- Keep the whole answer under 180 words.`;

/* ----------------------------------------------------------
   Offline fallback knowledge base — used automatically if the
   Gemini API is unreachable, so the chatbot always works.
---------------------------------------------------------- */
const FALLBACK_ANSWERS = [
  {
    keywords: ["plastic", "waste at home", "single-use", "packaging", "bottle"],
    title: "🥤 Reduce Plastic Waste",
    tips: [
      "Carry a reusable water bottle and shopping bag wherever you go.",
      "Choose products with little or no plastic packaging.",
      "Swap cling film for reusable containers or beeswax wraps.",
      "Buy refills (soap, detergent) instead of new bottles.",
      "Say no to plastic straws and disposable cutlery.",
    ],
    impact: "medium",
    benefit: "Less plastic means less waste in landfills and oceans, protecting wildlife and reducing pollution for decades to come.",
  },
  {
    keywords: ["school", "classroom", "student", "teacher", "eco-club", "eco club"],
    title: "🏫 Eco-Friendly School Ideas",
    tips: [
      "Replace disposable bottles with water refill stations.",
      "Start a recycling program with clearly labelled bins.",
      "Plant trees and a small garden around the school.",
      "Turn off classroom lights and projectors when not needed.",
      "Create an eco-club so students can lead green projects.",
    ],
    impact: "high",
    benefit: "These actions reduce waste, save energy, and teach hundreds of students habits they will keep for life.",
  },
  {
    keywords: ["restaurant", "business", "company", "office", "shop", "store", "cafe"],
    title: "🏢 Sustainable Business Ideas",
    tips: [
      "Switch to LED lighting and energy-efficient appliances.",
      "Compost food scraps and donate surplus food instead of binning it.",
      "Use recyclable or compostable packaging and cutlery.",
      "Source ingredients and supplies from local producers.",
      "Track energy and water use monthly to find easy savings.",
    ],
    impact: "high",
    benefit: "Greener operations cut waste and emissions while usually lowering costs — good for the planet and the business.",
  },
  {
    keywords: ["transport", "car", "bike", "cycle", "bus", "commute", "travel", "walk"],
    title: "🚲 Greener Ways to Get Around",
    tips: [
      "Walk or cycle for short trips — it's free and healthy.",
      "Use buses, trains or carpool with friends for longer journeys.",
      "Combine several errands into one trip to drive less.",
      "Keep car tyres properly inflated to use less fuel.",
      "Consider an electric or hybrid vehicle when it's time to upgrade.",
    ],
    impact: "high",
    benefit: "Transport is one of the biggest sources of carbon emissions — every car trip you replace cuts air pollution directly.",
  },
  {
    keywords: ["energy", "electricity", "solar", "power", "heating", "light", "save energy"],
    title: "⚡ Smart Energy Savings",
    tips: [
      "Switch to LED bulbs — they use up to 80% less electricity.",
      "Turn off lights and unplug chargers when not in use.",
      "Wash clothes in cold water and air-dry when possible.",
      "Seal gaps around windows and doors to keep heat in.",
      "Explore solar panels or a green energy plan from your provider.",
    ],
    impact: "medium",
    benefit: "Using less energy means fewer fossil fuels burned, which lowers greenhouse gas emissions and your bills too.",
  },
  {
    keywords: ["recycl", "compost", "reuse", "trash", "garbage", "bin", "landfill"],
    title: "♻️ Recycle Like a Pro",
    tips: [
      "Learn your local recycling rules — wrong items spoil whole batches.",
      "Rinse containers before recycling them.",
      "Compost fruit and veggie scraps to make free garden soil.",
      "Donate or repair items instead of throwing them away.",
      "Buy products made from recycled materials to close the loop.",
    ],
    impact: "medium",
    benefit: "Good recycling and composting keep valuable materials in use and dramatically reduce what ends up in landfills.",
  },
  {
    keywords: ["water", "shower", "tap", "rain", "irrigation", "leak"],
    title: "💧 Water Conservation Wins",
    tips: [
      "Take shorter showers — even 2 minutes less saves thousands of litres a year.",
      "Fix dripping taps and running toilets quickly.",
      "Turn off the tap while brushing your teeth.",
      "Collect rainwater for watering plants.",
      "Run dishwashers and washing machines only when full.",
    ],
    impact: "medium",
    benefit: "Fresh water is precious — saving it protects rivers and wetlands and reduces the energy used to treat and pump water.",
  },
  {
    keywords: ["community", "neighbourhood", "neighborhood", "project", "volunteer", "local", "park"],
    title: "🤝 Community Green Projects",
    tips: [
      "Organise a litter clean-up day at a local park or beach.",
      "Start a community garden where neighbours grow food together.",
      "Set up a tool/toy library so people share instead of buying.",
      "Plant native trees and wildflowers for birds and bees.",
      "Host a swap day for clothes, books and games.",
    ],
    impact: "high",
    benefit: "Community projects multiply impact — when many people act together, whole neighbourhoods become cleaner and greener.",
  },
  {
    keywords: ["home", "house", "family", "kitchen", "garden"],
    title: "🏠 Eco-Friendly Home Ideas",
    tips: [
      "Switch to LED bulbs and turn off lights when leaving a room.",
      "Start a small compost bin for food scraps.",
      "Use reusable bags, bottles and containers.",
      "Grow a few herbs or vegetables — even on a windowsill.",
      "Choose natural cleaning products like vinegar and baking soda.",
    ],
    impact: "medium",
    benefit: "Small daily habits at home add up to real savings in energy, water and waste over a whole year.",
  },
];

const DEFAULT_ANSWER = {
  title: "🌍 Great Question!",
  tips: [
    "Start small: pick one habit to change this week, like using a reusable bottle.",
    "Save energy by switching off lights and devices you're not using.",
    "Reduce, reuse and recycle — in that order.",
    "Walk or cycle for short trips when you can.",
    "Share what you learn — inspiring one friend doubles your impact!",
  ],
  impact: "low",
  benefit: "Every sustainable choice, however small, reduces waste and emissions — and small actions grow into big change.",
};

/* ----------------------------------------------------------
   Green challenges
---------------------------------------------------------- */
const CHALLENGES = [
  { text: "Use a reusable water bottle every day for one week.", impact: "low", emoji: "🚰" },
  { text: "Turn off the lights every time you leave a room for 7 days.", impact: "low", emoji: "💡" },
  { text: "Walk or cycle for all your short trips this week.", impact: "medium", emoji: "🚲" },
  { text: "Go one full day without using any single-use plastic.", impact: "medium", emoji: "🥤" },
  { text: "Plant a seed, herb, or small tree this weekend.", impact: "high", emoji: "🌳" },
  { text: "Collect and properly recycle 10 items from around your home.", impact: "low", emoji: "♻️" },
  { text: "Take 5-minute showers for an entire week.", impact: "medium", emoji: "🚿" },
  { text: "Unplug all chargers and devices before bed for 5 nights.", impact: "low", emoji: "🔌" },
  { text: "Organise a mini clean-up with friends at a local park.", impact: "high", emoji: "🧹" },
  { text: "Eat meat-free meals for two days this week.", impact: "medium", emoji: "🥗" },
  { text: "Donate 3 items you no longer use instead of throwing them away.", impact: "medium", emoji: "🎁" },
  { text: "Start a compost jar for your fruit and vegetable scraps.", impact: "medium", emoji: "🪱" },
  { text: "Teach one friend or family member an eco-tip you learned here.", impact: "high", emoji: "📣" },
  { text: "Use both sides of every sheet of paper this week.", impact: "low", emoji: "📄" },
  { text: "Air-dry your laundry instead of using a dryer this week.", impact: "medium", emoji: "👕" },
];

/* ----------------------------------------------------------
   DOM references
---------------------------------------------------------- */
const chatWindow = document.getElementById("chatWindow");
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const sendBtn = document.getElementById("sendBtn");
const clearChatBtn = document.getElementById("clearChat");
const challengeBtn = document.getElementById("challengeBtn");
const challengeText = document.getElementById("challengeText");
const challengeMeta = document.getElementById("challengeMeta");

let chatHistory = []; // Gemini-format conversation history
let isThinking = false;

/* ----------------------------------------------------------
   Chat rendering helpers
---------------------------------------------------------- */
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const IMPACT_BADGES = {
  low: '<span class="impact-badge low">🌱 Low Impact</span>',
  medium: '<span class="impact-badge medium">🌿 Medium Impact</span>',
  high: '<span class="impact-badge high">🌳 High Impact</span>',
};

/** Convert the bot's plain/markdown-ish text into safe, styled HTML. */
function formatBotReply(raw) {
  const lines = escapeHtml(raw.trim()).split(/\r?\n/);
  let html = "";
  let inList = false;
  let impact = null;

  const closeList = () => { if (inList) { html += "</ul>"; inList = false; } };

  for (let line of lines) {
    line = line.trim().replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    if (!line) { closeList(); continue; }

    // bullet lines: "• ", "- ", "* "
    const bullet = line.match(/^(?:•|-|\*)\s+(.*)/);
    if (bullet) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${bullet[1]}</li>`;
      continue;
    }

    // impact line → render as badge instead of text
    const impactMatch = line.match(/estimated impact.*?(low|medium|high)/i);
    if (impactMatch) {
      closeList();
      impact = impactMatch[1].toLowerCase();
      continue;
    }

    // first emoji-led short line = title
    if (!html && line.length < 80) {
      html += `<h4>${line.replace(/^#+\s*/, "")}</h4>`;
      continue;
    }

    closeList();
    html += `<p>${line.replace(/^#+\s*/, "")}</p>`;
  }
  closeList();

  if (impact) {
    html += `<p><strong>Estimated Impact:</strong><br>${IMPACT_BADGES[impact]}</p>`;
  }
  return html;
}

function addMessage(role, html) {
  const msg = document.createElement("div");
  msg.className = `msg ${role}`;
  msg.innerHTML = `
    <div class="m-avatar">${role === "bot" ? "🌱" : "🙂"}</div>
    <div class="bubble">${html}</div>`;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return msg;
}

function showTyping() {
  const el = addMessage("bot", '<span class="typing"><i></i><i></i><i></i></span>');
  el.id = "typingMsg";
  return el;
}

function removeTyping() {
  document.getElementById("typingMsg")?.remove();
}

function greet() {
  addMessage(
    "bot",
    `<h4>👋 Hi, I'm EcoSpark!</h4>
     <p>I help you find <strong>practical, eco-friendly solutions</strong> for everyday life.
     Ask me anything about going green — or tap a quick question below to get started! 🌍</p>`
  );
}

/* ----------------------------------------------------------
   Answer engines
---------------------------------------------------------- */
async function askGemini(question) {
  chatHistory.push({ role: "user", parts: [{ text: question }] });
  if (!GEMINI_API_KEY) throw new Error("No Gemini API key configured");

  const controller = new AbortController();
  // free-tier Gemini can take 15-20s under load — abort only as a last resort
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: chatHistory.slice(-10),
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
          // skip the model's internal "thinking" pass — answers arrive
          // faster and the token budget goes to the visible reply
          thinkingConfig: { thinkingBudget: 0 },
        },
      }),
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ?? "";
    if (!text.trim()) throw new Error("Empty Gemini response");
    chatHistory.push({ role: "model", parts: [{ text }] });
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function askFallback(question) {
  const q = question.toLowerCase();
  let best = DEFAULT_ANSWER;
  let bestScore = 0;
  for (const entry of FALLBACK_ANSWERS) {
    const score = entry.keywords.reduce((n, kw) => n + (q.includes(kw) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  const impactLabel = { low: "🌱 Low Impact", medium: "🌿 Medium Impact", high: "🌳 High Impact" }[best.impact];
  return [
    best.title,
    "",
    ...best.tips.map((t) => `• ${t}`),
    "",
    `Estimated Impact: ${impactLabel}`,
    "",
    `**Environmental Benefit:** ${best.benefit}`,
  ].join("\n");
}

async function handleQuestion(question) {
  if (isThinking) return;
  isThinking = true;
  sendBtn.disabled = true;

  addMessage("user", escapeHtml(question));
  chatInput.value = "";
  showTyping();

  let reply;
  try {
    reply = await askGemini(question);
  } catch (err) {
    console.warn("Gemini unavailable, using EcoSpark's built-in knowledge:", err.message);
    // keep history consistent for future turns
    reply = askFallback(question);
    chatHistory.push({ role: "model", parts: [{ text: reply }] });
    // small delay so the typing animation feels natural
    await new Promise((r) => setTimeout(r, 700));
  }

  removeTyping();
  addMessage("bot", formatBotReply(reply));

  isThinking = false;
  sendBtn.disabled = false;
  chatInput.focus();
}

/* ----------------------------------------------------------
   Chat events
---------------------------------------------------------- */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = chatInput.value.trim();
  if (q) handleQuestion(q);
});

clearChatBtn.addEventListener("click", () => {
  chatHistory = [];
  chatWindow.innerHTML = "";
  greet();
});

// quick-question chips + category cards both carry data-question
document.querySelectorAll("[data-question]").forEach((el) => {
  el.addEventListener("click", () => {
    document.getElementById("chat").scrollIntoView({ behavior: "smooth", block: "start" });
    setTimeout(() => handleQuestion(el.dataset.question), 350);
  });
});

/* ----------------------------------------------------------
   Green Challenge generator
---------------------------------------------------------- */
let lastChallenge = -1;
challengeBtn.addEventListener("click", () => {
  let i;
  do { i = Math.floor(Math.random() * CHALLENGES.length); } while (i === lastChallenge);
  lastChallenge = i;
  const c = CHALLENGES[i];

  challengeText.classList.remove("flip");
  void challengeText.offsetWidth; // restart animation
  challengeText.classList.add("flip");
  challengeText.innerHTML = `${c.emoji} <strong>${c.text}</strong>`;
  challengeMeta.innerHTML = IMPACT_BADGES[c.impact];
});

/* ----------------------------------------------------------
   UI: navbar, mobile menu, scroll reveal, counters, leaves
---------------------------------------------------------- */
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => navbar.classList.toggle("scrolled", window.scrollY > 10), { passive: true });

const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");
hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("open");
  navLinks.classList.toggle("open");
});
navLinks.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    hamburger.classList.remove("open");
    navLinks.classList.remove("open");
  })
);

// scroll-reveal animations
const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
  { threshold: 0.12 }
);
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// animated counters in the hero
function animateCounter(el) {
  const target = +el.dataset.count;
  const duration = 1400;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      animateCounter(e.target);
      counterObserver.unobserve(e.target);
    }
  });
});
document.querySelectorAll("[data-count]").forEach((el) => counterObserver.observe(el));

// gentle falling leaves in the background
(function spawnLeaves() {
  const container = document.getElementById("leaves");
  if (!container || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const icons = ["🍃", "🌿", "🍂"];
  const count = innerWidth < 720 ? 6 : 10;
  for (let i = 0; i < count; i++) {
    const leaf = document.createElement("span");
    leaf.className = "leaf";
    leaf.textContent = icons[i % icons.length];
    leaf.style.left = `${Math.random() * 100}%`;
    leaf.style.fontSize = `${13 + Math.random() * 12}px`;
    leaf.style.animationDuration = `${11 + Math.random() * 12}s`;
    leaf.style.animationDelay = `${-Math.random() * 20}s`;
    container.appendChild(leaf);
  }
})();

/* ---------------------------------------------------------- */
greet();

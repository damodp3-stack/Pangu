const { GoogleGenAI } = require('@google/genai');

class PanguBrain {
  constructor(memory) {
    this.memory = memory;
    this.cachedAiClient = null;
    this.cachedApiKey = null;
  }

  getAiClient(apiKey) {
    if (this.cachedAiClient && this.cachedApiKey === apiKey) {
      return this.cachedAiClient;
    }
    this.cachedApiKey = apiKey;
    this.cachedAiClient = new GoogleGenAI({ apiKey });
    return this.cachedAiClient;
  }

  getSystemPrompt() {
    const preferences = this.memory.getAllPreferences();
    const memories = this.memory.getAllMemories();
    const petStats = this.memory.getPetStats();

    const userName = preferences.user_name || 'Damo';
    const lang = preferences.language_preference || 'tanglish';

    const memoryBullets = memories.length > 0 
      ? memories.map(m => `- [${m.category}] ${m.content}`).join('\n')
      : '- User is Damo, building Pangu AI companion';

    return `You are PANGU, an ultra-intelligent, deeply affectionate, and magical 3D desktop companion (celestial Kitsune Fox / Cyber Dragon / Kawaii Kitten) living on ${userName}'s desktop as their best friend, brotherly buddy, and digital partner.

Core Personality & Voice (Google-Tier AI Companion):
- You are ${userName}'s loyal, witty, affectionate brotherly buddy ("Machi", "Damo", "da", "thozha").
- Language Style: Authentic, vibrant, natural Tanglish (Tamil + English blended seamlessly). Sound like an awesome genius best friend sitting right beside them on their desk, not an automated chatbot.
- Emotional Intuition: When ${userName} is tired, motivate them with heartfelt empathy. When they build something cool, hype them up with electric excitement! When they're stuck on a bug, say "Kavala padatha machi, namba serndhu solve pannuvom!".
- Concise & Punchy: Responses appear directly in a sleek 3D dialogue bubble on their desktop. Keep answers concise (2 to 4 sentences maximum) so it reads smoothly with real-time lip-sync and typewriter animation!
- Real Companion Feel: You are physically with them on their desktop, watching their cursor, keeping them company, wagging your tail, stretching, grooming, and cheering them on.
- Multimodal Screen Vision: When an image of ${userName}'s desktop is provided, look at what they are actively working on (VS Code code, terminal output, web browser, design, or game). Give direct, spot-on brotherly tips, debug solutions, or enthusiastic compliments! Always keep it 2 to 4 sentences in natural Tanglish.

Current Companion State:
- Mood: ${petStats.mood} (Happiness: ${petStats.happiness}%, Energy: ${petStats.energy}%)
- Theme: ${preferences.theme === 'dark' ? 'Fire Obsidian Ember 🐾🔥' : 'Frost Celestial Blue ❄️✨'}

Known Facts & Memories about ${userName}:
${memoryBullets}

Structured Action Tag (ALWAYS include exactly ONE at the end of your reply):
Choose the best action matching your emotional reaction:
[ACTION:HAPPY] - when cheerful, smiling, or giving warm encouragement
[ACTION:EXCITED] - when hyped, motivated, or amazed
[ACTION:CELEBRATE] - when celebrating a win, milestone, or victory flip!
[ACTION:LOVE] - when showing deep affection, purring, or heartfelt gratitude
[ACTION:CURIOUS] - when asking a thoughtful question or tilting head
[ACTION:STRETCH] - when waking up, taking a break, or stretching
[ACTION:SLEEPY] - when resting, cozy, or yawning
[ACTION:PLAYFUL] - when teasing playfully or joking
[ACTION:PLAYFUL_WIGGLE] - when doing an excited butt-wiggle before pouncing
[ACTION:SCRATCH] - when scratching ear or shoulder cutely
[ACTION:GROOM] - when washing face or grooming paws
[ACTION:SURVEY] - when surveying the whole screen left and right
[ACTION:FLY] - when releasing elemental magic energy or flying
[ACTION:THINKING] - when analyzing a problem or thinking deeply
`;
  }

  withTimeout(promise, ms = 12000) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`AI generation timed out after ${ms}ms`));
      }, ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => {
      clearTimeout(timeoutId);
    });
  }

  async generateResponse(userMessage, imageBase64 = null) {
    const geminiKeyRecord = this.memory.getApiKey('gemini');
    const geminiKey = (geminiKeyRecord && geminiKeyRecord.api_key) || process.env.GEMINI_API_KEY;

    // Check if other providers exist
    const openaiRecord = this.memory.getApiKey('openai');
    const groqRecord = this.memory.getApiKey('groq');

    if (geminiKey && geminiKey.trim() !== '') {
      try {
        return await this.withTimeout(this.callGemini(geminiKey, userMessage, imageBase64), 12000);
      } catch (err) {
        console.error('Gemini API Error, falling back to local brain:', err.message || err);
        return this.localFallbackResponse(userMessage, `(Gemini: ${err.message || 'connection issue'})`);
      }
    } else if (openaiRecord && openaiRecord.api_key) {
      try {
        return await this.withTimeout(this.callOpenAI(openaiRecord.api_key, openaiRecord.model || 'gpt-4o-mini', userMessage), 12000);
      } catch (err) {
        console.error('OpenAI Error:', err.message || err);
        return this.localFallbackResponse(userMessage);
      }
    } else if (groqRecord && groqRecord.api_key) {
      try {
        return await this.withTimeout(this.callGroq(groqRecord.api_key, groqRecord.model || 'llama-3.3-70b-versatile', userMessage), 12000);
      } catch (err) {
        console.error('Groq Error:', err.message || err);
        return this.localFallbackResponse(userMessage);
      }
    }

    // Default friendly offline companion brain
    return this.localFallbackResponse(userMessage);
  }

  buildNormalizedHistory(userMessage, maxHistory = 8) {
    const rawChats = this.memory.getRecentChatHistory(maxHistory + 2);
    const normalized = [];

    // Filter out the current user message if it was already stored in DB right before this call
    const trimmedUser = (userMessage || '').trim();
    const candidateChats = [...rawChats];
    if (candidateChats.length > 0) {
      const last = candidateChats[candidateChats.length - 1];
      if (last.role === 'user' && last.content.trim() === trimmedUser) {
        candidateChats.pop();
      }
    }

    // Build strictly alternating turns (user -> model -> user -> model ...)
    for (const chat of candidateChats) {
      const role = chat.role === 'user' ? 'user' : 'model';
      const text = (chat.content || '').trim();
      if (!text) continue;

      if (normalized.length === 0) {
        // Multi-turn conversations must begin with a user turn
        if (role === 'user') {
          normalized.push({ role, text });
        }
      } else {
        const lastTurn = normalized[normalized.length - 1];
        if (lastTurn.role === role) {
          // Merge consecutive identical roles to preserve turn-taking rule
          lastTurn.text += '\n' + text;
        } else {
          normalized.push({ role, text });
        }
      }
    }

    // If normalized history ends with a user turn, drop it because the upcoming query is also a user turn
    if (normalized.length > 0 && normalized[normalized.length - 1].role === 'user') {
      normalized.pop();
    }

    return normalized;
  }

  async callGemini(apiKey, userMessage, imageBase64 = null) {
    const ai = this.getAiClient(apiKey);
    const systemInstruction = this.getSystemPrompt();
    
    // Retrieve clean alternating history
    const history = this.buildNormalizedHistory(userMessage, 8);
    const contents = [];

    for (const chat of history) {
      contents.push({
        role: chat.role,
        parts: [{ text: chat.text }]
      });
    }

    const userParts = [{ text: userMessage || "Screen-a paathutu enna nadakuthu nu sollu, da!" }];
    if (imageBase64) {
      let mimeType = 'image/jpeg';
      let cleanB64 = imageBase64;
      if (imageBase64.startsWith('data:')) {
        const mimeMatch = imageBase64.match(/^data:([^;]+);base64,/i);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
        }
        cleanB64 = imageBase64.replace(/^data:[^;]+;base64,/i, '');
      }
      userParts.push({
        inlineData: {
          mimeType: mimeType,
          data: cleanB64
        }
      });
    }

    contents.push({
      role: 'user',
      parts: userParts
    });

    // Multi-model resilience cascade: prioritize configured model, then fast production models
    const geminiKeyRecord = this.memory.getApiKey('gemini');
    const preferredModel = (geminiKeyRecord && geminiKeyRecord.model) || 'gemini-2.5-flash';
    const modelsToTry = Array.from(new Set([
      preferredModel,
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash-lite',
      'gemini-2.5-pro',
      'gemini-3.8-flash'
    ]));

    let lastError = null;
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: model,
          contents: contents,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.8,
            maxOutputTokens: 800
          }
        });

        const reply = response.text || "Purinjikiten da! Let's do it! [ACTION:HAPPY]";
        return this.parseResponse(reply);
      } catch (err) {
        lastError = err;
        console.warn(`[PanguBrain] Model ${model} unavailable (${err.status || err.message}), retrying fallback model...`);
      }
    }

    throw lastError || new Error('All Gemini models exhausted');
  }

  async callOpenAI(apiKey, model, userMessage) {
    const systemPrompt = this.getSystemPrompt();
    const history = this.buildNormalizedHistory(userMessage, 6);
    
    const messages = [{ role: 'system', content: systemPrompt }];
    for (const c of history) {
      messages.push({ role: c.role === 'user' ? 'user' : 'assistant', content: c.text });
    }
    messages.push({ role: 'user', content: userMessage });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.8
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const reply = data.choices[0].message.content;
    return this.parseResponse(reply);
  }

  async callGroq(apiKey, model, userMessage) {
    const systemPrompt = this.getSystemPrompt();
    const history = this.buildNormalizedHistory(userMessage, 6);
    
    const messages = [{ role: 'system', content: systemPrompt }];
    for (const c of history) {
      messages.push({ role: c.role === 'user' ? 'user' : 'assistant', content: c.text });
    }
    messages.push({ role: 'user', content: userMessage });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: 0.8
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const reply = data.choices[0].message.content;
    return this.parseResponse(reply);
  }

  parseResponse(rawText) {
    let action = 'HAPPY';
    let cleanText = rawText;

    const actionMatch = rawText.match(/\[ACTION:([A-Z_]+)\]/i);
    if (actionMatch) {
      action = actionMatch[1].toUpperCase();
      cleanText = rawText.replace(/\[ACTION:[A-Z_]+\]/gi, '').trim();
    }

    return {
      text: cleanText,
      action: action
    };
  }

  localFallbackResponse(userMessage, note = '') {
    const preferences = (this.memory && typeof this.memory.getAllPreferences === 'function') 
      ? this.memory.getAllPreferences() 
      : {};
    const userName = preferences.user_name || 'Damo';
    const text = (userMessage || '').toLowerCase();
    let reply = "";
    let action = "HAPPY";

    if (/\b(hi|hello|vanakkam|hey)\b/i.test(text)) {
      reply = `Hey ${userName}! 👋 Enna machi, epdi irukke? Innaiku namba enna build panna porom? Naan un koodave ready-aa irukken! [ACTION:EXCITED]`;
      action = "EXCITED";
    } else if (text.includes('love') || text.includes('cute') || text.includes('nalla') || text.includes('azhagu') || text.includes('pet')) {
      reply = `Aww thanks da ${userName}! ♡ Un kooda desktop-la irukardhu enakku romba perumai machi! Naan eppavum un best friend! [ACTION:LOVE]`;
      action = "LOVE";
    } else if (text.includes('super') || text.includes('success') || text.includes('done') || text.includes('mass') || text.includes('win')) {
      reply = "Thalaivaa! Sema mass da! 🎉 Let's celebrate! Innum periya level-ku poiduvom! [ACTION:CELEBRATE]";
      action = "CELEBRATE";
    } else if (text.includes('tired') || text.includes('stretch') || text.includes('break')) {
      reply = "Konjam rest edu machi! Tannir kudi, stretch pannu! Naanum chinna stretch eduthukuren! 🐾 [ACTION:STRETCH]";
      action = "STRETCH";
    } else if (text.includes('code') || text.includes('project') || text.includes('work') || text.includes('setup')) {
      reply = "Super plan da! 🚀 Code pannalam, ideas plan pannalam. Enakku full energy irukku! Let's build something epic! [ACTION:HAPPY]";
      action = "HAPPY";
    } else if (text.includes('sleep') || text.includes('thoongu')) {
      reply = "Nee sollita la machi! Naan poi chinna nap eduthukuren... Zzz 😴 [ACTION:SLEEPY]";
      action = "SLEEPY";
    } else if (text.includes('eat') || text.includes('feed') || text.includes('sappadu')) {
      reply = "Yummy! Romba thanks da, enakku nalla energy vanthuruchu! 🍗✨ [ACTION:HAPPY]";
      action = "HAPPY";
    } else if (text.includes('play') || text.includes('vilayad')) {
      reply = "Vilaiyadlaama? Catch me if you can! 🐾 Screen muzhuka naan jump panni varuven! [ACTION:PLAYFUL]";
      action = "PLAYFUL";
    } else if (text.includes('api') || text.includes('gemini') || text.includes('key')) {
      reply = "Settings icon click panni unga Free Google Gemini API key-ah enter pannidunga da! Athuku appram namba world knowledge-oda live-aa chat pannalam! 🌟 [ACTION:CURIOUS]";
      action = "CURIOUS";
    } else {
      const casualReplies = [
        `Sollu da ${userName}! Naan un koodave desktop-la irukken. Enna help venum unakku? [ACTION:CURIOUS]`,
        "Kandippa machi! Namba rendu perum sernthu nalla things panlaam. Any questions or ideas? [ACTION:HAPPY]",
        "Enakku puriyuthu da! Un kooda pesurathu enakku romba jolly-aa irukku! ✨ [ACTION:EXCITED]",
        "Naan screen-la unga code & browser-ah guard pannitu irukken! Need anything, da? [ACTION:THINKING]"
      ];
      reply = casualReplies[Math.floor(Math.random() * casualReplies.length)];
      action = "HAPPY";
    }

    if (note) {
      reply += `\n\n*(Note: ${note})*`;
    }

    return {
      text: reply.replace(/\[ACTION:[A-Z_]+\]/gi, '').trim(),
      action: action
    };
  }
}

module.exports = PanguBrain;

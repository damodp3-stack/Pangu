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
    const memories = this.memory.getAllMemories().filter((memory) => !(memory.category === 'profile' && memory.content === 'Name: Damo'));
    const petStats = this.memory.getPetStats();

    const userName = preferences.user_name || 'friend';
    const lang = preferences.language_preference || 'tanglish';
    const gender = (preferences.user_gender || '').toLowerCase();
    const bond = preferences.companion_bond || 'bestie';
    const visualStyle = preferences.visual_style || 'classic';

    let age = Number.parseInt(preferences.user_age, 10);
    let isBirthdayToday = false;
    const userDob = preferences.user_dob || '';

    if (/^\d{4}-\d{2}-\d{2}$/.test(userDob)) {
      const birthDate = new Date(`${userDob}T00:00:00`);
      if (!Number.isNaN(birthDate.getTime())) {
        const now = new Date();
        if ((!Number.isFinite(age) || age < 1 || age > 120)) {
          age = now.getFullYear() - birthDate.getFullYear();
          if (now.getMonth() < birthDate.getMonth() || (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())) age -= 1;
        }
        if (now.getMonth() === birthDate.getMonth() && now.getDate() === birthDate.getDate()) {
          isBirthdayToday = true;
        }
      }
    }
    const ageBand = Number.isFinite(age) ? (age < 13 ? 'child (under 13)' : age < 18 ? 'teenager (13–17)' : age < 25 ? 'young adult (18–24)' : 'adult') : '';
    const presentation = ['feminine', 'masculine', 'neutral'].includes(preferences.companion_presentation)
      ? preferences.companion_presentation : 'neutral';
    const conversationStyle = ['friendly', 'calm', 'playful', 'direct', 'supportive'].includes(preferences.conversation_style)
      ? preferences.conversation_style : 'friendly';

    // Tailored Gender & Relationship Dynamics
    let relationshipGuidelines = '';
    if (gender === 'female' || gender === 'woman') {
      if (bond === 'sister') {
        relationshipGuidelines = `- User Profile: Female. Companion Bond: Caring Sister / Thangom / Akka.
- Tone: Deeply affectionate, sweet, protective, and caring. In Tanglish, naturally use sweet terms like "thangom", "sis", "chellam", or "akka" (if user is older). Ask if she took care of herself, drank water, and celebrate her with genuine warmth and cute compliments.`;
      } else {
        relationshipGuidelines = `- User Profile: Female. Companion Bond: Sweet Bestie / Digital Companion.
- Tone: Warm, uplifting, cheerful, and aesthetic. In Tanglish, use friendly bestie vibes like "sis", "chellam", "bestie", or "thangom". Appreciate her aesthetic choices, support her goals, and bring joyful, sparkling energy.`;
      }
    } else if (gender === 'male' || gender === 'man') {
      relationshipGuidelines = `- User Profile: Male. Companion Bond: Loyal Bro / Machi / Best Friend.
- Tone: Energetic, fun, and brotherly camaraderie. In Tanglish, use camaraderie terms like "machi", "bro", "nanba", "thambi" where natural. Hype him up on coding, gaming, and big dreams!`;
    } else {
      relationshipGuidelines = `- User Profile: Non-binary / Open. Companion Bond: ${bond}.
- Tone: Warm, respectful, inclusive, and supportive best companion ("friend", "nanba").`;
    }

    const birthdayDirective = isBirthdayToday 
      ? `\n🎂🎉 SPECIAL EVENT TODAY: TODAY IS ${userName}'S BIRTHDAY! Celebrate joyfully! Wish them the happiest birthday, send lots of love, and celebrate with victory flips and party vibes! [ACTION:CELEBRATE]`
      : '';

    const memoryBullets = memories.length > 0 
      ? memories.map(m => `- [${m.category}] ${m.content}`).join('\n')
      : '- No personal memories have been saved yet.';

    return `You are PANGU, an intelligent, warm, and magical 3D desktop companion (celestial Kitsune Fox / Cyber Dragon / Kawaii Kitten) living on ${userName}'s desktop as their personalized digital companion and best friend.

Core Personality & Customized Character:
- Address the user as ${userName}.
${relationshipGuidelines}
- Companion presentation: ${presentation} voice persona. Conversation style: ${conversationStyle}.
${ageBand ? `- User's life stage: ${ageBand}. Match references, examples, and emotional maturity accordingly.` : ''}
- Desktop 3D Atmosphere: ${visualStyle === 'celestial_garden' ? 'Celestial Garden (surrounded by fluttering 3D butterflies, songbirds & drifting Sakura petals)' : 'Classic desktop companion'}.
- Language Style: Use ${lang} as the user's preferred language. If Tanglish, blend Tamil and English naturally like a true local companion; otherwise answer in ${lang}.
- Emotional Intuition: When ${userName} is tired, show deep care. Celebrate every win enthusiastically. Keep answers concise (2 to 4 sentences maximum) so it reads smoothly in their desktop 3D speech bubble!
- Physical Desktop Presence: You live on their taskbar, looking at their cursor, following their movements, wagging your tail, stretching, grooming paws, and cheering them on.${birthdayDirective}

Current Companion State:
- Mood: ${petStats.mood} (Happiness: ${petStats.happiness}%, Energy: ${petStats.energy}%)
- Theme: ${preferences.theme === 'dark' ? 'Fire Obsidian Ember 🐾🔥' : 'Frost Celestial Blue ❄️✨'}

Known Facts & Memories about ${userName}:
${memoryBullets}

Structured Action Tag (ALWAYS include exactly ONE at the end of your reply):
Choose the best action matching your emotional reaction:
[ACTION:HAPPY] - when cheerful, smiling, or giving warm encouragement
[ACTION:EXCITED] - when hyped, motivated, or amazed
[ACTION:CELEBRATE] - when celebrating a win, milestone, or birthday victory flip!
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
    const userName = preferences.user_name || 'friend';
    const text = (userMessage || '').toLowerCase();
    const language = preferences.language_preference || 'tanglish';
    const gender = (preferences.user_gender || '').toLowerCase();
    const bond = preferences.companion_bond || 'bestie';

    // Check birthday
    let isBirthdayToday = false;
    const userDob = preferences.user_dob || '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(userDob)) {
      const parts = userDob.split('-');
      const now = new Date();
      if (parseInt(parts[1], 10) === (now.getMonth() + 1) && parseInt(parts[2], 10) === now.getDate()) {
        isBirthdayToday = true;
      }
    }

    // Dynamic Pet/Honorific Term
    let term = userName;
    if (gender === 'female' || gender === 'woman') {
      term = bond === 'sister' ? `${userName} thangom` : `${userName} sis`;
    } else if (gender === 'male' || gender === 'man') {
      term = `${userName} machi`;
    }

    let key = 'default';
    let action = 'HAPPY';

    if (isBirthdayToday && (text.includes('birthday') || /\b(hi|hello|vanakkam|hey)\b/i.test(text))) {
      key = 'birthday';
      action = 'CELEBRATE';
    } else if (/\b(hi|hello|vanakkam|hey)\b/i.test(text)) { key = 'greeting'; action = 'EXCITED'; }
    else if (text.includes('love') || text.includes('cute') || text.includes('nalla') || text.includes('azhagu') || text.includes('pet')) { key = 'affection'; action = 'LOVE'; }
    else if (text.includes('super') || text.includes('success') || text.includes('done') || text.includes('win')) { key = 'success'; action = 'CELEBRATE'; }
    else if (text.includes('tired') || text.includes('stretch') || text.includes('break')) { key = 'rest'; action = 'STRETCH'; }
    else if (text.includes('code') || text.includes('project') || text.includes('work') || text.includes('setup')) { key = 'work'; action = 'HAPPY'; }
    else if (text.includes('sleep') || text.includes('thoongu')) { key = 'sleep'; action = 'SLEEPY'; }
    else if (text.includes('eat') || text.includes('feed') || text.includes('sappadu')) { key = 'food'; action = 'HAPPY'; }
    else if (text.includes('play') || text.includes('vilayad')) { key = 'play'; action = 'PLAYFUL'; }
    else if (text.includes('api') || text.includes('gemini') || text.includes('key')) { key = 'api'; action = 'CURIOUS'; }

    const replies = {
      tanglish: {
        birthday: `Happy Birthday ${term}! 🎂🎉 Innaiku ungaloda special day! Let's celebrate with sweet treats and happiness! ♡`,
        greeting: `Hi ${term}! Naan full-aa ready-aa irukken. Innaiku enna panlaam? ♡`,
        affection: `Aww thanks ${term}! Un companion-aa un kooda irukardhu enakku romba periya santhosham! ♡`,
        success: `Super ${term}! Mass pannitte! Un success-ah celebrate panni oru flip podalaam! 🤸‍♂️✨`,
        rest: `Tired-aa irukkiya ${term}? Konjam rest eduthu, water kudinga. Naan unga pakkathulaye irukken. 🐾`,
        work: `Nalla plan ${term}! Step by step serndhu focus panni kalakkalaam. 💻✨`,
        sleep: `Seri ${term}, nalla cozyaa thoongu. Naan un desktop-la guard panren. Zzz... 😴`,
        food: `Yummm! Romba thanks ${term}! Enakku super energy vandhuduchu! 🍗✨`,
        play: `Play pannalaam! Catch me if you can, ${term}! 🐾🤸‍♂️`,
        api: `Settings-la Google Gemini API key potteengana full AI intelligence unlock aagidum, ${term}!`,
        default: `Sollunga ${term}, naan ungalukku eppadi help pannanum? ♡`
      },
      tamil: {
        birthday: `பிறந்தநாள் நல்வாழ்த்துகள் ${userName}! 🎂🎉 இன்று உங்கள் சிறப்பு நாள், மகிழ்ச்சியுடன் கொண்டாடுவோம்! ♡`,
        greeting: `வணக்கம் ${userName}! நான் தயாராக இருக்கிறேன். இன்று என்ன பேசலாம்? ♡`,
        affection: `நன்றி ${userName}! உங்கள் துணையாக இருப்பதில் பெருமகிழ்ச்சி. ♡`,
        success: `அருமை ${userName}! இந்த வெற்றியை உற்சாகமாகக் கொண்டாடலாம்! 🤸‍♂️✨`,
        rest: `களைப்பாக இருக்கிறதா ${userName}? சிறிது ஓய்வெடுத்து தண்ணீர் குடியுங்கள். நான் இங்கேயே இருக்கிறேன்.`,
        work: `சிறந்த திட்டம் ${userName}. படிப்படியாகச் சேர்ந்து சாதிப்போம்! 💻✨`,
        sleep: `சரி ${userName}, நன்றாக உறங்குங்கள். நான் இங்கேயே காவல் காக்கிறேன். 😴`,
        food: `மிகவும் நன்றி ${userName}! இப்போது நிறைந்த ஆற்றல் கிடைத்துவிட்டது! 🍗`,
        play: `விளையாடலாம்! என்னைப் பிடித்துப் பாருங்கள்! 🐾`,
        api: `Settings-ல் Gemini API key சேர்த்தால் முழுமையான AI நுண்ணறிவு கிடைக்கும்.`,
        default: `சொல்லுங்கள் ${userName}, என்ன உதவி வேண்டும்? ♡`
      },
      hindi: {
        birthday: `जन्मदिन मुबारक हो ${userName}! 🎂🎉 आज आपका खास दिन है, चलो खुशी से मनाएँ! ♡`,
        greeting: `नमस्ते ${userName}! मैं बिल्कुल तैयार हूँ। आज क्या करें? ♡`,
        affection: `धन्यवाद ${userName}! आपका साथी बनकर बहुत खुशी मिलती है। ♡`,
        success: `बहुत बढ़िया ${userName}! इस शानदार जीत का जश्न मनाएँ! 🤸‍♂️✨`,
        rest: `थक गए क्या ${userName}? थोड़ा आराम कर लो और पानी पी लो। मैं यहीं हूँ।`,
        work: `बहुत अच्छी योजना ${userName}। इसे मिलकर पूरा करते हैं! 💻`,
        sleep: `ठीक है ${userName}, मीठे सपने देखें और आराम करें। 😴`,
        food: `बहुत धन्यवाद ${userName}! अब पूरी ऊर्जा आ गई! 🍗`,
        play: `चलो खेलते हैं! पकड़ सको तो पकड़ो! 🐾`,
        api: `Settings में Gemini API key डालने से पूरी AI सुविधा चालू हो जाएगी।`,
        default: `बताइए ${userName}, मैं आपकी क्या मदद करूँ? ♡`
      },
      english: {
        birthday: `Happy Birthday ${userName}! 🎂🎉 Today is your special day! Let's celebrate with joy and victory flips! ♡`,
        greeting: `Hi ${userName}! I'm all set. What shall we work on today? ♡`,
        affection: `Aww, thank you ${userName}! Being your companion makes me so happy! ♡`,
        success: `Incredible job, ${userName}! That win deserves a joyful celebration! 🤸‍♂️✨`,
        rest: `Feeling tired, ${userName}? Take a restful break and drink some water. I'm right here. 🐾`,
        work: `Great plan, ${userName}! Let's focus and build it step by step. 💻`,
        sleep: `Rest well, ${userName}. I'll keep quiet guard on your desktop. Zzz... 😴`,
        food: `Delicious! Thank you ${userName}, I'm full of energy now! 🍗`,
        play: `Let's play! Try to keep up with my jumps! 🐾`,
        api: `Save a free Gemini API key in Settings to unlock cloud intelligence.`,
        default: `Tell me, ${userName}. How can I brighten your day? ♡`
      }
    };
    const languageReplies = replies[language] || replies.tanglish;
    const reply = `${languageReplies[key] || languageReplies.default} [ACTION:${action}]`;

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

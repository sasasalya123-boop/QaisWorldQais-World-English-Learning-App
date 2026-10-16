const OpenAI = require('openai');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      error: 'Method not allowed',
      reply: 'Please use POST to talk to Buddy.'
    });
  }

  const body = req.body || {};
  const text = String(body.text || '').trim();
  const context = typeof body.context === 'string' ? body.context : JSON.stringify(body.context || {});

  if (!text) {
    return res.status(400).json({
      ok: false,
      error: 'Empty message',
      reply: 'Please say or type a short sentence like: Hello or What is this?'
    });
  }

  if (text.length > 220) {
    return res.status(400).json({
      ok: false,
      error: 'Message too long',
      reply: 'Keep your message short and friendly. Try: Hello! or I like apples.'
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const offlineReply = `Nice! Let's keep practicing. Try a short sentence like: "Hello!" or "What is this?"`;
    return res.json({
      ok: true,
      mode: 'offline',
      reply: offlineReply
    });
  }

  try {
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.7,
      max_tokens: 180,
      messages: [
        {
          role: 'system',
          content: `You are Buddy, a kind English learning robot for children. Speak in very simple English. Use short sentences. Encourage the child kindly. If they speak in Arabic, answer with a little Arabic and simple English. Keep it warm, safe, playful, and suitable for children. Lesson context: ${context}`
        },
        {
          role: 'user',
          content: text
        }
      ]
    });

    const answer = completion?.choices?.[0]?.message?.content || 'Let us practice together!';

    return res.json({
      ok: true,
      mode: 'openai',
      reply: answer.trim()
    });
  } catch (error) {
    console.error('Buddy API error:', error?.message || error);
    return res.status(500).json({
      ok: false,
      error: 'OpenAI request failed',
      reply: 'I am still learning with you. Try a shorter sentence or press the microphone again.'
    });
  }
};

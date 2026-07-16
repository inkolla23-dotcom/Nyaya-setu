import pool from '../config/db.js';
import { analyzeProblem, checkDocument, explainHearing, explainWhatNext } from '../services/aiService.js';
import crypto from 'crypto';

// ─── Helper: user-friendly error — never expose provider internals ────────────
function classifyError(err) {
  const msg = (err?.message || String(err)).toLowerCase();

  // All providers exhausted (transient — rate limit, quota, network, overload)
  if (
    msg.includes('quota')               ||
    msg.includes('rate limit')          ||
    msg.includes('too many requests')   ||
    msg.includes('resource_exhausted')  ||
    msg.includes('resource exhausted')  ||
    msg.includes('service unavailable') ||
    msg.includes('overloaded')          ||
    msg.includes('capacity')           ||
    msg.includes('timeout')            ||
    msg.includes('network')            ||
    msg.includes('econnreset')         ||
    msg.includes('enotfound')          ||
    msg.includes('socket hang up')     ||
    msg.includes('all ai providers')   ||
    err?.status === 429                 ||
    err?.status === 503
  ) {
    return {
      error: 'The AI service is temporarily busy. Retrying automatically... Please try again in a moment.',
      details: null  // Never expose provider-level details to the user
    };
  }

  // No API keys configured at all
  if (msg.includes('ai_not_configured') || msg.includes('api key')) {
    return {
      error: 'Nyaya Setu AI is not configured. Please contact support.',
      details: null
    };
  }

  // Invalid key
  if (msg.includes('invalid') && msg.includes('key')) {
    return {
      error: 'Nyaya Setu AI is not configured. Please contact support.',
      details: null
    };
  }

  // Generic fallback — still friendly
  return {
    error: 'Nyaya Setu AI is processing your request. Please try again in a moment.',
    details: null
  };
}


// ─── POST /api/copilot/chat ───────────────────────────────────────────────────
export async function chatCopilot(req, res) {
  // Generate a unique request ID to track this request end-to-end
  const requestId = crypto.randomBytes(6).toString('hex');

  const { message, language } = req.body;
  const userId = req.user?.id;
  const lang = (language || 'en').toLowerCase();

  // ── Log exact request received ──────────────────────────────────────────────
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`[REQUEST RECEIVED] RequestID: ${requestId}`);
  console.log(`[REQUEST RECEIVED] User ID: ${userId}`);
  console.log(`[REQUEST RECEIVED] Message: "${message}"`);
  console.log(`[REQUEST RECEIVED] Language param: ${lang}`);
  console.log(`[REQUEST RECEIVED] Provider: ${process.env.AI_PROVIDER || 'gemini'} | Model: ${process.env.AI_MODEL || 'gemini-2.5-flash'}`);

  if (!message || message.trim() === '') {
    return res.status(400).json({ success: false, error: 'Message is required', requestId });
  }

  const startTime = Date.now();

  try {
    // ── Load conversation history (last 3 exchanges = 6 rows max) ─────────────
    const [rows] = await pool.query(
      'SELECT message, response FROM ai_chat_history WHERE user_id = ? ORDER BY id DESC LIMIT 6',
      [userId]
    );

    // Reverse so oldest first, then build alternating user/assistant pairs
    const history = [];
    for (const row of [...rows].reverse()) {
      if (row.message && row.message.trim()) {
        history.push({ role: 'user', content: row.message });
      }
      if (row.response) {
        try {
          const resp = typeof row.response === 'string' ? JSON.parse(row.response) : row.response;
          const assistantText = resp.reply || resp.explanation || '';
          if (assistantText.trim()) {
            history.push({ role: 'assistant', content: assistantText });
          }
        } catch (_) {}
      }
    }

    console.log(`[REQUEST RECEIVED] History entries loaded: ${history.length}`);
    if (history.length > 0) {
      console.log(`[REQUEST RECEIVED] Last history message: "${history[history.length - 1]?.content?.substring(0, 80)}"`);
    }

    // ── Call AI service ───────────────────────────────────────────────────────
    const analysis = await analyzeProblem(message.trim(), lang, history, requestId);

    const elapsed = Date.now() - startTime;
    console.log(`[RESPONSE COMPLETE] RequestID: ${requestId} | Time: ${elapsed}ms | Category: ${analysis.category}`);

    // ── Persist to history ────────────────────────────────────────────────────
    try {
      await pool.query(
        'INSERT INTO ai_chat_history (user_id, message, response) VALUES (?, ?, ?)',
        [userId, message.trim(), JSON.stringify(analysis)]
      );
    } catch (dbErr) {
      console.warn(`[DB WARN] Could not save chat history: ${dbErr.message}`);
    }

    return res.json(analysis);

  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`[AI ERROR] RequestID: ${requestId} | Failed after ${elapsed}ms: ${error.message}`);
    const { error: errMsg, details } = classifyError(error);
    return res.status(200).json({ success: false, error: errMsg, details, requestId });
  }
}

// ─── GET /api/ai/chat/history ─────────────────────────────────────────────────
export async function getChatHistory(req, res) {
  const userId = req.user?.id;
  try {
    const [rows] = await pool.query(
      'SELECT id, message, response, created_at FROM ai_chat_history WHERE user_id = ? ORDER BY id ASC',
      [userId]
    );

    const formatted = rows.map(h => {
      let resp = {};
      try { resp = typeof h.response === 'string' ? JSON.parse(h.response) : h.response; }
      catch (_) { resp = { explanation: h.response }; }
      return { id: h.id, message: h.message, response: resp, createdAt: h.created_at };
    });

    res.json(formatted);
  } catch (error) {
    console.error('[DB ERROR] getChatHistory:', error);
    res.status(500).json({ error: 'Server error fetching chat history' });
  }
}

// ─── POST /api/ai/chat/clear ──────────────────────────────────────────────────
export async function clearChatHistory(req, res) {
  const userId = req.user?.id;
  try {
    await pool.query('DELETE FROM ai_chat_history WHERE user_id = ?', [userId]);
    res.json({ success: true, message: 'Chat history cleared successfully' });
  } catch (error) {
    console.error('[DB ERROR] clearChatHistory:', error);
    res.status(500).json({ error: 'Failed to clear chat history' });
  }
}

// ─── POST /api/ai/check-doc ───────────────────────────────────────────────────
export async function checkDocDirect(req, res) {
  const { fileName, fileType, textContent, language } = req.body;
  try {
    const result = await checkDocument(fileName, fileType, textContent || '', language || 'en');
    res.json(result);
  } catch (error) {
    console.error('[AI ERROR] checkDocDirect:', error);
    const { error: errMsg, details } = classifyError(error);
    res.status(200).json({ success: false, error: errMsg, details });
  }
}

// ─── POST /api/ai/explain-hearing ─────────────────────────────────────────────
export async function explainHearingDirect(req, res) {
  const { legaleseText, language } = req.body;
  if (!legaleseText) return res.status(400).json({ error: 'legaleseText is required' });
  try {
    const explanation = await explainHearing(legaleseText, language || 'en');
    res.json({ explanation });
  } catch (error) {
    console.error('[AI ERROR] explainHearingDirect:', error);
    const { error: errMsg, details } = classifyError(error);
    res.status(200).json({ success: false, error: errMsg, details });
  }
}

// ─── POST /api/ai/what-next ────────────────────────────────────────────────────
export async function whatNextDirect(req, res) {
  const { title, status, language } = req.body;
  if (!title) return res.status(400).json({ error: 'Case title is required' });
  try {
    const projection = await explainWhatNext(title, status || 'Under Review', language || 'en');
    res.json(projection);
  } catch (error) {
    console.error('[AI ERROR] whatNextDirect:', error);
    const { error: errMsg, details } = classifyError(error);
    res.status(200).json({ success: false, error: errMsg, details });
  }
}

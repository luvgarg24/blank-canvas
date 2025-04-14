require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json()); // for JSON POST bodies

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn('WARNING: GEMINI_API_KEY not set in .env! Gemini queries will not work.');
} else {
  console.log('Gemini API Key: Loaded');
}

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
console.log('Bearer Token:', BEARER_TOKEN ? 'Loaded' : 'NOT loaded');

// Helper: fetch user ID by username
async function getUserId(username) {
  const res = await fetch(`https://api.twitter.com/2/users/by/username/${username}`, {
    headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
  });
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Twitter API error:', errorText);
    throw new Error('Failed to fetch user ID');
  }
  const data = await res.json();
  return data.data && data.data.id;
}

// Gemini: fetch 2+ completions for a query
async function getGeminiAnswers(query) {
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not set');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
  const prompts = [
    query,
    query + ' (give a different perspective or bullet summary)'
  ];
  // Run both prompts in parallel
  const fetchOne = async (prompt) => {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await res.json();
    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) throw new Error('No answer from Gemini');
    return data.candidates[0].content.parts[0].text;
  };
  return await Promise.all(prompts.map(fetchOne));
}

// Gemini endpoint
app.post('/api/gemini-query', async (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Missing query' });
  }
  try {
    const answers = await getGeminiAnswers(query);
    // Return as array of cards
    res.json({
      cards: answers.map((answer, i) => ({
        title: i === 0 ? query : query + ' (alt)',
        content: answer
      }))
    });
  } catch (err) {
    console.error('Gemini error:', err);
    res.status(500).json({ error: 'Failed to get Gemini answer' });
  }
});

// Helper: fetch tweets for user ID
async function getUserTweets(userId) {
  const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=50&tweet.fields=public_metrics,created_at`;
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` }
  });
  if (!res.ok) throw new Error('Failed to fetch tweets');
  const data = await res.json();
  return data.data || [];
}

// Main endpoint
app.get('/api/top-tweets/:username', async (req, res) => {
  try {
    const username = req.params.username;
    const userId = await getUserId(username);
    if (!userId) return res.status(404).json({ error: 'User not found' });
    const tweets = await getUserTweets(userId);
    // Sort by like count, descending
    const sorted = tweets.sort((a, b) => (b.public_metrics.like_count || 0) - (a.public_metrics.like_count || 0));
    const top5 = sorted.slice(0, 5).map(t => ({
      id: t.id,
      text: t.text,
      likes: t.public_metrics.like_count,
      date: t.created_at.slice(0, 10),
      url: `https://twitter.com/${username}/status/${t.id}`
    }));
    res.json({ tweets: top5 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Twitter proxy server running on port ${PORT}`);
});

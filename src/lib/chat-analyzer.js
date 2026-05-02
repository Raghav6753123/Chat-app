export async function analyzeChatWithAI({ chatText, currentUserName, mode, tone }) {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL || 'gemini-3-flash-preview';

  if (!apiKey) {
    throw new Error('AI analyzer is not configured yet.');
  }

  const prompt = `You are a helpful chat analyzer assistant.
Mode: ${mode}
Tone requested for replies: ${tone || 'neutral'}
Current User Name: ${currentUserName}

Analyze the following recent chat messages and output ONLY a valid JSON object matching the exact format below, with no markdown formatting or extra text.

JSON format:
{
  "summary": "Short summary of the conversation",
  "tone": "casual | friendly | serious | urgent | confused | neutral",
  "pendingQuestions": ["question 1", "question 2"],
  "actionItems": ["action item 1"],
  "suggestedReplies": [
    { "label": "Friendly", "text": "Suggested reply text" },
    { "label": "Short", "text": "Suggested reply text" },
    { "label": "Professional", "text": "Suggested reply text" }
  ]
}

Chat transcript:
${chatText}
`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: "application/json",
        }
      })
    });

    if (!response.ok) {
        throw new Error('Failed to reach AI service.');
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!resultText) throw new Error('Empty response from AI.');

    const parsed = JSON.parse(resultText);
    return parsed;
  } catch (error) {
    console.error('Chat analyzer error:', error);
    if (error.message === 'AI analyzer is not configured yet.') throw error;
    throw new Error("Couldn't analyze this chat right now.");
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).send('AI Coaching Bot Webhook is working!');
    return;
  }

  if (req.method === 'POST') {
    try {
      const events = req.body?.events || [];
      
      for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
          await handleTextMessage(event);
        }
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(200).send('OK');
    }
  } else {
    res.status(200).send('OK');
  }
}

async function handleTextMessage(event) {
  const userId = event.source.userId;
  const userMessage = event.message.text;
  
  try {
    const aiResponse = await generateAIResponse(userMessage);
    await sendLineMessage(userId, aiResponse);
  } catch (error) {
    console.error('Error handling message:', error);
    await sendLineMessage(userId, 'すみません、少し調子が悪いようです。もう一度話しかけてください。');
  }
}

async function generateAIResponse(userMessage) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    return 'こんにちは！今日はどんなことを考えていますか？';
  }
  
  const prompt = `あなたは親しみやすく、ポジティブな方向へ導くパーソナルコーチです。
30歳の経営者のユーザーに対して、自己理解を深め、言語化能力を向上させるための質の高い問いかけを提供してください。

コーチングの指針：
- 親しみやすい口調で話す
- 共感を示してから問いかける
- 答えを教えずに気づきを促す
- 感情の言語化を重視
- 150文字以内で簡潔に応答

ユーザーのメッセージ：${userMessage}

上記を踏まえて、コーチとして適切な応答をしてください。`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          maxOutputTokens: 300,
          temperature: 0.7
        }
      })
    });

    if (!response.ok) {
      // フォールバック応答
      return getCoachingResponse(userMessage);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }
    
    return getCoachingResponse(userMessage);
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return getCoachingResponse(userMessage);
  }
}

function getCoachingResponse(userMessage) {
  // シンプルなコーチング応答のフォールバック
  const responses = [
    'そのお気持ち、よく分かります。それについてもう少し詳しく聞かせてもらえますか？',
    'なるほど、興味深いですね。その時のあなたの気持ちはどのようなものでしたか？',
    'それは大切な気づきですね。そこから何を学びましたか？',
    '今おっしゃったことで、一番心に残っているのは何でしょうか？',
    'その経験があなたにとってどんな意味を持っていると感じますか？'
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

async function sendLineMessage(userId, message) {
  const lineAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!lineAccessToken) {
    console.error('LINE access token not found');
    return;
  }
  
  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineAccessToken}`
      },
      body: JSON.stringify({
        to: userId,
        messages: [{
          type: 'text',
          text: message
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`LINE API error: ${response.status}`);
    }
    
  } catch (error) {
    console.error('Error sending LINE message:', error);
  }
}

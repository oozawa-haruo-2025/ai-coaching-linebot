export default async function handler(req, res) {
  // CORSヘッダーを設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  console.log('Webhook called:', req.method);

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).send('AI Coaching Bot Webhook is working!');
    return;
  }

  if (req.method === 'POST') {
    try {
      console.log('POST request received');
      console.log('Body:', JSON.stringify(req.body));
      
      const events = req.body?.events || [];
      
      for (const event of events) {
        if (event.type === 'message' && event.message.type === 'text') {
          await handleTextMessage(event);
        }
      }
      
      res.status(200).send('OK');
      return;
    } catch (error) {
      console.error('POST error:', error);
      res.status(200).send('OK');
      return;
    }
  }

  // その他のメソッドの場合
  res.status(200).send('OK');
}

// テキストメッセージの処理
async function handleTextMessage(event) {
  const userId = event.source.userId;
  const userMessage = event.message.text;
  
  console.log(`User ${userId}: ${userMessage}`);
  
  try {
    // AI応答を生成
    const aiResponse = await generateAIResponse(userMessage);
    
    // LINEに応答を送信
    await sendLineMessage(userId, aiResponse);
    
  } catch (error) {
    console.error('Error handling message:', error);
    // エラー時のフォールバック応答
    await sendLineMessage(userId, 'すみません、少し調子が悪いようです。もう一度話しかけてください。');
  }
}

// AI応答生成
async function generateAIResponse(userMessage) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiApiKey) {
    return 'こんにちは！今日はどんなことを考えていますか？';
  }
  
  const prompt = `
あなたは親しみやすく、ポジティブな方向へ導くパーソナルコーチです。
30歳の経営者のユーザーに対して、自己理解を深め、言語化能力を向上させるための質の高い問いかけを提供してください。

コーチングの指針：
- 親しみやすい口調で話す
- 共感を示してから問いかける
- 答えを教えずに気づきを促す
- 感情の言語化を重視
- 150文字以内で簡潔に応答

ユーザーのメッセージ：
${userMessage}

上記を踏まえて、コーチとして適切な応答をしてください。`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
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
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0].content.parts[0].text;
    }
    
    return 'すみません、少し考えがまとまりません。もう一度話しかけてください。';
    
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'こんにちは！今日はどんなことを考えていますか？';
  }
}

// LINEメッセージ送信
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

    console.log('Message sent successfully to:', userId);
    
  } catch (error) {
    console.error('Error sending LINE message:', error);
  }
}

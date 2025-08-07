async function generateAIResponse(userMessage) {
  const geminiApiKey = process.env.GEMINI_API_KEY;
  
  console.log('Gemini API Key exists:', !!geminiApiKey);
  console.log('API Key length:', geminiApiKey ? geminiApiKey.length : 0);
  
  if (!geminiApiKey) {
    console.log('No Gemini API key found');
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
    console.log('Calling Gemini API with new endpoint...');
    
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
          temperature: 0.7,
          topP: 0.9
        }
      })
    });

    console.log('Gemini API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error response:', errorText);
      
      // 別のモデルでリトライ
      console.log('Retrying with gemini-pro...');
      const retryResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });
      
      if (!retryResponse.ok) {
        throw new Error(`Gemini API error: ${retryResponse.status}`);
      }
      
      const retryData = await retryResponse.json();
      console.log('Retry successful');
      
      if (retryData.candidates && retryData.candidates.length > 0) {
        const aiResponse = retryData.candidates[0].content.parts[0].text;
        console.log('AI response generated (retry):', aiResponse);
        return aiResponse;
      }
    }

    const data = await response.json();
    console.log('Gemini API success');
    
    if (data.candidates && data.candidates.length > 0) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      console.log('AI response generated:', aiResponse);
      return aiResponse;
    }
    
    console.log('No candidates in Gemini response');
    return 'すみません、少し考えがまとまりません。もう一度話しかけてください。';
    
  } catch (error) {
    console.error('Gemini API error details:', error);
    return 'こんにちは！今日はどんなことを考えていますか？';
  }
}

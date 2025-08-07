// 最初の行に正しいexport文を追加
export default async function handler(req, res) {
  console.log('=== WEBHOOK CALLED ===');
  console.log('Method:', req.method);
  
  if (req.method === 'POST') {
    try {
      console.log('POST request body:', JSON.stringify(req.body));
      
      const events = req.body?.events || [];
      console.log('Events count:', events.length);
      
      for (const event of events) {
        console.log('Event:', JSON.stringify(event));
        
        if (event.type === 'message' && event.message.type === 'text') {
          const userId = event.source.userId;
          const userMessage = event.message.text;
          
          console.log('Processing message from:', userId);
          console.log('Message:', userMessage);
          
          // 固定応答をテスト
          await sendSimpleResponse(userId, `確認: "${userMessage}" を受信しました。AIコーチング機能をテスト中です。`);
        }
      }
      
      res.status(200).send('OK');
    } catch (error) {
      console.error('POST error:', error);
      res.status(200).send('OK');
    }
  } else {
    res.status(200).send('Webhook working');
  }
}

async function sendSimpleResponse(userId, message) {
  const lineAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  console.log('Sending response to:', userId);
  console.log('Message:', message);
  console.log('Token exists:', !!lineAccessToken);
  
  if (!lineAccessToken) {
    console.error('No LINE access token');
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

    console.log('LINE API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('LINE API error:', errorText);
    } else {
      console.log('Message sent successfully');
    }
    
  } catch (error) {
    console.error('Send message error:', error);
  }
}

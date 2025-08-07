export default async function handler(req, res) {
  console.log('=== WEBHOOK DEBUG START ===');
  console.log('Method:', req.method);
  console.log('Body:', JSON.stringify(req.body));
  
  if (req.method === 'POST') {
    try {
      const events = req.body?.events || [];
      console.log('Events count:', events.length);
      
      for (const event of events) {
        console.log('Event type:', event.type);
        if (event.type === 'message' && event.message.type === 'text') {
          const userId = event.source.userId;
          const message = event.message.text;
          console.log('User ID:', userId);
          console.log('Message:', message);
          
          // 環境変数の確認
          const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
          console.log('Token exists:', !!token);
          console.log('Token length:', token ? token.length : 0);
          
          // 簡単な応答をテスト
          await sendTestMessage(userId, `受信: ${message}`);
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  console.log('=== WEBHOOK DEBUG END ===');
  res.status(200).send('OK');
}

async function sendTestMessage(userId, message) {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!token) {
    console.error('No LINE token found');
    return;
  }
  
  try {
    console.log('Sending message to:', userId);
    console.log('Message content:', message);
    
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        to: userId,
        messages: [{
          type: 'text',
          text: message
        }]
      })
    });
    
    console.log('LINE API status:', response.status);
    const responseText = await response.text();
    console.log('LINE API response:', responseText);
    
  } catch (error) {
    console.error('LINE API error:', error);
  }
}

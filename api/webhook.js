export default function handler(req, res) {
  // 常に200で応答
  res.status(200);
  
  // どのメソッドでも受け入れる
  if (req.method === 'GET') {
    res.send('AI Coaching Bot Webhook is working!');
  } else if (req.method === 'POST') {
    res.send('OK');
  } else {
    res.send('OK');
  }
}

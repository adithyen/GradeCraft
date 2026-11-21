async function testAI() {
  console.log('Testing Neon AI Gateway...');
  const baseUrl = 'https://br-broad-cherry-bihvh46n-api.ai.c-5.ap-southeast-1.aws.neon.tech';
  const token = 'nt_live_efb27c919b59_6rSCilUl6CDvXt1D41v2QeXAyb3W1zYL';

  const res = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      model: 'claude-opus-4-8',
      messages: [
        { role: 'user', content: 'In one sentence, motivate an engineering student aiming for a 9.0 CGPA.' }
      ],
      max_tokens: 60
    })
  });

  const data = await res.json();
  console.log('AI Gateway response status:', res.status);
  console.log('Message:', data.choices?.[0]?.message?.content);
}

testAI().catch(console.error);

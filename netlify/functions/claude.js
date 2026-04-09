exports.handler = async (event) => {
  if(event.httpMethod === 'OPTIONS'){
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if(event.httpMethod !== 'POST'){
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if(!apiKey){
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'API key não configurada no servidor.' })
    };
  }

  let body;
  try { body = JSON.parse(event.body); }
  catch(e){
    return { statusCode: 400, body: JSON.stringify({ error: 'Body inválido.' }) };
  }

  const { prompt, maxTokens = 4000 } = body;

  if(!prompt){
    return { statusCode: 400, body: JSON.stringify({ error: 'Prompt ausente.' }) };
  }

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-latest',
        max_tokens: Math.min(maxTokens, 8000),
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await resp.json();

    if(!resp.ok){
      return {
        statusCode: resp.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: data.error?.message || 'Erro na API Anthropic.' })
      };
    }

    const text = data.content?.map(x => x.text || '').join('') || '';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ text })
    };

  } catch(e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message })
    };
  }
};

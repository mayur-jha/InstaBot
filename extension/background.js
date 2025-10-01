chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'generateResponse') {
    generateChatGPTResponse(message.messages, message.apiKey)
      .then(response => {
        chrome.runtime.sendMessage(response);
        sendResponse(response);
      })
      .catch(error => {
        console.error('Error in background script:', error);
        sendResponse({ error: error.message });
      });
    return true;
  }
  
  if (message.type === 'stats' || message.type === 'currentChat' || message.type === 'completed') {
    chrome.runtime.sendMessage(message);
  }
});

async function generateChatGPTResponse(messages, apiKey) {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages,
        temperature: 0.7,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenAI API error ${response.status}:`, errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      content: data.choices[0].message.content,
      success: true
    };
  } catch (error) {
    console.error('ChatGPT API Error:', error);
    return {
      content: null,
      success: false,
      error: error.message
    };
  }
}

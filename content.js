let isAutomationRunning = false;
let stats = { processed: 0, responded: 0, skipped: 0 };
let apiKey = '';
let delay = 2000;
let messageCount = 20;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start') {
    apiKey = message.apiKey;
    delay = message.delay;
    messageCount = message.messageCount;
    isAutomationRunning = true;
    stats = { processed: 0, responded: 0, skipped: 0 };
    startAutomation();
  } else if (message.action === 'stop') {
    isAutomationRunning = false;
  }
});

async function startAutomation() {
  await navigateToMessages();
  await wait(2000);
  
  const chatList = await getAllChats();
  
  for (let i = 0; i < chatList.length && isAutomationRunning; i++) {
    try {
      const chat = chatList[i];
      await processChat(chat, i);
      await wait(delay);
    } catch (error) {
      console.error('Error processing chat:', error);
    }
  }
  
  chrome.runtime.sendMessage({ type: 'completed' });
}

async function navigateToMessages() {
  if (!window.location.pathname.includes('/direct')) {
    const messagesLink = document.querySelector('a[href="/direct/inbox/"]') || 
                        document.querySelector('a[href*="/direct"]');
    if (messagesLink) {
      messagesLink.click();
      await wait(3000);
    }
  }
}

async function getAllChats() {
  const chatSelectors = [
    'div[role="listitem"]',
    'div[role="button"]',
    'a[role="link"][href*="/direct/t/"]'
  ];
  
  let chats = [];
  for (const selector of chatSelectors) {
    chats = Array.from(document.querySelectorAll(selector))
      .filter(el => el.href && el.href.includes('/direct/t/'));
    if (chats.length > 0) break;
  }
  
  return chats;
}

async function processChat(chatElement, index) {
  chatElement.click();
  await wait(2000);
  
  const username = getChatUsername();
  chrome.runtime.sendMessage({
    type: 'currentChat',
    name: username || `Chat ${index + 1}`,
    status: 'Checking last message...'
  });
  
  const messages = getMessages();
  if (messages.length === 0) {
    stats.skipped++;
    stats.processed++;
    updateStats();
    return;
  }
  
  const lastMessage = messages[messages.length - 1];
  const isFromUser = !lastMessage.classList.contains('x1iyjqo2') && 
                     !lastMessage.querySelector('[data-testid="outgoing-message"]') &&
                     !isMessageFromMe(lastMessage);
  
  if (!isFromUser) {
    stats.skipped++;
    stats.processed++;
    updateStats();
    return;
  }
  
  chrome.runtime.sendMessage({
    type: 'currentChat',
    name: username || `Chat ${index + 1}`,
    status: 'Analyzing conversation...'
  });
  
  const conversation = extractConversation(messages, messageCount);
  
  const response = await generateResponse(conversation);
  
  if (response) {
    chrome.runtime.sendMessage({
      type: 'currentChat',
      name: username || `Chat ${index + 1}`,
      status: 'Sending response...'
    });
    
    await sendMessage(response);
    stats.responded++;
  } else {
    stats.skipped++;
  }
  
  stats.processed++;
  updateStats();
}

function getChatUsername() {
  const selectors = [
    'header h2',
    'header span',
    '[role="heading"]',
    'div[role="button"] span'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  
  return null;
}

function getMessages() {
  const messageContainerSelectors = [
    'div[role="row"]',
    'div[class*="message"]',
    'div[data-testid*="message"]'
  ];
  
  let messages = [];
  for (const selector of messageContainerSelectors) {
    messages = Array.from(document.querySelectorAll(selector));
    if (messages.length > 0) break;
  }
  
  return messages.filter(msg => {
    const text = msg.textContent.trim();
    return text.length > 0 && !text.includes('Today') && !text.includes('Yesterday');
  });
}

function isMessageFromMe(messageElement) {
  const outgoingIndicators = [
    'x1iyjqo2',
    'outgoing',
    messageElement.querySelector('[data-testid="outgoing-message"]'),
    messageElement.querySelector('div[style*="justify-content: flex-end"]'),
    messageElement.closest('[style*="justify-content: flex-end"]')
  ];
  
  return outgoingIndicators.some(indicator => {
    if (typeof indicator === 'string') {
      return messageElement.classList.contains(indicator);
    }
    return indicator !== null;
  });
}

function extractConversation(messages, count) {
  const lastMessages = messages.slice(-Math.min(count, messages.length));
  
  return lastMessages.map(msg => {
    const text = msg.textContent.trim();
    const fromMe = isMessageFromMe(msg);
    return {
      role: fromMe ? 'assistant' : 'user',
      content: text
    };
  });
}

async function generateResponse(conversation) {
  try {
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful and friendly assistant responding to Instagram direct messages. Keep responses natural, casual, and concise. Match the tone of the conversation.'
      },
      ...conversation
    ];
    
    const response = await chrome.runtime.sendMessage({
      type: 'generateResponse',
      messages: messages,
      apiKey: apiKey
    });
    
    return response?.content || null;
  } catch (error) {
    console.error('Error generating response:', error);
    return null;
  }
}

async function sendMessage(text) {
  const inputSelectors = [
    'textarea[placeholder*="Message"]',
    'div[contenteditable="true"][role="textbox"]',
    'textarea[aria-label*="Message"]',
    'div[contenteditable="true"]'
  ];
  
  let input = null;
  for (const selector of inputSelectors) {
    input = document.querySelector(selector);
    if (input) break;
  }
  
  if (!input) {
    console.error('Could not find message input');
    return;
  }
  
  if (input.tagName === 'TEXTAREA') {
    input.value = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    input.textContent = text;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  await wait(500);
  
  const sendButtonSelectors = [
    'button[type="button"]',
    'div[role="button"]'
  ];
  
  let sendButton = null;
  for (const selector of sendButtonSelectors) {
    const buttons = Array.from(document.querySelectorAll(selector));
    sendButton = buttons.find(btn => {
      const text = btn.textContent.toLowerCase();
      return text.includes('send') || btn.querySelector('svg');
    });
    if (sendButton) break;
  }
  
  if (sendButton) {
    sendButton.click();
  } else {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  }
}

function updateStats() {
  chrome.runtime.sendMessage({
    type: 'stats',
    stats: stats
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

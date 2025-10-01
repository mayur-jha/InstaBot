let isRunning = false;

const elements = {
  apiKey: document.getElementById('apiKey'),
  saveApiKey: document.getElementById('saveApiKey'),
  startBtn: document.getElementById('startBtn'),
  stopBtn: document.getElementById('stopBtn'),
  statusIndicator: document.getElementById('statusIndicator'),
  statusText: document.querySelector('.status-text'),
  apiKeySection: document.getElementById('apiKeySection'),
  statsGrid: document.getElementById('statsGrid'),
  currentChat: document.getElementById('currentChat'),
  processedCount: document.getElementById('processedCount'),
  respondedCount: document.getElementById('respondedCount'),
  skippedCount: document.getElementById('skippedCount'),
  chatName: document.getElementById('chatName'),
  chatStatus: document.getElementById('chatStatus'),
  delayInput: document.getElementById('delayInput'),
  messageCount: document.getElementById('messageCount')
};

chrome.storage.local.get(['apiKey', 'delay', 'messageCount'], (result) => {
  if (result.apiKey) {
    elements.apiKey.value = result.apiKey;
    elements.apiKeySection.style.display = 'none';
    elements.statsGrid.style.display = 'grid';
  }
  if (result.delay) {
    elements.delayInput.value = result.delay;
  }
  if (result.messageCount) {
    elements.messageCount.value = result.messageCount;
  }
});

elements.saveApiKey.addEventListener('click', () => {
  const apiKey = elements.apiKey.value.trim();
  if (apiKey) {
    chrome.storage.local.set({ apiKey }, () => {
      elements.apiKeySection.style.display = 'none';
      elements.statsGrid.style.display = 'grid';
      updateStatus('Ready', false);
    });
  }
});

elements.startBtn.addEventListener('click', async () => {
  const { apiKey } = await chrome.storage.local.get('apiKey');
  if (!apiKey) {
    alert('Please save your OpenAI API key first');
    return;
  }

  chrome.storage.local.set({
    delay: parseInt(elements.delayInput.value),
    messageCount: parseInt(elements.messageCount.value)
  });

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url.includes('instagram.com')) {
    alert('Please open Instagram Direct Messages first');
    return;
  }

  isRunning = true;
  elements.startBtn.style.display = 'none';
  elements.stopBtn.style.display = 'flex';
  elements.currentChat.style.display = 'block';
  updateStatus('Running', true);

  chrome.tabs.sendMessage(tab.id, { 
    action: 'start',
    apiKey,
    delay: parseInt(elements.delayInput.value),
    messageCount: parseInt(elements.messageCount.value)
  });
});

elements.stopBtn.addEventListener('click', async () => {
  isRunning = false;
  elements.startBtn.style.display = 'flex';
  elements.stopBtn.style.display = 'none';
  elements.currentChat.style.display = 'none';
  updateStatus('Stopped', false);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.tabs.sendMessage(tab.id, { action: 'stop' });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'stats') {
    elements.processedCount.textContent = message.stats.processed;
    elements.respondedCount.textContent = message.stats.responded;
    elements.skippedCount.textContent = message.stats.skipped;
  } else if (message.type === 'currentChat') {
    elements.chatName.textContent = message.name;
    elements.chatStatus.textContent = message.status;
  } else if (message.type === 'completed') {
    isRunning = false;
    elements.startBtn.style.display = 'flex';
    elements.stopBtn.style.display = 'none';
    elements.currentChat.style.display = 'none';
    updateStatus('Completed', false);
  }
});

function updateStatus(text, active) {
  elements.statusText.textContent = text;
  if (active) {
    elements.statusIndicator.classList.add('active');
  } else {
    elements.statusIndicator.classList.remove('active');
  }
}

let timerInterval;
let callDurationSeconds = 0;
let currentNumber = "";
let audioCtx = null;

// Initial Contacts List
let contactsData = [
  { name: "John Doe", number: "+1 (555) 019-2834" },
  { name: "Sarah Connor", number: "+1 (555) 014-9921" },
  { name: "Michael Scott", number: "+1 (555) 017-4820" }
];

document.addEventListener('DOMContentLoaded', () => {
  loadCallHistory();
  renderContactsUI();
  loadChatMessages();
});

// Sound Generator
function playIOSClickSound() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(120, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(30, audioCtx.currentTime + 0.03);

  gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);

  osc.connect(gain);
  gain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.03);
}

function pressKey(val) {
  playIOSClickSound();
  const input = document.getElementById('phoneDisplay');
  input.value += val;
}

function deleteDigit() {
  playIOSClickSound();
  const input = document.getElementById('phoneDisplay');
  input.value = input.value.slice(0, -1);
}

// Clipboard Paste
async function pasteFromClipboard() {
  try {
    const text = await navigator.clipboard.readText();
    const cleanedText = text.replace(/[^\d+*#]/g, '');
    if (cleanedText) {
      document.getElementById('phoneDisplay').value = cleanedText;
    }
  } catch (err) {
    alert('Please allow clipboard access or manually paste inside the input box.');
  }
}

// Navigation
function switchPage(pageId, tabBtn) {
  document.querySelectorAll('.app-page').forEach(page => page.classList.remove('active-page'));
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));

  document.getElementById(pageId).classList.add('active-page');
  if (tabBtn) tabBtn.classList.add('active');

  const subTitles = {
    'dialerPage': 'Web Dialer',
    'historyPage': 'Call Logs',
    'smsPage': 'Messages',
    'contactsPage': 'Contacts Phonebook'
  };
  document.getElementById('headerSubTitle').innerText = subTitles[pageId];
}

// Open Chat for specific Contact / Number
function openSMSChat(number, name) {
  const displayName = name || number;
  const initial = displayName.charAt(0).toUpperCase();

  document.getElementById('activeChatName').innerText = displayName;
  document.getElementById('activeChatNumber').innerText = number;
  document.getElementById('activeChatAvatar').innerText = initial;

  switchPage('smsPage', document.getElementById('smsNavTabBtn'));
}

function quickDial(number) {
  document.getElementById('phoneDisplay').value = number;
  switchPage('dialerPage', document.querySelectorAll('.nav-tab')[0]);
  startCall(number);
}

function updateStatus(text) {
  document.getElementById('statusLabel').innerText = text;
}

function startCall(targetNumber) {
  const input = document.getElementById('phoneDisplay');
  if (targetNumber) input.value = targetNumber;
  
  currentNumber = input.value || "+1 (212) 555-0123";
  input.value = currentNumber;

  document.getElementById('keypadView').classList.add('hidden');
  document.getElementById('activeCallView').classList.remove('hidden');

  updateStatus('● Ringing...');

  setTimeout(() => {
    updateStatus('● 00:00');
    startTimer();
  }, 1500);
}

function startTimer() {
  callDurationSeconds = 0;
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    callDurationSeconds++;
    const mins = String(Math.floor(callDurationSeconds / 60)).padStart(2, '0');
    const secs = String(callDurationSeconds % 60).padStart(2, '0');
    updateStatus(`● ${mins}:${secs}`);
  }, 1000);
}

function endCall() {
  clearInterval(timerInterval);

  if (currentNumber) {
    const mins = String(Math.floor(callDurationSeconds / 60)).padStart(2, '0');
    const secs = String(callDurationSeconds % 60).padStart(2, '0');
    saveAndAddCallToHistory(currentNumber, `${mins}:${secs}`);
  }

  document.getElementById('keypadView').classList.remove('hidden');
  document.getElementById('activeCallView').classList.add('hidden');
  document.getElementById('incallKeypad').classList.add('hidden');
  document.getElementById('waveContainer').classList.remove('hidden');

  updateStatus('● Ready to Call');
}

function toggleMute() { document.getElementById('muteBtn').classList.toggle('active'); }
function toggleSpeaker() { document.getElementById('speakerBtn').classList.toggle('active'); }
function toggleInCallKeypad() {
  document.getElementById('keypadToggleBtn').classList.toggle('active');
  document.getElementById('waveContainer').classList.toggle('hidden');
  document.getElementById('incallKeypad').classList.toggle('hidden');
}

// 1. DEVICE CONTACTS SYNC (Contact Picker API)
async function importDeviceContacts() {
  if ('contacts' in navigator && 'ContactsManager' in window) {
    try {
      const props = ['name', 'tel'];
      const opts = { multiple: true };
      const contacts = await navigator.contacts.select(props, opts);
      
      if (contacts && contacts.length > 0) {
        contacts.forEach(c => {
          const name = c.name && c.name.length ? c.name[0] : 'Unknown';
          const tel = c.tel && c.tel.length ? c.tel[0] : 'No Number';
          contactsData.unshift({ name, number: tel });
        });
        renderContactsUI();
      }
    } catch (err) {
      console.log('Contacts picker cancelled or failed:', err);
    }
  } else {
    alert('Contact Sync requires Android Chrome / supported mobile browsers. Use manually added contacts in standard browsers.');
  }
}

function renderContactsUI() {
  const container = document.getElementById('contactsListContainer');
  container.innerHTML = '';

  contactsData.forEach(c => {
    const item = document.createElement('div');
    item.className = 'contact-item';
    
    item.innerHTML = `
      <div style="display:flex; align-items:center; gap:12px;">
        <div class="contact-avatar">${c.name.charAt(0).toUpperCase()}</div>
        <div class="contact-details">
          <span class="contact-name">${c.name}</span>
          <span class="contact-number">${c.number}</span>
        </div>
      </div>
      <div class="action-buttons-group">
        <button class="action-circle-icon sms-action-bg" onclick="openSMSChat('${c.number}', '${c.name}')" title="Message">
          <svg viewBox="0 0 24 24" fill="#001EC7" width="14" height="14"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
        </button>
        <button class="action-circle-icon call-action-bg" onclick="quickDial('${c.number}')" title="Call">
          <svg viewBox="0 0 24 24" fill="#001EC7" width="14" height="14"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
        </button>
      </div>
    `;
    container.appendChild(item);
  });
}

// LOCAL STORAGE: CHAT MESSAGES
function saveChatMessage(text, type, timeStr, recipientNum) {
  const savedChats = JSON.parse(localStorage.getItem('jml_chats') || '[]');
  savedChats.push({ text, type, time: timeStr, recipient: recipientNum });
  localStorage.setItem('jml_chats', JSON.stringify(savedChats));
}

function loadChatMessages() {
  const savedChats = JSON.parse(localStorage.getItem('jml_chats') || '[]');
  const container = document.getElementById('whatsappMessages');
  
  if (savedChats.length > 0) {
    container.innerHTML = '';
    savedChats.forEach(msg => {
      appendMessageBubble(msg.text, msg.type, msg.time);
    });
  }
}

function appendMessageBubble(text, type, timeStr) {
  const container = document.getElementById('whatsappMessages');
  const bubble = document.createElement('div');
  bubble.className = `msg-bubble ${type}`;
  bubble.innerHTML = `${text}<span class="msg-time">${timeStr}</span>`;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function sendWhatsAppMessage() {
  const msgInput = document.getElementById('chatInputMessage');
  const text = msgInput.value.trim();
  const recipientNum = document.getElementById('activeChatNumber').innerText;

  if (!text) return;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  appendMessageBubble(text, 'sent', timeStr);
  saveChatMessage(text, 'sent', timeStr, recipientNum);

  msgInput.value = '';

  setTimeout(() => {
    const replyText = "Message received loud and clear! 🚀";
    appendMessageBubble(replyText, 'received', timeStr);
    saveChatMessage(replyText, 'received', timeStr, recipientNum);
  }, 1000);
}

// 2. CALL HISTORY WITH SIDE-BY-SIDE CALL & SMS BUTTONS
function saveAndAddCallToHistory(number, duration) {
  const savedHistory = JSON.parse(localStorage.getItem('jml_history') || '[]');
  savedHistory.unshift({ number, duration });
  localStorage.setItem('jml_history', JSON.stringify(savedHistory));
  
  renderHistoryUI(savedHistory);
}

function loadCallHistory() {
  const savedHistory = JSON.parse(localStorage.getItem('jml_history') || '[]');
  renderHistoryUI(savedHistory);
}

function renderHistoryUI(historyArray) {
  const fullList = document.getElementById('fullHistoryList');
  if (!historyArray || historyArray.length === 0) {
    fullList.innerHTML = '<div class="empty-state">No call logs yet</div>';
    return;
  }

  fullList.innerHTML = '';
  historyArray.forEach(item => {
    const logItem = document.createElement('div');
    logItem.className = 'history-item';

    logItem.innerHTML = `
      <div style="display:flex; flex-direction:column;">
        <span style="font-size:14px; font-weight:600; color:#0f172a;">${item.number}</span>
        <span style="font-size:11px; color:#64748b;">Duration: ${item.duration}</span>
      </div>
      <div class="action-buttons-group">
        <button class="action-circle-icon sms-action-bg" onclick="openSMSChat('${item.number}')" title="SMS Message">
          <svg viewBox="0 0 24 24" fill="#001EC7" width="14" height="14"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/></svg>
        </button>
        <button class="action-circle-icon call-action-bg" onclick="quickDial('${item.number}')" title="Call">
          <svg viewBox="0 0 24 24" fill="#001EC7" width="14" height="14"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
        </button>
      </div>
    `;
    fullList.appendChild(logItem);
  });
}

// SERVICE WORKER REGISTRATION
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(reg => console.log('Service Worker registered!'))
      .catch(err => console.log('Service Worker failed:', err));
  });
}
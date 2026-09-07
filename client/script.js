const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Simpan history percakapan
let conversationHistory = [];

form.addEventListener('submit', async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Tampilkan pesan user di UI
  appendMessage('user', userMessage);
  input.value = '';
  
  // Tambahkan ke history untuk dikirim ke API
  conversationHistory.push({ role: 'user', text: userMessage });

  // Tampilkan animasi loading
  const loadingId = showLoading();

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ conversation: conversationHistory })
    });

    const data = await response.json();
    
    // Hapus indikator loading
    removeLoading(loadingId);

    if (response.ok && data.result) {
      appendMessage('bot', data.result, true);
      conversationHistory.push({ role: 'model', text: data.result });
    } else {
      appendMessage('bot', 'Maaf, terjadi kesalahan: ' + (data.error || data.message));
    }
  } catch (err) {
    removeLoading(loadingId);
    appendMessage('bot', 'Koneksi error: ' + err.message + '. Pastikan server backend berjalan.');
  }
});

function appendMessage(sender, text, isMarkdown = false) {
  const msgWrapper = document.createElement('div');
  msgWrapper.classList.add('message', sender);
  
  const msgContent = document.createElement('div');
  msgContent.classList.add('message-content');
  
  if (isMarkdown && sender === 'bot') {
    // Gunakan marked library untuk parse markdown
    if (typeof marked !== 'undefined') {
      msgContent.innerHTML = marked.parse(text);
    } else {
      msgContent.textContent = text;
    }
  } else {
    msgContent.textContent = text;
  }
  
  msgWrapper.appendChild(msgContent);
  chatBox.appendChild(msgWrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showLoading() {
  const msgWrapper = document.createElement('div');
  const id = 'loading-' + Date.now();
  msgWrapper.id = id;
  msgWrapper.classList.add('message', 'bot');
  
  const msgContent = document.createElement('div');
  msgContent.classList.add('message-content', 'loading-indicator');
  msgContent.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
  
  msgWrapper.appendChild(msgContent);
  chatBox.appendChild(msgWrapper);
  chatBox.scrollTop = chatBox.scrollHeight;
  return id;
}

function removeLoading(id) {
  const loadingElement = document.getElementById(id);
  if (loadingElement) {
    loadingElement.remove();
  }
}

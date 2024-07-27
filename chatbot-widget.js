// chatbot-widget.js
(function() {
  const API_BASE_URL = 'http://localhost:3009';

  let config = {
    headerText: 'Happyflops AI',
    subHeaderText: 'Chatta med vår digitala assistent',
    mainColor: '#FCBE08',
    secondaryColor: '#FFFFFF',
    font: 'Roboto',
    launch_avatar: 'https://i.ibb.co/H2tqg2w/Ventajas-1-200-removebg-preview-removebg-preview-removebg-preview.png',
    header_image: 'https://i.ibb.co/gTSR93f/s348hq3b.png',
    banner_image: 'https://i.ibb.co/gTSR93f/s348hq3b.png'
  };

  let messages = [];
  let isInitialized = false;
  let showFollowUp = false;
  let isChatOpen = false;
  let isLoading = false;
  let showHeader = true;
  let conversationId = null;
  let showInitialOptions = false;

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function loadGoogleFont(fontFamily) {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css?family=${fontFamily.replace(' ', '+')}`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
  }

  async function fetchConfig() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/chatbot-config`);
      config = await response.json();
      loadGoogleFont(config.font);
      renderChat();
    } catch (error) {
      console.error('Error fetching configuration:', error);
    }
  }

  function renderChat() {
    const chatContainer = document.getElementById('happyflops-chat-container');
    if (!chatContainer) return;

    chatContainer.innerHTML = isChatOpen ? renderOpenChat() : renderClosedChat();

    if (isChatOpen) {
      document.getElementById('chat-close-btn').addEventListener('click', () => {
        isChatOpen = false;
        renderChat();
      });
      document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isLoading) {
          sendMessage(e.target.value, true);
        }
      });
      document.getElementById('chat-send-btn').addEventListener('click', () => {
        if (!isLoading) {
          sendMessage(document.getElementById('chat-input').value, true);
        }
      });
    } else {
      document.getElementById('chat-open-btn').addEventListener('click', () => {
        isChatOpen = true;
        if (!isInitialized) {
          initializeChat();
        }
        renderChat();
      });
    }
  }

  function renderOpenChat() {
    return `
      <div class="chat-window" style="font-family: '${config.font}', sans-serif;">
        <div class="chat-header" style="background-color: ${config.mainColor};">
          <img src="${config.header_image || 'default_header_image.png'}" alt="Header" class="header-image">
          <div class="header-text">
            <h1>${config.headerText}</h1>
            <p>${config.subHeaderText}</p>
          </div>
          <button id="chat-close-btn">×</button>
        </div>
        <div class="chat-messages" id="chat-messages">
          ${renderMessages()}
        </div>
        <div class="chat-input">
          <input type="text" id="chat-input" placeholder="Skriv ett meddelande..." ${isLoading ? 'disabled' : ''}>
          <button id="chat-send-btn" ${isLoading ? 'disabled' : ''}>Skicka</button>
        </div>
      </div>
    `;
  }

  function renderClosedChat() {
    return `
      <button id="chat-open-btn" style="background-color: ${config.mainColor};">
        <img src="${config.launch_avatar || 'default_launch_avatar.png'}" alt="Launch Avatar">
      </button>
    `;
  }

  function renderMessages() {
    return messages.map((message, index) => `
      <div class="message ${message.isBot ? 'bot' : 'user'}">
        ${message.isLoading ? renderLoadingBubbles() : message.text}
      </div>
      ${renderMessageExtras(message, index)}
    `).join('');
  }

  function renderLoadingBubbles() {
    return `
      <div class="loading-bubbles">
        <div></div>
        <div></div>
        <div></div>
      </div>
    `;
  }

  function renderMessageExtras(message, index) {
    let extras = '';
    if (message.product) {
      extras += renderProductCard(message.product);
    }
    if (showInitialOptions && index === messages.length - 1) {
      extras += renderInitialOptions();
    }
    if (showFollowUp && index === messages.length - 1) {
      extras += renderFollowUpOptions();
    }
    return extras;
  }

  function renderProductCard(product) {
    return `
      <div class="product-card">
        ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}">` : ''}
        <h3>${product.name}</h3>
        <p>${product.price} kr</p>
        <a href="https://www.happyflops.se/products/${product.handle}" target="_blank" rel="noopener noreferrer">Köp nu</a>
      </div>
    `;
  }

  function renderInitialOptions() {
    return `
      <div class="message-options">
        ${['Spåra min order', 'Retur', 'Storleksguide'].map(option => `
          <button onclick="handleOptionClick('${option}')">${option}</button>
        `).join('')}
      </div>
    `;
  }

  function renderFollowUpOptions() {
    return `
      <div class="message-options">
        ${['Ja', 'Nej'].map(option => `
          <button onclick="handleOptionClick('${option}')">${option}</button>
        `).join('')}
      </div>
    `;
  }

  async function sendMessage(messageText, isUserMessage = false) {
    if (messageText.trim() === '') return;

    if (isUserMessage) {
      messages.push({ text: messageText, isBot: false, isLoading: false });
      document.getElementById('chat-input').value = '';
      showInitialOptions = false;
    }

    messages.push({ text: '', isBot: true, isLoading: true });
    renderChat();
    scrollToBottom();

    try {
      const response = await fetch(`https://rosterai-fresh-function.azurewebsites.net/api/HttpTrigger?question=${encodeURIComponent(messageText)}`);
      const data = await response.json();
      const { answer } = data;

      messages[messages.length - 1] = { text: answer, isBot: true, isLoading: false };
      renderChat();
      scrollToBottom();

      if (!answer.includes('?') && Math.random() < 0.5) {
        messages.push({ text: '', isBot: true, isLoading: true });
        renderChat();
        scrollToBottom();

        setTimeout(() => {
          messages[messages.length - 1] = { text: "Kan jag hjälpa dig med något mer?", isBot: true, isLoading: false };
          showFollowUp = true;
          renderChat();
          scrollToBottom();
        }, 800);
      } else {
        showFollowUp = false;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      messages[messages.length - 1] = { text: "Tyvärr kunde jag inte ansluta just nu. Vänligen försök igen senare eller kontakta oss via kundservice@happyflops.se", isBot: true, isLoading: false };
      renderChat();
      scrollToBottom();
    }
  }

  function handleFollowUpResponse(isYes) {
    messages.push({ text: isYes ? "Ja" : "Nej", isBot: false, isLoading: false });
    showFollowUp = false;
    renderChat();
    scrollToBottom();

    messages.push({ text: '', isBot: true, isLoading: true });
    renderChat();
    scrollToBottom();

    setTimeout(() => {
      messages[messages.length - 1] = { 
        text: isYes 
          ? "Vad mer kan jag hjälpa dig med?" 
          : "Okej, tack för att du chattat med mig. Ha en bra dag!", 
        isBot: true,
        isLoading: false
      };
      renderChat();
      scrollToBottom();
    }, 800);
  }

  function handleOptionClick(option) {
    if (option === 'Ja' || option === 'Nej') {
      handleFollowUpResponse(option === 'Ja');
    } else {
      sendMessage(option, true);
    }
  }

  function scrollToBottom() {
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function initializeChat() {
    isLoading = true;
    messages = [{ text: '', isBot: true, isLoading: true }];
    renderChat();

    setTimeout(() => {
      messages = [
        { text: "Hej! Mitt namn är Elliot och jag är din virtuella assistent här på Happyflops.", isBot: true, isLoading: false },
        { text: '', isBot: true, isLoading: true }
      ];
      renderChat();

      setTimeout(() => {
        messages[1] = { text: "Vad kan jag hjälpa dig med idag?😊", isBot: true, isLoading: false };
        showInitialOptions = true;
        isLoading = false;
        isInitialized = true;
        renderChat();
      }, 1000);
    }, 700);
  }

  // Initialize
  fetchConfig();

  // Expose necessary functions to global scope
  window.handleOptionClick = handleOptionClick;
})();

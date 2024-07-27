// https://elliotevertssonnorrevik.github.io/chatbot-widget.js
(function() {
  const API_BASE_URL = 'https://rosterai-fresh-function.azurewebsites.net/api/HttpTrigger';

  let messages = [];
  let isInitialized = false;
  let showFollowUp = false;
  let isChatOpen = false;
  let isLoading = false;
  let showHeader = true;
  let conversationId = null;
  let showInitialOptions = false;
  
  const config = {
    headerText: 'Happyflops AI',
    subHeaderText: 'Chatta med vår digitala assistent',
    mainColor: '#FCBE08',
    secondaryColor: '#FFFFFF',
    font: 'Roboto',
    launch_avatar: 'https://i.ibb.co/H2tqg2w/Ventajas-1-200-removebg-preview-removebg-preview-removebg-preview.png',
    header_image: 'https://i.ibb.co/gTSR93f/s348hq3b.png',
    banner_image: 'https://i.ibb.co/gTSR93f/s348hq3b.png'
  };

  function createChatbotUI() {
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'happyflops-chatbot';
    chatbotContainer.style.position = 'fixed';
    chatbotContainer.style.bottom = '20px';
    chatbotContainer.style.right = '20px';
    chatbotContainer.style.fontFamily = `'${config.font}', sans-serif`;

    document.body.appendChild(chatbotContainer);

    renderChatbot();
  }

  function renderChatbot() {
    const chatbotContainer = document.getElementById('happyflops-chatbot');
    chatbotContainer.innerHTML = '';

    if (isChatOpen) {
      const chatWindow = createChatWindow();
      chatbotContainer.appendChild(chatWindow);
    } else {
      const launchButton = createLaunchButton();
      chatbotContainer.appendChild(launchButton);
    }
  }

  function createLaunchButton() {
    const button = document.createElement('button');
    button.className = 'happyflops-launch-button';
    button.style.backgroundColor = config.mainColor;
    
    const img = document.createElement('img');
    img.src = config.launch_avatar;
    img.alt = 'Launch Avatar';
    img.className = 'happyflops-launch-avatar';
    
    button.appendChild(img);
    button.addEventListener('click', () => {
      isChatOpen = true;
      renderChatbot();
      initializeChat();
    });

    return button;
  }

  function createChatWindow() {
    const chatWindow = document.createElement('div');
    chatWindow.className = 'happyflops-chat-window';

    const header = createChatHeader();
    const messagesContainer = createMessagesContainer();
    const inputArea = createInputArea();

    chatWindow.appendChild(header);
    chatWindow.appendChild(messagesContainer);
    chatWindow.appendChild(inputArea);

    return chatWindow;
  }

  function createChatHeader() {
    const header = document.createElement('div');
    header.className = 'happyflops-chat-header';
    header.style.backgroundColor = config.mainColor;

    const headerContent = document.createElement('div');
    headerContent.className = 'happyflops-header-content';

    const headerImage = document.createElement('img');
    headerImage.src = config.header_image;
    headerImage.alt = 'Header';
    headerImage.className = 'happyflops-header-image';

    const headerText = document.createElement('div');
    headerText.className = 'happyflops-header-text';

    const title = document.createElement('h1');
    title.textContent = config.headerText;

    const subtitle = document.createElement('p');
    subtitle.textContent = config.subHeaderText;

    headerText.appendChild(title);
    headerText.appendChild(subtitle);

    headerContent.appendChild(headerImage);
    headerContent.appendChild(headerText);

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.className = 'happyflops-close-button';
    closeButton.addEventListener('click', () => {
      isChatOpen = false;
      renderChatbot();
    });

    header.appendChild(headerContent);
    header.appendChild(closeButton);

    return header;
  }

  function createMessagesContainer() {
    const container = document.createElement('div');
    container.className = 'happyflops-messages-container';

    const messagesWrapper = document.createElement('div');
    messagesWrapper.className = 'happyflops-messages-wrapper';

    container.appendChild(messagesWrapper);

    messages.forEach(message => {
      const messageElement = createMessageElement(message);
      messagesWrapper.appendChild(messageElement);
    });

    return container;
  }

  function createMessageElement(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `happyflops-message ${message.isBot ? 'bot' : 'user'}`;

    const textElement = document.createElement('div');
    textElement.className = 'happyflops-message-text';
    textElement.innerHTML = message.isLoading
      ? '<div class="happyflops-loading-dots"><div></div><div></div><div></div></div>'
      : message.text;

    messageElement.appendChild(textElement);

    if (message.product) {
      const productElement = createProductElement(message.product);
      messageElement.appendChild(productElement);
    }

    return messageElement;
  }

  function createInitialOptions() {
    const optionsElement = document.createElement('div');
    optionsElement.className = 'happyflops-initial-options';

    const options = ['Spåra min order', 'Retur', 'Storleksguide'];
    options.forEach(option => {
      const button = document.createElement('button');
      button.textContent = option;
      button.className = 'happyflops-option-button';
      button.addEventListener('click', () => {
        sendMessage(option);
        showInitialOptions = false;
        updateChatWindow();
      });
      optionsElement.appendChild(button);
    });

    return optionsElement;
  }

  function createProductElement(product) {
    const productElement = document.createElement('div');
    productElement.className = 'happyflops-product-card';

    if (product.imageUrl) {
      const img = document.createElement('img');
      img.src = product.imageUrl;
      img.alt = product.name;
      img.className = 'happyflops-product-image';
      productElement.appendChild(img);
    }

    const productInfo = document.createElement('div');
    productInfo.className = 'happyflops-product-info';

    const name = document.createElement('h3');
    name.textContent = product.name;
    productInfo.appendChild(name);

    const price = document.createElement('p');
    price.textContent = `${product.price} kr`;
    productInfo.appendChild(price);

    const buyButton = document.createElement('a');
    buyButton.href = `https://www.happyflops.se/products/${product.handle}`;
    buyButton.textContent = 'Köp nu';
    buyButton.className = 'happyflops-buy-button';
    buyButton.target = '_blank';
    buyButton.rel = 'noopener noreferrer';
    productInfo.appendChild(buyButton);

    productElement.appendChild(productInfo);

    return productElement;
  }

  function createInputArea() {
    const inputArea = document.createElement('div');
    inputArea.className = 'happyflops-input-area';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Skriv ett meddelande...';
    input.className = 'happyflops-input';

    const sendButton = document.createElement('button');
    sendButton.textContent = 'Skicka';
    sendButton.className = 'happyflops-send-button';
    sendButton.style.backgroundColor = config.mainColor;

    sendButton.addEventListener('click', () => sendMessage(input.value));
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage(input.value);
    });

    inputArea.appendChild(input);
    inputArea.appendChild(sendButton);

    return inputArea;
  }

  function sendMessage(text) {
    if (text.trim() === '' || isLoading) return;

    addMessage(text, false);
    showInitialOptions = false;
    fetchBotResponse(text);
  }

  function addMessage(text, isBot, isLoading = false) {
    messages.push({ text, isBot, isLoading });
    updateChatWindow();
  }

  async function fetchBotResponse(question) {
    isLoading = true;
    addMessage('', true, true);

    try {
      const response = await fetch(`${API_BASE_URL}?question=${encodeURIComponent(question)}`);
      const data = await response.json();
      const answer = data.answer;

      messages[messages.length - 1] = { text: answer, isBot: true, isLoading: false };
      updateChatWindow();

      if (!answer.includes('?') && Math.random() < 0.5) {
        setTimeout(() => {
          addMessage('Kan jag hjälpa dig med något mer?', true);
          showFollowUp = true;
          updateChatWindow();
        }, 1000);
      } else {
        showFollowUp = false;
      }
    } catch (error) {
      console.error('Error fetching bot response:', error);
      messages[messages.length - 1] = { 
        text: 'Tyvärr kunde jag inte ansluta just nu. Vänligen försök igen senare eller kontakta oss via kundservice@happyflops.se', 
        isBot: true, 
        isLoading: false 
      };
      updateChatWindow();
    } finally {
      isLoading = false;
    }
  }

  function updateChatWindow() {
    const messagesWrapper = document.querySelector('.happyflops-messages-wrapper');
    if (messagesWrapper) {
      messagesWrapper.innerHTML = '';
      messages.forEach(message => {
        const messageElement = createMessageElement(message);
        messagesWrapper.appendChild(messageElement);
      });
      
      if (showInitialOptions) {
        const optionsElement = createInitialOptions();
        messagesWrapper.appendChild(optionsElement);
      }
      
      messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
    }
  }

  function initializeChat() {
    if (!isInitialized) {
      addMessage('Hej! Mitt namn är Elliot och jag är din virtuella assistent här på Happyflops.', true);
      setTimeout(() => {
        addMessage('Vad kan jag hjälpa dig med idag?😊', true);
        showInitialOptions = true;
        updateChatWindow();
      }, 1000);
      isInitialized = true;
    }
  }

  createChatbotUI();

  window.openHappyflopsChat = function() {
    isChatOpen = true;
    renderChatbot();
    initializeChat();
  };
})();

// https://elliotevertssonnorrevik.github.io/chatbot-widget.js 
(function() {
  const API_BASE_URL = 'https://rosterai-fresh-function.azurewebsites.net/api/HttpTrigger';

  let messages = [];
  let isInitialized = false;
  let isChatOpen = false;
  let isLoading = false;
  let showInitialOptions = false;
  let showFollowUp = false;
  
  const config = {
    headerText: 'Happyflops AI',
    subHeaderText: 'Chatta med vår digitala assistent',
    mainColor: '#FCBE08',
    logoUrl: 'https://i.ibb.co/gTSR93f/s348hq3b.png',
    launchAvatarUrl: 'https://i.ibb.co/H2tqg2w/Ventajas-1-200-removebg-preview-removebg-preview-removebg-preview.png'
  };

  function createChatbotUI() {
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'happyflops-chatbot';
    chatbotContainer.style.position = 'fixed';
    chatbotContainer.style.bottom = '20px';
    chatbotContainer.style.right = '20px';
    chatbotContainer.style.fontFamily = 'Arial, sans-serif';

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
    img.src = config.launchAvatarUrl;
    img.alt = 'Chat Avatar';
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
    headerImage.src = config.logoUrl;
    headerImage.alt = 'Happyflops';
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

  function createChatLogo() {
    const logoContainer = document.createElement('div');
    logoContainer.className = 'happyflops-logo-container';
  
    const logo = document.createElement('img');
    logo.src = config.logoUrl;
    logo.alt = 'Happyflops Logo';
    logo.className = 'happyflops-logo';
  
    const logoText = document.createElement('div');
    logoText.className = 'happyflops-logo-text';
    logoText.innerHTML = `<h2>${config.headerText}</h2><p>${config.subHeaderText}</p>`;
  
    logoContainer.appendChild(logo);
    logoContainer.appendChild(logoText);
  
    return logoContainer;
  }

  function createMessagesContainer() {
    const container = document.createElement('div');
    container.className = 'happyflops-messages-container';
  
    const messagesWrapper = document.createElement('div');
    messagesWrapper.className = 'happyflops-messages-wrapper';
  
    const logoContainer = createChatLogo();
    messagesWrapper.appendChild(logoContainer);
  
    container.appendChild(messagesWrapper);
  
    return container;
  }

  function unescapeHTML(text) {
    console.log('Unescaping HTML:', text); // Debug log
    const textarea = document.createElement('textarea');
    textarea.innerHTML = text;
    const unescaped = textarea.value;
    console.log('Unescaped result:', unescaped); // Debug log
    return unescaped;
  }
  
  function formatMessage(message) {
    console.log('Formatting message:', message);
  
    // Regex for Markdown-style links: [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g;
    
    // Replace Markdown-style links with HTML links
    message = message.replace(markdownLinkRegex, (match, text, url) => {
      console.log('Replacing Markdown link:', match, 'with HTML link');
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });
  
    console.log('Formatted message:', message);
    return message;
  }

  function createMessageElement(message) {
    console.log('Creating message element for:', message);
    const messageElement = document.createElement('div');
    messageElement.className = `happyflops-message ${message.isBot ? 'bot' : 'user'}`;
  
    const textElement = document.createElement('div');
    textElement.className = 'happyflops-message-text';
    
    if (message.isLoading) {
      textElement.innerHTML = '<div class="happyflops-loading-dots"><div></div><div></div><div></div></div>';
    } else if (message.isBot) {
      const formattedMessage = formatMessage(message.text);
      console.log('Formatted bot message:', formattedMessage);
      textElement.innerHTML = formattedMessage;
    } else {
      textElement.textContent = message.text;
    }
  
    messageElement.appendChild(textElement);
  
    console.log('Created message element:', messageElement.outerHTML);
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
  
    const handleSendMessage = () => {
      const message = input.value.trim();
      if (message !== '') {
        sendMessage(message);
        input.value = ''; // Tömmer inputfältet efter att meddelandet skickats
      }
    };

    sendButton.addEventListener('click', handleSendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        handleSendMessage();
      }
    });

    inputArea.appendChild(input);
    inputArea.appendChild(sendButton);

    return inputArea;
  }

  function sendMessage(text) {
    console.log('Sending message:', text);
    if (text.trim() === '' || isLoading) return;

    addMessage(text, false);
    showInitialOptions = false;
    showFollowUp = false;
    fetchBotResponse(text);
  }

  function addMessage(text, isBot, isLoading = false) {
    console.log('Adding message:', { text, isBot, isLoading });
    messages.push({ text, isBot, isLoading });
    updateChatWindow();
  }

  async function fetchBotResponse(question) {
    console.log('Fetching bot response for:', question);
    isLoading = true;
    addMessage('', true, true);

    try {
      const response = await fetch(`${API_BASE_URL}?question=${encodeURIComponent(question)}`);
      const data = await response.json();
      console.log('Raw API response:', data);

      const answer = data.answer;
      console.log('Extracted answer:', answer);

      messages[messages.length - 1] = { text: answer, isBot: true, isLoading: false };
      
      // Check if the answer doesn't include a question mark and randomly decide to show follow-up
      if (!answer.includes('?') && Math.random() < 0.5) {
        setTimeout(() => {
          addMessage("Kan jag hjälpa dig med något mer?", true);
          showFollowUp = true;
          updateChatWindow();
        }, 1000);
      } else {
        showFollowUp = false;
      }

      updateChatWindow();
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

  function handleFollowUpResponse(isYes) {
    addMessage(isYes ? "Ja" : "Nej", false);
    setTimeout(() => {
      addMessage(
        isYes ? "Vad mer kan jag hjälpa dig med?" : "Okej, tack för att du chattat med mig!", 
        true
      );
      showFollowUp = false;
      updateChatWindow();
    }, 500);
  }

  function updateChatWindow() {
    console.log('Updating chat window');
    const messagesWrapper = document.querySelector('.happyflops-messages-wrapper');
    if (messagesWrapper) {
      // Retain the logo and text
      const logoContainer = messagesWrapper.querySelector('.happyflops-logo-container');
      messagesWrapper.innerHTML = '';
      if (logoContainer) {
        messagesWrapper.appendChild(logoContainer);
      }
      
      messages.forEach(message => {
        const messageElement = createMessageElement(message);
        messagesWrapper.appendChild(messageElement);
      });
      
      if (showInitialOptions) {
        const optionsElement = createInitialOptions();
        messagesWrapper.appendChild(optionsElement);
      }
      
      if (showFollowUp) {
        const followUpElement = document.createElement('div');
        followUpElement.className = 'happyflops-initial-options';
        
        const yesButton = document.createElement('button');
        yesButton.textContent = 'Ja';
        yesButton.className = 'happyflops-option-button';
        yesButton.addEventListener('click', () => handleFollowUpResponse(true));
        
        const noButton = document.createElement('button');
        noButton.textContent = 'Nej';
        noButton.className = 'happyflops-option-button';
        noButton.addEventListener('click', () => handleFollowUpResponse(false));
        
        followUpElement.appendChild(yesButton);
        followUpElement.appendChild(noButton);
        messagesWrapper.appendChild(followUpElement);
      }
      
      messagesWrapper.scrollTop = messagesWrapper.scrollHeight;
    }
    console.log('Chat window updated, current messages:', JSON.stringify(messages, null, 2));
  }

  function addMessageWithDelay(text, isBot, delay, callback) {
    addMessage('', isBot, true); // Add loading message
    updateChatWindow();
    
    setTimeout(() => {
      messages[messages.length - 1] = { text, isBot, isLoading: false };
      updateChatWindow();
      if (callback) callback();
    }, delay);
  }

  function initializeChat() {
    if (!isInitialized) {
      addMessageWithDelay('Hej! Mitt namn är Elliot och jag är din virtuella assistent här på Happyflops.', true, 1000, () => {
        addMessageWithDelay('Vad kan jag hjälpa dig med idag?😊', true, 500, () => {
          showInitialOptions = true;
          updateChatWindow();
        });
      });
      
      isInitialized = true;
    }
  }

  createChatbotUI();

  window.openHappyflopsChat = function() {
    isChatOpen = true;
    renderChatbot();
    initializeChat();
  };

  console.log('Chatbot script loaded and initialized');
})();

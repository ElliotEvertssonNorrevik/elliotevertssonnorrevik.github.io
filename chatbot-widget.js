(function() {
  const API_BASE_URL = 'https://rosterai-fresh-function.azurewebsites.net/api/HttpTrigger';

  let messages = [];
  let conversationHistory = [];
  let isInitialized = false;
  let isChatOpen = false;
  let isLoading = false;
  let showInitialOptions = false;
  let showFollowUp = false;
  
  const config = {
    headerText: 'Vanbruun AI',
    subHeaderText: 'Chatta med vår digitala assistent',
    mainColor: '#3f2b20',
    logoUrl: 'https://i.ibb.co/m6LBcpN/cd8ajn5t.jpg',
    launchAvatarUrl: 'https://i.ibb.co/DtZd3sB/Untitled-design-37.png'
  };

  function createChatbotUI() {
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'happyflops-chatbot';
    chatbotContainer.style.position = 'fixed';
    chatbotContainer.style.bottom = '20px';
    chatbotContainer.style.right = '20px';
    chatbotContainer.style.fontFamily = 'Arial, sans-serif';

    document.body.appendChild(chatbotContainer);

    loadConversation();
    renderChatbot();
  }

  function renderChatbot() {
    const chatbotContainer = document.getElementById('happyflops-chatbot');
    chatbotContainer.innerHTML = '';

    if (isChatOpen) {
      const chatWindow = createChatWindow();
      chatbotContainer.appendChild(chatWindow);
      updateChatWindow();
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
  
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'happyflops-header-buttons';

    const reloadButton = document.createElement('button');
    reloadButton.innerHTML = '&#x21bb;'; // Reload symbol
    reloadButton.className = 'happyflops-button happyflops-reload-button';
    reloadButton.title = 'Restart conversation';
    reloadButton.addEventListener('click', restartConversation);

    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.className = 'happyflops-button happyflops-close-button';
    closeButton.addEventListener('click', () => {
      isChatOpen = false;
      saveConversation();
      renderChatbot();
    });
  
    buttonsContainer.appendChild(reloadButton);
    buttonsContainer.appendChild(closeButton);

    header.appendChild(headerContent);
    header.appendChild(buttonsContainer);
  
    return header;
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
        input.value = '';
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

  function createMessageElement(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `happyflops-message ${message.isBot ? 'bot' : 'user'}`;
  
    const textElement = document.createElement('div');
    textElement.className = 'happyflops-message-text';
    
    if (message.isLoading) {
      textElement.innerHTML = '<div class="happyflops-loading-dots"><div></div><div></div><div></div></div>';
    } else if (message.isBot) {
      const formattedMessage = formatMessage(message.text);
      textElement.innerHTML = formattedMessage;
    } else {
      textElement.textContent = message.text;
    }
  
    messageElement.appendChild(textElement);
  
    return messageElement;
  }

function formatMessage(message) {
  // Regex för att matcha e-postadresser
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  // Ersätt e-postadresser med klickbara länkar
  message = message.replace(emailRegex, (email) => {
    return `<a href="mailto:${email}" target="_blank" rel="noopener noreferrer">${email}</a>`;
  });

  // Befintlig kod för markdown-länkar
  const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g;
  message = message.replace(markdownLinkRegex, (match, text, url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  });

  return message;
}

  function createInitialOptions() {
    const optionsElement = document.createElement('div');
    optionsElement.className = 'happyflops-initial-options';

    const options = ['Spåra min order', 'Boka konsultation'];
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

  function createFollowUpButtons() {
    const followUpElement = document.createElement('div');
    followUpElement.className = 'happyflops-initial-options';
    
    const yesButton = document.createElement('button');
    yesButton.textContent = 'Ja';
    yesButton.className = 'happyflops-option-button';
    yesButton.addEventListener('click', () => handleFollowUpResponse("yes"));
    
    const noButton = document.createElement('button');
    noButton.textContent = 'Nej';
    noButton.className = 'happyflops-option-button';
    noButton.addEventListener('click', () => handleFollowUpResponse("no"));
    
    const customerServiceButton = document.createElement('button');
    customerServiceButton.textContent = 'Prata med kundtjänst';
    customerServiceButton.className = 'happyflops-option-button';
    customerServiceButton.addEventListener('click', () => handleFollowUpResponse("customer_service"));
    
    followUpElement.appendChild(yesButton);
    followUpElement.appendChild(noButton);
    followUpElement.appendChild(customerServiceButton);

    return followUpElement;
  }

  async function sendMessage(text) {
    if (text.trim() === '' || isLoading) return;

    const currentTime = new Date().toISOString();

    addMessage(text, false, false, currentTime);
    showInitialOptions = false;
    showFollowUp = false;

    conversationHistory.push({"role": "user", "content": text, "timestamp": currentTime});

    debouncedSendConversationToAzure(messages);

    isLoading = true;
    addMessage('', true, true, currentTime);

    try {
      const formattedHistory = conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join(' ');
      const fullQuery = `conversation_history: ${formattedHistory} question: ${text}`;

      const encodedQuery = encodeURIComponent(fullQuery);
      const url = `${API_BASE_URL}?question=${encodedQuery}`;

      const response = await fetch(url, {
        method: 'GET',
      });

      const data = await response.json();
      const answer = data.answer;

      const responseTime = new Date().toISOString();
      conversationHistory.push({"role": "assistant", "content": answer, "timestamp": responseTime});

      messages[messages.length - 1] = { text: answer, isBot: true, isLoading: false, timestamp: responseTime };
      
      debouncedSendConversationToAzure(messages);

      if (!answer.includes('?') && Math.random() < 0.5) {
        setTimeout(() => {
          const followUpTime = new Date().toISOString();
          addMessage("Kan jag hjälpa dig med något mer?", true, false, followUpTime);
          showFollowUp = true;
          updateChatWindow();
        }, 1000);
      } else {
        showFollowUp = false;
      }

    } catch (error) {
      console.error('Error fetching bot response:', error);
      const errorTime = new Date().toISOString();
      messages[messages.length - 1] = { 
        text: 'Tyvärr kunde jag inte ansluta just nu. Vänligen försök igen senare eller kontakta oss via kundservice@happyflops.se', 
        isBot: true, 
        isLoading: false,
        timestamp: errorTime
      };
    } finally {
      isLoading = false;
      updateChatWindow();
    }
  }

  function addMessage(text, isBot, isLoading = false, timestamp = new Date().toISOString()) {
    messages.push({ text, isBot, isLoading, timestamp });
    updateChatWindow();
    saveConversation();
  }

  function handleFollowUpResponse(response) {
    // Immediately hide the follow-up buttons
    showFollowUp = false;
    updateChatWindow();
  
    if (response === "customer_service") {
      fetchAndDisplayConversation();
    } else {
      const userResponse = response === "yes" ? "Ja" : "Nej";
      addMessage(userResponse, false);
      
      // Use setTimeout to add a small delay before the bot responds
      setTimeout(() => {
        addMessage(
          response === "yes" ? "Vad mer kan jag hjälpa dig med?" : "Okej, tack för att du chattat med mig!", 
          true
        );
        updateChatWindow();
      }, 500);
    }
  }

  async function fetchAndDisplayConversation() {
    const conversationId = window.conversationId || generateUUID();
    const url = `https://rosterai-fresh-function.azurewebsites.net/api/getconversation?conversationId=${conversationId}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      messages = [];

      data.messages.forEach(msg => {
        addMessage(msg.text, msg.isBot, false, msg.timestamp);
      });

      addMessage("Du har kopplats till kundtjänst. En representant kommer att ansluta snart.", true);

      showFollowUp = false;
      updateChatWindow();
    } catch (error) {
      console.error('Error fetching conversation:', error);
      addMessage("Det uppstod ett fel vid anslutning till kundtjänst. Vänligen försök igen senare.", true);
    }
  }

  function updateChatWindow() {
    const messagesWrapper = document.querySelector('.happyflops-messages-wrapper');
    if (messagesWrapper) {
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
        const followUpElement = createFollowUpButtons();
        messagesWrapper.appendChild(followUpElement);
      }
      
      scrollToBottom();
    }
    saveConversation();
  }

  function scrollToBottom() {
    const messagesContainer = document.querySelector('.happyflops-messages-container');
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }

  function addMessageWithDelay(text, isBot, delay, callback) {
    addMessage('', isBot, true);
    updateChatWindow();
    
    setTimeout(() => {
      messages[messages.length - 1] = { text, isBot, isLoading: false };
      updateChatWindow();
      if (callback) callback();
    }, delay);
  }

  function initializeChat() {
    if (!isInitialized) {
      const initialMessage = 'Hej! Mitt namn är Elliot och jag är din virtuella assistent här på Vanbruun.';
      addMessageWithDelay(initialMessage, true, 1000, () => {
        conversationHistory.push({"role": "assistant", "content": initialMessage});
        const followUpMessage = 'Vad kan jag hjälpa dig med idag?😊';
        addMessageWithDelay(followUpMessage, true, 500, () => {
          conversationHistory.push({"role": "assistant", "content": followUpMessage});
          showInitialOptions = true;
          updateChatWindow();
        });
      });
      
      isInitialized = true;
    } else {
      updateChatWindow();
    }
  }

  function saveConversation() {
    localStorage.setItem('vanbruunChatMessages', JSON.stringify(messages));
    localStorage.setItem('vanbruunChatHistory', JSON.stringify(conversationHistory));
    localStorage.setItem('vanbruunChatId', window.conversationId || '');
    localStorage.setItem('vanbruunChatShowInitialOptions', JSON.stringify(showInitialOptions));
    localStorage.setItem('vanbruunChatShowFollowUp', JSON.stringify(showFollowUp));
    localStorage.setItem('vanbruunChatIsOpen', JSON.stringify(isChatOpen));
    localStorage.setItem('vanbruunChatLastMessage', JSON.stringify(messages[messages.length - 1]));
  }

  function loadConversation() {
    const storedMessages = localStorage.getItem('vanbruunChatMessages');
    const storedHistory = localStorage.getItem('vanbruunChatHistory');
    const storedId = localStorage.getItem('vanbruunChatId');
    const storedShowInitialOptions = localStorage.getItem('vanbruunChatShowInitialOptions');
    const storedShowFollowUp = localStorage.getItem('vanbruunChatShowFollowUp');
    const storedIsChatOpen = localStorage.getItem('vanbruunChatIsOpen');
    const storedLastMessage = localStorage.getItem('vanbruunChatLastMessage');

    if (storedMessages) {
      messages = JSON.parse(storedMessages);
    }
    if (storedHistory) {
      conversationHistory = JSON.parse(storedHistory);
    }
    if (storedId) {
      window.conversationId = storedId;
    } else {
      window.conversationId = generateUUID();
    }
    if (storedShowInitialOptions !== null) {
      showInitialOptions = JSON.parse(storedShowInitialOptions);
    }
    if (storedShowFollowUp !== null) {
      showFollowUp = JSON.parse(storedShowFollowUp);
    }
    if (storedIsChatOpen !== null) {
      isChatOpen = JSON.parse(storedIsChatOpen);
    }
    if (storedLastMessage) {
      const lastMessage = JSON.parse(storedLastMessage);
      if (lastMessage && lastMessage.isBot && !lastMessage.text.includes('?')) {
        showFollowUp = true;
      }
    }

    isInitialized = messages.length > 0;
  }

  function restartConversation() {
    messages = [];
    conversationHistory = [];
    isInitialized = false;
    showInitialOptions = false;
    showFollowUp = false;
    window.conversationId = generateUUID();

    localStorage.removeItem('vanbruunChatMessages');
    localStorage.removeItem('vanbruunChatHistory');
    localStorage.removeItem('vanbruunChatId');
    localStorage.removeItem('vanbruunChatShowInitialOptions');
    localStorage.removeItem('vanbruunChatShowFollowUp');
    localStorage.removeItem('vanbruunChatLastMessage');

    initializeChat();
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  const debouncedSendConversationToAzure = debounce(async (messages) => {
    const url = 'https://rosterai-fresh-function.azurewebsites.net/api/storeconversation';
    const payload = {
      conversationId: window.conversationId || (window.conversationId = generateUUID()),
      messages: messages.map(msg => ({
        text: msg.text,
        isBot: msg.isBot,
        timestamp: msg.timestamp
      }))
    };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      console.log('Conversation stored successfully');
    } catch (error) {
      console.error('Error storing conversation:', error);
    }
  }, 2000);

  createChatbotUI();

  window.openVanbruunChat = function() {
    isChatOpen = true;
    saveConversation();
    renderChatbot();
    initializeChat();
  };

  console.log('Chatbot script loaded and initialized');
})();

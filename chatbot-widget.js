
(function() {
  const API_BASE_URL = 'https://fd-gee0ghfphbcsfvex.z01.azurefd.net/api/HttpTrigger';
  const CONVERSATION_API_URL = 'https://rosterai-chat-function.azurewebsites.net/api/getconversation?code=';
  const STORE_CONVERSATION_API_URL = 'https://rosterai-chat-function.azurewebsites.net/api/storeconversation?code=';

  let messages = [];
  let conversationHistory = [];
  let isInitialized = false;
  let isChatOpen = false;
  let isLoading = false;
  let showInitialOptions = false;
  let showFollowUp = false;
  let isConnectedToCustomerService = false;
  let customerServiceInterval;
  
  const config = {
    headerText: 'VANBRUUN AI',
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
    chatbotContainer.style.fontFamily = 'Montserrat, sans-serif';

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
    logo.alt = 'Vanbruun Logo';
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

    const inputContainer = document.createElement('div');
    inputContainer.className = 'happyflops-input-container';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Skriv ett meddelande...';
    input.className = 'happyflops-input';

    const emojiButton = document.createElement('button');
    emojiButton.innerHTML = '😈'; 
    emojiButton.className = 'happyflops-emoji-button';
    emojiButton.addEventListener('click', toggleEmojiPicker);

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

    inputContainer.appendChild(input);
    inputContainer.appendChild(emojiButton);
    inputContainer.appendChild(sendButton);
    inputArea.appendChild(inputContainer);

    return inputArea;
  }

  function toggleEmojiPicker(event) {
    event.stopPropagation();
    console.log('Emoji button clicked');

    const existingPicker = document.querySelector('.happyflops-emoji-picker');
    
    if (existingPicker) {
      console.log('Removing existing picker');
      existingPicker.remove();
      return;
    }

    console.log('Creating new emoji picker');
    const emojiPicker = document.createElement('div');
    emojiPicker.className = 'happyflops-emoji-picker';

    const emojis = ['😊', '😂', '🤔', '👍', '❤️', '😍', '🙏', '👀', '🎉', '🔥', '👋', '🤷‍♂️', '🤷‍♀️', '🙌', '👏', '🎈', '🌟', '💡', '✅', '❓'];
    
    emojis.forEach(emoji => {
      const emojiButton = document.createElement('button');
      emojiButton.textContent = emoji;
      emojiButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const input = document.querySelector('.happyflops-input');
        const startPos = input.selectionStart;
        const endPos = input.selectionEnd;
        input.value = input.value.substring(0, startPos) + emoji + input.value.substring(endPos);
        input.focus();
        input.selectionStart = input.selectionEnd = startPos + emoji.length;
        emojiPicker.remove();
      });
      emojiPicker.appendChild(emojiButton);
    });

    const inputArea = event.target.closest('.happyflops-input-area');
    inputArea.appendChild(emojiPicker);

    // Position the picker
    const rect = event.target.getBoundingClientRect();
    const inputAreaRect = inputArea.getBoundingClientRect();
    emojiPicker.style.bottom = `${inputAreaRect.height}px`;
    emojiPicker.style.right = `${inputAreaRect.width - (rect.right - inputAreaRect.left)}px`;

    console.log('Emoji picker created and positioned');

    function closeEmojiPicker(e) {
      if (!emojiPicker.contains(e.target) && e.target !== event.target) {
        console.log('Closing emoji picker');
        emojiPicker.remove();
        document.removeEventListener('click', closeEmojiPicker);
      }
    }

    setTimeout(() => {
      document.addEventListener('click', closeEmojiPicker);
    }, 0);

    const chatWindow = document.querySelector('.happyflops-chat-window');
    if (chatWindow) {
      chatWindow.addEventListener('scroll', () => {
        console.log('Chat window scrolled, removing emoji picker');
        emojiPicker.remove();
        document.removeEventListener('click', closeEmojiPicker);
      }, { once: true });
    }
  }

  function createMessageElement(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `happyflops-message ${message.isBot ? 'bot' : 'user'}`;
  
    // Create a container for the agent name
    if (message.agentName) {
      const agentNameElement = document.createElement('div');
      agentNameElement.className = 'happyflops-agent-name';
      agentNameElement.textContent = message.agentName;
      messageElement.appendChild(agentNameElement);
    }    
    
    const textElement = document.createElement('div');
    textElement.className = 'happyflops-message-text';
    textElement.textContent = message.text;
    
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
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    
    message = message.replace(emailRegex, (email) => {
      return `<a href="mailto:${email}" target="_blank" rel="noopener noreferrer">${email}</a>`;
    });

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
    
    const options = [
      { text: 'Ja', response: 'ja' },
      { text: 'Nej', response: 'nej' },
      { text: 'Prata med kundtjänst', response: 'customer_service' }
    ];
    
    options.forEach(option => {
      const button = document.createElement('button');
      button.textContent = option.text;
      button.className = 'happyflops-option-button';
      button.addEventListener('click', () => handleFollowUpResponse(option.response));
      followUpElement.appendChild(button);
    });
  
    return followUpElement;
  }

  const API_KEY = 'xZkIhzOOgQsoQftYWvhyfg1shu83UoJ7yRCMnXs-MVAeAzFuuDZdtQ==';

  function getCETTimestamp() {
    const now = new Date();
    const utcOffset = now.getTimezoneOffset();
    const cetOffset = utcOffset + 60; // CET is UTC+1
    return new Date(now.getTime() + cetOffset * 60000).toISOString();
  }

  async function sendMessage(text) {
    if (text.trim() === '' || isLoading) return;
  
    const currentTime = getCETTimestamp();
  
    addMessage(text, false, false, currentTime);
    showInitialOptions = false;
    showFollowUp = false;
  
    conversationHistory.push({"role": "user", "content": text, "timestamp": currentTime});
  
    if (text.toLowerCase().includes('prata med kundtjänst') && !isConnectedToCustomerService) {
      isConnectedToCustomerService = true;
      addMessage("Kopplar dig till kundtjänst...", true, false, getCETTimestamp());
      await sendConversationToAzure(messages, true);
      startCustomerServiceMode();
      return;
    }
  
    if (isConnectedToCustomerService) {
      await sendConversationToAzure(messages, true);
      fetchAndDisplayConversation();
    } else {
      isLoading = true;
      addMessage('', true, true);
      updateChatWindow();
  
      try {
        const formattedHistory = conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join(' ');
        const fullQuery = `conversation_history: ${formattedHistory} question: ${text}`;
  
        const encodedQuery = encodeURIComponent(fullQuery);
        const url = `${API_BASE_URL}?question=${encodedQuery}`;
  
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'x-functions-key': API_KEY
          }
        });
  
        const data = await response.json();
        const answer = data.answer;
  
        const responseTime = getCETTimestamp();
        conversationHistory.push({"role": "assistant", "content": answer, "timestamp": responseTime});
  
        messages[messages.length - 1] = { text: answer, isBot: true, isLoading: false, timestamp: responseTime };
        
        await sendConversationToAzure(messages);
  
        if (!answer.includes('?') && Math.random() < 0.5) {
          setTimeout(() => {
            const followUpTime = getCETTimestamp();
            addMessage("Kan jag hjälpa dig med något mer?", true, false, followUpTime);
            conversationHistory.push({"role": "assistant", "content": "Kan jag hjälpa dig med något mer?", "timestamp": followUpTime});
            showFollowUp = true;
            updateChatWindow();
            sendConversationToAzure(messages);
          }, 1000);
        } else {
          showFollowUp = false;
        }
  
      } catch (error) {
        console.error('Error fetching bot response:', error);
        const errorTime = getCETTimestamp();
        const errorMessage = 'Sorry, I couldn\'t connect right now. Please try again later or contact us at customer.service@happyflops.se';
        messages[messages.length - 1] = { 
          text: errorMessage, 
          isBot: true, 
          isLoading: false,
          timestamp: errorTime
        };
        conversationHistory.push({"role": "assistant", "content": errorMessage, "timestamp": errorTime});
        await sendConversationToAzure(messages);
      } finally {
        isLoading = false;
        updateChatWindow();
      }
    }
  }




  function addMessage(text, isBot, isLoading = false, timestamp = new Date().toISOString(), agentName = null, agentId = null) {
    messages.push({ text, isBot, isLoading, timestamp, agentName, agentId });
    updateChatWindow();
    saveConversation();
  }

  function createStarRating() {
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'happyflops-rating-container';
    ratingContainer.style.textAlign = 'center';
    ratingContainer.style.padding = '10px';
  
    const starsContainer = document.createElement('div');
    starsContainer.className = 'happyflops-stars-container';
  
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.className = 'happyflops-star';
      star.innerHTML = '☆';
      star.style.fontSize = '24px';
      star.style.cursor = 'pointer';
      star.style.color = config.mainColor;
      star.addEventListener('click', () => handleStarClick(i));
      starsContainer.appendChild(star);
    }
  
    ratingContainer.appendChild(starsContainer);
    return ratingContainer;
  }
  
  function handleStarClick(rating) {
    const stars = document.querySelectorAll('.happyflops-star');
    stars.forEach((star, index) => {
      if (index < rating) {
        star.innerHTML = '★';
      } else {
        star.innerHTML = '☆';
      }
    });
    sendRating(rating);
  }

  function addMessage(text, isBot, isLoading = false, timestamp = getCETTimestamp(), agentName = null, agentId = null) {
    messages.push({ text, isBot, isLoading, timestamp, agentName, agentId });
    updateChatWindow();
    saveConversation();
  }
  
  async function sendRating(rating) {
    const payload = {
      conversationId: window.conversationId,
      rating: rating,
      ConversationOver: true,
      timestamp: getCETTimestamp()
    };
  
    try {
      const response = await fetch(STORE_CONVERSATION_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-functions-key': STORE_CONVERSATION_API_KEY
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      console.log('Rating stored successfully');
      addMessage('Thank you for your feedback!', true, false, getCETTimestamp());
    } catch (error) {
      console.error('Error storing rating:', error);
      addMessage('Thank you for your feedback!', true, false, getCETTimestamp());
    }
  }


  
  
  function handleFollowUpResponse(response) {
    showFollowUp = false;
    updateChatWindow();
  
    if (response === "customer_service") {
      isConnectedToCustomerService = true;
      const customerServiceMessage = "Prata med kundtjänst.";
      const timestamp = getCETTimestamp();
      
      addMessage(customerServiceMessage, false, false, timestamp);
      conversationHistory.push({"role": "user", "content": customerServiceMessage, "timestamp": timestamp});
      
      const botResponse = "Kopplar dig till kundtjänst...";
      addMessage(botResponse, true, false, timestamp);
      conversationHistory.push({"role": "assistant", "content": botResponse, "timestamp": timestamp});
  
      sendConversationToAzure(messages, true).then(() => {
        startCustomerServiceMode();
      });
    } else {
      const userResponse = response === "yes" ? "Ja" : "Nej";
      addMessage(userResponse, false, false, getCETTimestamp());
      
      setTimeout(() => {
        if (response === "yes") {
          const botResponse = "Vad mer kan jag hjälpa dig med?";
          addMessage(botResponse, true, false, getCETTimestamp());
          updateChatWindow();
          sendConversationToAzure(messages);
        } else {
          const botResponse = "Okej, tack för att du chattat med mig!";
          addMessage(botResponse, true, false, getCETTimestamp());
          updateChatWindow();
          sendConversationToAzure(messages).then(() => {
            sendConversationOverStatus();
          });
        }
      }, 500);
    }
    saveConversation();
  }

  // New function to send conversation_over status
  async function sendConversationOverStatus() {
    const STORE_CONVERSATION_API_KEY = 'bu2CR0iJw49cZoLrY8rWhMoOnuI6o7A3BElg2Iot3wXVAzFuq8K2AQ==';
    const url = `${STORE_CONVERSATION_API_URL}${STORE_CONVERSATION_API_KEY}`
    const payload = {
      conversationId: window.conversationId,
      conversation_over: true
    };
    console.log('Sending conversation_over')
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      console.log('Conversation over status sent successfully');
    } catch (error) {
      console.error('Error sending conversation over status:', error);
    }
  }

  async function fetchAndDisplayConversation() {
    const conversationId = window.conversationId || generateUUID();
    const CONVERSATION_API_KEY = 'tqrM0w0XHMSObpoVWwcq4h9vt8-3koXfb15whKZji48zAzFumJ2clA==';
    const url = `${CONVERSATION_API_URL}${CONVERSATION_API_KEY}&conversationId=${encodeURIComponent(conversationId)}`;
  
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
  
      if (messages.length === 0 || !isConnectedToCustomerService) {
        messages = [];
        data.messages.forEach(msg => {
          addMessage(msg.text, msg.isBot, false, msg.timestamp, msg.agentName, msg.agentId);
        });
      } else {
        const lastMessageTimestamp = messages[messages.length - 1].timestamp;
        const newMessages = data.messages.filter(msg => new Date(msg.timestamp) > new Date(lastMessageTimestamp));
        newMessages.forEach(msg => {
          addMessage(msg.text, msg.isBot, false, msg.timestamp, msg.agentName, msg.agentId);
        });
      }
  
      // Check if the user wants to talk to customer service
      const lastUserMessage = data.messages.filter(msg => !msg.isBot).pop();
      if (lastUserMessage && 
          lastUserMessage.text.toLowerCase().includes('prata med kundtjänst') && 
          !isConnectedToCustomerService) {
        isConnectedToCustomerService = true;
        const connectingMessage = "Connecting you to customer service...";
        if (!messages.some(msg => msg.text === connectingMessage)) {
          addMessage(connectingMessage, true, false, new Date().toISOString());
          await sendConversationToAzure(messages, true);
          startCustomerServiceMode();
        }
      }
  
      showFollowUp = false;
      updateChatWindow();
    } catch (error) {
      console.error('Error fetching conversation:', error);
      if (messages.length === 0) {
        addMessage("Ett fel kom upp när vi försökte koppla ihop dig med kundtjänst, försök igen senare.", true);
      }
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
      
      if (showInitialOptions && !isConnectedToCustomerService) {
        const optionsElement = createInitialOptions();
        messagesWrapper.appendChild(optionsElement);
      }
      if (showFollowUp && !isConnectedToCustomerService) {
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

  function initializeChat() {
    if (!isInitialized) {
      const initialMessage = 'Hej! \n Mitt namn är Elliot och jag är din virtuella assistent här på Vanbruun..';
      addMessageWithDelay(initialMessage, true, 1000, () => {
        conversationHistory.push({"role": "assistant", "content": initialMessage});
        const followUpMessage = 'Hur kan jag hjälpa dig idag?😊';
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

  function addMessageWithDelay(text, isBot, delay, callback) {
    addMessage('', isBot, true);
    updateChatWindow();
    
    setTimeout(() => {
      messages[messages.length - 1] = { text, isBot, isLoading: false };
      updateChatWindow();
      if (callback) callback();
    }, delay);
  }

  function saveConversation() {
    localStorage.setItem('vanbruunChatMessages', JSON.stringify(messages));
    localStorage.setItem('vanbruunChatHistory', JSON.stringify(conversationHistory));
    localStorage.setItem('vanbruunChatId', window.conversationId || '');
    localStorage.setItem('vanbruunChatShowInitialOptions', JSON.stringify(showInitialOptions));
    localStorage.setItem('vanbruunChatShowFollowUp', JSON.stringify(showFollowUp));
    localStorage.setItem('vanbruunChatIsOpen', JSON.stringify(isChatOpen));
    localStorage.setItem('vanbruunChatLastMessage', JSON.stringify(messages[messages.length - 1]));
    localStorage.setItem('vanbruunChatIsConnectedToCustomerService', JSON.stringify(isConnectedToCustomerService));
    
    // Only save isLoading state if it's true
    if (isLoading) {
      localStorage.setItem('vanbruunChatIsLoading', JSON.stringify(isLoading));
    } else {
      localStorage.removeItem('vanbruunChatIsLoading');
    }
  
    // Save the current timestamp
    localStorage.setItem('vanbruunChatLastSaved', new Date().toISOString());
  }
  
  function loadConversation() {
    const storedMessages = localStorage.getItem('vanbruunChatMessages');
    const storedHistory = localStorage.getItem('vanbruunChatHistory');
    const storedId = localStorage.getItem('vanbruunChatId');
    const storedShowInitialOptions = localStorage.getItem('vanbruunChatShowInitialOptions');
    const storedShowFollowUp = localStorage.getItem('vanbruunChatShowFollowUp');
    const storedIsChatOpen = localStorage.getItem('vanbruunChatIsOpen');
    const storedLastMessage = localStorage.getItem('vanbruunChatLastMessage');
    const storedIsConnectedToCustomerService = localStorage.getItem('vanbruunChatIsConnectedToCustomerService');
    const storedIsLoading = localStorage.getItem('vanbruunChatIsLoading');
  
    if (storedMessages) {
      messages = JSON.parse(storedMessages);
      // Remove any incomplete (loading) messages
      messages = messages.filter(msg => !msg.isLoading);
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
    if (storedIsConnectedToCustomerService !== null) {
      isConnectedToCustomerService = JSON.parse(storedIsConnectedToCustomerService);
    }
  
    // Always reset isLoading to false on page load
    isLoading = false;
  
    // Reset showFollowUp to false by default
    showFollowUp = false;
  
    if (storedLastMessage) {
      const lastMessage = JSON.parse(storedLastMessage);
      // Only show follow-up if the last message was a specific prompt from the bot
      if (lastMessage && lastMessage.isBot && lastMessage.text === "Kan jag hjälpa dig med något mer?") {
        showFollowUp = true;
      }
    }
  
    isInitialized = messages.length > 0;
  
    // If chat is connected to customer service, ensure follow-up buttons are not shown
    if (isConnectedToCustomerService) {
      showFollowUp = false;
    }
  
    // If the last message was incomplete, add an error message
    if (storedIsLoading === 'true') {
      const errorMessage = 'Det uppstod ett fel när svaret genererades. Vänligen försök igen.';
      addMessage(errorMessage, true, false, new Date().toISOString());
    }
  
    updateChatWindow();
  }
  



  function restartConversation() {
    if (customerServiceInterval) {
      clearInterval(customerServiceInterval);
    }
    isConnectedToCustomerService = false;
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
    localStorage.removeItem('vanbruunChatIsConnectedToCustomerService');

    initializeChat();
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }


  async function sendConversationOverStatus() {
    const payload = {
      conversationId: window.conversationId,
      conversation_over: true,
      timestamp: getCETTimestamp()
    };
  
    try {
      const response = await fetch(STORE_CONVERSATION_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-functions-key': STORE_CONVERSATION_API_KEY
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      console.log('Conversation over status sent successfully');
    } catch (error) {
      console.error('Error sending conversation over status:', error);
    }
  }

  

  async function sendConversationToAzure(messages, needsCustomerService = false) {
    const STORE_CONVERSATION_API_KEY = 'bu2CR0iJw49cZoLrY8rWhMoOnuI6o7A3BElg2Iot3wXVAzFuq8K2AQ==';
    const url = `${STORE_CONVERSATION_API_URL}${STORE_CONVERSATION_API_KEY}`;
    const payload = {
      conversationId: window.conversationId || (window.conversationId = generateUUID()),
      messages: messages.map(msg => ({
        text: msg.text,
        isBot: msg.isBot,
        timestamp: msg.timestamp,
        agentName: msg.agentName,
        agentId: msg.agentId
      })),
      needsCustomerService: needsCustomerService || isConnectedToCustomerService,
      timestamp: getCETTimestamp()
    };
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
  }

  
  createChatbotUI();

  window.openVanbruunChat = function() {
    isChatOpen = true;
    saveConversation();
    renderChatbot();
    initializeChat();
  };

  console.log('Chatbot script loaded and initialized');
})();

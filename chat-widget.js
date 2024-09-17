(function() {
  const convo_operations_url = 'https://boxbollen-chat-new.azurewebsites.net/api/conversationoperations?code=_sSpPVu8npJbLaeS1FJFbatmtVVShl0_aDkcQEpUskHKAzFuyqYYOQ==';
  const ORDER_API = 'https://boxbollen-chat-new.azurewebsites.net/api/orderapicall?code=VlDzZhnAPk4x0Y9x0q8FDuZ16aNGVko--MlbzCjB9leiAzFu3mESLg==';
  const API_BASE_URL = `https://boxbollen-chat-new.azurewebsites.net/api/AIResponse?code=9rhFu3kfzEln8s_x9cHRbMvUYBKriBP3LABZKcoGEbMAAzFuAVD41w==`;
  const RAW_API = `https://boxbollen-chat-new.azurewebsites.net/api/RAWAIResponse?code=UfRTHk68dfFizpjkkECSMtTmbmHiZ19UJWyMSD2TgtAJAzFuAQkIkQ==`;

  let shownProductCard = false;
  let messages = [];
  let conversationHistory = [];
  let isInitialized = false;
  let showNoOrderIdButton = false;
  let isChatOpen = false;
  let isWaitingForResponse = false;
  let isLoading = false;
  let pendingUserInput = '';
  let showInitialOptions = false;
  let showFollowUp = false;
  let isWaitingForOrderInfo = false;
  let orderNumber = '';
  let orderEmail = '';
  let isConversationEnded = false;
  let showRatingSystem = false;
  let isEndConversationOverlayShown = false;
  let showTryAgainButtons = false;
  let isWaitingForCardDigits = false;
  let cardLastFourDigits = '';

  const config = {
    headerText: 'Boxbollen AI',
    subHeaderText: 'Chat with our digital assistant',
    mainColor: '#F80B00',
    logoUrl: 'https://i.ibb.co/61kG13C/boxbollen.jpg',
    launchAvatarUrl: 'https://i.ibb.co/zQkKbfv/Chatbubble-removebg-preview-removebg-preview.png'
  };

  function createChatbotUI() {
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'chat-chatbot';
    chatbotContainer.style.position = 'fixed';
    chatbotContainer.style.bottom = '20px';
    chatbotContainer.style.right = '20px';
    chatbotContainer.style.fontFamily = 'Nunito, sans-serif';

    document.body.appendChild(chatbotContainer);

    loadConversation();
    renderChatbot();
  }

  function renderChatbot() {
    const chatbotContainer = document.getElementById('chat-chatbot');
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
    button.className = 'chat-launch-button';
    button.style.backgroundColor = config.mainColor;
    
    const img = document.createElement('img');
    img.src = config.launchAvatarUrl;
    img.alt = 'Chat Avatar';
    img.className = 'chat-launch-avatar';
    
    button.appendChild(img);
    button.addEventListener('click', () => {
      isChatOpen = true;
      saveConversation();
      renderChatbot();
      initializeChat();
    });
  
    return button;
  }

  function createChatWindow() {
    const chatWindow = document.createElement('div');
    chatWindow.className = 'chat-window';
  
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
    header.className = 'chat-header';
    header.style.backgroundColor = config.mainColor;
  
    const headerContent = document.createElement('div');
    headerContent.className = 'chat-header-content';
  
    const headerImage = document.createElement('img');
    headerImage.src = config.logoUrl;
    headerImage.alt = 'Boxbollen';
    headerImage.className = 'chat-header-image';
  
    const headerText = document.createElement('div');
    headerText.className = 'chat-header-text';
  
    const title = document.createElement('h1');
    title.textContent = config.headerText;
  
    const subtitle = document.createElement('p');
    subtitle.textContent = config.subHeaderText;
  
    headerText.appendChild(title);
    headerText.appendChild(subtitle);
  
    headerContent.appendChild(headerImage);
    headerContent.appendChild(headerText);
  
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'chat-header-buttons';

    const reloadButton = document.createElement('button');
    reloadButton.innerHTML = '&#x21bb;';
    reloadButton.className = 'chat-button chat-reload-button';
    reloadButton.title = 'Restart conversation';
    reloadButton.addEventListener('click', () => {
      restartConversation();
    });
  
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.className = 'chat-button chat-close-button';
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
    container.className = 'chat-messages-container';
  
    const messagesWrapper = document.createElement('div');
    messagesWrapper.className = 'chat-messages-wrapper';
  
    const logoContainer = createChatLogo();
    messagesWrapper.appendChild(logoContainer);
  
    container.appendChild(messagesWrapper);
  
    return container;
  }

  function createChatLogo() {
    const logoContainer = document.createElement('div');
    logoContainer.className = 'chat-logo-container';
  
    const logo = document.createElement('img');
    logo.src = config.logoUrl;
    logo.alt = 'Boxbollen Logo';
    logo.className = 'chat-logo';
  
    const logoText = document.createElement('div');
    logoText.className = 'chat-logo-text';
    logoText.innerHTML = `<h2>${config.headerText}</h2><p>${config.subHeaderText}</p>`;
  
    logoContainer.appendChild(logo);
    logoContainer.appendChild(logoText);
  
    return logoContainer;
  }

  function createInputArea() {
    const inputArea = document.createElement('div');
    inputArea.className = 'chat-input-area';
  
    if (!isConversationEnded && !showRatingSystem) {
      const inputContainer = document.createElement('div');
      inputContainer.className = 'chat-input-container';
      
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Write a message...';
      input.className = 'chat-input';
      input.value = pendingUserInput;
      input.disabled = false;
      
      const smileySvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round">
      <circle cx="50" cy="50" r="42" />
      <path d="M30 60 Q50 75 70 60" />
      <circle cx="35" cy="40" r="6" fill="currentColor" stroke="none" />
      <circle cx="65" cy="40" r="6" fill="currentColor" stroke="none" />
      </svg>`;
    
      const emojiButton = document.createElement('button');
      emojiButton.innerHTML = smileySvg; 
      emojiButton.className = 'chat-emoji-button';
      emojiButton.addEventListener('click', toggleEmojiPicker);
      emojiButton.disabled = isWaitingForResponse;
      
      const sendButton = document.createElement('button');
      sendButton.textContent = 'Send';
      sendButton.className = 'chat-send-button';
      sendButton.style.backgroundColor = config.mainColor;
      sendButton.disabled = isWaitingForResponse;
  
      const handleSendMessage = () => {
        if (isWaitingForResponse) return;
        const message = input.value.trim();
        if (message !== '') {
          input.value = '';
          pendingUserInput = '';
          sendMessage(message);
          sendButton.disabled = true;
        }
      };
  
      sendButton.addEventListener('click', handleSendMessage);
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !isWaitingForResponse) {
          handleSendMessage();
        }
      });
  
      input.addEventListener('input', (e) => {
        pendingUserInput = e.target.value;
        sendButton.disabled = e.target.value.trim() === '' || isWaitingForResponse;
      });
  
      inputContainer.appendChild(input);
      inputContainer.appendChild(emojiButton);
      inputContainer.appendChild(sendButton);
      inputArea.appendChild(inputContainer);
    }
  
    return inputArea;
  }

  function toggleEmojiPicker(event) {
    event.stopPropagation();
    console.log('Emoji button clicked');
  
    const existingPicker = document.querySelector('.chat-emoji-picker');
    
    if (existingPicker) {
      console.log('Removing existing picker');
      existingPicker.remove();
      return;
    }
  
    console.log('Creating new emoji picker');
    const emojiPicker = document.createElement('div');
    emojiPicker.className = 'chat-emoji-picker';
  
    const emojis = ['😊', '😂', '🤔', '👍', '❤️', '😍', '🙏', '👀', '🎉', '🔥', '👋', '🤷‍♂️', '🤷‍♀️', '🙌', '👏', '🎈', '🌟', '💡', '✅', '❓'];
    
    emojis.forEach(emoji => {
      const emojiButton = document.createElement('button');
      emojiButton.textContent = emoji;
      emojiButton.addEventListener('click', (e) => {
        e.stopPropagation();
        const input = document.querySelector('.chat-input');
        const startPos = input.selectionStart;
        const endPos = input.selectionEnd;
        input.value = input.value.substring(0, startPos) + emoji + input.value.substring(endPos);
        input.focus();
        input.selectionStart = input.selectionEnd = startPos + emoji.length;
        emojiPicker.remove();
      });
      emojiPicker.appendChild(emojiButton);
    });
  
    const inputArea = event.target.closest('.chat-input-area');
    inputArea.appendChild(emojiPicker);
  
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
  
    const chatWindow = document.querySelector('.chat-window');
    if (chatWindow) {
      chatWindow.addEventListener('scroll', () => {
        console.log('Chat window scrolled, removing emoji picker');
        emojiPicker.remove();
        document.removeEventListener('click', closeEmojiPicker);
      }, { once: true });
    }
  }

  function formatMessage(message) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    message = message.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    message = message.replace(emailRegex, (email) => {
      return `<a href="mailto:${email}">${email}</a>`;
    });

    const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g;
    message = message.replace(markdownLinkRegex, (match, text, url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });

    return message;
  }

  function createMessageElement(message) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `chat-message-wrapper ${message.isBot ? 'bot' : 'user'}`;
  
    if (message.isBot) {
      const profileImage = document.createElement('img');
      profileImage.src = config.logoUrl;
      profileImage.alt = 'Bot Profile';
      profileImage.className = 'chat-bot-profile-image';
      messageWrapper.appendChild(profileImage);
    }
  
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${message.isBot ? 'bot' : 'user'}`;
    
    if (message.className) {
      messageElement.classList.add(message.className);
    }
  
    const textElement = document.createElement('div');
    textElement.className = 'chat-message-text';
    
    if (message.isLoading) {
      textElement.innerHTML = '<div class="chat-loading-dots"><div></div><div></div><div></div></div>';
    } else if (message.isBot) {
      const formattedMessage = formatMessage(message.text);
      textElement.innerHTML = formattedMessage;
    } else {
      textElement.textContent = message.text;
    }
  
    messageElement.appendChild(textElement);
    messageWrapper.appendChild(messageElement);
  
    return messageWrapper;
  }

  function createInitialOptions() {
    const optionsElement = document.createElement('div');
    optionsElement.className = 'chat-initial-options';

    const options = ['Track my order'];
    options.forEach(option => {
      const button = document.createElement('button');
      button.textContent = option;
      button.className = 'chat-option-button';
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
    followUpElement.className = 'chat-follow-up-options';
    
    const options = [
      { text: 'Yes', response: 'yes' },
      { text: 'No', response: 'no' }
    ];
    
    options.forEach(option => {
      const button = document.createElement('button');
      button.textContent = option.text;
      button.className = 'chat-option-button';
      button.addEventListener('click', () => handleFollowUpResponse(option.response));
      followUpElement.appendChild(button);
    });
  
    return followUpElement;
  }

  async function handleFollowUpResponse(response) {
    showFollowUp = false;
    updateChatWindow();
  
    const userResponse = response === "yes" ? "Yes" : "No";
    addMessage(userResponse, false, false, getStockholmTimestamp());
    
    if (response === "yes") {
      await showLoadingThenMessage("Great! What else can I help you with?");
      updateChatWindow();
      sendConversationToAzure(messages);
    } else {
      await showLoadingThenMessage("Alright, thank you for chatting with me! If you need any more help, feel free to ask.");
      updateChatWindow();
      await sendConversationToAzure(messages);
      showRatingSystem = true;
      updateChatWindow();
    }
  }

  function endConversation() {
    isConversationEnded = true;
    updateChatWindow();
  }
  
  function handleStarClick(rating) {
    console.log('Star clicked:', rating);
    updateStars(rating);
    
    const ratingContainer = document.querySelector('.chat-rating-container');
    if (ratingContainer) {
      ratingContainer.remove();
    }
  
    isConversationEnded = true;
  
    createEndConversationOverlay();
  
    sendRating(rating);
  }
  
  async function sendRating(rating) {
    const url = convo_operations_url;
    const payload = {
      operation: 'store',
      conversationId: window.conversationId,
      Rating: rating,
      timestamp: getStockholmTimestamp(),
      conversation_over: true
    };
  
    console.log('Sending rating:', payload);
  
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
  
      const responseData = await response.json();
      console.log('Rating stored successfully:', responseData);
      
      await sendConversationToAzure(messages);
      
    } catch (error) {
      console.error('Error storing rating:', error);
    }
  }
  
  function createEndConversationOverlay() {
    if (isEndConversationOverlayShown) return;
  
    isEndConversationOverlayShown = true;
    const chatWindow = document.querySelector('.chat-window');
    const overlay = document.createElement('div');
    overlay.className = 'chat-end-conversation-overlay';
    
    const content = document.createElement('div');
    content.className = 'chat-end-conversation-content';
    
    const message = document.createElement('p');
    message.textContent = "Okej, tack för chatten! Om du har några frågor i framtiden, tveka inte att kontakta oss. Vi på Boxbollen önskar dig en fantastisk dag! 👋";
    
    const endedMessage = document.createElement('p');
    endedMessage.className = 'chat-chat-ended';
    endedMessage.textContent = 'Chatten har avslutats.';
    
    const newChatButton = document.createElement('button');
    newChatButton.textContent = 'Starta ny konversation';
    newChatButton.className = 'chat-new-conversation-button';
    newChatButton.addEventListener('click', () => {
      restartConversation();
      overlay.remove();
      initializeChat();
    });
    
    content.appendChild(message);
    content.appendChild(endedMessage);
    content.appendChild(newChatButton);
    overlay.appendChild(content);
    
    chatWindow.appendChild(overlay);
  
    setTimeout(() => {
      overlay.classList.add('show');
    }, 50);
  }

  function createStarRating() {
    const ratingContainer = document.createElement('div');
    ratingContainer.className = 'chat-rating-container';
    ratingContainer.style.textAlign = 'center';
    ratingContainer.style.padding = '10px';
    ratingContainer.style.display = 'flex';
    ratingContainer.style.flexDirection = 'column';
    ratingContainer.style.alignItems = 'center';
    ratingContainer.style.justifyContent = 'center';
  
    const ratingPrompt = document.createElement('p');
    ratingPrompt.textContent = 'Betygsätt din upplevelse:';
    ratingPrompt.style.margin = '0 0 0 0';
    ratingPrompt.style.display = 'flex';
    ratingPrompt.style.alignItems = 'center';
    ratingPrompt.style.height = '40px';
    ratingPrompt.style.color = '#ffffff';
    ratingPrompt.style.fontWeight = 'bold';

    const starsContainer = document.createElement('div');
    starsContainer.className = 'chat-stars-container';
  
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement('span');
      star.className = 'chat-star';
      star.innerHTML = '☆';
      star.setAttribute('data-rating', i);
      star.style.fontSize = '40px';
      star.style.cursor = 'pointer';
      star.style.color = '#ffd700';
      
      star.addEventListener('click', () => handleStarClick(i));
      
      star.addEventListener('mouseover', () => {
        updateStars(i);
      });
  
      star.addEventListener('mouseout', () => {
        const currentRating = document.querySelector('.chat-star.active')?.getAttribute('data-rating') || 0;
        updateStars(currentRating);
      });
  
      starsContainer.appendChild(star);
    }
  
    ratingContainer.appendChild(ratingPrompt);
    ratingContainer.appendChild(starsContainer);
  
    return ratingContainer;
  }

  function updateStars(rating) {
    const stars = document.querySelectorAll('.chat-star');
    stars.forEach((star, index) => {
      if (index < rating) {
        star.innerHTML = '★';
        star.classList.add('active');
      } else {
        star.innerHTML = '☆';
        star.classList.remove('active');
      }
    });
  }

  async function getMainAnswerPrompt() {
    try {
      const response = await fetch('https://boxbollen-chat-new.azurewebsites.net/api/configuration?code=EzFi0G7VjmsfU3JuSzORxqXk21zmNLwORyD3EmX7fW9vAzFudY2gAA==&operation=get');
      const data = await response.json();
      
      const prompt = data.prompt;
      const timestamp = data.timestamp;
  
      console.log("Prompt:", prompt);
      console.log("Timestamp:", timestamp);
  
      return { prompt, timestamp };
    } catch (error) {
      console.error("Error fetching or parsing data:", error);
    }
  }

  function getStockholmTimestamp() {
    return new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' });
  }

  async function sendMessage(text) {
    if (text.trim() === '' || showRatingSystem || isConversationEnded || isWaitingForResponse) return;
  
    const currentTime = getStockholmTimestamp();
  
    addMessage(text, false, false, currentTime);
    showInitialOptions = false;
    showFollowUp = false;
  
    conversationHistory.push({"role": "user", "content": text, "timestamp": currentTime});
  
    if (text.toLowerCase() === 'track my order') {
      console.log("'Track my order' message detected");
      await handleOrderTracking();
      return;
    }
  
    if (isWaitingForOrderInfo) {
      await handleOrderInfo(text);
      return;
    }
  
    isLoading = true;
    isWaitingForResponse = true;
    addMessage('', true, true);
    updateChatWindow();
  
    try {
      const formattedHistory = conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join(' ');
      
      const { prompt } = await getMainAnswerPrompt();
  
      const url = `${API_BASE_URL}`;
      
      const requestBody = {
        prompt: prompt,
        question: text,
        conversation_history: formattedHistory
      };
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
  
      const data = await response.json();
      let answer = data.answer;
  
      const responseTime = getStockholmTimestamp();
  
      if (answer.includes('####WANTS_ORDER_INFO####')) {
        messages.pop();
        isWaitingForOrderInfo = true;
        orderNumber = '';
        orderEmail = '';
        await handleOrderInfo(text);
      } else {
        conversationHistory.push({"role": "assistant", "content": answer, "timestamp": responseTime});
        messages[messages.length - 1] = { text: answer, isBot: true, isLoading: false, timestamp: responseTime };
        
        if (!answer.includes('?') && 
            answer.toLowerCase().includes('boxbollen') && 
            answer.toLowerCase().match(/\bboxbollen\b/) && 
            !shownProductCard) {
          showProductCard();
          shownProductCard = true;
        }
        
        await sendConversationToAzure(messages.filter(msg => !msg.isLoading));
              
        if (!answer.includes('?') && Math.random() < 0.5) {
          setTimeout(() => {
            const followUpTime = getStockholmTimestamp();
            addMessage("Can I help you with anything else?", true, false, followUpTime);
            conversationHistory.push({"role": "assistant", "content": "Can I help you with anything else?", "timestamp": followUpTime});
            showFollowUp = true;
            updateChatWindow();
            sendConversationToAzure(messages);
          }, 1000);
        } else {
          showFollowUp = false;
        }
      }
    } catch (error) {
      console.error('Error fetching bot response:', error);
      const errorTime = getStockholmTimestamp();
      const errorMessage = "Unfortunately I couldn't connect right now, please try again later or contact us at https://boxbollen.com/pages/contact-us";
      messages[messages.length - 1] = { 
        text: errorMessage, 
        isBot: true, 
        isLoading: false,
        timestamp: errorTime
      };
      conversationHistory.push({"role": "assistant", "content": errorMessage, "timestamp": errorTime});
      await sendConversationToAzure(messages.filter(msg => !msg.isLoading));
    } finally {
      isLoading = false;
      isWaitingForResponse = false;
      updateChatWindow();
    }
  }
  
  async function handleOrderTracking() {
    console.log("handleOrderTracking function called");
    isWaitingForOrderInfo = true;
    orderNumber = '';
    orderEmail = '';
    cardLastFourDigits = '';
    isWaitingForCardDigits = false;
    
    await showLoadingThenMessage(`Sure, I can help you track your order. Please provide your order number.`);
    showNoOrderIdButton = true;
    updateChatWindow();
  }

  function addMessage(text, isBot, isLoading = false, timestamp = getStockholmTimestamp()) {
    messages.push({ text, isBot, isLoading, timestamp });
    updateChatWindow();
    saveConversation();
  }

  function updateChatWindow() {
    const messagesWrapper = document.querySelector('.chat-messages-wrapper');
    if (messagesWrapper) {
      const logoContainer = messagesWrapper.querySelector('.chat-logo-container');
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

      if (showRatingSystem) {
        const ratingElement = createStarRating();
        messagesWrapper.appendChild(ratingElement);
      }

      if (showTryAgainButtons) {
        const tryAgainElement = createTryAgainButtons();
        messagesWrapper.appendChild(tryAgainElement);
      }

      if (showNoOrderIdButton) {
        addNoOrderIdButton();
      }
      
      scrollToBottom();
    }
    
    const inputArea = document.querySelector('.chat-input-area');
    if (inputArea) {
      inputArea.innerHTML = '';
      if (!showRatingSystem && !isConversationEnded) {
        const newInputArea = createInputArea();
        inputArea.appendChild(newInputArea);
      }
    }
    
    saveConversation();
  }

  function scrollToBottom() {
    const messagesContainer = document.querySelector('.chat-messages-container');
    if (messagesContainer) {
      setTimeout(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }, 100);
    }
  }

  async function initializeChat() {
    if (!isInitialized) {
      const initialMessage = "Hey! \n My name is Elliot and I'm your virtual assistant here at Boxbollen";
      await showLoadingThenMessage(initialMessage);
      const followUpMessage = 'How can I help you today?😊';
      await showLoadingThenMessage(followUpMessage);
      showInitialOptions = true;
      isInitialized = true;
      updateChatWindow();
    }
  }

  async function showLoadingThenMessage(message) {
    addMessage('', true, true, getStockholmTimestamp());
    updateChatWindow();
    await new Promise(resolve => setTimeout(resolve, 1000));
    messages[messages.length - 1] = { text: message, isBot: true, isLoading: false, timestamp: getStockholmTimestamp() };
    conversationHistory.push({"role": "assistant", "content": message, "timestamp": getStockholmTimestamp()});
    updateChatWindow();
  }

  function saveConversation() {
    localStorage.setItem('boxbollenChatMessages', JSON.stringify(messages));
    localStorage.setItem('boxbollenChatHistory', JSON.stringify(conversationHistory));
    localStorage.setItem('boxbollenChatId', window.conversationId || '');
    localStorage.setItem('boxbollenChatShowInitialOptions', JSON.stringify(showInitialOptions));
    localStorage.setItem('boxbollenChatShowFollowUp', JSON.stringify(showFollowUp));
    localStorage.setItem('boxbollenChatIsOpen', JSON.stringify(isChatOpen));
    localStorage.setItem('boxbollenChatLastMessage', JSON.stringify(messages[messages.length - 1]));
    localStorage.setItem('boxbollenChatShowRatingSystem', JSON.stringify(showRatingSystem));
    localStorage.setItem('boxbollenChatIsConversationEnded', JSON.stringify(isConversationEnded));
    localStorage.setItem('boxbollenChatShowTryAgainButtons', JSON.stringify(showTryAgainButtons));
    localStorage.setItem('boxbollenChatIsWaitingForOrderInfo', JSON.stringify(isWaitingForOrderInfo));
    localStorage.setItem('boxbollenChatOrderNumber', orderNumber);
    localStorage.setItem('boxbollenChatOrderEmail', orderEmail);
    localStorage.setItem('boxbollenChatShowNoOrderIdButton', JSON.stringify(showNoOrderIdButton));
    localStorage.setItem('boxbollenChatIsWaitingForCardDigits', JSON.stringify(isWaitingForCardDigits));
    localStorage.setItem('boxbollenChatCardLastFourDigits', cardLastFourDigits);
    
    if (isLoading) {
      localStorage.setItem('boxbollenChatIsLoading', JSON.stringify(isLoading));
    } else {
      localStorage.removeItem('boxbollenChatIsLoading');
    }

    localStorage.setItem('boxbollenChatLastSaved', new Date().toISOString());
  }
    
  function loadConversation() {
    const storedMessages = localStorage.getItem('boxbollenChatMessages');
    const storedHistory = localStorage.getItem('boxbollenChatHistory');
    const storedId = localStorage.getItem('boxbollenChatId');
    const storedShowInitialOptions = localStorage.getItem('boxbollenChatShowInitialOptions');
    const storedShowFollowUp = localStorage.getItem('boxbollenChatShowFollowUp');
    const storedLastMessage = localStorage.getItem('boxbollenChatLastMessage');
    const storedIsLoading = localStorage.getItem('boxbollenChatIsLoading');
    const storedShowRatingSystem = localStorage.getItem('boxbollenChatShowRatingSystem');
    const storedIsConversationEnded = localStorage.getItem('boxbollenChatIsConversationEnded');
    const storedShowTryAgainButtons = localStorage.getItem('boxbollenChatShowTryAgainButtons');
    const storedIsWaitingForOrderInfo = localStorage.getItem('boxbollenChatIsWaitingForOrderInfo');
    const storedOrderNumber = localStorage.getItem('boxbollenChatOrderNumber');
    const storedOrderEmail = localStorage.getItem('boxbollenChatOrderEmail');
    const storedShowNoOrderIdButton = localStorage.getItem('boxbollenChatShowNoOrderIdButton');
    const storedIsWaitingForCardDigits = localStorage.getItem('boxbollenChatIsWaitingForCardDigits');
    const storedCardLastFourDigits = localStorage.getItem('boxbollenChatCardLastFourDigits');

    function safeJSONParse(item, defaultValue) {
      if (item === null || item === undefined) return defaultValue;
      try {
        return JSON.parse(item);
      } catch (e) {
        console.warn(`Error parsing JSON for item: ${item}`, e);
        return defaultValue;
      }
    }

    messages = safeJSONParse(storedMessages, []);
    conversationHistory = safeJSONParse(storedHistory, []);
    window.conversationId = storedId || generateUUID();
    showInitialOptions = safeJSONParse(storedShowInitialOptions, false);
    showFollowUp = safeJSONParse(storedShowFollowUp, false);
    showRatingSystem = safeJSONParse(storedShowRatingSystem, false);
    isConversationEnded = safeJSONParse(storedIsConversationEnded, false);
    showTryAgainButtons = safeJSONParse(storedShowTryAgainButtons, false);
    isWaitingForOrderInfo = safeJSONParse(storedIsWaitingForOrderInfo, false);
    orderNumber = storedOrderNumber || '';
    orderEmail = storedOrderEmail || '';
    showNoOrderIdButton = safeJSONParse(storedShowNoOrderIdButton, false);
    isWaitingForCardDigits = safeJSONParse(storedIsWaitingForCardDigits, false);
    cardLastFourDigits = storedCardLastFourDigits || '';

    isChatOpen = false;
    isLoading = safeJSONParse(storedIsLoading, false);

    if (storedLastMessage) {
      const lastMessage = safeJSONParse(storedLastMessage, null);
      if (lastMessage && lastMessage.isBot && lastMessage.text === "Can I help you with anything else?") {
        showFollowUp = true;
      }
    }

    isInitialized = messages.length > 0;

    if (isLoading) {
      const errorMessage = 'An error occurred while generating the response, please try again later.';
      addMessage(errorMessage, true, false, getStockholmTimestamp());
    }

    updateChatWindow();
  }

  function restartConversation() {
    messages = [];
    conversationHistory = [];
    isInitialized = false;
    showInitialOptions = false;
    showFollowUp = false;
    isWaitingForOrderInfo = false;
    orderNumber = '';
    orderEmail = '';
    window.conversationId = generateUUID();
    showRatingSystem = false;
    isConversationEnded = false;
    showTryAgainButtons = false;
    isEndConversationOverlayShown = false;
    showNoOrderIdButton = false;
    isWaitingForCardDigits = false;
    cardLastFourDigits = '';

    // Clear local storage
    localStorage.removeItem('boxbollenChatMessages');
    localStorage.removeItem('boxbollenChatHistory');
    localStorage.removeItem('boxbollenChatId');
    localStorage.removeItem('boxbollenChatShowInitialOptions');
    localStorage.removeItem('boxbollenChatShowFollowUp');
    localStorage.removeItem('boxbollenChatLastMessage');
    localStorage.removeItem('boxbollenChatShowRatingSystem');
    localStorage.removeItem('boxbollenChatIsConversationEnded');
    localStorage.removeItem('boxbollenChatShowTryAgainButtons');
    localStorage.removeItem('boxbollenChatIsWaitingForOrderInfo');
    localStorage.removeItem('boxbollenChatOrderNumber');
    localStorage.removeItem('boxbollenChatOrderEmail');
    localStorage.removeItem('boxbollenChatShowNoOrderIdButton');
    localStorage.removeItem('boxbollenChatIsWaitingForCardDigits');
    localStorage.removeItem('boxbollenChatCardLastFourDigits');

    // Remove the end conversation overlay
    const overlay = document.querySelector('.chat-end-conversation-overlay');
    if (overlay) {
      overlay.remove();
    }

    // Update the chat window
    updateChatWindow();

    // Initialize the chat
    initializeChat();
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function safelyFormatTimestamp(timestamp) {
    if (!timestamp) return getStockholmTimestamp();
    
    try {
      if (typeof timestamp === 'string' && timestamp.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
        return timestamp;
      }
      
      if (typeof timestamp === 'number') {
        return new Date(timestamp).toISOString();
      }
      
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      
      return getStockholmTimestamp();
    } catch (error) {
      console.warn('Error formatting timestamp:', error);
      return getStockholmTimestamp();
    }
  }
    
  async function sendConversationToAzure(messages) {
    const url = convo_operations_url;
    const payload = {
      operation: 'store',
      conversationId: window.conversationId || (window.conversationId = generateUUID()),
      messages: messages.map(msg => ({
        text: msg.text,
        isBot: msg.isBot,
        timestamp: safelyFormatTimestamp(msg.timestamp)
      })),
      timestamp: getStockholmTimestamp(),
      needsCustomerService: false,
      HandledChat: false,
      Tags: [],
      Rating: null,
      conversation_over: isConversationEnded,
      userId: null,
      name: '',
      HandledTime: null
    };

    console.log('Sending payload to Azure:', JSON.stringify(payload, null, 2));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not OK. Status:', response.status, 'Error:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('Conversation stored successfully:', result);
      return result;
    } catch (error) {
      console.error('Error storing conversation:', error);
      throw error;
    }
  }

  async function handleOrderInfo(text) {
    if (!orderNumber && !isWaitingForCardDigits) {
      if (text.toLowerCase() === 'i don\'t have my order id') {
        isWaitingForCardDigits = true;
        await showLoadingThenMessage("No problem. Please enter the last four digits of your credit card.");
      } else {
        const extractedNumber = extractOrderNumber(text);
        if (extractedNumber) {
          orderNumber = extractedNumber;
          await showLoadingThenMessage("Great, I've got your order number. Now, please provide your email address associated with this order.");
        } else {
          await showLoadingThenMessage("I couldn't find a valid order number in your message. Please provide your order number or say 'I don't have my order id'.");
        }
      }
    } else if (isWaitingForCardDigits) {
      if (validateCardLastFourDigits(text)) {
        cardLastFourDigits = text;
        isWaitingForCardDigits = false;
        await showLoadingThenMessage("Thank you. Now, please provide your email address associated with this order.");
      } else {
        await showLoadingThenMessage("No problem. Please enter the last four digits of your credit card.");
      }
    } else if (!orderEmail) {
      if (validateEmail(text)) {
        orderEmail = text;
        await showLoadingThenMessage("Thank you. I'm now searching for your order...");
        try {
          const apiEndpoint = orderNumber ? 
            `${ORDER_API}&email=${orderEmail}&order_id=${orderNumber}` :
            `${ORDER_API}&email=${orderEmail}&lastFourDigits=${cardLastFourDigits}`;
          
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          if (!response.ok) {
            throw new Error('API request failed');
          }
          
          const data = await response.json();
          const innerData = JSON.parse(data.response);
          const trackingUrl = innerData.order.trackingUrl;
          
          await showLoadingThenMessage(`Here is your tracking link: ${trackingUrl}`);
        } catch (error) {
          console.error('Error fetching order info:', error);
          await showLoadingThenMessage("I'm sorry, but I couldn't find an order matching the information you provided.");
          askToTryAgain();
        } finally {
          resetOrderTracking();
        }
      } else {
        await showLoadingThenMessage("The email address you provided doesn't seem to be valid. Please enter a valid email address.");
      }
    }
    sendConversationToAzure(messages);
  }
  
  function resetOrderTracking() {
    orderNumber = '';
    orderEmail = '';
    cardLastFourDigits = '';
    isWaitingForOrderInfo = false;
    isWaitingForCardDigits = false;
    showTryAgainButtons = false;
    showNoOrderIdButton = false;
    saveConversation();
  }
  
  function createTryAgainButtons() {
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'chat-initial-options';
    
    const options = [
      { text: 'Yes', response: true },
      { text: 'No', response: false }
    ];
    
    options.forEach(option => {
      const button = document.createElement('button');
      button.textContent = option.text;
      button.className = 'chat-option-button';
      button.addEventListener('click', () => handleTryAgainResponse(option.response, option.text));
      buttonsContainer.appendChild(button);
    });
    
    return buttonsContainer;
  }
  
  function handleTryAgainResponse(tryAgain, responseText) {
    showTryAgainButtons = false;
    
    addMessage(responseText, false, false, getStockholmTimestamp());
    conversationHistory.push({"role": "user", "content": responseText, "timestamp": getStockholmTimestamp()});
    if (tryAgain) {
      resetOrderTracking();
      handleOrderTracking();
    } else {
      isWaitingForOrderInfo = false;
      showLoadingThenMessage("Is there anything else I can help you with?");
    }
    updateChatWindow();
    sendConversationToAzure(messages);
  }
  
  async function askToTryAgain() {
    const tryAgainMessage = "Would you like to try tracking your order again?";
    await showLoadingThenMessage(tryAgainMessage);
    showTryAgainButtons = true;
    updateChatWindow();
    sendConversationToAzure(messages);
  }

  function extractOrderNumber(text) {
    const match = text.match(/\d+/);
    return match ? match[0] : null;
  }
  
  function validateEmail(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  function validateCardLastFourDigits(digits) {
    return /^\d{4}$/.test(digits);
  }

  function addNoOrderIdButton() {
    console.log("addNoOrderIdButton function called");
    const existingButton = document.querySelector('.chat-option-button[data-no-order-id]');
    if (existingButton) {
      console.log("No order ID button already exists");
      return;
    }

    const button = document.createElement('button');
    button.textContent = "I don't have my order id";
    button.className = 'chat-option-button';
    button.setAttribute('data-no-order-id', 'true');
    button.addEventListener('click', handleNoOrderId);
    
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'chat-initial-options';
    optionsContainer.appendChild(button);
    
    const messagesWrapper = document.querySelector('.chat-messages-wrapper');
    if (messagesWrapper) {
      messagesWrapper.appendChild(optionsContainer);
      scrollToBottom();
      console.log("Button added to messages wrapper");
      showNoOrderIdButton = true;
      saveConversation();
    } else {
      console.log("Messages wrapper not found");
    }
  }

  function handleNoOrderId() {
    console.log("No order ID button clicked");
    isWaitingForCardDigits = true;
    showNoOrderIdButton = false;
    sendMessage("I don't have my order id");
  }

  function showProductCard() {
    const productCard = createProductCard();
    const messagesWrapper = document.querySelector('.chat-messages-wrapper');
    if (messagesWrapper) {
      messagesWrapper.appendChild(productCard);
      scrollToBottom();
    }
  }

  function createProductCard() {
    const card = document.createElement('div');
    card.className = 'chat-product-card';
    card.innerHTML = `
      <img src="https://example.com/path/to/boxbollen-image.jpg" alt="Boxbollen" class="product-image">
      <h3>Boxbollen</h3>
      <p>Experience the revolutionary fitness game!</p>
      <a href="https://boxbollen.com/products/boxbollen" target="_blank" class="product-link">Learn More</a>
    `;
    return card;
  }

  createChatbotUI();

  window.openBoxbollenChat = function() {
    isChatOpen = true;
    saveConversation();
    renderChatbot();
    initializeChat();
  };

  console.log('Boxbollen Chatbot script loaded and initialized');
})();

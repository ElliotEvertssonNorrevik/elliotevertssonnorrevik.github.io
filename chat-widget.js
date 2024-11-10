(function() {
    const CONVO_API_BASE = 'https://bb-h9dtdebje5fsg5en.z01.azurefd.net/api/conversationoperations';   
    const convo1 = '_sSpPVu8npJbLaeS1FJFbatmtVVShl0';
    const convo2 = '_aDkcQEpUskHKAzFuyqYYOQ==';
    const CONVO_API_KEY = `${convo1}${convo2}`; 
    const ORDER_API_BASE = 'https://bb-h9dtdebje5fsg5en.z01.azurefd.net/api/recentordersemail';
    const order1 = 'rcQ3VTXyDEiUNPaQJgKX'
    const order2 = '_z6IGsvYm-a8n9t2TLVIF4qcAzFupYwYeA==';
    const ORDER_API_KEY = `${order1}${order2}`;  
    const API_BASE_URL = 'https://bb-h9dtdebje5fsg5en.z01.azurefd.net/api/AIResponse';
    const apibase1 = '9rhFu3kfzEln8s_x9cHRbMvUYB'
    const apibase2 = 'KriBP3LABZKcoGEbMAAzFuAVD41w=='
    const API_KEY = `${apibase1}${apibase2}`;
    const CONFIG_API_BASE = 'https://bb-h9dtdebje5fsg5en.z01.azurefd.net/api/configuration';
    const configpart1 = 'EzFi0G7VjmsfU3JuSzORxqX'
    const configpart2 = 'k21zmNLwORyD3EmX7fW9vAzFudY2gAA=='
    const CONFIG_API_CODE = `${configpart1}${configpart2}`;
  
  
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
    let isWaitingForEmail = false;
  
    const config = {
      headerText: 'Boxbollen AI',
      subHeaderText: '',
      mainColor: '#F80B00',
      logoUrl: 'https://i.ibb.co/61kG13C/boxbollen.jpg',
      launchAvatarUrl: 'https://i.ibb.co/zQkKbfv/Chatbubble-removebg-preview-removebg-preview.png'
    };
  
    function log(message, type = 'info') {
      const timestamp = new Date().toISOString();
      if (typeof type === 'object') {
          console.log(`[${timestamp}] [ERROR]`, message, type);
      } else {
          console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
      }
    }
  
    function createChatbotUI() {
      log('Creating chatbot UI');
      const chatbotContainer = document.createElement('div');
      chatbotContainer.id = 'chat-chatbot';
      chatbotContainer.style.position = 'fixed';
      chatbotContainer.style.bottom = '20px';
      chatbotContainer.style.left = '20px';
      chatbotContainer.style.fontFamily = 'Nunito, sans-serif';
      chatbotContainer.style.transition = 'bottom 0.3s ease';
  
      // Create and start the observer with more specific config
      const observer = new MutationObserver(() => {
          requestAnimationFrame(() => {
              adjustChatButtonPosition(chatbotContainer);
          });
      });
  
      observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: false
      });
  
      // Check position on various events
      window.addEventListener('load', () => adjustChatButtonPosition(chatbotContainer));
      window.addEventListener('DOMContentLoaded', () => adjustChatButtonPosition(chatbotContainer));
  
      document.body.appendChild(chatbotContainer);
      loadConversation();
      renderChatbot();
    }
  
    function isVisible(element) {
      return element && (
          element.offsetWidth > 0 || 
          element.offsetHeight > 0 || 
          element.getClientRects().length > 0
      );
    }
  
    function adjustChatButtonPosition(chatbotContainer) {
      const popups = document.querySelectorAll(
          '.cart-notification, ' +
          '.shopify-payment-button__button, ' +
          '[class*="cart-drawer"], ' +
          '[class*="cart-popup"], ' +
          '.add-to-cart-drawer'
      );
  
      let shouldAdjust = false;
      let maxOverlap = 0;
  
      popups.forEach(popup => {
          if (isVisible(popup)) {
              const popupRect = popup.getBoundingClientRect();
              const chatRect = chatbotContainer.getBoundingClientRect();
  
              // Check if the popup overlaps with the chat bubble
              const overlap = chatRect.bottom - popupRect.top;
  
              if (overlap > 0) {
                  shouldAdjust = true;
                  if (overlap > maxOverlap) {
                      maxOverlap = overlap;
                  }
              }
          }
      });
  
      // Smoothly adjust the position
      chatbotContainer.style.bottom = shouldAdjust ? `${20 + maxOverlap}px` : '20px';
    }
  
    function renderChatbot() {
      log('Rendering chatbot');
      const chatbotContainer = document.getElementById('chat-chatbot');
      chatbotContainer.innerHTML = '';
  
      if (isChatOpen) {
        const chatWindow = createChatWindow();
        chatbotContainer.appendChild(chatWindow);
        // Add the visible class to trigger the animation
        chatWindow.classList.add('visible');
        updateChatWindow();
      } else {
        const launchButton = createLaunchButton();
        chatbotContainer.appendChild(launchButton);
      }
    }
  
    function createLaunchButton() {
      log('Creating launch button');
      const button = document.createElement('button');
      button.className = 'chat-launch-button';
      button.style.backgroundColor = 'transparent';
      button.style.width = '70px';
      button.style.height = '70px';
      button.style.padding = '0';
      button.style.border = 'none';
      button.style.cursor = 'pointer';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.margin = '0';
      button.style.lineHeight = '0';
      button.style.fontSize = '0';
      button.style.outline = 'none';
      
      const svg = `<svg width="100%" height="100%" viewBox="0 0 54 53" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="27" cy="26.5" rx="27" ry="26.5" fill="#06AFFF"/>
          <ellipse cx="27.1373" cy="24.853" rx="10.9477" ry="9.85296" fill="white"/>
          <path d="M14.7197 33.6722L18 30L19.6909 27.5482L22.5176 32.4848L14.7197 33.6722Z" fill="white"/>
      </svg>`;
      
      button.innerHTML = svg;
      button.addEventListener('click', () => {
          log('Launch button clicked');
          isChatOpen = true;
          saveConversation();
          renderChatbot();
          initializeChat();
      });
  
      return button;
    }
  
    function createChatWindow() {
      log('Creating chat window');
      const chatWindow = document.createElement('div');
      chatWindow.className = 'chat-window';
    
      // Add event listener to prevent scroll propagation
      chatWindow.addEventListener('wheel', (e) => {
          e.stopPropagation();
      }, { passive: true });
    
      const header = createChatHeader();
      const messagesContainer = createMessagesContainer();
      const inputArea = createInputArea();
    
      chatWindow.appendChild(header);
      chatWindow.appendChild(messagesContainer);
      chatWindow.appendChild(inputArea);
    
      return chatWindow;
    }
  
    function createChatHeader() {
      log('Creating chat header');
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
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
    
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
        log('Reload button clicked');
        restartConversation();
      });
    
      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.className = 'chat-button chat-close-button';
      closeButton.addEventListener('click', () => {
        log('Close button clicked');
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
      log('Creating messages container');
      const container = document.createElement('div');
      container.className = 'chat-messages-container';
      
      // Add event listeners to prevent scroll propagation
      container.addEventListener('wheel', (e) => {
          e.stopPropagation();
      }, { passive: true });
      
      container.addEventListener('touchmove', (e) => {
          e.stopPropagation();
      }, { passive: true });
    
      const messagesWrapper = document.createElement('div');
      messagesWrapper.className = 'chat-messages-wrapper';
    
      const logoContainer = createChatLogo();
      messagesWrapper.appendChild(logoContainer);
    
      container.appendChild(messagesWrapper);
    
      return container;
    }
  
    function createChatLogo() {
      log('Creating chat logo');
      const logoContainer = document.createElement('div');
      logoContainer.className = 'chat-logo-container';
    
      const logo = document.createElement('img');
      logo.src = config.logoUrl;
      logo.alt = 'Boxbollen Logo';
      logo.className = 'chat-logo';
    
      const logoText = document.createElement('div');
      logoText.className = 'chat-logo-text';
      logoText.innerHTML = `<h2 style="font-size: 24px; font-weight: bold;">${config.headerText}</h2><p>${config.subHeaderText}</p>`;
    
      logoContainer.appendChild(logo);
      logoContainer.appendChild(logoText);
    
      return logoContainer;
    }
  
    function createInputArea() {
      log('Creating input area');
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
        
        const sendSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>`;
    
        const sendButton = document.createElement('button');
        sendButton.innerHTML = sendSvg;
        sendButton.className = 'chat-send-button';
        sendButton.style.backgroundColor = 'transparent';
        sendButton.style.border = 'none';
        sendButton.style.cursor = 'pointer';
        sendButton.disabled = isWaitingForResponse;
    
        const handleSendMessage = () => {
          if (isWaitingForResponse) return;
          const message = input.value.trim();
          if (message !== '') {
            log(`User sending message: ${message}`);
            
            // Create a floating message element
            const floatingMessage = document.createElement('div');
            floatingMessage.className = 'chat-floating-message';
            floatingMessage.textContent = message;
            
            // Get positions
            const inputRect = input.getBoundingClientRect();
            const messagesWrapper = document.querySelector('.chat-messages-wrapper');
            const wrapperRect = messagesWrapper.getBoundingClientRect();
            
            // Position the floating message at the input's position
            floatingMessage.style.left = `${inputRect.left}px`;
            floatingMessage.style.top = `${inputRect.top}px`;
            
            // Add the floating message to the body
            document.body.appendChild(floatingMessage);
            
            // Clear input and update state
            input.value = '';
            pendingUserInput = '';
            
            // Trigger the animation
            requestAnimationFrame(() => {
              floatingMessage.style.left = `${wrapperRect.right - 20}px`;
              floatingMessage.style.top = `${wrapperRect.bottom - 100}px`;
              floatingMessage.style.transform = 'scale(0)';
              floatingMessage.style.opacity = '0';
            });
            
            // Remove the floating message after animation
            setTimeout(() => {
              floatingMessage.remove();
              sendMessage(message);
              sendButton.disabled = true;
            }, 300);
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
    log('Toggling emoji picker');
    event.stopPropagation();
  
    const existingPicker = document.querySelector('.chat-emoji-picker');
    
    if (existingPicker) {
      existingPicker.remove();
      return;
    }
  
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
        pendingUserInput = input.value; // Update pending input
        emojiPicker.remove();
      });
      emojiPicker.appendChild(emojiButton);
    });
  
    const inputContainer = event.target.closest('.chat-input-container');
    inputContainer.appendChild(emojiPicker);
  
    // Position the picker and make it visible
    requestAnimationFrame(() => {
      emojiPicker.classList.add('show');
    });
  
    // Close picker when clicking outside
    function closeEmojiPicker(e) {
      if (!emojiPicker.contains(e.target) && !event.target.contains(e.target)) {
        emojiPicker.classList.remove('show');
        setTimeout(() => emojiPicker.remove(), 300);
        document.removeEventListener('click', closeEmojiPicker);
      }
    }
  
    setTimeout(() => {
      document.addEventListener('click', closeEmojiPicker);
    }, 0);
  }
  
  
    function debugMessageProcessing(message) {
      log(`Processing message: ${message}`);
      let formattedMessage = formatMessage(message);
      
      let tempDiv = document.createElement('div');
      tempDiv.innerHTML = formattedMessage;
      
      return formattedMessage;
    }
    
    function formatMessage(message) {
      log('Formatting message');
      const markdownLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s]+)\)/g;
      message = message.replace(markdownLinkRegex, (match, text, url) => {
          return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      });
    
      const urlRegex = /(https?:\/\/\S+)/g;
      message = message.split(urlRegex).map((part, index) => {
          if (index % 2 === 1) {
              if (!part.startsWith('<a href=')) {
                  return `<a href="${part}" target="_blank" rel="noopener noreferrer">${part}</a>`;
              }
          }
          return part;
      }).join('');
    
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
      message = message.replace(emailRegex, (email) => {
          return `<a href="mailto:${email}">${email}</a>`;
      });
    
      return message;
    }
  
    function createMessageElement(message) {
      log('Creating message element');
      const messageWrapper = document.createElement('div');
      messageWrapper.className = `chat-message-wrapper ${message.isBot ? 'bot' : 'user'}`;
      
      if (message.timestamp && new Date(message.timestamp).getTime() > Date.now() - 1000) {
          messageWrapper.classList.add('new-message');
          
          setTimeout(() => {
              messageWrapper.classList.remove('new-message');
          }, 300);
      }
      
      if (message.isBot && message.type === 'productCard') {
          const card = createProductCard();
          messageWrapper.appendChild(card);
          return messageWrapper;
      }
  
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
          textElement.innerHTML = message.text;
      }
  
      messageElement.appendChild(textElement);
      messageWrapper.appendChild(messageElement);
  
      return messageWrapper;
    }
  
    function extractEmail(text) {
      log('Extracting email from text');
      const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
      const match = text.match(emailRegex);
      if (match) {
          return match[0];
      }
      return null;
    }
  
    function createInitialOptions() {
      log('Creating initial options');
      const optionsElement = document.createElement('div');
      optionsElement.className = 'chat-initial-options';
  
      const options = ['Track my order'];
      options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option;
        button.className = 'chat-option-button';
        button.addEventListener('click', () => {
          log(`Initial option selected: ${option}`);
          sendMessage(option);
          showInitialOptions = false;
          updateChatWindow();
        });
        optionsElement.appendChild(button);
      });
  
      return optionsElement;
    }
  
    function createFollowUpButtons() {
      log('Creating follow-up buttons');
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
      log(`Handling follow-up response: ${response}`);
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
      log('Ending conversation');
      isConversationEnded = true;
      updateChatWindow();
    }
    
    function handleStarClick(rating) {
      log(`Star rating clicked: ${rating}`);
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
      log(`Sending rating: ${rating}`);
      const url = CONVO_API_BASE;
      const payload = {
        operation: 'store',
        conversationId: window.conversationId,
        Rating: rating,
        timestamp: getStockholmTimestamp(),
        conversation_over: true
      };
    
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-functions-key': CONVO_API_KEY
          },
          body: JSON.stringify(payload)
        });
      
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const responseData = await response.json();
        log('Rating sent successfully');
        
        await sendConversationToAzure(messages);
        
      } catch (error) {
        log(`Error sending rating: ${error.message}`, 'error');
      }
    }
    
    
    function createEndConversationOverlay() {
      log('Creating end conversation overlay');
      if (isEndConversationOverlayShown) return;
    
      isEndConversationOverlayShown = true;
      const chatWindow = document.querySelector('.chat-window');
      const overlay = document.createElement('div');
      overlay.className = 'chat-end-conversation-overlay';
      
      const content = document.createElement('div');
      content.className = 'chat-end-conversation-content';
      
      const message = document.createElement('p');
      message.textContent = "Okay, thanks for chatting! If you have any questions in the future, don't hesitate to contact us. We at Boxbollen wish you a fantastic day! 👋";
      
      const endedMessage = document.createElement('p');
      endedMessage.className = 'chat-chat-ended';
      endedMessage.textContent = 'Chat ended';
      
      const newChatButton = document.createElement('button');
      newChatButton.textContent = 'New conversation';
      newChatButton.className = 'chat-new-conversation-button';
      newChatButton.addEventListener('click', () => {
        log('New conversation button clicked');
        restartConversation();
        overlay.remove();
      });
      
      content.appendChild(message);
      content.appendChild(endedMessage);
      content.appendChild(newChatButton);
      overlay.appendChild(content);
      
      chatWindow.appendChild(overlay);
    
      // Changed timeout from 50ms to 100ms for a smoother start
      setTimeout(() => {
        overlay.classList.add('show');
      }, 100);
    }
  
    function createStarRating() {
      log('Creating star rating');
      const ratingContainer = document.createElement('div');
      ratingContainer.className = 'chat-rating-container';
      ratingContainer.style.textAlign = 'center';
      ratingContainer.style.padding = '15px';
      ratingContainer.style.display = 'flex';
      ratingContainer.style.flexDirection = 'column';
      ratingContainer.style.alignItems = 'center';
      ratingContainer.style.justifyContent = 'center';
      ratingContainer.style.gap = '0';
      ratingContainer.style.height = '90px';
      ratingContainer.style.width = '350px';
  
      const ratingPrompt = document.createElement('p');
      ratingPrompt.textContent = 'Rate your experience:';
      ratingPrompt.style.margin = '0';
      ratingPrompt.style.padding = '0';
      ratingPrompt.style.display = 'flex';
      ratingPrompt.style.alignItems = 'center';
      ratingPrompt.style.height = '35px';
      ratingPrompt.style.color = '#ffffff';
      ratingPrompt.style.fontWeight = 'bold';
      ratingPrompt.style.fontSize = '22px';
  
      const starsContainer = document.createElement('div');
      starsContainer.className = 'chat-stars-container';
      starsContainer.style.margin = '0';
      starsContainer.style.padding = '0';
      starsContainer.style.lineHeight = '1';
  
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = 'chat-star';
        star.innerHTML = '☆';
        star.setAttribute('data-rating', i);
        star.style.fontSize = '50px';
        star.style.cursor = 'pointer';
        star.style.color = '#ffd700';
        
        star.addEventListener('click', () => handleStarClick(i));
        
        star.addEventListener('mouseover', (e) => {
          // Fill in this star and all previous stars
          const stars = document.querySelectorAll('.chat-star');
          stars.forEach((s, index) => {
            if (index < i) {
              s.innerHTML = '★';
              s.style.color = '#ffd700';  // Keep gold color on hover
            } else {
              s.innerHTML = '☆';
              s.style.color = '#ffd700';  // Keep gold color on hover
            }
          });
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
      log(`Updating stars: ${rating}`);
      const stars = document.querySelectorAll('.chat-star');
      stars.forEach((star, index) => {
        if (index < rating) {
          star.innerHTML = '★';
          star.style.color = '#ffd700';  // Keep gold color
        } else {
          star.innerHTML = '☆';
          star.style.color = '#ffd700';  // Keep gold color
        }
        star.classList.toggle('active', index < rating);
      });
    }
  
    function getConfigApiUrl(operation) {
      const url = new URL(CONFIG_API_BASE);
      url.searchParams.append('code', CONFIG_API_CODE);
      url.searchParams.append('operation', operation);
      return url.toString();
    }
    
    async function getMainAnswerPrompt() {
      log('Getting main answer prompt');
      try {
        const response = await fetch(getConfigApiUrl('get'));
        const data = await response.json();
        
        const prompt = data.prompt;
        const timestamp = data.timestamp;
    
        return { prompt, timestamp };
      } catch (error) {
        log(`Error getting main answer prompt: ${error.message}`, 'error');
      }
    }
  
    function getStockholmTimestamp() {
      return new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' });
    }
  
    async function sendMessage(text) {
      log(`Sending message: ${text}`);
      if (showTryAgainButtons) {
          showTryAgainButtons = false;
          updateChatWindow();
          saveConversation();
      }
  
      if (text.trim() === '' || showRatingSystem || isConversationEnded || isWaitingForResponse) return;
  
      const currentTime = getStockholmTimestamp();
  
      addMessage(text, false, false, currentTime);
      showInitialOptions = false;
      showFollowUp = false;
  
      conversationHistory.push({"role": "user", "content": text, "timestamp": currentTime});
  
      if (text.toLowerCase() === 'track my order') {
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
  
        const response = await callAIResponseAPI(prompt, text, formattedHistory);
  
        const data = await response.json();
        let answer = data.answer;
        let product_card = data.product_card;
  
  
          const responseTime = getStockholmTimestamp();
  
          if (answer.includes('####WANTS_ORDER_INFO####')) {
              messages.pop();
              
              isWaitingForOrderInfo = true;
              orderNumber = '';
              orderEmail = '';
              isWaitingForCardDigits = false;
              cardLastFourDigits = '';
              isWaitingForEmail = false;
              
              await showLoadingThenMessage("To track your order, please provide your order number.");
              
              showNoOrderIdButton = true;
              
              updateChatWindow();
          } else {
              conversationHistory.push({"role": "assistant", "content": answer, "timestamp": responseTime});
              
              messages[messages.length - 1] = { text: answer, isBot: true, isLoading: false, timestamp: responseTime };
  
              if (product_card.toLowerCase().includes('yes') && !shownProductCard) {
                  addProductCardAsMessage();
                  shownProductCard = true;
              }
  
              await sendConversationToAzure(messages.filter(msg => !msg.isLoading));
  
              if (!answer.includes('?') && Math.random() < 0.5 && !shownProductCard) {
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
          log(`Error sending message: ${error.message}`, 'error');
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
  
    async function callAIResponseAPI(prompt, question, conversation_history) {
      const url = API_BASE_URL;
      
      const requestBody = {
          prompt,
          question,
          conversation_history
      };
  
      return fetch(url, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
              'x-functions-key': API_KEY
          },
          body: JSON.stringify(requestBody)
      });
  }
  
    async function handleOrderTracking() {
      log('Handling order tracking');
      isWaitingForOrderInfo = true;
      orderNumber = '';
      orderEmail = '';
      cardLastFourDigits = '';
      isWaitingForCardDigits = false;
      isWaitingForEmail = false;
      
      await showLoadingThenMessage("Sure, I can help you track your order. Please provide your order number.");
      showNoOrderIdButton = true;
      updateChatWindow();
    }
  
    function addMessage(text, isBot, isLoading = false, timestamp = getStockholmTimestamp()) {
      log(`Adding message: ${text}, isBot: ${isBot}, isLoading: ${isLoading}`);
      let processedText = debugMessageProcessing(text);
      messages.push({ text: processedText, isBot, isLoading, timestamp });
      updateChatWindow();
      saveConversation();
    }
  
    function updateChatWindow() {
      log('Updating chat window');
      const inputField = document.querySelector('.chat-input');
      let inputText = '';
      let cursorPosition = 0;
    
      if (inputField) {
        inputText = inputField.value;
        cursorPosition = inputField.selectionStart;
      }
    
      const messagesWrapper = document.querySelector('.chat-messages-wrapper');
      if (messagesWrapper) {
        const logoContainer = messagesWrapper.querySelector('.chat-logo-container');
        messagesWrapper.innerHTML = '';
        if (logoContainer) {
          messagesWrapper.appendChild(logoContainer);
        }
    
        // Track if we're adding new content that needs scrolling
        let needsScroll = false;
        const previousHeight = messagesWrapper.scrollHeight;
    
        messages.forEach(message => {
          const messageElement = createMessageElement(message);
          messagesWrapper.appendChild(messageElement);
          
          // Check if this is a new message or product card that needs scrolling
          if ((message.timestamp && 
               new Date(message.timestamp).getTime() > Date.now() - 1000) ||
              message.type === 'productCard') {
              needsScroll = true;
          }
        });
    
        // Add additional elements if needed
        if (showInitialOptions) {
          const optionsElement = createInitialOptions();
          messagesWrapper.appendChild(optionsElement);
          needsScroll = true;
        }
    
        if (showFollowUp) {
          const followUpElement = createFollowUpButtons();
          messagesWrapper.appendChild(followUpElement);
          needsScroll = true;
        }
    
        if (showRatingSystem) {
          const ratingElement = createStarRating();
          messagesWrapper.appendChild(ratingElement);
          needsScroll = true;
        }
    
        if (showTryAgainButtons) {
          const tryAgainElement = createTryAgainButtons();
          messagesWrapper.appendChild(tryAgainElement);
          needsScroll = true;
        }
    
        if (showNoOrderIdButton) {
          addNoOrderIdButton();
          needsScroll = true;
        }
    
        // Scroll if new content was added
        if (needsScroll || messagesWrapper.scrollHeight > previousHeight) {
          scrollToBottom(true); // Pass true to force immediate scroll
        }
      }
    
      const inputArea = document.querySelector('.chat-input-area');
      if (inputArea) {
        inputArea.innerHTML = '';
        if (!showRatingSystem && !isConversationEnded) {
          const newInputArea = createInputArea();
          inputArea.appendChild(newInputArea);
        }
      }
    
      const newInputField = document.querySelector('.chat-input');
      if (newInputField) {
        newInputField.value = inputText;
        newInputField.setSelectionRange(cursorPosition, cursorPosition);
        newInputField.focus();
      }
    
      saveConversation();
    }
    
    async function initializeChat() {
      log('Initializing chat');
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
      log(`Showing loading then message: ${message}`);
      addMessage('', true, true, getStockholmTimestamp());
      updateChatWindow();
      await new Promise(resolve => setTimeout(resolve, 1000));
      messages[messages.length - 1] = { text: message, isBot: true, isLoading: false, timestamp: getStockholmTimestamp() };
      conversationHistory.push({"role": "assistant", "content": message, "timestamp": getStockholmTimestamp()});
      updateChatWindow();
    }
  
    function saveConversation() {
      log('Saving conversation');
      localStorage.setItem('boxbollenChatMessages', JSON.stringify(messages));
      localStorage.setItem('boxbollenChatHistory', JSON.stringify(conversationHistory));
      localStorage.setItem('boxbollenChatId', window.conversationId || '');
      localStorage.setItem('boxbollenChatShowInitialOptions', JSON.stringify(showInitialOptions));
      localStorage.setItem('boxbollenChatShowFollowUp', JSON.stringify(showFollowUp));
      localStorage.setItem('boxbollenChatShowRatingSystem', JSON.stringify(showRatingSystem));
      localStorage.setItem('boxbollenChatIsConversationEnded', JSON.stringify(isConversationEnded));
      localStorage.setItem('boxbollenChatShowTryAgainButtons', JSON.stringify(showTryAgainButtons));
      localStorage.setItem('boxbollenChatIsWaitingForOrderInfo', JSON.stringify(isWaitingForOrderInfo));
      localStorage.setItem('boxbollenChatOrderNumber', orderNumber);
      localStorage.setItem('boxbollenChatOrderEmail', orderEmail);
      localStorage.setItem('boxbollenChatShowNoOrderIdButton', JSON.stringify(showNoOrderIdButton));
      localStorage.setItem('boxbollenChatIsWaitingForCardDigits', JSON.stringify(isWaitingForCardDigits));
      localStorage.setItem('boxbollenChatCardLastFourDigits', cardLastFourDigits);
      localStorage.setItem('boxbollenChatIsWaitingForEmail', JSON.stringify(isWaitingForEmail));
      localStorage.setItem('boxbollenChatShownProductCard', JSON.stringify(shownProductCard));
  
      if (isLoading) {
        localStorage.setItem('boxbollenChatIsLoading', JSON.stringify(isLoading));
      } else {
        localStorage.removeItem('boxbollenChatIsLoading');
      }
  
      localStorage.setItem('boxbollenChatLastSaved', new Date().toISOString());
    }
  
    function loadConversation() {
      log('Loading conversation');
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
      const storedIsWaitingForEmail = localStorage.getItem('boxbollenChatIsWaitingForEmail');
      const storedShownProductCard = localStorage.getItem('boxbollenChatShownProductCard');
    
      function safeJSONParse(item, defaultValue) {
        if (item === null || item === undefined) return defaultValue;
        try {
          return JSON.parse(item);
        } catch (e) {
          log(`Error parsing JSON: ${e.message}`, 'error');
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
      isWaitingForEmail = safeJSONParse(storedIsWaitingForEmail, false);
      shownProductCard = safeJSONParse(storedShownProductCard, false);
    
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
      log('Restarting conversation');
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
      isWaitingForEmail = false;
      shownProductCard = false;
    
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
      localStorage.removeItem('boxbollenChatIsWaitingForEmail');
      localStorage.removeItem('boxbollenChatShownProductCard');
    
      const overlay = document.querySelector('.chat-end-conversation-overlay');
      if (overlay) {
        overlay.remove();
      }
    
      updateChatWindow();
      
      // Initialize the chat after everything is reset
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
        log(`Error formatting timestamp: ${error.message}`, 'error');
        return getStockholmTimestamp();
      }
    }
      
    async function sendConversationToAzure(messages) {
      log('Sending conversation to Azure');
      const url = CONVO_API_BASE;
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
    
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-functions-key': CONVO_API_KEY
          },
          body: JSON.stringify(payload)
        });
    
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
    
        const result = await response.json();
        log('Conversation sent to Azure successfully');
        return result;
      } catch (error) {
        log(`Error sending conversation to Azure: ${error.message}`, 'error');
        throw error;
      }
    }
  
    function extractLastFourDigits(text) {
      const match = text.match(/\b\d{4}\b/);
      return match ? match[0] : null;
    }
  
    async function handleOrderInfo(text) {
      log(`Handling order info: ${text}`);
      if (!orderNumber && !isWaitingForEmail) {
          showNoOrderIdButton = false;
          
          if (text.toLowerCase() === 'i don\'t have my order id') {
              isWaitingForEmail = true;
              await showLoadingThenMessage("No problem. Please provide the email address you used for your purchase.");
          } else {
              const extractedNumber = extractOrderNumber(text);
              if (extractedNumber) {
                  orderNumber = extractedNumber;
                  isWaitingForEmail = true;
                  await showLoadingThenMessage("Great, I've got your order number. Now, please provide your email address associated with this order.");
              } else {
                  showNoOrderIdButton = true;
                  await showLoadingThenMessage("I couldn't find a valid order number in your message. Please provide your order number.");
              }
          }
      } else if (isWaitingForEmail) {
          if (validateEmail(text)) {
              orderEmail = text;
              isWaitingForEmail = false;
              
              await showLoadingThenMessage("Thank you. Now sending email...");
              
              // Make API call with correct URL and API key
              fetch(ORDER_API_BASE, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'x-functions-key': ORDER_API_KEY
                  },
                  body: JSON.stringify({ email: orderEmail })
              }).catch(error => {
                  log('API call error (non-blocking)', { error });
              });
              
              // Add loading message for 2 seconds
              addMessage('', true, true, getStockholmTimestamp());
              updateChatWindow();
              await new Promise(resolve => setTimeout(resolve, 2000));
              messages.pop(); // Remove loading message
              
              await showLoadingThenMessage("If you did not receive an email, please double check that you provided the correct email address.");
              showTryAgainButtons = true;
              updateChatWindow();
              
          } else {
              await showLoadingThenMessage("The email address you provided doesn't seem to be valid. Please enter a valid email address.");
          }
      }
      updateChatWindow();
      sendConversationToAzure(messages);
    }
  
    function validateOrderId(orderId) {
      const orderIdRegex = /^[A-Za-z0-9]{4,10}$/;
      return orderIdRegex.test(orderId);
    }
    
    function resetOrderTracking() {
      log('Resetting order tracking');
      orderNumber = '';
      isWaitingForOrderInfo = false;
      isWaitingForEmail = false;
      showTryAgainButtons = false;
      showNoOrderIdButton = false;
      saveConversation();
    }
    
    function createTryAgainButtons() {
      log('Creating try again button');
      const buttonsContainer = document.createElement('div');
      buttonsContainer.className = 'chat-initial-options';
      
      const button = document.createElement('button');
      button.textContent = "I did not get an email";
      button.className = 'chat-option-button';
      button.addEventListener('click', () => handleTryAgainResponse(true, "I did not get an email"));
      buttonsContainer.appendChild(button);
      
      return buttonsContainer;
    }
  
    function handleTryAgainResponse(tryAgain, responseText) {
      log(`Handling try again response: ${responseText}`);
      showTryAgainButtons = false;
      addMessage(responseText, false, false, getStockholmTimestamp());
      
      conversationHistory.push({"role": "user", "content": responseText, "timestamp": getStockholmTimestamp()});
      
      resetOrderTracking();
      isWaitingForEmail = true;
      showLoadingThenMessage("Please provide the email address you used for your purchase.");
      
      updateChatWindow();
      sendConversationToAzure(messages);
    }
  
    async function askToTryAgain() {
      log('Asking to try again');
      const tryAgainMessage = "Try again?";
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
      log('Adding no order ID button');
      const existingButton = document.querySelector('.chat-option-button[data-no-order-id]');
      if (existingButton) {
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
      }
    }
  
    function handleNoOrderId() {
      log('Handling no order ID');
      isWaitingForCardDigits = true;
      showNoOrderIdButton = false;
      sendMessage("I don't have my order id");
    }
  
    function showProductCard() {
      log('Showing product card');
      const productCard = createProductCard();
      const messagesWrapper = document.querySelector('.chat-messages-wrapper');
      if (messagesWrapper) {
        messagesWrapper.appendChild(productCard);
        scrollToBottom();
      }
    }
  
    function createProductCard() {
      log('Creating product card');
      const cardWrapper = document.createElement('div');
      cardWrapper.className = 'chat-message-wrapper bot';
    
      const profileImage = document.createElement('img');
      profileImage.src = config.logoUrl;
      profileImage.alt = 'Bot Profile';
      profileImage.className = 'chat-bot-profile-image-card';
    
      const card = document.createElement('div');
      card.className = 'product-card';
    
      const imageContainer = document.createElement('div');
      imageContainer.className = 'product-image';
    
      const img = document.createElement('img');
      img.src = 'https://boxbollen.com/cdn/shop/products/boxbollen_packshot_2023_red_1100x.jpg?v=1669502961';
      img.alt = 'Boxbollen product';
      
      imageContainer.appendChild(img);
    
      const info = document.createElement('div');
      info.className = 'product-info';
    
      const title = document.createElement('h2');
      title.className = 'product-title';
      title.textContent = 'Boxbollen';
    
      const description = document.createElement('p');
      description.className = 'product-description';
      description.textContent = 'Complete Set With App License';
    
      const link = document.createElement('a');
      link.href = 'https://boxbollen.com/products/boxbollen';
      link.target = '_blank';
      link.className = 'read-more-btn';
      link.textContent = 'Read More';
    
      info.appendChild(title);
      info.appendChild(description);
      info.appendChild(link);
    
      card.appendChild(imageContainer);
      card.appendChild(info);
    
      cardWrapper.appendChild(profileImage);
      cardWrapper.appendChild(card);
    
      return cardWrapper;
    }
    
    function addProductCardAsMessage() {
      log('Adding product card as message');
      const loadingMessage = { text: '', isBot: true, isLoading: true, timestamp: getStockholmTimestamp() };
      messages.push(loadingMessage);
      updateChatWindow();
    
      setTimeout(() => {
        messages.pop();
        
        messages.push({
          type: 'productCard',
          isBot: true,
          timestamp: getStockholmTimestamp()
        });
    
        updateChatWindow();
    
        // Force immediate scroll after product card is added
        requestAnimationFrame(() => {
          scrollToBottom(true);
        });
      }, 1500);
    }
    
    function scrollToBottom(immediate = false) {
      const messagesContainer = document.querySelector('.chat-messages-container');
      if (messagesContainer) {
        const scrollOptions = {
          top: messagesContainer.scrollHeight,
          behavior: immediate ? 'auto' : 'smooth'
        };
        
        if (immediate) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
        } else {
          messagesContainer.scrollTo(scrollOptions);
        }
      }
    }
  
    createChatbotUI();
  
    window.openBoxbollenChat = function() {
      log('Opening Boxbollen chat');
      isChatOpen = true;
      saveConversation();
      renderChatbot();
      initializeChat();
    };
  
    function exitChat() {
      log('Exiting chat');
      
      const chatWindow = document.querySelector('.chat-window');
      if (chatWindow) {
        // Add the hidden class to trigger the glideOutToBottom animation
        chatWindow.classList.add('hidden');
        
        // Wait for the animation to complete before removing the element
        chatWindow.addEventListener('animationend', () => {
          chatWindow.remove();
          isChatOpen = false;
        }, { once: true });
      }
    }
  
    const exitButton = document.querySelector('.exit-button'); // Assuming you have an exit button
    exitButton.addEventListener('click', exitChat);
  
  })();

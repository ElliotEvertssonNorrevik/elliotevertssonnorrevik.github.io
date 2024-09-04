(function() {
  const RESPONSE_URL = 'https://fd-gee0ghfphbcsfvex.z01.azurefd.net/api/HttpTrigger';
  const CONVO_OPERATIONS_URL = 'https://rosterai-chat-function.azurewebsites.net/api/ConversationOperations';
  const CONVO_OPERATIONS_KEY = 'tnW-7-CC7Up5N9QI_RNW-iAiREZ7OsYOi6W1uPfjt1_FAzFuU3IMJA=='; // Replace with your actual function key
  const RESPONSE_KEY = 'xZkIhzOOgQsoQftYWvhyfg1shu83UoJ7yRCMnXs-MVAeAzFuuDZdtQ==';
  const GET_ALL_PROFILES_URL = 'https://rosterai-chat-function.azurewebsites.net/api/getallprofiles'
  const GET_ALL_PROFILES_KEY = 'qoFEiCbbZLZkPtzSG_H5YxdKw4SdWFiq5glgoIttX6GrAzFuo67mqg=='; // Replace with your actual API key


  let userId;

  function getUserId() {
    if (!userId) {
      userId = localStorage.getItem('chat_user_id');
      if (!userId) {
        userId = generateUUID();
        localStorage.setItem('chat_user_id', userId);
      }
    }
    return userId;
  }

  let currentRequest = null;
  let isWaitingForAgent = false;
  let isQuicklinkPressed = false;
  let quicklinkMessage = '';
  let isConversationEnded = false;
  let currentView = null;
  let showRatingSystem = false;
  let isChatHistoryVisible = false;
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

  let isInitialPageVisible = true;

  function createChatbotUI() {
    const chatbotContainer = document.createElement('div');
    chatbotContainer.id = 'chat-chatbot';
    chatbotContainer.style.position = 'fixed';
    chatbotContainer.style.bottom = '20px';
    chatbotContainer.style.right = '20px';
    chatbotContainer.style.fontFamily = 'Montserrat, sans-serif';
  
    document.body.appendChild(chatbotContainer);
  
    loadConversation();
    renderChatbot();
  }

  function transitionViews(contentWrapper, oldView, newView) {
    oldView.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    oldView.style.transform = 'translateX(-100%)';
    oldView.style.opacity = '0';

    setTimeout(() => {
      contentWrapper.removeChild(oldView);
      
      contentWrapper.appendChild(newView);
      newView.style.transform = 'translateX(100%)';
      newView.style.opacity = '0';

      newView.offsetHeight;

      newView.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
      newView.style.transform = 'translateX(0)';
      newView.style.opacity = '1';

      currentView = newView;
    }, 300);
  }

  function createInitialPage() {
    const initialPage = document.createElement('div');
    initialPage.className = 'chat-initial-page';
  
    const header = document.createElement('div');
    header.className = 'chat-initial-header';
    
    const logoImg = document.createElement('img');
    logoImg.src = config.logoUrl;
    logoImg.alt = 'Logo';
    logoImg.className = 'chat-initial-logo';
    
    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.className = 'chat-initial-close';
    closeButton.addEventListener('click', () => {
      isChatOpen = false;
      isInitialPageVisible = false;
      renderChatbot();
    });
  
    header.appendChild(logoImg);
    header.appendChild(closeButton);
  
    const content = document.createElement('div');
    content.className = 'chat-initial-content';
    content.innerHTML = `
      <h2>Välkommen till VANBRUUN</h2>
      <p>Hur kan vi assistera dig idag?</p>
    `;
  
    const askButton = document.createElement('button');
    askButton.className = 'chat-initial-ask-button';
    
    const existingConversation = messages.length > 0;
    
    if (existingConversation) {
      askButton.innerHTML = 'Continue Conversation <span>&gt;</span>';
      askButton.addEventListener('click', () => {
        isChatOpen = true;
        isInitialPageVisible = false;
        renderChatbot();
      });
    } else {
      askButton.innerHTML = 'Start Conversation <span>&gt;</span>';
      askButton.addEventListener('click', () => openChat());
    }
  
    const quickLinks = document.createElement('div');
    quickLinks.className = 'chat-initial-quick-links';
    quickLinks.innerHTML = `
      <button id="track-order">Boka Konsultation</button>
      <button id="new-arrivals">Rekommendation</button>
    `;
  
    quickLinks.querySelector('#track-order').addEventListener('click', () => openChatAndSendMessage('Boka konsultation'));
    quickLinks.querySelector('#new-arrivals').addEventListener('click', () => openChatAndSendMessage('Rekommendation'));
  
    const talkToHuman = document.createElement('div');
    talkToHuman.className = 'chat-initial-talk-human';
    talkToHuman.style.display = 'none'; // Hide by default
  
    fetchAgentProfiles().then(agents => {
      const onlineAgents = agents.filter(agent => agent.isOnline).slice(0, 3);
      if (onlineAgents.length > 0) {
        const agentPhotosContainer = document.createElement('div');
        agentPhotosContainer.className = 'chat-agent-photos';
        
        onlineAgents.forEach((agent, index) => {
          const agentPhotoWrapper = document.createElement('div');
          agentPhotoWrapper.className = 'chat-agent-photo-wrapper';
          
          const agentPhoto = document.createElement('img');
          agentPhoto.src = agent.photoUrl || 'https://i.ibb.co/vzMrv94/person.png';
          agentPhoto.alt = agent.name;
          agentPhoto.className = 'chat-agent-photo';
          
          const onlineIndicator = document.createElement('div');
          onlineIndicator.className = 'chat-online-indicator';
          
          agentPhotoWrapper.appendChild(agentPhoto);
          agentPhotoWrapper.appendChild(onlineIndicator);
          agentPhotosContainer.appendChild(agentPhotoWrapper);
        });
  
        talkToHuman.innerHTML = '';
        talkToHuman.appendChild(agentPhotosContainer);
        talkToHuman.innerHTML += '<span>Talk to a human agent</span>';
        
        talkToHuman.addEventListener('click', () => {
          restartConversation();
          openChatAndSendMessage('Prata med kundtjänst');
        });
        talkToHuman.style.display = 'flex'; // Show the button

      } else {
        const agentPhotosContainer = document.createElement('div');
        agentPhotosContainer.className = 'chat-agent-photos';
        
        onlineAgents.forEach((agent, index) => {
          const agentPhotoWrapper = document.createElement('div');
          agentPhotoWrapper.className = 'chat-agent-photo-wrapper';
          
          agentPhotosContainer.appendChild(agentPhotoWrapper);
        });

        talkToHuman.innerHTML = '';
        talkToHuman.appendChild(agentPhotosContainer);
        talkToHuman.innerHTML += '<span>Talk to a human agent</span>';

        talkToHuman.innerHTML = '';
        talkToHuman.appendChild(agentPhotosContainer);
        talkToHuman.innerHTML += '<span>No agents currently available</span>';

        talkToHuman.style.display = 'flex'; // Show the button
      }
    });
  
    const homeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
    const messageCircleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>`;

    content.appendChild(askButton);
    content.appendChild(quickLinks);
    content.appendChild(talkToHuman);
  
    initialPage.appendChild(header);
    initialPage.appendChild(content);
  
    return initialPage;
  }

  async function fetchAgentProfiles() {
    const url = `${GET_ALL_PROFILES_URL}?code=${GET_ALL_PROFILES_KEY}`;
  
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching agent profiles:', error);
      return [];
    }
  }

  async function renderChatbot() {
    const chatbotContainer = document.getElementById('chat-chatbot');
    chatbotContainer.innerHTML = '';

    if (isChatOpen || isInitialPageVisible) {
      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'chat-content-wrapper';
      chatbotContainer.appendChild(contentWrapper);

      let view;
      if (isInitialPageVisible) {
        view = createInitialPage();
      } else if (isChatHistoryVisible) {
        view = await renderChatHistoryView();
      } else {
        view = createChatWindow();
      }

      contentWrapper.appendChild(view);

      if (isChatOpen) {
        await updateChatWindow();
      }
    } else {
      const launchButton = createLaunchButton();
      chatbotContainer.appendChild(launchButton);
    }
  }

  async function renderChatHistoryView() {
    const conversations = await fetchUserConversations();
    
    const chatHistoryContainer = document.createElement('div');
    chatHistoryContainer.className = 'chat-chat-history';
  
    const header = document.createElement('div');
    const messageCircleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>`;
    header.className = 'chat-chat-history-header';
    header.innerHTML = `
      ${messageCircleSvg}
      <h2>Chats</h2>
      <button class="chat-close-button">×</button>
    `;
    header.querySelector('.chat-close-button').addEventListener('click', () => {
      isInitialPageVisible = true;
      isChatHistoryVisible = false;
      renderChatbot();
    });
  
    const newChatButton = document.createElement('button');
    newChatButton.className = 'chat-new-chat-button';
    newChatButton.innerHTML = 'New Chat <span>&gt;</span>';
    newChatButton.addEventListener('click', restartConversation);
  
    const conversationsList = document.createElement('div');
    conversationsList.className = 'chat-conversations-list';
  
    if (conversations.length === 0) {
      const noConversations = document.createElement('div');
      noConversations.className = 'chat-no-conversations';
      noConversations.textContent = 'No conversations';
      conversationsList.appendChild(noConversations);
    } else {
      conversations.forEach((conv, index) => {
        const convSnippet = createConversationSnippet(conv, index === 0);
        conversationsList.appendChild(convSnippet);
        
        if (index === 0 && conversations.length > 1) {
          const previousHeader = document.createElement('h3');
          previousHeader.className = 'chat-previous-header';
          previousHeader.textContent = 'Previous conversations';
          conversationsList.appendChild(previousHeader);
        }
      });
    }
  
    const footer = createChatHistoryFooter();
  
    chatHistoryContainer.appendChild(header);
    chatHistoryContainer.appendChild(newChatButton);
    chatHistoryContainer.appendChild(conversationsList);
    chatHistoryContainer.appendChild(footer);
  
    return chatHistoryContainer;
  }
  
  function createChatHistoryFooter() {
    const homeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;
    
    const messageCircleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-circle"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>`;
  
    const footer = document.createElement('div');
    footer.className = 'chat-initial-footer';
    const homeButton = document.createElement('button');
    homeButton.className = 'home-button';
    homeButton.innerHTML = `
      ${homeSvg}
      <span>Home</span>
    `;
    
    const chatsButton = document.createElement('button');
    chatsButton.className = 'chats-button active';
    chatsButton.innerHTML = `
      ${messageCircleSvg}
      <span>Chats</span>
    `;
  
    footer.appendChild(homeButton);
    footer.appendChild(chatsButton);
  
    homeButton.addEventListener('click', () => {
      isInitialPageVisible = true;
      isChatHistoryVisible = false;
      renderChatbot();
    });
  
    return footer;
  }

  function openChat(initialMessage = null) {
    // Cancel any ongoing request when opening a new chat
    if (currentRequest) {
      currentRequest.abort();
      currentRequest = null;
    }
  
    isInitialPageVisible = false;
    isChatOpen = true;
    renderChatbot().then(() => {
      if (messages.length === 0 || isQuicklinkPressed) {
        isQuicklinkPressed = false; // Reset the flag
        initializeChat();
      } else {
        updateChatWindow();
      }
      if (initialMessage) {
        sendMessage(initialMessage);
      }
    }).catch(error => console.error('Error rendering chatbot:', error));
  }


  function openChatAndSendMessage(message) {
    isQuicklinkPressed = true;
    restartConversation(false);
    openChat();
    sendMessage(message);
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
      isInitialPageVisible = true;
      renderChatbot();
    });
  
    return button;
  }

  function createChatWindow() {
    const chatWindow = document.createElement('div');
    chatWindow.className = 'chat-chat-window';
  
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
    header.className = 'chat-chat-header';
    header.style.backgroundColor = config.mainColor;
  
    const headerContent = document.createElement('div');
    headerContent.className = 'chat-header-content';
  
    const backButton = document.createElement('button');
    backButton.className = 'chat-back-button';
    backButton.innerHTML = '&#10094;';
    backButton.addEventListener('click', () => {
      isInitialPageVisible = true;
      isChatOpen = false;
      renderChatbot();
    });
  
    const headerText = document.createElement('div');
    headerText.className = 'chat-header-text';
  
    const title = document.createElement('h1');
    title.textContent = config.headerText;

    headerText.appendChild(title);
  
    headerContent.appendChild(backButton);
    headerContent.appendChild(headerText);
  
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'chat-header-buttons';
  
    const reloadButton = document.createElement('button');
    reloadButton.innerHTML = '&#x21bb;';
    reloadButton.className = 'chat-button chat-reload-button';
    reloadButton.title = 'Restart conversation';
    reloadButton.addEventListener('click', restartChatFromWindow);
  
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.className = 'chat-button chat-close-button';
    closeButton.addEventListener('click', () => {
      isChatOpen = false;
      isInitialPageVisible = false;
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
    logo.alt = 'Vanbruun Logo';
    logo.className = 'chat-logo';
  
    const logoText = document.createElement('div');
    logoText.className = 'chat-logo-text';
    logoText.innerHTML = `<h2>${config.headerText}</h2><p>${config.subHeaderText}</p>`;
  
    logoContainer.appendChild(logo);
    logoContainer.appendChild(logoText);
  
    return logoContainer;
  }
fetchAndDisplayConversation
  function createInputArea() {
    const inputArea = document.createElement('div');
    inputArea.className = 'chat-input-area';
  
    if (!isConversationEnded) {
      const inputContainer = document.createElement('div');
      inputContainer.className = 'chat-input-container';
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Skriv ett meddelande...';
      input.className = 'chat-input';
      
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
      
      const sendButton = document.createElement('button');
      sendButton.textContent = 'Skicka';
      sendButton.className = 'chat-send-button';
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
  
    const chatWindow = document.querySelector('.chat-chat-window');
    if (chatWindow) {
      chatWindow.addEventListener('scroll', () => {
        console.log('Chat window scrolled, removing emoji picker');
        emojiPicker.remove();
        document.removeEventListener('click', closeEmojiPicker);
      }, { once: true });
    }
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
    optionsElement.className = 'chat-initial-options';
  
    const options = ['Spåra min order', 'Boka konsultation'];
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

  function endConversation() {
    isConversationEnded = true;
    createEndConversationOverlay();
    updateChatWindow();
  }
  
  function createEndConversationOverlay() {
    const chatWindow = document.querySelector('.chat-chat-window');
    const overlay = document.createElement('div');
    overlay.className = 'chat-end-conversation-overlay';
    
    const content = document.createElement('div');
    content.className = 'chat-end-conversation-content';
    
    const message = document.createElement('p');
    message.textContent = "Okay, thanks for the chat! If you have any questions in the future, don't hesitate to contact me. I wish you a fantastic day ahead! 👋";
    
    const endedMessage = document.createElement('p');
    endedMessage.className = 'chat-chat-ended';
    endedMessage.textContent = 'Chat has Ended.';
    
    const newChatButton = document.createElement('button');
    newChatButton.textContent = 'Start New Conversation';
    newChatButton.className = 'chat-new-conversation-button';
    newChatButton.addEventListener('click', restartConversation);
    
    content.appendChild(message);
    content.appendChild(endedMessage);
    content.appendChild(newChatButton);
    overlay.appendChild(content);
    
    chatWindow.appendChild(overlay);
    
    setTimeout(() => {
      overlay.classList.add('show');
    }, 50);
  }

  function createMessageElement(message) {
    const messageWrapper = document.createElement('div');
    messageWrapper.className = `chat-message-wrapper ${message.isBot ? 'bot' : 'user'}`;
  
    if (message.isBot) {
      const profileImage = document.createElement('img');
      if (isConnectedToCustomerService && message.agentPhotoUrl) {
        profileImage.src = message.agentPhotoUrl;
      } else {
        profileImage.src = config.logoUrl;
      }
      profileImage.alt = isConnectedToCustomerService ? 'Agent Profile' : 'Bot Profile';
      profileImage.className = 'chat-bot-profile-image';
      messageWrapper.appendChild(profileImage);
    }
  
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${message.isBot ? 'bot' : 'user'}`;
    
    if (message.className) {
      messageElement.classList.add(message.className);
    }
  
    if (message.isBot && message.agentName) {
      const agentNameElement = document.createElement('div');
      agentNameElement.className = 'chat-agent-name';
      agentNameElement.textContent = message.agentName;
      messageElement.appendChild(agentNameElement);
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
    
    function createNewChatButton() {
      const buttonContainer = document.createElement('div');
      buttonContainer.className = 'chat-new-chat-button-container';
    
      const newChatButton = document.createElement('button');
      newChatButton.textContent = 'Start New Conversation';
      newChatButton.className = 'chat-new-conversation-button';
      newChatButton.addEventListener('click', restartConversation);
    
      buttonContainer.appendChild(newChatButton);
      return buttonContainer;
    }
  
    function createFollowUpButtons() {
      const followUpElement = document.createElement('div');
      followUpElement.className = 'chat-initial-options';
      
      const options = [
        { text: 'Ja', response: 'ja' },
        { text: 'Nej', response: 'nej' },
        { text: 'Prata med kundtjänst', response: 'customer_service' }
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
  
  
    function getCETTimestamp() {
      const now = new Date();
      const utcOffset = now.getTimezoneOffset();
      const cetOffset = utcOffset + 60; // CET is UTC+1
      return new Date(now.getTime() + cetOffset * 60000).toISOString();
    }
  
    async function sendMessage(text) {
      if (text.trim() === '' || isLoading || isWaitingForAgent) return;
    
      const currentTime = getStockholmTimestamp();
    
      addMessage(text, false, false, currentTime);
      
      if (!isConnectedToCustomerService) {
        addMessage('', true, true); // Add loading message
        isLoading = true;
      }
    
      showInitialOptions = false;
      showFollowUp = false;
    
      conversationHistory.push({"role": "user", "content": text, "timestamp": currentTime});
    
      await sendConversationToAzure(messages);
    
      updateChatWindow();
    
      if (text.toLowerCase() === 'prata med kundtjänst' && !isConnectedToCustomerService) {
        isConnectedToCustomerService = true;
        const response = "Kopplar dig till kundtjänst...";
        messages[messages.length - 1] = { text: response, isBot: true, isLoading: false, timestamp: getStockholmTimestamp() };
        conversationHistory.push({"role": "assistant", "content": response, "timestamp": getStockholmTimestamp()});
        await sendConversationToAzure(messages, true);
        startCustomerServiceMode();
        isLoading = false;
        updateChatWindow();
        return;
      }
    
      if (isConnectedToCustomerService) {
        await sendConversationToAzure(messages, true);
        fetchAndDisplayConversation();
      } else {
        try {
          // Cancel any ongoing request
          if (currentRequest) {
            currentRequest.abort();
          }
    
          const formattedHistory = conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join(' ');
          const fullQuery = `conversation_history: ${formattedHistory} question: ${text}`;
    
          const encodedQuery = encodeURIComponent(fullQuery);
          const url = `${RESPONSE_URL}?question=${encodedQuery}`;
    
          // Create a new AbortController for this request
          const controller = new AbortController();
          currentRequest = controller;
    
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'x-functions-key': RESPONSE_KEY
            },
            signal: controller.signal
          });
    
          const data = await response.json();
          const answer = data.answer;
    
          const responseTime = getStockholmTimestamp();
          conversationHistory.push({"role": "assistant", "content": answer, "timestamp": responseTime});
    
          // Find the loading message and replace it
          const loadingIndex = messages.findIndex(msg => msg.isLoading);
          if (loadingIndex !== -1) {
            messages[loadingIndex] = { text: answer, isBot: true, isLoading: false, timestamp: responseTime };
          } else {
            messages.push({ text: answer, isBot: true, isLoading: false, timestamp: responseTime });
          }
          
          await sendConversationToAzure(messages);
    
          if (!answer.includes('?') && Math.random() < 0.5) {
            setTimeout(() => {
              const followUpTime = getStockholmTimestamp();
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
          if (error.name === 'AbortError') {
            console.log('Fetch aborted');
          } else {
            console.error('Error fetching bot response:', error);
            const errorTime = getStockholmTimestamp();
            const errorMessage = 'Sorry, I couldn\'t connect right now. Please try again later or contact us at customer.service@happyflops.se';
            
            // Find the loading message and replace it with the error message
            const loadingIndex = messages.findIndex(msg => msg.isLoading);
            if (loadingIndex !== -1) {
              messages[loadingIndex] = { text: errorMessage, isBot: true, isLoading: false, timestamp: errorTime };
            } else {
              messages.push({ text: errorMessage, isBot: true, isLoading: false, timestamp: errorTime });
            }
            
            conversationHistory.push({"role": "assistant", "content": errorMessage, "timestamp": errorTime});
            await sendConversationToAzure(messages);
          }
        } finally {
          isLoading = false;
          currentRequest = null;
          updateChatWindow();
        }
      }
    }
    
    function handleFollowUpResponse(response) {
      showFollowUp = false;
      updateChatWindow();
    
      if (response === "customer_service") {
        isConnectedToCustomerService = true;
        const customerServiceMessage = "Prata med kundtjänst.";
        const timestamp = getStockholmTimestamp();
        
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
        addMessage(userResponse, false, false, getStockholmTimestamp());
        
        setTimeout(() => {
          if (response === "yes") {
            const botResponse = "Vad mer kan jag hjälpa dig med?";
            addMessage(botResponse, true, false, getStockholmTimestamp());
            updateChatWindow();
            sendConversationToAzure(messages);
          } else {
            const botResponse = "Okej, tack för att du chattat med mig!";
            addMessage(botResponse, true, false, getStockholmTimestamp());
            updateChatWindow();
            sendConversationToAzure(messages).then(() => {
              sendConversationOverStatus();
            });
          }
        }, 500);
      }
      saveConversation();
    }
  
    async function sendConversationOverStatus() {

      
        const payload = {
          operation: 'store',
          conversationId: window.conversationId,
          conversation_over: true
        };
      
        console.log('Sending conversation_over');
        try {
          const response = await fetch(CONVO_OPERATIONS_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-functions-key': CONVO_OPERATIONS_KEY
            },
            body: JSON.stringify(payload)
          });
      
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const result = await response.json();
          console.log('Conversation over status sent successfully:', result);
          
          showRatingSystem = true;
          console.log('showRatingSystem set to:', showRatingSystem);
          updateChatWindow();
        } catch (error) {
          console.error('Error sending conversation over status:', error);
        }
      }
  
      async function fetchAndDisplayConversation() {
        const url = `${CONVO_OPERATIONS_URL}?code=${CONVO_OPERATIONS_KEY}&operation=get&conversationId=${encodeURIComponent(window.conversationId)}`;
      
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('Received conversation data:', data);
      
          if (data.HandledChat && isWaitingForAgent) {
            messages = messages.filter(msg => !msg.isLoading);
            
            const agentConnectedMessage = `Du pratar nu med ${data.HandledChat}`;
            addMessage(agentConnectedMessage, true, false, new Date().toISOString());
            isWaitingForAgent = false;
            enableInputArea();
          }
      
          if (Array.isArray(data.messages)) {
            const lastMessageTimestamp = messages.length > 0 ? messages[messages.length - 1].timestamp : new Date(0).toISOString();
            const newMessages = data.messages.filter(msg => new Date(msg.timestamp) > new Date(lastMessageTimestamp));
            
            console.log(`Found ${newMessages.length} new messages`);
            
            newMessages.forEach(msg => {
              addMessage(msg.text, msg.isBot, false, msg.timestamp, msg.agentName, msg.agentId, msg.agentPhotoUrl);
            });
      
            if (newMessages.length > 0) {
              showFollowUp = false;
              updateChatWindow();
            }
          } else {
            console.warn('No messages array in the response:', data);
          }
      
          if (data.conversation_over) {
            console.log('Conversation is over, displaying star rating');
            showRatingSystem = true;
            updateChatWindow();
            clearInterval(customerServiceInterval);
          }
      
        } catch (error) {
          console.error('Error fetching conversation:', error);
          
          if (messages.length === 0) {
            addMessage("Ett fel uppstod när vi försökte hämta konversationen. Vänligen försök igen senare.", true);
          }
          
          updateChatWindow();
        }
      }
      
      function updateChatWindow() {
        console.log('Updating chat window');
        
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
          
          if (showInitialOptions && !isConnectedToCustomerService && !isConversationEnded) {
            const optionsElement = createInitialOptions();
            messagesWrapper.appendChild(optionsElement);
          }
          if (showFollowUp && !isConnectedToCustomerService && !isConversationEnded) {
            const followUpElement = createFollowUpButtons();
            messagesWrapper.appendChild(followUpElement);
          }
          if (showRatingSystem && !isConversationEnded) {
            console.log('Displaying rating system');
            const ratingElement = createStarRating();
            messagesWrapper.appendChild(ratingElement);
          }
          
          scrollToBottom();
        }
        
        const inputArea = document.querySelector('.chat-input-area');
        if (inputArea) {
          inputArea.style.pointerEvents = isConversationEnded ? 'none' : 'auto';
          inputArea.style.opacity = isConversationEnded ? '0.5' : '1';
        }
        
        saveConversation();
      }
  
    function addLoadingMessage() {
      const loadingMessage = {
        text: 'Vänligen vänta, vi meddelar teamet..',
        isBot: true,
        isLoading: true
      };
      messages.push(loadingMessage);
      updateChatWindow();
    }
    
    function disableInputArea() {
      const inputArea = document.querySelector('.chat-input-area');
      const input = document.querySelector('.chat-input');
      const sendButton = document.querySelector('.chat-send-button');
      if (inputArea && input && sendButton) {
        input.disabled = true;
        sendButton.disabled = true;
        inputArea.style.opacity = '0.5';
      }
    }
    
    function enableInputArea() {
      const inputArea = document.querySelector('.chat-input-area');
      const input = document.querySelector('.chat-input');
      const sendButton = document.querySelector('.chat-send-button');
      if (inputArea && input && sendButton) {
        input.disabled = false;
        sendButton.disabled = false;
        inputArea.style.opacity = '1';
      }
    }
  
    function displayStarRating() {
      const ratingContainer = createStarRating();
      const messagesWrapper = document.querySelector('.chat-messages-wrapper');
      if (messagesWrapper) {
        messagesWrapper.appendChild(ratingContainer);
        scrollToBottom();
      }
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
    
    function setRating(rating) {
      const stars = document.querySelectorAll('.chat-star');
      stars.forEach((star) => star.classList.remove('active'));
      if (rating > 0) {
        stars[rating - 1].classList.add('active');
      }
      updateStars(rating);
    }
  
    function handleStarClick(rating) {
      console.log('Star clicked:', rating);
      updateStars(rating);
      sendRating(rating);
    }
  
    function updateStars(rating) {
      const stars = document.querySelectorAll('.chat-star');
      stars.forEach((star, index) => {
        if (index < rating) {
          star.innerHTML = '★';
        } else {
          star.innerHTML = '☆';
        }
      });
    }
  
    async function sendRating(rating) {
      const url = `${CONVO_OPERATIONS_URL}?code=${CONVO_OPERATIONS_KEY}`;
      const payload = {
        operation: 'store',
        conversationId: window.conversationId,
        Rating: rating,
        timestamp: getStockholmTimestamp()
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
        showRatingSystem = false;
        endConversation();
      } catch (error) {
        console.error('Error storing rating:', error);
        endConversation();
      }
    }
  fetchAndDisplayConversation
    function scrollToBottom() {
      const messagesContainer = document.querySelector('.chat-messages-container');
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
  
    function saveConversation() {
      localStorage.setItem('vanbruunChatMessages', JSON.stringify(messages));
      localStorage.setItem('vanbruunChatHistory', JSON.stringify(conversationHistory));
      localStorage.setItem('vanbruunChatId', window.conversationId || '');
      localStorage.setItem('vanbruunChatShowInitialOptions', JSON.stringify(showInitialOptions));
      localStorage.setItem('vanbruunChatShowFollowUp', JSON.stringify(showFollowUp));
      localStorage.setItem('vanbruunChatShowRatingSystem', JSON.stringify(showRatingSystem));
      localStorage.setItem('vanbruunChatIsOpen', JSON.stringify(isChatOpen));
      localStorage.setItem('vanbruunChatLastMessage', JSON.stringify(messages[messages.length - 1]));
      localStorage.setItem('vanbruunChatIsConnectedToCustomerService', JSON.stringify(isConnectedToCustomerService));
      
      if (isLoading) {
        localStorage.setItem('vanbruunChatIsLoading', JSON.stringify(isLoading));
      } else {
        localStorage.removeItem('vanbruunChatIsLoading');
      }
    
      localStorage.setItem('vanbruunChatLastSaved', new Date().toISOString());
    }
    
    function loadConversation() {
      const storedMessages = localStorage.getItem('vanbruunChatMessages');
      const storedHistory = localStorage.getItem('vanbruunChatHistory');
      const storedId = localStorage.getItem('vanbruunChatId');
      const storedShowInitialOptions = localStorage.getItem('vanbruunChatShowInitialOptions');
      const storedShowFollowUp = localStorage.getItem('vanbruunChatShowFollowUp');
      const storedShowRatingSystem = localStorage.getItem('vanbruunChatShowRatingSystem');
      const storedIsConnectedToCustomerService = localStorage.getItem('vanbruunChatIsConnectedToCustomerService');
      const storedLastMessage = localStorage.getItem('vanbruunChatLastMessage');
  
      if (storedMessages) {
        messages = JSON.parse(storedMessages);
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
      if (storedShowRatingSystem !== null) {
        showRatingSystem = JSON.parse(storedShowRatingSystem);
      }
      if (storedIsConnectedToCustomerService !== null) {
        isConnectedToCustomerService = JSON.parse(storedIsConnectedToCustomerService);
      }
  
      // Always set isChatOpen and isInitialPageVisible to false when the page loads
      isChatOpen = false;
      isInitialPageVisible = false;
  
      isLoading = false;
      isInitialized = messages.length > 0;
  
      if (storedLastMessage) {
        const lastMessage = JSON.parse(storedLastMessage);
        if (lastMessage && lastMessage.isBot && lastMessage.text === "Kan jag hjälpa dig med något mer?") {
          showFollowUp = true;
        }
      }
  
      if (isConnectedToCustomerService) {
        showFollowUp = false;
      }
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
      showRatingSystem = false;
      isConversationEnded = false;
      window.conversationId = generateUUID();
    
      localStorage.removeItem('vanbruunChatMessages');
      localStorage.removeItem('vanbruunChatHistory');
      localStorage.removeItem('vanbruunChatId');
      localStorage.removeItem('vanbruunChatShowInitialOptions');
      localStorage.removeItem('vanbruunChatShowFollowUp');
      localStorage.removeItem('vanbruunChatLastMessage');
      localStorage.removeItem('vanbruunChatIsConnectedToCustomerService');
      localStorage.removeItem('vanbruunChatShowRatingSystem');
    
      openChat();
    }
  
    function restartChatFromWindow() {
      messages = [];
      conversationHistory = [];
      
      isInitialized = false;
      showInitialOptions = false;
      showFollowUp = false;
      showRatingSystem = false;
      isConversationEnded = false;
      isConnectedToCustomerService = false;
      
      window.conversationId = generateUUID();
      
      localStorage.removeItem('vanbruunChatMessages');
      localStorage.removeItem('vanbruunChatHistory');
      localStorage.removeItem('vanbruunChatId');
      localStorage.removeItem('vanbruunChatShowInitialOptions');
      localStorage.removeItem('vanbruunChatShowFollowUp');
      localStorage.removeItem('vanbruunChatLastMessage');
      localStorage.removeItem('vanbruunChatIsConnectedToCustomerService');
      localStorage.removeItem('vanbruunChatShowRatingSystem');
      
      initializeChat();
    }
  
    function generateUUID() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
  
    
  
    function formatTimestamp(date) {
      const pad = (num) => (num < 10 ? '0' + num : num);
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${date.getMilliseconds().toString().padStart(3, '0')}`;
    }
    
    function addMessage(text, isBot, isLoading = false, timestamp = null, agentName = null, agentId = null, agentPhotoUrl = null) {
      const messageTimestamp = timestamp || getStockholmTimestamp();
      messages.push({ text, isBot, isLoading, timestamp: messageTimestamp, agentName, agentId, agentPhotoUrl });
      updateChatWindow();
      saveConversation();
    }
  
    function getStockholmTimestamp() {
      const now = new Date();
      const stockholmTime = new Date(now.toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' }));
      
      const pad = (num) => String(num).padStart(2, '0');
      
      const year = stockholmTime.getFullYear();
      const month = pad(stockholmTime.getMonth() + 1); // getMonth() is zero-indexed
      const day = pad(stockholmTime.getDate());
      const hours = pad(stockholmTime.getHours());
      const minutes = pad(stockholmTime.getMinutes());
      const seconds = pad(stockholmTime.getSeconds());
      const milliseconds = String(stockholmTime.getMilliseconds()).padStart(3, '0');
    
      // Construct the ISO string manually
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
    
    // Test the function
    console.log(getStockholmTimestamp());
    
    async function sendConversationToAzure(messages, needsCustomerService = false) {
      const url = `${CONVO_OPERATIONS_URL}?code=${CONVO_OPERATIONS_KEY}`;
    
      const payload = {
        operation: 'store',
        conversationId: window.conversationId || (window.conversationId = generateUUID()),
        userId: getUserId(),
        messages: messages.map(msg => ({
          text: msg.text,
          isBot: msg.isBot,
          timestamp: msg.timestamp || getStockholmTimestamp(),
          agentName: msg.agentName,
          agentId: msg.agentId
        })),
        needsCustomerService: needsCustomerService || isConnectedToCustomerService,
      };
    
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
    
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
    
        const responseData = await response.json();
        console.log('Conversation stored successfully:', responseData);
        return responseData;
      } catch (error) {
        console.error('Error storing conversation:', error);
        throw error;
      }
    }
      
    async function fetchUserConversations() {
      const url = `${CONVO_OPERATIONS_URL}?code=${CONVO_OPERATIONS_KEY}&operation=getAll`;
    
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (!data || !Array.isArray(data.conversations)) {
          console.error('Unexpected data structure:', data);
          return [];
        }
    
        const currentUserId = getUserId();
        
        const userConversations = data.conversations.filter(conv => conv.userId === currentUserId);
        
        userConversations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return userConversations;
      } catch (error) {
        console.error('Error fetching user conversations:', error);
        return [];
      }
    }
  
    function createConversationSnippet(conversation, isRecent) {
        const convSnippet = document.createElement('div');
        convSnippet.className = `chat-conversation-snippet ${isRecent ? 'recent' : ''}`;
        
        const snippetContent = document.createElement('div');
        snippetContent.className = 'chat-snippet-content';
        const title = document.createElement('h4');
      title.textContent = isRecent ? 'Recent Conversation' : 'Conversation';
      snippetContent.appendChild(title);
      
      const message = document.createElement('p');
      message.textContent = `Conversation ${conversation.id.substring(0, 8)}...`;
      snippetContent.appendChild(message);
    
      const timestamp = document.createElement('span');
      timestamp.textContent = formatTimestamp(conversation.timestamp);
      snippetContent.appendChild(timestamp);
    
      convSnippet.appendChild(snippetContent);
    
      const arrowIcon = document.createElement('span');
      arrowIcon.className = 'chat-snippet-arrow';
      arrowIcon.innerHTML = '&gt;';
      convSnippet.appendChild(arrowIcon);
    
      convSnippet.addEventListener('click', () => {
        window.conversationId = conversation.id;
        openChat();
      });
    
      return convSnippet;
  }
    
  function startCustomerServiceMode() {
    console.log("Entering customer service mode");
    isWaitingForAgent = true;
    addLoadingMessage();
    disableInputArea();
    customerServiceInterval = setInterval(fetchAndDisplayConversation, 1000); // Changed from 500ms to 1000ms (1 second)
  }

  createChatbotUI();  

  window.openVanbruunChat = function() {
    isInitialPageVisible = true;
    isChatOpen = true;
    renderChatbot();
  };

  console.log('Chatbot script loaded and initialized');
})();

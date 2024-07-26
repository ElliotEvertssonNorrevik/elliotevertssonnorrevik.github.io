(function() {
    function ChatbotWidget() {
        this.widget = null;
        this.chatButton = null;
        this.chatContainer = null;
        this.messageList = null;
        this.inputField = null;
        this.apiEndpoint = 'https://rosterai-fresh-function.azurewebsites.net/api/HttpTrigger';
        this.config = {
            headerText: 'Happyflops AI',
            subHeaderText: 'Chatta med vår digitala assistent',
            mainColor: '#FCBE08',
            logoUrl: 'https://i.ibb.co/H2tqg2w/Ventajas-1-200-removebg-preview-removebg-preview-removebg-preview.png'
        };
        this.isInitialized = false;
        this.showFollowUp = false;
        this.conversationId = null;
        this.messages = [];
        this.isLoading = false;
        this.showInitialOptions = false;
        
        this.init();
    }

    ChatbotWidget.prototype.init = function() {
        this.loadFonts();
        this.createWidgetButton();
        this.createChatContainer();
        this.bindEvents();
        this.generateConversationId();
    };

    ChatbotWidget.prototype.loadFonts = function() {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    };

    ChatbotWidget.prototype.generateConversationId = function() {
        this.conversationId = localStorage.getItem('conversationId');
        if (!this.conversationId) {
            this.conversationId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
            localStorage.setItem('conversationId', this.conversationId);
        }
    };

    ChatbotWidget.prototype.createWidgetButton = function() {
        this.widget = document.createElement('div');
        this.widget.id = 'chatbot-widget';
        this.widget.className = 'fixed bottom-5 right-5';
        this.chatButton = document.createElement('button');
        this.chatButton.className = 'w-20 h-20 rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition duration-200';
        this.chatButton.style.backgroundColor = this.config.mainColor;
        this.chatButton.innerHTML = `<img src="${this.config.logoUrl}" alt="Chat" class="w-20 h-20 rounded-full">`;
        this.widget.appendChild(this.chatButton);
        document.body.appendChild(this.widget);
    };

    ChatbotWidget.prototype.createChatContainer = function() {
        this.chatContainer = document.createElement('div');
        this.chatContainer.className = 'hidden w-[35rem] h-[45rem] bg-white rounded-lg shadow-lg flex flex-col rounded-2xl fixed bottom-5 right-5';
        this.chatContainer.innerHTML = `
            <div class="h-[5rem] p-4 flex justify-between rounded-t-2xl" style="background-color: ${this.config.mainColor}">
                <div class="flex items-center">
                    <img src="${this.config.logoUrl}" alt="Header" class="w-[3rem] h-[3rem] rounded-full mr-3">
                    <div>
                        <h1 class="text-xl font-bold text-white">${this.config.headerText}</h1>
                        <p class="text-white">${this.config.subHeaderText}</p>
                    </div>
                </div>
                <button id="chatbot-close" class="text-white">×</button>
            </div>
            <div class="flex-grow overflow-hidden">
                <div id="chatbot-messages" class="h-full overflow-y-auto p-4 bg-gray-50"></div>
            </div>
            <div class="p-2 bg-gray">
                <div class="flex">
                    <input
                        type="text"
                        id="chatbot-input"
                        class="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="Skriv ett meddelande..."
                    >
                    <button 
                        id="chatbot-send"
                        class="bg-yellow-400 text-white font-bold py-2 px-4 rounded-r-lg hover:opacity-90 transition duration-200"
                        style="background-color: ${this.config.mainColor}"
                    >
                        Skicka
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(this.chatContainer);
        this.messageList = this.chatContainer.querySelector('#chatbot-messages');
        this.inputField = this.chatContainer.querySelector('#chatbot-input');
    };

    ChatbotWidget.prototype.toggleChat = function() {
        if (this.chatContainer.classList.contains('hidden')) {
            this.chatContainer.classList.remove('hidden');
            this.chatButton.classList.add('hidden');
            if (!this.isInitialized) {
                this.fetchAndDisplayMessages();
                this.isInitialized = true;
            }
        } else {
            this.chatContainer.classList.add('hidden');
            this.chatButton.classList.remove('hidden');
        }
    };

    ChatbotWidget.prototype.bindEvents = function() {
        this.chatButton.addEventListener('click', () => this.toggleChat());
        this.chatContainer.querySelector('#chatbot-close').addEventListener('click', () => this.toggleChat());
        this.chatContainer.querySelector('#chatbot-send').addEventListener('click', () => this.handleUserMessage());
        this.inputField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUserMessage();
            }
        });
    };

    ChatbotWidget.prototype.handleUserMessage = function() {
        const messageText = this.inputField.value.trim();
        if (!messageText) return;
        this.addMessage('user', messageText);
        this.inputField.value = '';
        this.scrollToBottom();
        this.sendMessageToServer(messageText);
    };

    ChatbotWidget.prototype.addMessage = function(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chatbot-message ${sender === 'user' ? 'user' : 'bot'}`;
        messageDiv.textContent = text;
        this.messageList.appendChild(messageDiv);
        this.messages.push({ sender, text });
        this.scrollToBottom();
    };

    ChatbotWidget.prototype.scrollToBottom = function() {
        this.messageList.scrollTop = this.messageList.scrollHeight;
    };

    ChatbotWidget.prototype.sendMessageToServer = function(message) {
        if (this.isLoading) return;
        this.isLoading = true;
        this.addLoadingDots();
        const payload = {
            conversationId: this.conversationId,
            userMessage: message,
            messages: this.messages
        };
        fetch(this.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => response.json())
        .then(data => {
            this.removeLoadingDots();
            this.isLoading = false;
            if (data && data.responseMessage) {
                this.addMessage('bot', data.responseMessage);
                if (data.followUpMessages && data.followUpMessages.length) {
                    this.showFollowUpOptions(data.followUpMessages);
                }
            }
        })
        .catch(() => {
            this.removeLoadingDots();
            this.isLoading = false;
            this.addMessage('bot', 'Tyvärr, något gick fel. Försök igen.');
        });
    };

    ChatbotWidget.prototype.addLoadingDots = function() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chatbot-loading';
        loadingDiv.innerHTML = `
            <div class="chatbot-loading-dot"></div>
            <div class="chatbot-loading-dot"></div>
            <div class="chatbot-loading-dot"></div>
        `;
        loadingDiv.id = 'chatbot-loading';
        this.messageList.appendChild(loadingDiv);
        this.scrollToBottom();
    };

    ChatbotWidget.prototype.removeLoadingDots = function() {
        const loadingDiv = this.chatContainer.querySelector('#chatbot-loading');
        if (loadingDiv) {
            this.messageList.removeChild(loadingDiv);
        }
    };

    ChatbotWidget.prototype.showFollowUpOptions = function(options) {
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'chatbot-options';
        options.forEach(option => {
            const button = document.createElement('button');
            button.className = 'chatbot-option-button';
            button.textContent = option;
            button.addEventListener('click', () => {
                this.handleUserMessage(option);
                optionsDiv.remove();
            });
            optionsDiv.appendChild(button);
        });
        this.messageList.appendChild(optionsDiv);
        this.scrollToBottom();
    };

    ChatbotWidget.prototype.fetchAndDisplayMessages = function() {
        const storedMessages = localStorage.getItem('chatbotMessages');
        if (storedMessages) {
            this.messages = JSON.parse(storedMessages);
            this.messages.forEach(msg => this.addMessage(msg.sender, msg.text));
        } else {
            this.addMessage('bot', 'Hej! Hur kan jag hjälpa dig idag?');
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        new ChatbotWidget();
    });
})();

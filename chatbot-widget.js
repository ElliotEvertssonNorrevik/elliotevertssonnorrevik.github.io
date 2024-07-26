(function() {
    function ChatbotWidget() {
        this.widget = null;
        this.chatWindow = null;
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
        this.createChatWindow();
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
        this.widget.innerHTML = `
            <div id="chatbot-button">
                <img src="${this.config.logoUrl}" alt="Chat">
            </div>
        `;
        document.body.appendChild(this.widget);
    };

    ChatbotWidget.prototype.createChatWindow = function() {
        this.chatWindow = document.createElement('div');
        this.chatWindow.id = 'chatbot-window';
        this.chatWindow.className = 'hidden';
        this.chatWindow.innerHTML = `
            <div id="chatbot-header">
                <div id="chatbot-header-content">
                    <img src="${this.config.logoUrl}" alt="Logo">
                    <div>
                        <h1>${this.config.headerText}</h1>
                        <p>${this.config.subHeaderText}</p>
                    </div>
                </div>
                <button id="chatbot-close">×</button>
            </div>
            <div id="chatbot-messages"></div>
            <div id="chatbot-input-area">
                <input type="text" id="chatbot-input" placeholder="Skriv ett meddelande...">
                <button id="chatbot-send">Skicka</button>
            </div>
        `;
        document.body.appendChild(this.chatWindow);
        
        this.messageList = this.chatWindow.querySelector('#chatbot-messages');
        this.inputField = this.chatWindow.querySelector('#chatbot-input');
    };

    ChatbotWidget.prototype.bindEvents = function() {
        this.widget.querySelector('#chatbot-button').onclick = () => this.toggleChatWindow();
        this.chatWindow.querySelector('#chatbot-close').onclick = () => this.toggleChatWindow();
        this.chatWindow.querySelector('#chatbot-send').onclick = () => this.sendMessage();
        this.inputField.onkeypress = (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        };
    };

    ChatbotWidget.prototype.toggleChatWindow = function() {
        this.chatWindow.classList.toggle('hidden');
        if (!this.chatWindow.classList.contains('hidden') && !this.isInitialized) {
            this.initializeChat();
        }
    };

    ChatbotWidget.prototype.initializeChat = function() {
        this.addBotMessage("", true);
        setTimeout(() => {
            this.updateLastBotMessage("Hej! Mitt namn är Elliot och jag är din virtuella assistent här på Happyflops.");
            setTimeout(() => {
                this.addBotMessage("Vad kan jag hjälpa dig med idag?😊");
                this.showInitialOptions = true;
                this.renderMessages();
            }, 1000);
        }, 700);
        this.isInitialized = true;
    };

    ChatbotWidget.prototype.sendMessage = async function() {
        const message = this.inputField.value.trim();
        if (message) {
            this.addUserMessage(message);
            this.inputField.value = '';
            this.showInitialOptions = false;
            this.renderMessages();
            
            this.isLoading = true;
            this.addBotMessage("", true);
            this.renderMessages();

            try {
                const response = await fetch(`${this.apiEndpoint}?question=${encodeURIComponent(message)}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        conversation_id: this.conversationId
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                this.isLoading = false;
                this.updateLastBotMessage(data.answer);
                
                if (Math.random() < 0.5) {
                    this.showFollowUpQuestion();
                }
            } catch (error) {
                console.error('Error:', error.message);
                this.isLoading = false;
                this.updateLastBotMessage("Tyvärr kunde jag inte ansluta just nu. Vänligen försök igen senare eller kontakta oss via kundservice@happyflops.se");
            }
            
            this.renderMessages();
        }
    };

    ChatbotWidget.prototype.addMessage = function(message, isBot, isLoading = false) {
        this.messages.push({ text: message, isBot, isLoading });
    };

    ChatbotWidget.prototype.updateLastBotMessage = function(message) {
        const lastBotMessage = this.messages.slice().reverse().find(msg => msg.isBot);
        if (lastBotMessage) {
            lastBotMessage.text = message;
            lastBotMessage.isLoading = false;
        }
    };

    ChatbotWidget.prototype.addUserMessage = function(message) {
        this.addMessage(message, false);
    };

    ChatbotWidget.prototype.addBotMessage = function(message, isLoading = false) {
        this.addMessage(message, true, isLoading);
    };

    ChatbotWidget.prototype.showFollowUpQuestion = function() {
        setTimeout(() => {
            this.addBotMessage("Kan jag hjälpa dig med något mer?");
            this.showFollowUp = true;
            this.renderMessages();
        }, 1000);
    };

    ChatbotWidget.prototype.handleOptionClick = function(option) {
        if (option === 'Ja' || option === 'Nej') {
            this.handleFollowUpResponse(option === 'Ja');
        } else {
            this.sendMessage(option);
        }
    };

    ChatbotWidget.prototype.handleFollowUpResponse = function(isYes) {
        this.addUserMessage(isYes ? "Ja" : "Nej");
        this.showFollowUp = false;
        
        this.addBotMessage("", true);
        this.renderMessages();

        setTimeout(() => {
            this.updateLastBotMessage(isYes 
                ? "Vad mer kan jag hjälpa dig med?" 
                : "Okej, tack för att du chattat med mig. Ha en bra dag!");
            if (isYes) {
                this.showInitialOptions = true;
            }
            this.renderMessages();
        }, 800);
    };

    ChatbotWidget.prototype.renderMessages = function() {
        this.messageList.innerHTML = this.messages.map((message, index) => `
            <div class="chatbot-message ${message.isBot ? 'bot' : 'user'}">
                ${message.isLoading 
                    ? `<div class="chatbot-loading">
                        <div class="chatbot-loading-dot"></div>
                        <div class="chatbot-loading-dot"></div>
                        <div class="chatbot-loading-dot"></div>
                       </div>`
                    : message.text
                }
            </div>
            ${(this.showInitialOptions && index === this.messages.length - 1 && message.isBot) 
                ? this.renderOptions(['Spåra min order', 'Retur', 'Storleksguide'])
                : ''
            }
            ${(this.showFollowUp && index === this.messages.length - 1 && message.isBot)
                ? this.renderOptions(['Ja', 'Nej'])
                : ''
            }
        `).join('');
        this.messageList.scrollTop = this.messageList.scrollHeight;
    };

    ChatbotWidget.prototype.renderOptions = function(options) {
        return `
            <div class="chatbot-options">
                ${options.map(option => `
                    <button
                        onclick="chatbotWidget.handleOptionClick('${option}')"
                        class="chatbot-option-button">
                        ${option}
                    </button>
                `).join('')}
            </div>
        `;
    };

    window.chatbotWidget = new ChatbotWidget();
})();

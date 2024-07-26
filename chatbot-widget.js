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
            mainColor: '#f7e702',
            secondaryColor: '#FFFFFF',
            logoUrl: 'https://via.placeholder.com/48'
        };
        this.isInitialized = false;
        this.showFollowUp = false;
        this.conversationId = null;
        
        this.init();
    }

    ChatbotWidget.prototype.init = function() {
        this.createWidgetButton();
        this.createChatWindow();
        this.bindEvents();
        this.loadFonts();
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
        this.chatWindow.style.display = 'none';
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
                <button id="chatbot-send">➤</button>
            </div>
        `;
        document.body.appendChild(this.chatWindow);
        
        this.messageList = this.chatWindow.querySelector('#chatbot-messages');
        this.inputField = this.chatWindow.querySelector('#chatbot-input');
    };

    ChatbotWidget.prototype.bindEvents = function() {
        document.getElementById('chatbot-button').onclick = () => this.toggleChatWindow();
        document.getElementById('chatbot-close').onclick = () => this.toggleChatWindow();
        document.getElementById('chatbot-send').onclick = () => this.sendMessage();
        this.inputField.onkeypress = (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        };
    };

    ChatbotWidget.prototype.toggleChatWindow = function() {
        if (this.chatWindow.style.display === 'none') {
            this.chatWindow.style.display = 'flex';
            if (!this.isInitialized) {
                this.initializeChat();
            }
        } else {
            this.chatWindow.style.display = 'none';
        }
    };

    ChatbotWidget.prototype.initializeChat = function() {
        this.addBotMessage("", true);
        setTimeout(() => {
            this.updateLastBotMessage("Hej! 👋");
            setTimeout(() => {
                this.addBotMessage("Mitt namn är Elliot och jag är din virtuella assistent här på Happyflops.");
                setTimeout(() => {
                    this.addBotMessage("Vad kan jag hjälpa dig med idag? 😊");
                    this.showInitialOptions();
                }, 1000);
            }, 1000);
        }, 1000);
        this.isInitialized = true;
    };

    ChatbotWidget.prototype.sendMessage = async function() {
        const message = this.inputField.value.trim();
        if (message) {
            this.addUserMessage(message);
            this.inputField.value = '';
            const loadingMessage = this.addBotMessage("", true);
            
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
                
                if (data && data.answer) {
                    loadingMessage.textContent = data.answer;
                    if (data.product_info) {
                        this.addProductCard(data.product_info);
                    }
                    if (Math.random() < 0.5) {
                        this.showFollowUpQuestion();
                    }
                } else {
                    throw new Error('Invalid response format');
                }
            } catch (error) {
                console.error('Error:', error.message);
                loadingMessage.textContent = 'Tyvärr kunde jag inte ansluta just nu. Vänligen försök igen senare eller kontakta oss via kundservice@happyflops.se';
            }
        }
    };

    ChatbotWidget.prototype.addMessage = function(message, sender, isLoading = false) {
        const messageElement = document.createElement('div');
        messageElement.className = `chatbot-message ${sender}`;
        if (isLoading) {
            messageElement.innerHTML = `
                <div class="chatbot-loading">
                    <div class="chatbot-loading-dot"></div>
                    <div class="chatbot-loading-dot"></div>
                    <div class="chatbot-loading-dot"></div>
                </div>
            `;
        } else {
            messageElement.textContent = message;
        }
        this.messageList.appendChild(messageElement);
        this.messageList.scrollTop = this.messageList.scrollHeight;
        return messageElement;
    };

    ChatbotWidget.prototype.updateLastBotMessage = function(message) {
        const lastMessage = this.messageList.lastElementChild;
        if (lastMessage && lastMessage.classList.contains('bot')) {
            lastMessage.textContent = message;
        }
    };

    ChatbotWidget.prototype.addUserMessage = function(message) {
        this.addMessage(message, 'user');
    };

    ChatbotWidget.prototype.addBotMessage = function(message, isLoading = false) {
        return this.addMessage(message, 'bot', isLoading);
    };

    ChatbotWidget.prototype.handleOptionClick = function(option) {
        this.addUserMessage(option);
        this.sendMessage(option);
    };

    ChatbotWidget.prototype.addProductCard = function(product) {
        const productElement = document.createElement('div');
        productElement.className = 'chatbot-product-card';
        productElement.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}">
            <div class="chatbot-product-info">
                <div class="chatbot-product-name">${product.name}</div>
                <div class="chatbot-product-price">${product.price} kr</div>
                <a href="https://www.happyflops.se/products/${product.handle}" class="chatbot-product-button" target="_blank">Köp nu</a>
            </div>
        `;
        this.messageList.appendChild(productElement);
    };

    ChatbotWidget.prototype.showFollowUpQuestion = function() {
        setTimeout(() => {
            this.addBotMessage("Kan jag hjälpa dig med något mer?");
            const optionsElement = document.createElement('div');
            optionsElement.className = 'chatbot-options';
            optionsElement.innerHTML = `
                <button class="chatbot-option-button">Ja</button>
                <button class="chatbot-option-button">Nej</button>
            `;
            this.messageList.appendChild(optionsElement);

            optionsElement.querySelectorAll('.chatbot-option-button').forEach(button => {
                button.onclick = () => this.handleFollowUpResponse(button.textContent);
            });
        }, 1000);
    };

    ChatbotWidget.prototype.handleFollowUpResponse = function(response) {
        this.addUserMessage(response);
        if (response === 'Ja') {
            this.addBotMessage("Vad mer kan jag hjälpa dig med?");
            this.showInitialOptions();
        } else {
            this.addBotMessage("Okej, tack för att du chattat med mig. Ha en bra dag! 😊");
        }
    };

    // Initialize the widget when the script loads
    window.addEventListener('load', function() {
        new ChatbotWidget();
    });
})();

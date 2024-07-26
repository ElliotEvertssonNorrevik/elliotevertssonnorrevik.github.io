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
            secondaryColor: '#FFFFFF',
            font: 'Roboto',
            launch_avatar: 'https://i.ibb.co/H2tqg2w/Ventajas-1-200-removebg-preview-removebg-preview-removebg-preview.png',
            header_image: 'https://i.ibb.co/gTSR93f/s348hq3b.png',
            banner_image: ''
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
        this.widget.className = 'fixed bottom-5 right-5';
        this.widget.innerHTML = `
            <button class="w-20 h-20 rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition duration-200" style="background-color: ${this.config.mainColor}">
                <img src="${this.config.launch_avatar}" alt="Launch Avatar" class="w-20 h-20 rounded-full" />
            </button>
        `;
        document.body.appendChild(this.widget);
    };

    ChatbotWidget.prototype.createChatWindow = function() {
        this.chatWindow = document.createElement('div');
        this.chatWindow.className = 'fixed bottom-5 right-5 w-[35rem] h-[45rem] bg-white rounded-lg shadow-lg flex flex-col rounded-2xl hidden';
        this.chatWindow.innerHTML = `
            <div class="h-[5rem] p-4 flex justify-between rounded-t-2xl" style="background-color: ${this.config.mainColor}">
                <div class="flex items-center">
                    <img src="${this.config.header_image}" alt="Header" class="w-[3rem] h-[3rem] rounded-full mr-3" />
                    <div>
                        <h1 class="text-xl font-bold text-white">${this.config.headerText}</h1>
                        <p class="text-white">${this.config.subHeaderText}</p>
                    </div>
                </div>
                <button class="text-white" id="chatbot-close">×</button>
            </div>
            <div class="flex-grow overflow-hidden">
                <div class="h-full overflow-y-auto p-4 bg-gray-50" id="chatbot-messages">
                    <div class="sticky bg-gray-50 z-10 pb-4">
                        <div class="flex flex-col items-center mb-16 mt-16 transition-opacity duration-300">
                            <img src="${this.config.header_image}" alt="Chatbot Avatar" class="w-[5rem] h-[5rem] mb-2 rounded-full" />
                            <h1 class="text-xl font-bold text-black">${this.config.headerText}</h1>
                            <p class="text-black">${this.config.subHeaderText}</p>
                        </div>
                    </div>
                </div>
            </div>
            <div class="p-2 bg-gray">
                <div class="flex">
                    <input
                        type="text"
                        id="chatbot-input"
                        class="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="Skriv ett meddelande..."
                    />
                    <button 
                        id="chatbot-send"
                        class="bg-yellow-400 text-white px-4 py-2 rounded-r-lg transition duration-200 hover:bg-yellow-500"
                    >
                        Skicka
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(this.chatWindow);
        
        this.messageList = this.chatWindow.querySelector('#chatbot-messages');
        this.inputField = this.chatWindow.querySelector('#chatbot-input');
    };

    ChatbotWidget.prototype.bindEvents = function() {
        this.widget.querySelector('button').onclick = () => this.toggleChatWindow();
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
                
                if (data.product_info) {
                    this.addProductCard(data.product_info);
                }
                
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

    ChatbotWidget.prototype.addProductCard = function(product) {
        const productElement = `
            <div class="bg-white rounded-lg shadow-md overflow-hidden max-w-xs mb-4 mt-4">
                ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.name}" class="w-[17rem] h-[12rem] object-cover" />` : ''}
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-1">${product.name}</h3>
                    <p class="text-gray-600 text-base font-medium mb-3">${product.price} kr</p>
                    <a 
                        href="https://www.happyflops.se/products/${product.handle}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="block w-full bg-yellow-400 text-white py-2 px-4 rounded-md text-center text-lg font-bold hover:bg-yellow-500 transition duration-200"
                    >
                        Köp nu
                    </a>
                </div>
            </div>
        `;
        this.messageList.insertAdjacentHTML('beforeend', productElement);
    };

    ChatbotWidget.prototype.renderMessages = function() {
        this.messageList.innerHTML = this.messages.map((message, index) => `
            <div class="flex flex-col ${message.isBot ? 'items-start' : 'items-end'} mb-4">
                <div class="max-w-md px-4 py-2 rounded-lg ${message.isBot ? 'bg-yellow-100' : 'bg-white'} shadow">
                    ${message.isLoading 
                        ? `<div class="flex space-x-2">
                            <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                            <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                            <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
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
            </div>
        `).join('');
        this.messageList.scrollTop = this.messageList.scrollHeight;
    };

    ChatbotWidget.prototype.renderOptions = function(options) {
        return `
            <div class="flex flex-wrap space-x-2 mt-2">
                ${options.map(option => `
                    <button
                        onclick="chatbotWidget.handleOptionClick('${option}')"
                        class="w-auto h-10 text-black px-4 py-2 rounded-2xl hover:bg-yellow-200 transition duration-200 border border-yellow-500 mb-2"
                        style="background-color: #FCFBE8; border-color: #D9CC3C;">
                        ${option}
                    </button>
                `).join('')}
            </div>
        `;
    };

    window.chatbotWidget = new ChatbotWidget();
})();

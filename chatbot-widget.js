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
            logoUrl: 'https://via.placeholder.com/40'
        };
        
        this.init();
    }

    ChatbotWidget.prototype.init = function() {
        this.createWidgetButton();
        this.createChatWindow();
        this.bindEvents();
    };

    ChatbotWidget.prototype.createWidgetButton = function() {
        this.widget = document.createElement('div');
        this.widget.innerHTML = `<img src="${this.config.logoUrl}" alt="Chat" class="w-16 h-16 rounded-full">`;
        this.widget.className = 'fixed bottom-5 right-5 w-16 h-16 rounded-full flex items-center justify-center shadow-lg hover:opacity-90 transition duration-200 cursor-pointer';
        this.widget.style.backgroundColor = this.config.mainColor;
        document.body.appendChild(this.widget);
    };

    ChatbotWidget.prototype.createChatWindow = function() {
        this.chatWindow = document.createElement('div');
        this.chatWindow.className = 'fixed bottom-5 right-5 w-96 h-[36rem] bg-white rounded-lg shadow-lg flex flex-col rounded-2xl hidden';
        this.chatWindow.innerHTML = `
            <div class="h-16 p-4 flex justify-between rounded-t-2xl" style="background-color: ${this.config.mainColor};">
                <div class="flex items-center">
                    <img src="${this.config.logoUrl}" alt="Logo" class="w-8 h-8 rounded-full mr-3">
                    <div>
                        <h1 class="text-lg font-bold text-white">${this.config.headerText}</h1>
                        <p class="text-sm text-white">${this.config.subHeaderText}</p>
                    </div>
                </div>
                <button class="text-white text-xl font-bold" id="close-chat">×</button>
            </div>
            <div class="flex-grow overflow-hidden">
                <div class="h-full overflow-y-auto p-4 bg-gray-50" id="chat-messages"></div>
            </div>
            <div class="p-2 bg-gray-100">
                <div class="flex">
                    <input type="text" id="chat-input" class="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400" placeholder="Skriv ett meddelande...">
                    <button id="send-message" class="bg-yellow-400 text-white px-4 py-2 rounded-r-lg transition duration-200 hover:bg-yellow-500">Skicka</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.chatWindow);
        
        this.messageList = this.chatWindow.querySelector('#chat-messages');
        this.inputField = this.chatWindow.querySelector('#chat-input');
    };

    ChatbotWidget.prototype.bindEvents = function() {
        this.widget.onclick = () => this.toggleChatWindow();
        this.chatWindow.querySelector('#close-chat').onclick = () => this.toggleChatWindow();
        this.chatWindow.querySelector('#send-message').onclick = () => this.sendMessage();
        this.inputField.onkeypress = (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        };
    };

    ChatbotWidget.prototype.toggleChatWindow = function() {
        this.chatWindow.classList.toggle('hidden');
        if (!this.chatWindow.classList.contains('hidden') && this.messageList.children.length === 0) {
            this.addBotMessage("Hej! Mitt namn är Elliot och jag är din virtuella assistent här på Happyflops.");
            setTimeout(() => {
                this.addBotMessage("Vad kan jag hjälpa dig med idag?😊");
                this.showInitialOptions();
            }, 1000);
        }
    };

    ChatbotWidget.prototype.sendMessage = function() {
        const message = this.inputField.value.trim();
        if (message) {
            this.addUserMessage(message);
            this.inputField.value = '';
            this.getBotResponse(message);
        }
    };

    ChatbotWidget.prototype.addMessage = function(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-4`;
        messageElement.innerHTML = `
            <div class="max-w-md px-4 py-2 rounded-lg ${sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}">
                ${message}
            </div>
        `;
        this.messageList.appendChild(messageElement);
        this.messageList.scrollTop = this.messageList.scrollHeight;
    };

    ChatbotWidget.prototype.addUserMessage = function(message) {
        this.addMessage(message, 'user');
    };

    ChatbotWidget.prototype.addBotMessage = function(message) {
        this.addMessage(message, 'bot');
    };

    ChatbotWidget.prototype.showInitialOptions = function() {
        const optionsElement = document.createElement('div');
        optionsElement.className = 'flex flex-wrap justify-start space-x-2 mt-2';
        optionsElement.innerHTML = `
            <button class="option-button">Spåra min order</button>
            <button class="option-button">Retur</button>
            <button class="option-button">Storleksguide</button>
        `;
        this.messageList.appendChild(optionsElement);

        optionsElement.querySelectorAll('.option-button').forEach(button => {
            button.onclick = () => this.handleOptionClick(button.textContent);
        });
    };

    ChatbotWidget.prototype.handleOptionClick = function(option) {
        this.addUserMessage(option);
        this.getBotResponse(option);
    };

    ChatbotWidget.prototype.getBotResponse = function(message) {
        fetch(`${this.apiEndpoint}?question=${encodeURIComponent(message)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.answer) {
                    this.addBotMessage(data.answer);
                } else {
                    throw new Error('Invalid response format');
                }
            })
            .catch(error => {
                console.error('Error:', error.message);
                this.addBotMessage('Sorry, I encountered an error. Please try again later.');
            });
    };

    // Initialize the widget when the script loads
    window.addEventListener('load', function() {
        new ChatbotWidget();
    });
})();

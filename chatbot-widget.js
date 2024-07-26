// chatbot-widget.js
(function() {
    function ChatbotWidget() {
        this.widget = null;
        this.chatWindow = null;
        this.messageList = null;
        this.inputField = null;
        
        this.init();
    }

    ChatbotWidget.prototype.init = function() {
        console.log('Initializing ChatbotWidget');
        this.createWidgetButton();
        this.createChatWindow();
        this.bindEvents();
    };

    ChatbotWidget.prototype.createWidgetButton = function() {
        this.widget = document.createElement('div');
        this.widget.innerHTML = 'Chat';
        this.widget.id = 'chatbot-widget';
        document.body.appendChild(this.widget);
    };

    ChatbotWidget.prototype.createChatWindow = function() {
        this.chatWindow = document.createElement('div');
        this.chatWindow.id = 'chatbot-window';
        this.chatWindow.style.display = 'none';
        
        this.messageList = document.createElement('div');
        this.messageList.id = 'chatbot-messages';
        
        this.inputField = document.createElement('input');
        this.inputField.type = 'text';
        this.inputField.placeholder = 'Type your message...';
        
        const sendButton = document.createElement('button');
        sendButton.innerText = 'Send';
        sendButton.onclick = () => this.sendMessage();
        
        this.chatWindow.appendChild(this.messageList);
        this.chatWindow.appendChild(this.inputField);
        this.chatWindow.appendChild(sendButton);
        
        document.body.appendChild(this.chatWindow);
    };

    ChatbotWidget.prototype.bindEvents = function() {
        this.widget.onclick = () => this.toggleChatWindow();
        this.inputField.onkeypress = (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        };
    };

    ChatbotWidget.prototype.toggleChatWindow = function() {
        this.chatWindow.style.display = this.chatWindow.style.display === 'none' ? 'block' : 'none';
    };

    ChatbotWidget.prototype.sendMessage = function() {
        const message = this.inputField.value.trim();
        if (message) {
            console.log('Sending message:', message);
            this.addMessage(message, 'user');
            this.inputField.value = '';
            this.getBotResponse(message);
        }
    };

    ChatbotWidget.prototype.addMessage = function(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `chatbot-message ${sender}`;
        messageElement.innerText = message;
        this.messageList.appendChild(messageElement);
        this.messageList.scrollTop = this.messageList.scrollHeight;
    };

    ChatbotWidget.prototype.getBotResponse = function(message) {
        const url = `https://rosterai-fresh-function.azurewebsites.net/api/HttpTrigger?question=${encodeURIComponent(message)}`;
        
        console.log('Sending request to:', url);
        
        fetch(url)
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Received data:', data);
                if (data && data.answer) {
                    this.addMessage(data.answer, 'bot');
                } else {
                    throw new Error('Invalid response format');
                }
            })
            .catch(error => {
                console.error('Error:', error.message);
                this.addMessage('Sorry, I encountered an error. Please try again later.', 'bot');
            });
    };

    window.ChatbotWidget = new ChatbotWidget();
})();

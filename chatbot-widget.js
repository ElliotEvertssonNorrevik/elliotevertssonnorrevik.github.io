// simple-chatbot-widget.js
(function() {
    function SimpleChatbotWidget() {
        this.widget = null;
        this.chatWindow = null;
        this.messageList = null;
        this.inputField = null;
        
        this.init();
    }

    SimpleChatbotWidget.prototype.init = function() {
        this.createWidgetButton();
        this.createChatWindow();
        this.bindEvents();
    };

    SimpleChatbotWidget.prototype.createWidgetButton = function() {
        this.widget = document.createElement('div');
        this.widget.innerHTML = 'Chat';
        this.widget.id = 'simple-chatbot-widget';
        document.body.appendChild(this.widget);
    };

    SimpleChatbotWidget.prototype.createChatWindow = function() {
        this.chatWindow = document.createElement('div');
        this.chatWindow.id = 'simple-chatbot-window';
        this.chatWindow.style.display = 'none';
        
        this.messageList = document.createElement('div');
        this.messageList.id = 'simple-chatbot-messages';
        
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

    SimpleChatbotWidget.prototype.bindEvents = function() {
        this.widget.onclick = () => this.toggleChatWindow();
        this.inputField.onkeypress = (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        };
    };

    SimpleChatbotWidget.prototype.toggleChatWindow = function() {
        this.chatWindow.style.display = this.chatWindow.style.display === 'none' ? 'block' : 'none';
    };

    SimpleChatbotWidget.prototype.sendMessage = function() {
        const message = this.inputField.value.trim();
        if (message) {
            this.addMessage(message, 'user');
            this.inputField.value = '';
            this.getBotResponse(message);
        }
    };

    SimpleChatbotWidget.prototype.getBotResponse = function(message) {
    const url = `https://rosterai-fresh-function.azurewebsites.net/api/HttpTrigger?question=${encodeURIComponent(message)}`;
    
    console.log('Sending request to:', url);
    
    fetch(url)
        .then(response => {
            console.log('Response status:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('Received data:', data);
            this.addMessage(data.answer, 'bot');
        })
        .catch(error => {
            console.error('Error:', error);
            this.addMessage('Sorry, I encountered an error. Please try again later.', 'bot');
        });
};

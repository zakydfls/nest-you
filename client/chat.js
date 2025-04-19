class ChatApp {
  constructor() {
    this.socket = null;
    this.currentConversationId = null;
    this.userId = null;
    this.typingTimeout = null;

    // DOM elements
    this.loginForm = document.getElementById('loginForm');
    this.chatContainer = document.getElementById('chatContainer');
    this.tokenInput = document.getElementById('tokenInput');
    this.loginButton = document.getElementById('loginButton');
    this.messageInput = document.getElementById('messageInput');
    this.sendButton = document.getElementById('sendButton');
    this.messagesContainer = document.getElementById('messagesContainer');
    this.conversationsList = document.getElementById('conversationsList');
    this.typingIndicator = document.getElementById('typingIndicator');

    this.setupLoginHandler();
  }

  setupLoginHandler() {
    this.loginButton.addEventListener('click', () => {
      const token = this.tokenInput.value.trim();
      if (token) {
        this.init(token);
      } else {
        alert('Please enter a token');
      }
    });
  }

  init(token) {
    this.socket = io('http://localhost:3000', {
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      alert('Failed to connect: Invalid token');
    });

    this.setupEventListeners();
  }
  // Add this method to your ChatApp class
  handleMessagesRead(data) {
    if (data.conversationId === this.currentConversationId) {
      // Update UI to show messages are read
      const messages = this.messagesContainer.querySelectorAll('.message.sent');
      messages.forEach((message) => {
        message.classList.add('read');
      });
    }
  }

  setupEventListeners() {
    this.socket.on('connectionSuccess', (data) => {
      this.userId = data.userId;
      document.getElementById('userId').textContent = `User ID: ${this.userId}`;
      this.loginForm.style.display = 'none';
      this.chatContainer.style.display = 'flex';
      this.loadConversations();
    });

    this.socket.on('newMessage', (data) => {
      if (data.message.sender !== this.userId) {
        this.handleNewMessage(data);
      }
    });

    this.socket.on('messageSent', (data) => {
      if (data.message.sender === this.userId) {
        this.handleMessageSent(data);
      }
    });

    this.socket.on('userTyping', (data) => this.handleUserTyping(data));
    this.socket.on('userStopTyping', (data) => this.handleUserStopTyping(data));
    this.socket.on('messagesRead', (data) => this.handleMessagesRead(data));
    this.socket.on('userOnline', (userId) => this.handleUserOnline(userId));
    this.socket.on('userOffline', (userId) => this.handleUserOffline(userId));

    this.messageInput.addEventListener('input', () => this.handleTyping());
    this.messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });
    this.sendButton.addEventListener('click', () => this.sendMessage());
  }

  async loadConversations(page = 1, limit = 20) {
    this.socket.emit('getConversations', { page, limit }, (response) => {
      if (response.error) {
        console.error('Error loading conversations:', response.error);
        return;
      }

      this.renderConversations(response.conversations);
    });
  }

  renderConversations(conversations) {
    this.conversationsList.innerHTML = '';
    conversations.forEach((conv) => {
      const div = document.createElement('div');
      div.className = 'conversation-item';
      if (conv._id === this.currentConversationId) div.classList.add('active');

      const onlineStatus = conv.isOnline ? 'online' : 'offline';
      div.innerHTML = `
                <span class="online-indicator ${onlineStatus}"></span>
                <span>${conv.participants.find((p) => p !== this.userId)}</span>
                ${conv.unreadCount ? `<span class="unread-count">${conv.unreadCount}</span>` : ''}
                <p class="last-message">${conv.lastMessage || 'No messages yet'}</p>
            `;

      div.addEventListener('click', () => this.selectConversation(conv._id));
      this.conversationsList.appendChild(div);
    });
  }

  async selectConversation(conversationId) {
    this.currentConversationId = conversationId;
    this.messageInput.disabled = false;
    this.sendButton.disabled = false;

    // Mark messages as read
    this.socket.emit('markAsRead', conversationId);

    // Load messages
    this.socket.emit('getMessages', { conversationId }, (response) => {
      if (response.error) {
        console.error('Error loading messages:', response.error);
        return;
      }
      this.renderMessages(response);
    });
  }

  renderMessages(messages) {
    this.messagesContainer.innerHTML = '';
    messages.forEach((msg) => {
      const div = document.createElement('div');
      div.className = `message ${msg.sender === this.userId ? 'sent' : 'received'}`;
      div.textContent = msg.content;
      this.messagesContainer.appendChild(div);
    });
    this.scrollToBottom();
  }

  sendMessage() {
    const content = this.messageInput.value.trim();
    if (!content || !this.currentConversationId) return;

    this.socket.emit('sendMessage', {
      conversationId: this.currentConversationId,
      content,
      messageType: 'text',
    });

    this.messageInput.value = '';
  }

  handleTyping() {
    if (!this.currentConversationId) return;

    this.socket.emit('typing', { conversationId: this.currentConversationId });

    if (this.typingTimeout) clearTimeout(this.typingTimeout);
    this.typingTimeout = setTimeout(() => {
      this.socket.emit('stopTyping', {
        conversationId: this.currentConversationId,
      });
    }, 3000);
  }

  handleUserTyping(data) {
    if (data.conversationId === this.currentConversationId) {
      this.typingIndicator.textContent = 'User is typing...';
    }
  }

  handleUserStopTyping(data) {
    if (data.conversationId === this.currentConversationId) {
      this.typingIndicator.textContent = '';
    }
  }

  handleNewMessage(data) {
    if (data.conversationId === this.currentConversationId) {
      this.addMessageToDisplay(data.message);
    }
    this.loadConversations(); // Refresh conversation list
  }

  handleMessageSent(data) {
    if (data.conversationId === this.currentConversationId) {
      this.addMessageToDisplay(data.message);
    }
  }

  addMessageToDisplay(message) {
    const div = document.createElement('div');
    div.className = `message ${message.sender === this.userId ? 'sent' : 'received'}`;
    div.textContent = message.content;
    this.messagesContainer.appendChild(div);
    this.scrollToBottom();
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  handleUserOnline(userId) {
    const conversationItems = document.querySelectorAll('.conversation-item');
    conversationItems.forEach((item) => {
      if (item.dataset.userId === userId) {
        item.querySelector('.online-indicator').classList.add('online');
      }
    });
  }

  handleUserOffline(userId) {
    const conversationItems = document.querySelectorAll('.conversation-item');
    conversationItems.forEach((item) => {
      if (item.dataset.userId === userId) {
        item.querySelector('.online-indicator').classList.remove('online');
      }
    });
  }
}

// Initialize the chat application
document.addEventListener('DOMContentLoaded', () => {
  new ChatApp();
});

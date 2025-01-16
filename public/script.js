document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const personalityToggle = document.getElementById('personalityToggle');
    const clearButton = document.getElementById('clearButton');
    const generatingIndicator = document.getElementById('generating-indicator');
    
    let isAngryMode = false;

    // Personality toggle handler
    personalityToggle.addEventListener('change', (e) => {
        isAngryMode = e.target.checked;
        console.log('Personality mode changed:', isAngryMode ? 'Angry' : 'Nice');
    });

    // Clear chat history
    clearButton.addEventListener('click', () => {
        chatContainer.innerHTML = '';
        addMessageToChat('bot', 'Chat history cleared. How can I help you?');
    });

    // Function to copy message text
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show temporary success message
            const notification = document.createElement('div');
            notification.textContent = 'Copied to clipboard!';
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: var(--terminal-text);
                color: var(--terminal-bg);
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 1000;
                animation: fadeIn 0.3s ease-in;
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'fadeIn 0.3s ease-in reverse';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text:', err);
        });
    }

    // Function to format special content
    function formatMessage(message) {
        // Check if message contains code blocks or ASCII art
        if (message.includes('```') || /[│├──└┘┐┌]/.test(message)) {
            return `<div class="code-block">${message}</div>`;
        }
        return message;
    }

    // Function to add messages to chat
    function addMessageToChat(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message text-wrap`;
        
        const textContent = document.createElement('pre');
        textContent.className = 'text-wrap';
        textContent.innerHTML = formatMessage(message);
        messageDiv.appendChild(textContent);

        // Add copy button for bot messages
        if (sender === 'bot') {
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-button';
            copyButton.innerHTML = '<i class="fas fa-copy"></i>';
            copyButton.addEventListener('click', () => copyToClipboard(message));
            messageDiv.appendChild(copyButton);
        }
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Add typing effect for bot messages
        if (sender === 'bot') {
            addTypingEffect(textContent);
        }
    }

    // Typing effect function
    function addTypingEffect(element) {
        const text = element.textContent;
        element.textContent = '';
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                chatContainer.scrollTop = chatContainer.scrollHeight;
            } else {
                clearInterval(interval);
            }
        }, 20);
    }

    // Main send message function
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Disable input and button while generating
        userInput.disabled = true;
        sendButton.disabled = true;

        // Add user message to chat
        addMessageToChat('user', message);
        userInput.value = '';

        // Show generating indicator
        generatingIndicator.classList.remove('hidden');

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    isAngryMode: isAngryMode
                })
            });

            const data = await response.json();
            
            // Hide generating indicator
            generatingIndicator.classList.add('hidden');

            if (data.error) {
                throw new Error(data.error);
            }

            addMessageToChat('bot', data.response);
        } catch (error) {
            console.error('Error:', error);
            generatingIndicator.classList.add('hidden');
            addMessageToChat('bot', 'Error processing your request. Please try again.');
        } finally {
            // Re-enable input and button
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus();
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Focus input on page load
    userInput.focus();

    // Initial greeting
    addMessageToChat('bot', 'Hello! I\'m your dual-personality chatbot. Toggle the switch to change between nice and angry mode!');
});

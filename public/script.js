// public/script.js
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
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.left = '50%';
            notification.style.transform = 'translateX(-50%)';
            notification.style.backgroundColor = 'var(--terminal-text)';
            notification.style.color = 'var(--terminal-bg)';
            notification.style.padding = '10px 20px';
            notification.style.borderRadius = '5px';
            notification.style.zIndex = '1000';
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 2000);
        });
    }

    // Function to add messages to chat
    function addMessageToChat(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        const textContent = document.createElement('pre');
        textContent.textContent = message;
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
    }

    // Main send message function
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

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
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Initial greeting
    addMessageToChat('bot', 'Hello! I\'m your dual-personality chatbot. Toggle the switch to change between nice and angry mode!');
});

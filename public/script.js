// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const personalityToggle = document.getElementById('personalityToggle');
    
    let isAngryMode = false;

    // Personality toggle handler
    personalityToggle.addEventListener('change', (e) => {
        isAngryMode = e.target.checked;
        console.log('Personality mode changed:', isAngryMode ? 'Angry' : 'Nice');
    });

    // Function to add messages to chat
    function addMessageToChat(sender, message) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        
        // Create a pre element for maintaining formatting
        const preElement = document.createElement('pre');
        preElement.textContent = message;
        messageDiv.appendChild(preElement);
        
        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        
        // Add typing effect for bot messages
        if (sender === 'bot') {
            addTypingEffect(preElement);
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
            } else {
                clearInterval(interval);
            }
        }, 20);
    }

    // Main send message function
    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        // Add user message to chat
        addMessageToChat('user', message);
        userInput.value = '';

        try {
            // Show loading message
            const loadingId = 'loading-' + Date.now();
            addMessageToChat('bot', 'Processing...');

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
            
            // Remove loading message
            const loadingMessage = chatContainer.lastElementChild;
            chatContainer.removeChild(loadingMessage);

            if (data.error) {
                throw new Error(data.error);
            }

            addMessageToChat('bot', data.response);
        } catch (error) {
            console.error('Error:', error);
            addMessageToChat('bot', 'Error processing your request. Please try again.');
        }
    }

    // Event listeners
    sendButton.addEventListener('click', () => {
        console.log('Send button clicked');
        sendMessage();
    });

    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter key pressed');
            sendMessage();
        }
    });

    // Initial greeting
    addMessageToChat('bot', 'Hello! I\'m your dual-personality chatbot. Toggle the switch to change between nice and angry mode!');
});

document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const personalityToggle = document.getElementById('personalityToggle');
    const clearButton = document.getElementById('clearButton');
    const generatingIndicator = document.getElementById('generating-indicator');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const saveHistoryButton = document.getElementById('saveHistoryButton');
    const tweetButton = document.getElementById('tweetButton');

    let isAngryMode = false;
    let chatHistory = [];
    let isDarkMode = true;

    // Load saved preferences and history
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode === 'false') {
        toggleDarkMode();
    }

    const savedHistory = localStorage.getItem('chatHistory');
    if (savedHistory) {
        chatHistory = JSON.parse(savedHistory);
        chatHistory.forEach(item => {
            addMessageToChat(item.sender, item.message, false, true); // Indicate it's a restored message
        });
    }

    function toggleDarkMode() {
        isDarkMode = !isDarkMode;
        document.body.classList.toggle('light-mode');
        document.querySelector('.terminal').classList.toggle('light-mode');
        localStorage.setItem('darkMode', isDarkMode);
    }

    function saveHistory() {
        const historyStr = JSON.stringify(chatHistory);
        const blob = new Blob([historyStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chat-history.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('Chat history saved!');
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    function shareOnTwitter() {
        const lastMessage = chatHistory[chatHistory.length - 1];
        if (lastMessage) {
            const tweetText = encodeURIComponent(`Check out this conversation with the Dual Personality Bot:\n\n"${lastMessage.message.substring(0, 180)}..."`);
            window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
        }
    }

    // Function to copy message text
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!');
        }).catch(err => {
            console.error('Error copying to clipboard:', err);
            showToast('Failed to copy to clipboard.');
        });
    }

    // Function to add message to chat container with typing effect
    function addMessageToChat(sender, message, isNew = true, isRestored = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(`${sender}-message`);

        const pre = document.createElement('pre');
        messageDiv.appendChild(pre);

        const copyButton = document.createElement('button');
        copyButton.classList.add('copy-button');
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.addEventListener('click', () => copyToClipboard(message));
        messageDiv.appendChild(copyButton);

        chatContainer.appendChild(messageDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight; // Scroll to bottom

        if (isNew && !isRestored) {
            let index = 0;
            const typingInterval = setInterval(() => {
                if (index < message.length) {
                    pre.textContent += message.charAt(index);
                    index++;
                    chatContainer.scrollTop = chatContainer.scrollHeight; // Keep scrolling
                } else {
                    clearInterval(typingInterval);
                }
            }, 20); // Adjust the typing speed (milliseconds per character)
        } else {
            pre.textContent = message; // Directly set text for restored messages
        }

        if (isNew) {
            chatHistory.push({ sender, message, timestamp: new Date().toISOString() });
            localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
        }
    }

    // Function to send message to the server
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message) {
            addMessageToChat('user', message);
            userInput.value = '';
            generatingIndicator.classList.remove('hidden');

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message, isAngryMode })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to send message');
                }

                const data = await response.json();
                addMessageToChat('bot', data.response);
            } catch (error) {
                console.error('Error sending message:', error);
                addMessageToChat('bot', `Error: ${error.message}`);
            } finally {
                generatingIndicator.classList.add('hidden');
            }
        }
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    // Personality toggle handler
    personalityToggle.addEventListener('change', (e) => {
        isAngryMode = e.target.checked;
        console.log('Personality mode changed:', isAngryMode ? 'Angry' : 'Nice');
    });

    // Clear chat history
    clearButton.addEventListener('click', () => {
        chatContainer.innerHTML = '';
        chatHistory = [];
        localStorage.removeItem('chatHistory');
        addMessageToChat('bot', 'Chat history cleared. How can I help you?');
    });

    darkModeToggle.addEventListener('click', toggleDarkMode);
    saveHistoryButton.addEventListener('click', saveHistory);
    tweetButton.addEventListener('click', shareOnTwitter);
});
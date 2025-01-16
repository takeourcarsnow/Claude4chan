// public/script.js
// Replace the sendMessage function with this:

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addMessageToChat('user', message);
    userInput.value = '';

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
        
        if (data.error) {
            throw new Error(data.error);
        }

        addMessageToChat('bot', data.response);
    } catch (error) {
        console.error('Error:', error);
        addMessageToChat('bot', 'Error processing your request.');
    }
}
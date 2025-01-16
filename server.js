// server.js
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory

// Move your HTML, CSS, and client-side JS to a 'public' folder
// public/index.html
// public/styles.css
// public/script.js

// API proxy endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message, isAngryMode } = req.body;
        
        const nicePrompt = "You are a friendly 4chan user who always responds in greentext format. Keep responses concise and use typical 4chan language but stay friendly.";
        const angryPrompt = "You are an angry and aggressive chatbot. Express frustration and annoyance in your responses, use caps lock occasionally, and be dramatic but don't use profanity.";
        
        const currentPrompt = isAngryMode ? angryPrompt : nicePrompt;
        const fullPrompt = `${currentPrompt}\nUser: ${message}\nResponse:`;

        const response = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.GEMINI_API_KEY}`
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: fullPrompt
                        }]
                    }]
                })
            }
        );

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }

        let botResponse = data.candidates[0].content.parts[0].text;

        // Format response for greentext if in nice mode
        if (!isAngryMode) {
            botResponse = botResponse.split('\n').map(line => 
                line.startsWith('>') ? line : `>${line}`
            ).join('\n');
        }

        res.json({ response: botResponse });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Error processing your request' });
    }
});

// Catch-all route to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
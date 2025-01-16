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
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        // ... rest of your existing code ...

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
        
        if (!response.ok) {
            throw new Error(data.error?.message || 'API request failed');
        }

        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response format from API');
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
        console.error('Server Error:', error);
        res.status(500).json({ 
            error: 'Error processing your request',
            details: error.message 
        });
    }
});

// Catch-all route to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

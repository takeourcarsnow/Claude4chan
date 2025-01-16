const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Main API endpoint for chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message, isAngryMode } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            throw new Error('Gemini API key is not configured');
        }

        console.log('Received chat request:', {
            message,
            isAngryMode,
            timestamp: new Date().toISOString()
        });

        // Define prompts
        const nicePrompt = "You are a friendly 4chan user who always responds in greentext format. Keep responses concise and use typical 4chan language but stay friendly.";
        const angryPrompt = "You are an angry and aggressive chatbot. Express frustration and annoyance in your responses, use caps lock occasionally, and be dramatic but don't use profanity.";
        
        // Select prompt based on mode
        const currentPrompt = isAngryMode ? angryPrompt : nicePrompt;
        const fullPrompt = `${currentPrompt}\nUser: ${message}\nResponse:`;

        // Prepare the request body with safety filters disabled
        const requestBody = {
            contents: [{
                parts: [{
                    text: fullPrompt
                }]
            }],
            safetySettings: [
                {
                    category: "HARM_CATEGORY_HARASSMENT",
                    threshold: "BLOCK_NONE"
                },
                {
                    category: "HARM_CATEGORY_HATE_SPEECH",
                    threshold: "BLOCK_NONE"
                },
                {
                    category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    threshold: "BLOCK_NONE"
                },
                {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_NONE"
                }
            ],
            generationConfig: {
                temperature: 0.9,
                topK: 40,
                topP: 0.8,
                maxOutputTokens: 1024,
            }
        };

        console.log('Making request to Gemini API...');
        
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            }
        );

        const data = await response.json();
        
        // Check for API errors
        if (!response.ok) {
            console.error('Gemini API error:', data);
            throw new Error(data.error?.message || 'API request failed');
        }

        // Validate response format
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            console.error('Invalid API response format:', data);
            throw new Error('Invalid response format from API');
        }

        let botResponse = data.candidates[0].content.parts[0].text;

        // Format response for greentext if in nice mode
        if (!isAngryMode) {
            botResponse = botResponse.split('\n').map(line => 
                line.startsWith('>') ? line : `>${line}`
            ).join('\n');
        }

        console.log('Sending response to client:', botResponse);

        res.json({ response: botResponse });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ 
            error: 'Error processing your request',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        apiKey: process.env.GEMINI_API_KEY ? 'configured' : 'missing'
    });
});

// API key check endpoint
app.get('/api/check', (req, res) => {
    if (process.env.GEMINI_API_KEY) {
        res.json({ status: 'API key is configured' });
    } else {
        res.status(500).json({ status: 'API key is missing' });
    }
});

// Catch-all route to serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`API Key configured: ${Boolean(process.env.GEMINI_API_KEY)}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

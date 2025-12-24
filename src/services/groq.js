const Groq = require('groq-sdk');
const config = require('../config');
const { log } = require('../utils/logger');

class GroqService {
    constructor() {
        this.client = new Groq({ apiKey: config.apiKey });
    }

    async generate(prompt, options = {}) {
        try {
            const chatCompletion = await this.client.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: options.model || "llama3-8b-8192",
                temperature: options.temperature || 0.8,
                max_tokens: options.max_tokens || 1500,
                top_p: options.top_p || 0.9,
                stream: false,
                stop: null
            });

            return chatCompletion.choices[0]?.message?.content?.trim() || "";
        } catch (error) {
            log('ERROR', 'Groq API Error', { error: error.message });
            throw error;
        }
    }
}

module.exports = new GroqService();

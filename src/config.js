require('dotenv').config();

const config = {
    botToken: process.env.BOT_TOKEN,
    apiKey: process.env.GROQ_API_KEY,
    channelId: process.env.CHANNEL_ID,
    adminId: process.env.ADMIN_ID,
    adminUsername: process.env.ADMIN_USERNAME,
    port: process.env.PORT || 3000
};

// Validation
if (!config.botToken || !config.apiKey || !config.channelId) {
    console.error('❌ Error: Missing required environment variables (BOT_TOKEN, GROQ_API_KEY, CHANNEL_ID)');
    // We don't exit here to allow for testing, but in prod it should exit.
    // process.exit(1); 
}

module.exports = config;

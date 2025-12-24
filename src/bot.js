const { Telegraf } = require('telegraf');
const config = require('./config');
const { log } = require('./utils/logger');

const bot = new Telegraf(config.botToken);

// Middleware to log requests
bot.use(async (ctx, next) => {
    if (ctx.from) {
        log('INFO', `Update from ${ctx.from.username || ctx.from.id}`);
    }
    await next();
});

// Admin check middleware
const checkAdmin = async (ctx, next) => {
    if (!ctx.from) return;

    const userId = ctx.from.id.toString();
    const username = ctx.from.username;

    const isAdminId = config.adminId && userId === config.adminId.toString();
    const isAdminUsername = config.adminUsername && username &&
        username.toLowerCase() === config.adminUsername.toLowerCase().replace('@', '');

    if ((!config.adminId && !config.adminUsername) || isAdminId || isAdminUsername) {
        return next();
    }

    log('WARN', `Unauthorized access attempt from: ${username || userId}`);
    return ctx.reply('🔒 Sorry, this bot is for admins only.');
};

bot.use(checkAdmin);

module.exports = bot;

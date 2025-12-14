require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const Groq = require('groq-sdk');

// ============ إعدادات البيئة ============
const botToken = process.env.BOT_TOKEN;
const apiKey = process.env.GROQ_API_KEY;
const channelId = process.env.CHANNEL_ID;
const adminId = process.env.ADMIN_ID;
const adminUsername = process.env.ADMIN_USERNAME;

// ============ خادم Web لإبقاء البوت نشطاً (Keep-Alive) ============
const http = require('http');
const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Bot is working! 🤖\n');
});

server.listen(port, () => {
    console.log(`🌍 Keep-alive server running on port ${port}`);
});

// ============ التحقق من المتطلبات ============
if (!botToken || !apiKey || !channelId) {
    console.error('❌ خطأ: يرجى التأكد من ملء جميع البيانات في ملف .env');
    process.exit(1);
}

const bot = new Telegraf(botToken);
const groq = new Groq({ apiKey: apiKey });

// ============ إحصائيات البوت ============
const stats = {
    startTime: new Date(),
    postsGenerated: 0,
    errors: 0,
    lastPost: null
};

// ============ نظام Rate Limiting ============
const userLastRequest = new Map();
const RATE_LIMIT_MS = 10000; // 10 ثواني بين كل طلب

// ============ دالة التسجيل المحسّنة ============
function log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;

    if (level === 'ERROR') {
        console.error(logMessage, data);
    } else {
        console.log(logMessage, data);
    }
}

// ============ Middleware للتحقق من الصلاحيات ============
bot.use(async (ctx, next) => {
    // تجاهل التحديثات التي ليست من مستخدمين (مثل تحديثات القنوات)
    if (!ctx.from) {
        return;
    }

    const userId = ctx.from?.id?.toString();
    const username = ctx.from?.username;

    const isIdMatch = adminId && userId === adminId.toString();
    const isUsernameMatch = adminUsername && username && username.toLowerCase() === adminUsername.toLowerCase().replace('@', '');

    if ((!adminId && !adminUsername) || isIdMatch || isUsernameMatch) {
        log('INFO', `Request from authorized user: ${username || userId}`);
        return next();
    }

    log('WARN', `Unauthorized access attempt from: ${username || userId}`);
    return ctx.reply('🔒 عذراً، هذا البوت خاص بمدير القناة فقط.');
});

// ============ Middleware للـ Rate Limiting ============
bot.use(async (ctx, next) => {
    if (!ctx.from) return;

    const userId = ctx.from.id;
    const now = Date.now();
    const lastRequest = userLastRequest.get(userId);

    if (lastRequest && (now - lastRequest) < RATE_LIMIT_MS) {
        const waitTime = Math.ceil((RATE_LIMIT_MS - (now - lastRequest)) / 1000);
        return ctx.reply(`⏱️ الرجاء الانتظار ${waitTime} ثانية قبل إرسال طلب جديد.`);
    }

    userLastRequest.set(userId, now);
    return next();
});

// ============ أمر البداية ============
bot.start((ctx) => {
    log('INFO', 'Start command received');
    ctx.reply(
        '👋 *مرحباً بك!*\n\n' +
        'أنا مساعدك الذكي لإدارة القناة 🤖\n\n' +
        '📝 *كيفية الاستخدام:*\n' +
        'فقط أرسل لي عبارة مثل:\n' +
        '• "تحدث عن الذكاء الاصطناعي"\n' +
        '• "اكتب عن فوائد الرياضة"\n' +
        '• "موضوع عن البرمجة"\n\n' +
        '🎯 *الأوامر المتاحة:*\n' +
        '/help - عرض المساعدة\n' +
        '/status - حالة البوت\n' +
        '/stats - الإحصائيات\n\n' +
        'سأقوم بإنشاء منشور احترافي وإرساله لقناتك فوراً! 🚀',
        { parse_mode: 'Markdown' }
    );
});

// ============ أمر المساعدة ============
bot.command('help', (ctx) => {
    log('INFO', 'Help command received');
    ctx.reply(
        '📚 *دليل الاستخدام*\n\n' +
        '*الأوامر المتاحة:*\n' +
        '• /start - بدء البوت\n' +
        '• /help - عرض هذه المساعدة\n' +
        '• /status - حالة البوت والاتصال\n' +
        '• /stats - إحصائيات الاستخدام\n\n' +
        '*كيفية إنشاء منشور:*\n' +
        'ابدأ رسالتك بأحد هذه العبارات:\n' +
        '• تحدث عن...\n' +
        '• اكتب عن...\n' +
        '• انشر عن...\n' +
        '• موضوع عن...\n' +
        '• كلم عن...\n\n' +
        'أو اكتب الموضوع مباشرة!\n\n' +
        '⚡ *ملاحظة:* يوجد حد زمني 10 ثوانٍ بين كل طلب.',
        { parse_mode: 'Markdown' }
    );
});

// ============ أمر حالة البوت ============
bot.command('status', async (ctx) => {
    log('INFO', 'Status command received');
    try {
        const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
        const hours = Math.floor(uptime / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = uptime % 60;

        ctx.reply(
            '✅ *حالة البوت*\n\n' +
            `⏱️ وقت التشغيل: ${hours}س ${minutes}د ${seconds}ث\n` +
            `📊 المنشورات المولدة: ${stats.postsGenerated}\n` +
            `❌ الأخطاء: ${stats.errors}\n` +
            `📝 آخر منشور: ${stats.lastPost || 'لا يوجد'}\n` +
            `📢 القناة: ${channelId}\n` +
            `🤖 الحالة: نشط ✓`,
            { parse_mode: 'Markdown' }
        );
    } catch (error) {
        log('ERROR', 'Error in status command', { error: error.message });
        ctx.reply('❌ حدث خطأ في عرض الحالة.');
    }
});

// ============ أمر الإحصائيات ============
bot.command('stats', (ctx) => {
    log('INFO', 'Stats command received');
    const uptime = Math.floor((Date.now() - stats.startTime) / 1000);
    const avgPerHour = stats.postsGenerated / (uptime / 3600) || 0;

    ctx.reply(
        '📊 *إحصائيات البوت*\n\n' +
        `📝 إجمالي المنشورات: ${stats.postsGenerated}\n` +
        `❌ إجمالي الأخطاء: ${stats.errors}\n` +
        `📈 معدل المنشورات: ${avgPerHour.toFixed(2)}/ساعة\n` +
        `🕐 بدء التشغيل: ${stats.startTime.toLocaleString('ar-EG')}\n` +
        `📝 آخر منشور: ${stats.lastPost || 'لا يوجد'}`,
        { parse_mode: 'Markdown' }
    );
});

// ============ دالة توليد ونشر المحتوى ============
async function generateAndPost(ctx, topic) {
    const maxRetries = 2;
    let attempt = 0;

    while (attempt <= maxRetries) {
        try {
            attempt++;

            if (attempt === 1) {
                await ctx.reply(`⏳ *جاري التفكير والكتابة عن:* ${topic}...`, { parse_mode: 'Markdown' });
            } else {
                await ctx.reply(`🔄 إعادة المحاولة (${attempt}/${maxRetries + 1})...`);
            }

            log('INFO', `Generating content for topic: "${topic}" (Attempt ${attempt})`);

            // صياغة الطلب للذكاء الاصطناعي - محسّنة
            const prompt = `
أنت مدير قناة تلجرام محترف ومبدع متخصص في كتابة محتوى جذاب وقيّم.

المهمة: اكتب منشوراً احترافياً لقناة تلجرام حول الموضوع: "${topic}"

الشروط الواجب اتباعها:
1. ابدأ بعنوان جذاب أو سؤال مثير للاهتمام
2. استخدم الإيموجي بشكل مناسب ومتوازن (لا تكثر منها)
3. قسّم النص إلى فقرات قصيرة وواضحة (3-5 فقرات)
4. اجعل الأسلوب تفاعلياً وسهل الفهم
5. أضف قيمة حقيقية ومعلومات مفيدة
6. اختم بعبارة تحفيزية أو دعوة للتفاعل
7. لا تذكر أنك ذكاء اصطناعي، تحدث كصاحب القناة
8. استخدم اللغة العربية الفصحى المبسطة
9. طول المنشور: 150-300 كلمة

اكتب المنشور الآن:
            `.trim();

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama3-8b-8192",
                temperature: 0.8, // زيادة الإبداع قليلاً
                max_tokens: 1500, // زيادة الحد الأقصى
                top_p: 0.9,
                stream: false,
                stop: null
            });

            const text = chatCompletion.choices[0]?.message?.content?.trim() || "";

            if (!text) {
                throw new Error("لم يتم استلام أي نص من الموديل.");
            }

            log('INFO', `Content generated successfully. Length: ${text.length} characters`);

            // إرسال النص المولد إلى القناة
            await bot.telegram.sendMessage(channelId, text, { parse_mode: 'Markdown' });

            // تحديث الإحصائيات
            stats.postsGenerated++;
            stats.lastPost = new Date().toLocaleString('ar-EG');

            log('INFO', `Post published successfully to channel: ${channelId}`);

            // تأكيد للمستخدم
            await ctx.reply(
                `✅ *تم النشر بنجاح!*\n\n` +
                `📊 عدد الكلمات: ${text.split(/\s+/).length}\n` +
                `📝 عدد الأحرف: ${text.length}\n` +
                `📢 القناة: ${channelId}\n\n` +
                `يمكنك التحقق من المنشور الآن! 🎉`,
                { parse_mode: 'Markdown' }
            );

            return; // نجحت العملية، اخرج من الدالة

        } catch (error) {
            log('ERROR', `Error in generateAndPost (Attempt ${attempt})`, {
                error: error.message,
                topic: topic
            });

            stats.errors++;

            // إذا كانت هذه آخر محاولة، أرسل رسالة الخطأ
            if (attempt > maxRetries) {
                let errorMsg = '❌ *حدث خطأ غير متوقع*';

                if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
                    errorMsg = '❌ *خطأ في الصلاحيات*\n\nالبوت ليس مشرفاً في القناة أو معرف القناة غير صحيح.\n\n' +
                        '🔧 *الحل:*\n' +
                        '1. تأكد من إضافة البوت كمشرف في القناة\n' +
                        '2. تأكد من صحة معرف القناة في ملف .env';
                } else if (error.message?.includes('API key') || error.message?.includes('401')) {
                    errorMsg = '❌ *خطأ في مفتاح API*\n\nمفتاح Groq API غير صحيح أو منتهي الصلاحية.\n\n' +
                        '🔧 *الحل:* تحقق من مفتاح GROQ_API_KEY في ملف .env';
                } else if (error.message?.includes('rate limit') || error.message?.includes('429')) {
                    errorMsg = '❌ *تم تجاوز الحد المسموح*\n\nتم استخدام API بشكل مكثف.\n\n' +
                        '⏱️ *الحل:* انتظر قليلاً ثم حاول مرة أخرى.';
                } else if (error.message?.includes('timeout') || error.message?.includes('ETIMEDOUT')) {
                    errorMsg = '❌ *انتهت مهلة الاتصال*\n\nمشكلة في الاتصال بالإنترنت.\n\n' +
                        '🔧 *الحل:* تحقق من اتصالك بالإنترنت وحاول مرة أخرى.';
                }

                await ctx.reply(
                    `${errorMsg}\n\n` +
                    `📋 *التفاصيل التقنية:*\n\`${error.message}\`\n\n` +
                    `💡 إذا استمرت المشكلة، استخدم /help للمساعدة`,
                    { parse_mode: 'Markdown' }
                );
            } else {
                // انتظر قليلاً قبل إعادة المحاولة
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
}

// ============ معالج الرسائل النصية ============
bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();

    // تجاهل الأوامر (تبدأ بـ /)
    if (text.startsWith('/')) {
        return;
    }

    log('INFO', `Text message received: "${text.substring(0, 50)}..."`);

    // كلمات مفتاحية للبدء
    const triggers = ['تحدث عن', 'اكتب عن', 'انشر عن', 'موضوع عن', 'كلم عن', 'اكتبلي عن', 'اكتب لي عن'];
    let topic = '';

    for (const trigger of triggers) {
        if (text.toLowerCase().startsWith(trigger.toLowerCase())) {
            topic = text.slice(trigger.length).trim();
            break;
        }
    }

    // إذا لم يجد كلمة مفتاحية، نفترض أن النص كاملاً هو الموضوع
    if (!topic) {
        topic = text;
    }

    if (topic.length < 2) {
        return ctx.reply(
            '⚠️ *الموضوع قصير جداً*\n\n' +
            'الرجاء تحديد موضوع واضح للكتابة عنه.\n\n' +
            '💡 *مثال:* تحدث عن فوائد القراءة',
            { parse_mode: 'Markdown' }
        );
    }

    if (topic.length > 200) {
        return ctx.reply(
            '⚠️ *الموضوع طويل جداً*\n\n' +
            'الرجاء اختصار الموضوع إلى أقل من 200 حرف.\n\n' +
            '💡 *مثال:* اكتب عن الذكاء الاصطناعي',
            { parse_mode: 'Markdown' }
        );
    }

    await generateAndPost(ctx, topic);
});

// ============ معالج الأخطاء العامة ============
bot.catch((err, ctx) => {
    log('ERROR', 'Unhandled error in bot', { error: err.message });
    stats.errors++;

    if (ctx) {
        ctx.reply(
            '❌ *حدث خطأ غير متوقع*\n\n' +
            'تم تسجيل الخطأ وسيتم معالجته.\n' +
            'الرجاء المحاولة مرة أخرى لاحقاً.',
            { parse_mode: 'Markdown' }
        ).catch(e => log('ERROR', 'Failed to send error message', { error: e.message }));
    }
});

// ============ بدء البوت ============
bot.launch().then(() => {
    log('INFO', '✅ Bot started successfully!');
    log('INFO', `📢 Channel ID: ${channelId}`);
    log('INFO', `👤 Admin ID: ${adminId || 'Not set'}`);
    log('INFO', `👤 Admin Username: ${adminUsername || 'Not set'}`);
    console.log('\n🚀 البوت يعمل الآن! اذهب إلى تلجرام وابدأ المحادثة.\n');
}).catch((err) => {
    log('ERROR', 'Failed to start bot', { error: err.message });
    console.error('\n❌ فشل تشغيل البوت. تحقق من:\n');
    console.error('1. صحة BOT_TOKEN في ملف .env');
    console.error('2. اتصالك بالإنترنت\n');
    process.exit(1);
});

// ============ الإيقاف الآمن ============
const gracefulShutdown = (signal) => {
    log('INFO', `Received ${signal}, shutting down gracefully...`);
    console.log(`\n⏹️  إيقاف البوت بشكل آمن...\n`);

    bot.stop(signal);

    // طباعة الإحصائيات النهائية
    console.log('📊 إحصائيات الجلسة:');
    console.log(`   - المنشورات المولدة: ${stats.postsGenerated}`);
    console.log(`   - الأخطاء: ${stats.errors}`);
    console.log(`   - وقت التشغيل: ${Math.floor((Date.now() - stats.startTime) / 1000)} ثانية\n`);

    process.exit(0);
};

process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));

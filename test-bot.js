require('dotenv').config();

console.log('🔍 التحقق من إعدادات البوت...\n');

// التحقق من المتغيرات
const checks = {
    'BOT_TOKEN': process.env.BOT_TOKEN,
    'GROQ_API_KEY': process.env.GROQ_API_KEY,
    'CHANNEL_ID': process.env.CHANNEL_ID,
    'ADMIN_ID': process.env.ADMIN_ID,
    'ADMIN_USERNAME': process.env.ADMIN_USERNAME
};

let hasError = false;

for (const [key, value] of Object.entries(checks)) {
    if (value) {
        const displayValue = key === 'BOT_TOKEN' || key === 'GROQ_API_KEY'
            ? value.substring(0, 10) + '...'
            : value;
        console.log(`✅ ${key}: ${displayValue}`);
    } else {
        if (key !== 'ADMIN_ID' && key !== 'ADMIN_USERNAME') {
            console.log(`❌ ${key}: غير موجود`);
            hasError = true;
        } else {
            console.log(`⚠️  ${key}: غير محدد (اختياري)`);
        }
    }
}

console.log('\n---\n');

if (hasError) {
    console.log('❌ يرجى ملء جميع المتغيرات المطلوبة في ملف .env');
    process.exit(1);
}

// التحقق من الاتصال بتلجرام
const { Telegraf } = require('telegraf');
const bot = new Telegraf(process.env.BOT_TOKEN);

console.log('🔌 جاري الاتصال بتلجرام...\n');

bot.telegram.getMe()
    .then(info => {
        console.log('✅ الاتصال بتلجرام ناجح!\n');
        console.log('📛 اسم البوت:', info.first_name);
        console.log('🆔 معرف البوت: @' + info.username);
        console.log('🔢 ID:', info.id);
        console.log('\n---\n');

        // التحقق من حالة البوت
        console.log('🧪 التحقق من حالة البوت...\n');

        return bot.launch();
    })
    .then(() => {
        console.log('✅ البوت يعمل بنجاح!\n');
        console.log('📱 اذهب إلى تلجرام وجرب الأوامر التالية:');
        console.log('   /start');
        console.log('   /help');
        console.log('   /status');
        console.log('   تحدث عن الذكاء الاصطناعي\n');
        console.log('⏹️  اضغط Ctrl+C لإيقاف البوت\n');
    })
    .catch(err => {
        console.log('❌ خطأ في الاتصال:\n');

        if (err.message.includes('409')) {
            console.log('⚠️  المشكلة: البوت يعمل بالفعل في مكان آخر');
            console.log('\n💡 الحلول:');
            console.log('   1. أوقف البوت على منصة الاستضافة (Render/Railway/etc)');
            console.log('   2. أو اترك البوت يعمل هناك واستخدمه مباشرة من تلجرام');
            console.log('\n📍 البوت يعمل حالياً على منصة استضافة أخرى');
            console.log('   يمكنك استخدامه مباشرة من تلجرام! ✅');
        } else if (err.message.includes('401')) {
            console.log('⚠️  المشكلة: BOT_TOKEN غير صحيح');
            console.log('\n💡 الحل:');
            console.log('   1. اذهب إلى @BotFather في تلجرام');
            console.log('   2. احصل على توكن جديد');
            console.log('   3. حدّث BOT_TOKEN في ملف .env');
        } else {
            console.log('   ' + err.message);
        }

        process.exit(1);
    });

// معالج الإيقاف
process.once('SIGINT', () => {
    console.log('\n\n⏹️  إيقاف البوت...\n');
    bot.stop('SIGINT');
    process.exit(0);
});

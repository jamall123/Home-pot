#!/bin/bash

echo "🔍 فحص شامل للبوت"
echo "===================="
echo ""

# التحقق من ملف .env
if [ ! -f .env ]; then
    echo "❌ ملف .env غير موجود"
    echo "💡 قم بنسخ .env.example إلى .env وملء البيانات"
    exit 1
fi

echo "✅ ملف .env موجود"
echo ""

# التحقق من المتغيرات
echo "📋 المتغيرات البيئية:"
echo "----------------------"

if grep -q "BOT_TOKEN=" .env && ! grep -q "BOT_TOKEN=$" .env && ! grep -q "BOT_TOKEN= *$" .env; then
    echo "✅ BOT_TOKEN محدد"
else
    echo "❌ BOT_TOKEN غير محدد أو فارغ"
fi

if grep -q "GROQ_API_KEY=" .env && ! grep -q "GROQ_API_KEY=$" .env && ! grep -q "GROQ_API_KEY= *$" .env; then
    echo "✅ GROQ_API_KEY محدد"
else
    echo "❌ GROQ_API_KEY غير محدد أو فارغ"
fi

if grep -q "CHANNEL_ID=" .env && ! grep -q "CHANNEL_ID=$" .env && ! grep -q "CHANNEL_ID= *$" .env; then
    echo "✅ CHANNEL_ID محدد"
else
    echo "❌ CHANNEL_ID غير محدد أو فارغ"
fi

echo ""
echo "🌐 اختبار الاتصال:"
echo "-------------------"

# اختبار الاتصال بالإنترنت
if curl -s --max-time 5 https://api.telegram.org/ > /dev/null; then
    echo "✅ الاتصال بـ Telegram API يعمل"
else
    echo "❌ لا يوجد اتصال بـ Telegram API"
    echo "💡 تحقق من اتصالك بالإنترنت"
fi

echo ""
echo "🤖 حالة البوت:"
echo "---------------"

# التحقق من وجود نسخة تعمل
if pgrep -f "node index.js" > /dev/null; then
    echo "✅ البوت يعمل محلياً (Process ID: $(pgrep -f 'node index.js'))"
else
    echo "⚠️  البوت لا يعمل محلياً"
fi

echo ""
echo "📝 الخطوات التالية:"
echo "--------------------"
echo "1. تحقق من أن البوت ليس يعمل على منصة استضافة أخرى"
echo "2. إذا كان يعمل على منصة، استخدمه مباشرة من تلجرام"
echo "3. إذا لم يكن يعمل، جرب: npm start"
echo ""

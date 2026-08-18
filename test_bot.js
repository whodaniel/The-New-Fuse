const { Telegraf } = require('telegraf');

const botToken = "8835055512:AAFj44n4sPIucZdSj5Ntc7z_DEpQrlSiax8";
const bot = new Telegraf(botToken);

bot.start((ctx) => ctx.reply('Welcome to TNF Bot!'));
bot.help((ctx) => ctx.reply('Send me a command to execute.'));
bot.on('text', (ctx) => {
  ctx.reply(`You sent: ${ctx.message.text}`);
});

bot.launch()
  .then(() => console.log('Bot launched!'))
  .catch(err => console.error('Failed to launch bot:', err));

// Stop the bot after 30 seconds for testing
setTimeout(() => {
  bot.stop('Test completed');
  process.exit(0);
}, 30000);

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: settings } = await supabase
    .from('admin_settings')
    .select('setting_key, setting_value')
    .in('setting_key', ['telegram_bot_token', 'telegram_chat_id']);

  console.log('Settings found:', settings);

  let botToken = '';
  let chatId = '';
  settings?.forEach(s => {
    if (s.setting_key === 'telegram_bot_token') botToken = s.setting_value;
    if (s.setting_key === 'telegram_chat_id') chatId = s.setting_value;
  });

  console.log('Bot token set:', !!botToken, botToken ? botToken.substring(0, 10) + '...' : '(empty)');
  console.log('Chat ID set:', !!chatId, chatId);

  if (!botToken || !chatId) {
    console.log('ERROR: One or both settings are missing/empty in the database');
    return;
  }

  // Test the bot token is valid
  const meRes = await fetch('https://api.telegram.org/bot' + botToken + '/getMe');
  const meData = await meRes.json();
  console.log('Bot valid:', meData.ok, meData.result?.username || meData.description);

  // Test sending a message
  const tgRes = await fetch('https://api.telegram.org/bot' + botToken + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: 'Test from FlixOn diagnostic script', parse_mode: 'HTML' }),
  });
  const tgData = await tgRes.json();
  console.log('Send message result:', JSON.stringify(tgData));
}
test();

async function run() {
  const botToken = '8984323598:AAFxn8yRAabVflt2wLrIK0H0fIVHAD7ah4w';
  const chatId = '1493249597';
  const content = 'Test message with _ and * and [';
  const tgMessage = \*New Support Message*\n\n*From:* John\n*Message:* \\n\n_Reply via Admin Dashboard_\;
  
  const res = await fetch(\https://api.telegram.org/bot\/sendMessage\, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: tgMessage, parse_mode: 'Markdown' }),
  });
  const data = await res.json();
  console.log(data);
}
run();

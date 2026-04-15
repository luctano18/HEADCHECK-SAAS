import 'dotenv/config';

const key = process.env.RESEND_API_KEY;
const from = process.env.RESEND_FROM_EMAIL;

console.log('RESEND_API_KEY set:', !!key && key.length > 10);
console.log('RESEND_FROM_EMAIL set:', !!from && from.includes('@'));

const res = await fetch('https://api.resend.com/domains', {
  headers: { 'Authorization': `Bearer ${key}` }
});
const data = await res.json();

if (res.ok) {
  console.log('✅ Resend API key VALID');
  console.log('Domains:', JSON.stringify(data).slice(0, 300));
} else {
  console.error('❌ Resend API error:', JSON.stringify(data));
  process.exit(1);
}

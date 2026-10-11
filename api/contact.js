/* POST /api/contact — the lander's contact form, sent to us as an email via Resend.
   RESEND_API_KEY comes from the Resend integration on the Vercel project.
   CONTACT_TO / CONTACT_FROM are optional overrides; CONTACT_FROM must be on a
   domain verified in Resend, or Resend will refuse to send. */

const TO = process.env.CONTACT_TO || 'dothan@trygroundworksolutions.com';
const FROM = process.env.CONTACT_FROM || 'Groundwork website <website@trygroundworksolutions.com>';

const SIZES = ['1–10', '11–50', '51–200', '201–1,000', '1,000+'];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function clean(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  body = body || {};

  // the hidden "website" field is invisible to people; bots fill it in.
  // Answer as if it worked so they don't learn to skip it.
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const f = {
    name: clean(body.name, 120),
    email: clean(body.email, 200),
    company: clean(body.company, 160),
    size: SIZES.includes(body.size) ? body.size : '',
    message: clean(body.message, 5000),
  };
  if (!f.name || !EMAIL.test(f.email) || f.message.length < 5) {
    return res.status(400).json({ ok: false, error: 'Please add your name, a valid email and what you want built.' });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('contact: RESEND_API_KEY is not set');
    return res.status(500).json({ ok: false, error: 'The form is not connected yet. Please email us instead.' });
  }

  const rows = [
    ['Name', f.name],
    ['Email', f.email],
    ['Company', f.company || '—'],
    ['Company size', f.size || '—'],
  ];
  const html =
    '<table style="font:14px/1.5 sans-serif;border-collapse:collapse">' +
    rows.map(([k, v]) => '<tr><td style="padding:4px 16px 4px 0;color:#6c6c71">' + k + '</td><td>' + esc(v) + '</td></tr>').join('') +
    '</table><p style="font:14px/1.6 sans-serif;white-space:pre-wrap;margin-top:16px">' + esc(f.message) + '</p>';
  const text = rows.map(([k, v]) => k + ': ' + v).join('\n') + '\n\n' + f.message;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        reply_to: f.email,
        subject: 'New enquiry: ' + f.name + (f.company ? ' · ' + f.company : ''),
        html,
        text,
      }),
    });
    if (!r.ok) {
      console.error('contact: Resend responded', r.status, await r.text());
      return res.status(502).json({ ok: false, error: 'We could not send that just now. Please email us instead.' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('contact: send failed', e);
    return res.status(502).json({ ok: false, error: 'We could not send that just now. Please email us instead.' });
  }
};

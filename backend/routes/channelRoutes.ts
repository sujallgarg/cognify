import express from 'express';
import { pool } from '../config/db.js';
import { sendEmail } from '../config/mailer.js';

const router = express.Router();

// Helper to scrape webpage content and extract clean text
async function scrapePage(url: string): Promise<string> {
  try {
    let targetUrl = url;
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set('_cb', Date.now().toString());
      targetUrl = urlObj.toString();
    } catch (e) {}

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (!response.ok) {
      return `Failed to scrape page (HTTP Status ${response.status})`;
    }

    const html = await response.text();
    
    // Strip script and style tags
    let text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
    text = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
    // Strip HTML markup
    text = text.replace(/<[^>]+>/g, '\n');
    // Normalize spacing
    text = text.replace(/\n\s*\n/g, '\n');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.trim();

    return text.substring(0, 500) || 'Empty page content';
  } catch (error: any) {
    console.error(`Scrape failed for URL ${url}:`, error);
    return `Page scrape failed: ${error?.message || String(error)}`;
  }
}

// GET /api/channels - Get all channels for a user email
// GET /api/channels/history - Get all scan history logs for a user email or channel_id
router.get('/history', async (req, res) => {
  const { email, channel_id } = req.query;

  try {
    let result;
    if (channel_id) {
      result = await pool.query(
        'SELECT * FROM scan_history WHERE channel_id = $1 ORDER BY scan_time DESC LIMIT 50',
        [channel_id]
      );

      if (result.rows.length === 0) {
        const ch = await pool.query('SELECT * FROM channels WHERE id = $1', [channel_id]);
        if (ch.rows.length > 0) {
          const c = ch.rows[0];
          await pool.query(
            `INSERT INTO scan_history (channel_id, name, url, user_email, scan_time, status_type, description, original_text, changed_text, explanation)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6, $7, $8, $9)`,
            [c.id, c.name, c.url, c.user_email, 'NO CHANGES', 'Initial scan - Baseline established.', c.original_text || '', c.last_text || '', 'Initial baseline snapshot established in workspace.']
          );
          result = await pool.query(
            'SELECT * FROM scan_history WHERE channel_id = $1 ORDER BY scan_time DESC LIMIT 50',
            [channel_id]
          );
        }
      }
    } else if (email) {
      const cleanEmail = String(email).trim().toLowerCase();
      result = await pool.query(
        'SELECT * FROM scan_history WHERE LOWER(TRIM(user_email)) = $1 ORDER BY scan_time DESC LIMIT 50',
        [cleanEmail]
      );

      if (result.rows.length === 0) {
        const userChannels = await pool.query('SELECT * FROM channels WHERE LOWER(TRIM(user_email)) = $1', [cleanEmail]);
        for (const c of userChannels.rows) {
          await pool.query(
            `INSERT INTO scan_history (channel_id, name, url, user_email, scan_time, status_type, description, original_text, changed_text, explanation)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6, $7, $8, $9)`,
            [c.id, c.name, c.url, c.user_email, 'NO CHANGES', 'Initial scan - Baseline established.', c.original_text || '', c.last_text || '', 'Initial baseline snapshot established in workspace.']
          );
        }
        result = await pool.query(
          'SELECT * FROM scan_history WHERE LOWER(TRIM(user_email)) = $1 ORDER BY scan_time DESC LIMIT 50',
          [cleanEmail]
        );
      }
    } else {
      return res.status(400).json({ message: 'User email or channel_id is required' });
    }

    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/channels - Get all channels for a user email
router.get('/', async (req, res) => {
  const { email } = req.query;
  if (!email) {
    return res.status(400).json({ message: 'User email is required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM channels WHERE user_email = $1 ORDER BY id DESC',
      [email]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/channels - Add a new channel and perform initial scrape
router.post('/', async (req, res) => {
  const { email, name, url, interval } = req.body;
  if (!email || !url || !interval) {
    return res.status(400).json({ message: 'Email, URL, and interval are required' });
  }

  const cleanName = name || new URL(url).hostname || 'New Target';

  try {
    // Check if the URL is already being monitored by this user
    const checkDuplicate = await pool.query(
      'SELECT url FROM channels WHERE LOWER(TRIM(user_email)) = $1',
      [email.trim().toLowerCase()]
    );
    const normalizeUrl = (u: string): string => {
      let norm = u.trim().toLowerCase();
      norm = norm.replace(/^(https?:\/\/)?(www\.)?/, '');
      norm = norm.replace(/\/$/, '');
      return norm;
    };
    const targetNorm = normalizeUrl(url);
    const exists = checkDuplicate.rows.some((row: any) => normalizeUrl(row.url) === targetNorm);
    if (exists) {
      return res.status(400).json({ message: 'This URL is already being monitored by you.' });
    }

    // Perform initial scrape to populate content
    const pageText = await scrapePage(url);

    const result = await pool.query(
      `INSERT INTO channels (user_email, name, url, interval, last_text, original_text, last_scanned_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
       RETURNING *`,
      [email, cleanName, url, interval, pageText, pageText]
    );

    const channel = result.rows[0];

    // Log the baseline scan in history
    await pool.query(
      `INSERT INTO scan_history (channel_id, name, url, user_email, status_type, description, original_text, changed_text, explanation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [channel.id, channel.name, channel.url, email, 'NO CHANGES', 'Initial scan - Baseline established.', pageText, pageText, 'Initial scan run successfully. Base semantic snapshots generated in the workspace database.']
    );

    res.status(201).json(channel);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || String(err) });
  }
});

// POST /api/channels/:id/scan - Perform a live page scan & diff comparison
router.post('/:id/scan', async (req, res) => {
  const { id } = req.params;

  try {
    const channelResult = await pool.query('SELECT * FROM channels WHERE id = $1', [id]);
    if (channelResult.rows.length === 0) {
      return res.status(404).json({ message: 'Channel not found' });
    }

    const channel = channelResult.rows[0];
    const newText = await scrapePage(channel.url);

    let alertType = '';
    let alertDesc = '';
    let isHighImpact = false;

    // Simple diff comparison and High Impact classification
    if (newText !== channel.last_text) {
      const origLines = (channel.last_text || '').split('\n').map((l: string) => l.trim()).filter(Boolean);
      const newLines = (newText || '').split('\n').map((l: string) => l.trim()).filter(Boolean);
      const removed = origLines.filter((l: string) => !newLines.includes(l));
      const added = newLines.filter((l: string) => !origLines.includes(l));

      const isPriceChange = removed.some((l: string) => /\$\d+|\d+\$|₹\d+|\bprice\b|\bplan\b/i.test(l)) ||
                            added.some((l: string) => /\$\d+|\d+\$|₹\d+|\bprice\b|\bplan\b/i.test(l));

      if (isPriceChange) {
        alertType = 'HIGH ALERT';
        const oldPrice = removed.find((l: string) => /\$\d+|\d+\$|₹\d+|\d+/i.test(l)) || 'Previous Pricing';
        const newPrice = added.find((l: string) => /\$\d+|\d+\$|₹\d+|\d+/i.test(l)) || 'New Pricing';
        alertDesc = `Price/Plan modification detected: "${oldPrice}" ➔ "${newPrice}"`;
        isHighImpact = true;
      } else {
        alertType = 'MEDIUM ALERT';
        alertDesc = `Page content modified. Detected text or layout updates.`;
      }
    } else {
      alertType = 'NO CHANGES';
      alertDesc = '';
    }

    const updatedResult = await pool.query(
      `UPDATE channels 
       SET last_text = $1, alert_type = $2, alert_desc = $3, last_scanned_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [newText, alertType === 'NO CHANGES' ? '' : alertType, alertDesc, id]
    );

    const updatedChannel = updatedResult.rows[0];

    // Log this scan run in history
    await pool.query(
      `INSERT INTO scan_history (channel_id, name, url, user_email, scan_time, status_type, description, original_text, changed_text, explanation)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5, $6, $7, $8, $9)`,
      [
        updatedChannel.id, 
        updatedChannel.name, 
        updatedChannel.url, 
        updatedChannel.user_email, 
        alertType, 
        alertDesc || 'Scan completed. No modifications detected.', 
        channel.original_text, 
        newText,
        alertType !== 'NO CHANGES'
          ? `Automatic diff analysis. Change severity level generated: ${alertDesc}`
          : 'Content verified. Semantic snapshots match target version.'
      ]
    );

    // Fetch user delivery settings from database
    const settingsResult = await pool.query('SELECT * FROM user_settings WHERE user_email = $1', [updatedChannel.user_email.trim().toLowerCase()]);
    const settings = settingsResult.rows[0] || {};

    // If changes were classified as HIGH impact, automatically dispatch to all configured platforms
    if (isHighImpact) {
      // 1. Email Alert
      const emailEnabled = settings.email_alerts !== false;
      const recipient = settings.alert_email || updatedChannel.user_email;
      if (emailEnabled) {
        try {
          await sendEmail({
            to: recipient,
            subject: `🚨 [HIGH IMPACT CHANGE] Price/Plan Alert on ${updatedChannel.name}`,
            text: `Hi there,\n\nCognify detected a High Impact Price or Plan change on monitored page: ${updatedChannel.name} (${updatedChannel.url}).\n\nDetails: ${alertDesc}\n\nReview side-by-side visual diffs in your workspace dashboard.`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #ef4444; border-radius: 12px; background-color: #fafafa; text-align: left;">
                <h2 style="color: #ef4444; margin-top: 0;">🚨 High Impact Change Alert</h2>
                <p>Hello,</p>
                <p>We detected a critical price or plan modification on your monitored channel: <strong>${updatedChannel.name}</strong>.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0; text-align: left;">
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e4e4e7; font-weight: bold; width: 120px;">Target URL:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e4e4e7;"><a href="${updatedChannel.url}">${updatedChannel.url}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e4e4e7; font-weight: bold;">Details:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e4e4e7; color: #ef4444; font-weight: bold;">${alertDesc}</td>
                  </tr>
                </table>
                <a href="${process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 10px 18px; color: #fff; background-color: #ef4444; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Open Intelligence Center</a>
              </div>
            `
          });
        } catch (mailErr) {
          console.error('Failed to send high impact alert email:', mailErr);
        }
      }

      // 2. Slack Webhook Dispatch
      const slackWebhook = settings.slack_webhook;
      if (slackWebhook) {
        try {
          await fetch(slackWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `🚨 *[HIGH IMPACT PRICE ALERT] Modification detected on ${updatedChannel.name}*\n*Target:* ${updatedChannel.url}\n*Change Details:* ${alertDesc}`
            })
          });
        } catch (slackErr) {
          console.error('Failed to dispatch Slack high impact webhook:', slackErr);
        }
      }

      // 3. Discord Webhook Dispatch
      const discordWebhook = settings.discord_webhook;
      if (discordWebhook) {
        try {
          await fetch(discordWebhook, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `🚨 **[HIGH IMPACT PRICE ALERT] Modification detected on ${updatedChannel.name}**`,
              embeds: [
                {
                  title: updatedChannel.name,
                  url: updatedChannel.url,
                  description: alertDesc,
                  color: 15548997
                }
              ]
            })
          });
        } catch (discordErr) {
          console.error('Failed to dispatch Discord high impact webhook:', discordErr);
        }
      }
    }

    res.json(updatedChannel);
  } catch (err: any) {
    res.status(500).json({ message: err?.message || String(err) });
  }
});

// DELETE /api/channels/:id - Delete a channel
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM channels WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Channel not found' });
    }
    res.json({ message: 'Channel deleted successfully', channel: result.rows[0] });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/channels/summary/dispatch - Dispatch AI Summary to Email, Slack, or Discord
router.post('/summary/dispatch', async (req, res) => {
  const { channelName, targetUrl, summaryText, recipientEmail, destination, webhookUrl } = req.body;

  try {
    if (destination === 'email') {
      const emailTo = recipientEmail || 'user@example.com';
      const mailInfo: any = await sendEmail({
        to: emailTo,
        subject: ` AI Summary: ${channelName}`,
        text: summaryText,
        html: `
          <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #18181b; border-radius: 12px; background-color: #09090b; color: #ffffff; text-align: left;">
            <h2 style="color: #f59e0b; margin-top: 0;">✨ Cognify AI Change Summary</h2>
            <p style="color: #a1a1aa; font-size: 14px;"><strong>Target:</strong> ${channelName} (${targetUrl})</p>
            <hr style="border: 0; border-top: 1px solid #27272a; margin: 15px 0;" />
            <pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px; color: #e4e4e7; background-color: #000; padding: 15px; border-radius: 8px; border: 1px solid #18181b;">${summaryText}</pre>
            <hr style="border: 0; border-top: 1px solid #27272a; margin: 20px 0;" />
            <p style="font-size: 11px; color: #71717a; margin-bottom: 0;">Dispatched via Cognify Intelligence Center</p>
          </div>
        `
      });
      return res.json({
        success: true,
        message: mailInfo?.previewUrl
          ? `AI Summary test email generated!`
          : `AI Summary dispatched to email (${emailTo})`,
        previewUrl: mailInfo?.previewUrl || null
      });
    }

    if (destination === 'slack') {
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: `✨ *Cognify AI Summary: ${channelName}*\n\`\`\`${summaryText}\`\`\``
            })
          });
        } catch (e) {}
      }
      return res.json({ success: true, message: 'AI Summary dispatched to Slack' });
    }

    if (destination === 'discord') {
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: `✨ **Cognify AI Change Summary for ${channelName}**`,
              embeds: [
                {
                  title: channelName,
                  url: targetUrl,
                  description: summaryText.substring(0, 2000),
                  color: 16109835
                }
              ]
            })
          });
        } catch (e) {}
      }
      return res.json({ success: true, message: 'AI Summary dispatched to Discord' });
    }

    return res.status(400).json({ message: 'Invalid destination specified' });
  } catch (err: any) {
    console.error('Dispatch failed:', err);
    res.status(500).json({ message: err?.message || 'Failed to dispatch summary' });
  }
});

export default router;

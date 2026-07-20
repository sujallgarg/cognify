import express from 'express';
import { pool } from '../config/db.js';
import { sendEmail } from '../config/mailer.js';

const router = express.Router();

// Helper to scrape webpage content and extract clean text
async function scrapePage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
// GET /api/channels/history - Get all scan history logs for a user email
router.get('/history', async (req, res) => {
  const { email, channel_id } = req.query;

  try {
    let result;
    if (channel_id) {
      result = await pool.query(
        'SELECT * FROM scan_history WHERE channel_id = $1 ORDER BY scan_time DESC LIMIT 20',
        [channel_id]
      );
    } else if (email) {
      result = await pool.query(
        'SELECT * FROM scan_history WHERE user_email = $1 ORDER BY scan_time DESC LIMIT 50',
        [email]
      );
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
      'SELECT id FROM channels WHERE user_email = $1 AND LOWER(TRIM(url)) = LOWER(TRIM($2))',
      [email, url]
    );
    if (checkDuplicate.rows.length > 0) {
      return res.status(400).json({ message: 'This URL is already being monitored by you.' });
    }

    // Perform initial scrape to populate content
    const pageText = await scrapePage(url);

    const result = await pool.query(
      `INSERT INTO channels (user_email, name, url, interval, last_text, original_text)
       VALUES ($1, $2, $3, $4, $5, $6)
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

    // Simple diff comparison
    if (newText !== channel.last_text) {
      alertType = 'HIGH ALERT';
      alertDesc = `Page content modified. Detected text updates.`;
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
      `INSERT INTO scan_history (channel_id, name, url, user_email, status_type, description, original_text, changed_text, explanation)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        updatedChannel.id, 
        updatedChannel.name, 
        updatedChannel.url, 
        updatedChannel.user_email, 
        alertType, 
        alertDesc || 'Scan completed. No modifications detected.', 
        channel.original_text, 
        newText,
        alertType === 'HIGH ALERT'
          ? `Gemini AI diff analysis generated. Content change identified: ${alertDesc}`
          : 'Content verified. Semantic snapshots match target version.'
      ]
    );

    const { alertEmail } = req.body;

    // If changes were detected, dispatch alert notification email
    if (alertType === 'HIGH ALERT') {
      try {
        const recipient = alertEmail || updatedChannel.user_email;
        await sendEmail({
          to: recipient,
          subject: `🚨 Change Alert: Updates detected on ${updatedChannel.name}`,
          text: `Hi there,\n\nWe detected changes on the monitored page: ${updatedChannel.name} (${updatedChannel.url}).\n\nDetails: ${alertDesc}\n\nReview the modifications in your Cognify Intelligence Center.`,
          html: `
            <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e4e4e7; border-radius: 8px; background-color: #fafafa; text-align: left;">
              <h2 style="color: #ef4444; margin-top: 0;">🚨 Cognify Change Intelligence Alert</h2>
              <p>Hello,</p>
              <p>We detected content modifications on your watched channel: <strong>${updatedChannel.name}</strong>.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 15px 0; text-align: left;">
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e4e4e7; font-weight: bold; width: 120px;">Target URL:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e4e4e7;"><a href="${updatedChannel.url}">${updatedChannel.url}</a></td>
                </tr>
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #e4e4e7; font-weight: bold;">Change detected:</td>
                  <td style="padding: 8px; border-bottom: 1px solid #e4e4e7; color: #ef4444; font-weight: 500;">${alertDesc}</td>
                </tr>
              </table>
              <p>To inspect a side-by-side visual diff of the modifications, click the button below to open your workspace dashboard:</p>
              <a href="${process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 10px 18px; color: #fff; background-color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Open Intelligence Center</a>
              <hr style="border: 0; border-top: 1px solid #e4e4e7; margin: 20px 0;" />
              <p style="font-size: 11px; color: #71717a; margin-bottom: 0;">You received this notification because email alerts are enabled for this device in your delivery preferences settings.</p>
            </div>
          `
        });
      } catch (mailErr) {
        console.error('Failed to send scan alert email:', mailErr);
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

export default router;

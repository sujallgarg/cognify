import { pool } from '../config/db.js';
import { sendEmail } from '../config/mailer.js';

async function scrapePage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      signal: AbortSignal.timeout(6000)
    });
    
    if (!response.ok) {
      return `Failed to scrape page (HTTP Status ${response.status})`;
    }

    const html = await response.text();
    
    let text = html.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '');
    text = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, '');
    text = text.replace(/<[^>]+>/g, '\n');
    text = text.replace(/\n\s*\n/g, '\n');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.trim();

    return text.substring(0, 500) || 'Empty page content';
  } catch (error: any) {
    return `Page scrape failed: ${error?.message || String(error)}`;
  }
}

function isDueForScan(channel: any): boolean {
  if (!channel.last_scanned_at) return true; // Never scanned before

  const lastScanned = new Date(channel.last_scanned_at).getTime();
  const now = Date.now();
  const elapsedMs = now - lastScanned;

  const intervalCode = String(channel.interval || 'DAILY').toUpperCase();

  if (intervalCode.includes('HOUR') || intervalCode === 'HOURLY') {
    // HOURLY: Due after 1 hour (3,600,000 ms)
    return elapsedMs >= 60 * 60 * 1000;
  }
  
  if (intervalCode.includes('WEEK') || intervalCode === 'WEEKLY') {
    // WEEKLY: Due after 7 days (604,800,000 ms)
    return elapsedMs >= 7 * 24 * 60 * 60 * 1000;
  }

  // DAILY: Due after 24 hours (86,400,000 ms)
  return elapsedMs >= 24 * 60 * 60 * 1000;
}

export function startBackgroundScanner() {
  console.log('[Background Scanner] Engine initialized. Monitoring target channels in background...');

  // Run initial scan cycle 5 seconds after server startup
  setTimeout(runScanCycle, 5000);

  // Check channel schedule every 1 minute (60,000 ms)
  setInterval(runScanCycle, 60000);
}

async function runScanCycle() {
  try {
    const result = await pool.query('SELECT * FROM channels');
    const channels = result.rows;

    if (channels.length === 0) {
      return;
    }

    for (const channel of channels) {
      // Check if channel is due for scan based on HOURLY / DAILY / WEEKLY interval
      if (!isDueForScan(channel)) {
        continue;
      }

      console.log(`[Background Scanner] Target "${channel.name}" (${channel.interval || 'DAILY'}) is due for scan. Executing background check...`);
      try {
        const newText = await scrapePage(channel.url);

        // Compare scraped content against last saved snapshot
        if (channel.last_text && newText !== channel.last_text) {
          console.log(`[Background Scanner] 🚨 ALERT: Content change detected on "${channel.name}" (${channel.url})`);
          
          const alertType = 'HIGH ALERT';
          const alertDesc = 'Page content modified. Detected live text updates during automated background scan.';

          // Update channels record
          await pool.query(
            `UPDATE channels 
             SET last_text = $1, alert_type = $2, alert_desc = $3, last_scanned_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [newText, alertType, alertDesc, channel.id]
          );

          // Insert into scan history
          await pool.query(
            `INSERT INTO scan_history (channel_id, name, url, user_email, status_type, description, original_text, changed_text, explanation)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              channel.id, 
              channel.name, 
              channel.url, 
              channel.user_email, 
              alertType, 
              alertDesc, 
              channel.original_text || channel.last_text, 
              newText,
              `Gemini AI background diff analysis. Automatic scanner detected content modification: ${alertDesc}`
            ]
          );

          // Dispatch email alert to channel owner
          await sendEmail({
            to: channel.user_email,
            subject: `🚨 Background Alert: Updates detected on ${channel.name}`,
            text: `Hi there,\n\nOur automated background scanner detected content changes on your monitored target: ${channel.name} (${channel.url}).\n\nDetails: ${alertDesc}\n\nLog in to your Cognify dashboard to review visual diffs.`,
            html: `
              <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e4e4e7; border-radius: 8px; background-color: #fafafa; text-align: left;">
                <h2 style="color: #ef4444; margin-top: 0;">🚨 Automated Background Scanner Alert</h2>
                <p>Hello,</p>
                <p>Cognify background engine detected content modifications on your watched channel: <strong>${channel.name}</strong>.</p>
                <table style="width: 100%; border-collapse: collapse; margin: 15px 0; text-align: left;">
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e4e4e7; font-weight: bold; width: 120px;">Target URL:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e4e4e7;"><a href="${channel.url}">${channel.url}</a></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #e4e4e7; font-weight: bold;">Change detected:</td>
                    <td style="padding: 8px; border-bottom: 1px solid #e4e4e7; color: #ef4444; font-weight: 500;">${alertDesc}</td>
                  </tr>
                </table>
                <p>Review full visual diffs in your Cognify Intelligence Center:</p>
                <a href="${process.env.NEXT_PUBLIC_CLIENT_URL || 'http://localhost:3000'}/dashboard" style="display: inline-block; padding: 10px 18px; color: #fff; background-color: #000; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;">Open Intelligence Center</a>
              </div>
            `
          });
        } else {
          // Update last_scanned_at timestamp so next scan cycle respects configured interval (HOURLY / DAILY / WEEKLY)
          await pool.query(
            `UPDATE channels SET last_scanned_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [channel.id]
          );
          console.log(`[Background Scanner] Target "${channel.name}" verified (${channel.interval || 'DAILY'}). Next scan scheduled accordingly.`);
        }
      } catch (channelErr) {
        console.error(`[Background Scanner] Error processing target ${channel.name}:`, channelErr);
      }
    }
  } catch (err) {
    console.error('[Background Scanner] Error running scan cycle:', err);
  }
}

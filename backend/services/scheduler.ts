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

  // Scan all monitored targets automatically every 5 minutes (300,000 ms)
  return elapsedMs >= 5 * 60 * 1000;
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
          
          const origLines = (channel.last_text || '').split('\n').map((l: string) => l.trim()).filter(Boolean);
          const newLines = (newText || '').split('\n').map((l: string) => l.trim()).filter(Boolean);
          const removed = origLines.filter((l: string) => !newLines.includes(l));
          const added = newLines.filter((l: string) => !origLines.includes(l));

          const isPriceChange = removed.some((l: string) => /\$\d+|\d+\$|₹\d+|\bprice\b|\bplan\b/i.test(l)) ||
                                added.some((l: string) => /\$\d+|\d+\$|₹\d+|\bprice\b|\bplan\b/i.test(l));

          let alertType = 'MEDIUM ALERT';
          let alertDesc = 'Page content modified. Detected text updates during automated background scan.';
          let isHighImpact = false;

          if (isPriceChange) {
            alertType = 'HIGH ALERT';
            const oldPrice = removed.find((l: string) => /\$\d+|\d+\$|₹\d+|\d+/i.test(l)) || 'Previous Pricing';
            const newPrice = added.find((l: string) => /\$\d+|\d+\$|₹\d+|\d+/i.test(l)) || 'New Pricing';
            alertDesc = `Price/Plan modification detected: "${oldPrice}" ➔ "${newPrice}"`;
            isHighImpact = true;
          }

          // Update channels record
          await pool.query(
            `UPDATE channels 
             SET last_text = $1, alert_type = $2, alert_desc = $3, last_scanned_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [newText, alertType === 'MEDIUM ALERT' ? 'ALERT' : alertType, alertDesc, channel.id]
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
              `Automatic background scan. Change severity level generated: ${alertDesc}`
            ]
          );

          // Fetch user settings from DB
          const settingsResult = await pool.query('SELECT * FROM user_settings WHERE user_email = $1', [channel.user_email.trim().toLowerCase()]);
          const settings = settingsResult.rows[0] || {};

          // Automatically notify on any detected page changes
          if (alertType !== 'NO CHANGES') {
            // 1. Email Alert
            const emailEnabled = settings.email_alerts !== false;
            const recipient = settings.alert_email || channel.user_email;
            if (emailEnabled) {
              try {
                await sendEmail({
                  to: recipient,
                  subject: `🚨 [CHANGE DETECTED] Monitor Alert on ${channel.name}`,
                  text: `Hi there,\n\nOur automated scanner detected content modifications on monitored target: ${channel.name} (${channel.url}).\n\nDetails: ${alertDesc}\n\nReview visual diffs in your Cognify Intelligence Center.`,
                  html: `
                    <div style="font-family: sans-serif; padding: 20px; max-width: 600px; border: 1px solid #ef4444; border-radius: 12px; background-color: #fafafa; text-align: left;">
                      <h2 style="color: #ef4444; margin-top: 0;">🚨 Automated Background Scanner Alert</h2>
                      <p>Hello,</p>
                      <p>Cognify background engine detected content modifications on your monitored channel: <strong>${channel.name}</strong>.</p>
                      <table style="width: 100%; border-collapse: collapse; margin: 15px 0; text-align: left;">
                        <tr>
                          <td style="padding: 8px; border-bottom: 1px solid #e4e4e7; font-weight: bold; width: 120px;">Target URL:</td>
                          <td style="padding: 8px; border-bottom: 1px solid #e4e4e7;"><a href="${channel.url}">${channel.url}</a></td>
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
                console.error('Failed to send background scan alert email:', mailErr);
              }
            }

            // 2. Slack Dispatch
            const slackWebhook = settings.slack_webhook;
            if (slackWebhook) {
              try {
                await fetch(slackWebhook, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    text: `🚨 *[CHANGE DETECTED] Automated background scan detected change on ${channel.name}*\n*Target:* ${channel.url}\n*Change Details:* ${alertDesc}`
                  })
                });
              } catch (slackErr) {
                console.error('Failed to dispatch Slack background webhook:', slackErr);
              }
            }

            // 3. Discord Dispatch
            const discordWebhook = settings.discord_webhook;
            if (discordWebhook) {
              try {
                await fetch(discordWebhook, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    content: `🚨 **[CHANGE DETECTED] Automated background scan detected change on ${channel.name}**`,
                    embeds: [
                      {
                        title: channel.name,
                        url: channel.url,
                        description: alertDesc,
                        color: 15548997
                      }
                    ]
                  })
                });
              } catch (discordErr) {
                console.error('Failed to dispatch Discord background webhook:', discordErr);
              }
            }
          }
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

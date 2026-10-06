/**
 * lib/email-templates.ts — premium HTML email templates for QuickCash Kenya.
 *
 * All templates use inline styles (Gmail strips <style> tags from email body).
 * Logo is embedded as base64 PNG (works in Gmail, Outlook, Apple Mail).
 * Dark theme with amber/orange accents matching the website.
 */

const LOGO_BASE64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnIiB4MT0iMCIgeTE9IjAiIHgyPSI2NCIgeTI9IjY0Ij48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjZmJiZjI0Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZjk3MzE2Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PGNpcmNsZSBjeD0iMzIiIGN5PSIzMiIgcj0iMzAiIGZpbGw9IiMwODA2MGYiLz48dGV4dCB4PSIzMiIgeT0iNDQiIGZvbnQtZmFtaWx5PSJzeXN0ZW0tdWksIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMzYiIGZvbnQtd2VpZ2h0PSI5MDAiIGZpbGw9InVybCgjZykiIHRleHQtYW5jaG9yPSJtaWRkbGUiPlE8L3RleHQ+PC9zdmc+';

// Common header for all emails
function header(title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#08060f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#f5e6d3;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#08060f;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="max-width:560px;background:#0e0b1a;border-radius:24px;border:1px solid rgba(251,191,36,0.15);overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#fbbf24 0%,#f97316 100%);padding:28px 32px;text-align:center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:8px;">
                    <div style="display:inline-block;width:56px;height:56px;background:#08060f;border-radius:16px;line-height:56px;text-align:center;font-size:32px;font-weight:900;color:#fbbf24;">Q</div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-size:24px;font-weight:800;color:#08060f;letter-spacing:-0.02em;">QuickCash</td>
                </tr>
                <tr>
                  <td align="center" style="font-size:11px;color:#08060f;opacity:0.7;letter-spacing:0.2em;text-transform:uppercase;margin-top:4px;">Earn Real KES</td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 24px;">
`;
}

const footer = `            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px 32px;background:rgba(255,255,255,0.02);border-top:1px solid rgba(255,255,255,0.05);">
              <p style="font-size:11px;color:#7a6a5a;text-align:center;margin:0 0 8px 0;line-height:1.6;">
                QuickCash Kenya · Earn real KES completing tasks &amp; surveys<br>
                Powered by SwiftWallet v3 · © 2026
              </p>
              <p style="font-size:10px;color:#5a4a3a;text-align:center;margin:0;line-height:1.5;">
                If you didn't create this account, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
        <!-- Bottom margin -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td style="height:24px;font-size:1px;line-height:1px;">&nbsp;</td></tr></table>
      </td>
    </tr>
  </table>
</body>
</html>`;

// Reusable info row (icon + label + value)
function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:8px 0;font-size:14px;color:#a89a8a;">${label}</td>
    <td style="padding:8px 0;font-size:14px;color:#fbbf24;font-weight:700;text-align:right;">${value}</td>
  </tr>`;
}

// ============================================================
// Email Verification Code
// ============================================================
export function emailVerificationTemplate({ code, username, email }: { code: string; username: string; email: string }): { subject: string; html: string; text: string } {
  const subject = `Your QuickCash verification code: ${code}`;
  const html = `${header('Verify Your Email')}
              <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:800;color:#f5e6d3;letter-spacing:-0.02em;">Verify your email</h1>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#a89a8a;">
                Hi <strong style="color:#fbbf24;">${username}</strong>,<br><br>
                Welcome to QuickCash! Please use the code below to verify your email address.
                This helps us keep your account secure.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
                <tr>
                  <td style="background:linear-gradient(135deg,rgba(251,191,36,0.15),rgba(249,115,22,0.10));border:2px solid rgba(251,191,36,0.4);border-radius:16px;padding:32px 24px;text-align:center;">
                    <p style="margin:0 0 12px 0;font-size:11px;color:#a89a8a;letter-spacing:0.15em;text-transform:uppercase;">Your verification code</p>
                    <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:0.15em;color:#fbbf24;font-family:'SF Mono',Monaco,'Courier New',monospace;">${code}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#a89a8a;">
                <strong style="color:#f5e6d3;">This code expires in 10 minutes.</strong><br>
                Enter it on the verification page to continue. If you didn't request this code, you can safely ignore this email.
              </p>
              <p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#a89a8a;">
                Sent to: <span style="color:#f5e6d3;">${email}</span>
              </p>
${footer}`;
  const text = `Verify your QuickCash email\n\nHi ${username},\n\nWelcome to QuickCash! Use this verification code:\n\n${code}\n\nThis code expires in 10 minutes.\n\nSent to: ${email}`;
  return { subject, html, text };
}

// ============================================================
// Password Reset Code
// ============================================================
export function passwordResetTemplate({ code, username, email }: { code: string; username: string; email: string }): { subject: string; html: string; text: string } {
  const subject = `QuickCash password reset code: ${code}`;
  const html = `${header('Reset Your Password')}
              <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:800;color:#f5e6d3;letter-spacing:-0.02em;">Reset your password</h1>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#a89a8a;">
                Hi <strong style="color:#fbbf24;">${username}</strong>,<br><br>
                We received a request to reset the password on your QuickCash account. Use the code below to set a new password.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
                <tr>
                  <td style="background:linear-gradient(135deg,rgba(251,191,36,0.15),rgba(249,115,22,0.10));border:2px solid rgba(251,191,36,0.4);border-radius:16px;padding:32px 24px;text-align:center;">
                    <p style="margin:0 0 12px 0;font-size:11px;color:#a89a8a;letter-spacing:0.15em;text-transform:uppercase;">Your reset code</p>
                    <p style="margin:0;font-size:42px;font-weight:900;letter-spacing:0.15em;color:#fbbf24;font-family:'SF Mono',Monaco,'Courier New',monospace;">${code}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px 0;font-size:13px;line-height:1.6;color:#a89a8a;">
                <strong style="color:#f5e6d3;">This code expires in 15 minutes.</strong><br>
                If you didn't request a password reset, please ignore this email — your password remains unchanged.
              </p>
              <p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#a89a8a;">
                Sent to: <span style="color:#f5e6d3;">${email}</span>
              </p>
${footer}`;
  const text = `Reset your QuickCash password\n\nHi ${username},\n\nUse this code to reset your password:\n\n${code}\n\nThis code expires in 15 minutes.\n\nSent to: ${email}`;
  return { subject, html, text };
}

// ============================================================
// Welcome Email (after email verification)
// ============================================================
export function welcomeEmailTemplate({ username, tier, activationFee, referralCode }: { username: string; tier: string; activationFee: number; referralCode: string }): { subject: string; html: string; text: string } {
  const subject = `Welcome to QuickCash Kenya! 🎉`;
  const html = `${header('Welcome to QuickCash')}
              <h1 style="margin:0 0 12px 0;font-size:28px;font-weight:800;color:#f5e6d3;letter-spacing:-0.02em;">Welcome aboard, ${username}! 🎉</h1>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#a89a8a;">
                Your email is verified and your QuickCash account is ready. Here's what you can do next:
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background:rgba(251,191,36,0.05);border-radius:16px;border:1px solid rgba(251,191,36,0.2);">
                <tr><td style="padding:24px;">
                  <p style="margin:0 0 12px 0;font-size:11px;color:#a89a8a;letter-spacing:0.15em;text-transform:uppercase;">Your account summary</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    ${infoRow('Username', username)}
                    ${infoRow('Tier', tier.toUpperCase())}
                    ${infoRow('Activation fee', `KES ${activationFee}`)}
                    ${infoRow('Referral code', referralCode)}
                  </table>
                </td></tr>
              </table>

              <h2 style="margin:24px 0 8px 0;font-size:16px;font-weight:700;color:#fbbf24;">Next steps:</h2>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0;">
                <tr><td style="padding:8px 0;font-size:14px;line-height:1.6;color:#a89a8a;">
                  <span style="color:#fbbf24;font-weight:700;">1.</span>&nbsp;&nbsp;Activate your account — pay one-time KES ${activationFee} via M-Pesa STK push to unlock all ${tier.toUpperCase()}-tier tasks.
                </td></tr>
                <tr><td style="padding:8px 0;font-size:14px;line-height:1.6;color:#a89a8a;">
                  <span style="color:#fbbf24;font-weight:700;">2.</span>&nbsp;&nbsp;Complete tasks &amp; surveys — earn real KES credited instantly to your balance.
                </td></tr>
                <tr><td style="padding:8px 0;font-size:14px;line-height:1.6;color:#a89a8a;">
                  <span style="color:#fbbf24;font-weight:700;">3.</span>&nbsp;&nbsp;Refer friends — earn KES 10 bonus every time a friend activates.
                </td></tr>
                <tr><td style="padding:8px 0;font-size:14px;line-height:1.6;color:#a89a8a;">
                  <span style="color:#fbbf24;font-weight:700;">4.</span>&nbsp;&nbsp;Withdraw to M-Pesa — instant B2C payout, money lands in 1-2 minutes.
                </td></tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
                <tr>
                  <td style="background:linear-gradient(135deg,#fbbf24 0%,#f97316 100%);border-radius:12px;text-align:center;padding:16px 24px;">
                    <a href="https://quickcash-alpha.vercel.app/auth/activate" style="color:#08060f;text-decoration:none;font-size:15px;font-weight:700;display:block;">Activate my account →</a>
                  </td>
                </tr>
              </table>

              <p style="margin:8px 0 0 0;font-size:13px;line-height:1.6;color:#a89a8a;">
                Questions? Just reply to this email or use the chat bubble in the app.
              </p>
${footer}`;
  const text = `Welcome to QuickCash Kenya!\n\nHi ${username},\n\nYour email is verified. Activate your account (KES ${activationFee}) to start earning.\n\nUsername: ${username}\nTier: ${tier.toUpperCase()}\nReferral code: ${referralCode}\n\nHappy earning!`;
  return { subject, html, text };
}

// ============================================================
// Activation Successful Email
// ============================================================
export function activationSuccessTemplate({ username, tier }: { username: string; tier: string }): { subject: string; html: string; text: string } {
  const subject = `✅ Your ${tier.toUpperCase()} tier is active! Start earning now`;
  const html = `${header('Activation Successful')}
              <div style="text-align:center;margin:8px 0 24px;">
                <div style="display:inline-block;width:64px;height:64px;background:rgba(52,211,153,0.15);border-radius:50%;line-height:64px;text-align:center;font-size:32px;">✅</div>
              </div>
              <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:800;color:#f5e6d3;letter-spacing:-0.02em;text-align:center;">You're all set!</h1>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#a89a8a;text-align:center;">
                Hi <strong style="color:#fbbf24;">${username}</strong>, your ${tier.toUpperCase()} tier is now active.
                You can complete tasks and withdraw earnings to M-Pesa anytime.
              </p>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:24px 0;">
                <tr>
                  <td style="background:linear-gradient(135deg,#fbbf24 0%,#f97316 100%);border-radius:12px;text-align:center;padding:16px 24px;">
                    <a href="https://quickcash-alpha.vercel.app/dashboard" style="color:#08060f;text-decoration:none;font-size:15px;font-weight:700;display:block;">Browse tasks &amp; start earning →</a>
                  </td>
                </tr>
              </table>

              <p style="margin:8px 0 0 0;font-size:13px;line-height:1.6;color:#a89a8a;text-align:center;">
                Pro tip: Share your referral link to earn KES 10 for every friend who activates.
              </p>
${footer}`;
  const text = `Activation Successful!\n\nHi ${username},\n\nYour ${tier.toUpperCase()} tier is now active. Start completing tasks to earn real KES.\n\nHappy earning!`;
  return { subject, html, text };
}

// ============================================================
// Withdrawal Initiated Email
// ============================================================
export function withdrawalInitiatedTemplate({ username, amount, phone }: { username: string; amount: number; phone: string }): { subject: string; html: string; text: string } {
  const subject = `💸 Withdrawal of KES ${amount} initiated`;
  const html = `${header('Withdrawal Initiated')}
              <h1 style="margin:0 0 12px 0;font-size:24px;font-weight:800;color:#f5e6d3;letter-spacing:-0.02em;">Withdrawal in progress</h1>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#a89a8a;">
                Hi <strong style="color:#fbbf24;">${username}</strong>, your withdrawal of
                <strong style="color:#fbbf24;font-size:18px;">KES ${amount.toLocaleString()}</strong>
                has been initiated via M-Pesa B2C payout.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background:rgba(251,191,36,0.05);border-radius:16px;border:1px solid rgba(251,191,36,0.2);">
                <tr><td style="padding:24px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    ${infoRow('Amount', `KES ${amount.toLocaleString()}`)}
                    ${infoRow('Sent to', phone)}
                    ${infoRow('Method', 'M-Pesa B2C')}
                    ${infoRow('Arrival', '1-2 minutes')}
                  </table>
                </td></tr>
              </table>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#a89a8a;">
                You'll receive an M-Pesa SMS confirmation shortly. If you don't receive the money within 5 minutes, please contact support.
              </p>
${footer}`;
  const text = `Withdrawal Initiated\n\nHi ${username},\n\nKES ${amount} is being sent to ${phone} via M-Pesa. Arrives in 1-2 minutes.`;
  return { subject, html, text };
}

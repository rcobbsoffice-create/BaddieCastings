/**
 * Generates an HTML Welcome Email
 */
export function WelcomeEmailTemplate({ fullName }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h1 style="color: #ff3366;">Welcome to Baddie Castings! 👑</h1>
      <p>Hi ${fullName},</p>
      <p>We're thrilled to have you on board! You can now explore castings, connect with agencies, and manage your portfolio.</p>
      <br />
      <a href="https://baddiecastings.com/dashboard" style="background-color: #ff3366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
        Go to Dashboard
      </a>
      <p style="margin-top: 30px; font-size: 14px; color: #777;">
        Stay glowing,<br/>
        The Baddie Castings Team
      </p>
    </div>
  `;
}

/**
 * Generates an HTML Notification Email for a new application
 */
export function ApplicationNotificationTemplate({ applicantName, castingTitle }) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <h2 style="color: #ff3366;">New Application Received! 📩</h2>
      <p>Good news!</p>
      <p><strong>${applicantName}</strong> has just applied to your casting call: <strong>${castingTitle}</strong>.</p>
      <br />
      <a href="https://baddiecastings.com/dashboard/applications" style="background-color: #ff3366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
        View Application
      </a>
      <p style="margin-top: 30px; font-size: 14px; color: #777;">
        - Baddie Castings Notifications
      </p>
    </div>
  `;
}

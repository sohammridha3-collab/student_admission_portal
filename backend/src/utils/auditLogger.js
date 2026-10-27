const prisma = require('./prisma');

async function logAction({ userId, userName, userRole, action, details, req }) {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';
    await prisma.systemLog.create({
      data: {
        user_id: userId || null,
        user_name: userName || 'System',
        user_role: userRole || 'SYSTEM',
        action,
        details: typeof details === 'object' ? JSON.stringify(details) : details,
        ip_address: String(ip)
      }
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
}

async function createNotification({ userId, title, message, type = 'INFO' }) {
  try {
    return await prisma.notification.create({
      data: {
        user_id: userId,
        title,
        message,
        type
      }
    });
  } catch (error) {
    console.error('Notification Error:', error);
  }
}

module.exports = {
  logAction,
  createNotification
};

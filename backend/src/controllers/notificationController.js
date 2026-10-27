const prisma = require('../utils/prisma');

async function getNotifications(req, res) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { user_id: req.user.id },
      orderBy: { created_at: 'desc' },
      take: 25
    });

    const unreadCount = await prisma.notification.count({
      where: { user_id: req.user.id, is_read: false }
    });

    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('getNotifications error:', error);
    return res.status(500).json({ error: 'Failed to retrieve notifications.' });
  }
}

async function markAsRead(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    await prisma.notification.updateMany({
      where: { id, user_id: req.user.id },
      data: { is_read: true }
    });

    return res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    console.error('markAsRead error:', error);
    return res.status(500).json({ error: 'Failed to update notification.' });
  }
}

async function markAllAsRead(req, res) {
  try {
    await prisma.notification.updateMany({
      where: { user_id: req.user.id, is_read: false },
      data: { is_read: true }
    });

    return res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    console.error('markAllAsRead error:', error);
    return res.status(500).json({ error: 'Failed to mark all notifications as read.' });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};

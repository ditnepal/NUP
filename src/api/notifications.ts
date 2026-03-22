import express from 'express';
import { authenticate, AuthRequest } from './middleware/auth';
import prisma from '../lib/prisma';

const router = express.Router();

// @route   GET /api/v1/notifications
// @desc    Get all notifications for current user
// @access  Private
router.get('/', authenticate, async (req: AuthRequest, res) => {
  console.log('[DEBUG] GET /api/v1/notifications called by user:', req.user?.id);
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user?.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    console.log('[DEBUG] Notifications found:', notifications.length);
    res.json(notifications);
  } catch (error) {
    console.error('[DEBUG] Error in GET /api/v1/notifications:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/v1/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.patch('/:id/read', authenticate, async (req: AuthRequest, res) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id, userId: req.user?.id },
      data: { status: 'READ' },
    });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   PATCH /api/v1/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.patch('/read-all', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user?.id, status: 'UNREAD' },
      data: { status: 'READ' },
    });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   DELETE /api/v1/notifications/:id
// @desc    Delete notification
// @access  Private
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await prisma.notification.delete({
      where: { id: req.params.id, userId: req.user?.id },
    });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

import express from 'express';
import prisma from '../lib/prisma';
import { authenticate, authorize, AuthRequest } from './middleware/auth';

const router = express.Router();

// @route   GET /api/v1/renewals
// @desc    Get all renewal requests
// @access  Private (Admin only)
router.get('/', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const renewals = await prisma.renewalRequest.findMany({
      include: {
        member: {
          select: {
            id: true,
            fullName: true,
            membershipId: true,
            status: true,
            expiryDate: true,
            orgUnit: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(renewals);
  } catch (error: any) {
    console.error('Error fetching renewals:', error);
    res.status(500).json({ error: 'Server error fetching renewals' });
  }
});

// @route   POST /api/v1/renewals/:id/process
// @desc    Approve or reject a renewal request
// @access  Private (Admin only)
router.post('/:id/process', authenticate, authorize(['ADMIN', 'STAFF']), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { action, adminNote } = req.body; // action: 'APPROVE' or 'REJECT'

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const renewal = await prisma.renewalRequest.findUnique({
      where: { id },
      include: { member: true }
    });

    if (!renewal) {
      return res.status(404).json({ error: 'Renewal request not found' });
    }

    if (renewal.status !== 'PENDING') {
      return res.status(400).json({ error: 'Renewal request is already processed' });
    }

    const adminId = req.user?.id;

    if (action === 'APPROVE') {
      // Calculate new expiry date safely
      const currentExpiry = renewal.member.expiryDate;
      const now = new Date();
      let newExpiryDate: Date;

      if (currentExpiry && currentExpiry > now) {
        // Extend from existing future expiry date
        newExpiryDate = new Date(currentExpiry);
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      } else {
        // Extend from today
        newExpiryDate = new Date();
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      }

      // Perform transaction
      await prisma.$transaction([
        prisma.renewalRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            adminNote: adminNote || null,
            reviewedBy: adminId,
            reviewedAt: new Date()
          }
        }),
        prisma.member.update({
          where: { id: renewal.memberId },
          data: {
            expiryDate: newExpiryDate
          }
        })
      ]);
    } else {
      // Reject
      await prisma.renewalRequest.update({
        where: { id },
        data: {
          status: 'REJECTED',
          adminNote: adminNote || null,
          reviewedBy: adminId,
          reviewedAt: new Date()
        }
      });
    }

    const updatedRenewal = await prisma.renewalRequest.findUnique({
      where: { id },
      include: { member: true }
    });

    res.json(updatedRenewal);
  } catch (error: any) {
    console.error('Error processing renewal:', error);
    res.status(500).json({ error: 'Server error processing renewal' });
  }
});

export default router;

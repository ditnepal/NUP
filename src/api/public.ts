import express from 'express';
import bcrypt from 'bcryptjs';
import { cmsService } from '../services/cms.service';
import { membershipService } from '../services/membership.service';
import { volunteerService } from '../services/volunteer.service';
import prisma from '../lib/prisma';
import { z } from 'zod';

const router = express.Router();

// @route   GET /api/v1/public/pages/:slug
// @desc    Get a page by slug
// @access  Public
router.get('/pages/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { lang } = req.query;
    const page = await cmsService.getPageBySlug(slug, lang as string);
    if (!page) return res.status(404).json({ error: 'Page not found' });
    res.json(page);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/public/posts
// @desc    Get all posts by type
// @access  Public
router.get('/posts', async (req, res) => {
  try {
    const { type, lang } = req.query;
    const posts = await cmsService.getPosts(type as string, lang as string);
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/public/posts/:slug
// @desc    Get a post by slug
// @access  Public
router.get('/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { lang } = req.query;
    const post = await cmsService.getPostBySlug(slug, lang as string);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/public/downloads
// @desc    Get all downloads
// @access  Public
router.get('/downloads', async (req, res) => {
  try {
    const { category } = req.query;
    const downloads = await cmsService.getDownloads(category as string);
    res.json(downloads);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/public/units
// @desc    Get all organization units
// @access  Public
router.get('/units', async (req, res) => {
  try {
    const units = await prisma.organizationUnit.findMany({
      select: { id: true, name: true, level: true }
    });
    res.json(units);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/public/join
// @desc    Join membership (Public)
// @access  Public
router.post('/join', async (req, res) => {
  try {
    const member = await membershipService.apply(req.body);
    res.status(201).json({ 
      message: 'Application submitted successfully', 
      trackingCode: member.trackingCode 
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/public/volunteer
// @desc    Volunteer (Public)
// @access  Public
router.post('/volunteer', async (req, res) => {
  try {
    const volunteer = await volunteerService.register(req.body);
    res.status(201).json({ message: 'Volunteer registration successful' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/public/complaint
// @desc    Submit a complaint (Public)
// @access  Public
router.post('/complaint', async (req, res) => {
  try {
    const { title, description, category, contactInfo, province, district, localLevel, ward } = req.body;
    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        category,
        contactInfo,
        province,
        district,
        localLevel,
        ward,
        status: 'OPEN',
        priority: 'MEDIUM'
      }
    });
    res.status(201).json({ message: 'Complaint submitted successfully', issueId: issue.id });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// @route   GET /api/v1/public/membership-status
// @desc    Check membership application status
// @access  Public
router.get('/membership-status', async (req, res) => {
  const { trackingCode, mobile } = req.query;

  if (!trackingCode || !mobile) {
    return res.status(400).json({ message: 'Tracking code and mobile number are required' });
  }

  try {
    const member = await prisma.member.findFirst({
      where: {
        trackingCode: String(trackingCode),
        mobile: String(mobile),
      },
      select: {
        id: true,
        fullName: true,
        trackingCode: true,
        status: true,
        createdAt: true,
        applicationMode: true,
        terminationHistory: true,
        membershipId: true,
        userId: true,
        email: true,
        orgUnit: {
          select: {
            name: true
          }
        }
      },
    });

    if (!member) {
      return res.status(404).json({ message: 'Application not found with provided details' });
    }

    let rejectionReason = null;
    if ((member.status === 'REJECTED' || member.status === 'TERMINATED' || member.status === 'SUSPENDED') && member.terminationHistory) {
      try {
        const history = JSON.parse(member.terminationHistory);
        if (Array.isArray(history) && history.length > 0) {
          rejectionReason = history[history.length - 1].reason;
        }
      } catch (e) {
        console.error('Error parsing termination history:', e);
      }
    }

    res.json({
      ...member,
      rejectionReason,
      hasAccount: !!member.userId
    });
  } catch (error) {
    console.error('Error checking membership status:', error);
    res.status(500).json({ message: 'Failed to check status' });
  }
});

// @route   POST /api/v1/public/membership-claim
// @desc    Claim member account (set password)
// @access  Public
router.post('/membership-claim', async (req, res) => {
  const { trackingCode, mobile, email, password } = req.body;

  if (!trackingCode || !mobile || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // 1. Find the member
    const member = await prisma.member.findFirst({
      where: {
        trackingCode,
        mobile,
        status: 'ACTIVE'
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Active membership not found with provided details' });
    }

    // If member has an email, verify it matches the provided email
    if (member.email && member.email !== email) {
      return res.status(400).json({ error: 'Provided email does not match registered email' });
    }

    if (member.userId) {
      return res.status(400).json({ error: 'Account already claimed' });
    }

    // 2. Check if user with this email already exists
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      // If user exists but not linked, we link it if it's not already a member
      if (user.role === 'MEMBER') {
        return res.status(400).json({ error: 'User account already exists and is linked to a member' });
      }
    } else {
      // 3. Create new user
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          displayName: member.fullName,
          phoneNumber: member.mobile,
          role: 'MEMBER',
          isActive: true
        }
      });
    }

    // 4. Link member to user and update email if missing
    await prisma.member.update({
      where: { id: member.id },
      data: { 
        userId: user.id,
        ...(member.email ? {} : { email })
      }
    });

    res.json({ message: 'Account claimed successfully. You can now log in.' });
  } catch (error) {
    console.error('Error claiming membership:', error);
    res.status(500).json({ error: 'Failed to claim account' });
  }
});

export default router;

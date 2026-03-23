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

// @route   GET /api/v1/public/pages/id/:id
// @desc    Get a page by ID
// @access  Public
router.get('/pages/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const page = await cmsService.getPageById(id);
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
    const { type, lang, categoryId } = req.query;
    const posts = await cmsService.getPosts(type as string, lang as string, categoryId as string);
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

// @route   GET /api/v1/public/posts/id/:id
// @desc    Get a post by ID
// @access  Public
router.get('/posts/id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await cmsService.getPostById(id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/public/categories
// @desc    Get all categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const { type } = req.query;
    const categories = await prisma.cmsCategory.findMany({
      where: type ? { type: type as string } : {},
      orderBy: { name: 'asc' }
    });
    res.json(categories);
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

const membershipStatusSchema = z.object({
  trackingCode: z.string().min(1, "Tracking code is required"),
  mobileNumber: z.string().min(1, "Mobile number is required")
});

// @route   POST /api/v1/public/membership-status
// @desc    Check membership application status
// @access  Public
router.post('/membership-status', async (req, res) => {
  try {
    const input = membershipStatusSchema.parse(req.body);

    console.log('[DEBUG] Membership Status Lookup:', {
      trackingCode: input.trackingCode,
      mobileNumber: input.mobileNumber
    });

    const member = await prisma.member.findFirst({
      where: {
        trackingCode: input.trackingCode,
        mobile: input.mobileNumber,
      },
    });

    console.log('[DEBUG] Query Result:', member ? `Found: ${member.id}` : 'Not found');

    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
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

    return res.json({
      success: true,
      status: member.status,
      fullName: member.fullName,
      trackingCode: member.trackingCode,
      applicationMode: member.applicationMode,
      rejectionReason: rejectionReason || null,
      email: member.email,
      hasAccount: !!member.userId
    });
  } catch (error) {
    console.error('Error checking membership status:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: error.issues[0].message });
    }
    return res.status(500).json({ success: false, message: 'An error occurred while checking application status' });
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

import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { cmsService } from '../services/cms.service';
import { membershipService } from '../services/membership.service';
import { volunteerService } from '../services/volunteer.service';
import { financeService } from '../services/finance.service';
import prisma from '../lib/prisma';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { authenticate, AuthRequest } from './middleware/auth';

const router = express.Router();

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp', 
      'video/mp4', 'video/quicktime', 'video/x-msvideo',
      'application/pdf'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and PDFs are allowed.'));
    }
  }
});

const memberApplySchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email().optional().or(z.literal('')),
  mobile: z.string().optional().or(z.literal('')),
  citizenshipNumber: z.string().min(5, "Citizenship number must be at least 5 characters").optional().or(z.literal('')),
  dateOfBirth: z.preprocess((val) => val ? new Date(val as string) : undefined, z.date().optional()),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  fatherName: z.string().optional().or(z.literal('')),
  motherName: z.string().optional().or(z.literal('')),
  citizenshipDistrict: z.string().optional().or(z.literal('')),
  citizenshipIssueDate: z.preprocess((val) => val ? new Date(val as string) : undefined, z.date().optional()),
  province: z.string().optional().or(z.literal('')),
  district: z.string().optional().or(z.literal('')),
  localLevel: z.string().optional().or(z.literal('')),
  ward: z.preprocess((val) => val ? parseInt(val as string) : undefined, z.number().optional()),
  tole: z.string().optional().or(z.literal('')),
  alternateContactName: z.string().optional().or(z.literal('')),
  alternateContactMobile: z.string().optional().or(z.literal('')),
  occupation: z.string().optional().or(z.literal('')),
  applicationMode: z.enum(['FORM', 'VIDEO', 'ASSISTED']).default('FORM'),
  orgUnitId: z.string().min(1, "Organization Unit is required"),
  identityDocumentType: z.string().optional().or(z.literal('')),
  helperName: z.string().optional().or(z.literal('')),
  helperPhone: z.string().optional().or(z.literal('')),
  helperRole: z.string().optional().or(z.literal('')),
  declaration: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  paymentMethod: z.string().optional().or(z.literal('')),
});

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
  } catch (error: any) {
    console.error('[Public API] Error fetching page by slug:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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
  } catch (error: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/public/posts
// @desc    Get all posts by type
// @access  Public
router.get('/posts', async (req, res) => {
  try {
    const { type, lang, categoryId, limit } = req.query;
    const posts = await cmsService.getPosts(type as string, lang as string, categoryId as string, limit ? Number(limit) : undefined);
    res.json(posts);
  } catch (error: any) {
    console.error('[Public API] Error fetching posts:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
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
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
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
  } catch (error: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST /api/v1/public/membership/apply
// @desc    Submit membership application (Public)
// @access  Public
router.post('/membership/apply', upload.fields([
  { name: 'identityDocument', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    // 1. Validate fields with Zod
    const validatedData = memberApplySchema.parse(req.body);
    
    // 2. Extract files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } || {};
    const identityDocument = files['identityDocument']?.[0];
    const profilePhoto = files['profilePhoto']?.[0];
    const video = files['video']?.[0];
    
    // 3. Mode-specific file validation
    if (validatedData.applicationMode === 'FORM') {
      if (!identityDocument) return res.status(400).json({ error: 'Identity document is required for FORM applications' });
      if (!profilePhoto) return res.status(400).json({ error: 'Profile photo is required for FORM applications' });
    } else if (validatedData.applicationMode === 'VIDEO') {
      if (!video) return res.status(400).json({ error: 'Video submission is required for VIDEO applications' });
    } else if (validatedData.applicationMode === 'ASSISTED') {
      if (!identityDocument) return res.status(400).json({ error: 'Identity document is required for ASSISTED applications' });
    }

    // 4. Check for logged in user (optional linking)
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-nup-os-2026';
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        userId = decoded.id;
      } catch (e) {
        // Ignore invalid token for public application
      }
    }

    // 5. Merge data for service
    const applicationData = {
      ...validatedData,
      identityDocumentUrl: identityDocument ? `/uploads/${identityDocument.filename}` : undefined,
      profilePhotoUrl: profilePhoto ? `/uploads/${profilePhoto.filename}` : undefined,
      videoUrl: video ? `/uploads/${video.filename}` : undefined,
      userId,
    };

    const result = await membershipService.apply(applicationData as any);

    // Initiate manual payment if applicable
    if (validatedData.paymentMethod) {
      const integrations = await financeService.listPublicPaymentIntegrations('MEMBERSHIP');
      const selectedMethod = integrations.find(i => i.provider === validatedData.paymentMethod);
      
      if (selectedMethod && selectedMethod.isManual) {
        await financeService.initiateManualPayment({
          module: 'MEMBERSHIP',
          amount: 0, // Placeholder
          paymentMethod: validatedData.paymentMethod,
          description: `Membership application fee for ${validatedData.fullName}`,
          memberId: result.member.id,
          orgUnitId: result.member.orgUnitId,
          recordedById: userId,
        });
      }
    }

    res.status(201).json({ 
      trackingCode: result.member.trackingCode,
      credentials: result.credentials
    });
  } catch (error: any) {
    console.error('Public membership application error:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: error.issues });
    }
    res.status(400).json({ error: error.message });
  }
});

// @route   POST /api/v1/public/volunteer
// @desc    Volunteer (Public)
// @access  Public
router.post('/volunteer', async (req, res) => {
  try {
    const application = await volunteerService.apply(req.body);
    res.status(201).json({ message: 'Volunteer application submitted successfully' });
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

// @route   GET /api/v1/public/candidates
// @desc    Get public candidates
// @access  Public
router.get('/candidates', async (req, res) => {
  try {
    const candidates = await prisma.candidate.findMany({
      where: {
        status: 'ACTIVE'
      },
      include: {
        constituency: {
          select: {
            name: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    });
    res.json(candidates);
  } catch (error) {
    console.error('Error fetching public candidates:', error);
    res.json([]);
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

    const member = await prisma.member.findFirst({
      where: {
        trackingCode: input.trackingCode,
        mobile: input.mobileNumber,
      },
      include: {
        orgUnit: {
          select: {
            name: true
          }
        }
      }
    });

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
      decisionNotes: member.reviewNote || null,
      email: member.email,
      mobile: member.mobile,
      citizenshipNumber: member.citizenshipNumber,
      province: member.province,
      district: member.district,
      localLevel: member.localLevel,
      ward: member.ward,
      identityDocumentType: member.identityDocumentType,
      paymentMethod: member.paymentMethod,
      createdAt: member.createdAt,
      orgUnit: member.orgUnit,
      hasAccount: !!member.userId
    });
  } catch (error: any) {
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
          role: 'APPLICANT_MEMBER',
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
  } catch (error: any) {
    console.error('Error claiming membership:', error);
    res.status(500).json({ error: 'Failed to claim account' });
  }
});

// @route   GET /api/v1/public/surveys
// @desc    Get public surveys by placement
// @access  Public
router.get('/surveys', async (req, res) => {
  try {
    const { placementType, targetSlug } = req.query;
    const surveys = await prisma.survey.findMany({
      where: {
        status: 'ACTIVE',
        audience: 'PUBLIC',
        placementType: placementType as string || undefined,
        targetSlug: targetSlug as string || undefined,
      },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedSurveys = surveys.map(s => ({
      ...s,
      questions: s.questions.map(q => ({
        ...q,
        options: q.options ? JSON.parse(q.options) : []
      }))
    }));

    res.json(formattedSurveys);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/public/polls
// @desc    Get public polls by placement
// @access  Public
router.get('/polls', async (req, res) => {
  try {
    const { placementType, targetSlug } = req.query;
    const polls = await prisma.poll.findMany({
      where: {
        status: 'ACTIVE',
        audience: 'PUBLIC',
        placementType: placementType as string || undefined,
        targetSlug: targetSlug as string || undefined,
      },
      include: {
        options: true,
        _count: { select: { votes: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(polls);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   GET /api/v1/public/sections
// @desc    Get all enabled sections for homepage
// @access  Public
router.get('/sections', async (req, res) => {
  try {
    const sections = await prisma.cmsSection.findMany({
      where: { isEnabled: true },
      include: {
        items: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { order: 'asc' }
    });
    res.json(sections);
  } catch (error: any) {
    console.error('[Public API] Error fetching sections:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// @route   GET /api/v1/public/config
// @desc    Get public system configurations
// @access  Public
router.get('/config', async (req, res) => {
  const keys = ['PARTY_NAME', 'PARTY_TAGLINE', 'CONTACT_EMAIL', 'CONTACT_PHONE', 'DEFAULT_LANGUAGE'];
  const defaultValues: Record<string, string> = {
    PARTY_NAME: 'Progressive People\'s Organization',
    PARTY_TAGLINE: 'Empowering Citizens, Building the Future',
    CONTACT_EMAIL: 'info@ppos.org',
    CONTACT_PHONE: '+977-1-0000000',
    DEFAULT_LANGUAGE: 'en'
  };

  try {
    const configs = await prisma.systemConfig.findMany({
      where: { key: { in: keys } }
    });
    
    const configMap = configs.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, { ...defaultValues } as Record<string, string>);

    res.json(configMap);
  } catch (error: any) {
    console.error('[Public API] Error fetching config:', error.code, error.meta, error);
    // Return safe defaults on error instead of failing hard
    res.json(defaultValues);
  }
});

// @route   GET /api/v1/public/my-application
// @desc    Get the application linked to the logged-in user
// @access  Private (Applicant Member)
router.get('/my-application', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const member = await prisma.member.findFirst({
      where: { userId },
      include: {
        orgUnit: {
          select: { name: true }
        }
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(member);
  } catch (error: any) {
    console.error('Error fetching my application:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;

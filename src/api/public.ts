import express from 'express';
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

export default router;

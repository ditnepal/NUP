import express from 'express';
import { systemConfigService } from '../services/systemConfig.service';
import { auditService } from '../services/audit.service';
import { z } from 'zod';

const router = express.Router();

// @route   GET /api/v1/system-config
// @desc    Get all system configurations
// @access  Admin
router.get('/', async (req, res) => {
  try {
    const configs = await systemConfigService.getAll();
    res.json(configs);
  } catch (error: any) {
    console.error('[SystemConfig API] Error fetching configs:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// @route   POST /api/v1/system-config
// @desc    Update system configurations
// @access  Admin
router.post('/', async (req, res) => {
  try {
    const { configs, decisionNote } = req.body;
    const userId = (req as any).user?.id || 'SYSTEM';

    if (!Array.isArray(configs)) {
      return res.status(400).json({ error: 'Configs must be an array' });
    }

    // Update each config
    for (const config of configs) {
      const { key, value, description } = config;
      await systemConfigService.setConfig(key, value, description, userId);
    }

    // Audit log
    await auditService.log({
      userId,
      action: 'UPDATE_SYSTEM_CONFIG',
      resourceType: 'SYSTEM_CONFIG',
      resourceId: 'GLOBAL',
      details: `Updated ${configs.length} system settings.`,
      decisionNote: decisionNote || 'System settings update'
    });

    res.json({ success: true, message: 'System configurations updated successfully' });
  } catch (error: any) {
    console.error('[SystemConfig API] Error updating configs:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// @route   POST /api/v1/system-config/initialize
// @desc    Initialize default configurations
// @access  Admin
router.post('/initialize', async (req, res) => {
  try {
    await systemConfigService.initializeDefaults();
    res.json({ success: true, message: 'Default configurations initialized' });
  } catch (error: any) {
    console.error('[SystemConfig API] Error initializing defaults:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

export default router;

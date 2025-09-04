const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { auth, requirePermission, authorizeFacility } = require('../middleware/auth');
const metrcService = require('../services/metrcService');
const Metrc = require('../models/Metrc');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Test METRC connection
 * POST /api/compliance/metrc/test
 */
router.post('/metrc/test', auth, requirePermission('compliance:read'), asyncHandler(async (req, res) => {
  const { user_api_key } = req.body;

  if (!user_api_key) {
    return res.status(400).json({
      success: false,
      message: 'User API key is required'
    });
  }

  const result = await metrcService.testConnection(user_api_key);

  res.json({
    success: result.success,
    data: result,
    message: result.message
  });
}));

/**
 * Get METRC facilities
 * GET /api/compliance/metrc/facilities
 */
router.get('/metrc/facilities', auth, requirePermission('compliance:read'), asyncHandler(async (req, res) => {
  const { user_api_key } = req.query;

  if (!user_api_key) {
    return res.status(400).json({
      success: false,
      message: 'User API key is required'
    });
  }

  const facilities = await metrcService.getFacilities(user_api_key);

  res.json({
    success: true,
    data: facilities
  });
}));

/**
 * Sync data from METRC
 * POST /api/compliance/metrc/sync
 */
router.post('/metrc/sync', auth, requirePermission('compliance:update'), asyncHandler(async (req, res) => {
  const { user_api_key, facility_license, sync_options = {} } = req.body;

  if (!user_api_key || !facility_license) {
    return res.status(400).json({
      success: false,
      message: 'User API key and facility license are required'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, req.user.facility_id);

  try {
    // Perform sync
    const syncResults = await metrcService.syncData(user_api_key, facility_license, sync_options);

    // Log sync operation
    await Metrc.logSync(
      req.user.facility_id,
      req.user.id,
      'full_sync',
      syncResults,
      'success'
    );

    // Store synced data if available
    if (sync_options.storePlants && syncResults.plants > 0) {
      const plants = await metrcService.getPlants(user_api_key, facility_license);
      await Metrc.storePlantData(req.user.facility_id, plants);
    }

    if (sync_options.storeHarvests && syncResults.harvests > 0) {
      const harvests = await metrcService.getHarvests(user_api_key, facility_license);
      await Metrc.storeHarvestData(req.user.facility_id, harvests);
    }

    if (sync_options.storePackages && syncResults.packages > 0) {
      const packages = await metrcService.getPackages(user_api_key, facility_license);
      await Metrc.storePackageData(req.user.facility_id, packages);
    }

    logger.info(`User ${req.user.username} completed METRC sync for facility ${facility_license}`);

    res.json({
      success: true,
      data: syncResults,
      message: 'METRC sync completed successfully'
    });
  } catch (error) {
    // Log sync error
    await Metrc.logSync(
      req.user.facility_id,
      req.user.id,
      'full_sync',
      { error: error.message },
      'error',
      error.message
    );

    throw error;
  }
}));

/**
 * Get METRC plants
 * GET /api/compliance/metrc/plants
 */
router.get('/metrc/plants', auth, requirePermission('compliance:read'), asyncHandler(async (req, res) => {
  const { user_api_key, facility_license, ...options } = req.query;

  if (!user_api_key || !facility_license) {
    return res.status(400).json({
      success: false,
      message: 'User API key and facility license are required'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, req.user.facility_id);

  const plants = await metrcService.getPlants(user_api_key, facility_license, options);

  res.json({
    success: true,
    data: plants
  });
}));

/**
 * Get METRC harvests
 * GET /api/compliance/metrc/harvests
 */
router.get('/metrc/harvests', auth, requirePermission('compliance:read'), asyncHandler(async (req, res) => {
  const { user_api_key, facility_license, ...options } = req.query;

  if (!user_api_key || !facility_license) {
    return res.status(400).json({
      success: false,
      message: 'User API key and facility license are required'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, req.user.facility_id);

  const harvests = await metrcService.getHarvests(user_api_key, facility_license, options);

  res.json({
    success: true,
    data: harvests
  });
}));

/**
 * Get METRC packages
 * GET /api/compliance/metrc/packages
 */
router.get('/metrc/packages', auth, requirePermission('compliance:read'), asyncHandler(async (req, res) => {
  const { user_api_key, facility_license, ...options } = req.query;

  if (!user_api_key || !facility_license) {
    return res.status(400).json({
      success: false,
      message: 'User API key and facility license are required'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, req.user.facility_id);

  const packages = await metrcService.getPackages(user_api_key, facility_license, options);

  res.json({
    success: true,
    data: packages
  });
}));

/**
 * Create plant batches from seeds
 * POST /api/compliance/metrc/plants/create-from-seeds
 */
router.post('/metrc/plants/create-from-seeds', auth, requirePermission('compliance:update'), asyncHandler(async (req, res) => {
  const { user_api_key, facility_license, batches } = req.body;

  if (!user_api_key || !facility_license || !batches) {
    return res.status(400).json({
      success: false,
      message: 'User API key, facility license, and batches are required'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, req.user.facility_id);

  const result = await metrcService.createPlantBatchesFromSeeds(user_api_key, facility_license, batches);

  // Log the operation
  await Metrc.logSync(
    req.user.facility_id,
    req.user.id,
    'create_plant_batches_seeds',
    { batches_count: batches.length },
    'success'
  );

  logger.info(`User ${req.user.username} created ${batches.length} plant batches from seeds in METRC`);

  res.json({
    success: true,
    data: result,
    message: 'Plant batches created successfully'
  });
}));

/**
 * Create plant batches from clones
 * POST /api/compliance/metrc/plants/create-from-clones
 */
router.post('/metrc/plants/create-from-clones', auth, requirePermission('compliance:update'), asyncHandler(async (req, res) => {
  const { user_api_key, facility_license, batches } = req.body;

  if (!user_api_key || !facility_license || !batches) {
    return res.status(400).json({
      success: false,
      message: 'User API key, facility license, and batches are required'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, req.user.facility_id);

  const result = await metrcService.createPlantBatchesFromClones(user_api_key, facility_license, batches);

  // Log the operation
  await Metrc.logSync(
    req.user.facility_id,
    req.user.id,
    'create_plant_batches_clones',
    { batches_count: batches.length },
    'success'
  );

  logger.info(`User ${req.user.username} created ${batches.length} plant batches from clones in METRC`);

  res.json({
    success: true,
    data: result,
    message: 'Plant batches created successfully'
  });
}));

/**
 * Change plant growth phases
 * POST /api/compliance/metrc/plants/change-growth-phases
 */
router.post('/metrc/plants/change-growth-phases', auth, requirePermission('compliance:update'), asyncHandler(async (req, res) => {
  const { user_api_key, facility_license, changes } = req.body;

  if (!user_api_key || !facility_license || !changes) {
    return res.status(400).json({
      success: false,
      message: 'User API key, facility license, and changes are required'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, req.user.facility_id);

  const result = await metrcService.changePlantGrowthPhases(user_api_key, facility_license, changes);

  // Log the operation
  await Metrc.logSync(
    req.user.facility_id,
    req.user.id,
    'change_growth_phases',
    { changes_count: changes.length },
    'success'
  );

  logger.info(`User ${req.user.username} changed growth phases for ${changes.length} plants in METRC`);

  res.json({
    success: true,
    data: result,
    message: 'Plant growth phases changed successfully'
  });
}));

/**
 * Move plants
 * POST /api/compliance/metrc/plants/move
 */
router.post('/metrc/plants/move', auth, requirePermission('compliance:update'), asyncHandler(async (req, res) => {
  const { user_api_key, facility_license, moves } = req.body;

  if (!user_api_key || !facility_license || !moves) {
    return res.status(400).json({
      success: false,
      message: 'User API key, facility license, and moves are required'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, req.user.facility_id);

  const result = await metrcService.movePlants(user_api_key, facility_license, moves);

  // Log the operation
  await Metrc.logSync(
    req.user.facility_id,
    req.user.id,
    'move_plants',
    { moves_count: moves.length },
    'success'
  );

  logger.info(`User ${req.user.username} moved ${moves.length} plants in METRC`);

  res.json({
    success: true,
    data: result,
    message: 'Plants moved successfully'
  });
}));

/**
 * Create harvest
 * POST /api/compliance/metrc/harvests/create
 */
router.post('/metrc/harvests/create', auth, requirePermission('compliance:update'), asyncHandler(async (req, res) => {
  const { user_api_key, facility_license, harvests } = req.body;

  if (!user_api_key || !facility_license || !harvests) {
    return res.status(400).json({
      success: false,
      message: 'User API key, facility license, and harvests are required'
    });
  }

  // Authorize facility access
  await authorizeFacility(req, req.user.facility_id);

  const result = await metrcService.createHarvest(user_api_key, facility_license, harvests);

  // Log the operation
  await Metrc.logSync(
    req.user.facility_id,
    req.user.id,
    'create_harvest',
    { harvests_count: harvests.length },
    'success'
  );

  logger.info(`User ${req.user.username} created ${harvests.length} harvests in METRC`);

  res.json({
    success: true,
    data: result,
    message: 'Harvests created successfully'
  });
}));

/**
 * Get sync history
 * GET /api/compliance/metrc/sync-history
 */
router.get('/metrc/sync-history', auth, requirePermission('compliance:read'), asyncHandler(async (req, res) => {
  const {
    sync_type,
    status,
    from_date,
    to_date,
    page = 1,
    limit = 50
  } = req.query;

  // Authorize facility access
  await authorizeFacility(req, req.user.facility_id);

  const options = {
    sync_type,
    status,
    from_date,
    to_date,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  };

  const history = await Metrc.getSyncHistory(req.user.facility_id, options);

  res.json({
    success: true,
    data: history,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: history.length
    }
  });
}));

/**
 * Get sync statistics
 * GET /api/compliance/metrc/sync-stats
 */
router.get('/metrc/sync-stats', auth, requirePermission('compliance:read'), asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  // Authorize facility access
  await authorizeFacility(req, req.user.facility_id);

  const stats = await Metrc.getSyncStats(req.user.facility_id, parseInt(days));

  res.json({
    success: true,
    data: stats
  });
}));

/**
 * Get stored METRC plants
 * GET /api/compliance/metrc/stored/plants
 */
router.get('/metrc/stored/plants', auth, requirePermission('compliance:read'), asyncHandler(async (req, res) => {
  const {
    state,
    growth_phase,
    strain_name,
    location_name,
    page = 1,
    limit = 50
  } = req.query;

  // Authorize facility access
  await authorizeFacility(req, req.user.facility_id);

  const options = {
    state,
    growth_phase,
    strain_name,
    location_name,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  };

  const plants = await Metrc.getMetrcPlants(req.user.facility_id, options);

  res.json({
    success: true,
    data: plants,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: plants.length
    }
  });
}));

/**
 * Get stored METRC harvests
 * GET /api/compliance/metrc/stored/harvests
 */
router.get('/metrc/stored/harvests', auth, requirePermission('compliance:read'), asyncHandler(async (req, res) => {
  const {
    harvest_type,
    is_finished,
    page = 1,
    limit = 50
  } = req.query;

  // Authorize facility access
  await authorizeFacility(req, req.user.facility_id);

  const options = {
    harvest_type,
    is_finished: is_finished !== undefined ? is_finished === 'true' : undefined,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  };

  const harvests = await Metrc.getMetrcHarvests(req.user.facility_id, options);

  res.json({
    success: true,
    data: harvests,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: harvests.length
    }
  });
}));

/**
 * Get stored METRC packages
 * GET /api/compliance/metrc/stored/packages
 */
router.get('/metrc/stored/packages', auth, requirePermission('compliance:read'), asyncHandler(async (req, res) => {
  const {
    package_type,
    is_finished,
    is_in_transit,
    item_name,
    page = 1,
    limit = 50
  } = req.query;

  // Authorize facility access
  await authorizeFacility(req, req.user.facility_id);

  const options = {
    package_type,
    is_finished: is_finished !== undefined ? is_finished === 'true' : undefined,
    is_in_transit: is_in_transit !== undefined ? is_in_transit === 'true' : undefined,
    item_name,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  };

  const packages = await Metrc.getMetrcPackages(req.user.facility_id, options);

  res.json({
    success: true,
    data: packages,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: packages.length
    }
  });
}));

module.exports = router;
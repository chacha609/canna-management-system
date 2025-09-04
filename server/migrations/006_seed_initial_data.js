/**
 * Migration: Seed Initial Data
 * Populates database with default roles, system tags, and foundational data
 */

exports.up = function(knex) {
  return knex.transaction(async (trx) => {
    // Insert default roles
    await trx('roles').insert([
      {
        name: 'super_admin',
        display_name: 'Super Administrator',
        description: 'Full system access across all facilities',
        permissions: JSON.stringify([
          'facility.manage', 'user.manage', 'role.manage', 'system.configure',
          'plant.manage', 'batch.manage', 'task.manage', 'inventory.manage',
          'compliance.manage', 'report.view', 'integration.manage'
        ]),
        is_active: true
      },
      {
        name: 'facility_manager',
        display_name: 'Facility Manager',
        description: 'Full facility management access',
        permissions: JSON.stringify([
          'plant.manage', 'batch.manage', 'task.manage', 'inventory.manage',
          'compliance.view', 'report.view', 'user.view', 'room.manage'
        ]),
        is_active: true
      },
      {
        name: 'cultivation_manager',
        display_name: 'Cultivation Manager',
        description: 'Cultivation operations management',
        permissions: JSON.stringify([
          'plant.manage', 'batch.manage', 'task.cultivation', 'room.view',
          'environmental.view', 'inventory.view'
        ]),
        is_active: true
      },
      {
        name: 'grower',
        display_name: 'Grower',
        description: 'Plant care and cultivation tasks',
        permissions: JSON.stringify([
          'plant.view', 'plant.update', 'batch.view', 'task.execute',
          'environmental.view', 'inventory.view'
        ]),
        is_active: true
      },
      {
        name: 'processor',
        display_name: 'Processor',
        description: 'Post-harvest processing operations',
        permissions: JSON.stringify([
          'processing.manage', 'inventory.update', 'task.execute',
          'batch.view', 'waste.log'
        ]),
        is_active: true
      },
      {
        name: 'quality_assurance',
        display_name: 'Quality Assurance',
        description: 'Quality control and compliance oversight',
        permissions: JSON.stringify([
          'qa.manage', 'compliance.manage', 'test.manage', 'batch.approve',
          'inventory.view', 'report.view'
        ]),
        is_active: true
      },
      {
        name: 'inventory_manager',
        display_name: 'Inventory Manager',
        description: 'Inventory and supply chain management',
        permissions: JSON.stringify([
          'inventory.manage', 'supplier.manage', 'order.manage',
          'report.inventory', 'waste.view'
        ]),
        is_active: true
      },
      {
        name: 'compliance_officer',
        display_name: 'Compliance Officer',
        description: 'Regulatory compliance and reporting',
        permissions: JSON.stringify([
          'compliance.manage', 'metrc.manage', 'report.compliance',
          'audit.view', 'waste.view', 'test.view'
        ]),
        is_active: true
      },
      {
        name: 'viewer',
        display_name: 'Viewer',
        description: 'Read-only access to system data',
        permissions: JSON.stringify([
          'plant.view', 'batch.view', 'task.view', 'inventory.view',
          'report.view', 'environmental.view'
        ]),
        is_active: true
      }
    ]);

    // Insert system tags for growth stages
    const growthStageTags = await trx('system_tags').insert([
      { name: 'Seedling', category: 'growth_stage', color: '#10B981', description: 'Newly sprouted plants', is_system_tag: true },
      { name: 'Clone', category: 'growth_stage', color: '#06B6D4', description: 'Cloned plants', is_system_tag: true },
      { name: 'Vegetative', category: 'growth_stage', color: '#22C55E', description: 'Vegetative growth phase', is_system_tag: true },
      { name: 'Pre-Flower', category: 'growth_stage', color: '#F59E0B', description: 'Pre-flowering stage', is_system_tag: true },
      { name: 'Flower', category: 'growth_stage', color: '#EF4444', description: 'Flowering stage', is_system_tag: true },
      { name: 'Late Flower', category: 'growth_stage', color: '#8B5CF6', description: 'Late flowering stage', is_system_tag: true },
      { name: 'Harvest Ready', category: 'growth_stage', color: '#F97316', description: 'Ready for harvest', is_system_tag: true }
    ]).returning('id');

    // Insert system tags for processing stages
    await trx('system_tags').insert([
      { name: 'Fresh Harvest', category: 'processing_stage', color: '#84CC16', description: 'Freshly harvested material', is_system_tag: true },
      { name: 'Drying', category: 'processing_stage', color: '#F59E0B', description: 'In drying process', is_system_tag: true },
      { name: 'Curing', category: 'processing_stage', color: '#8B5CF6', description: 'In curing process', is_system_tag: true },
      { name: 'Trimming', category: 'processing_stage', color: '#06B6D4', description: 'Being trimmed', is_system_tag: true },
      { name: 'QC Hold', category: 'processing_stage', color: '#EF4444', description: 'On quality control hold', is_system_tag: true },
      { name: 'Ready for Package', category: 'processing_stage', color: '#10B981', description: 'Ready for packaging', is_system_tag: true }
    ]);

    // Insert system tags for quality grades
    await trx('system_tags').insert([
      { name: 'Grade A', category: 'quality', color: '#10B981', description: 'Premium quality', is_system_tag: true },
      { name: 'Grade B', category: 'quality', color: '#F59E0B', description: 'Standard quality', is_system_tag: true },
      { name: 'Premium', category: 'quality', color: '#8B5CF6', description: 'Premium grade', is_system_tag: true },
      { name: 'Standard', category: 'quality', color: '#6B7280', description: 'Standard grade', is_system_tag: true },
      { name: 'Defective', category: 'quality', color: '#EF4444', description: 'Defective material', is_system_tag: true },
      { name: 'Quarantine', category: 'quality', color: '#DC2626', description: 'Quarantined material', is_system_tag: true }
    ]);

    // Insert system tags for treatments
    await trx('system_tags').insert([
      { name: 'IPM Treated', category: 'treatment', color: '#F59E0B', description: 'Integrated pest management treatment applied', is_system_tag: true },
      { name: 'Nutrient Deficient', category: 'treatment', color: '#EF4444', description: 'Showing nutrient deficiency', is_system_tag: true },
      { name: 'Recovery', category: 'treatment', color: '#10B981', description: 'Recovering from treatment', is_system_tag: true },
      { name: 'Special Care', category: 'treatment', color: '#8B5CF6', description: 'Requires special attention', is_system_tag: true },
      { name: 'Experimental', category: 'treatment', color: '#06B6D4', description: 'Part of experimental program', is_system_tag: true }
    ]);

    // Insert system tags for compliance
    await trx('system_tags').insert([
      { name: 'METRC Tagged', category: 'compliance', color: '#10B981', description: 'Tagged in METRC system', is_system_tag: true },
      { name: 'Tested', category: 'compliance', color: '#06B6D4', description: 'Lab testing completed', is_system_tag: true },
      { name: 'Approved', category: 'compliance', color: '#22C55E', description: 'Approved for sale', is_system_tag: true },
      { name: 'On Hold', category: 'compliance', color: '#F59E0B', description: 'On compliance hold', is_system_tag: true },
      { name: 'Destroyed', category: 'compliance', color: '#EF4444', description: 'Destroyed per regulations', is_system_tag: true }
    ]);

    // Insert default inventory categories
    await trx('inventory_categories').insert([
      { name: 'Seeds', category_type: 'raw_materials', description: 'Cannabis seeds for cultivation' },
      { name: 'Clones', category_type: 'raw_materials', description: 'Cannabis clones and cuttings' },
      { name: 'Nutrients', category_type: 'raw_materials', description: 'Plant nutrients and fertilizers' },
      { name: 'Growing Media', category_type: 'raw_materials', description: 'Soil, coco, hydroponic media' },
      { name: 'Fresh Flower', category_type: 'in_process', description: 'Freshly harvested cannabis flower' },
      { name: 'Dried Flower', category_type: 'in_process', description: 'Dried cannabis flower' },
      { name: 'Trim', category_type: 'in_process', description: 'Cannabis trim material' },
      { name: 'Packaged Flower', category_type: 'finished_goods', description: 'Packaged cannabis flower products' },
      { name: 'Pre-Rolls', category_type: 'finished_goods', description: 'Pre-rolled cannabis products' },
      { name: 'Concentrates', category_type: 'finished_goods', description: 'Cannabis concentrate products' },
      { name: 'Cultivation Equipment', category_type: 'equipment', description: 'Growing and cultivation equipment' },
      { name: 'Processing Equipment', category_type: 'equipment', description: 'Post-harvest processing equipment' },
      { name: 'Packaging Materials', category_type: 'consumables', description: 'Packaging and labeling materials' },
      { name: 'Cleaning Supplies', category_type: 'consumables', description: 'Facility cleaning and sanitation supplies' }
    ]);

    // Insert default task templates
    await trx('task_templates').insert([
      {
        name: 'Daily Plant Inspection',
        category: 'cultivation',
        description: 'Daily visual inspection of plants for health and growth',
        instructions: JSON.stringify([
          'Check each plant for signs of pests or disease',
          'Inspect leaf color and overall plant health',
          'Check soil moisture levels',
          'Document any issues or concerns',
          'Take photos if problems are found'
        ]),
        estimated_duration_minutes: 30,
        priority: 'medium',
        required_skills: JSON.stringify(['plant_identification', 'pest_recognition']),
        is_recurring: true,
        recurrence_pattern: JSON.stringify({ frequency: 'daily', time: '09:00' }),
        is_active: true
      },
      {
        name: 'Watering and Feeding',
        category: 'cultivation',
        description: 'Water plants and apply nutrients as scheduled',
        instructions: JSON.stringify([
          'Check soil moisture with meter',
          'Prepare nutrient solution according to recipe',
          'Water plants thoroughly until runoff',
          'Record water and nutrient amounts used',
          'Clean and store equipment'
        ]),
        estimated_duration_minutes: 45,
        priority: 'high',
        required_equipment: JSON.stringify(['watering_system', 'ph_meter', 'ec_meter']),
        is_recurring: true,
        recurrence_pattern: JSON.stringify({ frequency: 'every_2_days', time: '08:00' }),
        is_active: true
      },
      {
        name: 'Environmental Data Recording',
        category: 'monitoring',
        description: 'Record environmental conditions in grow rooms',
        instructions: JSON.stringify([
          'Check temperature and humidity in each room',
          'Record CO2 levels',
          'Check ventilation system operation',
          'Document any environmental issues',
          'Adjust settings if needed'
        ]),
        estimated_duration_minutes: 20,
        priority: 'medium',
        is_recurring: true,
        recurrence_pattern: JSON.stringify({ frequency: 'every_4_hours' }),
        is_active: true
      },
      {
        name: 'Harvest Preparation',
        category: 'processing',
        description: 'Prepare plants and area for harvest',
        instructions: JSON.stringify([
          'Assess plant readiness for harvest',
          'Prepare harvest tools and containers',
          'Set up drying area',
          'Document pre-harvest plant condition',
          'Take final photos of plants'
        ]),
        estimated_duration_minutes: 60,
        priority: 'high',
        required_equipment: JSON.stringify(['harvest_scissors', 'drying_racks', 'containers']),
        requires_approval: true,
        is_active: true
      }
    ]);

    console.log('Initial data seeded successfully');
  });
};

exports.down = function(knex) {
  return knex.transaction(async (trx) => {
    // Clean up in reverse order
    await trx('task_templates').del();
    await trx('inventory_categories').del();
    await trx('system_tags').del();
    await trx('roles').del();
  });
};
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware
app.use(cors({
  origin: ["http://localhost:3001", "http://localhost:3002"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Basic API routes for testing
app.get('/api/auth/me', (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: 1,
        username: 'demo',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        role: 'admin',
        permissions: ['*'],
        facilityId: 1,
        isActive: true,
        emailVerified: true
      }
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: 1,
        username: 'demo',
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        role: 'admin',
        permissions: ['*'],
        facilityId: 1,
        isActive: true,
        emailVerified: true
      },
      accessToken: 'demo-access-token',
      refreshToken: 'demo-refresh-token'
    }
  });
});

// Mock data endpoints
app.get('/api/strains', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Blue Dream', type: 'Hybrid', thc: 18, cbd: 2 },
      { id: 2, name: 'OG Kush', type: 'Indica', thc: 22, cbd: 1 }
    ]
  });
});

app.get('/api/batches', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Batch 001', strain: 'Blue Dream', plantCount: 50, status: 'Vegetative' },
      { id: 2, name: 'Batch 002', strain: 'OG Kush', plantCount: 30, status: 'Flowering' }
    ]
  });
});

app.get('/api/plants', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, tag: 'P001', strain: 'Blue Dream', status: 'Vegetative', room: 'Veg Room 1' },
      { id: 2, tag: 'P002', strain: 'OG Kush', status: 'Flowering', room: 'Flower Room 1' }
    ]
  });
});

app.get('/api/rooms', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Veg Room 1', type: 'Vegetative', capacity: 100, currentPlants: 50 },
      { id: 2, name: 'Flower Room 1', type: 'Flowering', capacity: 50, currentPlants: 30 }
    ]
  });
});

app.get('/api/tasks', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, title: 'Water plants', status: 'pending', priority: 'high', dueDate: new Date() },
      { id: 2, title: 'Check pH levels', status: 'completed', priority: 'medium', dueDate: new Date() }
    ]
  });
});

app.get('/api/inventory', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Nutrients A', category: 'Nutrients', quantity: 50, unit: 'L' },
      { id: 2, name: 'pH Test Kit', category: 'Testing', quantity: 5, unit: 'pcs' }
    ]
  });
});

app.get('/api/users', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, username: 'admin', email: 'admin@example.com', role: 'admin', status: 'active' },
      { id: 2, username: 'grower1', email: 'grower1@example.com', role: 'grower', status: 'active' }
    ]
  });
});

// Dashboard endpoint
app.get('/api/reports/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      stats: {
        totalPlants: 80,
        activeBatches: 5,
        pendingTasks: 12,
        lowInventory: 3
      },
      recentActivity: [
        {
          id: 1,
          type: 'plant_moved',
          description: 'Plant P001 moved to Flower Room 1',
          timestamp: new Date().toLocaleString()
        },
        {
          id: 2,
          type: 'task_completed',
          description: 'Watering task completed for Batch 001',
          timestamp: new Date().toLocaleString()
        },
        {
          id: 3,
          type: 'batch_created',
          description: 'New batch Batch 003 created',
          timestamp: new Date().toLocaleString()
        }
      ],
      upcomingTasks: [
        {
          id: 1,
          title: 'Water plants in Veg Room 1',
          due_date: new Date(Date.now() + 86400000).toLocaleDateString(),
          priority: 'high'
        },
        {
          id: 2,
          title: 'Check pH levels in Flower Room 2',
          due_date: new Date(Date.now() + 172800000).toLocaleDateString(),
          priority: 'medium'
        }
      ],
      alerts: [
        {
          id: 1,
          severity: 'warning',
          message: 'Temperature high in Flower Room 1 (82°F)',
          timestamp: new Date().toLocaleString()
        },
        {
          id: 2,
          severity: 'info',
          message: 'Nutrient levels low in reservoir A',
          timestamp: new Date().toLocaleString()
        }
      ]
    }
  });
});

// Processing endpoints
app.get('/api/processing/types', (req, res) => {
  res.json({
    success: true,
    data: [
      { type: 'drying', name: 'Drying', description: 'Initial drying process after harvest' },
      { type: 'curing', name: 'Curing', description: 'Controlled curing for quality enhancement' },
      { type: 'trimming', name: 'Trimming', description: 'Manual or machine trimming' },
      { type: 'extraction', name: 'Extraction', description: 'Concentrate and extract production' },
      { type: 'packaging', name: 'Packaging', description: 'Final packaging for distribution' }
    ]
  });
});

app.get('/api/processing/status-options', (req, res) => {
  res.json({
    success: true,
    data: [
      { status: 'in_progress', name: 'In Progress', color: '#F59E0B' },
      { status: 'completed', name: 'Completed', color: '#10B981' },
      { status: 'on_hold', name: 'On Hold', color: '#EF4444' },
      { status: 'failed', name: 'Failed', color: '#DC2626' }
    ]
  });
});

app.get('/api/processing/facilities/:facilityId/batches', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        processing_batch_number: 'DRY-2501-0001',
        processing_type: 'drying',
        status: 'in_progress',
        input_weight: 2500.0,
        current_weight: 1875.0,
        moisture_content_start: 75.0,
        moisture_content_current: 45.0,
        moisture_content_target: 12.0,
        start_date: '2025-01-01',
        expected_completion_date: '2025-01-08',
        source_batch: { batch_number: 'B-2024-001', strain_name: 'Blue Dream' },
        room: { name: 'Drying Room 1', room_type: 'drying' },
        created_at: '2025-01-01T10:00:00Z'
      },
      {
        id: 2,
        processing_batch_number: 'CUR-2501-0001',
        processing_type: 'curing',
        status: 'in_progress',
        input_weight: 1800.0,
        current_weight: 1750.0,
        moisture_content_start: 12.0,
        moisture_content_current: 11.5,
        moisture_content_target: 10.0,
        start_date: '2025-01-10',
        expected_completion_date: '2025-01-24',
        source_batch: { batch_number: 'B-2024-002', strain_name: 'OG Kush' },
        room: { name: 'Curing Room 1', room_type: 'curing' },
        created_at: '2025-01-10T14:00:00Z'
      },
      {
        id: 3,
        processing_batch_number: 'TRM-2501-0001',
        processing_type: 'trimming',
        status: 'completed',
        input_weight: 1750.0,
        current_weight: 1400.0,
        output_weight: 1400.0,
        waste_weight: 350.0,
        start_date: '2025-01-25',
        actual_completion_date: '2025-01-27',
        source_batch: { batch_number: 'B-2024-003', strain_name: 'White Widow' },
        room: { name: 'Processing Room 1', room_type: 'processing' },
        created_at: '2025-01-25T09:00:00Z'
      }
    ]
  });
});

app.get('/api/processing/batches/:batchId', (req, res) => {
  const { batchId } = req.params;
  res.json({
    success: true,
    data: {
      id: parseInt(batchId),
      processing_batch_number: 'DRY-2501-0001',
      processing_type: 'drying',
      status: 'in_progress',
      input_weight: 2500.0,
      current_weight: 1875.0,
      output_weight: null,
      waste_weight: 0,
      moisture_content_start: 75.0,
      moisture_content_current: 45.0,
      moisture_content_target: 12.0,
      start_date: '2025-01-01',
      expected_completion_date: '2025-01-08',
      actual_completion_date: null,
      processing_parameters: {
        temperature: 68,
        humidity: 55,
        air_circulation: 'medium'
      },
      quality_metrics: {
        color: 'good',
        aroma: 'strong',
        trichome_development: 'excellent'
      },
      source_batch: {
        batch_number: 'B-2024-001',
        strain_name: 'Blue Dream',
        harvest_date: '2025-01-01'
      },
      room: {
        name: 'Drying Room 1',
        room_type: 'drying',
        environmental_settings: {
          target_temperature: 68,
          target_humidity: 55
        }
      },
      waste_logs: [],
      lab_tests: [],
      notes: 'Initial drying process proceeding well. Good color retention.',
      created_at: '2025-01-01T10:00:00Z'
    }
  });
});

app.get('/api/processing/facilities/:facilityId/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      by_type: [
        {
          processing_type: 'drying',
          batch_count: 5,
          total_input_weight: 12500.0,
          total_output_weight: 9375.0,
          total_waste_weight: 1250.0,
          avg_yield_percentage: 75.0
        },
        {
          processing_type: 'curing',
          batch_count: 3,
          total_input_weight: 9000.0,
          total_output_weight: 8550.0,
          total_waste_weight: 450.0,
          avg_yield_percentage: 95.0
        },
        {
          processing_type: 'trimming',
          batch_count: 4,
          total_input_weight: 8000.0,
          total_output_weight: 6400.0,
          total_waste_weight: 1600.0,
          avg_yield_percentage: 80.0
        }
      ],
      active_batches: 8,
      time_range_days: 30
    }
  });
});

app.get('/api/processing/facilities/:facilityId/rooms', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 3, name: 'Drying Room 1', room_type: 'drying', room_code: 'DR1', capacity: 500 },
      { id: 4, name: 'Drying Room 2', room_type: 'drying', room_code: 'DR2', capacity: 500 },
      { id: 5, name: 'Curing Room 1', room_type: 'curing', room_code: 'CR1', capacity: 300 },
      { id: 6, name: 'Processing Room 1', room_type: 'processing', room_code: 'PR1', capacity: 200 }
    ]
  });
});

app.get('/api/processing/facilities/:facilityId/source-batches', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        batch_number: 'B-2024-001',
        harvest_date: '2024-12-15',
        harvest_weight: 2800.0,
        strain_name: 'Blue Dream'
      },
      {
        id: 2,
        batch_number: 'B-2024-002',
        harvest_date: '2024-12-20',
        harvest_weight: 3200.0,
        strain_name: 'OG Kush'
      },
      {
        id: 3,
        batch_number: 'B-2024-003',
        harvest_date: '2024-12-25',
        harvest_weight: 2100.0,
        strain_name: 'White Widow'
      }
    ]
  });
});

app.post('/api/processing/batches', (req, res) => {
  res.json({
    success: true,
    data: {
      id: Date.now(),
      processing_batch_number: 'NEW-2501-' + Math.floor(Math.random() * 1000).toString().padStart(4, '0'),
      ...req.body,
      status: 'in_progress',
      current_weight: req.body.input_weight,
      created_at: new Date().toISOString()
    }
  });
});

app.put('/api/processing/batches/:batchId/progress', (req, res) => {
  res.json({
    success: true,
    data: {
      id: parseInt(req.params.batchId),
      ...req.body,
      updated_at: new Date().toISOString()
    }
  });
});

app.put('/api/processing/batches/:batchId/complete', (req, res) => {
  res.json({
    success: true,
    data: {
      id: parseInt(req.params.batchId),
      status: 'completed',
      actual_completion_date: new Date().toISOString().split('T')[0],
      ...req.body,
      updated_at: new Date().toISOString()
    }
  });
});

// Batch Release endpoints
app.get('/api/batch-releases/status-options', (req, res) => {
  res.json({
    success: true,
    data: [
      { status: 'pending', name: 'Pending', color: '#6B7280' },
      { status: 'in_progress', name: 'In Progress', color: '#F59E0B' },
      { status: 'on_hold', name: 'On Hold', color: '#EF4444' },
      { status: 'approved', name: 'Approved', color: '#10B981' },
      { status: 'released', name: 'Released', color: '#059669' },
      { status: 'rejected', name: 'Rejected', color: '#DC2626' }
    ]
  });
});

app.get('/api/batch-releases/facilities/:facilityId/releases', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        release_number: 'REL-2501-0001',
        status: 'in_progress',
        processing_batch_number: 'TRM-2501-0001',
        processing_type: 'trimming',
        source_batch_number: 'B-2024-001',
        strain_name: 'Blue Dream',
        template_name: 'Standard Flower Release',
        product_type: 'flower',
        initiated_by_name: 'demo',
        initiated_at: '2025-01-28T10:00:00Z',
        target_completion_date: '2025-01-30T17:00:00Z',
        checkpoint_progress: {
          total_checkpoints: 5,
          completed_checkpoints: 2,
          failed_checkpoints: 0
        },
        created_at: '2025-01-28T10:00:00Z'
      },
      {
        id: 2,
        release_number: 'REL-2501-0002',
        status: 'approved',
        processing_batch_number: 'CUR-2501-0001',
        processing_type: 'curing',
        source_batch_number: 'B-2024-002',
        strain_name: 'OG Kush',
        template_name: 'Premium Flower Release',
        product_type: 'flower',
        initiated_by_name: 'demo',
        initiated_at: '2025-01-25T14:00:00Z',
        target_completion_date: '2025-01-27T17:00:00Z',
        checkpoint_progress: {
          total_checkpoints: 6,
          completed_checkpoints: 6,
          failed_checkpoints: 0
        },
        created_at: '2025-01-25T14:00:00Z'
      },
      {
        id: 3,
        release_number: 'REL-2501-0003',
        status: 'released',
        processing_batch_number: 'PKG-2501-0001',
        processing_type: 'packaging',
        source_batch_number: 'B-2024-003',
        strain_name: 'White Widow',
        template_name: 'Standard Flower Release',
        product_type: 'flower',
        initiated_by_name: 'demo',
        initiated_at: '2025-01-20T09:00:00Z',
        actual_completion_date: '2025-01-22T16:30:00Z',
        checkpoint_progress: {
          total_checkpoints: 5,
          completed_checkpoints: 5,
          failed_checkpoints: 0
        },
        created_at: '2025-01-20T09:00:00Z'
      }
    ]
  });
});

app.get('/api/batch-releases/:releaseId', (req, res) => {
  const { releaseId } = req.params;
  res.json({
    success: true,
    data: {
      id: parseInt(releaseId),
      release_number: 'REL-2501-0001',
      status: 'in_progress',
      facility_id: 1,
      processing_batch_id: 3,
      template_id: 1,
      initiated_by_user_id: 1,
      initiated_at: '2025-01-28T10:00:00Z',
      target_completion_date: '2025-01-30T17:00:00Z',
      notes: 'Standard release workflow for trimmed flower',
      processing_batch: {
        id: 3,
        processing_batch_number: 'TRM-2501-0001',
        processing_type: 'trimming',
        status: 'completed',
        output_weight: 1400.0,
        source_batch_number: 'B-2024-001',
        strain_name: 'Blue Dream',
        room_name: 'Processing Room 1'
      },
      template: {
        id: 1,
        name: 'Standard Flower Release',
        product_type: 'flower',
        requires_lab_testing: true,
        requires_visual_inspection: true,
        requires_weight_verification: true,
        requires_packaging_inspection: true
      },
      checkpoint_results: [
        {
          id: 1,
          checkpoint_id: 1,
          checkpoint_name: 'Visual Inspection',
          checkpoint_type: 'visual_inspection',
          order_sequence: 1,
          status: 'passed',
          inspector_user_id: 1,
          inspector_name: 'demo',
          started_at: '2025-01-28T10:30:00Z',
          completed_at: '2025-01-28T11:00:00Z',
          inspection_data: {
            color: 'excellent',
            trichome_development: 'good',
            mold_detected: false,
            pest_damage: false
          },
          inspector_notes: 'Excellent visual quality, no defects detected'
        },
        {
          id: 2,
          checkpoint_id: 2,
          checkpoint_name: 'Weight Verification',
          checkpoint_type: 'weight_verification',
          order_sequence: 2,
          status: 'passed',
          inspector_user_id: 1,
          inspector_name: 'demo',
          started_at: '2025-01-28T11:15:00Z',
          completed_at: '2025-01-28T11:30:00Z',
          inspection_data: {
            expected_weight: 1400.0,
            actual_weight: 1398.5,
            variance_percentage: -0.11
          },
          inspector_notes: 'Weight within acceptable variance'
        },
        {
          id: 3,
          checkpoint_id: 3,
          checkpoint_name: 'Lab Testing',
          checkpoint_type: 'lab_testing',
          order_sequence: 3,
          status: 'pending',
          inspector_user_id: null,
          inspector_name: null,
          started_at: null,
          completed_at: null,
          inspection_data: {},
          inspector_notes: null
        },
        {
          id: 4,
          checkpoint_id: 4,
          checkpoint_name: 'Moisture Content',
          checkpoint_type: 'moisture_testing',
          order_sequence: 4,
          status: 'pending',
          inspector_user_id: null,
          inspector_name: null,
          started_at: null,
          completed_at: null,
          inspection_data: {},
          inspector_notes: null
        },
        {
          id: 5,
          checkpoint_id: 5,
          checkpoint_name: 'Final QA Review',
          checkpoint_type: 'documentation_review',
          order_sequence: 5,
          status: 'pending',
          inspector_user_id: null,
          inspector_name: null,
          started_at: null,
          completed_at: null,
          inspection_data: {},
          inspector_notes: null
        }
      ],
      approvals: [
        {
          id: 1,
          approval_level: 'qa_manager',
          required_role_id: 2,
          role_name: 'QA Manager',
          approver_user_id: null,
          approver_name: null,
          status: 'pending',
          order_sequence: 1,
          requested_at: '2025-01-28T10:00:00Z',
          responded_at: null,
          approval_notes: null
        },
        {
          id: 2,
          approval_level: 'compliance_officer',
          required_role_id: 3,
          role_name: 'Compliance Officer',
          approver_user_id: null,
          approver_name: null,
          status: 'pending',
          order_sequence: 2,
          requested_at: '2025-01-28T10:00:00Z',
          responded_at: null,
          approval_notes: null
        }
      ],
      documents: [],
      audit_log: [
        {
          id: 1,
          user_id: 1,
          user_name: 'demo',
          action: 'release_initiated',
          entity_type: 'batch_release',
          entity_id: 1,
          old_values: {},
          new_values: {
            release_number: 'REL-2501-0001',
            template_id: 1,
            processing_batch_id: 3
          },
          notes: null,
          created_at: '2025-01-28T10:00:00Z'
        },
        {
          id: 2,
          user_id: 1,
          user_name: 'demo',
          action: 'checkpoint_completed',
          entity_type: 'checkpoint_result',
          entity_id: 1,
          old_values: {},
          new_values: {
            checkpoint_id: 1,
            status: 'passed'
          },
          notes: null,
          created_at: '2025-01-28T11:00:00Z'
        }
      ]
    }
  });
});

app.get('/api/batch-releases/facilities/:facilityId/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      by_status: [
        { status: 'pending', count: 2, avg_duration_hours: 0 },
        { status: 'in_progress', count: 3, avg_duration_hours: 18.5 },
        { status: 'approved', count: 4, avg_duration_hours: 36.2 },
        { status: 'released', count: 8, avg_duration_hours: 42.1 },
        { status: 'rejected', count: 1, avg_duration_hours: 12.0 }
      ],
      total_releases: 18,
      avg_checkpoint_completion_hours: 2.3,
      time_range_days: 30
    }
  });
});

app.get('/api/batch-releases/facilities/:facilityId/templates', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'Standard Flower Release',
        product_type: 'flower',
        description: 'Standard quality control workflow for flower products',
        requires_lab_testing: true,
        requires_visual_inspection: true,
        requires_weight_verification: true,
        requires_packaging_inspection: true,
        estimated_duration_hours: 48
      },
      {
        id: 2,
        name: 'Premium Flower Release',
        product_type: 'flower',
        description: 'Enhanced quality control workflow for premium flower products',
        requires_lab_testing: true,
        requires_visual_inspection: true,
        requires_weight_verification: true,
        requires_packaging_inspection: true,
        estimated_duration_hours: 72
      },
      {
        id: 3,
        name: 'Concentrate Release',
        product_type: 'concentrate',
        description: 'Quality control workflow for concentrate products',
        requires_lab_testing: true,
        requires_visual_inspection: true,
        requires_weight_verification: true,
        requires_packaging_inspection: false,
        estimated_duration_hours: 36
      }
    ]
  });
});

app.get('/api/batch-releases/facilities/:facilityId/available-batches', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 4,
        processing_batch_number: 'DRY-2501-0002',
        processing_type: 'drying',
        output_weight: 1875.0,
        actual_completion_date: '2025-01-29',
        source_batch_number: 'B-2024-004',
        strain_name: 'Purple Haze'
      },
      {
        id: 5,
        processing_batch_number: 'CUR-2501-0002',
        processing_type: 'curing',
        output_weight: 1650.0,
        actual_completion_date: '2025-01-27',
        source_batch_number: 'B-2024-005',
        strain_name: 'Sour Diesel'
      }
    ]
  });
});

app.post('/api/batch-releases', (req, res) => {
  res.json({
    success: true,
    data: {
      id: Date.now(),
      release_number: 'REL-2501-' + Math.floor(Math.random() * 1000).toString().padStart(4, '0'),
      status: 'pending',
      ...req.body,
      initiated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  });
});

app.put('/api/batch-releases/:releaseId/checkpoints/:checkpointId/complete', (req, res) => {
  res.json({
    success: true,
    data: {
      id: parseInt(req.params.checkpointId),
      status: req.body.passed ? 'passed' : 'failed',
      completed_at: new Date().toISOString(),
      ...req.body
    }
  });
});

app.put('/api/batch-releases/:releaseId/approvals/:approvalId', (req, res) => {
  res.json({
    success: true,
    data: {
      id: parseInt(req.params.approvalId),
      status: req.body.decision,
      responded_at: new Date().toISOString(),
      ...req.body
    }
  });
});

app.put('/api/batch-releases/:releaseId/release', (req, res) => {
  res.json({
    success: true,
    data: {
      id: parseInt(req.params.releaseId),
      status: 'released',
      released_at: new Date().toISOString(),
      actual_completion_date: new Date().toISOString(),
      ...req.body
    }
  });
});

// Tags endpoints
app.get('/api/tags', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 1, name: 'Seedling', category: 'growth_stage', color: '#10B981', description: 'Newly sprouted plants', is_system_tag: true, usage_count: 15 },
      { id: 2, name: 'Vegetative', category: 'growth_stage', color: '#22C55E', description: 'Vegetative growth phase', is_system_tag: true, usage_count: 32 },
      { id: 3, name: 'Flowering', category: 'growth_stage', color: '#EF4444', description: 'Flowering stage', is_system_tag: true, usage_count: 28 },
      { id: 4, name: 'Grade A', category: 'quality', color: '#10B981', description: 'Premium quality', is_system_tag: true, usage_count: 12 },
      { id: 5, name: 'IPM Treated', category: 'treatment', color: '#F59E0B', description: 'Integrated pest management treatment applied', is_system_tag: true, usage_count: 8 },
      { id: 6, name: 'METRC Tagged', category: 'compliance', color: '#10B981', description: 'Tagged in METRC system', is_system_tag: true, usage_count: 45 },
      { id: 7, name: 'High Priority', category: 'custom', color: '#DC2626', description: 'High priority items', is_system_tag: false, usage_count: 5 }
    ],
    count: 7
  });
});

app.get('/api/tags/categories', (req, res) => {
  res.json({
    success: true,
    data: [
      { value: 'growth_stage', label: 'Growth Stage', description: 'Plant growth phases' },
      { value: 'processing_stage', label: 'Processing Stage', description: 'Post-harvest processing phases' },
      { value: 'location', label: 'Location', description: 'Room and zone identifiers' },
      { value: 'quality', label: 'Quality', description: 'Quality grades and classifications' },
      { value: 'treatment', label: 'Treatment', description: 'Treatment and care protocols' },
      { value: 'compliance', label: 'Compliance', description: 'Regulatory compliance status' },
      { value: 'custom', label: 'Custom', description: 'User-defined categories' }
    ]
  });
});

app.get('/api/tags/analytics', (req, res) => {
  res.json({
    success: true,
    data: {
      category_stats: [
        { category: 'growth_stage', usage_count: 75 },
        { category: 'compliance', usage_count: 45 },
        { category: 'quality', usage_count: 32 },
        { category: 'treatment', usage_count: 18 },
        { category: 'processing_stage', usage_count: 12 },
        { category: 'custom', usage_count: 8 }
      ],
      top_tags: [
        { id: 6, name: 'METRC Tagged', color: '#10B981', category: 'compliance', usage_count: 45 },
        { id: 2, name: 'Vegetative', color: '#22C55E', category: 'growth_stage', usage_count: 32 },
        { id: 3, name: 'Flowering', color: '#EF4444', category: 'growth_stage', usage_count: 28 },
        { id: 1, name: 'Seedling', color: '#10B981', category: 'growth_stage', usage_count: 15 },
        { id: 4, name: 'Grade A', color: '#10B981', category: 'quality', usage_count: 12 }
      ],
      entity_type_stats: [
        { entity_type: 'plant', usage_count: 85 },
        { entity_type: 'batch', usage_count: 42 },
        { entity_type: 'inventory_item', usage_count: 28 },
        { entity_type: 'task', usage_count: 15 }
      ],
      usage_over_time: [
        { date: '2025-01-25', usage_count: 12 },
        { date: '2025-01-26', usage_count: 18 },
        { date: '2025-01-27', usage_count: 25 },
        { date: '2025-01-28', usage_count: 32 },
        { date: '2025-01-29', usage_count: 28 }
      ],
      timeframe: '30d'
    }
  });
});

app.get('/api/tags/category/:category', (req, res) => {
  const { category } = req.params;
  const tagsByCategory = {
    growth_stage: [
      { id: 1, name: 'Seedling', color: '#10B981', description: 'Newly sprouted plants' },
      { id: 2, name: 'Vegetative', color: '#22C55E', description: 'Vegetative growth phase' },
      { id: 3, name: 'Flowering', color: '#EF4444', description: 'Flowering stage' }
    ],
    quality: [
      { id: 4, name: 'Grade A', color: '#10B981', description: 'Premium quality' },
      { id: 8, name: 'Grade B', color: '#F59E0B', description: 'Standard quality' }
    ],
    treatment: [
      { id: 5, name: 'IPM Treated', color: '#F59E0B', description: 'Integrated pest management treatment applied' }
    ],
    compliance: [
      { id: 6, name: 'METRC Tagged', color: '#10B981', description: 'Tagged in METRC system' }
    ]
  };

  res.json({
    success: true,
    data: tagsByCategory[category] || [],
    count: (tagsByCategory[category] || []).length
  });
});

app.get('/api/tags/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    data: {
      id: parseInt(id),
      name: 'Vegetative',
      category: 'growth_stage',
      color: '#22C55E',
      description: 'Vegetative growth phase',
      is_system_tag: true,
      usage_stats: [
        { entity_type: 'plant', count: 25 },
        { entity_type: 'batch', count: 7 }
      ],
      total_usage: 32,
      child_tags: []
    }
  });
});

app.post('/api/tags', (req, res) => {
  res.json({
    success: true,
    message: 'Tag created successfully',
    data: {
      id: Date.now(),
      ...req.body,
      is_system_tag: false,
      created_at: new Date().toISOString()
    }
  });
});

app.put('/api/tags/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Tag updated successfully',
    data: {
      id: parseInt(req.params.id),
      ...req.body,
      updated_at: new Date().toISOString()
    }
  });
});

app.delete('/api/tags/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Tag deleted successfully'
  });
});

app.post('/api/tags/:id/apply', (req, res) => {
  res.json({
    success: true,
    message: 'Tag applied successfully',
    data: {
      tag_id: parseInt(req.params.id),
      entity_type: req.body.entity_type,
      entity_id: req.body.entity_id,
      tagged_at: new Date().toISOString()
    }
  });
});

app.delete('/api/tags/:id/remove', (req, res) => {
  res.json({
    success: true,
    message: 'Tag removed successfully'
  });
});

app.get('/api/tags/entity/:entityType/:entityId', (req, res) => {
  const { entityType, entityId } = req.params;
  res.json({
    success: true,
    data: [
      { id: 2, name: 'Vegetative', category: 'growth_stage', color: '#22C55E', tagged_at: '2025-01-28T10:00:00Z', tagged_by_username: 'demo' },
      { id: 6, name: 'METRC Tagged', category: 'compliance', color: '#10B981', tagged_at: '2025-01-28T11:00:00Z', tagged_by_username: 'demo' }
    ],
    count: 2
  });
});

app.get('/api/tags/:id/entities', (req, res) => {
  res.json({
    success: true,
    data: [
      { entity_type: 'plant', entity_id: 1, tag_name: 'Vegetative', tag_category: 'growth_stage', tag_color: '#22C55E', tagged_at: '2025-01-28T10:00:00Z' },
      { entity_type: 'plant', entity_id: 2, tag_name: 'Vegetative', tag_category: 'growth_stage', tag_color: '#22C55E', tagged_at: '2025-01-28T11:00:00Z' },
      { entity_type: 'batch', entity_id: 1, tag_name: 'Vegetative', tag_category: 'growth_stage', tag_color: '#22C55E', tagged_at: '2025-01-28T12:00:00Z' }
    ],
    count: 3
  });
});

app.post('/api/tags/bulk-apply', (req, res) => {
  const { tag_ids, entity_type, entity_ids } = req.body;
  const results = [];
  
  tag_ids.forEach(tagId => {
    entity_ids.forEach(entityId => {
      results.push({
        success: true,
        tagId,
        entityId,
        result: { tag_id: tagId, entity_type, entity_id: entityId, tagged_at: new Date().toISOString() }
      });
    });
  });

  res.json({
    success: true,
    message: `Bulk tag application completed: ${results.length} successful, 0 failed`,
    data: {
      results,
      summary: {
        total: results.length,
        successful: results.length,
        failed: 0
      }
    }
  });
});

app.post('/api/tags/search', (req, res) => {
  const { tag_ids, entity_type, operator } = req.body;
  res.json({
    success: true,
    data: [
      { entity_type: 'plant', entity_id: 1, tag_names: ['Vegetative', 'METRC Tagged'], tag_colors: ['#22C55E', '#10B981'] },
      { entity_type: 'plant', entity_id: 2, tag_names: ['Vegetative', 'Grade A'], tag_colors: ['#22C55E', '#10B981'] }
    ],
    count: 2,
    search_criteria: {
      tag_ids,
      entity_type,
      operator
    }
  });
});

// Comprehensive Reporting API Endpoints
// Report Templates
app.get('/api/reports/templates', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'Production Summary',
        description: 'Overview of production metrics and yields',
        report_type: 'production',
        config: {
          metrics: ['total_yield', 'batch_count', 'avg_yield_per_plant'],
          groupBy: 'strain',
          timeframe: '30d'
        },
        is_system_template: true,
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Inventory Status',
        description: 'Current inventory levels and movements',
        report_type: 'inventory',
        config: {
          metrics: ['current_stock', 'low_stock_items', 'recent_movements'],
          categories: ['nutrients', 'equipment', 'packaging'],
          threshold: 10
        },
        is_system_template: true,
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 3,
        name: 'Financial Performance',
        description: 'Revenue, costs, and profitability analysis',
        report_type: 'financial',
        config: {
          metrics: ['revenue', 'costs', 'profit_margin'],
          breakdown: ['by_strain', 'by_batch', 'by_month'],
          currency: 'USD'
        },
        is_system_template: true,
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 4,
        name: 'Compliance Audit',
        description: 'Regulatory compliance status and violations',
        report_type: 'compliance',
        config: {
          metrics: ['compliance_score', 'violations', 'pending_items'],
          regulations: ['state', 'local', 'federal'],
          severity_levels: ['low', 'medium', 'high', 'critical']
        },
        is_system_template: true,
        created_at: '2025-01-01T00:00:00Z'
      }
    ]
  });
});

app.get('/api/reports/templates/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    data: {
      id: parseInt(id),
      name: 'Production Summary',
      description: 'Overview of production metrics and yields',
      report_type: 'production',
      config: {
        metrics: ['total_yield', 'batch_count', 'avg_yield_per_plant'],
        groupBy: 'strain',
        timeframe: '30d',
        filters: {
          date_range: { start: '2025-01-01', end: '2025-01-31' },
          strains: [],
          rooms: [],
          status: ['completed']
        }
      },
      is_system_template: true,
      created_at: '2025-01-01T00:00:00Z'
    }
  });
});

app.post('/api/reports/templates', (req, res) => {
  res.json({
    success: true,
    data: {
      id: Date.now(),
      ...req.body,
      is_system_template: false,
      created_at: new Date().toISOString()
    }
  });
});

// Saved Reports
app.get('/api/reports', (req, res) => {
  const { page = 1, limit = 10, report_type, created_by } = req.query;
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'January Production Report',
        report_type: 'production',
        template_id: 1,
        template_name: 'Production Summary',
        status: 'completed',
        created_by_user_id: 1,
        created_by_username: 'demo',
        created_at: '2025-01-31T10:00:00Z',
        completed_at: '2025-01-31T10:05:00Z',
        file_path: '/reports/production_jan_2025.pdf',
        file_size: 2048576,
        config: {
          date_range: { start: '2025-01-01', end: '2025-01-31' },
          format: 'pdf'
        }
      },
      {
        id: 2,
        name: 'Weekly Inventory Check',
        report_type: 'inventory',
        template_id: 2,
        template_name: 'Inventory Status',
        status: 'completed',
        created_by_user_id: 1,
        created_by_username: 'demo',
        created_at: '2025-01-29T09:00:00Z',
        completed_at: '2025-01-29T09:02:00Z',
        file_path: '/reports/inventory_week_4.xlsx',
        file_size: 1024000,
        config: {
          date_range: { start: '2025-01-22', end: '2025-01-29' },
          format: 'xlsx'
        }
      }
    ],
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: 2,
      pages: 1
    }
  });
});

app.get('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  res.json({
    success: true,
    data: {
      id: parseInt(id),
      name: 'January Production Report',
      report_type: 'production',
      template_id: 1,
      template_name: 'Production Summary',
      status: 'completed',
      created_by_user_id: 1,
      created_by_username: 'demo',
      created_at: '2025-01-31T10:00:00Z',
      started_at: '2025-01-31T10:00:00Z',
      completed_at: '2025-01-31T10:05:00Z',
      file_path: '/reports/production_jan_2025.pdf',
      file_size: 2048576,
      config: {
        date_range: { start: '2025-01-01', end: '2025-01-31' },
        format: 'pdf',
        metrics: ['total_yield', 'batch_count', 'avg_yield_per_plant'],
        groupBy: 'strain'
      },
      execution_log: [
        { timestamp: '2025-01-31T10:00:00Z', message: 'Report generation started' },
        { timestamp: '2025-01-31T10:01:00Z', message: 'Data collection completed' },
        { timestamp: '2025-01-31T10:03:00Z', message: 'Chart generation completed' },
        { timestamp: '2025-01-31T10:05:00Z', message: 'Report generation completed' }
      ]
    }
  });
});

app.post('/api/reports', (req, res) => {
  res.json({
    success: true,
    data: {
      id: Date.now(),
      ...req.body,
      status: 'pending',
      created_at: new Date().toISOString()
    }
  });
});

app.delete('/api/reports/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Report deleted successfully'
  });
});

// Report Execution
app.post('/api/reports/:id/execute', (req, res) => {
  res.json({
    success: true,
    data: {
      execution_id: Date.now(),
      report_id: parseInt(req.params.id),
      status: 'running',
      started_at: new Date().toISOString(),
      estimated_completion: new Date(Date.now() + 300000).toISOString()
    }
  });
});

app.get('/api/reports/:id/status', (req, res) => {
  res.json({
    success: true,
    data: {
      report_id: parseInt(req.params.id),
      status: 'completed',
      progress: 100,
      started_at: '2025-01-31T10:00:00Z',
      completed_at: '2025-01-31T10:05:00Z',
      file_path: '/reports/production_jan_2025.pdf',
      file_size: 2048576
    }
  });
});

// Report Data and Charts
app.get('/api/reports/:id/data', (req, res) => {
  res.json({
    success: true,
    data: {
      summary: {
        total_yield: 125.5,
        total_batches: 8,
        avg_yield_per_plant: 2.1,
        top_strain: 'Blue Dream'
      },
      charts: [
        {
          id: 'yield_by_strain',
          type: 'bar',
          title: 'Yield by Strain',
          data: [
            { strain: 'Blue Dream', yield: 45.2, batches: 3 },
            { strain: 'OG Kush', yield: 38.7, batches: 2 },
            { strain: 'White Widow', yield: 41.6, batches: 3 }
          ]
        },
        {
          id: 'yield_over_time',
          type: 'line',
          title: 'Yield Over Time',
          data: [
            { date: '2025-01-01', yield: 12.5 },
            { date: '2025-01-08', yield: 18.3 },
            { date: '2025-01-15', yield: 22.1 },
            { date: '2025-01-22', yield: 28.4 },
            { date: '2025-01-29', yield: 44.2 }
          ]
        },
        {
          id: 'batch_status',
          type: 'pie',
          title: 'Batch Status Distribution',
          data: [
            { status: 'Completed', count: 5, percentage: 62.5 },
            { status: 'In Progress', count: 2, percentage: 25.0 },
            { status: 'Pending', count: 1, percentage: 12.5 }
          ]
        }
      ],
      tables: [
        {
          id: 'batch_details',
          title: 'Batch Details',
          columns: ['Batch', 'Strain', 'Plants', 'Yield (kg)', 'Status'],
          data: [
            ['B-001', 'Blue Dream', 25, 15.2, 'Completed'],
            ['B-002', 'OG Kush', 20, 18.7, 'Completed'],
            ['B-003', 'White Widow', 22, 16.8, 'In Progress']
          ]
        }
      ]
    }
  });
});

// Report Scheduling
app.get('/api/reports/schedules', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'Weekly Production Report',
        template_id: 1,
        template_name: 'Production Summary',
        frequency: 'weekly',
        day_of_week: 1,
        time: '09:00',
        timezone: 'America/Los_Angeles',
        is_active: true,
        next_run: '2025-02-03T09:00:00Z',
        last_run: '2025-01-27T09:00:00Z',
        created_at: '2025-01-01T00:00:00Z'
      },
      {
        id: 2,
        name: 'Monthly Financial Summary',
        template_id: 3,
        template_name: 'Financial Performance',
        frequency: 'monthly',
        day_of_month: 1,
        time: '08:00',
        timezone: 'America/Los_Angeles',
        is_active: true,
        next_run: '2025-02-01T08:00:00Z',
        last_run: '2025-01-01T08:00:00Z',
        created_at: '2025-01-01T00:00:00Z'
      }
    ]
  });
});

app.post('/api/reports/schedules', (req, res) => {
  res.json({
    success: true,
    data: {
      id: Date.now(),
      ...req.body,
      is_active: true,
      created_at: new Date().toISOString()
    }
  });
});

app.put('/api/reports/schedules/:id', (req, res) => {
  res.json({
    success: true,
    data: {
      id: parseInt(req.params.id),
      ...req.body,
      updated_at: new Date().toISOString()
    }
  });
});

app.delete('/api/reports/schedules/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Schedule deleted successfully'
  });
});

// Report Analytics
app.get('/api/reports/analytics', (req, res) => {
  const { timeframe = '30d' } = req.query;
  res.json({
    success: true,
    data: {
      summary: {
        total_reports: 45,
        reports_this_period: 12,
        avg_generation_time: 3.2,
        most_popular_type: 'production'
      },
      by_type: [
        { report_type: 'production', count: 18, avg_time: 2.8 },
        { report_type: 'inventory', count: 12, avg_time: 1.5 },
        { report_type: 'financial', count: 8, avg_time: 4.2 },
        { report_type: 'compliance', count: 7, avg_time: 5.1 }
      ],
      by_user: [
        { user_id: 1, username: 'demo', count: 25 },
        { user_id: 2, username: 'manager', count: 12 },
        { user_id: 3, username: 'analyst', count: 8 }
      ],
      generation_times: [
        { date: '2025-01-25', avg_time: 2.5, count: 3 },
        { date: '2025-01-26', avg_time: 3.1, count: 2 },
        { date: '2025-01-27', avg_time: 2.8, count: 4 },
        { date: '2025-01-28', avg_time: 3.5, count: 2 },
        { date: '2025-01-29', avg_time: 2.9, count: 1 }
      ],
      timeframe
    }
  });
});

// Report Export
app.get('/api/reports/:id/export', (req, res) => {
  const { format = 'pdf' } = req.query;
  res.json({
    success: true,
    data: {
      download_url: `/api/reports/${req.params.id}/download?format=${format}&token=mock-download-token`,
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      format,
      file_size: 2048576
    }
  });
});

app.get('/api/reports/:id/download', (req, res) => {
  const { format = 'pdf' } = req.query;
  res.json({
    success: true,
    message: `Mock download for report ${req.params.id} in ${format} format`,
    data: {
      file_name: `report_${req.params.id}.${format}`,
      content_type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    }
  });
});

// Report Bookmarks
app.get('/api/reports/bookmarks', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        report_id: 1,
        report_name: 'January Production Report',
        report_type: 'production',
        bookmarked_at: '2025-01-31T15:00:00Z'
      },
      {
        id: 2,
        report_id: 2,
        report_name: 'Weekly Inventory Check',
        report_type: 'inventory',
        bookmarked_at: '2025-01-29T12:00:00Z'
      }
    ]
  });
});

app.post('/api/reports/:id/bookmark', (req, res) => {
  res.json({
    success: true,
    data: {
      id: Date.now(),
      report_id: parseInt(req.params.id),
      user_id: 1,
      bookmarked_at: new Date().toISOString()
    }
  });
});

app.delete('/api/reports/:id/bookmark', (req, res) => {
  res.json({
    success: true,
    message: 'Bookmark removed successfully'
  });
});

// Catch all other API routes
app.use('/api/*', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: `Mock endpoint: ${req.method} ${req.path}`
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🌿 Cannabis Management System API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🚀 Server ready at http://localhost:${PORT}`);
});

module.exports = app;
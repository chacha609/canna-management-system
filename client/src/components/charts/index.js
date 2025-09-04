/**
 * Chart Components Library
 * Reusable chart components for the reporting system
 */

// Core chart components that exist
export { default as ChartContainer } from './ChartContainer';
export { default as LineChart } from './LineChart';
export { default as BarChart } from './BarChart';
export { default as PieChart } from './PieChart';

// Chart configuration and constants
export const CHART_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#06B6D4',
  success: '#10B981',
  muted: '#6B7280'
};

export const CHART_THEMES = {
  light: {
    background: '#FFFFFF',
    text: '#1F2937',
    grid: '#E5E7EB',
    axis: '#9CA3AF'
  },
  dark: {
    background: '#1F2937',
    text: '#F9FAFB',
    grid: '#374151',
    axis: '#6B7280'
  }
};

// Default chart configurations
export const DEFAULT_CHART_CONFIG = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 750,
    easing: 'easeInOutQuart'
  },
  grid: {
    strokeDasharray: '3 3',
    stroke: CHART_THEMES.light.grid
  },
  tooltip: {
    contentStyle: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }
  }
};
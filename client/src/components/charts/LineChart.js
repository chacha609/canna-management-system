/**
 * Line Chart Component
 * Reusable line chart for time-series and trend data
 */

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import ChartContainer from './ChartContainer';

const LineChart = ({
  data = [],
  title,
  subtitle,
  xAxisKey = 'date',
  lines = [],
  height = 400,
  loading = false,
  error = null,
  onRefresh = null,
  onExport = null,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
  className = '',
  ...props
}) => {
  // Default line configuration if none provided
  const defaultLines = data.length > 0 && lines.length === 0 
    ? Object.keys(data[0]).filter(key => key !== xAxisKey).map((key, index) => ({
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        color: colors[index % colors.length],
        strokeWidth: 2
      }))
    : lines;

  const formatXAxisLabel = (value) => {
    // Try to format as date if it looks like a date
    if (typeof value === 'string' && (value.includes('-') || value.includes('/'))) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
        }
      } catch (e) {
        // Fall back to original value
      }
    }
    return value;
  };

  const formatTooltipValue = (value, name) => {
    if (typeof value === 'number') {
      // Format numbers with appropriate precision
      if (value > 1000) {
        return [value.toLocaleString(), name];
      } else if (value < 1 && value > 0) {
        return [value.toFixed(3), name];
      } else {
        return [value.toFixed(1), name];
      }
    }
    return [value, name];
  };

  const formatTooltipLabel = (label) => {
    if (typeof label === 'string' && (label.includes('-') || label.includes('/'))) {
      try {
        const date = new Date(label);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', { 
            weekday: 'short',
            year: 'numeric',
            month: 'short', 
            day: 'numeric' 
          });
        }
      } catch (e) {
        // Fall back to original label
      }
    }
    return label;
  };

  return (
    <ChartContainer
      title={title}
      subtitle={subtitle}
      loading={loading}
      error={error}
      onRefresh={onRefresh}
      onExport={onExport}
      height={height}
      className={className}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          {...props}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          )}
          
          <XAxis 
            dataKey={xAxisKey}
            tickFormatter={formatXAxisLabel}
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          
          <YAxis 
            stroke="#6B7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (typeof value === 'number') {
                if (value > 1000) {
                  return `${(value / 1000).toFixed(1)}k`;
                } else if (value < 1 && value > 0) {
                  return value.toFixed(2);
                } else {
                  return value.toFixed(0);
                }
              }
              return value;
            }}
          />
          
          {showTooltip && (
            <Tooltip
              formatter={formatTooltipValue}
              labelFormatter={formatTooltipLabel}
              contentStyle={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{
                color: '#374151',
                fontWeight: '600',
              }}
            />
          )}
          
          {showLegend && (
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />
          )}
          
          {defaultLines.map((line, index) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 2}
              dot={line.showDots !== false ? {
                fill: line.color,
                strokeWidth: 2,
                r: 4
              } : false}
              activeDot={line.showActiveDot !== false ? {
                r: 6,
                stroke: line.color,
                strokeWidth: 2,
                fill: '#FFFFFF'
              } : false}
              connectNulls={line.connectNulls !== false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default LineChart;
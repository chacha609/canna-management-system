/**
 * Bar Chart Component
 * Reusable bar chart for categorical data comparison
 */

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import ChartContainer from './ChartContainer';

const BarChart = ({
  data = [],
  title,
  subtitle,
  xAxisKey = 'name',
  bars = [],
  height = 400,
  loading = false,
  error = null,
  onRefresh = null,
  onExport = null,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  orientation = 'vertical', // 'vertical' or 'horizontal'
  colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'],
  className = '',
  ...props
}) => {
  // Default bar configuration if none provided
  const defaultBars = data.length > 0 && bars.length === 0 
    ? Object.keys(data[0]).filter(key => key !== xAxisKey).map((key, index) => ({
        key,
        name: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        color: colors[index % colors.length]
      }))
    : bars;

  const formatAxisLabel = (value) => {
    if (typeof value === 'string' && value.length > 15) {
      return value.substring(0, 12) + '...';
    }
    return value;
  };

  const formatTooltipValue = (value, name) => {
    if (typeof value === 'number') {
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

  const formatTickValue = (value) => {
    if (typeof value === 'number') {
      if (value > 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value > 1000) {
        return `${(value / 1000).toFixed(1)}k`;
      } else if (value < 1 && value > 0) {
        return value.toFixed(2);
      } else {
        return value.toFixed(0);
      }
    }
    return value;
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
        <RechartsBarChart
          data={data}
          layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          {...props}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          )}
          
          {orientation === 'horizontal' ? (
            <>
              <XAxis 
                type="number"
                tickFormatter={formatTickValue}
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                type="category"
                dataKey={xAxisKey}
                tickFormatter={formatAxisLabel}
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                width={100}
              />
            </>
          ) : (
            <>
              <XAxis 
                dataKey={xAxisKey}
                tickFormatter={formatAxisLabel}
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                angle={data.length > 8 ? -45 : 0}
                textAnchor={data.length > 8 ? 'end' : 'middle'}
                height={data.length > 8 ? 80 : 60}
              />
              <YAxis 
                tickFormatter={formatTickValue}
                stroke="#6B7280"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
            </>
          )}
          
          {showTooltip && (
            <Tooltip
              formatter={formatTooltipValue}
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
          
          {showLegend && defaultBars.length > 1 && (
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
              }}
            />
          )}
          
          {defaultBars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color}
              radius={[4, 4, 0, 0]}
              opacity={0.8}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default BarChart;
/**
 * Pie Chart Component
 * Reusable pie chart for showing proportional data
 */

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import ChartContainer from './ChartContainer';

const PieChart = ({
  data = [],
  title,
  subtitle,
  dataKey = 'value',
  nameKey = 'name',
  height = 400,
  loading = false,
  error = null,
  onRefresh = null,
  onExport = null,
  showLegend = true,
  showTooltip = true,
  showLabels = true,
  showPercentage = true,
  innerRadius = 0, // Set to > 0 for donut chart
  outerRadius = '80%',
  colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'],
  className = '',
  ...props
}) => {
  // Calculate total for percentage calculations
  const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);

  const formatTooltipValue = (value, name) => {
    if (typeof value === 'number') {
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
      return [
        `${value.toLocaleString()} (${percentage}%)`,
        name
      ];
    }
    return [value, name];
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, value, name, percent }) => {
    if (!showLabels) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Only show label if slice is large enough
    if (percent < 0.05) return null; // Don't show labels for slices < 5%

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="600"
      >
        {showPercentage ? `${(percent * 100).toFixed(0)}%` : value}
      </text>
    );
  };

  const renderCustomLegend = (props) => {
    if (!showLegend) return null;
    
    const { payload } = props;
    
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry, index) => {
          const value = data.find(item => item[nameKey] === entry.value)?.[dataKey] || 0;
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
          
          return (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-700">
                {entry.value}: {value.toLocaleString()} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    );
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
        <RechartsPieChart {...props}>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          
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
          
          <Legend content={renderCustomLegend} />
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default PieChart;
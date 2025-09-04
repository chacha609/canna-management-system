/**
 * Chart Container Component
 * Provides common wrapper functionality for all charts
 */

import React, { useState, useRef } from 'react';
import { Download, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

const ChartContainer = ({ 
  title, 
  subtitle, 
  children, 
  loading = false, 
  error = null,
  onRefresh = null,
  onExport = null,
  className = '',
  height = 400,
  showControls = true,
  fullscreenEnabled = true
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef(null);

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Chart Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          {onRefresh && (
            <button
              onClick={handleRefresh}
              className="btn-primary"
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Retry'
              )}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${
        isFullscreen ? 'fixed inset-4 z-50' : ''
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        
        {showControls && (
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            
            {onExport && (
              <button
                onClick={handleExport}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title="Export chart"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            
            {fullscreenEnabled && (
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading chart data...</p>
            </div>
          </div>
        ) : (
          <div style={{ height: isFullscreen ? 'calc(100vh - 200px)' : height }}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartContainer;
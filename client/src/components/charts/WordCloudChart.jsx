import React, { useRef } from 'react';

const WordCloudChart = ({ wordCloudData, animated = true, cloudStyle = 'classic' }) => {
  const cloudRef = useRef(null);

  const getWordSize = (value, maxValue) => {
    const minSize = 12;
    const maxSize = 56;
    // Use logarithmic scaling for better frequency distribution
    const normalizedValue = value / maxValue;
    const logScale = Math.log(normalizedValue * 9 + 1) / Math.log(10); // Log scale 0-1
    return Math.max(minSize, minSize + (maxSize - minSize) * logScale);
  };

  const getPosition = (index, total, style) => {
    switch (style) {
      case 'circular':
        const angle = (index / total) * 2 * Math.PI;
        const radius = 20 + (index % 3) * 15; // Vary radius for layers
        return {
          top: 50 + Math.sin(angle) * radius,
          left: 50 + Math.cos(angle) * radius
        };
      
      case 'spiral':
        const spiralAngle = index * 0.5;
        const spiralRadius = index * 2;
        return {
          top: 50 + Math.sin(spiralAngle) * spiralRadius,
          left: 50 + Math.cos(spiralAngle) * spiralRadius
        };
      
      case 'grid':
        const cols = Math.ceil(Math.sqrt(total));
        const row = Math.floor(index / cols);
        const col = index % cols;
        return {
          top: 10 + (row * (80 / Math.ceil(total / cols))),
          left: 10 + (col * (80 / cols))
        };
      
      default: // classic - random
        return {
          top: Math.random() * 70 + 10,
          left: Math.random() * 70 + 10
        };
    }
  };

  const getColor = (index, value, maxValue) => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
    ];
    const baseColor = colors[index % colors.length];
    
    // Add intensity based on frequency (darker for more frequent words)
    const intensity = 0.6 + (0.4 * (value / maxValue));
    return `${baseColor}${Math.round(intensity * 255).toString(16).padStart(2, '0')}`;
  };

  if (!wordCloudData || wordCloudData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-2xl">☁️</span>
          </div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">No words yet</p>
          <p className="text-sm">Word cloud will appear as participants respond</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...wordCloudData.map(word => word.value));
  const topWords = wordCloudData.slice(0, 30); // Show top 30 words

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">
        Word Cloud
      </h3>
      
      {/* Word Cloud Container */}
      <div 
        ref={cloudRef}
        className="relative h-96 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-lg overflow-hidden mb-4"
      >
        {topWords.map((word, index) => {
          const position = getPosition(index, topWords.length, cloudStyle);
          const fontSize = getWordSize(word.value, maxValue);
          
          return (
            <div
              key={`${word.text}-${index}`}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 font-bold select-none cursor-pointer hover:scale-110 transition-all duration-300 ${
                animated ? 'animate-fadeIn' : ''
              }`}
              style={{
                top: `${position.top}%`,
                left: `${position.left}%`,
                fontSize: `${fontSize}px`,
                color: getColor(index, word.value, maxValue),
                animationDelay: animated ? `${index * 0.1}s` : '0s',
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
              }}
              title={`"${word.text}" - ${word.value} mentions`}
            >
              {word.text}
            </div>
          );
        })}
      </div>

      {/* Word List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Top Words ({wordCloudData.length} total)
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {wordCloudData.slice(0, 12).map((word, index) => (
            <div
              key={`list-${word.text}-${index}`}
              className="bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md flex justify-between items-center border border-gray-200 dark:border-gray-600"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {word.text}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                {word.value}
              </span>
            </div>
          ))}
        </div>
        
        {wordCloudData.length > 12 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
            ... and {wordCloudData.length - 12} more words
          </p>
        )}
      </div>

      {/* Statistics */}
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {wordCloudData.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Unique Words</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600 dark:text-green-400">
              {wordCloudData.reduce((sum, word) => sum + word.value, 0)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Mentions</div>
          </div>
          <div>
            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
              {maxValue}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Most Frequent</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default WordCloudChart;
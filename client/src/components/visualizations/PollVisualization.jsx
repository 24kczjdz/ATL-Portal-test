import React, { useEffect, useRef, useState } from 'react';

const PollVisualization = ({ 
  question, 
  responses = [], 
  showResults = true, 
  animated = true,
  type = 'bar' // 'bar', 'pie', 'donut'
}) => {
  const chartRef = useRef(null);
  const [animationProgress, setAnimationProgress] = useState(0);

  // Process response data
  const processData = () => {
    if (!question || !question.Answers) return [];
    
    const answerCounts = {};
    const totalResponses = responses.length;

    // Initialize counts
    question.Answers.forEach(answer => {
      answerCounts[answer] = 0;
    });

    // Count responses
    responses.forEach(response => {
      if (answerCounts.hasOwnProperty(response.answer)) {
        answerCounts[response.answer]++;
      }
    });

    // Convert to chart data
    return question.Answers.map((answer, index) => ({
      label: answer,
      value: answerCounts[answer],
      percentage: totalResponses > 0 ? (answerCounts[answer] / totalResponses) * 100 : 0,
      score: question.Scores?.[index] || 0,
      color: getColor(index)
    }));
  };

  const getColor = (index) => {
    const colors = [
      '#3B82F6', // Blue
      '#EF4444', // Red  
      '#10B981', // Green
      '#F59E0B', // Yellow
      '#8B5CF6', // Purple
      '#F97316', // Orange
      '#06B6D4', // Cyan
      '#84CC16', // Lime
      '#EC4899', // Pink
      '#6B7280'  // Gray
    ];
    return colors[index % colors.length];
  };

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setAnimationProgress(1);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [animated]);

  const data = processData();
  const totalResponses = responses.length;
  const maxValue = Math.max(...data.map(d => d.value), 1);

  if (!showResults) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="text-center text-gray-500">
          <div className="animate-pulse">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-2xl">📊</span>
            </div>
            <p>Results will be shown after voting</p>
          </div>
        </div>
      </div>
    );
  }

  const BarChart = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Poll Results</h3>
        <span className="text-sm text-gray-500">{totalResponses} responses</span>
      </div>
      
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 flex-1">
              {item.label}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              {item.value} ({item.percentage.toFixed(1)}%)
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-6 relative overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out flex items-center"
              style={{ 
                backgroundColor: item.color,
                width: animated ? `${(item.value / maxValue) * 100 * animationProgress}%` : `${(item.value / maxValue) * 100}%`
              }}
            >
              {item.value > 0 && (
                <span className="text-white text-xs font-medium ml-2">
                  {item.value}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const PieChart = () => {
    const radius = 80;
    const center = 100;
    let cumulativePercentage = 0;
    
    const createArcPath = (percentage, startAngle) => {
      const endAngle = startAngle + (percentage / 100) * 360;
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const x1 = center + radius * Math.cos(startAngleRad);
      const y1 = center + radius * Math.sin(startAngleRad);
      const x2 = center + radius * Math.cos(endAngleRad);
      const y2 = center + radius * Math.sin(endAngleRad);
      
      const largeArc = percentage > 50 ? 1 : 0;
      
      return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };

    return (
      <div className="flex flex-col lg:flex-row items-center gap-8">
        <div className="relative">
          <svg width="200" height="200" className="transform -rotate-90">
            {data.map((item, index) => {
              if (item.value === 0) return null;
              
              const path = createArcPath(item.percentage, cumulativePercentage * 3.6);
              cumulativePercentage += item.percentage;
              
              return (
                <path
                  key={index}
                  d={path}
                  fill={item.color}
                  className={animated ? "transition-all duration-1000 ease-out" : ""}
                  style={{
                    opacity: animated ? animationProgress : 1
                  }}
                />
              );
            })}
          </svg>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{totalResponses}</div>
              <div className="text-xs text-gray-500">responses</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-700">{item.label}</div>
                <div className="text-xs text-gray-500">
                  {item.value} votes ({item.percentage.toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const WordCloud = ({ words = [] }) => {
    const getRandomPosition = () => ({
      top: Math.random() * 70 + 10,
      left: Math.random() * 70 + 10
    });

    return (
      <div className="relative h-64 bg-gray-50 rounded-lg overflow-hidden">
        {words.map((word, index) => {
          const position = getRandomPosition();
          const fontSize = Math.min(Math.max(word.count * 4 + 12, 14), 48);
          
          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 font-semibold select-none"
              style={{
                top: `${position.top}%`,
                left: `${position.left}%`,
                fontSize: `${fontSize}px`,
                color: getColor(index),
                opacity: animated ? animationProgress : 1,
                transition: animated ? 'opacity 1s ease-out' : 'none'
              }}
            >
              {word.text}
            </div>
          );
        })}
      </div>
    );
  };

  const RatingVisualization = () => {
    const averageRating = data.length > 0 
      ? data.reduce((sum, item) => sum + (item.score * item.value), 0) / totalResponses 
      : 0;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-800">
            {averageRating.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">Average Rating</div>
          <div className="flex justify-center mt-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <span
                key={star}
                className={`text-2xl ${
                  star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
        
        <div className="space-y-3">
          {data.reverse().map((item, index) => (
            <div key={index} className="flex items-center gap-4">
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm text-gray-700">{item.score}</span>
                <span className="text-yellow-400">★</span>
              </div>
              
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div 
                  className="h-full rounded-full bg-yellow-400 transition-all duration-1000 ease-out"
                  style={{ 
                    width: animated ? `${(item.value / maxValue) * 100 * animationProgress}%` : `${(item.value / maxValue) * 100}%`
                  }}
                />
              </div>
              
              <span className="text-sm text-gray-500 w-12 text-right">
                {item.value}
              </span>
            </div>
          ))}
        </div>
        
        <div className="text-center text-sm text-gray-500">
          Based on {totalResponses} ratings
        </div>
      </div>
    );
  };

  return (
    <div ref={chartRef} className="bg-white p-6 rounded-lg shadow-sm">
      {question?.Type === 'Rating' && <RatingVisualization />}
      {question?.Type === 'OpenText' && <WordCloud words={data} />}
      {(question?.Type === 'MultiChoice' || question?.Type === 'MultiVote') && (
        type === 'pie' ? <PieChart /> : <BarChart />
      )}
      
      {totalResponses === 0 && (
        <div className="text-center text-gray-500 py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <p>No responses yet</p>
          <p className="text-sm">Results will appear as participants answer</p>
        </div>
      )}
    </div>
  );
};

export default PollVisualization;
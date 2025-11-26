import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PollChart = ({ 
  question, 
  analytics, 
  chartType = 'bar',
  animated = true,
  showResults = true,
  isPoll = false,
  unifiedData = null 
}) => {
  if (!showResults || !analytics || analytics.totalResponses === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-lg font-medium">No responses yet</p>
          <p className="text-sm">Results will appear as participants answer</p>
        </div>
      </div>
    );
  }

  const generateColors = (count) => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
      '#F97316', '#06B6D4', '#84CC16', '#EC4899', '#6B7280'
    ];
    return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
  };

  // Prepare data based on question type
  const prepareChartData = () => {
    // Handle unified data for polls and questions
    if (unifiedData) {
      const labels = Object.keys(unifiedData.answerCounts);
      const data = Object.values(unifiedData.answerCounts);
      const colors = generateColors(labels.length);
      
      return {
        labels,
        datasets: [{
          label: isPoll ? 'Poll Votes' : 'Responses',
          data,
          backgroundColor: chartType === 'bar' 
            ? colors.map(color => color + '80') // Semi-transparent for bars
            : colors,
          borderColor: colors,
          borderWidth: chartType === 'bar' ? 0 : 2,
          borderRadius: chartType === 'bar' ? 6 : 0,
        }]
      };
    }

    if (question.type === 'MultiChoice' || question.type === 'MultiVote' || question.type === 'Poll' || isPoll) {
      const labels = Object.keys(analytics.answerCounts);
      const data = Object.values(analytics.answerCounts);
      const colors = generateColors(labels.length);
      
      return {
        labels,
        datasets: [{
          label: isPoll ? 'Poll Votes' : 'Responses',
          data,
          backgroundColor: chartType === 'bar' 
            ? colors.map(color => color + '80') // Semi-transparent for bars
            : colors,
          borderColor: colors,
          borderWidth: chartType === 'bar' ? 0 : 2,
          borderRadius: chartType === 'bar' ? 6 : 0,
        }]
      };
    }

    if (question.type === 'Rating') {
      const labels = ['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'];
      const data = [0, 0, 0, 0, 0];
      
      // Count ratings
      Object.entries(analytics.answerCounts).forEach(([rating, count]) => {
        const ratingIndex = parseInt(rating) - 1;
        if (ratingIndex >= 0 && ratingIndex < 5) {
          data[ratingIndex] = count;
        }
      });
      
      return {
        labels,
        datasets: [{
          label: 'Ratings',
          data,
          backgroundColor: [
            '#EF4444', '#F59E0B', '#F59E0B', '#10B981', '#10B981'
          ],
          borderColor: [
            '#DC2626', '#D97706', '#D97706', '#059669', '#059669'
          ],
          borderWidth: chartType === 'bar' ? 0 : 2,
          borderRadius: chartType === 'bar' ? 6 : 0,
        }]
      };
    }

    return null;
  };

  const chartData = prepareChartData();
  
  if (!chartData) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm">
        <div className="text-center text-gray-500">
          <p>Chart not available for this question type</p>
        </div>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animated ? {
      duration: 1500,
      easing: 'easeInOutQuart'
    } : false,
    plugins: {
      legend: {
        position: chartType === 'bar' ? 'top' : 'right',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: isPoll ? `Poll: ${question.text}` : question.text,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: 20
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          afterLabel: function(context) {
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
            const percentage = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0;
            return `${percentage}% of responses`;
          }
        }
      }
    },
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 12
          },
          maxRotation: 45
        },
        grid: {
          display: false
        }
      }
    } : {}
  };

  const StatsSummary = () => {
    const dataSource = unifiedData || analytics;
    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {dataSource.totalResponses}
            </div>
            <div className="text-sm text-gray-600">{isPoll ? 'Total Votes' : 'Total Responses'}</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {Math.round(dataSource.averageResponseTime / 1000)}s
            </div>
            <div className="text-sm text-gray-600">Avg Response Time</div>
          </div>
          {question.type === 'Rating' && (
            <>
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {(() => {
                    const ratings = Object.entries(dataSource.answerCounts);
                    const totalScore = ratings.reduce((sum, [rating, count]) => 
                      sum + (parseInt(rating) * count), 0);
                    const avgRating = dataSource.totalResponses > 0 
                      ? (totalScore / dataSource.totalResponses).toFixed(1) 
                      : 0;
                    return avgRating;
                  })()}
                </div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {(() => {
                    const maxRating = Math.max(...Object.entries(dataSource.answerCounts)
                      .map(([rating, count]) => count > 0 ? parseInt(rating) : 0));
                    return maxRating || 'N/A';
                  })()}
                </div>
                <div className="text-sm text-gray-600">Most Common</div>
              </div>
            </>
          )}
          {(question.type === 'MultiChoice' || question.type === 'MultiVote' || question.type === 'Poll' || isPoll) && (
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {(() => {
                  const entries = Object.entries(dataSource.answerCounts);
                  const maxEntry = entries.reduce((max, curr) => 
                    curr[1] > max[1] ? curr : max, ['', 0]);
                  return maxEntry[1] > 0 ? maxEntry[0].substring(0, 10) + '...' : 'N/A';
                })()}
              </div>
              <div className="text-sm text-gray-600">{isPoll ? 'Most Voted' : 'Most Popular'}</div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="h-80 mb-4">
        {chartType === 'bar' && (
          <Bar data={chartData} options={options} />
        )}
        {chartType === 'pie' && (
          <Pie data={chartData} options={options} />
        )}
        {chartType === 'doughnut' && (
          <Doughnut data={chartData} options={options} />
        )}
      </div>
      
      <StatsSummary />
    </div>
  );
};

export default PollChart;
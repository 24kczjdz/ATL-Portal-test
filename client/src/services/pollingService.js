import axios from 'axios';

class PollingService {
  constructor() {
    this.intervals = new Map();
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? '/api' 
      : 'http://localhost:5000/api';
  }

  // Helper method to get auth headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Helper method to handle polling errors
  handlePollingError(error, context) {
    if (error.code === 'ECONNABORTED') {
      // Reduce noise for serverless timeouts - only log first few occurrences
      if (!this.timeoutWarningCount) this.timeoutWarningCount = {};
      if (!this.timeoutWarningCount[context]) this.timeoutWarningCount[context] = 0;
      
      this.timeoutWarningCount[context]++;
      if (this.timeoutWarningCount[context] <= 3) {
        console.warn(`${context}: Request timeout - serverless function may be cold starting (${this.timeoutWarningCount[context]}/3)`);
      }
    } else if (error.response?.status === 401) {
      console.warn(`${context}: Authentication required`);
    } else if (error.response?.status === 403) {
      console.warn(`${context}: Permission denied`);
    } else if (error.response?.status === 404) {
      console.warn(`${context}: Resource not found`);
    } else if (error.response?.status >= 500) {
      console.error(`${context}: Server error -`, error.response?.status);
    } else if (error.request) {
      console.warn(`${context}: Network error - may be serverless cold start`);
    } else {
      console.error(`${context}: Unknown error -`, error.message);
    }
    
    // Return whether to continue polling (be more tolerant of timeouts in serverless)
    return !(error.response?.status === 404 || error.response?.status === 403);
  }

  // Start polling for activity status updates
  startActivityPolling(activityId, callback, interval = 5000) { // Increased to 5000ms to reduce serverless load
    if (!activityId) {
      console.error('Activity ID is required for polling');
      return;
    }

    if (this.intervals.has(`activity_${activityId}`)) {
      this.stopActivityPolling(activityId);
    }

    let lastUpdate = new Date().toISOString();
    let consecutiveErrors = 0;

    const pollFunction = async () => {
      try {
        const response = await axios.get(
          `${this.baseURL}/live/activities/${activityId}/status`,
          { 
            params: { lastUpdate },
            timeout: 25000,
            headers: this.getAuthHeaders()
          }
        );

        const { hasUpdates, timestamp, data } = response.data;
        consecutiveErrors = 0; // Reset error count on success

        if (hasUpdates) {
          lastUpdate = timestamp;
          callback(data);
        }
      } catch (error) {
        consecutiveErrors++;
        const shouldContinue = this.handlePollingError(error, 'Activity polling');
        
        // Stop polling after 12 consecutive errors or critical errors (more tolerant for serverless)
        if (consecutiveErrors >= 12 || !shouldContinue) {
          console.warn(`Stopping activity polling for ${activityId} due to repeated errors`);
          this.stopActivityPolling(activityId);
        }
      }
    };

    // Initial poll
    pollFunction();

    // Set up interval
    const intervalId = setInterval(pollFunction, interval);
    this.intervals.set(`activity_${activityId}`, intervalId);

    return intervalId;
  }

  // Stop polling for activity updates
  stopActivityPolling(activityId) {
    const intervalId = this.intervals.get(`activity_${activityId}`);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(`activity_${activityId}`);
    }
  }

  // Start polling for results updates
  startResultsPolling(activityId, questionIndex, callback, interval = 2000) { // Reduced from 6000ms to 2000ms for faster updates
    const key = `results_${activityId}_${questionIndex}`;
    
    if (this.intervals.has(key)) {
      this.stopResultsPolling(activityId, questionIndex);
    }

    let consecutiveErrors = 0;

    const pollFunction = async () => {
      try {
        const response = await axios.get(
          `${this.baseURL}/live/activities/${activityId}/results`,
          { 
            params: { questionIndex },
            timeout: 20000,
            headers: this.getAuthHeaders()
          }
        );

        consecutiveErrors = 0; // Reset error count on success
        callback(response.data);
      } catch (error) {
        consecutiveErrors++;
        const shouldContinue = this.handlePollingError(error, 'Results polling');
        
        // Stop polling after 12 consecutive errors or critical errors (more tolerant for serverless)
        if (consecutiveErrors >= 12 || !shouldContinue) {
          console.warn(`Stopping results polling for ${activityId} question ${questionIndex} due to repeated errors`);
          this.stopResultsPolling(activityId, questionIndex);
        }
      }
    };

    // Initial poll
    pollFunction();

    // Set up interval
    const intervalId = setInterval(pollFunction, interval);
    this.intervals.set(key, intervalId);

    return intervalId;
  }

  // Stop polling for results
  stopResultsPolling(activityId, questionIndex) {
    const key = `results_${activityId}_${questionIndex}`;
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
  }

  // Manual fetch for Q&A data
  async fetchQAData(activityId, callback) {
    try {
      const response = await axios.get(
        `${this.baseURL}/live/activities/${activityId}/questions`,
        {
          params: { status: 'all', threaded: 'true' },
          timeout: 20000,
          headers: this.getAuthHeaders()
        }
      );
      
      const questions = response.data.questions;
      if (callback) {
        callback(questions);
      }
      return questions;
    } catch (error) {
      console.error('Error fetching Q&A data:', error);
      throw error;
    }
  }

  // Start polling for Q&A updates
  startQAPolling(activityId, callback, interval = 5000) { // Increased from 3000ms to 5000ms to reduce serverless load
    const key = `qa_${activityId}`;
    
    if (this.intervals.has(key)) {
      this.stopQAPolling(activityId);
    }

    let lastFetch = new Date();
    let consecutiveErrors = 0;

    const pollFunction = async () => {
      try {
        const response = await axios.get(
          `${this.baseURL}/live/activities/${activityId}/questions`,
          {
            params: { status: 'all', threaded: 'true' },
            timeout: 35000, // Increased timeout for serverless cold starts
            headers: this.getAuthHeaders()
          }
        );

        consecutiveErrors = 0; // Reset error count on success
        const questions = response.data.questions;
        
        // Check if there are new questions since last fetch
        const newQuestions = questions.filter(q => 
          new Date(q.createdAt) > lastFetch || new Date(q.updatedAt) > lastFetch
        );

        if (newQuestions.length > 0 || questions.length === 0) {
          lastFetch = new Date();
          callback(questions);
        }
      } catch (error) {
        consecutiveErrors++;
        const shouldContinue = this.handlePollingError(error, 'Q&A polling');
        
        // Stop polling after 12 consecutive errors or critical errors (more tolerant for serverless)
        if (consecutiveErrors >= 12 || !shouldContinue) {
          console.warn(`Stopping Q&A polling for ${activityId} due to repeated errors`);
          this.stopQAPolling(activityId);
          return;
        }
        
        // Exponential backoff for timeouts and server errors
        if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
          const backoffDelay = Math.min(1000 * Math.pow(2, consecutiveErrors - 1), 30000); // Max 30s
          console.log(`Q&A polling: Backing off for ${backoffDelay}ms due to timeout/server error`);
          setTimeout(pollFunction, backoffDelay);
          return;
        }
      }
    };

    // Initial poll
    pollFunction();

    // Set up interval
    const intervalId = setInterval(pollFunction, interval);
    this.intervals.set(key, intervalId);

    return intervalId;
  }

  // Stop polling for Q&A
  stopQAPolling(activityId) {
    const key = `qa_${activityId}`;
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
  }

  // Start polling for live polls
  startLivePollsPolling(activityId, callback, interval = 2500) { // Reduced from 8000ms to 2500ms for faster updates
    const key = `polls_${activityId}`;
    
    if (this.intervals.has(key)) {
      this.stopLivePollsPolling(activityId);
    }

    let consecutiveErrors = 0;

    const pollFunction = async () => {
      try {
        const response = await axios.get(
          `${this.baseURL}/live/activities/${activityId}/polls`,
          { 
            timeout: 20000,
            headers: this.getAuthHeaders()
          }
        );

        consecutiveErrors = 0; // Reset error count on success
        callback(response.data.polls);
      } catch (error) {
        consecutiveErrors++;
        const shouldContinue = this.handlePollingError(error, 'Live polls polling');
        
        // Stop polling after 12 consecutive errors or critical errors (more tolerant for serverless)
        if (consecutiveErrors >= 12 || !shouldContinue) {
          console.warn(`Stopping live polls polling for ${activityId} due to repeated errors`);
          this.stopLivePollsPolling(activityId);
        }
      }
    };

    // Initial poll
    pollFunction();

    // Set up interval
    const intervalId = setInterval(pollFunction, interval);
    this.intervals.set(key, intervalId);

    return intervalId;
  }

  // Stop polling for live polls
  stopLivePollsPolling(activityId) {
    const key = `polls_${activityId}`;
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
  }

  // Poll for poll results
  startPollResultsPolling(activityId, pollId, callback, interval = 2000) {
    const key = `poll_results_${pollId}`;
    
    if (this.intervals.has(key)) {
      this.stopPollResultsPolling(pollId);
    }

    let consecutiveErrors = 0;

    const pollFunction = async () => {
      try {
        const response = await axios.get(
          `${this.baseURL}/live/activities/${activityId}/polls/${pollId}/results`,
          { 
            timeout: 20000,
            headers: this.getAuthHeaders()
          }
        );

        consecutiveErrors = 0; // Reset error count on success
        callback(response.data);
      } catch (error) {
        consecutiveErrors++;
        const shouldContinue = this.handlePollingError(error, 'Poll results polling');
        
        // Stop polling after 12 consecutive errors or critical errors (more tolerant for serverless)
        if (consecutiveErrors >= 12 || !shouldContinue) {
          console.warn(`Stopping poll results polling for ${pollId} due to repeated errors`);
          this.stopPollResultsPolling(pollId);
        }
      }
    };

    // Initial poll
    pollFunction();

    // Set up interval
    const intervalId = setInterval(pollFunction, interval);
    this.intervals.set(key, intervalId);

    return intervalId;
  }

  // Stop polling for poll results
  stopPollResultsPolling(pollId) {
    const key = `poll_results_${pollId}`;
    const intervalId = this.intervals.get(key);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(key);
    }
  }

  // Stop all polling for an activity
  stopAllPolling(activityId) {
    this.stopActivityPolling(activityId);
    this.stopQAPolling(activityId);
    this.stopLivePollsPolling(activityId);
    
    // Stop results polling for all questions
    for (let i = 0; i < 20; i++) { // Assume max 20 questions
      this.stopResultsPolling(activityId, i);
    }
  }

  // Clean up all intervals
  cleanup() {
    this.intervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    this.intervals.clear();
  }
}

// Create a singleton instance
const pollingService = new PollingService();

export default pollingService;

// Export the class for direct instantiation if needed
export { PollingService };
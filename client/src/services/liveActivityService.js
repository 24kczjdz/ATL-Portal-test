// Live Activity Service for Vercel-compatible polling-based updates
class LiveActivityService {
    constructor() {
        this.pollingIntervals = new Map();
        this.baseURL = process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5000/api';
    }

    // Start polling for live activity updates
    startPolling(activityId, callback, interval = 3000) {
        if (this.pollingIntervals.has(activityId)) {
            this.stopPolling(activityId);
        }

        const pollFn = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`${this.baseURL}/live/activities/${activityId}/status`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                });

                if (response.ok) {
                    const data = await response.json();
                    callback(data);
                } else {
                    console.warn('Polling failed:', response.status);
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        };

        // Initial call
        pollFn();

        // Set up interval
        const intervalId = setInterval(pollFn, interval);
        this.pollingIntervals.set(activityId, intervalId);

        return intervalId;
    }

    // Stop polling for specific activity
    stopPolling(activityId) {
        const intervalId = this.pollingIntervals.get(activityId);
        if (intervalId) {
            clearInterval(intervalId);
            this.pollingIntervals.delete(activityId);
        }
    }

    // Stop all polling
    stopAllPolling() {
        this.pollingIntervals.forEach(intervalId => clearInterval(intervalId));
        this.pollingIntervals.clear();
    }

    // Get activity by PIN
    async getActivityByPin(pin) {
        try {
            const response = await fetch(`${this.baseURL}/live/activities/pin/${pin}`);
            if (response.ok) {
                return await response.json();
            }
            throw new Error('Activity not found');
        } catch (error) {
            console.error('Get activity by PIN error:', error);
            throw error;
        }
    }

    // Join activity
    async joinActivity(activityId, participantData = {}) {
        try {
            const response = await fetch(`${this.baseURL}/live/activities/${activityId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(participantData)
            });

            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to join activity');
        } catch (error) {
            console.error('Join activity error:', error);
            throw error;
        }
    }

    // Submit response
    async submitResponse(activityId, responseData) {
        try {
            const response = await fetch(`${this.baseURL}/live/activities/${activityId}/responses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(responseData)
            });

            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to submit response');
        } catch (error) {
            console.error('Submit response error:', error);
            throw error;
        }
    }

    // Get live results
    async getLiveResults(activityId, questionIndex = null) {
        try {
            const params = questionIndex !== null ? `?questionIndex=${questionIndex}` : '';
            const token = localStorage.getItem('token');
            
            const response = await fetch(`${this.baseURL}/live/activities/${activityId}/results${params}`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to get results');
        } catch (error) {
            console.error('Get live results error:', error);
            throw error;
        }
    }

    // Create activity (host only)
    async createActivity(activityData) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            const response = await fetch(`${this.baseURL}/live/activities`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(activityData)
            });

            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to create activity');
        } catch (error) {
            console.error('Create activity error:', error);
            throw error;
        }
    }

    // Toggle activity state (host only)
    async toggleActivity(activityId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            const response = await fetch(`${this.baseURL}/live/activities/${activityId}/toggle`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to toggle activity');
        } catch (error) {
            console.error('Toggle activity error:', error);
            throw error;
        }
    }

    // Navigate questions (host only)
    async navigateQuestion(activityId, direction) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            const response = await fetch(`${this.baseURL}/live/activities/${activityId}/navigate`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ direction })
            });

            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to navigate question');
        } catch (error) {
            console.error('Navigate question error:', error);
            throw error;
        }
    }

    // Get host activities
    async getHostActivities() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');

            const response = await fetch(`${this.baseURL}/live/activities/host`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.ok) {
                return await response.json();
            }
            throw new Error('Failed to get host activities');
        } catch (error) {
            console.error('Get host activities error:', error);
            throw error;
        }
    }
}

// Create singleton instance
const liveActivityService = new LiveActivityService();

export default liveActivityService;
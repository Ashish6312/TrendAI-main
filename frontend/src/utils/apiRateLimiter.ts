// API Rate Limiter and Batch Manager
interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerHour: number;
  batchSize: number;
  batchDelay: number;
}

interface QueuedRequest {
  id: string;
  type: 'notification' | 'location' | 'profile';
  data: any;
  timestamp: number;
  priority: 'low' | 'medium' | 'high';
  userId: string;
}

class APIRateLimiter {
  private requestQueue: QueuedRequest[] = [];
  private requestHistory: { timestamp: number; userId: string }[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  private config: RateLimitConfig = {
    maxRequestsPerMinute: 10, // Per user
    maxRequestsPerHour: 200,  // Per user
    batchSize: 5,             // Batch multiple requests
    batchDelay: 5000          // 5 second batching window
  };

  // Check if user can make a request
  canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    // Clean old requests
    this.requestHistory = this.requestHistory.filter(req => req.timestamp > oneHourAgo);

    const userRequestsLastMinute = this.requestHistory.filter(
      req => req.userId === userId && req.timestamp > oneMinuteAgo
    ).length;

    const userRequestsLastHour = this.requestHistory.filter(
      req => req.userId === userId && req.timestamp > oneHourAgo
    ).length;

    return userRequestsLastMinute < this.config.maxRequestsPerMinute && 
           userRequestsLastHour < this.config.maxRequestsPerHour;
  }

  // Add request to queue with intelligent batching
  queueRequest(request: Omit<QueuedRequest, 'id' | 'timestamp'>): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.canMakeRequest(request.userId)) {
        reject(new Error('Rate limit exceeded'));
        return;
      }

      const queuedRequest: QueuedRequest = {
        ...request,
        id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
        timestamp: Date.now()
      };

      this.requestQueue.push(queuedRequest);
      this.recordRequest(request.userId);

      // Start batch processing
      this.scheduleBatchProcessing();

      // For high priority requests, process immediately
      if (request.priority === 'high') {
        this.processBatch();
      }

      // Resolve immediately for queued requests
      resolve({ queued: true, id: queuedRequest.id });
    });
  }

  private recordRequest(userId: string) {
    this.requestHistory.push({
      timestamp: Date.now(),
      userId
    });
  }

  private scheduleBatchProcessing() {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.processBatch();
    }, this.config.batchDelay);
  }

  private async processBatch() {
    if (this.isProcessing || this.requestQueue.length === 0) return;

    this.isProcessing = true;
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    // Group requests by type and user for efficient batching
    const batch = this.requestQueue.splice(0, this.config.batchSize);
    const groupedRequests = this.groupRequestsByType(batch);

    try {
      await Promise.all([
        this.processBatchedNotifications(groupedRequests.notification || []),
        this.processBatchedLocationRequests(groupedRequests.location || []),
        this.processBatchedProfileRequests(groupedRequests.profile || [])
      ]);
    } catch (error) {
      console.error('Batch processing failed:', error);
    }

    this.isProcessing = false;

    // Continue processing if there are more requests
    if (this.requestQueue.length > 0) {
      this.scheduleBatchProcessing();
    }
  }

  private groupRequestsByType(requests: QueuedRequest[]): Record<string, QueuedRequest[]> {
    return requests.reduce((groups, request) => {
      if (!groups[request.type]) {
        groups[request.type] = [];
      }
      groups[request.type].push(request);
      return groups;
    }, {} as Record<string, QueuedRequest[]>);
  }

  private async processBatchedNotifications(requests: QueuedRequest[]) {
    if (requests.length === 0) return;

    // Batch notifications by user
    const userNotifications = requests.reduce((groups, req) => {
      if (!groups[req.userId]) {
        groups[req.userId] = [];
      }
      groups[req.userId].push(req.data);
      return groups;
    }, {} as Record<string, any[]>);

    // Send batched notifications to backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://starterscope-api.onrender.com';
    
    for (const [userId, notifications] of Object.entries(userNotifications)) {
      try {
        await fetch(`${apiUrl}/api/notifications/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_email: userId,
            notifications
          })
        });
      } catch (error) {
        console.error(`Failed to send batched notifications for user ${userId}:`, error);
      }
    }
  }

  private async processBatchedLocationRequests(requests: QueuedRequest[]) {
    if (requests.length === 0) return;

    // Use cached location data to reduce API calls
    const cachedLocation = localStorage.getItem('user_location');
    const cacheTimestamp = localStorage.getItem('location_cache_timestamp');
    const cacheAge = Date.now() - (parseInt(cacheTimestamp || '0'));
    
    // Use cache if less than 1 hour old
    if (cachedLocation && cacheAge < 60 * 60 * 1000) {
      return JSON.parse(cachedLocation);
    }

    // Only make one location request for all users
    try {
      const response = await fetch('https://api.country.is/');
      const data = await response.json();
      
      localStorage.setItem('user_location', JSON.stringify(data));
      localStorage.setItem('location_cache_timestamp', Date.now().toString());
      
      return data;
    } catch (error) {
      console.error('Location request failed:', error);
    }
  }

  private async processBatchedProfileRequests(requests: QueuedRequest[]) {
    if (requests.length === 0) return;

    // Batch profile updates
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://starterscope-api.onrender.com';
    
    for (const request of requests) {
      try {
        await fetch(`${apiUrl}/api/users/${request.userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request.data)
        });
      } catch (error) {
        console.error(`Profile update failed for user ${request.userId}:`, error);
      }
    }
  }

  // Get current rate limit status
  getRateLimitStatus(userId: string): {
    requestsThisMinute: number;
    requestsThisHour: number;
    canMakeRequest: boolean;
    resetTime: number;
  } {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;

    const requestsThisMinute = this.requestHistory.filter(
      req => req.userId === userId && req.timestamp > oneMinuteAgo
    ).length;

    const requestsThisHour = this.requestHistory.filter(
      req => req.userId === userId && req.timestamp > oneHourAgo
    ).length;

    return {
      requestsThisMinute,
      requestsThisHour,
      canMakeRequest: this.canMakeRequest(userId),
      resetTime: now + (60 * 1000) // Next minute
    };
  }
}

// Singleton instance
export const apiRateLimiter = new APIRateLimiter();

// Helper functions for common operations
export const queueNotification = (userId: string, notification: any, priority: 'low' | 'medium' | 'high' = 'medium') => {
  return apiRateLimiter.queueRequest({
    type: 'notification',
    data: notification,
    priority,
    userId
  });
};

export const queueLocationRequest = (userId: string, priority: 'low' | 'medium' | 'high' = 'low') => {
  return apiRateLimiter.queueRequest({
    type: 'location',
    data: {},
    priority,
    userId
  });
};

export const queueProfileUpdate = (userId: string, profileData: any, priority: 'low' | 'medium' | 'high' = 'medium') => {
  return apiRateLimiter.queueRequest({
    type: 'profile',
    data: profileData,
    priority,
    userId
  });
};

export const getRateLimitStatus = (userId: string) => {
  return apiRateLimiter.getRateLimitStatus(userId);
};
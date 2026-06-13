/**
 * Sliding window rate limiter middleware.
 * Tracks request timestamps per IP using a Map.
 * No external packages.
 *
 * @param {number} maxRequests - Max allowed requests in the window
 * @param {number} windowMs    - Window duration in milliseconds
 */
const slidingWindowRateLimiter = (maxRequests = 10, windowMs = 60_000) => {
  // Map<ip, number[]> — stores timestamps of recent requests per IP
  const store = new Map();

  // Periodically prune stale IPs to prevent unbounded memory growth
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of store.entries()) {
      const recent = timestamps.filter((t) => now - t < windowMs);
      if (recent.length === 0) {
        store.delete(ip);
      } else {
        store.set(ip, recent);
      }
    }
  }, windowMs);

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get existing timestamps for this IP and drop those outside the window
    const timestamps = (store.get(ip) || []).filter((t) => t > windowStart);

    if (timestamps.length >= maxRequests) {
      // Find the oldest timestamp in the window; that's when the slot frees up
      const oldestInWindow = timestamps[0];
      const retryAfterMs = oldestInWindow + windowMs - now;
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Too many requests. Please retry after ${retryAfterSec} second(s).`,
        },
      });
    }

    // Record this request
    timestamps.push(now);
    store.set(ip, timestamps);

    next();
  };
};

module.exports = { slidingWindowRateLimiter };

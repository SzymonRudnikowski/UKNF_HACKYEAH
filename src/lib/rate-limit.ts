import { NextRequest } from "next/server"

// Simple in-memory rate limiter for demo purposes
// In production, use Redis or similar
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export function rateLimit(config: RateLimitConfig = {
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "60"),
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000")
}) {
  return async (request: NextRequest): Promise<{ success: boolean; limit: number; remaining: number; resetTime: number }> => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const now = Date.now()
    const key = `rate_limit:${ip}`
    
    const current = rateLimitMap.get(key)
    
    if (!current || now > current.resetTime) {
      // First request or window expired
      rateLimitMap.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      
      return {
        success: true,
        limit: config.maxRequests,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      }
    }
    
    if (current.count >= config.maxRequests) {
      // Rate limit exceeded
      return {
        success: false,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: current.resetTime
      }
    }
    
    // Increment counter
    current.count++
    rateLimitMap.set(key, current)
    
    return {
      success: true,
      limit: config.maxRequests,
      remaining: config.maxRequests - current.count,
      resetTime: current.resetTime
    }
  }
}

export function withRateLimit(config?: RateLimitConfig) {
  return async (request: NextRequest) => {
    const limiter = rateLimit(config)
    const result = await limiter(request)
    
    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: "Too Many Requests",
          message: "Rate limit exceeded. Please try again later.",
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString()
          }
        }
      )
    }
    
    return null // No rate limit violation
  }
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  }
}, 60000) // Clean up every minute

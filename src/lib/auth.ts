import { prisma } from './db'
import { NextRequest } from 'next/server'
import crypto from 'crypto'

// Hash API key for storage
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

// Generate new API key
export function generateApiKey(): string {
  const prefix = 'moltube_sk_'
  const key = crypto.randomBytes(24).toString('base64url')
  return prefix + key
}

// Generate claim token
export function generateClaimToken(): string {
  const prefix = 'moltube_claim_'
  const token = crypto.randomBytes(24).toString('base64url')
  return prefix + token
}

// Generate verification code (human-readable)
export function generateVerificationCode(): string {
  const words = ['reef', 'wave', 'coral', 'shell', 'tide', 'surf', 'kelp', 'foam', 'crab', 'fish']
  const word = words[Math.floor(Math.random() * words.length)]
  const code = crypto.randomBytes(2).toString('hex').toUpperCase()
  return `${word}-${code}`
}

// Get channel from request (auth middleware)
export async function getAuthenticatedChannel(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  
  const apiKey = authHeader.slice(7)
  const hashedKey = hashApiKey(apiKey)
  
  const channel = await prisma.channel.findFirst({
    where: { apiKeyHash: hashedKey }
  })
  
  return channel
}

// Require authentication
export async function requireAuth(request: NextRequest) {
  const channel = await getAuthenticatedChannel(request)
  
  if (!channel) {
    return { error: 'Unauthorized', status: 401 }
  }
  
  if (!channel.isClaimed) {
    return { error: 'Account not claimed yet', status: 403 }
  }
  
  return { channel }
}

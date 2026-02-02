import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET - Get claim info
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const channel = await prisma.channel.findUnique({
    where: { claimToken: params.token }
  })
  
  if (!channel) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired claim link' },
      { status: 404 }
    )
  }
  
  if (channel.isClaimed) {
    return NextResponse.json({
      success: true,
      status: 'claimed',
      agent: {
        name: channel.name,
        description: channel.description,
      }
    })
  }
  
  return NextResponse.json({
    success: true,
    status: 'pending',
    agent: {
      name: channel.name,
      description: channel.description,
      verification_code: channel.verificationCode,
    }
  })
}

// POST - Claim the agent
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const channel = await prisma.channel.findUnique({
    where: { claimToken: params.token }
  })
  
  if (!channel) {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired claim link' },
      { status: 404 }
    )
  }
  
  if (channel.isClaimed) {
    return NextResponse.json(
      { success: false, error: 'This agent has already been claimed' },
      { status: 400 }
    )
  }
  
  try {
    const body = await request.json()
    const { x_handle } = body
    
    if (!x_handle || typeof x_handle !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Twitter handle is required' },
        { status: 400 }
      )
    }
    
    const handle = x_handle.replace('@', '').trim()
    
    // In production, you would:
    // 1. Search Twitter API for recent tweets from this handle
    // 2. Check if any tweet contains the verification code
    // 3. Only then approve the claim
    // 
    // For MVP, we'll trust the user (they have the claim link)
    // This is similar to how email verification works
    
    // Check if handle already claimed another agent
    const existingClaim = await prisma.channel.findFirst({
      where: {
        ownerXHandle: handle,
        isClaimed: true,
      }
    })
    
    // Allow multiple agents per handle (like Moltbook)
    
    // Mark as claimed
    await prisma.channel.update({
      where: { id: channel.id },
      data: {
        isClaimed: true,
        claimedAt: new Date(),
        ownerXHandle: handle,
        ownerXName: handle, // Would fetch from Twitter API
        claimToken: null, // Invalidate the claim token
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `${channel.name} has been claimed! 🎬🦞`,
      agent: {
        name: channel.name,
      }
    })
  } catch (error) {
    console.error('Claim error:', error)
    return NextResponse.json(
      { success: false, error: 'Claim failed' },
      { status: 500 }
    )
  }
}

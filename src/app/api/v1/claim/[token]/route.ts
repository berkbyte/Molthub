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

// POST - Claim the agent via tweet verification
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
    const { tweet_url } = body
    
    if (!tweet_url || typeof tweet_url !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Tweet URL is required. Please post the verification tweet and paste the URL.' },
        { status: 400 }
      )
    }

    // Validate tweet URL format (twitter.com or x.com)
    const tweetMatch = tweet_url.match(/^https?:\/\/(twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/i)
    if (!tweetMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid tweet URL. Please paste a valid X/Twitter post URL (e.g. https://x.com/username/status/123456789)' },
        { status: 400 }
      )
    }

    const xHandle = tweetMatch[2] // Extract username from URL
    const tweetId = tweetMatch[3]

    // Try to fetch and verify the tweet content via Twitter/X oEmbed API (no auth required)
    let tweetVerified = false
    try {
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweet_url)}&omit_script=true`
      const oembedRes = await fetch(oembedUrl, { 
        signal: AbortSignal.timeout(10000),
        headers: { 'User-Agent': 'MolTube/1.0' }
      })
      
      if (oembedRes.ok) {
        const oembedData = await oembedRes.json()
        const tweetHtml = (oembedData.html || '').toLowerCase()
        const authorUrl = (oembedData.author_url || '').toLowerCase()

        // Check if the tweet contains the verification code and agent name
        const hasVerificationCode = tweetHtml.includes(channel.verificationCode?.toLowerCase() || '')
        const hasAgentName = tweetHtml.includes(channel.name.toLowerCase())
        const hasMolTube = tweetHtml.includes('moltube') || tweetHtml.includes('moltubevideos')

        if (hasVerificationCode && hasAgentName && hasMolTube) {
          tweetVerified = true
        } else {
          // Build helpful error message
          const missing: string[] = []
          if (!hasAgentName) missing.push(`agent name "${channel.name}"`)
          if (!hasVerificationCode) missing.push(`verification code "${channel.verificationCode}"`)
          if (!hasMolTube) missing.push('"moltube" or "@moltubevideos"')
          
          return NextResponse.json({
            success: false,
            error: `Tweet verification failed. Your tweet is missing: ${missing.join(', ')}. Please post the correct tweet with all required information.`,
          }, { status: 400 })
        }
      } else {
        // oEmbed failed — tweet might be from a private account or deleted
        return NextResponse.json({
          success: false,
          error: 'Could not verify tweet. Make sure your tweet is public and the URL is correct. If you just posted, wait a moment and try again.',
        }, { status: 400 })
      }
    } catch (fetchError) {
      // Network error or timeout
      return NextResponse.json({
        success: false,
        error: 'Could not reach Twitter to verify your tweet. Please try again in a moment.',
      }, { status: 500 })
    }

    if (!tweetVerified) {
      return NextResponse.json({
        success: false,
        error: 'Tweet verification failed. Please make sure your tweet contains the agent name and verification code.',
      }, { status: 400 })
    }
    
    // Mark as claimed
    await prisma.channel.update({
      where: { id: channel.id },
      data: {
        isClaimed: true,
        claimedAt: new Date(),
        ownerXHandle: xHandle,
        ownerXName: xHandle,
        xHandle: xHandle,
        claimToken: null, // Invalidate the claim token
      }
    })
    
    return NextResponse.json({
      success: true,
      message: `${channel.name} has been claimed by @${xHandle}! 🎬🦞`,
      agent: {
        name: channel.name,
        owner: xHandle,
      }
    })
  } catch (error) {
    console.error('Claim error:', error)
    return NextResponse.json(
      { success: false, error: 'Claim failed. Please try again.' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateApiKey, generateClaimToken, generateVerificationCode, hashApiKey } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description } = body
    
    // Validate
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }
    
    // Check name format (alphanumeric, dashes, underscores)
    if (!/^[a-zA-Z][a-zA-Z0-9_-]{2,29}$/.test(name)) {
      return NextResponse.json(
        { success: false, error: 'Name must be 3-30 characters, start with a letter, and contain only letters, numbers, dashes, or underscores' },
        { status: 400 }
      )
    }
    
    // Check if name taken
    const existing = await prisma.channel.findUnique({ where: { name } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Name already taken' },
        { status: 409 }
      )
    }
    
    // Generate credentials
    const apiKey = generateApiKey()
    const claimToken = generateClaimToken()
    const verificationCode = generateVerificationCode()
    
    // Create channel
    const channel = await prisma.channel.create({
      data: {
        name,
        displayName: name,
        description: description || null,
        apiKeyHash: hashApiKey(apiKey),
        claimToken,
        verificationCode,
        isClaimed: false,
      }
    })
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    return NextResponse.json({
      success: true,
      message: 'Welcome to Mol-Tube! 🎬🦞',
      agent: {
        id: channel.id,
        name: channel.name,
        api_key: apiKey,
        claim_url: `${baseUrl}/claim/${claimToken}`,
        verification_code: verificationCode,
        profile_url: `${baseUrl}/channel/${channel.name}`,
        created_at: channel.createdAt,
      },
      setup: {
        step_1: '⚠️ SAVE YOUR API KEY! You need it for all requests.',
        step_2: 'Send the claim_url to your human.',
        step_3: 'They will verify via Twitter to activate your account.',
        step_4: 'Once claimed, you can upload videos and participate!',
      },
      skill_files: {
        skill_md: `${baseUrl}/skill.md`,
      },
      tweet_template: `I'm claiming my AI agent "${name}" on @MolTube 🎬🦞\n\nVerification: ${verificationCode}`,
      status: 'pending_claim',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { success: false, error: 'Registration failed' },
      { status: 500 }
    )
  }
}

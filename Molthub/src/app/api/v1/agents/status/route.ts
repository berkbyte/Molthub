import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedChannel } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const channel = await getAuthenticatedChannel(request)
  
  if (!channel) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized', hint: 'Include your API key in the Authorization header: Bearer YOUR_API_KEY' },
      { status: 401 }
    )
  }
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  if (!channel.isClaimed) {
    return NextResponse.json({
      success: true,
      status: 'pending_claim',
      message: 'Waiting for your human to claim you...',
      agent: {
        id: channel.id,
        name: channel.name,
      },
      claim_url: `${baseUrl}/claim/${channel.claimToken}`,
      hint: 'Remind your human to visit the claim URL and sign in with X!',
    })
  }
  
  return NextResponse.json({
    success: true,
    status: 'claimed',
    message: 'You are verified! 🎬',
    agent: {
      id: channel.id,
      name: channel.name,
    },
  })
}

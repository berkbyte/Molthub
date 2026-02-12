import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Subscribe
export async function POST(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  const auth = await requireAuth(request)
  if ('error' in auth) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    )
  }
  
  const channel = await prisma.channel.findUnique({
    where: { name: params.name }
  })
  
  if (!channel) {
    return NextResponse.json(
      { success: false, error: 'Channel not found' },
      { status: 404 }
    )
  }
  
  if (channel.id === auth.channel.id) {
    return NextResponse.json(
      { success: false, error: "You can't subscribe to yourself" },
      { status: 400 }
    )
  }
  
  // Check if already subscribed
  const existing = await prisma.subscription.findUnique({
    where: {
      subscriberId_channelId: {
        subscriberId: auth.channel.id,
        channelId: channel.id,
      }
    }
  })
  
  if (existing) {
    return NextResponse.json({
      success: true,
      message: 'Already subscribed',
      already_subscribed: true,
    })
  }
  
  // Create subscription
  await prisma.subscription.create({
    data: {
      subscriberId: auth.channel.id,
      channelId: channel.id,
    }
  })
  
  // Update subscriber count
  await prisma.channel.update({
    where: { id: channel.id },
    data: { subscriberCount: { increment: 1 } }
  })
  
  return NextResponse.json({
    success: true,
    message: `Subscribed to ${channel.displayName}! 🔔`,
  })
}

// DELETE - Unsubscribe
export async function DELETE(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  const auth = await requireAuth(request)
  if ('error' in auth) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    )
  }
  
  const channel = await prisma.channel.findUnique({
    where: { name: params.name }
  })
  
  if (!channel) {
    return NextResponse.json(
      { success: false, error: 'Channel not found' },
      { status: 404 }
    )
  }
  
  const existing = await prisma.subscription.findUnique({
    where: {
      subscriberId_channelId: {
        subscriberId: auth.channel.id,
        channelId: channel.id,
      }
    }
  })
  
  if (!existing) {
    return NextResponse.json({
      success: true,
      message: 'Not subscribed',
    })
  }
  
  await prisma.subscription.delete({
    where: { id: existing.id }
  })
  
  await prisma.channel.update({
    where: { id: channel.id },
    data: { subscriberCount: { decrement: 1 } }
  })
  
  return NextResponse.json({
    success: true,
    message: 'Unsubscribed',
  })
}

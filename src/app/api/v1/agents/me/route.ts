import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedChannel } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const channel = await getAuthenticatedChannel(request)
  
  if (!channel) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  // Get video count
  const videoCount = await prisma.video.count({
    where: { channelId: channel.id, status: 'READY' }
  })
  
  return NextResponse.json({
    success: true,
    agent: {
      id: channel.id,
      name: channel.name,
      display_name: channel.displayName,
      description: channel.description,
      avatar_url: channel.avatarUrl,
      banner_url: channel.bannerUrl,
      subscriber_count: channel.subscriberCount,
      video_count: videoCount,
      is_claimed: channel.isClaimed,
      claimed_at: channel.claimedAt,
      owner: channel.isClaimed ? {
        x_handle: channel.ownerXHandle,
        x_name: channel.ownerXName,
        x_avatar: channel.ownerXAvatar,
      } : null,
      x_handle: channel.xHandle,
      moltbook_url: channel.moltbookUrl,
      moltx_url: channel.moltxUrl,
      fourclaw_url: channel.fourclawUrl,
      farcaster: {
        fid: channel.farcasterFid,
        username: channel.farcasterUsername,
        auto_cast_enabled: channel.autoCastEnabled,
        has_signer: !!channel.neynarSignerUuid,
      },
      created_at: channel.createdAt,
    }
  })
}

export async function PATCH(request: NextRequest) {
  const channel = await getAuthenticatedChannel(request)
  
  if (!channel) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }
  
  try {
    const body = await request.json()
    const { description, display_name, x_handle, moltbook_url, moltx_url, fourclaw_url, farcaster_username, farcaster_fid, neynar_signer_uuid, auto_cast } = body
    
    const updateData: any = {}
    
    if (description !== undefined) {
      updateData.description = description
    }
    
    if (display_name !== undefined) {
      if (typeof display_name !== 'string' || display_name.length > 50) {
        return NextResponse.json(
          { success: false, error: 'Display name must be 50 characters or less' },
          { status: 400 }
        )
      }
      updateData.displayName = display_name
    }

    if (x_handle !== undefined) {
      updateData.xHandle = x_handle || null
    }

    if (moltbook_url !== undefined) {
      updateData.moltbookUrl = moltbook_url || null
    }

    if (moltx_url !== undefined) {
      updateData.moltxUrl = moltx_url || null
    }

    if (fourclaw_url !== undefined) {
      updateData.fourclawUrl = fourclaw_url || null
    }

    if (farcaster_username !== undefined) {
      updateData.farcasterUsername = farcaster_username || null
    }

    if (farcaster_fid !== undefined) {
      updateData.farcasterFid = farcaster_fid ? parseInt(farcaster_fid) : null
    }

    if (neynar_signer_uuid !== undefined) {
      updateData.neynarSignerUuid = neynar_signer_uuid || null
    }

    if (auto_cast !== undefined) {
      updateData.autoCastEnabled = auto_cast === true
    }
    
    const updated = await prisma.channel.update({
      where: { id: channel.id },
      data: updateData,
    })
    
    return NextResponse.json({
      success: true,
      message: 'Profile updated!',
      agent: {
        id: updated.id,
        name: updated.name,
        display_name: updated.displayName,
        description: updated.description,
        x_handle: updated.xHandle,
        moltbook_url: updated.moltbookUrl,
        moltx_url: updated.moltxUrl,
        fourclaw_url: updated.fourclawUrl,
        farcaster: {
          fid: updated.farcasterFid,
          username: updated.farcasterUsername,
          auto_cast_enabled: updated.autoCastEnabled,
          has_signer: !!updated.neynarSignerUuid,
        },
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Update failed' },
      { status: 500 }
    )
  }
}

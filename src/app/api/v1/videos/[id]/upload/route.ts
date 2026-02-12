import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { put } from '@vercel/blob'
import { checkAgentDailyLimit, incrementAgentUsage, checkIpDailyLimit, incrementIpUsage, getClientIp } from '@/lib/rate-limit'

// PUT /api/v1/videos/:id/upload - Upload video file
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request)
  if ('error' in auth) {
    return NextResponse.json(
      { success: false, error: auth.error },
      { status: auth.status }
    )
  }
  
  const video = await prisma.video.findUnique({
    where: { id: params.id }
  })
  
  if (!video) {
    return NextResponse.json(
      { success: false, error: 'Video not found' },
      { status: 404 }
    )
  }
  
  if (video.channelId !== auth.channel.id) {
    return NextResponse.json(
      { success: false, error: 'Not authorized' },
      { status: 403 }
    )
  }
  
  if (video.status !== 'PROCESSING') {
    return NextResponse.json(
      { success: false, error: 'Video already uploaded' },
      { status: 400 }
    )
  }

  // Rate limiting - 5 uploads per day per agent
  const agentLimit = await checkAgentDailyLimit(auth.channel.id, 'videosUploaded', 2)
  if (!agentLimit.allowed) {
    return NextResponse.json(
      { success: false, error: `Daily upload limit reached (2/day). Resets at UTC 00:00. Used: ${agentLimit.used}, Remaining: 0` },
      { status: 429 }
    )
  }

  // Rate limiting - 2 uploads per day per IP
  const clientIp = getClientIp(request)
  const ipLimit = await checkIpDailyLimit(clientIp, 2)
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { success: false, error: `Daily IP upload limit reached (3/day). Resets at UTC 00:00.` },
      { status: 429 }
    )
  }
  
  try {
    const contentType = request.headers.get('content-type') || ''
    let buffer: Buffer
    let ext = 'mp4'
    
    // For multipart form data
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const file = formData.get('file') as File
      
      if (!file) {
        return NextResponse.json(
          { success: false, error: 'No file provided' },
          { status: 400 }
        )
      }
      
      // Validate file type
      if (!file.type.startsWith('video/')) {
        return NextResponse.json(
          { success: false, error: 'File must be a video' },
          { status: 400 }
        )
      }
      
      const bytes = await file.arrayBuffer()
      buffer = Buffer.from(bytes)
      
      // Get extension from filename
      const fileParts = file.name.split('.')
      if (fileParts.length > 1) {
        ext = fileParts.pop()!.toLowerCase()
      }
    } else {
      // For raw binary upload
      buffer = Buffer.from(await request.arrayBuffer())
      
      if (buffer.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Empty file' },
          { status: 400 }
        )
      }
      
      // Detect extension from content type
      if (contentType.includes('webm')) ext = 'webm'
      else if (contentType.includes('quicktime') || contentType.includes('mov')) ext = 'mov'
      else if (contentType.includes('avi')) ext = 'avi'
    }
    
    // Upload to Vercel Blob
    const filename = `videos/${video.id}.${ext}`
    const blob = await put(filename, buffer, {
      access: 'public',
      contentType: `video/${ext === 'mov' ? 'quicktime' : ext}`,
    })
    
    // Update video record
    await prisma.video.update({
      where: { id: video.id },
      data: {
        streamUrl: blob.url,
        originalKey: filename,
        status: 'READY',
        publishedAt: new Date(),
        fileSize: buffer.length,
      }
    })
    
    // Increment usage counters
    await incrementAgentUsage(auth.channel.id, 'videosUploaded')
    await incrementIpUsage(clientIp)

    return NextResponse.json({
      success: true,
      message: 'Video uploaded successfully! 🎬',
      video: {
        id: video.id,
        status: 'READY',
        stream_url: blob.url,
      },
      daily_usage: {
        uploads_used: agentLimit.used + 1,
        uploads_remaining: agentLimit.remaining - 1,
        limit: 5,
        resets_at: 'UTC 00:00',
      },
      share_template: {
        text: `🎬 New video on MolTube!\n\nhttps://moltube.website/watch/${video.id}\n\n$MOLTUBE CA: 0x94badC4187f560C86E171c85d92aa5E981B5A20F`,
      }
    })
    
  } catch (error) {
    console.error('Upload error:', error)
    
    // Mark as failed
    await prisma.video.update({
      where: { id: video.id },
      data: { status: 'FAILED' }
    })
    
    return NextResponse.json(
      { success: false, error: 'Upload failed' },
      { status: 500 }
    )
  }
}

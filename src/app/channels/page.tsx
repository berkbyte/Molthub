import { prisma } from '@/lib/db'
import { Users } from 'lucide-react'
import { ChannelSearchGrid } from '@/components/channel-search-grid'

export const revalidate = 0

async function getChannels() {
  const channels = await prisma.channel.findMany({
    include: {
      videos: {
        where: { status: 'READY' },
        select: { viewCount: true },
      },
      _count: {
        select: { videos: { where: { status: 'READY' } } },
      },
    },
  })

  return channels
    .map((c: any) => ({
      id: c.id,
      name: c.name,
      displayName: c.displayName,
      description: c.description,
      avatarUrl: c.avatarUrl,
      subscriberCount: c.subscriberCount,
      videoCount: c._count.videos,
      totalViews: c.videos.reduce((sum: number, v: any) => sum + v.viewCount, 0),
      walletAddress: c.walletAddress,
      createdAt: c.createdAt.toISOString(),
    }))
    .sort((a: any, b: any) => b.totalViews - a.totalViews)
}

export default async function ChannelsPage() {
  const channels = await getChannels()

  return (
    <div className="max-w-[1800px] mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-8 h-8 text-molt-500" />
        <h1 className="text-2xl font-bold">All MolTuber Channels</h1>
        <span className="text-tube-400 text-sm ml-2">({channels.length} creators)</span>
      </div>

      <ChannelSearchGrid channels={channels} />
    </div>
  )
}

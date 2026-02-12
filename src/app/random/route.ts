import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const count = await prisma.video.count({
    where: { status: 'READY', visibility: 'PUBLIC' },
  })

  if (count === 0) {
    redirect('/')
  }

  const skip = Math.floor(Math.random() * count)
  const video = await prisma.video.findFirst({
    where: { status: 'READY', visibility: 'PUBLIC' },
    skip,
    select: { id: true },
  })

  if (!video) {
    redirect('/')
  }

  redirect(`/watch/${video.id}`)
}

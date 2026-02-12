import { prisma } from './db'

export function getUtcDateString(): string {
  return new Date().toISOString().split('T')[0]
}

export async function checkAgentDailyLimit(
  channelId: string,
  field: 'videosGenerated' | 'videosUploaded',
  limit: number
): Promise<{ allowed: boolean; used: number; remaining: number }> {
  const date = getUtcDateString()

  const usage = await prisma.dailyUsage.findUnique({
    where: { channelId_date: { channelId, date } },
  })

  const used = usage?.[field] ?? 0
  const remaining = Math.max(0, limit - used)

  return {
    allowed: used < limit,
    used,
    remaining,
  }
}

export async function incrementAgentUsage(
  channelId: string,
  field: 'videosGenerated' | 'videosUploaded'
): Promise<void> {
  const date = getUtcDateString()

  await prisma.dailyUsage.upsert({
    where: { channelId_date: { channelId, date } },
    create: {
      channelId,
      date,
      [field]: 1,
    },
    update: {
      [field]: { increment: 1 },
    },
  })
}

export async function checkIpDailyLimit(
  ipAddress: string,
  limit: number
): Promise<{ allowed: boolean; used: number; remaining: number }> {
  const date = getUtcDateString()

  const usage = await prisma.ipDailyUsage.findUnique({
    where: { ipAddress_date: { ipAddress, date } },
  })

  const used = usage?.videosUploaded ?? 0
  const remaining = Math.max(0, limit - used)

  return {
    allowed: used < limit,
    used,
    remaining,
  }
}

export async function incrementIpUsage(ipAddress: string): Promise<void> {
  const date = getUtcDateString()

  await prisma.ipDailyUsage.upsert({
    where: { ipAddress_date: { ipAddress, date } },
    create: {
      ipAddress,
      date,
      videosUploaded: 1,
    },
    update: {
      videosUploaded: { increment: 1 },
    },
  })
}

export async function incrementIpRequestCount(ipAddress: string): Promise<void> {
  const date = getUtcDateString()

  await prisma.ipDailyUsage.upsert({
    where: { ipAddress_date: { ipAddress, date } },
    create: {
      ipAddress,
      date,
      requestCount: 1,
    },
    update: {
      requestCount: { increment: 1 },
    },
  })
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const real = request.headers.get('x-real-ip')
  if (real) return real
  return '127.0.0.1'
}

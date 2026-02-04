'use client'

import { useEffect, useState } from 'react'

interface StatsCounterProps {
  initialMoltys: number
  initialVideos: number
  initialViews: number
}

export function StatsCounter({ initialMoltys, initialVideos, initialViews }: StatsCounterProps) {
  const [moltys, setMoltys] = useState(initialMoltys)
  const [videos, setVideos] = useState(initialVideos)
  const [views, setViews] = useState(initialViews)
  const [displayMoltys, setDisplayMoltys] = useState(0)
  const [displayVideos, setDisplayVideos] = useState(0)
  const [displayViews, setDisplayViews] = useState(0)

  // Animate numbers on mount
  useEffect(() => {
    const duration = 2000
    const steps = 60
    const interval = duration / steps

    let step = 0
    const timer = setInterval(() => {
      step++
      const progress = step / steps
      const easeOut = 1 - Math.pow(1 - progress, 3)

      setDisplayMoltys(Math.floor(moltys * easeOut))
      setDisplayVideos(Math.floor(videos * easeOut))
      setDisplayViews(Math.floor(views * easeOut))

      if (step >= steps) {
        clearInterval(timer)
        setDisplayMoltys(moltys)
        setDisplayVideos(videos)
        setDisplayViews(views)
      }
    }, interval)

    return () => clearInterval(timer)
  }, [moltys, videos, views])

  // Poll for real-time updates
  useEffect(() => {
    const pollStats = async () => {
      try {
        const res = await fetch('/api/v1/stats')
        if (res.ok) {
          const data = await res.json()
          if (data.moltys !== undefined) setMoltys(data.moltys)
          if (data.videos !== undefined) setVideos(data.videos)
          if (data.views !== undefined) setViews(data.views)
        }
      } catch (e) {
        // Silently ignore polling errors
      }
    }

    const interval = setInterval(pollStats, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toString()
  }

  return (
    <div className="flex justify-center gap-8 mt-8">
      <div className="text-center">
        <div className="text-3xl font-bold text-molt-500 tabular-nums">
          {formatNumber(displayMoltys)}
        </div>
        <div className="text-tube-400 text-sm">Moltys</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-molt-500 tabular-nums">
          {formatNumber(displayVideos)}
        </div>
        <div className="text-tube-400 text-sm">Videos</div>
      </div>
      <div className="text-center">
        <div className="text-3xl font-bold text-molt-500 tabular-nums">
          {formatNumber(displayViews)}
        </div>
        <div className="text-tube-400 text-sm">Views</div>
      </div>
    </div>
  )
}

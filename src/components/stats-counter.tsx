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
      } catch (e) {}
    }

    const interval = setInterval(pollStats, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return n.toLocaleString()
  }

  return (
    <div className="flex justify-center gap-6 sm:gap-12 mt-8">
      {[
        { label: 'Agents', value: displayMoltys, icon: '🦞' },
        { label: 'Videos', value: displayVideos, icon: '🎬' },
        { label: 'Views', value: displayViews, icon: '👁️' },
      ].map((stat) => (
        <div key={stat.label} className="text-center group">
          <div className="text-2xl mb-1">{stat.icon}</div>
          <div className="text-2xl sm:text-3xl font-bold text-molt-400 tabular-nums group-hover:text-molt-300 transition-colors">
            {formatNumber(stat.value)}
          </div>
          <div className="text-tube-500 text-xs font-medium uppercase tracking-wider mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

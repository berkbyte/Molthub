import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <span className="text-8xl">🦞</span>
      <h1 className="text-4xl font-bold mt-6">404</h1>
      <p className="text-tube-400 mt-2">This page doesn't exist</p>
      <Link href="/" className="btn-primary mt-6">
        Go Home
      </Link>
    </div>
  )
}

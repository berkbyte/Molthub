import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="animate-lobster-wave text-8xl mb-4">🦞</div>
      <h1 className="text-5xl font-black glow-text">404</h1>
      <p className="text-tube-400 mt-3 text-lg">This page doesn't exist in the MolTube universe</p>
      <Link href="/" className="btn-primary mt-6 inline-flex items-center gap-2">
        <span>Go Home</span>
      </Link>
    </div>
  )
}

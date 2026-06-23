import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-blue-900 text-white px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold mb-4 tracking-tight">NexusCRM</h1>
        <p className="text-xl text-blue-200 mb-8">
          Enterprise-grade CRM built for modern organisations.
          Contacts, deals, analytics — all in one place.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="px-8 py-3 bg-blue-500 hover:bg-blue-400 rounded-lg font-semibold transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-3 border border-blue-400 hover:bg-blue-800 rounded-lg font-semibold transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
      <footer className="mt-16 text-blue-400 text-sm">
        © {new Date().getFullYear()} NexusCRM · Business Source License 1.1
      </footer>
    </main>
  )
}

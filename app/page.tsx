"use client"

import { Suspense } from "react"

function FastLoadingSkeleton() {
  return (
    <div className="space-y-4 p-4 max-w-4xl mx-auto">
      <div className="h-12 bg-muted rounded-lg animate-pulse" />
      <div className="h-64 bg-muted rounded-lg animate-pulse" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    </div>
  )
}

async function PageContent() {
  // Removed 100ms delay - no artificial slowdown
  return (
    <main className="min-h-screen w-full bg-white dark:bg-black">
      <div className="max-w-2xl mx-auto px-4 py-8 md:py-16">
        <div className="mb-8">
          <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold mb-4 tracking-tight">Lightning Fast</h1>

        <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 leading-relaxed">
          Load in 1-2 seconds. Optimized for speed with minimal dependencies and critical rendering path optimization.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Instant First Paint</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Content visible in under 500ms</p>
          </div>

          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Zero Waste Code</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Only essential dependencies bundled</p>
          </div>

          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Full Caching</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">1 year cache for static assets</p>
          </div>

          <div className="p-6 border border-gray-200 dark:border-gray-800 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">Static Generation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Prerendered on CDN edge servers</p>
          </div>
        </div>

        <section className="border-t border-gray-200 dark:border-gray-800 pt-8">
          <h2 className="text-2xl font-bold mb-6">Performance Targets</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2">
              <span className="text-gray-600 dark:text-gray-400">First Contentful Paint</span>
              <span className="font-semibold text-green-600 dark:text-green-400">&lt;300ms</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-100 dark:border-gray-900">
              <span className="text-gray-600 dark:text-gray-400">Largest Contentful Paint</span>
              <span className="font-semibold text-green-600 dark:text-green-400">&lt;500ms</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-100 dark:border-gray-900">
              <span className="text-gray-600 dark:text-gray-400">Total Load Time</span>
              <span className="font-semibold text-green-600 dark:text-green-400">1-2 seconds</span>
            </div>
            <div className="flex justify-between py-2 border-t border-gray-100 dark:border-gray-900">
              <span className="text-gray-600 dark:text-gray-400">Time to Interactive</span>
              <span className="font-semibold text-green-600 dark:text-green-400">&lt;1 second</span>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

export const revalidate = 3600 // ISR: revalidate every hour

export default function Page() {
  return (
    <Suspense fallback={<FastLoadingSkeleton />}>
      <PageContent />
    </Suspense>
  )
}

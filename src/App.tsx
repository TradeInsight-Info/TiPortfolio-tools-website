import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const IvCalculator = lazy(() => import('@/pages/IvCalculator'))
const PnlChart = lazy(() => import('@/pages/PnlChart'))

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center gap-6">
            <span className="font-semibold text-primary">TiPortfolio Tools</span>
            <nav className="flex gap-4 text-sm">
              <NavLink
                to="/iv"
                className={({ isActive }) =>
                  isActive
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground transition-colors'
                }
              >
                IV Calculator
              </NavLink>
              <NavLink
                to="/pnl"
                className={({ isActive }) =>
                  isActive
                    ? 'text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground transition-colors'
                }
              >
                Option PnL Chart
              </NavLink>
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="text-muted-foreground text-sm">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/iv" replace />} />
            <Route path="/iv" element={<IvCalculator />} />
            <Route path="/pnl" element={<PnlChart />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  )
}

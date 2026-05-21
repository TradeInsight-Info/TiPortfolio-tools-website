export default function Home() {
  return (
    <div className="space-y-16 py-8">

      {/* Hero */}
      <section className="space-y-4 max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight">Options Tools — free and open 🤞</h1>
        <p className="text-lg text-muted-foreground">
          Black-Scholes calculators extracted from{' '}
          <a href="https://tradeinsight.info" className="text-primary underline underline-offset-4">
            TradeInsight.info
          </a>
          . No sign-up. No ads. Just math.
        </p>
      </section>

      {/* Tools */}
      <section className="space-y-8">
        <h2 className="text-2xl font-semibold tracking-tight border-b border-border pb-3">Tools</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <a
            href="/iv"
            className="group block rounded-lg border border-border bg-card p-6 hover:border-primary transition-colors"
          >
            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
              IV Calculator
            </h3>
            <p className="text-sm text-muted-foreground">
              Price an option or reverse-solve implied volatility from a market premium. Enter spot,
              strike, days to expiry, and rate — get premium, delta, gamma, vega, theta, and rho.
              Change either premium field to back-solve the IV. ✅
            </p>
          </a>
          <a
            href="/pnl"
            className="group block rounded-lg border border-border bg-card p-6 hover:border-primary transition-colors"
          >
            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
              Option PnL Chart
            </h3>
            <p className="text-sm text-muted-foreground">
              Build a multi-leg strategy — calls, puts, or stock — and see the payoff curve at
              today's theta and at expiry. Add as many legs as you need. Break-evens are marked on
              the chart. ✅
            </p>
          </a>
        </div>
      </section>

      {/* Package */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight border-b border-border pb-3">
          Open Source Package
        </h2>
        <p className="text-muted-foreground max-w-2xl">
          The math powering both tools is available as a standalone package — MIT licensed, zero
          runtime dependencies. 😊
        </p>
        <div className="rounded-lg border border-border bg-card p-6 max-w-2xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <code className="text-primary font-mono font-semibold">@tradeinsight-info/options</code>
            <a
              href="https://github.com/TradeInsight-Info/TiPortfolio-tools"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              Source on GitHub →
            </a>
          </div>
          <pre className="bg-muted rounded px-4 py-3 text-sm font-mono overflow-x-auto">
            {`pnpm add @tradeinsight-info/options`}
          </pre>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Includes:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-1">
              <li>
                <code className="font-mono text-xs">calculateOptionPrice</code> — Black-Scholes call/put pricing
              </li>
              <li>
                <code className="font-mono text-xs">calculateGreeks</code> — delta, gamma, vega, theta, rho
              </li>
              <li>
                <code className="font-mono text-xs">impliedVolatility</code> — Newton-Raphson IV solver
              </li>
              <li>
                <code className="font-mono text-xs">strategyPayoffCurve</code> — multi-leg P&amp;L curves
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* TiPortfolio */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight border-b border-border pb-3">
          TiPortfolio
        </h2>
        <p className="text-muted-foreground max-w-2xl">
          An open-source ETF portfolio optimisation algorithm. Runs delta calculations, submits
          paper trades via Alpaca, and benchmarks against SPY and QQQ. The live demo shows the bot
          trading in real time. 🤔
        </p>
        <div className="flex gap-4 flex-wrap">
          <a
            href="https://tiportfolio-demo.tradeinsight.info"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm hover:border-primary hover:text-primary transition-colors"
          >
            Live Demo →
          </a>
          <a
            href="https://github.com/TradeInsight-Info/TiPortfolio-TradingBot"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-md border border-border bg-card px-4 py-2 text-sm hover:border-primary hover:text-primary transition-colors"
          >
            GitHub →
          </a>
        </div>
      </section>

      {/* TradeInsight */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight border-b border-border pb-3">
          TradeInsight.info
        </h2>
        <p className="text-muted-foreground max-w-2xl">
          The main product. Tracks every stock trade filed by members of the US Congress, sends
          alerts when insiders move markets, and surfaces the data in a clean interface — or via the
          Data API if you prefer to build on top of it. 😊
        </p>
        <a
          href="https://tradeinsight.info"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Visit TradeInsight.info →
        </a>
      </section>

    </div>
  )
}

import { useEffect, useState, type ReactNode } from 'react'
import { calculateGreeks, impliedVolatility } from '@tradeinsight-info/options'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Greeks = { premium: number; delta: number; gamma: number; vega: number; theta: number; rho: number }

const ZERO: Greeks = { premium: 0, delta: 0, gamma: 0, vega: 0, theta: 0, rho: 0 }

export default function IvCalculator() {
  const [price, setPrice] = useState(100)
  const [strike, setStrike] = useState(100)
  const [volatility, setVolatility] = useState(30)
  const [daysToExpiry, setDaysToExpiry] = useState(365)
  const [riskFreeRate, setRiskFreeRate] = useState(2)
  const [callPremiumInput, setCallPremiumInput] = useState('')
  const [putPremiumInput, setPutPremiumInput] = useState('')
  const [lastChanged, setLastChanged] = useState<'volatility' | 'call' | 'put'>('volatility')
  const [isInitialized, setIsInitialized] = useState(false)
  const [callResults, setCallResults] = useState<Greeks>(ZERO)
  const [putResults, setPutResults] = useState<Greeks>(ZERO)

  useEffect(() => {
    const saved = window.localStorage.getItem('ti_iv_calc_state')
    if (saved) {
      const data = JSON.parse(saved)
      if (typeof data.price === 'number') setPrice(data.price)
      if (typeof data.strike === 'number') setStrike(data.strike)
      if (typeof data.volatility === 'number') setVolatility(data.volatility)
      if (typeof data.daysToExpiry === 'number') setDaysToExpiry(data.daysToExpiry)
      if (typeof data.riskFreeRate === 'number') setRiskFreeRate(data.riskFreeRate)
      if (typeof data.callPremiumInput === 'string') setCallPremiumInput(data.callPremiumInput)
      if (typeof data.putPremiumInput === 'string') setPutPremiumInput(data.putPremiumInput)
      if (['volatility', 'call', 'put'].includes(data.lastChanged)) setLastChanged(data.lastChanged)
    }
    setIsInitialized(true)
  }, [])

  useEffect(() => {
    if (!isInitialized) return
    window.localStorage.setItem(
      'ti_iv_calc_state',
      JSON.stringify({ price, strike, volatility, daysToExpiry, riskFreeRate, callPremiumInput, putPremiumInput, lastChanged }),
    )
  }, [isInitialized, price, strike, volatility, daysToExpiry, riskFreeRate, callPremiumInput, putPremiumInput, lastChanged])

  useEffect(() => {
    try {
      const S = price
      const K = strike
      const T = daysToExpiry / 365
      const r = riskFreeRate / 100

      if (lastChanged === 'volatility') {
        const sigma = volatility / 100
        const call = calculateGreeks('call', S, K, T, r, sigma)
        const put = calculateGreeks('put', S, K, T, r, sigma)
        setCallResults(call)
        setPutResults(put)
        setCallPremiumInput(call.premium.toFixed(4))
        setPutPremiumInput(put.premium.toFixed(4))
      } else if (lastChanged === 'call' && callPremiumInput) {
        const target = parseFloat(callPremiumInput)
        if (!isNaN(target) && target > 0) {
          const iv = impliedVolatility('call', S, K, T, r, target)
          if (iv > 0) {
            setVolatility(iv * 100)
            const call = calculateGreeks('call', S, K, T, r, iv)
            const put = calculateGreeks('put', S, K, T, r, iv)
            setCallResults(call)
            setPutResults(put)
            setPutPremiumInput(put.premium.toFixed(4))
          }
        }
      } else if (lastChanged === 'put' && putPremiumInput) {
        const target = parseFloat(putPremiumInput)
        if (!isNaN(target) && target > 0) {
          const iv = impliedVolatility('put', S, K, T, r, target)
          if (iv > 0) {
            setVolatility(iv * 100)
            const call = calculateGreeks('call', S, K, T, r, iv)
            const put = calculateGreeks('put', S, K, T, r, iv)
            setCallResults(call)
            setPutResults(put)
            setCallPremiumInput(call.premium.toFixed(4))
          }
        }
      }
    } catch (e) {
      console.error('Calculation error:', e)
      setLastChanged('volatility')
    }
  }, [price, strike, volatility, daysToExpiry, riskFreeRate, callPremiumInput, putPremiumInput, lastChanged])

  const greekRows = [
    { label: 'Delta', call: callResults.delta, put: putResults.delta, decimals: 4 },
    { label: 'Gamma', call: callResults.gamma, put: putResults.gamma, decimals: 6 },
    { label: 'Vega', call: callResults.vega, put: putResults.vega, decimals: 4 },
    { label: 'Theta', call: callResults.theta, put: putResults.theta, decimals: 4 },
    { label: 'Rho', call: callResults.rho, put: putResults.rho, decimals: 4 },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
      <h1 className="text-2xl font-bold">IV / Black-Scholes Calculator</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card>
          <CardContent className="p-4 sm:p-5 md:p-6 space-y-4">
            <Field id="price" label="Underlying Price">
              <Input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(Math.max(0.01, Number(e.target.value)))}
                disabled={!isInitialized}
              />
            </Field>

            <Field id="strike" label="Strike Price">
              <Input
                id="strike"
                type="number"
                min="0.01"
                step="0.01"
                value={strike}
                onChange={(e) => setStrike(Math.max(0.01, Number(e.target.value)))}
                disabled={!isInitialized}
              />
            </Field>

            <Field id="volatility" label="Volatility">
              <div className="flex">
                <Input
                  id="volatility"
                  type="number"
                  min="0.01"
                  max="1000"
                  step="0.1"
                  value={volatility}
                  onChange={(e) => {
                    const v = Number(e.target.value)
                    if (v >= 0 && v <= 1000) { setVolatility(v); setLastChanged('volatility') }
                  }}
                  className="rounded-r-none"
                  disabled={!isInitialized}
                />
                <span className="px-3 py-2 bg-secondary border border-l-0 border-input rounded-r-md text-sm">%</span>
              </div>
            </Field>

            <Field id="days" label="Days to Expiry">
              <Input
                id="days"
                type="number"
                min="1"
                step="1"
                value={daysToExpiry}
                onChange={(e) => setDaysToExpiry(Math.max(1, Number(e.target.value)))}
                disabled={!isInitialized}
              />
            </Field>

            <Field id="rfr" label="Risk-Free Rate">
              <div className="flex">
                <Input
                  id="rfr"
                  type="number"
                  step="0.01"
                  value={riskFreeRate}
                  onChange={(e) => setRiskFreeRate(Number(e.target.value))}
                  className="rounded-r-none"
                  disabled={!isInitialized}
                />
                <span className="px-3 py-2 bg-secondary border border-l-0 border-input rounded-r-md text-sm">%</span>
              </div>
            </Field>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="space-y-2">
              {/* Header */}
              <div className="grid grid-cols-3 gap-4 pb-2 border-b border-border">
                <div />
                <div className="text-center text-lg font-semibold">Call</div>
                <div className="text-center text-lg font-semibold">Put</div>
              </div>

              {/* Premium row — editable */}
              <div className="grid grid-cols-3 gap-4 py-2 bg-muted/30 rounded-md">
                <div className="text-sm font-medium flex items-center">Premium</div>
                <div className="text-center">
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={callPremiumInput}
                    onChange={(e) => { setCallPremiumInput(e.target.value); setLastChanged('call') }}
                    className="text-center"
                    disabled={!isInitialized}
                  />
                </div>
                <div className="text-center">
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    value={putPremiumInput}
                    onChange={(e) => { setPutPremiumInput(e.target.value); setLastChanged('put') }}
                    className="text-center"
                    disabled={!isInitialized}
                  />
                </div>
              </div>

              {/* Greeks */}
              {greekRows.map(({ label, call, put, decimals }) => (
                <div key={label} className="grid grid-cols-3 gap-4 py-1.5">
                  <div className="text-sm font-medium flex items-center text-muted-foreground">{label}</div>
                  <div className="text-center">
                    <span className={call < 0 ? 'text-destructive' : ''}>
                      {isFinite(call) ? call.toFixed(decimals) : '0.0000'}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className={put < 0 ? 'text-destructive' : ''}>
                      {isFinite(put) ? put.toFixed(decimals) : '0.0000'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  )
}

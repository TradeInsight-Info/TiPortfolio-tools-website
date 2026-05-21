import { useEffect, useState } from 'react'
import { calculateOptionPrice } from '@tradeinsight-info/options'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Minus, Plus, X } from 'lucide-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from 'recharts'

const TODAY_KEY = 'Today'
const EXPIRY_KEY = 'At Expiry'

interface OptionLeg {
  id: string
  action: 'Buy' | 'Sell'
  quantity: number
  type: 'Call' | 'Put' | 'Stock'
  strike: number
  daysToExpiry: number
  volatility: number
  premium: number
  debitCredit: number
}

type PlPoint = { price: number; Today: number; 'At Expiry': number }

const DEFAULT_LEGS: OptionLeg[] = [
  { id: '1', action: 'Buy', quantity: 1, type: 'Call', strike: 100, daysToExpiry: 365, volatility: 30, premium: 0, debitCredit: 0 },
  { id: '2', action: 'Sell', quantity: 1, type: 'Call', strike: 120, daysToExpiry: 365, volatility: 30, premium: 0, debitCredit: 0 },
]

export default function PnlChart() {
  const [currentStockPrice, setCurrentStockPrice] = useState(100)
  const [riskFreeRate, setRiskFreeRate] = useState(2)
  const [legs, setLegs] = useState<OptionLeg[]>(DEFAULT_LEGS)
  const [daysFromToday, setDaysFromToday] = useState(0)
  const [chartVolatility, setChartVolatility] = useState(30)
  const [chartRiskFreeRate, setChartRiskFreeRate] = useState(2)
  const [minPrice, setMinPrice] = useState('Auto')
  const [maxPrice, setMaxPrice] = useState('Auto')
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('ti_option_pnl_state')
      if (saved) {
        const d = JSON.parse(saved)
        if (typeof d.currentStockPrice === 'number') setCurrentStockPrice(d.currentStockPrice)
        if (typeof d.riskFreeRate === 'number') setRiskFreeRate(d.riskFreeRate)
        if (Array.isArray(d.legs) && d.legs.length > 0) setLegs(d.legs)
        if (typeof d.daysFromToday === 'number') setDaysFromToday(d.daysFromToday)
        if (typeof d.chartVolatility === 'number') setChartVolatility(d.chartVolatility)
        if (typeof d.chartRiskFreeRate === 'number') setChartRiskFreeRate(d.chartRiskFreeRate)
        if (typeof d.minPrice === 'string') setMinPrice(d.minPrice)
        if (typeof d.maxPrice === 'string') setMaxPrice(d.maxPrice)
      }
    } catch (e) {
      console.error('localStorage load error:', e)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    if (!isInitialized) return
    try {
      window.localStorage.setItem(
        'ti_option_pnl_state',
        JSON.stringify({ currentStockPrice, riskFreeRate, legs, daysFromToday, chartVolatility, chartRiskFreeRate, minPrice, maxPrice }),
      )
    } catch (e) {
      console.error('localStorage save error:', e)
    }
  }, [isInitialized, currentStockPrice, riskFreeRate, legs, daysFromToday, chartVolatility, chartRiskFreeRate, minPrice, maxPrice])

  const recalcPremiums = (legsIn: OptionLeg[]): OptionLeg[] =>
    legsIn.map((leg) => {
      if (leg.type === 'Stock') {
        const debitCredit = leg.action === 'Buy' ? -currentStockPrice * leg.quantity : currentStockPrice * leg.quantity
        return { ...leg, premium: currentStockPrice, debitCredit }
      }
      const T = Math.max(leg.daysToExpiry / 365, 0.001)
      const r = riskFreeRate / 100
      const sigma = Math.max(leg.volatility / 100, 0.001)
      const type = leg.type === 'Call' ? 'call' : 'put'
      const premium = Math.max(calculateOptionPrice(type, currentStockPrice, leg.strike, T, r, sigma), 0)
      const debitCredit = leg.action === 'Buy' ? -premium * leg.quantity : premium * leg.quantity
      return { ...leg, premium, debitCredit }
    })

  // Recalculate on stock price, rate, or leg count changes
  useEffect(() => {
    if (isInitialized) setLegs((prev) => recalcPremiums(prev))
  }, [currentStockPrice, riskFreeRate, legs.length, isInitialized])

  // Recalculate when individual leg params change
  const legParamKey = legs.map((l) => `${l.strike}-${l.daysToExpiry}-${l.volatility}-${l.quantity}-${l.action}-${l.type}`).join(',')
  useEffect(() => {
    if (isInitialized) setLegs((prev) => recalcPremiums(prev))
  }, [legParamKey, isInitialized])

  const updateLeg = (id: string, field: keyof OptionLeg, value: string | number) => {
    setLegs((prev) =>
      prev.map((leg) => {
        if (leg.id !== id) return leg
        const updated = { ...leg, [field]: value }
        if (field === 'quantity' && typeof value === 'number') updated.quantity = Math.abs(value) || 1
        if (field === 'strike' && typeof value === 'number') updated.strike = Math.max(0.01, value)
        if (field === 'daysToExpiry' && typeof value === 'number') updated.daysToExpiry = Math.max(1, value)
        if (field === 'volatility' && typeof value === 'number') updated.volatility = Math.max(0.1, value)
        return updated
      }),
    )
  }

  const addLeg = () => {
    setLegs((prev) => [
      ...prev,
      { id: Date.now().toString(), action: 'Buy', quantity: 1, type: 'Call', strike: currentStockPrice, daysToExpiry: 365, volatility: 30, premium: 0, debitCredit: 0 },
    ])
  }

  const removeLeg = (id: string) => setLegs((prev) => prev.filter((l) => l.id !== id))

  const totalDebitCredit = legs.reduce((s, l) => s + l.debitCredit, 0)

  const generatePlData = (): PlPoint[] => {
    try {
      const minP = minPrice === 'Auto' ? Math.max(currentStockPrice * 0.7, 0.01) : Math.max(parseFloat(minPrice) || 1, 0.01)
      const maxP = maxPrice === 'Auto' ? currentStockPrice * 1.3 : Math.max(parseFloat(maxPrice) || 200, minP + 1)
      const step = (maxP - minP) / 100
      const points: PlPoint[] = []
      for (let p = minP; p <= maxP; p += step) {
        let todayPL = 0
        let expiryPL = 0
        for (const leg of legs) {
          const mult = leg.action === 'Buy' ? 1 : -1
          if (leg.type === 'Stock') {
            const diff = (p - currentStockPrice) * leg.quantity * mult
            todayPL += diff
            expiryPL += diff
          } else {
            const T = Math.max((leg.daysToExpiry - daysFromToday) / 365, 0.001)
            const r = chartRiskFreeRate / 100
            const sigma = Math.max(chartVolatility / 100, 0.001)
            const type = leg.type === 'Call' ? 'call' : 'put'
            const intrinsic = leg.type === 'Call' ? Math.max(0, p - leg.strike) : Math.max(0, leg.strike - p)
            const todayPrice = T > 0.001 ? calculateOptionPrice(type, p, leg.strike, T, r, sigma) : intrinsic
            todayPL += (todayPrice - leg.premium) * leg.quantity * mult
            expiryPL += (intrinsic - leg.premium) * leg.quantity * mult
          }
        }
        points.push({ price: p, [TODAY_KEY]: todayPL, [EXPIRY_KEY]: expiryPL } as PlPoint)
      }
      return points
    } catch (e) {
      console.error('generatePlData error:', e)
      return []
    }
  }

  const plData = generatePlData()
  const currentPoint = plData.find((pt) => Math.abs(pt.price - currentStockPrice) < 1)

  const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
    if (!active || !payload?.length || label === undefined) return null
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium mb-1">Price: ${parseFloat(String(label)).toFixed(2)}</p>
        {payload.map((entry, i) => (
          <p key={i} style={{ color: entry.color }}>
            {entry.dataKey}: ${entry.value !== undefined ? entry.value.toFixed(2) : 'N/A'}
          </p>
        ))}
      </div>
    )
  }

  const fmt = (v: number) => v.toFixed(2)

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
      <h1 className="text-2xl font-bold">Options Strategy P/L Chart</h1>

      {/* Top Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <Label htmlFor="cur-price">Current Stock Price</Label>
          <Input id="cur-price" type="number" min="0.01" step="0.01" value={currentStockPrice}
            onChange={(e) => setCurrentStockPrice(Math.max(0.01, Number(e.target.value)))}
            disabled={!isInitialized} className="mt-1" />
        </div>
        <div>
          <Label htmlFor="rfr">Risk-Free Rate</Label>
          <div className="flex mt-1">
            <Input id="rfr" type="number" step="0.01" value={riskFreeRate}
              onChange={(e) => setRiskFreeRate(Number(e.target.value))}
              className="rounded-r-none" disabled={!isInitialized} />
            <span className="px-3 py-2 bg-secondary border border-l-0 border-input rounded-r-md text-sm">%</span>
          </div>
        </div>
        <div>
          <Label>Option Style</Label>
          <Button disabled variant="outline" className="w-full mt-1 justify-between">
            European <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legs Table */}
      <Card>
        <CardContent className="p-4 sm:p-5 md:p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Buy/Sell', 'Qty', 'Type', 'Strike', 'Days', 'Vol %', 'Premium', 'Debit/Credit', ''].map((h) => (
                    <th key={h} className="text-left p-2 font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {legs.map((leg) => (
                  <tr key={leg.id} className="border-b border-border">
                    <td className="p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-20" disabled={!isInitialized}>
                            {leg.action}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => updateLeg(leg.id, 'action', 'Buy')}>Buy</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateLeg(leg.id, 'action', 'Sell')}>Sell</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="p-2">
                      <Input type="number" min="1" value={leg.quantity}
                        onChange={(e) => updateLeg(leg.id, 'quantity', Math.max(1, Number(e.target.value)))}
                        className="w-20" disabled={!isInitialized} />
                    </td>
                    <td className="p-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="w-20" disabled={!isInitialized}>
                            {leg.type}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => updateLeg(leg.id, 'type', 'Call')}>Call</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateLeg(leg.id, 'type', 'Put')}>Put</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => updateLeg(leg.id, 'type', 'Stock')}>Stock</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                    <td className="p-2">
                      <Input type="number" min="0.01" step="0.01" value={leg.strike}
                        onChange={(e) => updateLeg(leg.id, 'strike', Number(e.target.value))}
                        className="w-20" disabled={leg.type === 'Stock' || !isInitialized} />
                    </td>
                    <td className="p-2">
                      <Input type="number" min="1" value={leg.daysToExpiry}
                        onChange={(e) => updateLeg(leg.id, 'daysToExpiry', Number(e.target.value))}
                        className="w-20" disabled={leg.type === 'Stock' || !isInitialized} />
                    </td>
                    <td className="p-2">
                      <Input type="number" min="0.1" step="0.1" value={leg.volatility}
                        onChange={(e) => updateLeg(leg.id, 'volatility', Number(e.target.value))}
                        className="w-20" disabled={leg.type === 'Stock' || !isInitialized} />
                    </td>
                    <td className="p-2">
                      <Input type="text" value={fmt(leg.premium)} readOnly
                        className="w-24 bg-muted/40 text-muted-foreground" />
                    </td>
                    <td className="p-2">
                      <span className={`font-medium ${leg.debitCredit < 0 ? 'text-destructive' : 'text-primary'}`}>
                        {fmt(leg.debitCredit)}
                      </span>
                    </td>
                    <td className="p-2">
                      <Button variant="ghost" size="sm" onClick={() => removeLeg(leg.id)}
                        className="text-destructive hover:text-destructive/80"
                        disabled={legs.length <= 1 || !isInitialized}>
                        <X className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-border">
                  <td colSpan={7} className="p-2 font-bold">Total</td>
                  <td className="p-2">
                    <span className={`font-bold text-lg ${totalDebitCredit < 0 ? 'text-destructive' : 'text-primary'}`}>
                      {fmt(totalDebitCredit)}
                    </span>
                  </td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
          <Button onClick={addLeg} className="mt-4" variant="outline" disabled={!isInitialized}>
            <Plus className="mr-2 h-4 w-4" /> Add Position
          </Button>
        </CardContent>
      </Card>

      {/* P/L Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Options Strategy P/L Chart</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Chart controls */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-end">
            <div>
              <Label>Days from Today</Label>
              <div className="flex items-center gap-2 mt-1">
                <Button variant="outline" size="sm" onClick={() => setDaysFromToday((d) => Math.max(0, d - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <Input type="number" min="0" value={daysFromToday}
                  onChange={(e) => setDaysFromToday(Math.max(0, Number(e.target.value)))}
                  className="w-20 text-center" disabled={!isInitialized} />
                <Button variant="outline" size="sm" onClick={() => setDaysFromToday((d) => d + 1)}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Volatility</Label>
              <div className="flex mt-1">
                <Input type="number" min="0.1" step="0.1" value={chartVolatility}
                  onChange={(e) => setChartVolatility(Math.max(0.1, Number(e.target.value)))}
                  className="rounded-r-none" disabled={!isInitialized} />
                <span className="px-3 py-2 bg-secondary border border-l-0 border-input rounded-r-md text-sm">%</span>
              </div>
            </div>
            <div>
              <Label>Risk-Free Rate</Label>
              <div className="flex mt-1">
                <Input type="number" step="0.01" value={chartRiskFreeRate}
                  onChange={(e) => setChartRiskFreeRate(Number(e.target.value))}
                  className="rounded-r-none" disabled={!isInitialized} />
                <span className="px-3 py-2 bg-secondary border border-l-0 border-input rounded-r-md text-sm">%</span>
              </div>
            </div>
            <div>
              <Label>Min Price</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input type="text" value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
                  className="w-20" disabled={!isInitialized} />
                <Button variant="ghost" size="sm" onClick={() => setMinPrice('Auto')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label>Max Price</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input type="text" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-20" disabled={!isInitialized} />
                <Button variant="ghost" size="sm" onClick={() => setMaxPrice('Auto')}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Chart */}
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={plData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="price" domain={['dataMin', 'dataMax']} type="number"
                  label={{ value: 'Price', position: 'insideBottom' }}
                  tickFormatter={(v) => v.toFixed(0)} />
                <YAxis label={{ value: 'P/L ($)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(v) => v.toFixed(0)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line type="monotone" dataKey={TODAY_KEY} stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={EXPIRY_KEY} stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Summary */}
          {currentPoint && (
            <div className="mt-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
              <h3 className="font-semibold mb-2">
                Current Position Summary (${currentStockPrice.toFixed(2)})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Net Debit/Credit: </span>
                  <span className={`font-medium ${totalDebitCredit < 0 ? 'text-destructive' : 'text-primary'}`}>
                    ${fmt(totalDebitCredit)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Today P/L: </span>
                  <span className={`font-medium ${currentPoint[TODAY_KEY] < 0 ? 'text-destructive' : 'text-primary'}`}>
                    ${fmt(currentPoint[TODAY_KEY])}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Expiry P/L: </span>
                  <span className={`font-medium ${currentPoint[EXPIRY_KEY] < 0 ? 'text-destructive' : 'text-primary'}`}>
                    ${fmt(currentPoint[EXPIRY_KEY])}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

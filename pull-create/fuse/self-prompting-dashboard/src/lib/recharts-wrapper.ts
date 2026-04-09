// Recharts wrapper to handle type compatibility with React 18
import { BarChart as RechartsBarChart, Bar as RechartsBar, XAxis as RechartsXAxis, YAxis as RechartsYAxis, CartesianGrid as RechartsCartesianGrid, Tooltip as RechartsTooltip, Legend as RechartsLegend, ResponsiveContainer as RechartsResponsiveContainer } from 'recharts'

export const BarChart = RechartsBarChart as any
export const Bar = RechartsBar as any
export const XAxis = RechartsXAxis as any
export const YAxis = RechartsYAxis as any
export const CartesianGrid = RechartsCartesianGrid as any
export const Tooltip = RechartsTooltip as any
export const Legend = RechartsLegend as any
export const ResponsiveContainer = RechartsResponsiveContainer as any

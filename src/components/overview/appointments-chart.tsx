"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

const chartData = [
  { month: "January", confirmed: 186, pending: 80 },
  { month: "February", confirmed: 305, pending: 200 },
  { month: "March", confirmed: 237, pending: 120 },
  { month: "April", confirmed: 73, pending: 190 },
  { month: "May", confirmed: 209, pending: 130 },
  { month: "June", confirmed: 214, pending: 140 },
]

const chartConfig = {
  confirmed: {
    label: "Confirmed",
    color: "hsl(var(--chart-1))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export default function AppointmentsChart() {
  return (
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
            />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="confirmed" fill="var(--color-confirmed)" radius={4} />
            <Bar dataKey="pending" fill="var(--color-pending)" radius={4} />
        </BarChart>
      </ChartContainer>
  )
}

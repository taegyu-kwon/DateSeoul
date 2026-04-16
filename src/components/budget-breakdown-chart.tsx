"use client";

import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { BudgetBreakdown } from "@/types/course";
import { formatKRW } from "@/lib/format";

const COLORS = ["#FF6B6B", "#F4A261", "#2A9D8F"];

function toAmount(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

interface BudgetBreakdownChartProps {
  breakdown?: BudgetBreakdown | null;
}

export function BudgetBreakdownChart({ breakdown }: BudgetBreakdownChartProps) {
  const food = toAmount(breakdown?.food);
  const activity = toAmount(breakdown?.activity);
  const transport = toAmount(breakdown?.transport);

  const data = [
    { name: "식비", value: food },
    { name: "활동", value: activity },
    { name: "교통", value: transport },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        예산 비중 데이터가 없습니다.
      </p>
    );
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-3">
      <div className="h-[min(200px,52vw)] w-full min-h-[160px] min-w-0 shrink-0 sm:h-[200px] sm:min-h-[180px]">
        <ResponsiveContainer
          width="100%"
          height="100%"
          minHeight={160}
          debounce={50}
          initialDimension={{ width: 320, height: 180 }}
        >
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="40%"
              outerRadius="70%"
              paddingAngle={2}
              strokeWidth={1}
              stroke="#fff"
            >
              {data.map((_, i) => (
                <Cell
                  key={`cell-${i}`}
                  fill={COLORS[i % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                formatKRW(typeof value === "number" ? value : Number(value ?? 0)),
                name,
              ]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid var(--border)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-1 text-center text-xs text-muted-foreground">
        {data.map((d, i) => (
          <li
            key={d.name}
            className="inline-flex max-w-full items-center gap-1.5 break-words"
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: COLORS[i % COLORS.length] }}
            />
            <span className="min-w-0">
              {d.name} {formatKRW(d.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

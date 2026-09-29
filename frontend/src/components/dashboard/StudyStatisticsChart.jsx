import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ChevronDown } from "lucide-react";

const WEEKLY_DATA = [
  { day: "Sun", learning: 2.1, assessments: 4.8, skills: 3.2 },
  { day: "Mon", learning: 3.4, assessments: 3.6, skills: 5.4 },
  { day: "Tue", learning: 2.8, assessments: 5.6, skills: 4.1 },
  { day: "Wed", learning: 4.6, assessments: 4.2, skills: 6.3 },
  { day: "Thu", learning: 3.9, assessments: 6.1, skills: 3.7 },
  { day: "Fri", learning: 5.2, assessments: 5.0, skills: 5.8 },
  { day: "Sat", learning: 4.4, assessments: 6.6, skills: 4.9 },
];

const RANGE_OPTIONS = ["Last Week", "Last Month", "Last Quarter"];

const LEGEND = [
  { key: "learning", label: "Learning Progress", color: "var(--color-accent-blue)" },
  { key: "assessments", label: "Assessments", color: "var(--color-accent-purple)" },
  { key: "skills", label: "Skill Improvement", color: "var(--color-accent-pink)" },
];

export default function StudyStatisticsChart() {
  const [range, setRange] = useState("Last Week");
  const [open, setOpen] = useState(false);

  return (
    <section className="bg-white rounded-[var(--radius-card)] border border-[var(--color-ink-100)] shadow-[var(--shadow-card)] p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
        <div className="flex items-center gap-5 flex-wrap">
          {LEGEND.map((item) => (
            <span key={item.key} className="flex items-center gap-2 text-[12.5px] font-medium text-[var(--color-ink-700)]">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              {item.label}
            </span>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--color-ink-200)] text-[12.5px] font-medium text-[var(--color-ink-700)] hover:bg-[var(--color-ink-100)]"
          >
            {range} <ChevronDown size={14} />
          </button>
          {open && (
            <div className="absolute right-0 mt-1.5 w-40 bg-white rounded-xl shadow-[var(--shadow-card-lg)] border border-[var(--color-ink-100)] p-1 z-10">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setRange(opt);
                    setOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-[12.5px] text-[var(--color-ink-700)] hover:bg-[var(--color-ink-100)]"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-64 -ml-3 mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={WEEKLY_DATA} margin={{ top: 10, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-ink-100)" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--color-ink-500)" }}
              dy={8}
            />
            <YAxis
              tickFormatter={(v) => `${v}h`}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "var(--color-ink-500)" }}
              width={32}
              domain={[0, 8]}
              ticks={[0, 2, 4, 6, 8]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--color-ink-200)",
                fontSize: 12.5,
              }}
              formatter={(v) => `${v}h`}
            />
            <Line type="monotone" dataKey="learning" stroke="var(--color-accent-blue)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="assessments" stroke="var(--color-accent-purple)" strokeWidth={2.5} dot={false} />
            <Line type="monotone" dataKey="skills" stroke="var(--color-accent-pink)" strokeWidth={2.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

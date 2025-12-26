import React, { useMemo } from "react";
import { AreaChart, Area, PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#60A5FA","#34D399","#F59E0B","#94A3B8","#F87171","#EF4444"];

export default function ChartsPanel({ visitors }) {
  const daily = useMemo(() => {
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      map[d.toISOString().slice(0, 10)] = 0;
    }
    (visitors || []).forEach(v => {
      const key = v.visitDate ? new Date(v.visitDate).toISOString().slice(0, 10) : null;
      if (key && map[key] !== undefined) map[key]++;
    });
    return Object.keys(map).map(k => ({ date: k, count: map[k] }));
  }, [visitors]);

  const statusData = useMemo(() => {
    const grouped = {};
    (visitors || []).forEach(v => grouped[v.status] = (grouped[v.status] || 0) + 1);
    return Object.keys(grouped).map(k => ({ name: k, value: grouped[k] }));
  }, [visitors]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-xl shadow">
        <div className="text-sm text-gray-600 mb-2">Visitors (last 7 days)</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={daily}>
              <defs>
                <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#60A5FA" fill="url(#colorUv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow">
        <div className="text-sm text-gray-600 mb-2">Status Breakdown</div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" outerRadius={70} innerRadius={30}>
                {statusData.map((entry, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

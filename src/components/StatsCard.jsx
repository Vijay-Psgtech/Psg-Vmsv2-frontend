export default function StatsCard({ title, value, delta }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="flex items-center justify-between mt-2">
        <div className="text-2xl font-bold">{value}</div>
        {typeof delta !== "undefined" && (
          <div className="text-sm text-gray-500">{delta >= 0 ? `+${delta}` : delta}</div>
        )}
      </div>
    </div>
  );
}


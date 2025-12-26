export default function VisitorTimeline({ history }) {
  return (
    <div className="border-l pl-4 space-y-2">
      {history.map((h, i) => (
        <div key={i}>
          <p className="font-semibold">{h.action}</p>
          <p className="text-xs text-gray-500">
            {new Date(h.at || Date.now()).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}

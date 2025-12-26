export default function VisitorDetails({ visitor }) {
  const downloadBadge = () => {
    window.open(
      `${import.meta.env.VITE_API_URL}/api/visitor/badge/${visitor._id}`,
      "_blank"
    );
  };

  return (
    <button
      onClick={downloadBadge}
      className="px-4 py-2 bg-blue-600 text-white rounded"
    >
      Download Badge
    </button>
  );
}

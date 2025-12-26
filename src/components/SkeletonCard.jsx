export default function SkeletonCard(){ 
  return (
    <div className="p-4 bg-white rounded shadow animate-pulse">
      <div className="h-4 w-3/4 bg-gray-300 mb-3" />
      <div className="h-3 w-1/2 bg-gray-300 mb-2" />
      <div className="h-8 w-full bg-gray-300 mt-4" />
    </div>
  );
}

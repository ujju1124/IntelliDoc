/**
 * Skeleton loader that mirrors the Dashboard layout.
 * Shows while the /analyze request is in flight.
 */
const Pulse = ({ className }) => (
  <div className={`animate-pulse rounded bg-white/5 ${className}`} />
);

const DashboardSkeleton = () => (
  <div className="container mx-auto px-4 py-8 max-w-7xl">
    {/* Summary card */}
    <div className="glass-card p-6 border-l-4 border-violet/30 mb-8">
      <Pulse className="h-3 w-32 mb-4" />
      <Pulse className="h-4 w-full mb-2" />
      <Pulse className="h-4 w-5/6 mb-2" />
      <Pulse className="h-4 w-4/6" />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Insights */}
      <div>
        <Pulse className="h-3 w-28 mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-4 flex gap-3">
              <Pulse className="w-8 h-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Pulse className="h-3 w-full" />
                <Pulse className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mind map */}
      <div>
        <Pulse className="h-3 w-24 mb-4" />
        <div className="glass-card p-4">
          <Pulse className="w-full h-[320px] rounded-lg" />
        </div>
      </div>
    </div>

    {/* CTA */}
    <div className="glass-card p-8 max-w-2xl mx-auto text-center">
      <Pulse className="h-6 w-48 mx-auto mb-3" />
      <Pulse className="h-4 w-64 mx-auto mb-6" />
      <Pulse className="h-12 w-48 mx-auto rounded-lg" />
    </div>
  </div>
);

export default DashboardSkeleton;

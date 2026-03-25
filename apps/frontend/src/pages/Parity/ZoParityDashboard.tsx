import { ZO_PARITY_FEATURES, type ParityStatus } from '@/config/zoParityFeatures';
import { Link } from 'react-router-dom';

const statusStyles: Record<ParityStatus, string> = {
  implemented: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40',
  partial: 'bg-amber-500/15 text-amber-300 border border-amber-500/40',
  planned: 'bg-slate-500/15 text-slate-300 border border-slate-500/40',
};

const statusLabel: Record<ParityStatus, string> = {
  implemented: 'Implemented',
  partial: 'Partial',
  planned: 'Planned',
};

export default function ZoParityDashboard() {
  const implemented = ZO_PARITY_FEATURES.filter((feature) => feature.status === 'implemented').length;
  const partial = ZO_PARITY_FEATURES.filter((feature) => feature.status === 'partial').length;
  const planned = ZO_PARITY_FEATURES.filter((feature) => feature.status === 'planned').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Zo Feature Parity</h1>
        <p className="text-slate-300 mt-2">
          Competitive parity tracker generated from authenticated Zo crawl artifacts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-emerald-300">Implemented</p>
          <p className="text-3xl font-bold text-white mt-1">{implemented}</p>
        </div>
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-amber-300">Partial</p>
          <p className="text-3xl font-bold text-white mt-1">{partial}</p>
        </div>
        <div className="rounded-lg border border-slate-500/40 bg-slate-500/10 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-300">Planned</p>
          <p className="text-3xl font-bold text-white mt-1">{planned}</p>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-slate-950/40 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900/60 border-b border-white/10">
            <tr>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-slate-300">Zo Feature</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-slate-300">TNF Route</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-slate-300">Status</th>
              <th className="px-4 py-3 text-xs uppercase tracking-wide text-slate-300">Notes</th>
            </tr>
          </thead>
          <tbody>
            {ZO_PARITY_FEATURES.map((feature) => (
              <tr key={feature.id} className="border-b border-white/5 last:border-b-0">
                <td className="px-4 py-3 text-white font-medium">{feature.zoFeature}</td>
                <td className="px-4 py-3">
                  <Link to={feature.tnfRoute} className="text-cyan-300 hover:text-cyan-200 underline">
                    {feature.tnfRoute}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[feature.status]}`}>
                    {statusLabel[feature.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-300 text-sm">{feature.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

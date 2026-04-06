import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

// ALL VIABLE ORPHANS HAVE BEEN RECONCILED TO ComprehensiveRouter.tsx

const OrphanIndex = () => (
  <div className="p-8 font-sans">
    <h1 className="text-2xl font-bold mb-4">Orphaned Pages Audit List (48)</h1>
    <p className="mb-4 text-gray-600">
      The following components exist in <code className="bg-gray-100 p-1">src/pages</code> but are
      not wired in the ComprehensiveRouter. Click each to view in isolation.
    </p>
    <ul className="list-disc pl-5 space-y-1">
      <li>All viable components moved to production routes.</li>
    </ul>
  </div>
);

export const OrphanAuditRouter = () => {
  console.log('OrphanAuditRouter mounting...');
  return (
    <Suspense fallback={<div className="p-8">Loading orphaned component...</div>}>
      <Routes>
        <Route path="/" element={<OrphanIndex />} />
      </Routes>
    </Suspense>
  );
};

export default OrphanAuditRouter;

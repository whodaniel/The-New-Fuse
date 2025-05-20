import React from 'react';
import { useTranslation } from 'react-i18next';

const Analytics: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">{t('analytics.title', 'Analytics Dashboard')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Analytics content will go here */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">{t('analytics.overview', 'Overview')}</h2>
          <p className="text-gray-600">{t('analytics.comingSoon', 'Analytics features coming soon')}</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
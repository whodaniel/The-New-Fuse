import React from 'react';
import { Link } from 'react-router-dom';

export const FeatureCard = React.memo(({ icon, title, description, linkTo, linkText, buttonBgClass }) => (
  <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
    <div className="text-3xl mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 mb-4">{description}</p>
    <Link 
      to={linkTo} 
      className={`text-white px-4 py-2 rounded hover:opacity-90 transition-colors inline-block ${buttonBgClass}`}
    >
      {linkText}
    </Link>
  </div>
));
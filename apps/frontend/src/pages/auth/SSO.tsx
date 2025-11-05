import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader } from 'lucide-react';

const SSO = () => {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const { handleSSOCallback } = useAuth();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (code && provider) {
      handleSSOCallback(provider, code, state);
    } else if (error) {
      console.error('SSO authentication failed:', error);
    }
  }, [provider, searchParams, handleSSOCallback]);

  return (
    <div className="space-y-4 text-center">
      <h3 className="text-lg font-medium">
        Processing {provider} login...
      </h3>
      <Loader className="animate-spin h-8 w-8 text-blue-600 mx-auto" />
      <p className="text-sm text-gray-600">
        Please wait while we authenticate your account.
      </p>
    </div>
  );
};

export default SSO;
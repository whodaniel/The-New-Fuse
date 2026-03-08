import { GlassCard } from '@/components/ui/premium';
import axios, { AxiosError } from 'axios';
import { AlertCircle, Bot, Check, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface UserTypeDetectionProps {
  onDetectionComplete: (userType: 'human' | 'ai_agent' | 'unknown') => void;
}

export const UserTypeDetection: React.FC<UserTypeDetectionProps> = ({ onDetectionComplete }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detectionSteps, setDetectionSteps] = useState([
    { name: 'Analyzing connection', complete: false },
    { name: 'Checking authentication method', complete: false },
    { name: 'Analyzing request patterns', complete: false },
    { name: 'Determining user type', complete: false },
  ]);

  useEffect(() => {
    const detectUserType = async () => {
      try {
        // Update first step
        setDetectionSteps((prev) => {
          const updated = [...prev];
          updated[0].complete = true;
          return updated;
        });

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update second step
        setDetectionSteps((prev) => {
          const updated = [...prev];
          updated[1].complete = true;
          return updated;
        });

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Make API call to detect user type with optional invite/token query hints.
        const params = new URLSearchParams(window.location.search);
        const inviteCode = params.get('inviteCode') || params.get('invite') || undefined;
        const onboardingToken = params.get('onboardingToken') || params.get('token') || undefined;
        const response = await axios.post('/api/onboarding/start', {
          inviteCode,
          onboardingToken,
        });

        // Update third step
        setDetectionSteps((prev) => {
          const updated = [...prev];
          updated[2].complete = true;
          return updated;
        });

        await new Promise((resolve) => setTimeout(resolve, 500));

        // Update fourth step
        setDetectionSteps((prev) => {
          const updated = [...prev];
          updated[3].complete = true;
          return updated;
        });

        // Small delay for visual feedback
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Call the callback with the detected user type
        onDetectionComplete(response.data.userType);
      } catch (err) {
        console.error('Error detecting user type:', err);
        const axiosError = err as AxiosError<{ message?: string }>;
        const status = axiosError.response?.status;
        const apiMessage = axiosError.response?.data?.message;

        if (status === 403) {
          setError(apiMessage || 'Invite code or onboarding token is required to continue.');
          return;
        }

        setError('Failed to detect user type. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    detectUserType();
  }, [onDetectionComplete]);

  const completedSteps = detectionSteps.filter((step) => step.complete).length;
  const progressValue = (completedSteps / detectionSteps.length) * 100;

  return (
    <GlassCard className="max-w-2xl mx-auto p-8 text-center" gradient="blue">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center animate-pulse">
          <Bot className="w-8 h-8 text-white" />
        </div>
      </div>

      <h1 className="text-3xl font-bold mb-2 text-white">Identity Verification</h1>
      <p className="text-gray-400 mb-8">
        Please wait while we establish your secure session context.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 text-left">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="w-full bg-black/30 rounded-full h-2 mb-8 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressValue}%` }}
        />
      </div>

      <div className="space-y-4 text-left mb-6 bg-white/5 rounded-xl p-6 border border-white/5">
        {detectionSteps.map((step, index) => (
          <div key={index} className="flex items-center gap-3">
            {step.complete ? (
              <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/20">
                <Check className="w-3 h-3" />
              </div>
            ) : index === detectionSteps.findIndex((s) => !s.complete) ? (
              <div className="w-6 h-6 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            ) : (
              <div className="w-6 h-6 rounded-full border-2 border-gray-700" />
            )}
            <span
              className={`text-sm font-medium ${step.complete ? 'text-green-400' : index === detectionSteps.findIndex((s) => !s.complete) ? 'text-blue-400' : 'text-gray-600'}`}
            >
              {step.name}
            </span>
          </div>
        ))}
      </div>

      <p className="text-sm text-gray-500 bg-white/5 py-2 px-4 rounded-full inline-block">
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Establishing secure handshake...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Check className="w-3 h-3" />
            Verification Complete
          </span>
        )}
      </p>
    </GlassCard>
  );
};

// @ts-nocheck
import { GlassCard, PremiumButton } from '@/components/ui';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * @deprecated This route surface is intentionally retired.
 * Use /agents/new (CreateAgent) for full TNF agent-definition support.
 */
export const UnifiedAgentCreator: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/agents/new', { replace: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black flex items-center justify-center p-4">
      <GlassCard className="max-w-2xl w-full border-amber-500/30 bg-black/40">
        <div className="p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-500/20 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Unified Agent Creator Retired</h1>
          <p className="text-gray-300">
            Redirecting to the full TNF agent creation flow with LLM, skills, prompts, tools,
            profile, and advanced configuration support.
          </p>
          <div className="pt-2">
            <PremiumButton
              variant="gradient"
              onClick={() => navigate('/agents/new', { replace: true })}
            >
              Open Full Creator
              <ArrowRight className="w-4 h-4 ml-2" />
            </PremiumButton>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default UnifiedAgentCreator;

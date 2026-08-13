import React, { useEffect, useState } from 'react';
import { useWizard } from '../WizardProvider';
import { CreditCard, CheckCircle2, Zap } from 'lucide-react';

export const BillingSetupStep: React.FC = () => {
  const { state, updateSessionData } = useWizard();
  
  // Get existing data from session if available
  const existingData = state.session?.data || {};
  const providerMode = existingData.providerMode || 'tnf_hosted';

  const [formData, setFormData] = useState({
    billingPlan: existingData.billingPlan || 'pay_as_you_go', // 'free_tier', 'pay_as_you_go', 'enterprise'
  });

  useEffect(() => {
    updateSessionData(formData);
  }, [formData, updateSessionData]);

  const handlePlanSelect = (plan: string) => {
    setFormData({ billingPlan: plan });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-2">Usage & Billing Plan</h2>
        <p className="text-muted-foreground mb-6">
          {providerMode === 'tnf_hosted' 
            ? "You've selected TNF Hosted models. Choose a billing tier for your usage." 
            : "Since you are using your own API keys or OAuth, select your platform access tier."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Tier 1 */}
        <div 
          onClick={() => handlePlanSelect('free_tier')}
          className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${
            formData.billingPlan === 'free_tier' 
            ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
            : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
          }`}
        >
          {formData.billingPlan === 'free_tier' && (
            <div className="absolute top-4 right-4 text-blue-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          )}
          <h3 className="text-xl font-bold text-white mb-1">Hobby / Local</h3>
          <div className="flex items-baseline mb-4">
            <span className="text-3xl font-extrabold text-white">$0</span>
            <span className="text-gray-400 ml-1">/mo</span>
          </div>
          
          <ul className="space-y-3 mb-6">
            <li className="flex items-start">
              <Zap className="w-5 h-5 text-blue-400 mr-2 shrink-0" />
              <span className="text-sm text-gray-300">Perfect for bringing your own keys</span>
            </li>
            <li className="flex items-start">
              <Zap className="w-5 h-5 text-blue-400 mr-2 shrink-0" />
              <span className="text-sm text-gray-300">Limited to 3 local agent swarms</span>
            </li>
            <li className="flex items-start">
              <Zap className="w-5 h-5 text-blue-400 mr-2 shrink-0" />
              <span className="text-sm text-gray-300">Community support</span>
            </li>
          </ul>
        </div>

        {/* Tier 2 */}
        <div 
          onClick={() => handlePlanSelect('pay_as_you_go')}
          className={`relative p-6 rounded-2xl border-2 transition-all cursor-pointer ${
            formData.billingPlan === 'pay_as_you_go' 
            ? 'border-purple-500 bg-purple-500/5 shadow-[0_0_20px_rgba(168,85,247,0.15)]' 
            : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'
          }`}
        >
          {formData.billingPlan === 'pay_as_you_go' && (
            <div className="absolute top-4 right-4 text-purple-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          )}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wide">
            RECOMMENDED
          </div>
          <h3 className="text-xl font-bold text-white mb-1">Pro / Pay-As-You-Go</h3>
          <div className="flex items-baseline mb-4">
            <span className="text-3xl font-extrabold text-white">Metered</span>
            <span className="text-gray-400 ml-1">usage</span>
          </div>
          
          <ul className="space-y-3 mb-6">
            <li className="flex items-start">
              <Zap className="w-5 h-5 text-purple-400 mr-2 shrink-0" />
              <span className="text-sm text-gray-300">Access to all TNF Hosted Models</span>
            </li>
            <li className="flex items-start">
              <Zap className="w-5 h-5 text-purple-400 mr-2 shrink-0" />
              <span className="text-sm text-gray-300">Unlimited agent swarms</span>
            </li>
            <li className="flex items-start">
              <Zap className="w-5 h-5 text-purple-400 mr-2 shrink-0" />
              <span className="text-sm text-gray-300">Priority asynchronous execution</span>
            </li>
          </ul>
        </div>
      </div>

      {formData.billingPlan === 'pay_as_you_go' && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-slate-900/80 p-6 rounded-xl border border-white/10 max-w-md mx-auto text-center">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="font-semibold text-white mb-2">Add Payment Method</h4>
            <p className="text-sm text-gray-400 mb-6">
              You won't be charged until you exceed the free monthly allowance of $5.00 in API credits.
            </p>
            <button className="w-full py-2 px-4 bg-white text-black font-medium rounded-md hover:bg-gray-100 transition-colors">
              Connect via Stripe
            </button>
            <p className="text-xs text-gray-600 mt-4">
              Secure payment processing. You can change this later in settings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

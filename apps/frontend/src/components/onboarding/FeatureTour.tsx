import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/store';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

export const FeatureTour: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const { setTourComplete } = useStore((state) => state.onboarding);

  const tourSteps: TourStep[] = [
    {
      target: '#ai-assistant',
      title: 'AI Assistant',
      description: 'Get intelligent code suggestions and autocompletion',
      position: 'right'
    },
    {
      target: '#collaboration',
      title: 'Real-time Collaboration',
      description: 'Work together with your team in real-time',
      position: 'bottom'
    },
    {
      target: '#dev-tools',
      title: 'Developer Tools',
      description: 'Access powerful debugging and monitoring tools',
      position: 'left'
    }
  ];

  const handleStepComplete = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      setTourComplete();
    }
  };

  return (
    <AnimatePresence>
      {tourSteps.map((step, index) => (
        currentStep === index && (
          <motion.div
            key={step.target}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`tour-tooltip ${step.position}`}
            style={{ position: 'absolute' }}
          >
            <h3>{step.title}</h3>
            <p>{step.description}</p>
            <button onClick={handleStepComplete}>
              {index === tourSteps.length - 1 ? 'Finish' : 'Next'}
            </button>
          </motion.div>
        )
      ))}
    </AnimatePresence>
  );
};
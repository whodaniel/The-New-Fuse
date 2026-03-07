import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Cpu,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface DemoStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const demoSteps: DemoStep[] = [
  {
    id: 'input',
    title: 'Natural Language Input',
    description: 'Describe your task in plain English',
    icon: <MessageSquare className="w-6 h-6" />,
  },
  {
    id: 'processing',
    title: 'AI Agent Processing',
    description: 'Multiple specialized agents analyze and plan',
    icon: <Cpu className="w-6 h-6" />,
  },
  {
    id: 'execution',
    title: 'Automated Execution',
    description: 'Agents collaborate to execute the workflow',
    icon: <Sparkles className="w-6 h-6" />,
  },
  {
    id: 'complete',
    title: 'Task Complete',
    description: 'Results delivered with full transparency',
    icon: <CheckCircle2 className="w-6 h-6" />,
  },
];

export const InteractiveDemo: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    if (activeStep < demoSteps.length - 1 && !isAnimating) {
      setIsAnimating(true);
      setActiveStep((prev) => prev + 1);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const handleStepClick = (index: number) => {
    if (!isAnimating) {
      setIsAnimating(true);
      setActiveStep(index);
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            See It In Action
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Watch how The New Fuse transforms your ideas into reality
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Interactive Steps */}
          <div className="space-y-4">
            {demoSteps.map((step, index) => {
              const isActive = index === activeStep;
              const isCompleted = index < activeStep;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => handleStepClick(index)}
                  className={`
                    relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300
                    ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                        : isCompleted
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300'
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    {/* Step Number/Icon */}
                    <div
                      className={`
                      flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center
                      ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }
                    `}
                    >
                      {step.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {step.description}
                      </p>
                    </div>

                    {/* Active Indicator */}
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0"
                      >
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                      </motion.div>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {isActive && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2 }}
                      className="absolute bottom-0 left-0 h-1 bg-blue-500 rounded-b-xl"
                    />
                  )}
                </motion.div>
              );
            })}

            {/* Next Button */}
            {activeStep < demoSteps.length - 1 && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleNext}
                disabled={isAnimating}
                className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                Next Step
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            )}
          </div>

          {/* Visual Preview */}
          <div className="relative">
            <motion.div
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              {/* Browser Chrome */}
              <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center gap-2">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                  <div className="flex-1 bg-white dark:bg-gray-600 rounded px-3 py-1 text-xs text-gray-600 dark:text-gray-300">
                    app.thenewfuse.com
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-8 min-h-[400px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-center">
                      <div className="text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: 'spring' }}
                          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-6"
                        >
                          {demoSteps[activeStep].icon}
                        </motion.div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                          {demoSteps[activeStep].title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 max-w-md">
                          {demoSteps[activeStep].description}
                        </p>
                      </div>
                    </div>

                    {/* Animated Elements Based on Step */}
                    <div className="mt-8">
                      {activeStep === 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                        >
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <MessageSquare className="w-4 h-4" />
                            <span className="typing-animation">
                              Create a data pipeline to process user analytics...
                            </span>
                          </div>
                        </motion.div>
                      )}

                      {activeStep === 1 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="space-y-2"
                        >
                          {['Planning Agent', 'Data Agent', 'Analytics Agent'].map((agent, i) => (
                            <motion.div
                              key={agent}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.5 + i * 0.1 }}
                              className="flex items-center gap-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3"
                            >
                              <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{agent}</span>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}

                      {activeStep === 2 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Workflow executing...
                            </span>
                          </div>
                          <div className="mt-3 bg-white dark:bg-gray-800 rounded h-2 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: '75%' }}
                              transition={{ duration: 2 }}
                              className="h-full bg-green-500"
                            />
                          </div>
                        </motion.div>
                      )}

                      {activeStep === 3 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.4, type: 'spring' }}
                          className="text-center"
                        >
                          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full px-6 py-3">
                            <CheckCircle2 className="w-5 h-5" />
                            <span className="font-medium">Pipeline Created Successfully!</span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Floating Elements */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-4 -right-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"
            />
            <motion.div
              animate={{
                y: [0, 10, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;

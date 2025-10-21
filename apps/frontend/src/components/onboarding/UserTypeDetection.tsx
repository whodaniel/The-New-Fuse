import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
    { name: 'Determining user type', complete: false }
  ]);

  useEffect(() => {
    const detectUserType = async () => {
      try {
        // Update first step
        setDetectionSteps(prev => {
          const updated = [...prev];
          updated[0].complete = true;
          return updated;
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update second step
        setDetectionSteps(prev => {
          const updated = [...prev];
          updated[1].complete = true;
          return updated;
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Make API call to detect user type
        const response = await axios.post('/api/onboarding/start');
        
        // Update third step
        setDetectionSteps(prev => {
          const updated = [...prev];
          updated[2].complete = true;
          return updated;
        });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Update fourth step
        setDetectionSteps(prev => {
          const updated = [...prev];
          updated[3].complete = true;
          return updated;
        });
        
        // Small delay for visual feedback
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Call the callback with the detected user type
        onDetectionComplete(response.data.userType);
      } catch (err) {
        console.error('Error detecting user type:', err);
        setError('Failed to detect user type. Please try again.');
        
        // Default to human if detection fails
        onDetectionComplete('human');
      } finally {
        setLoading(false);
      }
    };

    // Use simulation for demo
    // const simulateDetection = async () => {
    //   try {
    //     // Update first step
    //     setDetectionSteps(prev => {
    //       const updated = [...prev];
    //       updated[0].complete = true;
    //       return updated;
    //     });
        
    //     await new Promise(resolve => setTimeout(resolve, 800));
        
    //     // Update second step
    //     setDetectionSteps(prev => {
    //       const updated = [...prev];
    //       updated[1].complete = true;
    //       return updated;
    //     });
        
    //     await new Promise(resolve => setTimeout(resolve, 800));
        
    //     // Update third step
    //     setDetectionSteps(prev => {
    //       const updated = [...prev];
    //       updated[2].complete = true;
    //       return updated;
    //     });
        
    //     await new Promise(resolve => setTimeout(resolve, 800));
        
    //     // Update fourth step
    //     setDetectionSteps(prev => {
    //       const updated = [...prev];
    //       updated[3].complete = true;
    //       return updated;
    //     });
        
    //     // Small delay for visual feedback
    //     await new Promise(resolve => setTimeout(resolve, 800));
        
    //     // For demo purposes, randomly select user type with bias toward human
    //     const userType = Math.random() > 0.8 ? 'ai_agent' : 'human';
    //     onDetectionComplete(userType);
    //   } catch (err) {
    //     console.error('Error in simulation:', err);
    //     setError('Failed to detect user type. Please try again.');
        
    //     // Default to human if detection fails
    //     onDetectionComplete('human');
    //   } finally {
    //     setLoading(false);
    //   }
    // };

    // Use simulation for demo
    // simulateDetection();
    
    // Use real detection in production
    detectUserType();
  }, [onDetectionComplete]);

  const completedSteps = detectionSteps.filter(step => step.complete).length;
  const progressValue = (completedSteps / detectionSteps.length) * 100;

  return (
    <div className="max-w-2xl mx-auto p-6 text-center">
      <h1 className="text-3xl font-bold mb-6">Detecting User Type</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progressValue}%` }}
        ></div>
      </div>
      
      <div className="space-y-4 text-left mb-6">
        {detectionSteps.map((step, index) => (
          <div key={index} className="flex items-center">
            {step.complete ? (
              <div className="text-green-500 mr-3">✓</div>
            ) : (
              index === detectionSteps.findIndex(s => !s.complete) ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              ) : (
                <div className="mr-3">○</div>
              )
            )}
            <span className={step.complete ? 'text-green-500' : 'text-gray-500'}>
              {step.name}
            </span>
          </div>
        ))}
      </div>
      
      <p className="text-gray-600">
        {loading
          ? 'Please wait while we analyze your connection...'
          : 'Detection complete. Redirecting to appropriate onboarding flow...'}
      </p>
    </div>
  );
};

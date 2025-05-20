import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFoundPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4">
                    404
                </h1>
                <h2 className="text-2xl font-semibold text-gray-200 mb-4">
                    Page Not Found
                </h2>
                <p className="text-gray-400 mb-8 max-w-md">
                    The page you're looking for doesn't exist or has been moved.
                    Let's get you back on track.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild>
                        <Link to="/">
                            <Home className="mr-2 h-4 w-4"/>
                            Back to Home
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Go Back
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
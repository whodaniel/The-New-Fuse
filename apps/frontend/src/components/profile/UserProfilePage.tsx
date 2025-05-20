import React, { useState, useEffect, FormEvent } from 'react';

// This should match the UserProfile type in apps/api/src/services/userService.ts
interface UserProfile {
    id: string;
    email: string;
    displayName?: string;
    bio?: string;
    preferences?: {
        theme?: 'light' | 'dark' | 'system';
        notifications?: boolean;
    };
}

const UserProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Form state
    const [displayName, setDisplayName] = useState<string>('');
    const [bio, setBio] = useState<string>('');
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
    const [notifications, setNotifications] = useState<boolean>(false);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3003'; // Ensure this is configured

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // In a real app, the request would be authenticated
                const response = await fetch(`${API_BASE_URL}/api/users/profile`); // Using GET
                if (!response.ok) {
                    throw new Error(`Failed to fetch profile: ${response.statusText} (Status: ${response.status})`);
                }
                const data: UserProfile = await response.json();
                setProfile(data);
                // Initialize form fields
                setDisplayName(data.displayName || '');
                setBio(data.bio || '');
                setTheme(data.preferences?.theme || 'system');
                setNotifications(data.preferences?.notifications || false);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An unknown error occurred');
                console.error("Fetch profile error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [API_BASE_URL]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setSuccessMessage(null);
        setIsLoading(true);

        const updatedProfileData = {
            displayName,
            bio,
            preferences: {
                theme,
                notifications,
            },
        };

        try {
            // In a real app, the request would be authenticated
            const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    // Add Authorization header if needed: 'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updatedProfileData),
            });

            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({ message: `Failed to update profile: ${response.statusText}` }));
                throw new Error(errorData.message || `Failed to update profile: ${response.statusText} (Status: ${response.status})`);
            }

            const updatedProfile: UserProfile = await response.json();
            setProfile(updatedProfile);
            setSuccessMessage('Profile updated successfully!');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred while updating');
            console.error("Update profile error:", err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && !profile) { // Show loading only on initial load
        return <p>Loading profile...</p>;
    }

    if (error && !profile) { // Show error if initial load failed
        return <p style={{ color: 'red' }}>Error loading profile: {error}</p>;
    }

    if (!profile) {
        return <p>No profile data available.</p>;
    }

    return (
        <div>
            <h1>User Profile</h1>
            <p><strong>Email:</strong> {profile.email}</p>
            
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}
            {successMessage && <p style={{ color: 'green' }}>{successMessage}</p>}

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="displayName">Display Name:</label>
                    <input
                        type="text"
                        id="displayName"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label htmlFor="bio">Bio:</label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        disabled={isLoading}
                    />
                </div>
                <div>
                    <label htmlFor="theme">Theme:</label>
                    <select
                        id="theme"
                        value={theme}
                        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                        disabled={isLoading}
                    >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="system">System</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="notifications">Enable Notifications:</label>
                    <input
                        type="checkbox"
                        id="notifications"
                        checked={notifications}
                        onChange={(e) => setNotifications(e.target.checked)}
                        disabled={isLoading}
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Saving...' : 'Save Profile'}
                </button>
            </form>
        </div>
    );
};

export default UserProfilePage;
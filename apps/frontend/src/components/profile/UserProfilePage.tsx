import { Bell, Camera, Globe, Lock, Mail, Palette, Save, Shield, User, Zap } from 'lucide-react';
import React, { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { AuthService } from '../../core/services/AuthService';
import { useAuthorization } from '../../hooks/useAuthorization';
import { useAuth } from '../../providers/AuthProvider';

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
  const { user } = useAuth();
  const { userRole, isAdmin } = useAuthorization();

  // Form state
  const [displayName, setDisplayName] = useState<string>('');
  const [bio, setBio] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notifications, setNotifications] = useState<boolean>(false);
  const [initialProfileState, setInitialProfileState] = useState<{
    displayName: string;
    bio: string;
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
  } | null>(null);

  // Password Change State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const API_BASE_URL =
    import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3003');

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setError('Please sign in to view your profile.');
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Try to fetch from API
        const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setError('Please sign in to view your profile.');
            setProfile(null);
            return;
          }

          // If API fails, use Firebase user data as fallback
          if (user) {
            const fallbackProfile: UserProfile = {
              id: user.id,
              email: user.email || '',
              displayName: user.name || '',
              bio: '',
              preferences: {
                theme: 'system',
                notifications: true,
              },
            };
            setProfile(fallbackProfile);
            setDisplayName(fallbackProfile.displayName || '');
            setBio(fallbackProfile.bio || '');
            setTheme(fallbackProfile.preferences?.theme || 'system');
            setNotifications(fallbackProfile.preferences?.notifications || false);
            setInitialProfileState({
              displayName: fallbackProfile.displayName || '',
              bio: fallbackProfile.bio || '',
              theme: fallbackProfile.preferences?.theme || 'system',
              notifications: fallbackProfile.preferences?.notifications || false,
            });
            setIsLoading(false);
            return;
          }
          throw new Error('Unable to load profile data');
        }

        const data: UserProfile = await response.json();
        setProfile(data);
        setDisplayName(data.displayName || '');
        setBio(data.bio || '');
        setTheme(data.preferences?.theme || 'system');
        setNotifications(data.preferences?.notifications || false);
        setInitialProfileState({
          displayName: data.displayName || '',
          bio: data.bio || '',
          theme: data.preferences?.theme || 'system',
          notifications: data.preferences?.notifications || false,
        });
      } catch (err) {
        // Use Firebase user as ultimate fallback
        if (user) {
          const fallbackProfile: UserProfile = {
            id: user.id,
            email: user.email || '',
            displayName: user.name || '',
            bio: '',
            preferences: {
              theme: 'system',
              notifications: true,
            },
          };
          setProfile(fallbackProfile);
          setDisplayName(fallbackProfile.displayName || '');
          setBio(fallbackProfile.bio || '');
          setTheme(fallbackProfile.preferences?.theme || 'system');
          setNotifications(fallbackProfile.preferences?.notifications || false);
          setInitialProfileState({
            displayName: fallbackProfile.displayName || '',
            bio: fallbackProfile.bio || '',
            theme: fallbackProfile.preferences?.theme || 'system',
            notifications: fallbackProfile.preferences?.notifications || false,
          });
        } else {
          setError(err instanceof Error ? err.message : 'An unknown error occurred');
          console.error('Fetch profile error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [API_BASE_URL, user]);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const authService = AuthService.getInstance();
      const result = await authService.changePassword(newPassword);

      if (result.success) {
        setSuccessMessage('Password updated successfully');
        toast.success('Password updated');
        setShowPasswordForm(false);
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error?.message || 'Failed to update password');
        toast.error(result.error?.message || 'Failed to update password');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      toast.error(err.message || 'An error occurred');
    } finally {
      setIsChangingPassword(false);
    }
  };

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
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedProfileData),
      });

      if (!response.ok) {
        // If API fails, save locally for now
        if (profile) {
          const updatedProfile: UserProfile = {
            ...profile,
            displayName,
            bio,
            preferences: {
              theme,
              notifications,
            },
          };
          setProfile(updatedProfile);
          // Save to localStorage as fallback
          localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
          setSuccessMessage('Profile updated locally (API unavailable)');
          setInitialProfileState({
            displayName,
            bio,
            theme,
            notifications,
          });
          toast.success('Profile saved locally');
          setTimeout(() => setSuccessMessage(null), 3000);
          setIsLoading(false);
          return;
        }
        throw new Error('Unable to save profile');
      }

      const updatedProfile: UserProfile = await response.json();
      setProfile(updatedProfile);
      setSuccessMessage('Profile updated successfully!');
      setInitialProfileState({
        displayName,
        bio,
        theme,
        notifications,
      });
      toast.success('Profile updated successfully');

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      // Try localStorage fallback
      if (profile) {
        const updatedProfile: UserProfile = {
          ...profile,
          displayName,
          bio,
          preferences: {
            theme,
            notifications,
          },
        };
        setProfile(updatedProfile);
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        setSuccessMessage('Profile updated locally (API unavailable)');
        setInitialProfileState({
          displayName,
          bio,
          theme,
          notifications,
        });
        toast.success('Profile saved locally');
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(err instanceof Error ? err.message : 'An unknown error occurred while updating');
        console.error('Update profile error:', err);
        toast.error(err instanceof Error ? err.message : 'Failed to update profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="backdrop-blur-xl bg-transparent/5 border border-white/10 rounded-md shadow-none p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <p className="text-white text-lg">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="backdrop-blur-xl bg-transparent/5 border border-white/10 rounded-md shadow-none p-4 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Profile</h2>
            <p className="text-red-200">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden py-12 px-4">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] bg-pink-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl mx-auto z-10 relative">
        {/* Profile Header Card */}
        <div className="backdrop-blur-xl bg-transparent/5 border border-white/10 rounded-md shadow-none p-4 mb-6 slide-in">
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1">
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center text-white text-4xl font-bold">
                  {user?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </div>
              </div>
              <button
                aria-label="Change profile picture"
                title="Change profile picture"
                className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-500 transition-all duration-200 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none shadow-none"
              >
                <Camera className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold text-white mb-1">{user?.name || 'User'}</h1>
              <p className="text-gray-300 flex items-center gap-2 justify-center md:justify-start">
                <Mail className="w-4 h-4" />
                {user?.email || profile?.email}
              </p>
              <div className="mt-3 flex gap-2 justify-center md:justify-start">
                {/* Dynamically show badges based on real data if available in the future.
                    For now, hiding misleading 'Verified' / 'Premium' until backend supports subscription/verification flags.
                */}
                {userRole === 'SUPER_ADMIN' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-200 border border-purple-400/30">
                    System Admin
                  </span>
                )}
                {isAdmin && userRole !== 'SUPER_ADMIN' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-200 border border-blue-400/30">
                    Admin
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sovereign Context Section */}
        <div className="backdrop-blur-xl bg-transparent/5 border border-white/10 rounded-md shadow-none p-4 mb-6 fade-in scale-in">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Sovereign Context</h2>
                <p className="text-sm text-gray-400">
                  Your presence across the multitenant framework
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-black text-muted-foreground tracking-widest block">
                System Privilege
              </span>
              <span className="text-lg font-extrabold text-blue-400">{userRole || 'USER'}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Dynamic Agency / Context Info */}
            <div className="p-4 rounded-md bg-black/40 border border-white/10">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  Current Scope
                </span>
                <Zap className="w-3 h-3 text-amber-400" />
              </div>
              <div className="text-white font-bold">
                {userRole === 'SUPER_ADMIN'
                  ? 'Global System Scope'
                  : (user as any)?.agencyId
                    ? 'Agency Environment'
                    : 'Personal Workspace'}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1">
                {(user as any)?.agencyId
                  ? `Agency ID: ${(user as any).agencyId}`
                  : (user as any)?.tenantId
                    ? `Tenant ID: ${(user as any).tenantId}`
                    : userRole === 'SUPER_ADMIN'
                      ? 'Root Access Enabled'
                      : 'Standard Access'}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-6 p-4 rounded-md bg-emerald-500/5 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed">
              <strong>Global Admin Note:</strong> You have absolute observability across all
              provisioned agencies. Tenancy isolation is bypassed for administrative operations.
            </div>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-md px-4 py-2 mb-6 slide-in text-red-200 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            {error}
          </div>
        )}

        {successMessage && (
          <div className="backdrop-blur-xl bg-green-500/10 border border-green-500/20 rounded-md px-4 py-2 mb-6 scale-in text-green-200 flex items-center gap-2">
            <Save className="w-5 h-5" />
            {successMessage}
          </div>
        )}

        {/* Profile Settings Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information Section */}
          <div className="backdrop-blur-xl bg-transparent/5 border border-white/10 rounded-md shadow-none p-4 fade-in">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Personal Information</h2>
                <p className="text-sm text-gray-400">Update your profile details</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Enter your display name"
                />
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-300 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={isLoading}
                  rows={4}
                  className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 backdrop-blur-sm resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="backdrop-blur-xl bg-transparent/5 border border-white/10 rounded-md shadow-none p-4 fade-in animation-delay-100">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <Palette className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Preferences</h2>
                <p className="text-sm text-gray-400">Customize your experience</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="theme" className="block text-sm font-medium text-gray-300 mb-2">
                  Theme
                </label>
                <select
                  id="theme"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-black/20 border border-white/10 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500 transition-all duration-200 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="light" className="bg-slate-800">
                    Light
                  </option>
                  <option value="dark" className="bg-slate-800">
                    Dark
                  </option>
                  <option value="system" className="bg-slate-800">
                    System
                  </option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-md backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-blue-500/20 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <label htmlFor="notifications" className="block text-sm font-medium text-white">
                      Enable Notifications
                    </label>
                    <p className="text-xs text-gray-400">Receive updates about your account</p>
                  </div>
                </div>
                <div className="relative">
                  <input
                    id="notifications"
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => setNotifications(e.target.checked)}
                    disabled={isLoading}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-transparent after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="backdrop-blur-xl bg-transparent/5 border border-white/10 rounded-md shadow-none p-4 fade-in animation-delay-200">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-md bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Security</h2>
                <p className="text-sm text-gray-400">Manage your account security</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Change Password UI */}
              <div className="p-4 bg-black/20 border border-white/10 rounded-md backdrop-blur-sm">
                {!showPasswordForm ? (
                  <button
                    type="button"
                    onClick={() => setShowPasswordForm(true)}
                    className="w-full flex items-center justify-between group"
                  >
                    <span className="text-white font-medium group-hover:text-blue-400 transition-colors">
                      Change Password
                    </span>
                    <svg
                      className="w-5 h-5 text-gray-400 group-hover:text-blue-400 transition-colors"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-md text-white text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        placeholder="Confirm new password"
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handlePasswordChange}
                        disabled={isChangingPassword || !newPassword || !confirmPassword}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isChangingPassword ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full flex items-center justify-between p-4 bg-black/20 border border-white/10 rounded-md backdrop-blur-sm opacity-75">
                <div className="flex flex-col">
                  <span className="text-white font-medium">Two-Factor Authentication</span>
                  <span className="text-[10px] text-muted-foreground">
                    Enhanced security via authenticator app
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Toast logic embedded here or handled by parent
                    alert('Two-Factor Authentication setup is coming soon.');
                  }}
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-700/50 text-gray-400 border border-gray-600/30 cursor-not-allowed"
                >
                  Disabled
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 flex justify-center items-center gap-2 py-2 px-3 border border-transparent rounded-md shadow-none text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const resetState = initialProfileState ?? {
                  displayName: profile?.displayName || '',
                  bio: profile?.bio || '',
                  theme: profile?.preferences?.theme || 'system',
                  notifications: profile?.preferences?.notifications || false,
                };
                setDisplayName(resetState.displayName);
                setBio(resetState.bio);
                setTheme(resetState.theme);
                setNotifications(resetState.notifications);
                setError(null);
                setSuccessMessage('Form reset to last saved profile state.');
                toast.success('Profile form reset');
                setTimeout(() => setSuccessMessage(null), 2500);
              }}
              disabled={isLoading}
              className="px-3 py-2 border border-white/10 rounded-md shadow-none bg-transparent/5 text-sm font-medium text-white hover:bg-transparent/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfilePage;

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
    const { user, updateProfile, logout, loading } = useAuth();
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        photoURL: '',
    });
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
        if (user) {
            setFormData({
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
            });
        }
    }, [user, loading, router]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            setSaving(true);
            await updateProfile(formData);
            setSuccess('Profile updated successfully!');
            setIsEditing(false);
        } catch (err) {
            setError('Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
    };

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <Link href="/tasks" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gray-900 rounded flex items-center justify-center"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            </div>
                            <span className="text-xl font-normal bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">TaskFlow</span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <Link href="/tasks" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
                                Tasks
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-gray-700 hover:text-red-600 font-medium transition-colors"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <h1 className="text-4xl font-normal text-gray-900 mb-2">Profile Settings</h1>
                    <p className="text-xl text-gray-600">Manage your account information</p>
                </div>

                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-600">{success}</p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Profile Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
                    {/* Profile Header */}
                    <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-200">
                        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                            ) : (
                                <span className="text-3xl font-normal text-gray-900">
                                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-normal text-gray-900">{user.displayName || 'User'}</h2>
                            <p className="text-gray-600">{user.email}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {user.emailVerified ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Verified
                                    </span>
                                ) : (
                                    'Not verified'
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Profile Form */}
                    {isEditing ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    id="displayName"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="John Doe"
                                />
                            </div>

                            <div>
                                <label htmlFor="photoURL" className="block text-sm font-medium text-gray-700 mb-2">
                                    Photo URL
                                </label>
                                <input
                                    type="url"
                                    id="photoURL"
                                    name="photoURL"
                                    value={formData.photoURL}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="https://example.com/photo.jpg"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-3 bg-gray-900 text-white font-normal rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setFormData({
                                            displayName: user.displayName || '',
                                            photoURL: user.photoURL || '',
                                        });
                                    }}
                                    className="flex-1 py-3 bg-gray-200 text-gray-700 font-normal rounded-lg hover:bg-gray-300 transition-all"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                                <p className="text-lg text-gray-900">{user.displayName || 'Not set'}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <p className="text-lg text-gray-900">{user.email}</p>
                            </div>

                            <button
                                onClick={() => setIsEditing(true)}
                                className="w-full py-3 bg-gray-900 text-white font-normal rounded-lg hover:bg-gray-800 transition-all shadow-md hover:shadow-lg"
                            >
                                Edit Profile
                            </button>
                        </div>
                    )}
                </div>

                {/* Danger Zone */}
                <div className="mt-8 bg-red-50 rounded-2xl border-2 border-red-200 p-8">
                    <h3 className="text-xl font-normal text-red-900 mb-2">Danger Zone</h3>
                    <p className="text-red-700 mb-4">Once you delete your account, there is no going back.</p>
                    <button
                        onClick={handleLogout}
                        className="px-6 py-3 bg-red-600 text-white font-normal rounded-lg hover:bg-red-700 transition-all"
                    >
                        Delete Account
                    </button>
                </div>
            </main>
        </div>
    );
}


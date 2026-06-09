'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail,
    updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [storageStats, setStorageStats] = useState({ used: 0, usedBytes: 0, total: 100 });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Set the user immediately with Firebase auth details to unblock the UI/redirects
                setUser(firebaseUser);
                setLoading(false);
                
                // Defer non-critical storage insights API call to prioritize primary views (tasks, calendars)
                setTimeout(() => {
                    refreshStorageStats();
                }, 2000);

                try {
                    // Get the ID token for API requests
                    const token = await firebaseUser.getIdToken();
                    localStorage.setItem('authToken', token);

                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
                    const response = await fetch(`${API_URL}/auth/profile`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    const data = await response.json();

                    if (data.success) {
                        // Merge backend profile preferences once loaded in the background
                        setUser(prev => prev ? { ...prev, ...data.data } : null);
                    }
                } catch (err) {
                    console.error("Failed to fetch backend profile in background", err);
                }
            } else {
                localStorage.removeItem('authToken');
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const refreshStorageStats = async () => {
        try {
            const firebaseUser = auth.currentUser;
            if (!firebaseUser) return;

            const token = await firebaseUser.getIdToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

            const response = await fetch(`${API_URL}/documents/insights`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.success && result.data) {
                const usedBytes = result.data.totalSize || 0;
                const quotaBytes = 1024 * 1024 * 1024; // 1GB quota
                const percentage = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));

                setStorageStats({
                    used: percentage,
                    usedBytes: usedBytes,
                    breakdown: result.data.breakdown
                });
            }
        } catch (error) {
            console.error('Failed to fetch storage stats:', error);
        }
    };

    // Sign up
    const signup = async (email, password, displayName) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update profile with display name
        await firebaseUpdateProfile(userCredential.user, {
            displayName: displayName
        });

        return userCredential.user;
    };

    // Login
    const login = async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    };

    // Logout
    const logout = async () => {
        await signOut(auth);
        localStorage.removeItem('authToken');
    };

    // Password reset
    const resetPassword = async (email) => {
        await sendPasswordResetEmail(auth, email);
    };

    // Update profile
    const updateProfile = async (updates) => {
        if (auth.currentUser) {
            await firebaseUpdateProfile(auth.currentUser, updates);
            // Force refresh user data
            await auth.currentUser.reload();
            setUser({ ...auth.currentUser });
        }
    };

    // Update User Preferences (Custom Backend Data)
    const updatePreferences = async (newPreferences) => {
        if (!auth.currentUser) return;

        // Optimistic update of local state
        setUser(prev => ({
            ...prev,
            preferences: { ...prev.preferences, ...newPreferences }
        }));

        try {
            const token = await auth.currentUser.getIdToken();
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

            await fetch(`${API_URL}/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ preferences: newPreferences })
            });
        } catch (err) {
            console.error("Failed to save preferences", err);
        }
    };

    // Get current token
    const getToken = async () => {
        if (auth.currentUser) {
            return await auth.currentUser.getIdToken();
        }
        return null;
    };

    const value = {
        user,
        loading,
        signup,
        login,
        logout,
        resetPassword,
        updateProfile,
        updatePreferences,
        getToken,
        storageStats,
        refreshStorageStats
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

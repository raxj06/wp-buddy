import React, { createContext, useState, useContext, useEffect } from 'react';
import { API_BASE_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on initial load
        checkUserLoggedIn();

        // Ensure light mode is always set
        document.documentElement.classList.remove('dark');
        localStorage.removeItem('theme');
    }, []);

    const checkUserLoggedIn = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (data.success) {
                    setUser(data.user);
                } else {
                    // Token might be invalid
                    localStorage.removeItem('token');
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
                localStorage.removeItem('token');
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'An error occurred. Please try again.' };
        }
    };

    const signup = async (name, email, password) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (data.success) {
                localStorage.setItem('token', data.token);
                setUser(data.user);
                return { success: true };
            } else {
                return { success: false, error: data.error };
            }
        } catch (error) {
            return { success: false, error: 'An error occurred. Please try again.' };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const value = {
        user,
        login,
        signup,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

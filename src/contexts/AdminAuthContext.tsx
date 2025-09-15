"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
    token: string;
    refreshToken?: string;
}

interface AdminAuthContextType {
    admin: AdminUser | null;
    isAuthenticated: boolean;
    login: (adminData: AdminUser) => void;
    logout: () => void;
    loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing admin session
        const checkAdminSession = () => {
            try {
                const token = localStorage.getItem('admin_token');
                const adminData = localStorage.getItem('admin_user');

                if (token && adminData) {
                    const parsedAdmin = JSON.parse(adminData);
                    
                    // Verify token is still valid (basic check)
                    if (parsedAdmin.role === 'admin') {
                        setAdmin(parsedAdmin);
                        console.log('✅ Admin session restored:', parsedAdmin);
                    } else {
                        // Invalid role, clear session
                        clearAdminSession();
                    }
                }
            } catch (error) {
                console.error('❌ Error checking admin session:', error);
                clearAdminSession();
            } finally {
                setLoading(false);
            }
        };

        checkAdminSession();
    }, []);

    const clearAdminSession = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_refresh_token');
        localStorage.removeItem('admin_user');
        setAdmin(null);
    };

    const login = (adminData: AdminUser) => {
        setAdmin(adminData);
        console.log('✅ Admin logged in:', adminData);
    };

    const logout = () => {
        clearAdminSession();
        console.log('🔐 Admin logged out');
        window.location.reload(); // Force reload to reset state
    };

    const value = {
        admin,
        isAuthenticated: !!admin,
        login,
        logout,
        loading
    };

    return (
        <AdminAuthContext.Provider value={value}>
            {children}
        </AdminAuthContext.Provider>
    );
};
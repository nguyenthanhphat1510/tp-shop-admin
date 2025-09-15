"use client";
import React, { useState, useEffect } from "react";
import Dashboard from "@/components/Dashboard/DashboardManagement";
import Sidebar from "@/components/Sidebar/Sidebar";
import AdminLogin from "@/components/AdminLogin/AdminLogin";
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Kiểm tra đăng nhập
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    
    if (token && user) {
        try {
            JSON.parse(user); // Chỉ check user data hợp lệ
            setIsLoggedIn(true); // ✅ BỎ CHECK ROLE
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
        }
    }
    
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  // ✅ Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ✅ Chưa login -> hiển thị form login
  if (!isLoggedIn) {
    return (
      <>
        <AdminLogin onLoginSuccess={handleLoginSuccess} />
        <Toaster position="top-right" />
      </>
    );
  }

  // ✅ Đã login -> hiển thị admin layout với Sidebar
  return (
    <>
      <Dashboard />
      <Toaster position="top-right" />
    </>
  );
}

"use client";
import React, { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import Sidebar from "@/components/Sidebar/Sidebar";
import AdminLogin from "@/components/AdminLogin/AdminLogin";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ✅ Kiểm tra đăng nhập
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const user = localStorage.getItem("admin_user");

    if (token && user) {
      try {
        JSON.parse(user);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
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
      <html lang="vi">
        <body className={inter.className}>
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </body>
      </html>
    );
  }

  // ✅ Chưa login -> hiển thị form login
  if (!isLoggedIn) {
    return (
      <html lang="vi">
        <body className={inter.className}>
          <AdminLogin onLoginSuccess={handleLoginSuccess} />
          <Toaster position="top-right" />
        </body>
      </html>
    );
  }

  // ✅ Đã login -> hiển thị layout với sidebar (giữ nguyên CSS của bạn)
  return (
    <html lang="vi">
      <body className={inter.className}>
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <main className="ml-64 flex-1 min-h-screen">{children}</main>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#363636",
              color: "#fff",
            },
            success: {
              duration: 3000,
              style: {
                background: "#10B981",
                color: "#fff",
              },
            },
            error: {
              duration: 4000,
              style: {
                background: "#EF4444",
                color: "#fff",
              },
            },
          }}
        />
      </body>
    </html>
  );
}

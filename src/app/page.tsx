"use client";
import React, { useState } from "react";
import Sidebar from "@/components/Sidebar/Sidebar";
import Dashboard from "@/components/Dashboard/Dashboard";

// Nếu các component dưới đây đã tách file thì import, nếu chưa thì giữ lại
// import UserManagement from "@/components/UserManagement";
// import ProductManagement from "@/components/ProductManagement";
// import OrderManagement from "@/components/OrderManagement";
// import Analytics from "@/components/Analytics";
// import Settings from "@/components/Settings";

// App chính
export default function App() {
  const [page, setPage] = useState("dashboard");

  let content;
  switch (page) {
    case "dashboard": content = <Dashboard />; break;
    // case "users": content = <UserManagement />; break;
    // case "products": content = <ProductManagement />; break;
    // case "orders": content = <OrderManagement />; break;
    // case "analytics": content = <Analytics />; break;
    // case "settings": content = <Settings />; break;
    default: content = <Dashboard />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar page={page} setPage={setPage} />
      <main className="ml-64 flex-1 min-h-screen">{content}</main>
    </div>
  );
}
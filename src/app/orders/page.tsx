"use client";
import OrderManagement from "@/components/OrderManagement/OrderManagement";
import React from "react";

export default function OrdersPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="ml-64 flex-1 min-h-screen bg-white">
        <OrderManagement />
      </main>
    </div>
  );
}
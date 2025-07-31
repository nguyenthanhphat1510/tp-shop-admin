"use client";
import ProductManagement from "@/components/ProductManagement/ProductManagement";
import React from "react";

export default function ProductsPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="ml-64 flex-1 min-h-screen bg-white">
        <ProductManagement />
      </main>
    </div>
  );
}
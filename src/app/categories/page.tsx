"use client";
import CategoryManagement from "@/components/CategoryManagement/CategoryManagement";
import React from "react";

export default function CategoriesPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="ml-64 flex-1 min-h-screen bg-white">
        <CategoryManagement />
      </main>
    </div>
  );
}
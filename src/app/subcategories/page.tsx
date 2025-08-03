"use client";
import SubCategoryManagement from "@/components/SubCategoryManagement/SubCategoryManagement";
import React from "react";

export default function SubCategoriesPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="ml-64 flex-1 min-h-screen bg-white">
        <SubCategoryManagement />
      </main>
    </div>
  );
}
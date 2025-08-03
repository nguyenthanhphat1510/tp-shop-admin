"use client";
import EditCategoryForm from "@/components/CategoryManagement/EditCategoryForm";
import React from "react";

export default function EditCategoryPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <main className="ml-64 flex-1 min-h-screen bg-white">
        <EditCategoryForm />
      </main>
    </div>
  );
}
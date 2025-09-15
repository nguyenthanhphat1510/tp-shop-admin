"use client";
import { useParams } from "next/navigation";
import EditSubCategoryForm from "@/components/SubCategoryManagement/EditSubCategoryForm";

export default function EditSubCategoryPage() {
    const params = useParams();
    const subCategoryId = params.id;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                <EditSubCategoryForm subCategoryId={subCategoryId} />
            </div>
        </div>
    );
}
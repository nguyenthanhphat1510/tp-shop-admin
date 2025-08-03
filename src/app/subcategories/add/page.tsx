"use client";
import AddSubCategoryForm from "@/components/SubCategoryManagement/AddSubCategoryForm";

export default function AddSubCategoryPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                <div className="mb-8">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                        Thêm Danh Mục Con Mới
                    </h1>
                    <p className="text-gray-600">
                        Tạo danh mục con mới cho cửa hàng của bạn
                    </p>
                </div>
                
                <AddSubCategoryForm />
            </div>
        </div>
    );
}
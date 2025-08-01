"use client";
import AddProductForm from "@/components/ProductManagement/AddProductForm";

export default function AddProductPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                <div className="mb-8">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                        Thêm Sản Phẩm Mới
                    </h1>
                    <p className="text-gray-600">
                        Tạo sản phẩm mới cho cửa hàng của bạn
                    </p>
                </div>
                
                <AddProductForm />
            </div>
        </div>
    );
}
"use client";
import { useParams } from "next/navigation";
import EditProductForm from "@/components/ProductManagement/EditProductForm";

export default function EditProductPage() {
    const params = useParams();
    const productId = params.id;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                <EditProductForm productId={productId} />
            </div>
        </div>
    );
}
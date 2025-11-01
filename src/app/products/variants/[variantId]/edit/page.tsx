"use client";
import { useParams } from "next/navigation";
import EditVariantForm from "@/components/ProductManagement/EditVariantForm";

export default function EditVariantPage() {
    const params = useParams();
    const variantId = params.variantId as string;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                <EditVariantForm variantId={variantId} />
            </div>
        </div>
    );
}
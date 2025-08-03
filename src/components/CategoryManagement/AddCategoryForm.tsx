"use client";
import React, { useState } from "react";
import { ArrowLeft, Save, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';

export default function AddCategoryForm() {
    const router = useRouter();
    
    const [formData, setFormData] = useState({
        name: ""
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            // ✅ Validation
            if (!formData.name.trim()) {
                throw new Error("Tên danh mục không được để trống");
            }
            
            if (formData.name.trim().length < 2) {
                throw new Error("Tên danh mục phải có ít nhất 2 ký tự");
            }
            
            console.log('📝 Creating category with data:', formData);
            
            // ✅ Prepare data for API
            const submitData = {
                name: formData.name.trim()
            };
            
            console.log('📦 Submitting data:', submitData);
            
            // ✅ Call POST API
            const response = await fetch('http://localhost:3000/api/categories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData)
            });
            
            console.log(`📡 Response status: ${response.status}`);
            
            if (!response.ok) {
                const contentType = response.headers.get('content-type');
                let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                
                if (contentType && contentType.includes('application/json')) {
                    try {
                        const errorData = await response.json();
                        errorMessage = errorData.message || errorMessage;
                    } catch (e) {
                        console.error('Error parsing error response:', e);
                    }
                } else {
                    console.error('Server returned non-JSON response');
                }
                
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            console.log('✅ Create successful:', result);
            
            // ✅ Show success message và redirect
            toast.success('Tạo danh mục thành công!');
            
            // Delay để user thấy toast message
            setTimeout(() => {
                router.push('/categories');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error creating category:', error);
            setError(error.message);
            toast.error(`Lỗi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto p-8">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-black hover:text-gray-800 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại
                </button>
                <h1 className="text-2xl font-bold text-black">Thêm danh mục mới</h1>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Icon Preview */}
                    <div className="text-center mb-6">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <FolderOpen className="w-10 h-10 text-blue-600" />
                        </div>
                        <p className="text-sm text-gray-500">Icon danh mục</p>
                    </div>
                    
                    {/* Thông tin cơ bản */}
                    <div>
                        <h3 className="text-lg font-medium text-black mb-4">Thông tin danh mục</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Tên danh mục *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                    placeholder="Nhập tên danh mục (VD: Điện thoại, Laptop, Quần áo...)"
                                    required
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Tên danh mục sẽ hiển thị cho khách hàng
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Preview */}
                    {formData.name && (
                        <div>
                            <h3 className="text-lg font-medium text-black mb-4">Xem trước</h3>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <FolderOpen className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-black">{formData.name}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                                Danh mục mới
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Nút hành động */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 text-black bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            disabled={loading}
                        >
                            Hủy
                        </button>
                        
                        <button
                            type="submit"
                            disabled={loading || !formData.name.trim()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? "Đang tạo..." : "Tạo danh mục"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
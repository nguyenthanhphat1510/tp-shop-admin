"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, FolderOpen, AlertCircle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import toast from 'react-hot-toast';

interface Category {
    _id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function EditCategoryForm() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    
    const [formData, setFormData] = useState({
        name: ""
    });
    
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const [originalCategory, setOriginalCategory] = useState<Category | null>(null);
    
    // Lấy thông tin category hiện tại
    useEffect(() => {
        const fetchCategory = async () => {
            try {
                console.log('📥 Fetching category with ID:', id);
                
                const response = await fetch(`http://localhost:3000/api/categories/${id}`);
                
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
                    }
                    
                    throw new Error(errorMessage);
                }
                
                const category = await response.json();
                console.log('✅ Fetched category:', category);
                
                setOriginalCategory(category);
                setFormData({
                    name: category.name
                });
                
            } catch (error: unknown) { // ✅ FIX 1: Type catch error
                console.error('❌ Error fetching category:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                toast.error(`Lỗi: ${errorMessage}`);
                router.push('/categories');
            } finally {
                setFetching(false);
            }
        };

        if (id) {
            fetchCategory();
        }
    }, [id, router]);
    
    // ✅ FIX 2: Type event handler
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (error) {
            setError("");
        }
    };
    
    // ✅ FIX 3: Type form submit handler
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
            
            if (formData.name.trim().length > 100) {
                throw new Error("Tên danh mục không được vượt quá 100 ký tự");
            }
            
            // Kiểm tra xem có thay đổi gì không
            if (formData.name.trim() === originalCategory?.name) {
                toast('Không có thay đổi nào để cập nhật', {
                    icon: 'ℹ️',
                    duration: 2000,
                });
                return;
            }
            
            console.log('📝 Updating category with data:', formData);
            
            // ✅ Prepare data for API
            const submitData = {
                name: formData.name.trim()
            };
            
            console.log('📦 Submitting data:', submitData);
            
            // ✅ Call PUT API
            const response = await fetch(`http://localhost:3000/api/categories/${id}`, {
                method: 'PUT',
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
            console.log('✅ Update successful:', result);
            
            // ✅ Show success message và redirect
            toast.success(`✅ Đã cập nhật danh mục: "${submitData.name}"`, {
                duration: 3000,
                icon: '✅',
            });
            
            // Delay để user thấy toast message
            setTimeout(() => {
                router.push('/categories');
            }, 1000);
            
        } catch (error: unknown) { // ✅ FIX 4: Type catch error
            console.error('❌ Error updating category:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            toast.error(`❌ ${errorMessage}`, {
                duration: 4000,
            });
        } finally {
            setLoading(false);
        }
    };
    
    // Loading state khi đang fetch data
    if (fetching) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        <div className="text-lg text-gray-600">Đang tải thông tin danh mục...</div>
                    </div>
                </div>
            </div>
        );
    }
    
    // Không tìm thấy category
    if (!originalCategory) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <div className="text-lg text-red-600 font-medium">Không tìm thấy danh mục</div>
                        <button
                            onClick={() => router.push('/categories')}
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Quay lại danh sách
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    // Check if form has changes
    const hasChanges = formData.name.trim() !== originalCategory.name;
    const isFormValid = formData.name.trim().length >= 2 && formData.name.trim().length <= 100 && hasChanges;
    
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
                <h1 className="text-2xl font-bold text-black">Sửa danh mục</h1>
                <p className="text-gray-600 mt-2">
                    Chỉnh sửa thông tin danh mục <span className="font-medium text-gray-900">{originalCategory.name}</span>
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-red-800 font-medium">Lỗi cập nhật</p>
                            <p className="text-red-700 text-sm mt-1">{error}</p>
                        </div>
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
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black transition-colors ${
                                        error && !formData.name.trim()
                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
                                    }`}
                                    placeholder="Nhập tên danh mục (VD: Điện thoại, Laptop, Quần áo...)"
                                    required
                                    minLength={2}
                                    maxLength={100}
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Tên danh mục sẽ hiển thị cho khách hàng (2-100 ký tự)
                                </p>
                                {formData.name && (
                                    <p className={`mt-1 text-xs ${
                                        formData.name.trim().length < 2
                                            ? 'text-red-600'
                                            : formData.name.trim().length > 100
                                            ? 'text-red-600'
                                            : 'text-gray-500'
                                    }`}>
                                        {formData.name.trim().length}/100 ký tự
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Thông tin bổ sung */}
                    <div>
                        <h3 className="text-lg font-medium text-black mb-4">Thông tin hiện tại</h3>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Trạng thái</p>
                                    <p className="font-medium">
                                        {originalCategory.isActive ? (
                                            <span className="inline-flex items-center gap-1 text-green-600">
                                                <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                                                Hoạt động
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-red-600">
                                                <span className="w-2 h-2 bg-red-600 rounded-full"></span>
                                                Tạm dừng
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Ngày tạo</p>
                                    <p className="font-medium">
                                        {new Date(originalCategory.createdAt).toLocaleDateString('vi-VN', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                                    <p className="font-medium">
                                        {new Date(originalCategory.updatedAt).toLocaleDateString('vi-VN', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Tên ban đầu</p>
                                    <p className="font-medium text-gray-700">{originalCategory.name}</p>
                                </div>
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
                                        <h4 className="font-medium text-black">{formData.name.trim() || "(Chưa có tên)"}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                Đang cập nhật
                                            </span>
                                            {hasChanges && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                                                    ✏️ Có thay đổi
                                                </span>
                                            )}
                                            {!hasChanges && formData.name.trim() && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                                                    Chưa thay đổi
                                                </span>
                                            )}
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
                            disabled={loading || !isFormValid}
                            title={
                                !formData.name.trim() 
                                    ? "Vui lòng nhập tên danh mục"
                                    : !hasChanges
                                    ? "Không có thay đổi nào"
                                    : formData.name.trim().length < 2
                                    ? "Tên phải có ít nhất 2 ký tự"
                                    : formData.name.trim().length > 100
                                    ? "Tên không được vượt quá 100 ký tự"
                                    : "Lưu thay đổi"
                            }
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? (
                                <>
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    Đang cập nhật...
                                </>
                            ) : (
                                "Cập nhật danh mục"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
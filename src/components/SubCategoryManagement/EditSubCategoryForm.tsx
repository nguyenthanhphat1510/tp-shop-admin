"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Folder } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import toast from 'react-hot-toast';

interface SubCategory {
    _id: string;
    name: string;
    categoryId: string;
    categoryName: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface Category {
    _id: string;
    name: string;
    isActive: boolean;
}

export default function EditSubCategoryForm() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    
    const [formData, setFormData] = useState({
        name: "",
        categoryId: ""
    });
    
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    const [originalSubCategory, setOriginalSubCategory] = useState<SubCategory | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    
    // Lấy thông tin subcategory hiện tại và danh sách categories
    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('📥 Fetching subcategory with ID:', id);
                
                // Fetch subcategory
                const subCategoryResponse = await fetch(`http://localhost:3000/api/subcategories/${id}`);
                
                if (!subCategoryResponse.ok) {
                    const contentType = subCategoryResponse.headers.get('content-type');
                    let errorMessage = `HTTP ${subCategoryResponse.status}: ${subCategoryResponse.statusText}`;
                    
                    if (contentType && contentType.includes('application/json')) {
                        try {
                            const errorData = await subCategoryResponse.json();
                            errorMessage = errorData.message || errorMessage;
                        } catch (e) {
                            console.error('Error parsing error response:', e);
                        }
                    }
                    
                    throw new Error(errorMessage);
                }
                
                const subCategory = await subCategoryResponse.json();
                console.log('✅ Fetched subcategory:', subCategory);
                
                // Fetch categories for dropdown
                const categoriesResponse = await fetch('http://localhost:3000/api/categories');
                if (!categoriesResponse.ok) {
                    throw new Error('Không thể tải danh sách danh mục cha');
                }
                const categoriesData = await categoriesResponse.json();
                
                // Filter only active categories
                const activeCategories = categoriesData.filter(cat => 
                    cat.isActive === true || cat.isActive === "true"
                );
                
                setCategories(activeCategories);
                setOriginalSubCategory(subCategory);
                setFormData({
                    name: subCategory.name,
                    categoryId: subCategory.categoryId
                });
                
            } catch (error) {
                console.error('❌ Error fetching data:', error);
                toast.error(`Lỗi: ${error.message}`);
                router.push('/subcategories');
            } finally {
                setFetching(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, router]);
    
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
                throw new Error("Tên danh mục con không được để trống");
            }
            
            if (formData.name.trim().length < 2) {
                throw new Error("Tên danh mục con phải có ít nhất 2 ký tự");
            }
            
            if (!formData.categoryId) {
                throw new Error("Vui lòng chọn danh mục cha");
            }
            
            // Kiểm tra xem có thay đổi gì không
            if (formData.name.trim() === originalSubCategory?.name && 
                formData.categoryId === originalSubCategory?.categoryId) {
                toast.info('Không có thay đổi nào để cập nhật');
                return;
            }
            
            console.log('📝 Updating subcategory with data:', formData);
            
            // ✅ Prepare data for API
            const submitData = {
                name: formData.name.trim(),
                categoryId: formData.categoryId
            };
            
            console.log('📦 Submitting data:', submitData);
            
            // ✅ Call PUT API (dựa trên subcategory controller)
            const response = await fetch(`http://localhost:3000/api/subcategories/${id}`, {
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
            toast.success('Cập nhật danh mục con thành công!');
            
            // Delay để user thấy toast message
            setTimeout(() => {
                router.push('/subcategories');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error updating subcategory:', error);
            setError(error.message);
            toast.error(`Lỗi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Loading state khi đang fetch data
    if (fetching) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Đang tải thông tin danh mục con...</div>
                </div>
            </div>
        );
    }
    
    // Không tìm thấy subcategory
    if (!originalSubCategory) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-red-600">Không tìm thấy danh mục con</div>
                </div>
            </div>
        );
    }
    
    // Get selected category name for preview
    const selectedCategory = categories.find(cat => cat._id === formData.categoryId);
    const hasChanges = formData.name.trim() !== originalSubCategory.name || 
                      formData.categoryId !== originalSubCategory.categoryId;
    
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
                <h1 className="text-2xl font-bold text-black">Sửa danh mục con</h1>
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
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Folder className="w-10 h-10 text-purple-600" />
                        </div>
                        <p className="text-sm text-gray-500">Icon danh mục con</p>
                    </div>
                    
                    {/* Thông tin cơ bản */}
                    <div>
                        <h3 className="text-lg font-medium text-black mb-4">Thông tin danh mục con</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Tên danh mục con *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                    placeholder="Nhập tên danh mục con (VD: iPhone, Samsung, Nike...)"
                                    required
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Tên danh mục con sẽ hiển thị cho khách hàng
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Danh mục cha *
                                </label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                    required
                                >
                                    <option value="">Chọn danh mục cha</option>
                                    {categories.map(category => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-sm text-gray-500">
                                    Chọn danh mục cha mà danh mục con này thuộc về
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin hiện tại */}
                    <div>
                        <h3 className="text-lg font-medium text-black mb-4">Thông tin hiện tại</h3>
                        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Trạng thái</p>
                                    <p className="font-medium">
                                        {originalSubCategory.isActive ? (
                                            <span className="text-green-600">Hoạt động</span>
                                        ) : (
                                            <span className="text-red-600">Không hoạt động</span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Danh mục cha hiện tại</p>
                                    <p className="font-medium">{originalSubCategory.categoryName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Ngày tạo</p>
                                    <p className="font-medium">
                                        {new Date(originalSubCategory.createdAt).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Cập nhật lần cuối</p>
                                    <p className="font-medium">
                                        {new Date(originalSubCategory.updatedAt).toLocaleDateString('vi-VN')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Preview */}
                    {formData.name && formData.categoryId && (
                        <div>
                            <h3 className="text-lg font-medium text-black mb-4">Xem trước</h3>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                        <Folder className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-black">{formData.name}</h4>
                                        <p className="text-sm text-gray-600">
                                            Danh mục: {selectedCategory?.name || 'Không xác định'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                                                Đang cập nhật
                                            </span>
                                            {hasChanges && (
                                                <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                                                    Có thay đổi
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
                            disabled={loading || !formData.name.trim() || !formData.categoryId || !hasChanges}
                            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? "Đang cập nhật..." : "Cập nhật danh mục con"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
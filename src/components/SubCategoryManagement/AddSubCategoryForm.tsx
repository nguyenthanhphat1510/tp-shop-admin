"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, AlertCircle, Folder } from "lucide-react";
import toast from 'react-hot-toast';

export default function AddSubCategoryForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [errors, setErrors] = useState({});
    
    const [formData, setFormData] = useState({
        name: "",
        categoryId: "",
        isActive: true
    });

    // Fetch categories for dropdown
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true);
                const response = await fetch('http://localhost:3000/api/categories');
                
                if (!response.ok) {
                    throw new Error('Không thể tải danh sách danh mục');
                }
                
                const data = await response.json();
                // Chỉ lấy các category đang active
                const activeCategories = data.filter(category => 
                    category.isActive === true || category.isActive === "true"
                );
                setCategories(activeCategories);
            } catch (error) {
                console.error('Error fetching categories:', error);
                toast.error('Không thể tải danh sách danh mục');
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const validateForm = () => {
        const newErrors = {};

        // Validate name
        if (!formData.name.trim()) {
            newErrors.name = "Tên danh mục con là bắt buộc";
        } else if (formData.name.trim().length < 2) {
            newErrors.name = "Tên danh mục con phải có ít nhất 2 ký tự";
        } else if (formData.name.trim().length > 100) {
            newErrors.name = "Tên danh mục con không được vượt quá 100 ký tự";
        }

        // Validate categoryId
        if (!formData.categoryId) {
            newErrors.categoryId = "Vui lòng chọn danh mục cha";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ""
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast.error("Vui lòng kiểm tra lại thông tin");
            return;
        }

        try {
            setLoading(true);
            console.log('📤 Submitting subcategory data:', formData);

            const response = await fetch('http://localhost:3000/api/subcategories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            console.log(`📡 Response status: ${response.status}`);

            const responseData = await response.json();
            console.log('📋 Response data:', responseData);

            if (!response.ok) {
                throw new Error(responseData.message || 'Lỗi tạo danh mục con');
            }

            toast.success('Tạo danh mục con thành công!', {
                duration: 3000,
                icon: '🎉',
            });

            // Redirect to subcategories list after success
            setTimeout(() => {
                router.push('/subcategories');
            }, 1000);

        } catch (error) {
            console.error('❌ Error creating subcategory:', error);
            toast.error(`Lỗi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (formData.name.trim() || formData.categoryId) {
            if (confirm('Bạn có chắc chắn muốn hủy? Dữ liệu chưa lưu sẽ bị mất.')) {
                router.push('/subcategories');
            }
        } else {
            router.push('/subcategories');
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                        disabled={loading}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Quay lại</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            <Folder className="w-4 h-4 text-purple-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900">
                            Thông tin danh mục con
                        </h2>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                    {/* Category Selection */}
                    <div>
                        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                            Danh mục cha <span className="text-red-500">*</span>
                        </label>
                        {categoriesLoading ? (
                            <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                <span className="text-gray-500">Đang tải danh mục...</span>
                            </div>
                        ) : (
                            <select
                                id="categoryId"
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleInputChange}
                                className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors ${
                                    errors.categoryId ? 'border-red-500 bg-red-50' : 'border-gray-300'
                                }`}
                                disabled={loading}
                            >
                                <option value="">Chọn danh mục cha</option>
                                {categories.map(category => (
                                    <option key={category._id} value={category._id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        )}
                        {errors.categoryId && (
                            <div className="flex items-center gap-2 mt-2 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{errors.categoryId}</span>
                            </div>
                        )}
                    </div>

                    {/* SubCategory Name */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Tên danh mục con <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Nhập tên danh mục con..."
                            className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors ${
                                errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'
                            }`}
                            disabled={loading}
                        />
                        {errors.name && (
                            <div className="flex items-center gap-2 mt-2 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{errors.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Status Toggle */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Trạng thái
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                                    formData.isActive ? 'bg-purple-600' : 'bg-gray-300'
                                }`}
                                disabled={loading}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${
                                        formData.isActive ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                            <span className={`text-sm font-medium ${formData.isActive ? 'text-purple-600' : 'text-gray-500'}`}>
                                {formData.isActive ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-500">
                            {formData.isActive 
                                ? 'Danh mục con sẽ hiển thị và có thể sử dụng ngay' 
                                : 'Danh mục con sẽ ở trạng thái tạm dừng'
                            }
                        </p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={loading || categoriesLoading}
                        className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang tạo...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4" />
                                Tạo danh mục con
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
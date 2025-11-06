"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, AlertCircle, Folder } from "lucide-react";
import toast from 'react-hot-toast';
import { z } from 'zod';

// ✅ ZOD SCHEMA CHO SUBCATEGORY
const SubcategorySchema = z.object({
    name: z
        .string()
        .min(1, "Tên danh mục con không được để trống")
        .trim()
        .min(2, "Tên danh mục con phải có ít nhất 2 ký tự")
        .max(100, "Tên danh mục con không được vượt quá 100 ký tự")
        .refine(
            (name) => name.trim().length > 0,
            "Tên danh mục con không được chỉ chứa khoảng trắng"
        ),
    categoryId: z
        .string()
        .min(1, "Vui lòng chọn danh mục cha")
        .regex(/^[0-9a-fA-F]{24}$/, "ID danh mục cha không hợp lệ")
});

type SubcategoryFormData = z.infer<typeof SubcategorySchema>;

interface Category {
    _id: string;
    name: string;
    isActive: boolean | string;
}

// ✅ ERROR STATE TYPE
interface ValidationErrors {
    name?: string;
    categoryId?: string;
}

export default function AddSubCategoryForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    
    const [formData, setFormData] = useState<SubcategoryFormData>({
        name: "",
        categoryId: ""
    });

    // Fetch categories for dropdown
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setCategoriesLoading(true);
                console.log('📥 Fetching categories...');
                
                const response = await fetch('http://localhost:3000/api/categories');
                
                if (!response.ok) {
                    throw new Error('Không thể tải danh sách danh mục');
                }
                
                const data = await response.json();
                console.log('📋 Fetched categories:', data);
                
                // ✅ Chỉ lấy các category đang active
                const activeCategories = data.filter((category: Category) => 
                    category.isActive === true || category.isActive === "true"
                );
                
                console.log(`✅ Active categories: ${activeCategories.length}/${data.length}`);
                
                setCategories(activeCategories);
            } catch (error) {
                console.error('❌ Error fetching categories:', error);
                toast.error('Không thể tải danh sách danh mục', {
                    icon: '❌',
                });
            } finally {
                setCategoriesLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // ✅ VALIDATE SINGLE FIELD (REAL-TIME)
    const validateField = (name: keyof SubcategoryFormData, value: string) => {
        try {
            // Validate single field
            SubcategorySchema.shape[name].parse(value);
            
            // Clear error if valid
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                setValidationErrors(prev => ({
                    ...prev,
                    [name]: error.errors[0].message
                }));
            }
        }
    };

    // ✅ VALIDATE ENTIRE FORM
    const validateForm = (): boolean => {
        try {
            SubcategorySchema.parse(formData);
            setValidationErrors({});
            return true;
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors: ValidationErrors = {};
                error.errors.forEach(err => {
                    if (err.path[0]) {
                        errors[err.path[0] as keyof ValidationErrors] = err.message;
                    }
                });
                setValidationErrors(errors);
                
                // Show first error in toast
                toast.error(error.errors[0].message, {
                    icon: '⚠️',
                });
            }
            return false;
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // ✅ VALIDATE ON CHANGE (REAL-TIME)
        if (value) {
            validateField(name as keyof SubcategoryFormData, value);
        } else {
            // Clear error when field is empty
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name as keyof ValidationErrors];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // ✅ VALIDATE FORM TRƯỚC KHI SUBMIT
        if (!validateForm()) {
            console.log('❌ Form validation failed:', validationErrors);
            return;
        }

        try {
            setLoading(true);
            console.log('📤 Submitting subcategory data:', {
                name: formData.name.trim(),
                categoryId: formData.categoryId
            });

            const response = await fetch('http://localhost:3000/api/subcategories', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name.trim(), // ✅ Trim trước khi gửi
                    categoryId: formData.categoryId
                })
            });

            console.log(`📡 Response status: ${response.status}`);

            // ✅ XỬ LÝ ERROR RESPONSE
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi tạo danh mục con');
            }

            const responseData = await response.json();
            console.log('✅ Subcategory created:', responseData);

            // ✅ SUCCESS MESSAGE RÕ RÀNG HƠN
            toast.success(`Tạo danh mục con "${responseData.name}" thành công!`, {
                duration: 3000,
                icon: '🎉',
            });

            // Redirect to subcategories list after success
            setTimeout(() => {
                router.push('/subcategories');
            }, 1000);

        } catch (error) {
            console.error('❌ Error creating subcategory:', error);
            
            // ✅ HIỂN THỊ MESSAGE TỪ BACKEND (ĐÃ FORMAT)
            toast.error(error.message, {
                duration: 5000, // Dài hơn để user đọc message chi tiết
                icon: '❌',
            });
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

    // ✅ CHECK IF FORM IS VALID
    const isFormValid = !validationErrors.name && 
                       !validationErrors.categoryId && 
                       formData.name.trim() && 
                       formData.categoryId;

    // Get selected category for preview
    const selectedCategory = categories.find(cat => cat._id === formData.categoryId);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 text-black hover:text-gray-700 transition-colors"
                        disabled={loading}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Quay lại</span>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Folder className="w-4 h-4 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-black">
                            Thông tin danh mục con
                        </h2>
                    </div>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-6">
                    {/* ✅ CATEGORY SELECTION WITH VALIDATION */}
                    <div>
                        <label htmlFor="categoryId" className="block text-sm font-medium text-black mb-2">
                            Danh mục cha <span className="text-red-500">*</span>
                        </label>
                        {categoriesLoading ? (
                            <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
                                <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                                <span className="text-gray-500">Đang tải danh mục...</span>
                            </div>
                        ) : (
                            <>
                                <select
                                    id="categoryId"
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors text-black ${
                                        validationErrors.categoryId 
                                            ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
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
                                {validationErrors.categoryId && (
                                    <div className="flex items-center gap-2 mt-2 text-red-600">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-sm">{validationErrors.categoryId}</span>
                                    </div>
                                )}
                                {categories.length === 0 && !categoriesLoading && (
                                    <div className="flex items-center gap-2 mt-2 text-amber-600">
                                        <AlertCircle className="w-4 h-4" />
                                        <span className="text-sm">Không có danh mục cha nào đang hoạt động</span>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* ✅ SUBCATEGORY NAME WITH VALIDATION */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-black mb-2">
                            Tên danh mục con <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Nhập tên danh mục con (VD: iPhone, Samsung, Nike...)"
                            className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:outline-none transition-colors text-black ${
                                validationErrors.name 
                                    ? 'border-red-500 bg-red-50 focus:ring-red-500' 
                                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                            }`}
                            disabled={loading}
                        />
                        {validationErrors.name && (
                            <div className="flex items-center gap-2 mt-2 text-red-600">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{validationErrors.name}</span>
                            </div>
                        )}
                        <p className="mt-2 text-sm text-gray-600">
                            Tên danh mục con từ 2-100 ký tự. Danh mục sẽ được tạo với trạng thái hoạt động mặc định.
                        </p>
                    </div>

                    {/* ✅ PREVIEW */}
                    {formData.name && formData.categoryId && (
                        <div>
                            <label className="block text-sm font-medium text-black mb-2">
                                Xem trước
                            </label>
                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Folder className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-black">{formData.name.trim()}</h4>
                                        <p className="text-sm text-gray-600">
                                            Danh mục: {selectedCategory?.name || 'Không xác định'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                                Hoạt động
                                            </span>
                                            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                                                Mới tạo
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* ✅ ACTION BUTTONS */}
                <div className="flex gap-4 pt-6 mt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 px-4 py-3 border border-gray-300 text-black bg-white rounded-lg hover:bg-gray-50 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={loading || categoriesLoading || !isFormValid}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!isFormValid ? 'Vui lòng kiểm tra lại thông tin' : ''}
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
"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Folder, AlertCircle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
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

interface ValidationErrors {
    name?: string;
    categoryId?: string;
}

// ✅ FIX: THÊM INTERFACE CHO PROPS (OPTIONAL VÌ DÙNG useParams TRONG COMPONENT)
interface EditSubCategoryFormProps {
    subCategoryId?: string | string[]; // Optional vì component tự lấy từ useParams
}

// ✅ FIX: THÊM PROPS TYPE (nhưng không dùng vì đã có useParams)
export default function EditSubCategoryForm(_props?: EditSubCategoryFormProps) {
    const router = useRouter();
    const params = useParams();
    
    // ✅ LẤY ID TỪ useParams (KHÔNG TỪ PROPS)
    const id = Array.isArray(params.id) ? params.id[0] : params.id as string;
    
    const [formData, setFormData] = useState<SubcategoryFormData>({
        name: "",
        categoryId: ""
    });
    
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
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
                const activeCategories = categoriesData.filter((cat: Category) => 
                    cat.isActive === true 
                );
                
                setCategories(activeCategories);
                setOriginalSubCategory(subCategory);
                setFormData({
                    name: subCategory.name,
                    categoryId: subCategory.categoryId
                });
                
            } catch (error) {
                console.error('❌ Error fetching data:', error);
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                toast.error(`Lỗi: ${errorMessage}`);
                router.push('/subcategories');
            } finally {
                setFetching(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, router]);
    
    // ✅ VALIDATE FORM WITH ZOD (REAL-TIME)
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
        
        // ✅ VALIDATE ON CHANGE (DEBOUNCED)
        if (value) {
            validateField(name as keyof SubcategoryFormData, value);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // ✅ VALIDATE FORM TRƯỚC KHI SUBMIT
        if (!validateForm()) {
            console.log('❌ Form validation failed:', validationErrors);
            return;
        }
        
        setLoading(true);
        
        try {
            // ✅ Kiểm tra có thay đổi không
            const nameChanged = formData.name.trim() !== originalSubCategory?.name;
            const categoryChanged = formData.categoryId !== originalSubCategory?.categoryId;
            
            if (!nameChanged && !categoryChanged) {
                toast.info('Không có thay đổi nào để cập nhật', {
                    icon: 'ℹ️',
                });
                return;
            }
            
            console.log('📝 Updating subcategory with data:', {
                name: formData.name.trim(),
                categoryId: formData.categoryId,
                changes: {
                    nameChanged,
                    categoryChanged
                }
            });
            
            // ✅ CHỈ GỬI FIELD THỰC SỰ THAY ĐỔI
            const submitData: Partial<SubcategoryFormData> = {};
            
            if (nameChanged) {
                submitData.name = formData.name.trim();
            }
            
            if (categoryChanged) {
                submitData.categoryId = formData.categoryId;
            }
            
            console.log('📦 Submitting data:', submitData);
            
            // ✅ Call PUT API
            const response = await fetch(`http://localhost:3000/api/subcategories/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData)
            });
            
            console.log(`📡 Response status: ${response.status}`);
            
            // ✅ XỬ LÝ ERROR RESPONSE
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi cập nhật danh mục con');
            }
            
            const result = await response.json();
            console.log('✅ Update successful:', result);
            
            // ✅ SUCCESS MESSAGE CHI TIẾT
            let successMessage = 'Cập nhật danh mục con thành công!';
            
            if (nameChanged && categoryChanged) {
                const newCategory = categories.find(cat => cat._id === result.categoryId);
                successMessage = `Đã đổi tên thành "${result.name}" và chuyển sang danh mục "${newCategory?.name}"`;
            } else if (nameChanged) {
                successMessage = `Đã đổi tên thành "${result.name}"`;
            } else if (categoryChanged) {
                const newCategory = categories.find(cat => cat._id === result.categoryId);
                successMessage = `Đã chuyển sang danh mục "${newCategory?.name}"`;
            }
            
            toast.success(successMessage, {
                duration: 3000,
                icon: '✅',
            });
            
            // Delay để user thấy toast message
            setTimeout(() => {
                router.push('/subcategories');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error updating subcategory:', error);
            
            // ✅ HIỂN THỊ MESSAGE TỪ BACKEND (ĐÃ FORMAT)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error(errorMessage, {
                duration: 5000,
                icon: '❌',
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
    
    // ✅ CHECK IF FORM IS VALID
    const isFormValid = !validationErrors.name && 
                       !validationErrors.categoryId && 
                       formData.name.trim() && 
                       formData.categoryId &&
                       hasChanges;
    
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
                            {/* ✅ NAME INPUT WITH VALIDATION */}
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Tên danh mục con *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black transition-colors ${
                                        validationErrors.name 
                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                            : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                                    }`}
                                    placeholder="Nhập tên danh mục con (VD: iPhone, Samsung, Nike...)"
                                />
                                {validationErrors.name && (
                                    <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>{validationErrors.name}</span>
                                    </div>
                                )}
                                <p className="mt-1 text-sm text-gray-500">
                                    Tên danh mục con sẽ hiển thị cho khách hàng (2-100 ký tự)
                                </p>
                            </div>
                            
                            {/* ✅ CATEGORY SELECT WITH VALIDATION */}
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Danh mục cha *
                                </label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleInputChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 text-black transition-colors ${
                                        validationErrors.categoryId 
                                            ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                                            : 'border-gray-300 focus:ring-purple-500 focus:border-transparent'
                                    }`}
                                >
                                    <option value="">Chọn danh mục cha</option>
                                    {categories.map(category => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {validationErrors.categoryId && (
                                    <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        <span>{validationErrors.categoryId}</span>
                                    </div>
                                )}
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
                                        <h4 className="font-medium text-black">{formData.name.trim()}</h4>
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
                            disabled={loading || !isFormValid}
                            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                            title={!isFormValid ? 'Vui lòng kiểm tra lại thông tin' : ''}
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
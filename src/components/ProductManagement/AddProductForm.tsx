"use client";
import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, X, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// ✅ Enhanced validation schema
const productSchema = z.object({
  name: z.string()
    .min(1, "Tên sản phẩm là bắt buộc")
    .min(3, "Tên sản phẩm phải có ít nhất 3 ký tự")
    .max(100, "Tên sản phẩm không được quá 100 ký tự"),
  
  price: z.number()
    .min(1, "Giá phải lớn hơn 0")
    .max(999999999, "Giá không được quá 999,999,999"),
  
  stock: z.number()
    .min(0, "Số lượng không được âm")
    .max(99999, "Số lượng không được quá 99,999"),
  
  categoryId: z.string()
    .min(1, "Vui lòng chọn danh mục"),
  
  subcategoryId: z.string().optional(),
  
  description: z.string()
    .max(1000, "Mô tả không được quá 1000 ký tự")
    .optional(),
  
  isActive: z.boolean()
});

export default function AddProductForm() {
    const router = useRouter();
    const fileInputRef = useRef(null);
    
    // ✅ States
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingSubcategories, setLoadingSubcategories] = useState(false);
    
    // ✅ React Hook Form setup
    const {
        register,
        handleSubmit, // ← Only this handleSubmit
        formState: { errors },
        setValue,
        watch,
        reset
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            price: 0,
            stock: 0,
            categoryId: "",
            subcategoryId: "",
            description: "",
            isActive: true
        }
    });

    const watchedCategoryId = watch("categoryId");

    useEffect(() => {
        fetchCategories();
    }, []);
    
    useEffect(() => {
        if (watchedCategoryId) {
            fetchSubcategories(watchedCategoryId);
        } else {
            setSubcategories([]);
            setValue("subcategoryId", "");
        }
    }, [watchedCategoryId, setValue]);
    
    const fetchCategories = async () => {
        try {
            setLoadingCategories(true);
            console.log('🔄 Fetching categories from backend...');
            
            // ✅ Port 3000 là đúng
            const response = await fetch('http://localhost:3000/api/categories');
            
            if (!response.ok) {
                throw new Error('Không thể tải danh mục');
            }
            
            const data = await response.json();
            console.log('✅ Categories loaded:', data);
            setCategories(data);
        } catch (error) {
            console.error('❌ Error fetching categories:', error);
            setError('Không thể tải danh sách danh mục. Hãy đảm bảo backend đang chạy!');
        } finally {
            setLoadingCategories(false);
        }
    };
    
    const fetchSubcategories = async (categoryId) => {
        try {
            setLoadingSubcategories(true);
            console.log('🔄 Fetching subcategories for category:', categoryId);
            
            // ✅ Port 3000 là đúng  
            const response = await fetch(`http://localhost:3000/api/subcategories/category/${categoryId}`);
            
            if (!response.ok) {
                throw new Error('Không thể tải danh mục con');
            }
            
            const data = await response.json();
            console.log('✅ Subcategories loaded:', data);
            setSubcategories(data);
        } catch (error) {
            console.error('❌ Error fetching subcategories:', error);
            setSubcategories([]);
        } finally {
            setLoadingSubcategories(false);
        }
    };

    // ✅ Only one submit handler
    const onSubmit = async (data) => {
        setLoading(true);
        setError("");
        
        try {
            console.log('🚀 Form data:', data);
            console.log('📷 Images:', images);
            
            // ✅ Debug: Kiểm tra data trước khi gửi
            console.log('Data validation:');
            console.log('- Name:', data.name);
            console.log('- Price:', data.price, typeof data.price);
            console.log('- Stock:', data.stock, typeof data.stock);
            console.log('- CategoryId:', data.categoryId);
            console.log('- SubcategoryId:', data.subcategoryId);
            console.log('- Images count:', images.length);
            
            const submitData = new FormData();
            
            // ✅ Append form fields với validation
            Object.keys(data).forEach(key => {
                const value = data[key];
                console.log(`Appending ${key}:`, value, typeof value);
                
                // Convert boolean to string
                if (typeof value === 'boolean') {
                    submitData.append(key, value.toString());
                } else if (value !== undefined && value !== null && value !== '') {
                    submitData.append(key, value);
                }
            });
            
            // ✅ Append images
            images.forEach((image, index) => {
                console.log(`Appending image ${index}:`, image.file.name, image.file.type, image.file.size);
                submitData.append('images', image.file);
            });
            
            // ✅ Debug FormData contents
            console.log('FormData contents:');
            for (let [key, value] of submitData.entries()) {
                console.log(key, value);
            }
            
            const response = await fetch('http://localhost:3000/api/products', {
                method: 'POST',
                body: submitData
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            
            if (!response.ok) {
                const errorData = await response.json();
                console.log('Error response:', errorData);
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('Success response:', result);
            
            reset();
            setImages([]);
            router.push('/products');
            
        } catch (error) {
            console.error('Submit error:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setImages(prev => [...prev, {
                        file,
                        preview: e.target.result,
                        id: Date.now() + Math.random()
                    }]);
                };
                reader.readAsDataURL(file);
            }
        });
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const removeImage = (id) => {
        setImages(prev => prev.filter(img => img.id !== id));
    };
    
    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Thông tin cơ bản */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Name field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Tên sản phẩm *
                                </label>
                                <input
                                    {...register("name")}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400 ${
                                        errors.name ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Nhập tên sản phẩm"
                                />
                                {errors.name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                                )}
                            </div>
                            
                            {/* Price field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Giá bán *
                                </label>
                                <input
                                    type="number"
                                    {...register("price", { valueAsNumber: true })}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400 ${
                                        errors.price ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                    min="0"
                                />
                                {errors.price && (
                                    <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                                )}
                            </div>
                            
                            {/* Stock field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Số lượng *
                                </label>
                                <input
                                    type="number"
                                    {...register("stock", { valueAsNumber: true })}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        errors.stock ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="0"
                                    min="0"
                                />
                                {errors.stock && (
                                    <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
                                )}
                            </div>
                            
                            {/* Category field - Fix text color */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Danh mục *
                                </label>
                                <select
                                    {...register("categoryId")}
                                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white ${
                                        errors.categoryId ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={loadingCategories}
                                >
                                    <option value="" className="text-gray-500">
                                        {loadingCategories ? "Đang tải..." : "Chọn danh mục"}
                                    </option>
                                    {categories.map(category => (
                                        <option key={category._id} value={category._id} className="text-gray-900">
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.categoryId && (
                                    <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
                                )}
                            </div>
                            
                            {/* Subcategory field - Fix text color */}
                            <div>
                                <label className="block text-sm font-medium text-gray-900 mb-1">
                                    Danh mục con
                                </label>
                                <select
                                    {...register("subcategoryId")}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                                    disabled={!watchedCategoryId || loadingSubcategories}
                                >
                                    <option value="" className="text-gray-500">
                                        {loadingSubcategories 
                                            ? "Đang tải..." 
                                            : !watchedCategoryId 
                                            ? "Chọn danh mục trước"
                                            : subcategories.length === 0
                                            ? "Không có danh mục con"
                                            : "Chọn danh mục con"
                                        }
                                    </option>
                                    {subcategories.map(subcategory => (
                                        <option key={subcategory._id} value={subcategory._id} className="text-gray-900">
                                            {subcategory.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* IsActive checkbox */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    {...register("isActive")}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Hiển thị sản phẩm
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* Description */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Mô tả sản phẩm</h3>
                        <textarea
                            {...register("description")}
                            rows={4}
                            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400 ${
                                errors.description ? 'border-red-500' : 'border-gray-300'
                            }`}
                            placeholder="Nhập mô tả chi tiết về sản phẩm..."
                        />
                        {errors.description && (
                            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                        )}
                    </div>
                    
                    {/* Images */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Hình ảnh sản phẩm</h3>
                        
                        <div 
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                accept="image/*"
                                multiple
                                className="hidden"
                            />
                            
                            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-600 mb-1">Nhấp để chọn hình ảnh</p>
                            <p className="text-gray-500 text-sm">JPG, PNG (tối đa 5MB)</p>
                        </div>
                        
                        {/* Image previews */}
                        {images.length > 0 && (
                            <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-3">
                                {images.map((image) => (
                                    <div key={image.id} className="relative">
                                        <img
                                            src={image.preview}
                                            alt="Preview"
                                            className="w-full h-20 object-cover rounded border"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(image.id)}
                                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    
                    {/* Submit buttons */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                            Hủy
                        </button>
                        
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {loading ? "Đang lưu..." : "Lưu sản phẩm"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
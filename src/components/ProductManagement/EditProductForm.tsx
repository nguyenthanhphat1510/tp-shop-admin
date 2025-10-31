"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Trash2, Image as ImageIcon, X } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import toast from 'react-hot-toast';

interface ProductVariant {
    _id: string;
    sku: string;
    storage: string;
    color: string;
    price: number;
    stock: number;
    imageUrls: string[];
    imagePublicIds: string[];
    isActive: boolean;
    discountPercent: number;
    isOnSale: boolean;
    finalPrice: number;
    savedAmount: number;
}

interface Product {
    _id: string;
    name: string;
    description: string;
    categoryId: string;
    subcategoryId: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

interface Category {
    _id: string;
    name: string;
}

interface Subcategory {
    _id: string;
    name: string;
    categoryId: string;
}

export default function EditProductForm() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    
    const [product, setProduct] = useState<Product | null>(null);
    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
    const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([]);
    
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        categoryId: "",
        subcategoryId: "",
        isActive: true
    });
    
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState("");
    
    // Fetch product data
    useEffect(() => {
        const fetchData = async () => {
            try {
                console.log('📥 Fetching product with ID:', id);
                
                // Fetch product + variants
                const productRes = await fetch(`http://localhost:3001/products/${id}`);
                if (!productRes.ok) throw new Error('Failed to fetch product');
                
                const productData = await productRes.json();
                console.log('✅ Product data:', productData);
                
                setProduct(productData.data.product);
                setVariants(productData.data.variants);
                
                setFormData({
                    name: productData.data.product.name,
                    description: productData.data.product.description,
                    categoryId: productData.data.product.categoryId,
                    subcategoryId: productData.data.product.subcategoryId,
                    isActive: productData.data.product.isActive
                });
                
                // Fetch categories
                const categoriesRes = await fetch('http://localhost:3000/api/categories');
                const categoriesData = await categoriesRes.json();
                setCategories(categoriesData);
                
                // Fetch subcategories
                const subcategoriesRes = await fetch('http://localhost:3000/api/subcategories');
                const subcategoriesData = await subcategoriesRes.json();
                setSubcategories(subcategoriesData);
                
                // Filter subcategories by product's category
                const filtered = subcategoriesData.filter(
                    (sub: Subcategory) => sub.categoryId === productData.data.product.categoryId
                );
                setFilteredSubcategories(filtered);
                
            } catch (error) {
                console.error('❌ Error fetching data:', error);
                toast.error(`Lỗi: ${error.message}`);
                router.push('/products');
            } finally {
                setFetching(false);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id, router]);
    
    // Handle category change
    const handleCategoryChange = (categoryId: string) => {
        setFormData(prev => ({
            ...prev,
            categoryId,
            subcategoryId: "" // Reset subcategory
        }));
        
        const filtered = subcategories.filter(sub => sub.categoryId === categoryId);
        setFilteredSubcategories(filtered);
    };
    
    // Handle product info change
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));
    };
    
    // Handle variant change
    const handleVariantChange = (index: number, field: keyof ProductVariant, value: any) => {
        const updatedVariants = [...variants];
        updatedVariants[index] = {
            ...updatedVariants[index],
            [field]: value
        };
        setVariants(updatedVariants);
    };
    
    // Handle variant image upload
    const handleVariantImageChange = (index: number, files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        const updatedVariants = [...variants];
        const newImageUrls = Array.from(files).map(file => URL.createObjectURL(file));
        
        updatedVariants[index] = {
            ...updatedVariants[index],
            imageUrls: newImageUrls, // Temporary preview URLs
            newImages: files // Store files for upload
        } as any;
        
        setVariants(updatedVariants);
    };
    
    // Remove variant image
    const removeVariantImage = (variantIndex: number, imageIndex: number) => {
        const updatedVariants = [...variants];
        updatedVariants[variantIndex].imageUrls = updatedVariants[variantIndex].imageUrls.filter((_, i) => i !== imageIndex);
        setVariants(updatedVariants);
    };
    
    // Handle submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            // ✅ Validation
            if (!formData.name.trim()) {
                throw new Error("Tên sản phẩm không được để trống");
            }
            
            if (!formData.categoryId) {
                throw new Error("Vui lòng chọn danh mục");
            }
            
            if (variants.length === 0) {
                throw new Error("Sản phẩm phải có ít nhất 1 variant");
            }
            
            // ✅ Prepare FormData
            const formDataToSend = new FormData();
            
            // Product basic info
            formDataToSend.append('name', formData.name.trim());
            formDataToSend.append('description', formData.description.trim());
            formDataToSend.append('categoryId', formData.categoryId);
            if (formData.subcategoryId) {
                formDataToSend.append('subcategoryId', formData.subcategoryId);
            }
            formDataToSend.append('isActive', String(formData.isActive));
            
            // Variants data
            const variantsData = variants.map(variant => ({
                _id: variant._id,
                storage: variant.storage,
                color: variant.color,
                price: Number(variant.price),
                stock: Number(variant.stock),
                isActive: variant.isActive,
                discountPercent: Number(variant.discountPercent || 0)
            }));
            
            formDataToSend.append('variants', JSON.stringify(variantsData));
            
            // Variant images (nếu có upload mới)
            variants.forEach((variant, index) => {
                if ((variant as any).newImages) {
                    Array.from((variant as any).newImages as FileList).forEach((file: File) => {
                        formDataToSend.append(`variant_${index}_images`, file);
                    });
                }
            });
            
            console.log('📦 Submitting update...');
            
            // ✅ Call PUT API
            const response = await fetch(`http://localhost:3001/products/${id}`, {
                method: 'PUT',
                body: formDataToSend
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update product');
            }
            
            const result = await response.json();
            console.log('✅ Update successful:', result);
            
            toast.success('Cập nhật sản phẩm thành công!');
            
            setTimeout(() => {
                router.push('/products');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error updating product:', error);
            setError(error.message);
            toast.error(`Lỗi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // Loading state
    if (fetching) {
        return (
            <div className="max-w-7xl mx-auto p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-gray-600">Đang tải thông tin sản phẩm...</div>
                </div>
            </div>
        );
    }
    
    if (!product) {
        return (
            <div className="max-w-7xl mx-auto p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="text-lg text-red-600">Không tìm thấy sản phẩm</div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="max-w-7xl mx-auto p-8">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-black hover:text-gray-800 mb-4 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại
                </button>
                <h1 className="text-2xl font-bold text-black">Sửa sản phẩm</h1>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* Product Basic Info */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-black mb-4">Thông tin sản phẩm</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-black mb-1">
                                Tên sản phẩm *
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                required
                            />
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-black mb-1">
                                Mô tả
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-black mb-1">
                                Danh mục *
                            </label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                required
                            >
                                <option value="">Chọn danh mục</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-black mb-1">
                                Danh mục con
                            </label>
                            <select
                                name="subcategoryId"
                                value={formData.subcategoryId}
                                onChange={handleInputChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                            >
                                <option value="">Không có</option>
                                {filteredSubcategories.map(sub => (
                                    <option key={sub._id} value={sub._id}>{sub.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleInputChange}
                                className="w-4 h-4"
                            />
                            <label className="text-sm font-medium text-black">
                                Kích hoạt sản phẩm
                            </label>
                        </div>
                    </div>
                </div>

                {/* Product Variants */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-black mb-4">
                        Biến thể sản phẩm ({variants.length})
                    </h2>
                    
                    <div className="space-y-6">
                        {variants.map((variant, index) => (
                            <div key={variant._id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-medium text-black">Biến thể #{index + 1}</h3>
                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        SKU: {variant.sku}
                                    </span>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-1">
                                            Dung lượng *
                                        </label>
                                        <input
                                            type="text"
                                            value={variant.storage}
                                            onChange={(e) => handleVariantChange(index, 'storage', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-1">
                                            Màu sắc *
                                        </label>
                                        <input
                                            type="text"
                                            value={variant.color}
                                            onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                            required
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-1">
                                            Giá (VNĐ) *
                                        </label>
                                        <input
                                            type="number"
                                            value={variant.price}
                                            onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                            required
                                            min="0"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-1">
                                            Số lượng *
                                        </label>
                                        <input
                                            type="number"
                                            value={variant.stock}
                                            onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                            required
                                            min="0"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-black mb-1">
                                            Giảm giá (%) 🎁
                                        </label>
                                        <input
                                            type="number"
                                            value={variant.discountPercent || 0}
                                            onChange={(e) => handleVariantChange(index, 'discountPercent', e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                                            min="0"
                                            max="100"
                                        />
                                        {variant.discountPercent > 0 && (
                                            <p className="text-xs text-green-600 mt-1">
                                                Giá sau giảm: {variant.finalPrice.toLocaleString('vi-VN')} VNĐ
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center gap-2 pt-6">
                                        <input
                                            type="checkbox"
                                            checked={variant.isActive}
                                            onChange={(e) => handleVariantChange(index, 'isActive', e.target.checked)}
                                            className="w-4 h-4"
                                        />
                                        <label className="text-sm font-medium text-black">
                                            Kích hoạt
                                        </label>
                                    </div>
                                </div>
                                
                                {/* Images */}
                                <div>
                                    <label className="block text-sm font-medium text-black mb-2">
                                        Hình ảnh (Tối đa 5 ảnh)
                                    </label>
                                    
                                    <div className="grid grid-cols-5 gap-2 mb-2">
                                        {variant.imageUrls.map((url, imgIndex) => (
                                            <div key={imgIndex} className="relative group">
                                                <img
                                                    src={url}
                                                    alt={`Variant ${index + 1} - Image ${imgIndex + 1}`}
                                                    className="w-full h-20 object-cover rounded border border-gray-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeVariantImage(index, imgIndex)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    {variant.imageUrls.length < 5 && (
                                        <div>
                                            <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500 transition-colors">
                                                <ImageIcon className="w-5 h-5 text-gray-400" />
                                                <span className="text-sm text-gray-600">Upload ảnh mới</span>
                                                <input
                                                    type="file"
                                                    multiple
                                                    accept="image/*"
                                                    onChange={(e) => handleVariantImageChange(index, e.target.files)}
                                                    className="hidden"
                                                />
                                            </label>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {5 - variant.imageUrls.length} ảnh còn lại
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* Submit Buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-2 text-black bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        Hủy
                    </button>
                    
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        {loading ? "Đang cập nhật..." : "Cập nhật sản phẩm"}
                    </button>
                </div>
            </form>
        </div>
    );
}
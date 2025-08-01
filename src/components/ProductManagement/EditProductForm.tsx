"use client";
import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, X, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function EditProductForm({ productId }) {
    const router = useRouter();
    const fileInputRef = useRef(null);
    
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: "",
        stock: "",
        categoryId: "",
        subcategoryId: "",
        isActive: true
    });
    
    const [existingImages, setExistingImages] = useState([]); // Ảnh từ server
    const [newImages, setNewImages] = useState([]); // Ảnh mới upload
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fetching, setFetching] = useState(true);
    
    // Mock data
    const categories = [
        { _id: "1", name: "Điện thoại" },
        { _id: "2", name: "Laptop" },
        { _id: "3", name: "Tablet" }
    ];
    
    const subcategories = [
        { _id: "1", name: "iPhone", categoryId: "1" },
        { _id: "2", name: "Samsung", categoryId: "1" },
        { _id: "3", name: "MacBook", categoryId: "2" },
        { _id: "4", name: "Dell", categoryId: "2" }
    ];
    
    // Fetch product data khi component mount
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setFetching(true);
                const response = await fetch(`http://localhost:3000/api/products/${productId}`);
                
                if (!response.ok) {
                    throw new Error('Không thể tải thông tin sản phẩm');
                }
                
                const product = await response.json();
                
                // Fill form data
                setFormData({
                    name: product.name || "",
                    description: product.description || "",
                    price: product.price?.toString() || "",
                    stock: product.stock?.toString() || "",
                    categoryId: product.categoryId || "",
                    subcategoryId: product.subcategoryId || "",
                    isActive: product.isActive === "true" || product.isActive === true
                });
                
                // Set existing images
                setExistingImages(product.imageUrls?.map((url, index) => ({
                    id: `existing_${index}`,
                    url: url,
                    publicId: product.imagePublicIds?.[index]
                })) || []);
                
            } catch (error) {
                console.error('Error fetching product:', error);
                setError('Không thể tải thông tin sản phẩm');
            } finally {
                setFetching(false);
            }
        };
        
        if (productId) {
            fetchProduct();
        }
    }, [productId]);
    
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setNewImages(prev => [...prev, {
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
    
    const removeExistingImage = (id) => {
        setExistingImages(prev => prev.filter(img => img.id !== id));
    };
    
    const removeNewImage = (id) => {
        setNewImages(prev => prev.filter(img => img.id !== id));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            if (!formData.name || !formData.price || !formData.stock) {
                throw new Error("Vui lòng điền đầy đủ thông tin bắt buộc");
            }
            
            const submitData = new FormData();
            
            // Append form fields
            Object.keys(formData).forEach(key => {
                submitData.append(key, formData[key]);
            });
            
            // Append existing images to keep
            const keepImageUrls = existingImages.map(img => img.url);
            const keepPublicIds = existingImages.map(img => img.publicId);
            submitData.append('keepImageUrls', JSON.stringify(keepImageUrls));
            submitData.append('keepPublicIds', JSON.stringify(keepPublicIds));
            
            // Append new images
            newImages.forEach((image) => {
                submitData.append('images', image.file);
            });
            
            const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
                method: 'PUT',
                body: submitData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Có lỗi xảy ra khi cập nhật sản phẩm');
            }
            
            router.push('/products');
            
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const filteredSubcategories = subcategories.filter(
        sub => sub.categoryId === formData.categoryId
    );
    
    if (fetching) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
                </div>
            </div>
        );
    }
    
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
                <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa sản phẩm</h1>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Thông tin cơ bản */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tên sản phẩm *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Nhập tên sản phẩm"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Giá bán *
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0"
                                    min="0"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Số lượng *
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0"
                                    min="0"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Danh mục
                                </label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Chọn danh mục</option>
                                    {categories.map(category => (
                                        <option key={category._id} value={category._id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Danh mục con
                                </label>
                                <select
                                    name="subcategoryId"
                                    value={formData.subcategoryId}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={!formData.categoryId}
                                >
                                    <option value="">Chọn danh mục con</option>
                                    {filteredSubcategories.map(subcategory => (
                                        <option key={subcategory._id} value={subcategory._id}>
                                            {subcategory.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Hiển thị sản phẩm
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* Mô tả */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Mô tả sản phẩm</h3>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nhập mô tả chi tiết về sản phẩm..."
                        />
                    </div>
                    
                    {/* Hình ảnh */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Hình ảnh sản phẩm</h3>
                        
                        {/* Ảnh hiện tại */}
                        {existingImages.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm text-gray-600 mb-2">Ảnh hiện tại:</p>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                    {existingImages.map((image) => (
                                        <div key={image.id} className="relative">
                                            <img
                                                src={image.url}
                                                alt="Existing"
                                                className="w-full h-20 object-cover rounded border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(image.id)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Upload ảnh mới */}
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
                            <p className="text-gray-600 mb-1">Nhấp để thêm ảnh mới</p>
                            <p className="text-gray-500 text-sm">JPG, PNG (tối đa 5MB)</p>
                        </div>
                        
                        {/* Xem trước ảnh mới */}
                        {newImages.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm text-gray-600 mb-2">Ảnh mới thêm:</p>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                    {newImages.map((image) => (
                                        <div key={image.id} className="relative">
                                            <img
                                                src={image.preview}
                                                alt="New"
                                                className="w-full h-20 object-cover rounded border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(image.id)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Nút hành động */}
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
                            {loading ? "Đang cập nhật..." : "Cập nhật sản phẩm"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
"use client";
import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, X, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';

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
    
    // ✅ Fetch categories và subcategories từ API
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    
    // ✅ Fetch categories và subcategories
    useEffect(() => {
        const fetchCategoriesAndSubcategories = async () => {
            try {
                const [categoriesRes, subcategoriesRes] = await Promise.all([
                    fetch('http://localhost:3000/api/categories'),
                    fetch('http://localhost:3000/api/subcategories')
                ]);
                
                if (categoriesRes.ok) {
                    const categoriesData = await categoriesRes.json();
                    setCategories(categoriesData);
                }
                
                if (subcategoriesRes.ok) {
                    const subcategoriesData = await subcategoriesRes.json();
                    setSubcategories(subcategoriesData);
                }
            } catch (error) {
                console.error('Error fetching categories/subcategories:', error);
            }
        };
        
        fetchCategoriesAndSubcategories();
    }, []);
    
    // ✅ Fetch product data khi component mount
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setFetching(true);
                console.log(`🔍 Fetching product with ID: ${productId}`);
                
                const response = await fetch(`http://localhost:3000/api/products/${productId}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: Không thể tải thông tin sản phẩm`);
                }
                
                const result = await response.json();
                console.log('✅ Product data received:', result);
                
                // ✅ Handle response structure (check if data is nested)
                const product = result.data || result;
                
                // ✅ Fill form data với proper type handling
                setFormData({
                    name: product.name || "",
                    description: product.description || "",
                    price: product.price?.toString() || "",
                    stock: product.stock?.toString() || "",
                    categoryId: product.categoryId?.toString() || "",
                    subcategoryId: product.subcategoryId?.toString() || "",
                    // ✅ Handle both string and boolean isActive
                    isActive: product.isActive === "true" || product.isActive === true
                });
                
                // ✅ Set existing images with proper structure
                if (product.imageUrls && Array.isArray(product.imageUrls)) {
                    setExistingImages(product.imageUrls.map((url, index) => ({
                        id: `existing_${index}`,
                        url: url,
                        publicId: product.imagePublicIds?.[index] || null
                    })));
                }
                
            } catch (error) {
                console.error('❌ Error fetching product:', error);
                setError('Không thể tải thông tin sản phẩm: ' + error.message);
                toast.error('Không thể tải thông tin sản phẩm');
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
        
        // ✅ Reset subcategory khi thay đổi category
        if (name === 'categoryId') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                subcategoryId: "" // Reset subcategory
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };
    
    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        
        // ✅ Limit số lượng ảnh
        const maxImages = 10;
        const currentTotal = existingImages.length + newImages.length;
        const availableSlots = maxImages - currentTotal;
        
        if (availableSlots <= 0) {
            toast.error(`Tối đa ${maxImages} ảnh cho mỗi sản phẩm`);
            return;
        }
        
        const filesToProcess = files.slice(0, availableSlots);
        
        filesToProcess.forEach(file => {
            // ✅ Validate file type và size
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} không phải là file ảnh`);
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) { // 5MB
                toast.error(`${file.name} quá lớn (tối đa 5MB)`);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                setNewImages(prev => [...prev, {
                    file,
                    preview: e.target.result,
                    id: Date.now() + Math.random()
                }]);
            };
            reader.readAsDataURL(file);
        });
        
        // Reset input
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
    
    // ✅ Fix handleSubmit để tương thích với API
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            // ✅ Validation
            if (!formData.name.trim()) {
                throw new Error("Tên sản phẩm không được để trống");
            }
            
            if (!formData.price || parseFloat(formData.price) <= 0) {
                throw new Error("Giá sản phẩm phải lớn hơn 0");
            }
            
            if (!formData.stock || parseInt(formData.stock) < 0) {
                throw new Error("Số lượng không được âm");
            }
            
            // ✅ Kiểm tra có ít nhất 1 ảnh
            if (existingImages.length === 0 && newImages.length === 0) {
                throw new Error("Sản phẩm phải có ít nhất 1 ảnh");
            }
            
            console.log(`📝 Updating product ${productId} with data:`, formData);
            
            // ✅ Prepare FormData for API
            const submitData = new FormData();
            
            // ✅ Append form fields (exactly matching CreateProductDto)
            submitData.append('name', formData.name.trim());
            submitData.append('description', formData.description.trim());
            submitData.append('price', formData.price);
            submitData.append('stock', formData.stock);
            submitData.append('isActive', formData.isActive.toString());
            
            // ✅ Append category và subcategory nếu có
            if (formData.categoryId) {
                submitData.append('categoryId', formData.categoryId);
            }
            
            if (formData.subcategoryId) {
                submitData.append('subcategoryId', formData.subcategoryId);
            }
            
            // ✅ Append new files với field name 'files' (matching API)
            newImages.forEach((image) => {
                submitData.append('files', image.file);
            });
            
            console.log('📦 Submitting FormData:', {
                name: formData.name,
                price: formData.price,
                stock: formData.stock,
                categoryId: formData.categoryId,
                subcategoryId: formData.subcategoryId,
                isActive: formData.isActive,
                newImagesCount: newImages.length,
                existingImagesCount: existingImages.length
            });
            
            // ✅ Call PUT API (matching backend route)
            const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
                method: 'PUT',
                body: submitData
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
            toast.success('Cập nhật sản phẩm thành công!');
            
            // Delay để user thấy toast message
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
    
    // ✅ Filter subcategories dựa trên category đã chọn
    const filteredSubcategories = subcategories.filter(
        sub => sub.categoryId === formData.categoryId
    );
    
    if (fetching) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-black">Đang tải thông tin sản phẩm...</p>
                </div>
            </div>
        );
    }
    
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
                <h1 className="text-2xl font-bold text-black">Chỉnh sửa sản phẩm</h1>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Thông tin cơ bản */}
                    <div>
                        <h3 className="text-lg font-medium text-black mb-4">Thông tin cơ bản</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Tên sản phẩm *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                    placeholder="Nhập tên sản phẩm"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Giá bán (VNĐ) *
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                    placeholder="0"
                                    min="0"
                                    step="1000"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Số lượng tồn kho *
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                    placeholder="0"
                                    min="0"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Danh mục
                                </label>
                                <select
                                    name="categoryId"
                                    value={formData.categoryId}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
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
                                <label className="block text-sm font-medium text-black mb-1">
                                    Danh mục con
                                </label>
                                <select
                                    name="subcategoryId"
                                    value={formData.subcategoryId}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                    disabled={!formData.categoryId}
                                >
                                    <option value="">
                                        {!formData.categoryId ? "Chọn danh mục trước" : "Chọn danh mục con"}
                                    </option>
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
                                <label className="ml-2 block text-sm text-black">
                                    Hiển thị sản phẩm
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* Mô tả */}
                    <div>
                        <h3 className="text-lg font-medium text-black mb-4">Mô tả sản phẩm</h3>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                            placeholder="Nhập mô tả chi tiết về sản phẩm..."
                        />
                    </div>
                    
                    {/* Hình ảnh */}
                    <div>
                        <h3 className="text-lg font-medium text-black mb-4">
                            Hình ảnh sản phẩm 
                            <span className="text-sm font-normal text-gray-500">
                                ({existingImages.length + newImages.length}/10)
                            </span>
                        </h3>
                        
                        {/* Ảnh hiện tại */}
                        {existingImages.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm text-black mb-2">Ảnh hiện tại:</p>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                    {existingImages.map((image) => (
                                        <div key={image.id} className="relative group">
                                            <img
                                                src={image.url}
                                                alt="Existing"
                                                className="w-full h-20 object-cover rounded border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(image.id)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Upload ảnh mới */}
                        {(existingImages.length + newImages.length) < 10 && (
                            <div 
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 cursor-pointer transition-colors"
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
                                <p className="text-black mb-1">Nhấp để thêm ảnh mới</p>
                                <p className="text-gray-500 text-sm">JPG, PNG (tối đa 5MB mỗi ảnh)</p>
                            </div>
                        )}
                        
                        {/* Xem trước ảnh mới */}
                        {newImages.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm text-black mb-2">Ảnh mới thêm:</p>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                    {newImages.map((image) => (
                                        <div key={image.id} className="relative group">
                                            <img
                                                src={image.preview}
                                                alt="New"
                                                className="w-full h-20 object-cover rounded border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(image.id)}
                                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
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
                            className="px-4 py-2 text-black bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
        </div>
    );
}
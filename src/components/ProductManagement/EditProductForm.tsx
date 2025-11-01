"use client";
import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, X, Save, Package } from "lucide-react";
import { useRouter, useParams } from "next/navigation"; // ✅ Add useParams
import toast from 'react-hot-toast';

interface ProductVariant {
    _id: string;
    productId: string;
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
    sold: number;
    createdAt: string;
    updatedAt: string;
}

interface Product {
    _id: string;
    name: string;
    description: string;
    categoryId: string;
    subcategoryId: string;
}

// ✅ Remove prop, get from URL params instead
export default function EditVariantForm() {
    const router = useRouter();
    const params = useParams(); // ✅ Get params from URL
    const variantId = params.variantId as string; // ✅ Extract variantId
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    console.log('🔧 Component mounted');
    console.log('📋 params:', params);
    console.log('📋 variantId from params:', variantId);
    
    const [variant, setVariant] = useState<ProductVariant | null>(null);
    const [product, setProduct] = useState<Product | null>(null);
    
    const [formData, setFormData] = useState({
        storage: "",
        color: "",
        price: "",
        stock: "",
        discountPercent: "",
        isActive: true
    });
    
    const [existingImages, setExistingImages] = useState<Array<{ id: string; url: string; publicId: string }>>([]);
    const [newImages, setNewImages] = useState<Array<{ file: File; preview: string; id: string }>>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fetching, setFetching] = useState(true);
    
    // ✅ Fetch variant data khi component mount
    useEffect(() => {
        const fetchVariant = async () => {
            try {
                setFetching(true);
                console.log('🚀 === START FETCH VARIANT ===');
                console.log('📋 variantId:', variantId);
                console.log('🌐 API URL:', `http://localhost:3000/api/products/variants/${variantId}`);

                const response = await fetch(`http://localhost:3000/api/products/variants/${variantId}`);

                console.log('📡 Response received');
                console.log('   - Status:', response.status);
                console.log('   - Status Text:', response.statusText);
                console.log('   - OK:', response.ok);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('❌ Response not OK');
                    console.error('   - Error body:', errorText);
                    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
                }
                
                const result = await response.json();
                console.log('✅ Response parsed successfully');
                console.log('📦 Full result:', JSON.stringify(result, null, 2));
                
                const variantData = result.data.variant;
                const productData = result.data.product;
                
                console.log('🔍 Extracted variantData:', variantData);
                console.log('🔍 Extracted productData:', productData);
                
                if (!variantData) {
                    throw new Error('Variant data không tồn tại trong response');
                }
                
                if (!productData) {
                    throw new Error('Product data không tồn tại trong response');
                }
                
                setVariant(variantData);
                setProduct(productData);
                
                console.log('✅ State updated with variant and product');
                
                // ✅ Fill form data
                setFormData({
                    storage: variantData.storage || "",
                    color: variantData.color || "",
                    price: variantData.price?.toString() || "",
                    stock: variantData.stock?.toString() || "",
                    discountPercent: variantData.discountPercent?.toString() || "0",
                    isActive: variantData.isActive === true
                });
                
                // ✅ Set existing images
                if (variantData.imageUrls && Array.isArray(variantData.imageUrls)) {
                    setExistingImages(variantData.imageUrls.map((url: string, index: number) => ({
                        id: `existing_${index}`,
                        url: url,
                        publicId: variantData.imagePublicIds?.[index] || ""
                    })));
                }
                
                console.log('✅ === FETCH VARIANT COMPLETE ===');
                
            } catch (error) {
                console.error('💥 === FETCH VARIANT ERROR ===');
                console.error('❌ Error:', error);
                
                setError('Không thể tải thông tin variant: ' + error.message);
                toast.error('Không thể tải thông tin variant');
                
                setTimeout(() => {
                    router.push('/products');
                }, 3000);
            } finally {
                console.log('🏁 Setting fetching to false');
                setFetching(false);
            }
        };
        
        console.log('🎬 useEffect triggered');
        console.log('   - variantId:', variantId);
        console.log('   - variantId type:', typeof variantId);
        console.log('   - variantId exists:', !!variantId);
        
        if (variantId) {
            console.log('✅ variantId is valid, calling fetchVariant()');
            fetchVariant();
        } else {
            console.log('⚠️ variantId is empty/undefined');
            setFetching(false);
        }
    }, [variantId, router]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };
    
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        
        // ✅ Limit số lượng ảnh (tối đa 5 ảnh/variant)
        const maxImages = 5;
        const currentTotal = existingImages.length + newImages.length;
        const availableSlots = maxImages - currentTotal;
        
        if (availableSlots <= 0) {
            toast.error(`Tối đa ${maxImages} ảnh cho mỗi variant`);
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
                if (e.target?.result) {
                    setNewImages(prev => [...prev, {
                        file,
                        preview: e.target.result as string,
                        id: Date.now() + Math.random().toString()
                    }]);
                }
            };
            reader.readAsDataURL(file);
        });
        
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    
    const removeExistingImage = (id: string) => {
        setExistingImages(prev => prev.filter(img => img.id !== id));
    };
    
    const removeNewImage = (id: string) => {
        setNewImages(prev => prev.filter(img => img.id !== id));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            // ✅ Validation
            if (!formData.storage.trim()) {
                throw new Error("Dung lượng không được để trống");
            }
            
            if (!formData.color.trim()) {
                throw new Error("Màu sắc không được để trống");
            }
            
            if (!formData.price || parseFloat(formData.price) <= 0) {
                throw new Error("Giá phải lớn hơn 0");
            }
            
            if (!formData.stock || parseInt(formData.stock) < 0) {
                throw new Error("Số lượng không được âm");
            }
            
            const discountPercent = parseFloat(formData.discountPercent) || 0;
            if (discountPercent < 0 || discountPercent > 100) {
                throw new Error("Giảm giá phải từ 0-100%");
            }
            
            // ✅ Kiểm tra có ít nhất 1 ảnh
            if (existingImages.length === 0 && newImages.length === 0) {
                throw new Error("Variant phải có ít nhất 1 ảnh");
            }
            
            console.log(`📝 Updating variant ${variantId}`);
            
            // ✅ Prepare FormData
            const submitData = new FormData();
            
            // Product info (không thay đổi, chỉ để API biết context)
            if (product) {
                submitData.append('name', product.name);
                submitData.append('description', product.description);
                submitData.append('categoryId', product.categoryId);
                if (product.subcategoryId) {
                    submitData.append('subcategoryId', product.subcategoryId);
                }
            }
            
            // ✅ Variant data (BẮT BUỘC CÓ _id)
            const variantData = [{
                _id: variantId,
                storage: formData.storage.trim(),
                color: formData.color.trim(),
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock),
                discountPercent: discountPercent,
                isActive: formData.isActive
            }];
            
            submitData.append('variants', JSON.stringify(variantData));
            
            // ✅ Append new images (variant_0_images vì chỉ update 1 variant)
            newImages.forEach((image) => {
                submitData.append('variant_0_images', image.file);
            });
            
            console.log('📦 Submitting data:', {
                variantId,
                storage: formData.storage,
                color: formData.color,
                price: formData.price,
                stock: formData.stock,
                discountPercent: discountPercent,
                isActive: formData.isActive,
                newImagesCount: newImages.length,
                existingImagesCount: existingImages.length
            });
            
            // ✅ Call PUT API (update product với 1 variant)
            const response = await fetch(`http://localhost:3000/api/products/${product?._id}`, {
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
                }
                
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            console.log('✅ Update successful:', result);
            
            toast.success('Cập nhật variant thành công!');
            
            setTimeout(() => {
                router.push('/products');
            }, 1000);
            
        } catch (error) {
            console.error('❌ Error updating variant:', error);
            setError(error.message);
            toast.error(`Lỗi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    // ✅ Calculate final price (giá sau giảm)
    const calculateFinalPrice = () => {
        const price = parseFloat(formData.price) || 0;
        const discount = parseFloat(formData.discountPercent) || 0;
        return price * (1 - discount / 100);
    };
    
    const calculateSavedAmount = () => {
        const price = parseFloat(formData.price) || 0;
        const finalPrice = calculateFinalPrice();
        return price - finalPrice;
    };
    
    if (fetching) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-black">Đang tải thông tin variant...</p>
                </div>
            </div>
        );
    }
    
    if (!variant || !product) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                    <p className="text-red-600">Không tìm thấy variant</p>
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
                <h1 className="text-2xl font-bold text-black">Chỉnh sửa Variant</h1>
                <p className="text-gray-600 mt-1">
                    Sản phẩm: <span className="font-medium text-black">{product.name}</span>
                </p>
            </div>

            {/* Form */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Thông tin hiện tại */}
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3 mb-3">
                            <Package className="w-5 h-5 text-blue-600" />
                            <h3 className="font-medium text-black">Thông tin hiện tại</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">SKU</p>
                                <p className="font-medium text-black">{variant.sku}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Đã bán</p>
                                <p className="font-medium text-black">{variant.sold}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Trạng thái</p>
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                    variant.isActive 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {variant.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin variant */}
                    <div>
                        <h3 className="text-lg font-medium text-black mb-4">Thông tin variant</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Dung lượng *
                                </label>
                                <input
                                    type="text"
                                    name="storage"
                                    value={formData.storage}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                    placeholder="VD: 256GB, 512GB, 1TB"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Màu sắc *
                                </label>
                                <input
                                    type="text"
                                    name="color"
                                    value={formData.color}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                    placeholder="VD: Đen, Trắng, Xanh"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-black mb-1">
                                    Giá gốc (VNĐ) *
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
                                    Số lượng tồn *
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
                                    Giảm giá (%) 🎁
                                </label>
                                <input
                                    type="number"
                                    name="discountPercent"
                                    value={formData.discountPercent}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                    placeholder="0"
                                    min="0"
                                    max="100"
                                    step="1"
                                />
                                <p className="text-xs text-gray-500 mt-1">Từ 0% đến 100%</p>
                            </div>
                            
                            <div className="flex items-center pt-6">
                                <input
                                    type="checkbox"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleInputChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-black">
                                    Kích hoạt variant
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Preview giá */}
                    {parseFloat(formData.discountPercent) > 0 && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <h4 className="font-medium text-green-800 mb-2">💰 Xem trước giá</h4>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-green-700">Giá gốc</p>
                                    <p className="font-bold text-green-900">
                                        {parseFloat(formData.price || "0").toLocaleString('vi-VN')} VNĐ
                                    </p>
                                </div>
                                <div>
                                    <p className="text-green-700">Giảm {formData.discountPercent}%</p>
                                    <p className="font-bold text-red-600">
                                        -{calculateSavedAmount().toLocaleString('vi-VN')} VNĐ
                                    </p>
                                </div>
                                <div>
                                    <p className="text-green-700">Giá sau giảm</p>
                                    <p className="font-bold text-green-900 text-lg">
                                        {calculateFinalPrice().toLocaleString('vi-VN')} VNĐ
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Hình ảnh */}
                    <div>
                        <h3 className="text-lg font-medium text-black mb-4">
                            Hình ảnh variant
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({existingImages.length + newImages.length}/5)
                            </span>
                        </h3>
                        
                        {/* Ảnh hiện tại */}
                        {existingImages.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm text-black mb-2">Ảnh hiện tại:</p>
                                <div className="grid grid-cols-5 gap-3">
                                    {existingImages.map((image) => (
                                        <div key={image.id} className="relative group">
                                            <img
                                                src={image.url}
                                                alt="Existing"
                                                className="w-full h-20 object-cover rounded border border-gray-300"
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
                        {(existingImages.length + newImages.length) < 5 && (
                            <div 
                                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 cursor-pointer transition-colors"
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
                                
                                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-black mb-1">Thêm ảnh mới</p>
                                <p className="text-gray-500 text-xs">
                                    JPG, PNG (tối đa 5MB). Còn {5 - existingImages.length - newImages.length} ảnh
                                </p>
                            </div>
                        )}
                        
                        {/* Xem trước ảnh mới */}
                        {newImages.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm text-black mb-2">Ảnh mới thêm:</p>
                                <div className="grid grid-cols-5 gap-3">
                                    {newImages.map((image) => (
                                        <div key={image.id} className="relative group">
                                            <img
                                                src={image.preview}
                                                alt="New"
                                                className="w-full h-20 object-cover rounded border border-blue-300"
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
                            {loading ? "Đang cập nhật..." : "Cập nhật variant"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
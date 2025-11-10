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
        isActive: true,
        isOnSale: false  // ✅ THÊM STATE MỚI cho toggle giảm giá
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
                console.log('🚀 Fetching variant:', variantId);

                const response = await fetch(`http://localhost:3000/api/products/variants/${variantId}`);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
                }
                
                const result = await response.json();
                const variantData = result.data.variant;
                const productData = result.data.product;
                
                if (!variantData || !productData) {
                    throw new Error('Dữ liệu không hợp lệ');
                }
                
                setVariant(variantData);
                setProduct(productData);
                
                // Fill form
                setFormData({
                    storage: variantData.storage || "",
                    color: variantData.color || "",
                    price: variantData.price?.toString() || "",
                    stock: variantData.stock?.toString() || "",
                    discountPercent: variantData.discountPercent?.toString() || "0",
                    isActive: variantData.isActive === true,
                    isOnSale: variantData.isOnSale === true  // ✅ THÊM vào fetch
                });
                
                // Set existing images
                if (variantData.imageUrls && Array.isArray(variantData.imageUrls)) {
                    setExistingImages(variantData.imageUrls.map((url: string, index: number) => ({
                        id: `existing_${index}`,
                        url: url,
                        publicId: variantData.imagePublicIds?.[index] || ""
                    })));
                }
                
                console.log('✅ Variant loaded successfully');
                
            } catch (error) {
                console.error('❌ Error fetching variant:', error);
                setError(`Không thể tải thông tin variant: ${error instanceof Error ? error.message : 'Unknown error'}`);
                toast.error('Không thể tải thông tin variant');
                
                setTimeout(() => {
                    router.push('/products');
                }, 3000);
            } finally {
                setFetching(false);
            }
        };
        
        if (variantId) {
            fetchVariant();
        } else {
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
        
        const maxImages = 5;
        const currentTotal = existingImages.length + newImages.length;
        const availableSlots = maxImages - currentTotal;
        
        if (availableSlots <= 0) {
            toast.error(`Tối đa ${maxImages} ảnh cho mỗi variant`);
            return;
        }
        
        const filesToProcess = files.slice(0, availableSlots);
        
        filesToProcess.forEach(file => {
            if (!file.type.startsWith('image/')) {
                toast.error(`${file.name} không phải là file ảnh`);
                return;
            }
            
            if (file.size > 5 * 1024 * 1024) {
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
    
    // ✅ THÊM HANDLER CHO TOGGLE GIẢM GIÁ
    const handleDiscountToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        
        setFormData(prev => ({
            ...prev,
            isOnSale: isChecked,
            // ✅ Nếu tắt giảm giá → reset discountPercent về 0
            discountPercent: isChecked ? prev.discountPercent : "0"
        }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        
        try {
            // Validation
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
            
            // ✅ VALIDATE: Nếu bật giảm giá nhưng % = 0
            if (formData.isOnSale && discountPercent === 0) {
                throw new Error("Vui lòng nhập % giảm giá hoặc tắt khuyến mãi");
            }
            
            console.log(`📝 Updating variant ${variantId}`);
            
            // ✅ CHUẨN BỊ FORMDATA
            const submitData = new FormData();
            
            submitData.append('storage', formData.storage.trim());
            submitData.append('color', formData.color.trim());
            submitData.append('price', formData.price);
            submitData.append('stock', formData.stock);
            // ✅ Chỉ gửi discountPercent nếu isOnSale = true
            submitData.append('discountPercent', formData.isOnSale ? discountPercent.toString() : "0");
            submitData.append('isActive', formData.isActive.toString());
            
            // ✅ APPEND ẢNH MỚI (nếu có)
            if (newImages.length > 0) {
                console.log(`📸 Uploading ${newImages.length} new images`);
                newImages.forEach((image) => {
                    submitData.append('images', image.file); // Backend expect field name 'images'
                });
            }
            
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
            
            // ✅ GỌI API UPDATE VARIANT (KHÔNG PHẢI UPDATE PRODUCT!)
            const response = await fetch(`http://localhost:3000/api/products/variants/${variantId}`, {
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
                    } catch (parseError) {
                        console.error('Error parsing error response:', parseError);
                    }
                }
                
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            console.log('✅ Update successful:', result);
            
            // ✅ HIỂN THỊ THÔNG BÁO SUCCESS (bao gồm giá sau giảm)
            const updatedVariant = result.data;
            
            if (updatedVariant.discountPercent > 0) {
                toast.success(
                    `✅ Cập nhật thành công!\n` +
                    `💰 Giá gốc: ${updatedVariant.price.toLocaleString('vi-VN')} VNĐ\n` +
                    `🎁 Giảm ${updatedVariant.discountPercent}%\n` +
                    `💵 Giá sau giảm: ${updatedVariant.finalPrice.toLocaleString('vi-VN')} VNĐ`,
                    { duration: 5000 }
                );
            } else {
                toast.success('✅ Cập nhật variant thành công!');
            }
            
            setTimeout(() => {
                router.push('/products');
            }, 1500);
            
        } catch (error) {
            console.error('❌ Error updating variant:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            toast.error(`❌ Lỗi: ${errorMessage}`);
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
                                <p className="text-gray-500">Trạng thái hiện tại</p>
                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                    variant.isActive 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {variant.isActive ? 'Hoạt động' : 'Tạm dừng'}
                                </span>
                            </div>
                        </div>
                        
                        {/* ✅ HIỂN THỊ GIẢM GIÁ HIỆN TẠI (nếu có) */}
                        {variant.discountPercent > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-300">
                                <p className="text-xs text-gray-500 mb-1">Khuyến mãi hiện tại:</p>
                                <div className="flex items-center gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">Giảm giá: </span>
                                        <span className="font-bold text-red-600">{variant.discountPercent}%</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">Giá sau giảm: </span>
                                        <span className="font-bold text-green-600">
                                            {variant.finalPrice.toLocaleString('vi-VN')} VNĐ
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
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
                            
                            {/* ✅ TOGGLE BẬT/TẮT GIẢM GIÁ */}
                            <div className="col-span-2 border-t border-gray-200 pt-4 mt-2">
                                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                                    <div>
                                        <h4 className="font-medium text-purple-900 flex items-center gap-2">
                                            🎁 Khuyến mãi giảm giá
                                        </h4>
                                        <p className="text-sm text-purple-700 mt-1">
                                            {formData.isOnSale 
                                                ? "Đang áp dụng giảm giá cho variant này" 
                                                : "Tắt giảm giá - sản phẩm bán giá gốc"}
                                        </p>
                                    </div>
                                    
                                    {/* Toggle Switch */}
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isOnSale}
                                            onChange={handleDiscountToggle}
                                            className="sr-only peer"
                                        />
                                        <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                                        <span className="ms-3 text-sm font-medium text-gray-900">
                                            {formData.isOnSale ? "Bật" : "Tắt"}
                                        </span>
                                    </label>
                                </div>
                            </div>
                            
                            {/* ✅ INPUT % GIẢM GIÁ (chỉ hiện khi isOnSale = true) */}
                            {formData.isOnSale && (
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-black mb-1">
                                        Phần trăm giảm giá (%) 🎁 *
                                    </label>
                                    <input
                                        type="number"
                                        name="discountPercent"
                                        value={formData.discountPercent}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border-2 border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-black"
                                        placeholder="Nhập % giảm giá (1-100)"
                                        min="1"
                                        max="100"
                                        step="1"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Nhập từ 1% đến 100%. Ví dụ: 20 = giảm 20%
                                    </p>
                                </div>
                            )}
                            
                            {/* ✅ CHECKBOX TRẠNG THÁI HOẠT ĐỘNG */}
                            <div className="col-span-2 border-t border-gray-200 pt-4 mt-2">
                                <div className="flex items-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <div className="ml-3">
                                        <label className="font-medium text-blue-900">
                                            Kích hoạt variant
                                        </label>
                                        <p className="text-sm text-blue-700">
                                            {formData.isActive 
                                                ? "✅ Variant đang được hiển thị trên website" 
                                                : "❌ Variant bị ẩn - khách hàng không thấy"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ✅ PREVIEW GIÁ (chỉ hiện khi có giảm giá) */}
                    {formData.isOnSale && parseFloat(formData.discountPercent) > 0 && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 shadow-sm">
                            <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                                💰 XEM TRƯỚC GIÁ BÁN
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-white rounded-lg p-3 border border-green-200">
                                    <p className="text-xs text-gray-500 mb-1">Giá gốc</p>
                                    <p className="font-bold text-gray-800 text-lg">
                                        {parseFloat(formData.price || "0").toLocaleString('vi-VN')} ₫
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-red-200">
                                    <p className="text-xs text-gray-500 mb-1">Giảm {formData.discountPercent}%</p>
                                    <p className="font-bold text-red-600 text-lg">
                                        -{calculateSavedAmount().toLocaleString('vi-VN')} ₫
                                    </p>
                                </div>
                                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-3 text-white shadow-md">
                                    <p className="text-xs opacity-90 mb-1">Giá sau giảm</p>
                                    <p className="font-bold text-xl">
                                        {calculateFinalPrice().toLocaleString('vi-VN')} ₫
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    💡 <strong>Lưu ý:</strong> Khách hàng sẽ thấy giá gốc bị <span className="line-through">gạch</span> và giá sau giảm được highlight.
                                </p>
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
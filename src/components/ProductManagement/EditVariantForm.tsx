"use client";
import React, { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, X, Save, Package } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';
import { z } from 'zod';

// ✅ Zod Schema for Variant
const variantSchema = z.object({
    storage: z.string()
        .min(1, "Dung lượng là bắt buộc")
        .min(2, "Dung lượng phải có ít nhất 2 ký tự")
        .max(50, "Dung lượng tối đa 50 ký tự"),
    
    color: z.string()
        .min(1, "Màu sắc là bắt buộc")
        .min(2, "Màu sắc phải có ít nhất 2 ký tự")
        .max(50, "Màu sắc tối đa 50 ký tự"),
    
    price: z.string()
        .min(1, "Giá là bắt buộc")
        .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
            message: "Giá phải lớn hơn 0"
        })
        .refine((val) => parseFloat(val) <= 1000000000, {
            message: "Giá không được vượt quá 1 tỷ VNĐ"
        }),
    
    stock: z.string()
        .min(1, "Số lượng là bắt buộc")
        .refine((val) => !isNaN(parseInt(val)) && parseInt(val) >= 0, {
            message: "Số lượng không được âm"
        }),
    
    discountPercent: z.string()
        .optional()
        .refine((val) => {
            if (!val || val === "") return true;
            const num = parseFloat(val);
            return !isNaN(num) && num >= 0 && num <= 100;
        }, {
            message: "Giảm giá phải từ 0-100%"
        }),
    
    isActive: z.boolean()
});

type VariantFormData = z.infer<typeof variantSchema>;

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

interface EditVariantFormProps {
    variantId: string;
}

export default function EditVariantForm({ variantId }: EditVariantFormProps) {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [variant, setVariant] = useState<ProductVariant | null>(null);
    const [product, setProduct] = useState<Product | null>(null);
    
    const [formData, setFormData] = useState<VariantFormData>({
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
    const [fetching, setFetching] = useState(true);
    
    // ✅ Zod validation errors
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    
    useEffect(() => {
        const fetchVariant = async () => {
            try {
                setFetching(true);

                const response = await fetch(`http://localhost:3000/api/products/variants/${variantId}`);

                if (!response.ok) {
                    throw new Error('Không thể tải thông tin variant');
                }
                
                const result = await response.json();
                const variantData = result.data.variant;
                const productData = result.data.product;
                
                if (!variantData || !productData) {
                    throw new Error('Dữ liệu không hợp lệ');
                }
                
                setVariant(variantData);
                setProduct(productData);
                
                setFormData({
                    storage: variantData.storage || "",
                    color: variantData.color || "",
                    price: variantData.price?.toString() || "",
                    stock: variantData.stock?.toString() || "",
                    discountPercent: variantData.discountPercent?.toString() || "0",
                    isActive: variantData.isActive === true
                });
                
                if (variantData.imageUrls && Array.isArray(variantData.imageUrls)) {
                    setExistingImages(variantData.imageUrls.map((url: string, index: number) => ({
                        id: `existing_${index}`,
                        url: url,
                        publicId: variantData.imagePublicIds?.[index] || ""
                    })));
                }
                
            } catch (error: any) {
                console.error('❌ Error fetching variant:', error);
                toast.error(error.message || 'Không thể tải thông tin variant');
                setTimeout(() => router.push('/products'), 2000);
            } finally {
                setFetching(false);
            }
        };
        
        if (variantId) {
            fetchVariant();
        }
    }, [variantId, router]);
    
    // ✅ Validate single field with Zod
    const validateField = (name: keyof VariantFormData, value: any) => {
        try {
            const fieldSchema = variantSchema.shape[name];
            fieldSchema.parse(value);
            
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
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const fieldName = name as keyof VariantFormData;
        const fieldValue = type === 'checkbox' ? checked : value;
        
        setFormData(prev => ({
            ...prev,
            [fieldName]: fieldValue
        }));
        
        // ✅ Validate on change (except checkbox)
        if (type !== 'checkbox') {
            validateField(fieldName, fieldValue);
        }
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
                        id: `new_${Date.now()}_${Math.random()}`
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
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // ✅ Validate all fields with Zod
        try {
            variantSchema.parse(formData);
            
            // ✅ Check images
            if (existingImages.length === 0 && newImages.length === 0) {
                toast.error('Variant phải có ít nhất 1 ảnh');
                setValidationErrors(prev => ({
                    ...prev,
                    images: 'Variant phải có ít nhất 1 ảnh'
                }));
                return;
            }
            
            setValidationErrors({});
            
        } catch (error) {
            if (error instanceof z.ZodError) {
                const errors: Record<string, string> = {};
                error.errors.forEach(err => {
                    if (err.path[0]) {
                        errors[err.path[0].toString()] = err.message;
                    }
                });
                setValidationErrors(errors);
                toast.error('Vui lòng kiểm tra lại các trường nhập liệu');
                return;
            }
        }
        
        setLoading(true);
        
        try {
            // ✅ TẠO FORMDATA THEO FORMAT MỚI
            const submitData = new FormData();
            
            // ✅ CHỈ GỬI CÁC FIELD CỦA VARIANT (KHÔNG GỬI PRODUCT)
            submitData.append('storage', formData.storage.trim());
            submitData.append('color', formData.color.trim());
            submitData.append('price', formData.price);
            submitData.append('stock', formData.stock);
            
            // ✅ Discount percent (nếu có)
            const discountPercent = parseFloat(formData.discountPercent || "0");
            submitData.append('discountPercent', discountPercent.toString());
            
            // ✅ Active status
            submitData.append('isActive', formData.isActive.toString());
            
            // ✅ UPLOAD ẢNH MỚI (NẾU CÓ)
            // Chỉ upload khi có ảnh mới, backend sẽ tự động xóa ảnh cũ
            if (newImages.length > 0) {
                console.log(`📸 Uploading ${newImages.length} new images...`);
                newImages.forEach((image) => {
                    submitData.append('images', image.file);
                });
            } else {
                console.log('ℹ️ No new images, keeping existing images');
            }
            
            // ✅ GỌI API MỚI: PATCH /products/variants/:variantId
            console.log('🔄 Updating variant:', variantId);
            
            const response = await fetch(`http://localhost:3000/api/products/variants/${variantId}`, {
                method: 'PATCH',
                body: submitData
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Có lỗi xảy ra khi cập nhật');
            }
            
            const result = await response.json();
            
            console.log('✅ Update successful:', result);
            
            // ✅ SUCCESS TOAST VỚI THÔNG TIN CHI TIẾT
            toast.success(
                `✅ Cập nhật variant thành công!\n` +
                `SKU: ${result.data.sku}\n` +
                `Giá: ${result.data.finalPrice?.toLocaleString('vi-VN')}đ`,
                { duration: 3000 }
            );
            
            // ✅ REDIRECT VỀ PRODUCT LIST SAU 1S
            setTimeout(() => router.push('/products'), 1000);
            
        } catch (error: any) {
            console.error('❌ Error updating variant:', error);
            
            // ✅ ERROR TOAST CHI TIẾT
            if (error.message.includes('SKU')) {
                toast.error(`❌ Lỗi: SKU đã tồn tại. Vui lòng chọn storage/color khác.`);
            } else if (error.message.includes('upload')) {
                toast.error(`❌ Lỗi upload ảnh: ${error.message}`);
            } else {
                toast.error(`❌ Lỗi: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };
    
    // ✅ Calculate final price
    const calculateFinalPrice = () => {
        const price = parseFloat(formData.price) || 0;
        const discount = parseFloat(formData.discountPercent || "0");
        return Math.round(price * (1 - discount / 100));
    };
    
    // ✅ Calculate saved amount
    const calculateSavedAmount = () => {
        const price = parseFloat(formData.price) || 0;
        const finalPrice = calculateFinalPrice();
        return Math.round(price - finalPrice);
    };
    
    // ✅ Get input classes with validation styling
    const getInputClasses = (hasError: boolean) =>
        `w-full px-3 py-2 text-sm bg-white border-2 rounded-md transition-colors focus:outline-none focus:ring-2 text-gray-900 ${
            hasError
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/30'
        }`;
    
    if (fetching) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-lg border-2 border-gray-200 p-8 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-900 font-medium">Đang tải thông tin variant...</p>
                </div>
            </div>
        );
    }
    
    if (!variant || !product) {
        return (
            <div className="max-w-4xl mx-auto p-8">
                <div className="bg-white rounded-lg border-2 border-gray-200 p-8 text-center">
                    <p className="text-red-600 font-medium">Không tìm thấy variant</p>
                    <button
                        onClick={() => router.push('/products')}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }
    
    return (
        // ✅ Background overlay mờ
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-4xl mx-auto p-4 lg:p-8">
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa Variant</h1>
                    <p className="text-gray-600 mt-1">
                        Sản phẩm: <span className="font-semibold text-gray-900">{product.name}</span>
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ✅ Card trắng nổi bật với shadow lớn hơn */}
                    <div className="bg-white rounded-lg border-2 border-gray-200 p-6 shadow-lg">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Package className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Thông tin hiện tại</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">SKU</p>
                                <p className="font-semibold text-gray-900 text-sm">{variant.sku}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Đã bán</p>
                                <p className="font-semibold text-gray-900 text-sm">{variant.sold} sản phẩm</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border-2 border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Trạng thái</p>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    variant.isActive 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {variant.isActive ? '✓ Hoạt động' : '✕ Tạm dừng'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ✅ Thông tin variant - shadow lớn hơn */}
                    <div className="bg-white rounded-lg border-2 border-gray-200 p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin variant</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Dung lượng */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Dung lượng <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="storage"
                                    value={formData.storage}
                                    onChange={handleInputChange}
                                    className={getInputClasses(!!validationErrors.storage)}
                                    placeholder="VD: 256GB"
                                />
                                {validationErrors.storage && (
                                    <p className="text-red-500 text-xs mt-1 font-medium">⚠ {validationErrors.storage}</p>
                                )}
                            </div>
                            
                            {/* Màu sắc */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Màu sắc <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="color"
                                    value={formData.color}
                                    onChange={handleInputChange}
                                    className={getInputClasses(!!validationErrors.color)}
                                    placeholder="VD: Tím Oải Hương"
                                />
                                {validationErrors.color && (
                                    <p className="text-red-500 text-xs mt-1 font-medium">⚠ {validationErrors.color}</p>
                                )}
                            </div>
                            
                            {/* Giá bán */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Giá bán (VND) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    className={getInputClasses(!!validationErrors.price)}
                                    placeholder="VD: 25000000"
                                    min="0"
                                    step="1000"
                                />
                                {validationErrors.price && (
                                    <p className="text-red-500 text-xs mt-1 font-medium">⚠ {validationErrors.price}</p>
                                )}
                            </div>
                            
                            {/* Số lượng */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Số lượng tồn kho <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleInputChange}
                                    className={getInputClasses(!!validationErrors.stock)}
                                    placeholder="VD: 100"
                                    min="0"
                                />
                                {validationErrors.stock && (
                                    <p className="text-red-500 text-xs mt-1 font-medium">⚠ {validationErrors.stock}</p>
                                )}
                            </div>
                            
                            {/* Giảm giá */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Giảm giá (%)
                                    <span className="text-gray-500 font-normal ml-1">(Tùy chọn)</span>
                                </label>
                                <input
                                    type="number"
                                    name="discountPercent"
                                    value={formData.discountPercent}
                                    onChange={handleInputChange}
                                    className={getInputClasses(!!validationErrors.discountPercent)}
                                    placeholder="VD: 20"
                                    min="0"
                                    max="100"
                                    step="1"
                                />
                                {validationErrors.discountPercent && (
                                    <p className="text-red-500 text-xs mt-1 font-medium">⚠ {validationErrors.discountPercent}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">Để trống = 0% (không giảm)</p>
                            </div>
                            
                            {/* ✅ Giá sau giảm - Readonly calculated field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Giá sau giảm (VND)
                                </label>
                                <div className="w-full px-3 py-2 text-sm bg-gray-100 border-2 border-gray-300 rounded-md text-gray-900 font-semibold">
                                    {(() => {
                                        const finalPrice = calculateFinalPrice();
                                        return finalPrice > 0 
                                            ? `${finalPrice.toLocaleString('vi-VN')} đ` 
                                            : '--- đ';
                                    })()}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Tự động tính toán</p>
                            </div>
                            
                            {/* Trạng thái */}
                            <div className="flex items-end md:col-span-3">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isActive"
                                        checked={formData.isActive}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500 border-2 border-gray-300 rounded"
                                    />
                                    <span className="ml-2 text-sm text-gray-700 font-medium">
                                        Kích hoạt variant (hiển thị trên website)
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    {/* ✅ Hình ảnh - shadow lớn hơn */}
                    <div className="bg-white rounded-lg border-2 border-gray-200 p-6 shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            Hình ảnh variant
                            <span className="text-sm font-normal text-gray-500 ml-2">
                                ({existingImages.length + newImages.length}/5)
                            </span>
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">Tối đa 5 ảnh, mỗi ảnh tối đa 5MB</p>
                        
                        {validationErrors.images && (
                            <p className="text-red-500 text-sm mb-3 font-medium">⚠ {validationErrors.images}</p>
                        )}
                        
                        {existingImages.length > 0 && (
                            <div className="mb-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Ảnh hiện tại:</p>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                    {existingImages.map((image) => (
                                        <div key={image.id} className="relative group">
                                            <img
                                                src={image.url}
                                                alt="Existing"
                                                className="w-full h-24 object-cover rounded-lg border-2 border-gray-300 shadow-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(image.id)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {(existingImages.length + newImages.length) < 5 && (
                            <div 
                                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 hover:bg-blue-50/30 cursor-pointer transition-all"
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
                                
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-3">
                                    <Upload className="w-6 h-6 text-gray-500" />
                                </div>
                                <p className="text-gray-700 font-medium mb-1">Nhấp để chọn ảnh</p>
                                <p className="text-gray-500 text-xs">
                                    JPG, PNG (tối đa 5MB). Còn {5 - existingImages.length - newImages.length} ảnh
                                </p>
                            </div>
                        )}
                        
                        {newImages.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-2">Ảnh mới thêm:</p>
                                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                                    {newImages.map((image) => (
                                        <div key={image.id} className="relative group">
                                            <img
                                                src={image.preview}
                                                alt="New"
                                                className="w-full h-24 object-cover rounded-lg border-2 border-blue-400 shadow-sm"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(image.id)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* ✅ Nút hành động - sticky bottom với shadow */}
                    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 shadow-lg sticky bottom-4">
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                Hủy
                            </button>
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2.5 text-sm font-medium bg-blue-600 text-white border-2 border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors shadow-md hover:shadow-lg"
                            >
                                <Save className="w-4 h-4" />
                                {loading ? "Đang cập nhật..." : "Cập nhật variant"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
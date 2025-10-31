"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeft, Upload, X, Save, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';

// ✅ CẬP NHẬT SCHEMA: Thêm discountPercent (optional)
const variantSchema = z.object({
    storage: z.string().min(1, "Dung lượng là bắt buộc"),
    color: z.string().min(1, "Màu sắc là bắt buộc"),
    price: z.preprocess(
        (val) => Number(String(val).replace(/,/g, '')),
        z.number({ required_error: "Giá là bắt buộc" }).min(1, "Giá phải lớn hơn 0")
    ),
    stock: z.preprocess(
        (val) => Number(String(val).replace(/,/g, '')),
        z.number({ required_error: "Số lượng là bắt buộc" }).min(0, "Số lượng không âm")
    ),
    // ✅ THÊM: Giảm giá (optional, 0-100)
    discountPercent: z.preprocess(
        (val) => val === '' || val === undefined ? 0 : Number(String(val).replace(/,/g, '')),
        z.number().min(0, "Giảm giá không được âm").max(100, "Giảm giá tối đa 100%").optional()
    ).default(0),
});

const MAX_VARIANTS = 6; // ✅ THÊM GIỚI HẠN

const productSchema = z.object({
    name: z.string()
        .min(3, "Tên sản phẩm phải có ít nhất 3 ký tự")
        .max(100, "Tên sản phẩm không được quá 100 ký tự"),
    categoryId: z.string().min(1, "Vui lòng chọn danh mục"),
    subcategoryId: z.string().min(1, "Vui lòng chọn danh mục con").optional(),
    description: z.string().max(1000, "Mô tả không được quá 1000 ký tự").optional(),
    variants: z.array(variantSchema)
        .min(1, "Sản phẩm phải có ít nhất một phiên bản")
        .max(MAX_VARIANTS, `Tối đa ${MAX_VARIANTS} phiên bản mỗi lần tạo`), // ✅ THÊM MAX
});


export default function AddProductForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [variantImages, setVariantImages] = useState([[]]);

    const {
        register,
        control,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: "",
            categoryId: "",
            subcategoryId: "",
            description: "",
            variants: [{
                storage: '',
                color: '',
                price: '',
                stock: '',
                discountPercent: 0 // ✅ THÊM default
            }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "variants"
    });

    const watchedCategoryId = watch("categoryId");

    // --- LOGIC FETCH DATA VÀ XỬ LÝ ẢNH (Không thay đổi) ---
    useEffect(() => {
        const fetchCategories = async () => {
            setLoadingCategories(true);
            try {
                const res = await fetch('http://localhost:3000/api/categories');
                if (res.ok) setCategories(await res.json());
            } catch (e) {
                toast.error("Không thể tải danh mục.");
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        const fetchSubcategories = async (categoryId) => {
            try {
                const res = await fetch(`http://localhost:3000/api/subcategories/category/${categoryId}`);
                if (res.ok) setSubcategories(await res.json());
            } catch (e) {
                setSubcategories([]);
            }
        };
        if (watchedCategoryId) {
            fetchSubcategories(watchedCategoryId);
        } else {
            setSubcategories([]);
            setValue("subcategoryId", "");
        }
    }, [watchedCategoryId, setValue]);

    const handleImageUpload = (e, variantIndex) => {
        const files = Array.from(e.target.files);
        if ((variantImages[variantIndex]?.length || 0) + files.length > 5) {
            toast.error("Mỗi phiên bản chỉ được có tối đa 5 hình ảnh.");
            return;
        }
        const newImagesForVariant = [];
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    newImagesForVariant.push({ file, preview: event.target.result, id: Date.now() + Math.random() });
                    if (newImagesForVariant.length === files.length) {
                        setVariantImages(prev => {
                            const updatedImages = [...prev];
                            updatedImages[variantIndex] = [...(updatedImages[variantIndex] || []), ...newImagesForVariant];
                            return updatedImages;
                        });
                    }
                };
                reader.readAsDataURL(file);
            }
        });
    };

    const removeImage = (variantIndex, imageId) => {
        setVariantImages(prev => {
            const updatedImages = [...prev];
            updatedImages[variantIndex] = updatedImages[variantIndex].filter(img => img.id !== imageId);
            return updatedImages;
        });
    };

    const onSubmit = async (data) => {
        setLoading(true);
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('description', data.description || '');
        formData.append('categoryId', data.categoryId);
        formData.append('subcategoryId', data.subcategoryId || '');

        // ✅ CẬP NHẬT: Transform variants (thêm isOnSale)
        const variantsWithSale = data.variants.map(v => ({
            ...v,
            isOnSale: v.discountPercent > 0 // ✅ Tự động set isOnSale
        }));

        formData.append('variants', JSON.stringify(variantsWithSale));

        variantImages.forEach((images, index) => {
            images?.forEach(image => {
                formData.append(`variant_${index}_images`, image.file);
            });
        });

        try {
            const response = await fetch('http://localhost:3000/api/products', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Có lỗi xảy ra.');
            toast.success('Sản phẩm đã được tạo thành công! 🎉');
            setTimeout(() => router.push('/products'), 1000);
        } catch (error) {
            toast.error(`Lỗi: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Helper để quản lý class cho input (tránh lặp lại)
    const getInputClasses = (hasError) =>
        `block w-full px-3 py-2 text-sm text-gray-900 bg-white border rounded-md focus:outline-none focus:ring-2 ` +
        (hasError
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/40'
            : 'border-gray-300 focus:ring-blue-500 focus:border-transparent');

    return (
        <div className="max-w-4xl mx-auto p-4">
            <div className="mb-6">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                    <ArrowLeft className="w-4 h-4" /> Quay lại
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Thêm sản phẩm mới</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                {/* --- BASIC INFORMATION CARD --- */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">1. Thông tin cơ bản</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tên sản phẩm */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm *</label>
                            <input {...register("name")} placeholder="VD: iPhone 15 Pro Max" className={getInputClasses(errors.name)} />
                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                        </div>
                        {/* Danh mục */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục *</label>
                            <select {...register("categoryId")} className={getInputClasses(errors.categoryId)} disabled={loadingCategories}>
                                <option value="">{loadingCategories ? "Đang tải..." : "Chọn danh mục"}</option>
                                {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                            </select>
                            {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>}
                        </div>
                        {/* Danh mục con */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục con</label>
                            <select {...register("subcategoryId")} className={getInputClasses(errors.subcategoryId)} disabled={!watchedCategoryId || subcategories.length === 0}>
                                <option value="">{!watchedCategoryId ? "Chọn danh mục trước" : "Chọn danh mục con"}</option>
                                {subcategories.map(sub => <option key={sub._id} value={sub._id}>{sub.name}</option>)}
                            </select>
                            {errors.subcategoryId && <p className="text-red-500 text-sm mt-1">{errors.subcategoryId.message}</p>}
                        </div>
                        {/* Mô tả */}
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                            <textarea {...register("description")} rows={4} placeholder="Nhập mô tả chi tiết..." className={getInputClasses(errors.description)} />
                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                        </div>
                    </div>
                </div>

                {/* --- VARIANTS CARD --- */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">2. Phiên bản sản phẩm</h3>
                    <div className="space-y-6">
                        {fields.map((field, index) => (
                            <div key={field.id} className="p-4 border border-gray-200 rounded-lg relative">
                                <h4 className="font-semibold text-gray-800 mb-4">Phiên bản #{index + 1}</h4>
                                {fields.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            remove(index);
                                            setVariantImages(prev => prev.filter((_, i) => i !== index));
                                        }}
                                        className="absolute top-3 right-3 text-red-500 hover:text-red-700 p-1"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}

                                {/* ✅ CẬP NHẬT: Grid 3 cột cho 6 fields */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Dung lượng *</label>
                                        <input
                                            {...register(`variants.${index}.storage`)}
                                            placeholder="VD: 128GB"
                                            className={getInputClasses(errors.variants?.[index]?.storage)}
                                        />
                                        {errors.variants?.[index]?.storage && (
                                            <p className="text-red-500 text-sm mt-1">{errors.variants[index].storage.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc *</label>
                                        <input
                                            {...register(`variants.${index}.color`)}
                                            placeholder="VD: Xanh Titan"
                                            className={getInputClasses(errors.variants?.[index]?.color)}
                                        />
                                        {errors.variants?.[index]?.color && (
                                            <p className="text-red-500 text-sm mt-1">{errors.variants[index].color.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá bán (VND) *</label>
                                        <input
                                            type="number"
                                            {...register(`variants.${index}.price`)}
                                            placeholder="VD: 25000000"
                                            className={getInputClasses(errors.variants?.[index]?.price)}
                                        />
                                        {errors.variants?.[index]?.price && (
                                            <p className="text-red-500 text-sm mt-1">{errors.variants[index].price.message}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng tồn kho *</label>
                                        <input
                                            type="number"
                                            {...register(`variants.${index}.stock`)}
                                            placeholder="VD: 50"
                                            className={getInputClasses(errors.variants?.[index]?.stock)}
                                        />
                                        {errors.variants?.[index]?.stock && (
                                            <p className="text-red-500 text-sm mt-1">{errors.variants[index].stock.message}</p>
                                        )}
                                    </div>

                                    {/* ✅ THÊM: Trường giảm giá */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Giảm giá (%)
                                            <span className="text-gray-500 font-normal ml-1">(Tùy chọn)</span>
                                        </label>
                                        <input
                                            type="number"
                                            {...register(`variants.${index}.discountPercent`)}
                                            placeholder="VD: 20"
                                            min="0"
                                            max="100"
                                            className={getInputClasses(errors.variants?.[index]?.discountPercent)}
                                        />
                                        {errors.variants?.[index]?.discountPercent && (
                                            <p className="text-red-500 text-sm mt-1">{errors.variants[index].discountPercent.message}</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-1">Để trống = 0% (không giảm giá)</p>
                                    </div>

                                    {/* ✅ THÊM: Hiển thị giá sau giảm (Preview) */}
                                    <div className="flex items-end">
                                        <div className="w-full">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Giá sau giảm</label>
                                            <div className="px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-md text-gray-700">
                                                {(() => {
                                                    const price = watch(`variants.${index}.price`) || 0;
                                                    const discount = watch(`variants.${index}.discountPercent`) || 0;
                                                    const finalPrice = Math.round(price * (1 - discount / 100));
                                                    return finalPrice > 0 ? `${finalPrice.toLocaleString('vi-VN')} đ` : '---';
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Image upload section - không đổi */}
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Hình ảnh cho phiên bản này (Tối đa 5)
                                    </label>
                                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500" onClick={() => document.getElementById(`file-input-${index}`).click()}>
                                        <input id={`file-input-${index}`} type="file" onChange={(e) => handleImageUpload(e, index)} accept="image/*" multiple className="hidden" />
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-gray-600">Nhấp để chọn ảnh</p>
                                    </div>
                                    {variantImages[index]?.length > 0 && (
                                        <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-3">
                                            {variantImages[index].map(image => (
                                                <div key={image.id} className="relative">
                                                    <img src={image.preview} alt="Preview" className="w-full h-24 object-cover rounded border" />
                                                    <button type="button" onClick={() => removeImage(index, image.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X className="w-3 h-3" /></button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {errors.variants?.root && (
                            <p className="text-red-500 text-sm mt-2">{errors.variants.root.message}</p>
                        )}

                        {/* ✅ CẬP NHẬT: Button thêm variant với giới hạn */}
                        <button
                            type="button"
                            onClick={() => {
                                if (fields.length >= MAX_VARIANTS) {
                                    toast.error(`Tối đa ${MAX_VARIANTS} phiên bản mỗi lần tạo!`);
                                    return;
                                }
                                append({
                                    storage: '',
                                    color: '',
                                    price: '',
                                    stock: '',
                                    discountPercent: 0
                                });
                                setVariantImages(prev => [...prev, []]);
                            }}
                            disabled={fields.length >= MAX_VARIANTS}
                            className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm phiên bản {fields.length >= MAX_VARIANTS && `(Đã đạt ${MAX_VARIANTS}/${MAX_VARIANTS})`}
                        </button>
                    </div>
                </div>

                {/* --- SUBMIT BUTTONS --- */}
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium transition-colors border rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"
                    >
                        Hủy
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium transition-colors border rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white border-transparent hover:bg-blue-700"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {loading ? "Đang lưu..." : "Lưu sản phẩm"}
                    </button>
                </div>
            </form>
        </div>
    );
}
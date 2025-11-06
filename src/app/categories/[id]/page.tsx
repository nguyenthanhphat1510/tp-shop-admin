"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit, Trash2, FolderOpen, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import toast from 'react-hot-toast';

// FIX 1a: Định nghĩa Interface (kiểu dữ liệu) cho Category
interface Category {
  _id: string;
  name: string;
  description: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// FIX 1a: Định nghĩa kiểu cho dữ liệu API (để fix lỗi 'any' ở fetchStats)
interface ApiSubcategory {
  _id: string; // Giả định
  categoryId: string;
  isActive: boolean | string;
}

interface ApiProduct {
  _id: string; // Giả định
  categoryId: string;
  isActive: boolean | string;
}


export default function CategoryDetailPage() {
    const router = useRouter();
    const params = useParams();
    const categoryId = params.id as string;

    // FIX 1b: Sửa 'useState<any>(null)' thành kiểu dữ liệu cụ thể
    const [category, setCategory] = useState<Category | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Stats
    const [stats, setStats] = useState({
        totalSubCategories: 0,
        activeSubCategories: 0,
        totalProducts: 0,
        activeProducts: 0
    });

    // Fetch category details
    useEffect(() => {
        const fetchCategoryDetails = async () => {
            try {
                setLoading(true);

                // Fetch category
                const categoryRes = await fetch(`http://localhost:3000/api/categories/${categoryId}`);
                if (!categoryRes.ok) throw new Error('Không thể tải thông tin danh mục');
                const categoryData = await categoryRes.json();

                // Transform data
                const transformedCategory: Category = {
                    _id: categoryData._id,
                    name: categoryData.name,
                    description: categoryData.description || "",
                    active: categoryData.isActive === "true" || categoryData.isActive === true,
                    createdAt: categoryData.createdAt,
                    updatedAt: categoryData.updatedAt
                };

                setCategory(transformedCategory);

                // Fetch stats (subcategories and products)
                await fetchStats(categoryId);

                setError(null);
            // FIX 1c: Sửa 'catch (err: any)' thành 'catch (err: unknown)'
            } catch (err: unknown) {
                console.error('❌ Error fetching category details:', err);
                if (err instanceof Error) {
                    setError(err.message || 'Có lỗi xảy ra');
                } else {
                    setError('Có lỗi xảy ra');
                }
            } finally {
                setLoading(false);
            }
        };

        if (categoryId) {
            fetchCategoryDetails();
        }
    }, [categoryId]);

    // Fetch statistics
    const fetchStats = async (catId: string) => {
        try {
            // Fetch all subcategories
            const subRes = await fetch('http://localhost:3000/api/subcategories');
            const subData = await subRes.json();

            // FIX 1d: Sửa '(sub: any)' thành kiểu 'ApiSubcategory'
            const subCategoriesOfThisCategory = subData.filter((sub: ApiSubcategory) => sub.categoryId === catId);
            const activeSubCategories = subCategoriesOfThisCategory.filter((sub: ApiSubcategory) => sub.isActive === true || sub.isActive === "true");

            // Fetch all products
            const prodRes = await fetch('http://localhost:3000/api/products');
            const prodData = await prodRes.json();

            // FIX 1d: Sửa '(prod: any)' thành kiểu 'ApiProduct'
            const productsOfThisCategory = prodData.filter((prod: ApiProduct) => prod.categoryId === catId);
            const activeProducts = productsOfThisCategory.filter((prod: ApiProduct) => prod.isActive === true || prod.isActive === "true");

            setStats({
                totalSubCategories: subCategoriesOfThisCategory.length,
                activeSubCategories: activeSubCategories.length,
                totalProducts: productsOfThisCategory.length,
                activeProducts: activeProducts.length
            });
        } catch (error) {
            console.error('❌ Error fetching stats:', error);
        }
    };

    // Toggle status
    const handleToggleStatus = async () => {
        if (!category) return;

        const action = category.active ? 'TẠM DỪNG' : 'KÍCH HOẠT';
        const newStatusText = category.active ? 'Tạm dừng' : 'Hoạt động';
        const currentStatusText = category.active ? 'Hoạt động' : 'Tạm dừng';

        if (confirm(
            `⚠️ ${action} danh mục "${category.name}"?\n\n` +
            `Trạng thái sẽ chuyển từ "${currentStatusText}" sang "${newStatusText}"\n\n` +
            `Bạn có chắc chắn?`
        )) {
            try {
                const response = await fetch(`http://localhost:3000/api/categories/${categoryId}/toggle-status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });

                const responseText = await response.text();
                let result;
                try {
                    result = responseText ? JSON.parse(responseText) : {};
                } catch {
                    result = { message: responseText || 'Phản hồi không hợp lệ' };
                }

                if (!response.ok) {
                    throw new Error(result.message || `HTTP error! status: ${response.status}`);
                }

                const newStatus = result.isActive === "true" || result.isActive === true;

                // FIX 1e: Sửa lỗi 'prev' bị 'any'
                setCategory((prev) => {
                    // Thêm kiểm tra 'prev' có null hay không
                    if (!prev) return null; 
                    // Trả về state mới với kiểu 'Category'
                    return { ...prev, active: newStatus };
                });

                if (newStatus) {
                    toast.success(`✅ Đã kích hoạt: ${category.name}`, {
                        duration: 3000,
                        style: { background: '#10B981', color: '#fff', fontWeight: 'bold' }
                    });
                } else {
                    toast.success(`⏸️ Đã tạm dừng: ${category.name}`, {
                        duration: 3000,
                        style: { background: '#F59E0B', color: '#fff', fontWeight: 'bold' }
                    });
                }
            // FIX 1c: Sửa 'catch (error: any)'
            } catch (error: unknown) {
                let message = 'Lỗi không xác định';
                if (error instanceof Error) message = error.message;
                console.error('❌ Error toggling status:', error);
                toast.error(`❌ Lỗi: ${message}`, { duration: 3000 });
            }
        }
    };

    // Delete category
    const handleDelete = async () => {
        if (!category) return;

        if (confirm(
            `🗑️ XÓA VĨNH VIỄN danh mục "${category.name}"?\n\n` +
            `⚠️ CẢNH BÁO:\n` +
            `- Danh mục sẽ bị xóa VĨNH VIỄN khỏi database\n` +
            `- KHÔNG THỂ KHÔI PHỤC\n` +
            `- Chỉ xóa được khi:\n` +
            `  + KHÔNG CÒN danh mục con nào\n` +
            `  + KHÔNG CÒN sản phẩm nào\n\n` +
            `Bạn có chắc chắn?`
        )) {
            try {
                const response = await fetch(`http://localhost:3000/api/categories/${categoryId}`, {
                    method: 'DELETE'
                });

                const responseText = await response.text();
                let result;
                try {
                    result = responseText ? JSON.parse(responseText) : {};
                } catch {
                    result = { message: responseText || 'Phản hồi không hợp lệ' };
                }

                if (!response.ok) {
                    throw new Error(result.message || `HTTP error! status: ${response.status}`);
                }

                toast.success(
                    result.message || `Đã xóa vĩnh viễn danh mục "${category.name}" khỏi hệ thống`,
                    {
                        duration: 5000,
                        style: { background: '#DC2626', color: '#fff', fontWeight: 'bold' }
                    }
                );

                router.push('/categories');
            // FIX 1c: Sửa 'catch (error: any)'
            } catch (error: unknown) {
                let message = 'Lỗi không xác định';
                if (error instanceof Error) message = error.message;

                console.error('❌ Error deleting category:', error);
                toast.error(message, {
                    duration: 6000,
                    icon: '🚫',
                });
            }
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải thông tin danh mục...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !category) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <XCircle className="w-12 h-12 mx-auto mb-2" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
                    <p className="text-gray-500 mb-4">{error || 'Không tìm thấy danh mục'}</p>
                    <button
                        onClick={() => router.push('/categories')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 lg:p-8">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.push('/categories')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Quay lại danh sách</span>
                    </button>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                                Chi Tiết Danh Mục
                            </h1>
                            <p className="text-gray-600">
                                Thông tin chi tiết về danh mục "{category.name}"
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleToggleStatus}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                    category.active
                                        ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                            >
                                {category.active ? (
                                    <>
                                        <XCircle className="w-5 h-5" />
                                        Tạm dừng
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Kích hoạt
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => router.push(`/categories/${categoryId}/edit`)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                <Edit className="w-5 h-5" />
                                Chỉnh sửa
                            </button>

                            <button
                                onClick={handleDelete}
                                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                    <FolderOpen className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                        category.active
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {category.active ? 'Hoạt động' : 'Tạm dừng'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                        {category.description || "Không có mô tả"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Calendar className="w-4 h-4 inline mr-1" />
                                            Ngày tạo
                                        </label>
                                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                            {new Date(category.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            <Clock className="w-4 h-4 inline mr-1" />
                                            Cập nhật lần cuối
                                        </label>
                                        <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                                            {new Date(category.updatedAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Sidebar */}
                    <div className="space-y-6">
                        {/* Statistics */}
                        <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Thống kê</h3>

                            <div className="space-y-4">
                                {/* SubCategories */}
                                <div className="border-l-4 border-blue-500 pl-4">
                                    <p className="text-sm text-gray-600 mb-1">Danh mục con</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalSubCategories}</p>
                                    <p className="text-xs text-gray-500">
                                        {stats.activeSubCategories} đang hoạt động
                                    </p>
                                </div>

                                {/* Products */}
                                <div className="border-l-4 border-green-500 pl-4">
                                    <p className="text-sm text-gray-600 mb-1">Sản phẩm</p>
                                    <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                                    <p className="text-xs text-gray-500">
                                        {stats.activeProducts} đang hoạt động
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Thao tác nhanh</h3>

                            <div className="space-y-2">
                                <button
                                    onClick={() => router.push(`/subcategories?category=${categoryId}`)}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 border border-gray-300 transition-colors"
                                >
                                    <p className="font-medium text-gray-900">Xem danh mục con</p>
                                    <p className="text-sm text-gray-500">Quản lý {stats.totalSubCategories} danh mục con</p>
                                </button>

                                <button
                                    onClick={() => router.push(`/products?category=${categoryId}`)}
                                    className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-50 border border-gray-300 transition-colors"
                                >
                                    <p className="font-medium text-gray-900">Xem sản phẩm</p>
                                    <p className="text-sm text-gray-500">Quản lý {stats.totalProducts} sản phẩm</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
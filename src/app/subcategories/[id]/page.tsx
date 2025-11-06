"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
    ArrowLeft, 
    Edit, 
    Trash2, 
    Folder, 
    Calendar, 
    Clock,
    Package,
    AlertCircle,
    CheckCircle,
    XCircle,
    Loader2,
    Eye,
    EyeOff
} from "lucide-react";
import toast from 'react-hot-toast';

interface SubCategory {
    _id: string;
    name: string;
    categoryId: string;
    categoryName: string;
    isActive: boolean | string;
    createdAt: string;
    updatedAt: string;
}

interface Product {
    _id: string;
    name: string;
    price: number;
    stock: number;
    isActive: boolean | string;
    imageUrl?: string;
}

export default function SubCategoryDetailPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    
    const [subcategory, setSubcategory] = useState<SubCategory | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [deleting, setDeleting] = useState(false);

    // Fetch subcategory details
    useEffect(() => {
        const fetchSubcategory = async () => {
            try {
                setLoading(true);
                console.log('📥 Fetching subcategory:', id);
                
                const response = await fetch(`http://localhost:3000/api/subcategories/${id}`);
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Không thể tải thông tin danh mục con');
                }
                
                const data = await response.json();
                console.log('✅ Fetched subcategory:', data);
                
                setSubcategory(data);
            } catch (error) {
                console.error('❌ Error fetching subcategory:', error);
                toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi', {
                    icon: '❌',
                });
                router.push('/subcategories');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchSubcategory();
        }
    }, [id, router]);

    // Fetch products in this subcategory
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setProductsLoading(true);
                console.log('📥 Fetching products for subcategory:', id);
                
                const response = await fetch(`http://localhost:3000/api/subcategories/${id}/products`);
                
                if (!response.ok) {
                    throw new Error('Không thể tải danh sách sản phẩm');
                }
                
                const data = await response.json();
                console.log('✅ Fetched products:', data);
                
                setProducts(data.products || []);
            } catch (error) {
                console.error('❌ Error fetching products:', error);
                toast.error('Không thể tải danh sách sản phẩm', {
                    icon: '❌',
                });
            } finally {
                setProductsLoading(false);
            }
        };

        if (id) {
            fetchProducts();
        }
    }, [id]);

    // Toggle subcategory status
    const handleToggleStatus = async () => {
        if (!subcategory) return;

        try {
            setToggling(true);
            console.log('🔄 Toggling subcategory status:', id);

            const response = await fetch(`http://localhost:3000/api/subcategories/${id}/toggle-status`, {
                method: 'PATCH',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi thay đổi trạng thái');
            }

            const updatedSubcategory = await response.json();
            console.log('✅ Status toggled:', updatedSubcategory);

            setSubcategory(updatedSubcategory);

            const newStatus = updatedSubcategory.isActive === true || updatedSubcategory.isActive === 'true';
            
            toast.success(
                newStatus 
                    ? `Đã kích hoạt danh mục con "${subcategory.name}"` 
                    : `Đã vô hiệu hóa danh mục con "${subcategory.name}"`,
                {
                    icon: newStatus ? '✅' : '⏸️',
                    duration: 3000,
                }
            );
        } catch (error) {
            console.error('❌ Error toggling status:', error);
            toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi', {
                duration: 5000,
                icon: '❌',
            });
        } finally {
            setToggling(false);
        }
    };

    // Delete subcategory
    const handleDelete = async () => {
        if (!subcategory) return;

        const confirmed = confirm(
            `Bạn có chắc chắn muốn xóa danh mục con "${subcategory.name}"?\n\n` +
            `⚠️ Hành động này không thể hoàn tác!\n` +
            `${products.length > 0 ? `\n📦 Danh mục này có ${products.length} sản phẩm.` : ''}`
        );

        if (!confirmed) return;

        try {
            setDeleting(true);
            console.log('🗑️ Deleting subcategory:', id);

            const response = await fetch(`http://localhost:3000/api/subcategories/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi xóa danh mục con');
            }

            const result = await response.json();
            console.log('✅ Deleted:', result);

            toast.success(`Đã xóa danh mục con "${subcategory.name}"`, {
                icon: '🗑️',
                duration: 3000,
            });

            setTimeout(() => {
                router.push('/subcategories');
            }, 1000);
        } catch (error) {
            console.error('❌ Error deleting subcategory:', error);
            toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi', {
                duration: 5000,
                icon: '❌',
            });
        } finally {
            setDeleting(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Đang tải thông tin danh mục con...</p>
                </div>
            </div>
        );
    }

    // Not found
    if (!subcategory) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy danh mục con</h2>
                    <p className="text-gray-600 mb-6">Danh mục con này không tồn tại hoặc đã bị xóa</p>
                    <button
                        onClick={() => router.push('/subcategories')}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    const isActive = subcategory.isActive === true || subcategory.isActive === 'true';
    const activeProducts = products.filter(p => p.isActive === true || p.isActive === 'true');
    const inactiveProducts = products.filter(p => p.isActive === false || p.isActive === 'false');

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Quay lại
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Chi tiết danh mục con</h1>
                            <p className="text-gray-600 mt-1">Xem và quản lý thông tin danh mục con</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Folder className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">{subcategory.name}</h2>
                                        <p className="text-gray-600 mt-1">
                                            Thuộc danh mục: <span className="font-medium">{subcategory.categoryName}</span>
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${
                                    isActive 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                }`}>
                                    {isActive ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Hoạt động
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-4 h-4" />
                                            Không hoạt động
                                        </>
                                    )}
                                </span>
                            </div>

                            {/* Timestamps */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <div>
                                        <p className="text-xs text-gray-500">Ngày tạo</p>
                                        <p className="text-sm font-medium">
                                            {new Date(subcategory.createdAt).toLocaleDateString('vi-VN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <div>
                                        <p className="text-xs text-gray-500">Cập nhật lần cuối</p>
                                        <p className="text-sm font-medium">
                                            {new Date(subcategory.updatedAt).toLocaleDateString('vi-VN', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Products List */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Package className="w-5 h-5 text-gray-600" />
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Sản phẩm ({products.length})
                                    </h3>
                                </div>
                                {products.length > 0 && (
                                    <div className="flex gap-2 text-sm">
                                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                                            <Eye className="w-3 h-3" />
                                            {activeProducts.length} Hoạt động
                                        </span>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full flex items-center gap-1">
                                            <EyeOff className="w-3 h-3" />
                                            {inactiveProducts.length} Tạm dừng
                                        </span>
                                    </div>
                                )}
                            </div>

                            {productsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                                </div>
                            ) : products.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">Chưa có sản phẩm nào trong danh mục này</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {products.map(product => {
                                        const productActive = product.isActive === true || product.isActive === 'true';
                                        return (
                                            <div
                                                key={product._id}
                                                className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                            >
                                                {product.imageUrl ? (
                                                    <img
                                                        src={product.imageUrl}
                                                        alt={product.name}
                                                        className="w-16 h-16 object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                                        <Package className="w-8 h-8 text-gray-400" />
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                                                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                                        <span>Giá: {product.price.toLocaleString('vi-VN')}đ</span>
                                                        <span>Kho: {product.stock}</span>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    productActive 
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {productActive ? 'Hoạt động' : 'Tạm dừng'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Sidebar */}
                    <div className="space-y-6">
                        {/* Actions Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành động</h3>
                            <div className="space-y-3">
                                {/* Edit */}
                                <button
                                    onClick={() => router.push(`/subcategories/edit/${id}`)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                    Chỉnh sửa
                                </button>

                                {/* Toggle Status */}
                                <button
                                    onClick={handleToggleStatus}
                                    disabled={toggling}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                                        isActive
                                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                                            : 'bg-green-600 hover:bg-green-700 text-white'
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {toggling ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : isActive ? (
                                        <>
                                            <XCircle className="w-4 h-4" />
                                            Vô hiệu hóa
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Kích hoạt
                                        </>
                                    )}
                                </button>

                                {/* Delete */}
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {deleting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Đang xóa...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4" />
                                            Xóa danh mục con
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-600">Tổng sản phẩm</span>
                                        <span className="font-semibold text-gray-900">{products.length}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-blue-600 transition-all"
                                            style={{ width: `${products.length > 0 ? 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-600">Đang hoạt động</span>
                                        <span className="font-semibold text-green-600">{activeProducts.length}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-green-600 transition-all"
                                            style={{ width: `${products.length > 0 ? (activeProducts.length / products.length) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-gray-600">Tạm dừng</span>
                                        <span className="font-semibold text-gray-600">{inactiveProducts.length}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-gray-600 transition-all"
                                            style={{ width: `${products.length > 0 ? (inactiveProducts.length / products.length) * 100 : 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Warning Card (if has active products) */}
                        {activeProducts.length > 0 && isActive && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium text-amber-900 mb-1">Lưu ý</h4>
                                        <p className="text-sm text-amber-800">
                                            Danh mục này có <strong>{activeProducts.length} sản phẩm đang hoạt động</strong>. 
                                            Vô hiệu hóa danh mục sẽ yêu cầu vô hiệu hóa hoặc chuyển tất cả sản phẩm trước.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
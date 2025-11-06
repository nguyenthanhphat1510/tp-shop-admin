"use client";
import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus, Search, Filter, X, FolderOpen } from "lucide-react";
import { Eye } from "lucide-react"; // Thêm icon
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';

interface Category {
    _id: string;
    name: string;
    description: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function CategoryManagement() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState("table");
    const [categoryList, setCategoryList] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: "",
        sortBy: "name"
    });

    // Fetch categories từ API
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                console.log('🔍 Fetching categories...');

                const response = await fetch('http://localhost:3000/api/categories');

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log('✅ Categories data received:', data);

                const transformedData = data.map((category: any) => ({
                    _id: category._id,
                    name: category.name,
                    description: category.description || "",
                    active: category.isActive === "true" || category.isActive === true,
                    createdAt: category.createdAt,
                    updatedAt: category.updatedAt
                }));

                setCategoryList(transformedData);
                setError(null);
            } catch (err) {
                console.error('❌ Error fetching categories:', err);
                setError('Không thể tải danh sách danh mục');
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    // Filter categories
    const filtered = categoryList.filter((category) => {
        const matchesSearch = !search ||
            category.name?.toLowerCase().includes(search.toLowerCase()) ||
            category.description?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = !filters.status ||
            (filters.status === "active" && category.active) ||
            (filters.status === "inactive" && !category.active);

        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        switch (filters.sortBy) {
            case "name":
                return a.name.localeCompare(b.name);
            case "createdAt":
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case "updatedAt":
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            default:
                return 0;
        }
    });

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            status: "",
            sortBy: "name"
        });
        setSearch("");
    };

    const hasActiveFilters = search || filters.status !== "" || filters.sortBy !== "name";

    // ✅ TOGGLE STATUS - CÓ CONFIRM
    const toggleActive = async (categoryId: string, categoryName: string, currentStatus: boolean) => {
        const action = currentStatus ? 'TẠM DỪNG' : 'KÍCH HOẠT';
        const newStatusText = currentStatus ? 'Tạm dừng' : 'Hoạt động';
        const currentStatusText = currentStatus ? 'Hoạt động' : 'Tạm dừng';

        if (confirm(
            `⚠️ ${action} danh mục "${categoryName}"?\n\n` +
            `Trạng thái sẽ chuyển từ "${currentStatusText}" sang "${newStatusText}"\n\n` +
            `Bạn có chắc chắn?`
        )) {
            try {
                console.log(`🔄 Toggling status for category: ${categoryId}`);

                const response = await fetch(`http://localhost:3000/api/categories/${categoryId}/toggle-status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Lỗi cập nhật trạng thái');
                }

                const result = await response.json();
                console.log('✅ Toggle response:', result);

                const newStatus = result.isActive === "true" || result.isActive === true;

                // ✅ CẬP NHẬT STATE
                setCategoryList(prev => prev.map(category =>
                    category._id === categoryId
                        ? { ...category, active: newStatus }
                        : category
                ));

                // ✅ TOAST SUCCESS
                if (newStatus) {
                    toast.success(`✅ Đã kích hoạt: ${categoryName}`, {
                        duration: 3000,
                        style: { background: '#10B981', color: '#fff', fontWeight: 'bold' }
                    });
                } else {
                    toast.success(`⏸️ Đã tạm dừng: ${categoryName}`, {
                        duration: 3000,
                        style: { background: '#F59E0B', color: '#fff', fontWeight: 'bold' }
                    });
                }

            } catch (error) {
                console.error('❌ Error updating category status:', error);

                // ✅ HIỂN THỊ LỖI RÀNG BUỘC
                if (error.message.includes('danh mục con')) {
                    toast.error(error.message, {
                        duration: 6000,
                        style: {
                            borderRadius: '10px',
                            background: '#EF4444',
                            color: '#fff',
                            fontWeight: 'bold',
                            maxWidth: '500px'
                        },
                        icon: '🚫',
                    });
                } else if (error.message.includes('sản phẩm')) {
                    toast.error(error.message, {
                        duration: 6000,
                        style: {
                            borderRadius: '10px',
                            background: '#EF4444',
                            color: '#fff',
                            fontWeight: 'bold',
                            maxWidth: '500px'
                        },
                        icon: '🚫',
                    });
                } else {
                    toast.error(`❌ Lỗi: ${error.message}`, { duration: 3000 });
                }
            }
        }
    };

    // ✅ HARD DELETE - CÓ CONFIRM
    const handleDelete = async (categoryId: string, categoryName: string) => {
        if (confirm(
            `🗑️ XÓA VĨNH VIỄN danh mục "${categoryName}"?\n\n` +
            `⚠️ CẢNH BÁO:\n` +
            `- Danh mục sẽ bị xóa VĨNH VIỄN khỏi database\n` +
            `- KHÔNG THỂ KHÔI PHỤC\n` +
            `- Chỉ xóa được khi:\n` +
            `  + KHÔNG CÒN danh mục con nào\n` +
            `  + KHÔNG CÒN sản phẩm nào\n\n` +
            `Bạn có chắc chắn?`
        )) {
            try {
                console.log(`🗑️ Hard deleting category: ${categoryId}`);

                const response = await fetch(`http://localhost:3000/api/categories/${categoryId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Lỗi xóa danh mục');
                }

                const result = await response.json();

                // ✅ XÓA KHỎI LIST
                setCategoryList(prev => prev.filter(cat => cat._id !== categoryId));

                // ✅ TOAST SUCCESS
                toast.success(
                    `🗑️ ${result.message}`,
                    {
                        duration: 5000,
                        style: { background: '#DC2626', color: '#fff', fontWeight: 'bold' }
                    }
                );

            } catch (error) {
                console.error('❌ Error deleting category:', error);

                // ✅ HIỂN THỊ LỖI RÀNG BUỘC
                if (error.message.includes('danh mục con')) {
                    toast.error(error.message, {
                        duration: 6000,
                        style: {
                            borderRadius: '10px',
                            background: '#EF4444',
                            color: '#fff',
                            fontWeight: 'bold',
                            maxWidth: '500px',
                            padding: '16px'
                        },
                        icon: '🚫',
                    });
                } else if (error.message.includes('sản phẩm')) {
                    toast.error(error.message, {
                        duration: 6000,
                        style: {
                            borderRadius: '10px',
                            background: '#EF4444',
                            color: '#fff',
                            fontWeight: 'bold',
                            maxWidth: '500px',
                            padding: '16px'
                        },
                        icon: '🚫',
                    });
                } else {
                    toast.error(`❌ Lỗi: ${error.message}`, {
                        duration: 4000,
                        style: { borderRadius: '10px', background: '#EF4444', color: '#fff', fontWeight: 'bold' }
                    });
                }
            }
        }
    };

    const ToggleSwitch = ({ isActive, onToggle, disabled = false }) => (
        <button
            onClick={onToggle}
            disabled={disabled}
            className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                ${isActive ? 'bg-green-500' : 'bg-gray-300'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            <span
                className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out
                    ${isActive ? 'translate-x-6' : 'translate-x-1'}
                `}
            />
        </button>
    );

    const ActionButton = ({ onClick, variant = "primary", size = "sm", children, disabled = false }) => {
        const baseClasses = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

        const variants = {
            primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm hover:shadow-md",
            success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-sm hover:shadow-md",
            danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm hover:shadow-md",
            secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500 border border-gray-300",
            outline: "border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
            warning: "bg-orange-400 hover:bg-orange-500 text-white focus:ring-orange-400 shadow-sm hover:shadow-md" // ✅ Màu vàng cam dịu nhẹ
        };

        const sizes = {
            sm: "px-3 py-2 text-sm",
            md: "px-4 py-2.5 text-sm",
            lg: "px-6 py-3 text-base"
        };

        return (
            <button
                onClick={onClick}
                disabled={disabled}
                className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
            >
                {children}
            </button>
        );
    };

    const CategoryCard = ({ category }) => (
        <div className={`bg-white rounded-lg shadow-sm border-2 border-gray-300 hover:shadow-md hover:border-gray-400 transition-all duration-200 overflow-hidden ${!category.active ? 'opacity-75' : ''}`}>
            <div className="p-6">
                <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <FolderOpen className="w-8 h-8 text-blue-600" />
                    </div>
                </div>

                <div className="mb-4 text-center">
                    <h3 className="font-medium text-gray-900 mb-2 text-lg">{category.name}</h3>
                    {category.description && (
                        <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                    )}
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="text-sm text-gray-500">Trạng thái:</span>
                        <ToggleSwitch
                            isActive={category.active}
                            onToggle={() => toggleActive(category._id, category.name, category.active)}
                        />
                        <span className={`text-sm font-medium ${category.active ? 'text-green-600' : 'text-gray-500'}`}>
                            {category.active ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="text-sm text-gray-500">
                        Tạo: {new Date(category.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-sm text-gray-500">
                        Cập nhật: {new Date(category.updatedAt).toLocaleDateString('vi-VN')}
                    </div>
                </div>

                <div className="flex gap-2">

                    <ActionButton
                        variant="warning"
                        size="sm"
                        onClick={() => handleEdit(category._id)}
                    >
                        <Edit className="w-4 h-4" />
                        Sửa
                    </ActionButton>
                    <ActionButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(category._id, category.name)}
                    >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                    </ActionButton>
                </div>
            </div>
        </div>
    );

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải danh mục...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <Search className="w-12 h-12 mx-auto mb-2" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
                    <p className="text-gray-500 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const handleEdit = (categoryId: string) => {
        router.push(`/categories/${categoryId}/edit`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                                Quản Lý Danh Mục
                            </h1>
                            <p className="text-gray-600">
                                Quản lý danh sách danh mục sản phẩm ({categoryList.length} danh mục)
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/categories/add')}
                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            Thêm danh mục
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        <div className="relative flex-1 max-w-md">
                            <input
                                className="w-full border-2 border-black text-black rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-black focus:border-black outline-none transition-colors"
                                placeholder="Tìm kiếm danh mục..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3.5 w-5 h-5 text-black" />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-3 border-2 rounded-lg transition-colors ${showFilters || hasActiveFilters
                                        ? "border-black bg-black text-white"
                                        : "border-black text-black hover:bg-gray-100"
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
                                <span className="hidden sm:inline">Lọc</span>
                                {hasActiveFilters && (
                                    <span className="bg-white text-black text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {Object.values(filters).filter(f => f !== "" && f !== "name").length + (search ? 1 : 0)}
                                    </span>
                                )}
                            </button>

                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-2 px-4 py-3 border-2 border-red-400 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-500 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                    <span className="hidden sm:inline">Xóa lọc</span>
                                </button>
                            )}

                            <div className="hidden md:flex bg-gray-100 rounded-lg p-1 border-2 border-gray-300">
                                <button
                                    onClick={() => setViewMode("table")}
                                    className={`px-3 py-2 text-sm rounded-md transition-colors ${viewMode === "table"
                                            ? "bg-white text-gray-900 shadow-sm border border-gray-300"
                                            : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    Bảng
                                </button>
                                <button
                                    onClick={() => setViewMode("card")}
                                    className={`px-3 py-2 text-sm rounded-md transition-colors ${viewMode === "card"
                                            ? "bg-white text-gray-900 shadow-sm border border-gray-300"
                                            : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    Thẻ
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filter Panel */}
                    {showFilters && (
                        <div className="mt-4 p-4 bg-white rounded-lg border-2 border-gray-300 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full border-2 border-black text-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="active">Hoạt động</option>
                                        <option value="inactive">Tạm dừng</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sắp xếp theo</label>
                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                        className="w-full border-2 border-black text-black rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-black focus:border-black"
                                    >
                                        <option value="name">Tên A-Z</option>
                                        <option value="createdAt">Mới nhất</option>
                                        <option value="updatedAt">Cập nhật gần đây</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <FolderOpen className="w-12 h-12 mx-auto mb-4" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Không tìm thấy danh mục
                        </h3>
                        <p className="text-gray-500">
                            Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="md:hidden">
                            <div className="grid gap-4">
                                {filtered.map((category) => (
                                    <CategoryCard key={category._id} category={category} />
                                ))}
                            </div>
                        </div>

                        <div className="hidden md:block">
                            {viewMode === "card" ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filtered.map((category) => (
                                        <CategoryCard key={category._id} category={category} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-300">
                                                <tr>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Tên danh mục</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Mô tả</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Trạng thái</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Ngày tạo</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y-2 divide-gray-200">
                                                {filtered.map((category) => (
                                                    <tr key={category._id} className={`hover:bg-gray-50 transition-colors ${!category.active ? 'opacity-60' : ''}`}>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                                    <FolderOpen className="w-5 h-5 text-blue-600" />
                                                                </div>
                                                                <div className="font-medium text-gray-900">{category.name}</div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <div className="text-sm text-gray-600 max-w-xs truncate">
                                                                {category.description || "Không có mô tả"}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <div className="flex items-center gap-3">
                                                                <ToggleSwitch
                                                                    isActive={category.active}
                                                                    onToggle={() => toggleActive(category._id, category.name, category.active)}
                                                                />
                                                                <span className={`text-sm font-medium ${category.active ? 'text-green-600' : 'text-gray-500'}`}>
                                                                    {category.active ? 'Hoạt động' : 'Tạm dừng'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <div className="text-sm text-gray-500">
                                                                {new Date(category.createdAt).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex gap-2">
                                                                <ActionButton
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    onClick={() => router.push(`/categories/${category._id}`)}
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    Xem
                                                                </ActionButton>
                                                                <ActionButton
                                                                    variant="warning"
                                                                    size="sm"
                                                                    onClick={() => handleEdit(category._id)}
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                    Sửa
                                                                </ActionButton>
                                                                <ActionButton
                                                                    variant="danger"
                                                                    size="sm"
                                                                    onClick={() => handleDelete(category._id, category.name)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                    Xóa
                                                                </ActionButton>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {filtered.length > 0 && (
                    <div className="mt-6 text-center text-sm text-gray-500">
                        Hiển thị {filtered.length} / {categoryList.length} danh mục
                        {search && ` cho "${search}"`}
                        {hasActiveFilters && " (đã  )"}
                    </div>
                )}
            </div>
        </div>
    );
}
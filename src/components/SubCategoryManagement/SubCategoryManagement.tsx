"use client";
import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus, Search, Filter, X, Folder, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';

export default function SubCategoryManagement() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState("table");
    const [subCategoryList, setSubCategoryList] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: "",
        category: "",
        sortBy: "name",
    });

    // Pagination
    const PAGE_SIZES = [5];
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const subRes = await fetch('http://localhost:3000/api/subcategories');
                if (!subRes.ok) throw new Error(`HTTP error! status: ${subRes.status}`);
                const subData = await subRes.json();

                const catRes = await fetch('http://localhost:3000/api/categories');
                if (!catRes.ok) throw new Error(`HTTP error! status: ${catRes.status}`);
                const catData = await catRes.json();

                const transformedSub = subData.map((subCategory) => ({
                    _id: subCategory._id,
                    name: subCategory.name,
                    categoryId: subCategory.categoryId,
                    categoryName: subCategory.categoryName || "Không xác định",
                    active: subCategory.isActive === "true" || subCategory.isActive === true,
                    createdAt: subCategory.createdAt,
                    updatedAt: subCategory.updatedAt,
                }));

                const transformedCats = catData.map((category) => ({
                    _id: category._id,
                    name: category.name,
                    active: category.isActive === "true" || category.isActive === true,
                }));

                setSubCategoryList(transformedSub);
                setCategoryList(transformedCats);
                setError(null);
            } catch (err) {
                console.error('❌ Error fetching data:', err);
                setError('Không thể tải danh sách danh mục con');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filter
    const filtered = subCategoryList
        .filter((subCategory) => {
            const matchesSearch =
                !search ||
                subCategory.name?.toLowerCase().includes(search.toLowerCase()) ||
                subCategory.categoryName?.toLowerCase().includes(search.toLowerCase());

            const matchesStatus =
                !filters.status ||
                (filters.status === "active" && subCategory.active) ||
                (filters.status === "inactive" && !subCategory.active);

            const matchesCategory =
                !filters.category || subCategory.categoryId === filters.category;

            return matchesSearch && matchesStatus && matchesCategory;
        })
        .sort((a, b) => {
            switch (filters.sortBy) {
                case "name":
                    return a.name.localeCompare(b.name);
                case "createdAt":
                    return new Date(b.createdAt) - new Date(a.createdAt);
                case "updatedAt":
                    return new Date(b.updatedAt) - new Date(a.updatedAt);
                default:
                    return 0;
            }
        });

    // Reset page khi đổi filter/search
    useEffect(() => {
        setPage(1);
    }, [search, filters]);

    // Pagination
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalItems);
    const paginated = filtered.slice(startIdx, endIdx);

    // Clear filters
    const clearFilters = () => {
        setFilters({ status: "", category: "", sortBy: "name" });
        setSearch("");
    };

    const hasActiveFilters =
        !!search ||
        filters.status !== "" ||
        filters.category !== "" ||
        filters.sortBy !== "name";

    // ✅ TOGGLE STATUS - CÓ CONFIRM
    const toggleActive = async (subCategoryId, subCategoryName, currentStatus) => {
        const action = currentStatus ? 'TẠM DỪNG' : 'KÍCH HOẠT';
        const newStatusText = currentStatus ? 'Tạm dừng' : 'Hoạt động';
        const currentStatusText = currentStatus ? 'Hoạt động' : 'Tạm dừng';

        if (confirm(
            `⚠️ ${action} danh mục con "${subCategoryName}"?\n\n` +
            `Trạng thái sẽ chuyển từ "${currentStatusText}" sang "${newStatusText}"\n\n` +
            `Bạn có chắc chắn?`
        )) {
            try {
                console.log(`🔄 Toggling status for subcategory: ${subCategoryId}`);

                const response = await fetch(`http://localhost:3000/api/subcategories/${subCategoryId}/toggle-status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });

                console.log('Response status:', response.status);

                // ✅ PARSE JSON AN TOÀN
                const responseText = await response.text();
                console.log('Response text:', responseText);

                let result;
                try {
                    result = responseText ? JSON.parse(responseText) : {};
                } catch (jsonError) {
                    console.error('JSON parse error:', jsonError);
                    result = { message: responseText || 'Phản hồi không hợp lệ' };
                }

                if (!response.ok) {
                    throw new Error(result.message || `HTTP error! status: ${response.status}`);
                }

                console.log('✅ Toggle response:', result);

                const newStatus = result.isActive === "true" || result.isActive === true;

                // ✅ CẬP NHẬT STATE
                setSubCategoryList(prev => prev.map(sc =>
                    sc._id === subCategoryId
                        ? { ...sc, active: newStatus }
                        : sc
                ));

                // ✅ TOAST SUCCESS
                if (newStatus) {
                    toast.success(`✅ Đã kích hoạt: ${subCategoryName}`, {
                        duration: 3000,
                        style: { background: '#10B981', color: '#fff', fontWeight: 'bold' }
                    });
                } else {
                    toast.success(`⏸️ Đã tạm dừng: ${subCategoryName}`, {
                        duration: 3000,
                        style: { background: '#F59E0B', color: '#fff', fontWeight: 'bold' }
                    });
                }

            } catch (error) {
                console.error('❌ Error updating subcategory status:', error);

                // ✅ HIỂN THỊ LỖI RÀNG BUỘC
                if (error.message.includes('sản phẩm đang hoạt động')) {
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
    const handleDelete = async (subCategoryId, subCategoryName) => {
        if (confirm(
            `🗑️ XÓA VĨNH VIỄN danh mục con "${subCategoryName}"?\n\n` +
            `⚠️ CẢNH BÁO:\n` +
            `- Danh mục con sẽ bị xóa VĨNH VIỄN khỏi database\n` +
            `- KHÔNG THỂ KHÔI PHỤC\n` +
            `- Chỉ xóa được khi KHÔNG CÒN sản phẩm nào\n\n` +
            `Bạn có chắc chắn?`
        )) {
            try {
                console.log(`🗑️ Hard deleting subcategory: ${subCategoryId}`);

                const response = await fetch(`http://localhost:3000/api/subcategories/${subCategoryId}`, {
                    method: 'DELETE'
                });

                console.log('Response status:', response.status);

                // ✅ PARSE JSON AN TOÀN
                const responseText = await response.text();
                console.log('Response text:', responseText);

                let result;
                try {
                    result = responseText ? JSON.parse(responseText) : {};
                } catch (jsonError) {
                    console.error('JSON parse error:', jsonError);
                    result = { message: responseText || 'Phản hồi không hợp lệ' };
                }

                if (!response.ok) {
                    throw new Error(result.message || `HTTP error! status: ${response.status}`);
                }

                // ✅ XÓA KHỎI LIST
                setSubCategoryList(prev => prev.filter(sc => sc._id !== subCategoryId));

                // ✅ TOAST SUCCESS
                toast.success(
                    result.message || `Đã xóa vĩnh viễn danh mục con "${subCategoryName}" khỏi hệ thống`,
                    {
                        duration: 5000,
                        style: { background: '#DC2626', color: '#fff', fontWeight: 'bold' }
                    }
                );

            } catch (error) {
                console.error('❌ Error deleting subcategory:', error);

                // ✅ HIỂN THỊ LỖI RÀNG BUỘC
                if (error.message.includes('sản phẩm')) {
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
        const baseClasses =
            "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

        const variants = {
            primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm hover:shadow-md",
            success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-sm hover:shadow-md",
            danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm hover:shadow-md",
            secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500 border border-gray-300",
            outline: "border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
            warning: "bg-orange-400 hover:bg-orange-500 text-white focus:ring-orange-400 shadow-sm hover:shadow-md"
        };

        const sizes = {
            sm: "px-3 py-2 text-sm",
            md: "px-4 py-2.5 text-sm",
            lg: "px-6 py-3 text-base"
        };

        return (
            <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}>
                {children}
            </button>
        );
    };

    const SubCategoryCard = ({ subCategory }) => (
        <div className={`bg-white rounded-lg shadow-sm border-2 border-gray-300 hover:shadow-md hover:border-gray-400 transition-all duration-200 overflow-hidden ${!subCategory.active ? 'opacity-75' : ''}`}>
            <div className="p-6">
                <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <Folder className="w-8 h-8 text-gray-700" />
                    </div>
                </div>

                <div className="mb-4 text-center">
                    <h3 className="font-medium text-gray-900 mb-2 text-lg">{subCategory.name}</h3>
                    <p className="text-sm text-gray-700 mb-3">
                        Danh mục: <span className="font-medium">{subCategory.categoryName}</span>
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="text-sm text-gray-700">Trạng thái:</span>
                        <ToggleSwitch 
                            isActive={subCategory.active} 
                            onToggle={() => toggleActive(subCategory._id, subCategory.name, subCategory.active)} 
                        />
                        <span className={`text-sm font-medium ${subCategory.active ? 'text-green-600' : 'text-gray-500'}`}>
                            {subCategory.active ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="text-sm text-gray-700">
                        Tạo: {new Date(subCategory.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-sm text-gray-700">
                        Cập nhật: {new Date(subCategory.updatedAt).toLocaleDateString('vi-VN')}
                    </div>
                </div>

                <div className="flex gap-2">
                    <ActionButton 
                        variant="warning" 
                        size="sm" 
                        onClick={() => router.push(`/subcategories/${subCategory._id}`)}
                    >
                        <Eye className="w-4 h-4" />
                        Xem
                    </ActionButton>
                    <ActionButton 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => handleEdit(subCategory._id)}
                    >
                        <Edit className="w-4 h-4" />
                        Sửa
                    </ActionButton>
                    <ActionButton 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDelete(subCategory._id, subCategory.name)}
                    >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                    </ActionButton>
                </div>
            </div>
        </div>
    );

    // Loading
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-700">Đang tải danh mục con...</p>
                </div>
            </div>
        );
    }

    // Error
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <Search className="w-12 h-12 mx-auto mb-2" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải dữ liệu</h3>
                    <p className="text-gray-700 mb-4">{error}</p>
                    <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const handleEdit = (subCategoryId) => {
        router.push(`/subcategories/${subCategoryId}/edit`);
    };

    // Pagination Component
    const Pagination = () => {
        if (totalItems === 0) return null;

        const goTo = (p) => setPage(Math.max(1, Math.min(p, totalPages)));

        const getPageNumbers = () => {
            const pages = [];
            const delta = 1;

            pages.push(1);

            for (let i = safePage - delta; i <= safePage + delta; i++) {
                if (i > 1 && i < totalPages) {
                    pages.push(i);
                }
            }

            if (totalPages > 1) {
                pages.push(totalPages);
            }

            return [...new Set(pages)].sort((a, b) => a - b);
        };

        const pageNumbers = getPageNumbers();

        return (
            <div className="flex items-center justify-between border-t-2 border-gray-300 bg-white px-4 py-3 sm:px-6 rounded-lg mt-6">
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={() => goTo(safePage - 1)}
                        disabled={safePage === 1}
                        className="relative inline-flex items-center rounded-md border-2 border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Trước
                    </button>
                    <button
                        onClick={() => goTo(safePage + 1)}
                        disabled={safePage === totalPages}
                        className="relative ml-3 inline-flex items-center rounded-md border-2 border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Sau
                    </button>
                </div>

                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-700">
                            Hiển thị{' '}
                            <span className="font-medium">{totalItems ? startIdx + 1 : 0}</span>
                            {' '}-{' '}
                            <span className="font-medium">{endIdx}</span>
                            {' '}trong tổng số{' '}
                            <span className="font-medium">{totalItems}</span>
                            {' '}kết quả
                        </p>
                    </div>

                    <div>
                        <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                            <button
                                onClick={() => goTo(safePage - 1)}
                                disabled={safePage === 1}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="sr-only">Trang trước</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {pageNumbers.map((pageNum, idx) => {
                                const isActive = pageNum === safePage;
                                const prevPage = pageNumbers[idx - 1];
                                const showEllipsis = idx > 0 && pageNum - prevPage > 1;

                                return (
                                    <React.Fragment key={pageNum}>
                                        {showEllipsis && (
                                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
                                                ...
                                            </span>
                                        )}

                                        <button
                                            onClick={() => goTo(pageNum)}
                                            aria-current={isActive ? "page" : undefined}
                                            className={`
                                                relative inline-flex items-center px-4 py-2 text-sm font-semibold
                                                focus:z-20 focus:outline-offset-0
                                                ${isActive
                                                    ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                                                    : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
                                                }
                                            `}
                                        >
                                            {pageNum}
                                        </button>
                                    </React.Fragment>
                                );
                            })}

                            <button
                                onClick={() => goTo(safePage + 1)}
                                disabled={safePage === totalPages}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="sr-only">Trang sau</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Quản Lý Danh Mục Con</h1>
                            <p className="text-gray-700">Quản lý danh sách danh mục con sản phẩm ({subCategoryList.length} danh mục con)</p>
                        </div>
                        <button
                            onClick={() => router.push('/subcategories/add')}
                            className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            Thêm danh mục con
                        </button>
                    </div>

                    {/* Search & Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        <div className="relative flex-1 max-w-md">
                            <input
                                className="w-full border-2 border-gray-400 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-500"
                                placeholder="Tìm kiếm danh mục con..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-3 border-2 rounded-lg transition-colors ${showFilters || hasActiveFilters
                                        ? "border-blue-500 bg-blue-50 text-gray-900"
                                        : "border-gray-400 hover:bg-gray-50 hover:border-gray-500 text-gray-900"
                                    }`}
                            >
                                <Filter className="w-4 h-4" />
                                <span className="hidden sm:inline">Lọc</span>
                                {hasActiveFilters && (
                                    <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="active">Hoạt động</option>
                                        <option value="inactive">Tạm dừng</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    >
                                        <option value="">Tất cả danh mục</option>
                                        {categoryList.filter(cat => cat.active).map(category => (
                                            <option key={category._id} value={category._id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sắp xếp theo</label>
                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                {paginated.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <Folder className="w-12 h-12 mx-auto mb-4" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy danh mục con</h3>
                        <p className="text-gray-700">Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc</p>
                    </div>
                ) : (
                    <>
                        <div className="md:hidden">
                            <div className="grid gap-4">
                                {paginated.map((subCategory) => (
                                    <SubCategoryCard key={subCategory._id} subCategory={subCategory} />
                                ))}
                            </div>
                        </div>

                        <div className="hidden md:block">
                            {viewMode === "card" ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {paginated.map((subCategory) => (
                                        <SubCategoryCard key={subCategory._id} subCategory={subCategory} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-300">
                                                <tr>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Tên danh mục con</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Danh mục cha</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Trạng thái</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Ngày tạo</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y-2 divide-gray-200">
                                                {paginated.map((subCategory) => (
                                                    <tr key={subCategory._id} className={`hover:bg-gray-50 transition-colors ${!subCategory.active ? 'opacity-60' : ''}`}>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                                                    <Folder className="w-5 h-5 text-gray-700" />
                                                                </div>
                                                                <div className="font-medium text-gray-900">{subCategory.name}</div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <div className="text-sm text-gray-700">{subCategory.categoryName}</div>
                                                        </td>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <div className="flex items-center gap-3">
                                                                <ToggleSwitch 
                                                                    isActive={subCategory.active} 
                                                                    onToggle={() => toggleActive(subCategory._id, subCategory.name, subCategory.active)} 
                                                                />
                                                                <span className={`text-sm font-medium ${subCategory.active ? 'text-green-600' : 'text-gray-500'}`}>
                                                                    {subCategory.active ? 'Hoạt động' : 'Tạm dừng'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <div className="text-sm text-gray-700">
                                                                {new Date(subCategory.createdAt).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex gap-2">
                                                                <ActionButton 
                                                                    variant="secondary" 
                                                                    size="sm" 
                                                                    onClick={() => router.push(`/subcategories/${subCategory._id}`)}
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                    Xem
                                                                </ActionButton>
                                                                <ActionButton 
                                                                    variant="warning" 
                                                                    size="sm" 
                                                                    onClick={() => handleEdit(subCategory._id)}
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                    Sửa
                                                                </ActionButton>
                                                                <ActionButton 
                                                                    variant="danger" 
                                                                    size="sm" 
                                                                    onClick={() => handleDelete(subCategory._id, subCategory.name)}
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

                        {totalItems > 0 && <Pagination />}
                    </>
                )}
            </div>
        </div>
    );
}

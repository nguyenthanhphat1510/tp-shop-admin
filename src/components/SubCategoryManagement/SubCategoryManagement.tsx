"use client";
import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus, Search, Filter, X, Folder } from "lucide-react";
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
    
    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: "", // "active", "inactive", ""
        category: "", // filter by parent category
        sortBy: "name" // "name", "createdAt", "updatedAt"
    });
    
    // Fetch subcategories và categories từ API
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                console.log('🔍 Fetching subcategories and categories...');
                
                // Fetch subcategories
                const subCategoriesResponse = await fetch('http://localhost:3000/api/subcategories');
                if (!subCategoriesResponse.ok) {
                    throw new Error(`HTTP error! status: ${subCategoriesResponse.status}`);
                }
                const subCategoriesData = await subCategoriesResponse.json();
                
                // Fetch categories for filter dropdown
                const categoriesResponse = await fetch('http://localhost:3000/api/categories');
                if (!categoriesResponse.ok) {
                    throw new Error(`HTTP error! status: ${categoriesResponse.status}`);
                }
                const categoriesData = await categoriesResponse.json();
                
                console.log('✅ SubCategories data received:', subCategoriesData);
                console.log('✅ Categories data received:', categoriesData);
                
                // Transform subcategories data
                const transformedSubCategories = subCategoriesData.map(subCategory => ({
                    _id: subCategory._id,
                    name: subCategory.name,
                    categoryId: subCategory.categoryId,
                    categoryName: subCategory.categoryName || "Không xác định",
                    active: subCategory.isActive === "true" || subCategory.isActive === true,
                    createdAt: subCategory.createdAt,
                    updatedAt: subCategory.updatedAt
                }));
                
                // Transform categories data
                const transformedCategories = categoriesData.map(category => ({
                    _id: category._id,
                    name: category.name,
                    active: category.isActive === "true" || category.isActive === true
                }));
                
                setSubCategoryList(transformedSubCategories);
                setCategoryList(transformedCategories);
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
    
    // Filter subcategories
    const filtered = subCategoryList.filter((subCategory) => {
        // Search filter
        const matchesSearch = !search || 
            subCategory.name?.toLowerCase().includes(search.toLowerCase()) ||
            subCategory.categoryName?.toLowerCase().includes(search.toLowerCase());
        
        // Status filter
        const matchesStatus = !filters.status || 
            (filters.status === "active" && subCategory.active) ||
            (filters.status === "inactive" && !subCategory.active);
        
        // Category filter
        const matchesCategory = !filters.category || 
            subCategory.categoryId === filters.category;
        
        return matchesSearch && matchesStatus && matchesCategory;
    }).sort((a, b) => {
        // Sort logic
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

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            status: "",
            category: "",
            sortBy: "name"
        });
        setSearch("");
    };

    // Check if any filters are active
    const hasActiveFilters = search || filters.status !== "" || filters.category !== "" || filters.sortBy !== "name";

    // Toggle subcategory status
    const toggleActive = async (subCategoryId) => {
        try {
            console.log(`🔄 Toggling status for subcategory: ${subCategoryId}`);
            
            const response = await fetch(`http://localhost:3000/api/subcategories/${subCategoryId}/toggle-status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Lỗi cập nhật trạng thái');
            }

            const result = await response.json();
            console.log('✅ Toggle response:', result);

            // Update UI với trạng thái mới từ server
            setSubCategoryList(prev => prev.map(subCategory => 
                subCategory._id === subCategoryId 
                    ? { ...subCategory, active: result.isActive }
                    : subCategory
            ));

            // Show appropriate toast
            if (result.isActive) {
                toast.success('Danh mục con đã được kích hoạt', {
                    duration: 2000,
                    icon: '✅',
                });
            } else {
                toast('Danh mục con đã được tạm dừng', {
                    icon: '⚠️',
                    style: {
                        borderRadius: '10px',
                        background: '#F59E0B',
                        color: '#fff',
                        fontWeight: 'bold',
                    },
                    duration: 3000,
                });
            }
            
        } catch (error) {
            console.error('❌ Error updating subcategory status:', error);
            toast.error(`Lỗi: ${error.message}`);
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
            outline: "border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 focus:ring-gray-500"
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

    // SubCategory Card component
    const SubCategoryCard = ({ subCategory }) => (
        <div className={`bg-white rounded-lg shadow-sm border-2 border-gray-300 hover:shadow-md hover:border-gray-400 transition-all duration-200 overflow-hidden ${!subCategory.active ? 'opacity-75' : ''}`}>
            <div className="p-6">
                {/* Icon section */}
                <div className="mb-4 flex justify-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <Folder className="w-8 h-8 text-purple-600" />
                    </div>
                </div>
                
                <div className="mb-4 text-center">
                    <h3 className="font-medium text-gray-900 mb-2 text-lg">{subCategory.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">
                        Danh mục: <span className="font-medium">{subCategory.categoryName}</span>
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="text-sm text-gray-500">Trạng thái:</span>
                        <ToggleSwitch 
                            isActive={subCategory.active}
                            onToggle={() => toggleActive(subCategory._id)}
                        />
                        <span className={`text-sm font-medium ${subCategory.active ? 'text-green-600' : 'text-gray-500'}`}>
                            {subCategory.active ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="text-sm text-gray-500">
                        Tạo: {new Date(subCategory.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="text-sm text-gray-500">
                        Cập nhật: {new Date(subCategory.updatedAt).toLocaleDateString('vi-VN')}
                    </div>
                </div>
                
                <div className="flex gap-2">
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
                        onClick={() => handleDelete(subCategory._id)}
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải danh mục con...</p>
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
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    const handleEdit = (subCategoryId) => {
        router.push(`/subcategories/${subCategoryId}/edit`);
    };

    // Delete subcategory
    const handleDelete = async (subCategoryId) => {
        if (confirm('Bạn có chắc chắn muốn xóa danh mục con này không?')) {
            try {
                console.log(`🗑️ Deleting subcategory: ${subCategoryId}`);
                
                const response = await fetch(`http://localhost:3000/api/subcategories/${subCategoryId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Lỗi xóa danh mục con');
                }

                // Remove from list
                setSubCategoryList(prev => prev.filter(subCategory => subCategory._id !== subCategoryId));
                
                toast.success('Xóa danh mục con thành công', {
                    duration: 3000,
                    icon: '✅',
                });
                
            } catch (error) {
                console.error('❌ Error deleting subcategory:', error);
                toast.error(`Lỗi: ${error.message}`);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                                Quản Lý Danh Mục Con
                            </h1>
                            <p className="text-gray-600">
                                Quản lý danh sách danh mục con sản phẩm ({subCategoryList.length} danh mục con)
                            </p>
                        </div>
                        <button 
                            onClick={() => router.push('/subcategories/add')}
                            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            Thêm danh mục con
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        <div className="relative flex-1 max-w-md">
                            <input
                                className="w-full border-2 border-gray-400 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
                                placeholder="Tìm kiếm danh mục con..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-4 py-3 border-2 rounded-lg transition-colors ${
                                    showFilters || hasActiveFilters
                                        ? "border-purple-500 bg-purple-50 text-purple-700" 
                                        : "border-gray-400 hover:bg-gray-50 hover:border-gray-500"
                                }`}
                            >
                                <Filter className="w-4 h-4" />
                                <span className="hidden sm:inline">Lọc</span>
                                {hasActiveFilters && (
                                    <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
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
                            
                            {/* View Mode Toggle */}
                            <div className="hidden md:flex bg-gray-100 rounded-lg p-1 border-2 border-gray-300">
                                <button
                                    onClick={() => setViewMode("table")}
                                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                        viewMode === "table" 
                                            ? "bg-white text-gray-900 shadow-sm border border-gray-300" 
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    Bảng
                                </button>
                                <button
                                    onClick={() => setViewMode("card")}
                                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                        viewMode === "card" 
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
                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="active">Hoạt động</option>
                                        <option value="inactive">Tạm dừng</option>
                                    </select>
                                </div>

                                {/* Category Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    >
                                        <option value="">Tất cả danh mục</option>
                                        {categoryList.filter(cat => cat.active).map(category => (
                                            <option key={category._id} value={category._id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Sort By Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Sắp xếp theo</label>
                                    <select
                                        value={filters.sortBy}
                                        onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                            <Folder className="w-12 h-12 mx-auto mb-4" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Không tìm thấy danh mục con
                        </h3>
                        <p className="text-gray-500">
                            Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile/Tablet Card View */}
                        <div className="md:hidden">
                            <div className="grid gap-4">
                                {filtered.map((subCategory) => (
                                    <SubCategoryCard key={subCategory._id} subCategory={subCategory} />
                                ))}
                            </div>
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block">
                            {viewMode === "card" ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filtered.map((subCategory) => (
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
                                                {filtered.map((subCategory) => (
                                                    <tr key={subCategory._id} className={`hover:bg-gray-50 transition-colors ${!subCategory.active ? 'opacity-60' : ''}`}>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                                                    <Folder className="w-5 h-5 text-purple-600" />
                                                                </div>
                                                                <div className="font-medium text-gray-900">{subCategory.name}</div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <div className="text-sm text-gray-600">
                                                                {subCategory.categoryName}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <div className="flex items-center gap-3">
                                                                <ToggleSwitch 
                                                                    isActive={subCategory.active}
                                                                    onToggle={() => toggleActive(subCategory._id)}
                                                                />
                                                                <span className={`text-sm font-medium ${subCategory.active ? 'text-green-600' : 'text-gray-500'}`}>
                                                                    {subCategory.active ? 'Hoạt động' : 'Tạm dừng'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <div className="text-sm text-gray-500">
                                                                {new Date(subCategory.createdAt).toLocaleDateString('vi-VN')}
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex gap-2">
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
                                                                    onClick={() => handleDelete(subCategory._id)}
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

                {/* Results Summary */}
                {filtered.length > 0 && (
                    <div className="mt-6 text-center text-sm text-gray-500">
                        Hiển thị {filtered.length} / {subCategoryList.length} danh mục con
                        {search && ` cho "${search}"`}
                        {hasActiveFilters && " (đã lọc)"}
                    </div>
                )}
            </div>
        </div>
    );
}
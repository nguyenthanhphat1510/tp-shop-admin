"use client";
import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus, Search, Filter, X } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast'; // ✅ Add toast import

export default function ProductsPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState("table"); 
    const [productList, setProductList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // ✅ Add categories and subcategories state
    const [categories, setCategories] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    
    // Filter states
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: "",
        subcategory: "", // ✅ Add subcategory filter
        status: "", // "active", "inactive", ""
        priceRange: "", // "low", "medium", "high", ""
        stockLevel: "" // "in-stock", "low-stock", "out-of-stock", ""
    });
    
    // ✅ Fetch categories and subcategories
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
    
    // Fetch products từ API
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:3000/api/products');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                // ✅ Enhanced data transformation with proper category mapping
                const transformedData = data.map(product => {
                    // Find category name
                    const category = categories.find(cat => cat._id === product.categoryId);
                    const subcategory = subcategories.find(sub => sub._id === product.subcategoryId);
                    
                    return {
                        _id: product._id,
                        name: product.name,
                        description: product.description,
                        price: parseInt(product.price),
                        images: product.imageUrls || [],
                        category: category?.name || "Chưa phân loại",
                        categoryId: product.categoryId,
                        subCategory: subcategory?.name || "Chưa có",
                        subcategoryId: product.subcategoryId,
                        stock: parseInt(product.stock),
                        active: product.isActive === "true" || product.isActive === true,
                        createdAt: product.createdAt,
                        updatedAt: product.updatedAt
                    };
                });
                
                setProductList(transformedData);
                setError(null);
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Không thể tải danh sách sản phẩm');
            } finally {
                setLoading(false);
            }
        };

        // Only fetch products after categories are loaded
        if (categories.length > 0 && subcategories.length > 0) {
            fetchProducts();
        }
    }, [categories, subcategories]);
    
    // ✅ Enhanced filters with subcategory
    const filtered = productList.filter((product) => {
        // Search filter
        const matchesSearch = !search || 
            product.name?.toLowerCase().includes(search.toLowerCase()) ||
            product.category?.toLowerCase().includes(search.toLowerCase()) ||
            product.subCategory?.toLowerCase().includes(search.toLowerCase());
        
        // Category filter
        const matchesCategory = !filters.category || product.categoryId === filters.category;
        
        // ✅ Subcategory filter
        const matchesSubcategory = !filters.subcategory || product.subcategoryId === filters.subcategory;
        
        // Status filter
        const matchesStatus = !filters.status || 
            (filters.status === "active" && product.active) ||
            (filters.status === "inactive" && !product.active);
        
        // Price range filter
        const matchesPriceRange = !filters.priceRange ||
            (filters.priceRange === "low" && product.price < 5000000) ||
            (filters.priceRange === "medium" && product.price >= 5000000 && product.price < 15000000) ||
            (filters.priceRange === "high" && product.price >= 15000000);
        
        // Stock level filter
        const matchesStockLevel = !filters.stockLevel ||
            (filters.stockLevel === "in-stock" && product.stock > 20) ||
            (filters.stockLevel === "low-stock" && product.stock > 0 && product.stock <= 20) ||
            (filters.stockLevel === "out-of-stock" && product.stock === 0);
        
        return matchesSearch && matchesCategory && matchesSubcategory && matchesStatus && matchesPriceRange && matchesStockLevel;
    });

    // ✅ Get filtered subcategories based on selected category
    const filteredSubcategories = filters.category 
        ? subcategories.filter(sub => sub.categoryId === filters.category)
        : subcategories;

    // Clear all filters
    const clearFilters = () => {
        setFilters({
            category: "",
            subcategory: "",
            status: "",
            priceRange: "",
            stockLevel: ""
        });
        setSearch("");
    };

    // Check if any filters are active
    const hasActiveFilters = search || Object.values(filters).some(filter => filter !== "");

    // ✅ Enhanced toggle with toast notification
    const toggleActive = async (productId) => {
        try {
            const currentProduct = productList.find(p => p._id === productId);
            const newStatus = !currentProduct.active;
            
            // TODO: Call API để update trạng thái sản phẩm
            // const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
            //     method: 'PATCH',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ isActive: newStatus })
            // });
            
            // Update UI optimistically
            setProductList(prev => prev.map(product => 
                product._id === productId 
                    ? { ...product, active: newStatus }
                    : product
            ));
            
            // ✅ Show toast notification when deactivating
            if (!newStatus) {
                toast('Sản phẩm đã được tạm dừng', {
                    icon: '⚠️',
                    style: {
                        borderRadius: '10px',
                        background: '#F59E0B',
                        color: '#fff',
                        fontWeight: 'bold',
                    },
                    duration: 3000,
                });
            } else {
                toast.success('Sản phẩm đã được kích hoạt', {
                    duration: 2000,
                });
            }
            
        } catch (error) {
            console.error('Error updating product status:', error);
            toast.error('Lỗi cập nhật trạng thái sản phẩm');
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

    // ✅ Enhanced ProductCard with larger images
    const ProductCard = ({ product }) => (
        <div className={`bg-white rounded-lg shadow-sm border-2 border-gray-300 hover:shadow-md hover:border-gray-400 transition-all duration-200 overflow-hidden ${!product.active ? 'opacity-75' : ''}`}>
            <div className="p-4">
                {/* ✅ Larger image section */}
                <div className="mb-4">
                    <img 
                        src={product.images?.[0] || "https://via.placeholder.com/300x200"} 
                        alt={product.name} 
                        className="w-full h-48 rounded-lg object-cover border-2 border-gray-200" // ✅ Larger image
                    />
                </div>
                
                <div className="mb-3">
                    <h3 className="font-medium text-gray-900 mb-2 text-lg">{product.name}</h3>
                    <div className="flex flex-wrap gap-2 text-sm mb-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                            {product.category}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full border border-gray-300">
                            {product.subCategory}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-gray-500">Trạng thái:</span>
                        <ToggleSwitch 
                            isActive={product.active}
                            onToggle={() => toggleActive(product._id)}
                        />
                        <span className={`text-sm font-medium ${product.active ? 'text-green-600' : 'text-gray-500'}`}>
                            {product.active ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                    </div>
                </div>
                
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="text-xl font-semibold text-blue-600">
                        {product.price?.toLocaleString()}₫
                    </div>
                    <div className="text-sm text-gray-500">Kho: {product.stock}</div>
                </div>
                
                <div className="flex gap-2">
                    <ActionButton 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleEdit(product._id)}
                    >
                        <Edit className="w-4 h-4" />
                        Sửa
                    </ActionButton>
                    <ActionButton 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDelete(product._id)}
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
                    <p className="text-gray-600">Đang tải sản phẩm...</p>
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

    const handleEdit = (productId) => {
        router.push(`/products/${productId}/edit`);
    };

    // ✅ Enhanced delete with toast warning and soft delete
    const handleDelete = async (productId) => {
        if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này? Sản phẩm sẽ được chuyển sang trạng thái tạm dừng.')) {
            try {
                // TODO: Call API để soft delete (set isActive = false)
                // const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
                //     method: 'PATCH',
                //     headers: { 'Content-Type': 'application/json' },
                //     body: JSON.stringify({ isActive: false })
                // });
                
                // Update UI: Set product to inactive instead of removing
                setProductList(prev => prev.map(product => 
                    product._id === productId 
                        ? { ...product, active: false }
                        : product
                ));
                
                // ✅ Show warning toast for deletion
                toast('Sản phẩm đã được chuyển sang trạng thái tạm dừng', {
                    icon: '⚠️',
                    style: {
                        borderRadius: '10px',
                        background: '#F59E0B',
                        color: '#fff',
                        fontWeight: 'bold',
                    },
                    duration: 4000,
                });
                
            } catch (error) {
                console.error('Error deleting product:', error);
                toast.error('Lỗi khi xóa sản phẩm');
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
                                Quản Lý Sản Phẩm
                            </h1>
                            <p className="text-gray-600">
                                Quản lý danh sách sản phẩm và kho hàng của bạn ({productList.length} sản phẩm)
                            </p>
                        </div>
                        <button 
                            onClick={() => router.push('/products/add')}
                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" />
                            Thêm sản phẩm
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        <div className="relative flex-1 max-w-md">
                            <input
                                className="w-full border-2 border-gray-400 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="Tìm kiếm sản phẩm, danh mục..."
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
                                        ? "border-blue-500 bg-blue-50 text-blue-700" 
                                        : "border-gray-400 hover:bg-gray-50 hover:border-gray-500"
                                }`}
                            >
                                <Filter className="w-4 h-4" />
                                <span className="hidden sm:inline">Lọc</span>
                                {hasActiveFilters && (
                                    <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {Object.values(filters).filter(f => f !== "").length + (search ? 1 : 0)}
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

                    {/* ✅ Enhanced Filter Panel with dynamic subcategories */}
                    {showFilters && (
                        <div className="mt-4 p-4 bg-white rounded-lg border-2 border-gray-300 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Category Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục</label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => setFilters(prev => ({ 
                                            ...prev, 
                                            category: e.target.value,
                                            subcategory: "" // Reset subcategory when category changes
                                        }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Tất cả danh mục</option>
                                        {categories.map(category => (
                                            <option key={category._id} value={category._id}>
                                                {category.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* ✅ Dynamic Subcategory Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Danh mục con</label>
                                    <select
                                        value={filters.subcategory}
                                        onChange={(e) => setFilters(prev => ({ ...prev, subcategory: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        disabled={!filters.category}
                                    >
                                        <option value="">
                                            {!filters.category ? "Chọn danh mục trước" : "Tất cả danh mục con"}
                                        </option>
                                        {filteredSubcategories.map(subcategory => (
                                            <option key={subcategory._id} value={subcategory._id}>
                                                {subcategory.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="active">Hoạt động</option>
                                        <option value="inactive">Tạm dừng</option>
                                    </select>
                                </div>

                                {/* Price Range Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng giá</label>
                                    <select
                                        value={filters.priceRange}
                                        onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Tất cả mức giá</option>
                                        <option value="low">Dưới 5 triệu</option>
                                        <option value="medium">5 - 15 triệu</option>
                                        <option value="high">Trên 15 triệu</option>
                                    </select>
                                </div>

                                {/* Stock Level Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Tồn kho</label>
                                    <select
                                        value={filters.stockLevel}
                                        onChange={(e) => setFilters(prev => ({ ...prev, stockLevel: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Tất cả mức tồn</option>
                                        <option value="in-stock">Còn hàng (trên 20)</option>
                                        <option value="low-stock">Sắp hết (1-20)</option>
                                        <option value="out-of-stock">Hết hàng (0)</option>
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
                            <Search className="w-12 h-12 mx-auto mb-4" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Không tìm thấy sản phẩm
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
                                {filtered.map((product) => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                            {viewMode === "card" ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filtered.map((product) => (
                                        <ProductCard key={product._id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-300">
                                                <tr>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Sản phẩm</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Danh mục</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Giá</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Tồn kho</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Trạng thái</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y-2 divide-gray-200">
                                                {filtered.map((product) => (
                                                    <tr key={product._id} className={`hover:bg-gray-50 transition-colors ${!product.active ? 'opacity-60' : ''}`}>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <div className="flex items-center gap-3">
                                                                {/* ✅ Larger image in table */}
                                                                <img 
                                                                    src={product.images?.[0] || "https://via.placeholder.com/80"} 
                                                                    alt={product.name} 
                                                                    className="w-16 h-16 rounded-lg object-cover border border-gray-200" // ✅ Increased from w-12 h-12
                                                                />
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{product.name}</div>
                                                                    <div className="text-sm text-gray-500">{product.subCategory}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200">
                                                                {product.category}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 font-semibold text-gray-900 border-r border-gray-200">
                                                            {product.price?.toLocaleString()}₫
                                                        </td>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                                                                product.stock > 50 
                                                                    ? "bg-green-100 text-green-700 border-green-200" 
                                                                    : product.stock > 20 
                                                                    ? "bg-yellow-100 text-yellow-700 border-yellow-200" 
                                                                    : "bg-red-100 text-red-700 border-red-200"
                                                            }`}>
                                                                {product.stock}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 border-r border-gray-200">
                                                            <div className="flex items-center gap-3">
                                                                <ToggleSwitch 
                                                                    isActive={product.active}
                                                                    onToggle={() => toggleActive(product._id)}
                                                                />
                                                                <span className={`text-sm font-medium ${product.active ? 'text-green-600' : 'text-gray-500'}`}>
                                                                    {product.active ? 'Hoạt động' : 'Tạm dừng'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex gap-2">
                                                                <ActionButton 
                                                                    variant="secondary" 
                                                                    size="sm"
                                                                    onClick={() => handleEdit(product._id)}
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                    Sửa
                                                                </ActionButton>
                                                                <ActionButton 
                                                                    variant="danger" 
                                                                    size="sm"
                                                                    onClick={() => handleDelete(product._id)}
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
                        Hiển thị {filtered.length} / {productList.length} sản phẩm
                        {search && ` cho "${search}"`}
                        {hasActiveFilters && " (đã lọc)"}
                    </div>
                )}
            </div>
        </div>
    );
}
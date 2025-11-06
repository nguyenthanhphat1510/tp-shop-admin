"use client";
import React, { useState, useEffect, useMemo } from "react";
// FIX 3: Import next/image
import Image from "next/image";
import { Edit, Trash2, Plus, Search, Filter, X, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';

// Define the type for our flattened variant structure for better type safety
type ProductVariantItem = {
    _id: string;
    productId: string;
    name: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    categoryId: string;
    subCategory: string;
    subcategoryId: string;
    stock: number;
    storage: string;
    color: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
};

// FIX 1a: Định nghĩa kiểu cho Category và Subcategory
interface Category {
  _id: string;
  name: string;
}
interface Subcategory {
  _id: string;
  name: string;
  categoryId: string;
}

// FIX 1a: Định nghĩa kiểu cho dữ liệu GỐC từ API (trước khi "flatten")
interface ApiVariant {
  _id: string;
  price: string; // API trả về string, bạn đang dùng parseInt
  images: string[];
  stock: string; // API trả về string, bạn đang dùng parseInt
  storage: string;
  color: string;
  isActive: boolean;
}

interface ApiProduct {
  _id: string;
  name: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  createdAt: string;
  updatedAt: string;
  variants: ApiVariant[];
}


export default function ProductsPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState("table");
    const [productList, setProductList] = useState<ProductVariantItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // FIX 1b: Sử dụng kiểu đã định nghĩa
    const [categories, setCategories] = useState<Category[]>([]);
    const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

    const PAGE_SIZES = [5, 10, 20, 50];
    const [page, setPage] = useState(1);
    // FIX 2: Xóa 'setPageSize' vì không được sử dụng (no-unused-vars)
    const [pageSize] = useState(PAGE_SIZES[0]);

    // ✅ FILTERS STATE
    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        category: "",
        subcategory: "",
        status: "",
        priceRange: "",
        stockLevel: ""
    });

    // Fetch categories and subcategories
    useEffect(() => {
        const fetchCategoriesAndSubcategories = async () => {
            try {
                const [categoriesRes, subcategoriesRes] = await Promise.all([
                    fetch('http://localhost:3000/api/categories'),
                    fetch('http://localhost:3000/api/subcategories')
                ]);
                const categoriesData = await categoriesRes.json();
                const subcategoriesData = await subcategoriesRes.json();

                if (categoriesRes.ok) setCategories(categoriesData);
                if (subcategoriesRes.ok) setSubcategories(subcategoriesData);
            // FIX 1c: Sử dụng 'unknown' cho catch block
            } catch (error: unknown) {
                console.error('❌ Error fetching categories/subcategories:', error);
                toast.error("Không thể tải danh mục.");
            }
        };
        fetchCategoriesAndSubcategories();
    }, []);

    // Fetch products
    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:3000/api/products');
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message || 'Failed to fetch products');
                }

                // FIX 1b: Sử dụng kiểu ApiProduct
                const flattenedVariants = result.data.flatMap((product: ApiProduct) => {
                    const category = categories.find((cat) => cat._id === product.categoryId);
                    const subcategory = subcategories.find((sub) => sub._id === product.subcategoryId);

                    if (!product.variants || product.variants.length === 0) {
                        return [];
                    }

                    // FIX 1b: Sử dụng kiểu ApiVariant
                    return product.variants.map((variant: ApiVariant) => ({
                        _id: variant._id,
                        productId: product._id,
                        name: product.name,
                        description: product.description,
                        price: parseInt(variant.price),
                        images: variant.images || [],
                        category: category?.name || "N/A",
                        categoryId: product.categoryId,
                        subCategory: subcategory?.name || "N/A",
                        subcategoryId: product.subcategoryId,
                        stock: parseInt(variant.stock),
                        storage: variant.storage,
                        color: variant.color,
                        active: variant.isActive,
                        createdAt: product.createdAt,
                        updatedAt: product.updatedAt,
                    }));
                });

                setProductList(flattenedVariants);
                setError(null);
            // FIX 1c: Sử dụng 'unknown' cho catch block
            } catch (err: unknown) {
                console.error('❌ Error fetching products:', err);
                // Giữ nguyên logic của bạn, chỉ sửa 'any' thành 'unknown'
                setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        if (categories.length > 0 && subcategories.length > 0) {
            fetchProducts();
        }
    }, [categories, subcategories]);

    // ✅ FILTERING LOGIC
    const filtered = useMemo(() => productList.filter((variant) => {
        const matchesSearch =
            !search ||
            variant.name?.toLowerCase().includes(search.toLowerCase()) ||
            variant.storage?.toLowerCase().includes(search.toLowerCase()) ||
            variant.color?.toLowerCase().includes(search.toLowerCase()) ||
            variant.category?.toLowerCase().includes(search.toLowerCase());

        const matchesCategory = !filters.category || variant.categoryId === filters.category;
        const matchesSubcategory = !filters.subcategory || variant.subcategoryId === filters.subcategory;
        const matchesStatus =
            !filters.status ||
            (filters.status === "active" && variant.active) ||
            (filters.status === "inactive" && !variant.active);
        const matchesPriceRange =
            !filters.priceRange ||
            (filters.priceRange === "low" && variant.price < 5_000_000) ||
            (filters.priceRange === "medium" && variant.price >= 5_000_000 && variant.price < 15_000_000) ||
            (filters.priceRange === "high" && variant.price >= 15_000_000);
        const matchesStockLevel =
            !filters.stockLevel ||
            (filters.stockLevel === "in-stock" && variant.stock > 20) ||
            (filters.stockLevel === "low-stock" && variant.stock > 0 && variant.stock <= 20) ||
            (filters.stockLevel === "out-of-stock" && variant.stock === 0);

        return matchesSearch && matchesCategory && matchesSubcategory && matchesStatus && matchesPriceRange && matchesStockLevel;
    }), [productList, search, filters]);

    // ✅ FILTERED SUBCATEGORIES
    const filteredSubcategories = useMemo(() => filters.category
        ? subcategories.filter((sub) => sub.categoryId === filters.category)
        : [], [subcategories, filters.category]);

    // ✅ RESET PAGE WHEN FILTERS CHANGE
    useEffect(() => {
        setPage(1);
    }, [search, filters, pageSize]);

    // ✅ PAGINATION
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const safePage = Math.max(1, Math.min(page, totalPages || 1));
    const startIdx = (safePage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalItems);
    const paginated = filtered.slice(startIdx, endIdx);

    const uniqueProductCount = useMemo(() => new Set(productList.map(p => p.productId)).size, [productList]);

    // ✅ CLEAR FILTERS
    const clearFilters = () => {
        setFilters({
            category: "",
            subcategory: "",
            status: "",
            priceRange: "",
            stockLevel: ""
        });
    };

    // ✅ COUNT ACTIVE FILTERS
    const activeFiltersCount = Object.values(filters).filter(v => v !== "").length;

    // ✅ TOGGLE STATUS - CÓ CONFIRM
    const toggleActive = async (variantId: string, currentStatus: boolean, variantName: string, storage: string, color: string) => {
        const action = currentStatus ? 'TẠM DỪNG' : 'KÍCH HOẠT';
        const variantInfo = `${variantName} (${storage} - ${color})`;

        if (confirm(`⚠️ ${action} phiên bản "${variantInfo}"?\n\nTrạng thái sẽ chuyển từ "${currentStatus ? 'Hoạt động' : 'Tạm dừng'}" sang "${currentStatus ? 'Tạm dừng' : 'Hoạt động'}"`)) {
            try {
                const response = await fetch(`http://localhost:3000/api/products/variants/${variantId}/toggle`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Lỗi cập nhật trạng thái');
                }

                const result = await response.json();
                const updatedVariant = result.data;

                // Update state
                setProductList((prev) =>
                    prev.map((variant) =>
                        variant._id === variantId
                            ? { ...variant, active: updatedVariant.isActive }
                            : variant
                    )
                );

                // Toast với màu khác nhau
                if (updatedVariant.isActive) {
                    toast.success(`✅ Đã kích hoạt: ${variantInfo}`, {
                        duration: 3000,
                        style: { background: '#10B981', color: '#fff', fontWeight: 'bold' }
                    });
                } else {
                    toast.success(`⏸️ Đã tạm dừng: ${variantInfo}`, {
                        duration: 3000,
                        style: { background: '#F59E0B', color: '#fff', fontWeight: 'bold' }
                    });
                }
            // FIX 1c: Sử dụng 'unknown' và kiểm tra 'instanceof Error'
            } catch (error: unknown) {
                let message = 'Lỗi không xác định';
                if (error instanceof Error) {
                    message = error.message;
                }
                toast.error(`❌ Lỗi: ${message}`);
            }
        }
    };

    // ✅ FUNCTION - NHẬN CẢ OBJECT
    const handleDeleteVariant = async (variant: ProductVariantItem) => {
        const variantInfo = `${variant.name} (${variant.storage} - ${variant.color})`;
        const imageCount = variant.images?.length || 0;
        
        if (confirm(
            `🗑️ XÓA VARIANT "${variantInfo}"?\n\n` +
            `⚠️ CẢNH BÁO:\n` +
            `- Variant này sẽ bị xóa vĩnh viễn\n` +
            `- Tất cả ảnh (${imageCount}) sẽ bị xóa khỏi Cloudinary\n` +
            `- KHÔNG THỂ KHÔI PHỤC\n\n` +
            `Bạn có chắc chắn?`
        )) {
            try {
                const response = await fetch(`http://localhost:3000/api/products/variants/${variant._id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Lỗi xóa variant');
                }

                const result = await response.json();

                // ✅ XÓA KHỎI LIST
                setProductList((prev) => prev.filter((item) => item._id !== variant._id));

                // ✅ TOAST SUCCESS
                toast.success(
                    `🗑️ ${result.message}\n\n` +
                    `Đã xóa: ${result.data.deletedImagesCount} ảnh\n` +
                    `Còn lại: ${result.data.remainingVariants} variants`,
                    {
                        duration: 5000,
                        style: { background: '#DC2626', color: '#fff', fontWeight: 'bold' }
                    }
                );
            // FIX 1c: Sử dụng 'unknown' và kiểm tra 'instanceof Error'
            } catch (error: unknown) {
                console.error('❌ Error deleting variant:', error);
                
                let message = 'Lỗi không xác định';
                if (error instanceof Error) {
                    message = error.message;
                }
                
                if (message.includes('cuối cùng')) {
                    toast.error(
                        `❌ Không thể xóa variant cuối cùng!\n\n` +
                        `Sản phẩm phải có ít nhất 1 variant.\n` +
                        `Vui lòng xóa cả sản phẩm nếu muốn xóa hết.`,
                        { duration: 6000 }
                    );
                } else {
                    toast.error(`❌ Lỗi: ${message}`);
                }
            }
        }
    };

    // FIX 2: Xóa hàm 'handleDeleteProduct' vì không được sử dụng (no-unused-vars)

    // ✅ FIX: Thay đổi từ edit product sang edit variant
    const handleEdit = (variantId: string) => {
        router.push(`/products/variants/${variantId}/edit`);
    };

    // Reusable Components
    
    // FIX 1d: Thêm kiểu cho Props
    type ToggleSwitchProps = {
      isActive: boolean;
      onToggle: () => void;
      disabled?: boolean;
    }
    const ToggleSwitch = ({ isActive, onToggle, disabled = false }: ToggleSwitchProps) => (
        <button onClick={onToggle} disabled={disabled} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isActive ? 'bg-green-500' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );

    // FIX 1d: Thêm kiểu cho Props
    type ActionButtonProps = {
      onClick: () => void;
      variant?: "primary" | "secondary" | "danger";
      size?: "sm" | "md";
      children: React.ReactNode;
      disabled?: boolean;
    }
    const ActionButton = ({ onClick, variant = "primary", size = "sm", children, disabled = false }: ActionButtonProps) => {
        const baseClasses = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
        const variants: Record<string, string> = {
            primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm hover:shadow-md",
            secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500 border border-gray-300",
            danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm hover:shadow-md",
        };
        const sizes: Record<string, string> = { sm: "px-3 py-2 text-sm", md: "px-4 py-2.5 text-sm" };
        return (<button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}>{children}</button>);
    };

    const ProductCard = ({ variant }: { variant: ProductVariantItem }) => (
        <div className={`bg-white rounded-lg shadow-sm border-2 border-gray-300 hover:shadow-md hover:border-gray-400 transition-all duration-200 overflow-hidden ${!variant.active ? 'opacity-75' : ''}`}>
            <div className="p-4">
                {/* FIX 3a: Thay <img> bằng <Image> */}
                <Image 
                    src={variant.images?.[0] || "https://via.placeholder.com/300x200"} 
                    alt={variant.name} 
                    width={300}
                    height={200}
                    className="w-full h-48 rounded-lg object-cover border-2 border-gray-200 mb-4" 
                />
                <h3 className="font-bold text-gray-900 text-lg">{variant.name}</h3>
                <p className="text-gray-600 font-medium mb-2">{variant.storage} - {variant.color}</p>
                <div className="flex flex-wrap gap-2 text-sm mb-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full border border-blue-200">{variant.category}</span>
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full border border-gray-300">{variant.subCategory}</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-gray-500">Trạng thái:</span>
                    <ToggleSwitch
                        isActive={variant.active}
                        onToggle={() => toggleActive(variant._id, variant.active, variant.name, variant.storage, variant.color)}
                    />
                    <span className={`text-sm font-medium ${variant.active ? 'text-green-600' : 'text-gray-500'}`}>{variant.active ? 'Hoạt động' : 'Tạm dừng'}</span>
                </div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="text-xl font-semibold text-blue-600">{variant.price?.toLocaleString()}₫</div>
                    <div className="text-sm text-gray-500">Kho: {variant.stock}</div>
                </div>
                <div className="flex gap-2">
                    <ActionButton variant="secondary" size="sm" onClick={() => handleEdit(variant._id)}>
                        <Edit className="w-4 h-4" /> Sửa
                    </ActionButton>
                    {/* ✅ TRUYỀN CẢ OBJECT */}
                    <ActionButton 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDeleteVariant(variant)}
                    >
                        <Trash2 className="w-4 h-4" /> Xóa
                    </ActionButton>
                </div>
            </div>
        </div>
    );

    if (loading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div><p className="text-gray-600">Đang tải sản phẩm...</p></div></div>;
    }

    if (error) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><div className="text-red-500 mb-4"><Search className="w-12 h-12 mx-auto mb-2" /></div><h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi tải dữ liệu</h3><p className="text-gray-500 mb-4">{error}</p><button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Thử lại</button></div></div>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Quản Lý Sản Phẩm</h1>
                            <p className="text-gray-600">
                                Quản lý {uniqueProductCount} sản phẩm ({productList.length} phiên bản)
                                {activeFiltersCount > 0 && (
                                    <span className="ml-2 text-blue-600 font-medium">
                                        • {filtered.length} kết quả lọc
                                    </span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={() => router.push('/products/add')}
                            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"
                        >
                            <Plus className="w-5 h-5" /> Thêm sản phẩm
                        </button>
                    </div>

                    {/* ✅ SEARCH + FILTER BAR */}
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <input
                                className="peer w-full border-2 border-gray-400 rounded-lg pl-10 pr-4 py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                placeholder="Tìm tên, dung lượng, màu sắc..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 transition-colors peer-focus:text-blue-600" />
                        </div>

                        {/* ✅ FILTER BUTTON - Chỉ đổi viền khi active */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium border-2 transition-all bg-white ${showFilters || activeFiltersCount > 0
                                    ? 'text-blue-600 border-blue-600 shadow-md'
                                    : 'text-gray-700 border-gray-400 hover:border-blue-500 hover:bg-blue-50'
                                }`}
                        >
                            <Filter className="w-5 h-5" />
                            Bộ lọc
                            {activeFiltersCount > 0 && (
                                <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs font-bold">
                                    {activeFiltersCount}
                                </span>
                            )}
                            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                    </div>

                    {/* ✅ FILTERS PANEL */}
                    {showFilters && (
                        <div className="mt-4 bg-white border-2 border-gray-300 rounded-lg p-6 shadow-lg animate-slideDown">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">Bộ lọc nâng cao</h3>
                                {activeFiltersCount > 0 && (
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 font-medium"
                                    >
                                        <X className="w-4 h-4" />
                                        Xóa tất cả
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                {/* Category Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Danh mục
                                    </label>
                                    <select
                                        value={filters.category}
                                        onChange={(e) => setFilters(prev => ({
                                            ...prev,
                                            category: e.target.value,
                                            subcategory: "" // Reset subcategory when category changes
                                        }))}
                                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    >
                                        <option value="">Tất cả</option>
                                        {/* FIX 1b: Thêm kiểu cho 'cat' */}
                                        {categories.map((cat: Category) => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Subcategory Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Danh mục con
                                    </label>
                                    <select
                                        value={filters.subcategory}
                                        onChange={(e) => setFilters(prev => ({ ...prev, subcategory: e.target.value }))}
                                        disabled={!filters.category}
                                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <option value="">Tất cả</option>
                                        {/* FIX 1b: Thêm kiểu cho 'sub' */}
                                        {filteredSubcategories.map((sub: Subcategory) => (
                                            <option key={sub._id} value={sub._id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Trạng thái
                                    </label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="active">Hoạt động</option>
                                        <option value="inactive">Tạm dừng</option>
                                    </select>
                                </div>

                                {/* Price Range Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Khoảng giá
                                    </label>
                                    <select
                                        value={filters.priceRange}
                                        onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="low">&lt; 5 triệu</option>
                                        <option value="medium">5-15 triệu</option>
                                        <option value="high">&ge; 15 triệu</option>
                                    </select>
                                </div>

                                {/* Stock Level Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tồn kho
                                    </label>
                                    <select
                                        value={filters.stockLevel}
                                        onChange={(e) => setFilters(prev => ({ ...prev, stockLevel: e.target.value }))}
                                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="in-stock">Còn hàng (&gt; 20)</option>
                                        <option value="low-stock">Sắp hết (1-20)</option>
                                        <option value="out-of-stock">Hết hàng</option>
                                    </select>
                                </div>
                            </div>

                            {/* ✅ ACTIVE FILTERS TAGS */}
                            {activeFiltersCount > 0 && (
                                <div className="mt-4 pt-4 border-t-2 border-gray-200">
                                    <p className="text-sm text-gray-600 mb-2">Đang lọc theo:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {filters.category && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border-2 border-blue-300">
                                                {categories.find(c => c._id === filters.category)?.name}
                                                <button onClick={() => setFilters(prev => ({ ...prev, category: "", subcategory: "" }))} className="hover:bg-blue-200 rounded-full p-0.5">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}
                                        {filters.subcategory && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium border-2 border-purple-300">
                                                {subcategories.find(s => s._id === filters.subcategory)?.name}
                                                <button onClick={() => setFilters(prev => ({ ...prev, subcategory: "" }))} className="hover:bg-purple-200 rounded-full p-0.5">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}
                                        {filters.status && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium border-2 border-green-300">
                                                {filters.status === "active" ? "Hoạt động" : "Tạm dừng"}
                                                <button onClick={() => setFilters(prev => ({ ...prev, status: "" }))} className="hover:bg-green-200 rounded-full p-0.5">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}
                                        {filters.priceRange && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium border-2 border-yellow-300">
                                                {filters.priceRange === "low" && "< 5 triệu"}
                                                {filters.priceRange === "medium" && "5-15 triệu"}
                                                {filters.priceRange === "high" && "≥ 15 triệu"}
                                                <button onClick={() => setFilters(prev => ({ ...prev, priceRange: "" }))} className="hover:bg-yellow-200 rounded-full p-0.5">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}
                                        {filters.stockLevel && (
                                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium border-2 border-red-300">
                                                {filters.stockLevel === "in-stock" && "Còn hàng"}
                                                {filters.stockLevel === "low-stock" && "Sắp hết"}
                                                {filters.stockLevel === "out-of-stock" && "Hết hàng"}
                                                <button onClick={() => setFilters(prev => ({ ...prev, stockLevel: "" }))} className="hover:bg-red-200 rounded-full p-0.5">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ✅ RESULTS */}
                {totalItems === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 p-12 text-center">
                        <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                        <p className="text-gray-500 mb-4">Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc.</p>
                        {activeFiltersCount > 0 && (
                            <button
                                onClick={clearFilters}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                <X className="w-4 h-4" />
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="md:hidden grid gap-4">
                            {paginated.map((variant) => <ProductCard key={variant._id} variant={variant} />)}
                        </div>

                        {/* Desktop Table/Card View */}
                        <div className="hidden md:block">
                            {viewMode === "card" ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {paginated.map((variant) => <ProductCard key={variant._id} variant={variant} />)}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-300">
                                                <tr>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Sản phẩm</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Danh mục</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Danh mục con</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Giá</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Tồn kho</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Trạng thái</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y-2 divide-gray-200">
                                                {paginated.map((variant) => (
                                                    <tr key={variant._id} className={`hover:bg-gray-50 transition-colors ${!variant.active ? 'opacity-60' : ''}`}>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                {/* FIX 3b: Thay <img> bằng <Image> */}
                                                                <Image 
                                                                    src={variant.images?.[0] || "https://via.placeholder.com/80"} 
                                                                    alt={variant.name} 
                                                                    width={64}
                                                                    height={64}
                                                                    className="rounded-lg object-cover border border-gray-200" 
                                                                />
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{variant.name}</div>
                                                                    <div className="text-sm text-gray-600">{variant.storage} - {variant.color}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200">{variant.category}</span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium border border-purple-200">{variant.subCategory}</span>
                                                        </td>
                                                        <td className="py-4 px-6 font-semibold text-gray-900">{variant.price?.toLocaleString()}₫</td>
                                                        <td className="py-4 px-6">
                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${variant.stock > 20 ? "bg-green-100 text-green-700 border-green-200" : variant.stock > 0 ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-red-100 text-red-700 border-red-200"}`}>{variant.stock}</span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <ToggleSwitch
                                                                    isActive={variant.active}
                                                                    onToggle={() => toggleActive(variant._id, variant.active, variant.name, variant.storage, variant.color)}
                                                                />
                                                                <span className={`text-sm font-medium ${variant.active ? 'text-green-600' : 'text-gray-500'}`}>{variant.active ? 'Hoạt động' : 'Tạm dừng'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex gap-2">
                                                                {/* ✅ NÚT SỬA */}
                                                                <ActionButton 
                                                                    variant="secondary" 
                                                                    size="sm" 
                                                                    onClick={() => handleEdit(variant._id)}
                                                                >
                                                                    <Edit className="w-4 h-4" /> Sửa
                                                                </ActionButton>
                                                                
                                                                {/* ✅ TRUYỀN CẢ OBJECT */}
                                                                <ActionButton 
                                                                    variant="danger" 
                                                                    size="sm" 
                                                                    onClick={() => handleDeleteVariant(variant)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" /> Xóa
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

                        {/* ✅ PAGINATION */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border-2 border-gray-300 rounded-lg p-4">
                                <div className="text-sm text-gray-600">
                                    Hiển thị <span className="font-semibold text-gray-900">{startIdx + 1}</span> - <span className="font-semibold text-gray-900">{endIdx}</span> trong tổng số <span className="font-semibold text-gray-900">{totalItems}</span> sản phẩm
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={safePage === 1}
                                        className="px-3 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700"
                                    >
                                        Trước
                                    </button>
                                    <span className="text-sm text-gray-600">
                                        Trang <span className="font-semibold text-gray-900">{safePage}</span> / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={safePage === totalPages}
                                        className="px-3 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700"
                                    >
                                        Sau
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
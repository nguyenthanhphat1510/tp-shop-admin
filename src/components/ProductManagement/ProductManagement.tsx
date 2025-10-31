"use client";
import React, { useState, useEffect, useMemo } from "react";
import { Edit, Trash2, Plus, Search } from "lucide-react";
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

export default function ProductsPage() {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState("table");
    const [productList, setProductList] = useState<ProductVariantItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [categories, setCategories] = useState<any[]>([]);
    const [subcategories, setSubcategories] = useState<any[]>([]);

    const PAGE_SIZES = [5, 10, 20, 50];
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

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
            } catch (error) {
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

                const flattenedVariants = result.data.flatMap((product: any) => {
                    const category = categories.find((cat) => cat._id === product.categoryId);
                    const subcategory = subcategories.find((sub) => sub._id === product.subcategoryId);

                    if (!product.variants || product.variants.length === 0) {
                        return [];
                    }

                    return product.variants.map((variant: any) => ({
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
            } catch (err: any) {
                console.error('❌ Error fetching products:', err);
                setError('Không thể tải danh sách sản phẩm. Vui lòng thử lại.');
            } finally {
                setLoading(false);
            }
        };

        if (categories.length > 0 && subcategories.length > 0) {
            fetchProducts();
        }
    }, [categories, subcategories]);

    // Filtering
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

    const filteredSubcategories = useMemo(() => filters.category
        ? subcategories.filter((sub) => sub.categoryId === filters.category)
        : [], [subcategories, filters.category]);

    useEffect(() => {
        setPage(1);
    }, [search, filters, pageSize]);

    // Pagination
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const safePage = Math.max(1, Math.min(page, totalPages || 1));
    const startIdx = (safePage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalItems);
    const paginated = filtered.slice(startIdx, endIdx);

    const uniqueProductCount = useMemo(() => new Set(productList.map(p => p.productId)).size, [productList]);

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
            } catch (error: any) {
                toast.error(`❌ Lỗi: ${error.message}`);
            }
        }
    };

    // ✅ HARD DELETE
    const handleDelete = async (productId: string, productName: string) => {
        if (confirm(`🗑️ XÓA VĨNH VIỄN sản phẩm "${productName}"?\n\n⚠️ CẢNH BÁO:\n- Sản phẩm và tất cả phiên bản sẽ bị xóa\n- Tất cả ảnh sẽ bị xóa khỏi Cloudinary\n- KHÔNG THỂ KHÔI PHỤC\n\nBạn có chắc chắn?`)) {
            try {
                const response = await fetch(`http://localhost:3000/api/products/${productId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Lỗi xóa sản phẩm');
                }

                const result = await response.json();

                setProductList((prev) => prev.filter((variant) => variant.productId !== productId));

                toast.success(`🗑️ ${result.message}`, {
                    duration: 5000,
                    style: { background: '#DC2626', color: '#fff', fontWeight: 'bold' }
                });
            } catch (error: any) {
                toast.error(`❌ Lỗi: ${error.message}`);
            }
        }
    };

    const handleEdit = (productId: string) => {
        router.push(`/products/${productId}/edit`);
    };

    // Reusable Components
    const ToggleSwitch = ({ isActive, onToggle, disabled = false }: any) => (
        <button onClick={onToggle} disabled={disabled} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isActive ? 'bg-green-500' : 'bg-gray-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ease-in-out ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    );

    const ActionButton = ({ onClick, variant = "primary", size = "sm", children, disabled = false }: any) => {
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
                <img src={variant.images?.[0] || "https://via.placeholder.com/300x200"} alt={variant.name} className="w-full h-48 rounded-lg object-cover border-2 border-gray-200 mb-4" />
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
                    <ActionButton variant="secondary" size="sm" onClick={() => handleEdit(variant.productId)}>
                        <Edit className="w-4 h-4" /> Sửa
                    </ActionButton>
                    <ActionButton variant="danger" size="sm" onClick={() => handleDelete(variant.productId, variant.name)}>
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
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Quản Lý Sản Phẩm</h1>
                            <p className="text-gray-600">Quản lý {uniqueProductCount} sản phẩm ({productList.length} phiên bản)</p>
                        </div>
                        <button onClick={() => router.push('/products/add')} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm"><Plus className="w-5 h-5" /> Thêm sản phẩm</button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        <div className="relative flex-1 max-w-md">
                            <input className="peer w-full border-2 border-gray-400 rounded-lg pl-10 pr-4 py-3 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-black focus:border-black outline-none transition-colors" placeholder="Tìm tên, dung lượng, màu sắc..." value={search} onChange={(e) => setSearch(e.target.value)} />
                            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 transition-colors peer-focus:text-black" />
                        </div>
                    </div>
                </div>

                {totalItems === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 p-12 text-center">
                        <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
                        <p className="text-gray-500">Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc.</p>
                    </div>
                ) : (
                    <>
                        <div className="md:hidden grid gap-4">
                            {paginated.map((variant) => <ProductCard key={variant._id} variant={variant} />)}
                        </div>

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
                                                                <img src={variant.images?.[0] || "https://via.placeholder.com/80"} alt={variant.name} className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
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
                                                                <ActionButton variant="secondary" size="sm" onClick={() => handleEdit(variant.productId)}>
                                                                    <Edit className="w-4 h-4" /> Sửa
                                                                </ActionButton>
                                                                <ActionButton variant="danger" size="sm" onClick={() => handleDelete(variant.productId, variant.name)}>
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
                    </>
                )}
            </div>
        </div>
    );
}
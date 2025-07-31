"use client";
import React, { useState } from "react";
import { Edit, Trash2, Plus, Search, Filter } from "lucide-react";

// Mock data sản phẩm
const products = [
    {
        id: 1,
        image: "https://via.placeholder.com/60x60/3B82F6/FFFFFF?text=AT",
        name: "Áo Thun Basic Premium",
        category: "Áo",
        subCategory: "Áo Thun",
        price: "250.000₫",
        stock: 120,
        active: true,
    },
    {
        id: 2,
        image: "https://via.placeholder.com/60x60/10B981/FFFFFF?text=QJ",
        name: "Quần Jean Slim Fit",
        category: "Quần",
        subCategory: "Jean",
        price: "450.000₫",
        stock: 60,
        active: false,
    },
    {
        id: 3,
        image: "https://via.placeholder.com/60x60/F59E0B/FFFFFF?text=GS",
        name: "Giày Sneaker Sport",
        category: "Giày",
        subCategory: "Thể thao",
        price: "900.000₫",
        stock: 30,
        active: true,
    },
    {
        id: 4,
        image: "https://via.placeholder.com/60x60/EF4444/FFFFFF?text=AK",
        name: "Áo Khoác Hoodie",
        category: "Áo",
        subCategory: "Áo Khoác",
        price: "380.000₫",
        stock: 45,
        active: true,
    },
    {
        id: 5,
        image: "https://via.placeholder.com/60x60/8B5CF6/FFFFFF?text=VS",
        name: "Váy Suông Công Sở",
        category: "Váy",
        subCategory: "Công Sở",
        price: "320.000₫",
        stock: 25,
        active: false,
    },
];

export default function ProductsPage() {
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState("table"); 
    const [productList, setProductList] = useState(products);
    
    const filtered = productList.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.category.toLowerCase().includes(search.toLowerCase()) ||
            p.subCategory.toLowerCase().includes(search.toLowerCase())
    );

    const toggleActive = (productId) => {
        setProductList(prev => prev.map(product => 
            product.id === productId 
                ? { ...product, active: !product.active }
                : product
        ));
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

    const ProductCard = ({ product }) => (
        <div className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 overflow-hidden ${!product.active ? 'opacity-75' : ''}`}>
            <div className="p-4">
                <div className="flex items-start gap-3 mb-3">
                    <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate mb-1">{product.name}</h3>
                        <div className="flex flex-wrap gap-1 text-xs mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                {product.category}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                {product.subCategory}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">Trạng thái:</span>
                            <ToggleSwitch 
                                isActive={product.active}
                                onToggle={() => toggleActive(product.id)}
                            />
                            <span className={`text-xs font-medium ${product.active ? 'text-green-600' : 'text-gray-500'}`}>
                                {product.active ? 'Hoạt động' : 'Tạm dừng'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center justify-between mb-3">
                    <div className="text-lg font-semibold text-blue-600">{product.price}</div>
                    <div className="text-sm text-gray-500">Kho: {product.stock}</div>
                </div>
                
                <div className="flex gap-2">
                    <ActionButton 
                        variant="secondary" 
                        size="sm"
                        onClick={() => console.log('Edit:', product.id)}
                    >
                        <Edit className="w-4 h-4" />
                        Sửa
                    </ActionButton>
                    <ActionButton 
                        variant="danger" 
                        size="sm"
                        onClick={() => console.log('Delete:', product.id)}
                    >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                    </ActionButton>
                </div>
            </div>
        </div>
    );

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
                                Quản lý danh sách sản phẩm và kho hàng của bạn
                            </p>
                        </div>
                        <button className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-sm">
                            <Plus className="w-5 h-5" />
                            Thêm sản phẩm
                        </button>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        <div className="relative flex-1 max-w-md">
                            <input
                                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Tìm kiếm sản phẩm, danh mục..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                        
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <Filter className="w-4 h-4" />
                                <span className="hidden sm:inline">Lọc</span>
                            </button>
                            
                            {/* View Mode Toggle */}
                            <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode("table")}
                                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                        viewMode === "table" 
                                            ? "bg-white text-gray-900 shadow-sm" 
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    Bảng
                                </button>
                                <button
                                    onClick={() => setViewMode("card")}
                                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                                        viewMode === "card" 
                                            ? "bg-white text-gray-900 shadow-sm" 
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    Thẻ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                {filtered.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
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
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block">
                            {viewMode === "card" ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filtered.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Sản phẩm</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Danh mục</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Giá</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Tồn kho</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Trạng thái</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {filtered.map((product) => (
                                                    <tr key={product.id} className={`hover:bg-gray-50 transition-colors ${!product.active ? 'opacity-60' : ''}`}>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <img 
                                                                    src={product.image} 
                                                                    alt={product.name} 
                                                                    className="w-12 h-12 rounded-lg object-cover"
                                                                />
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{product.name}</div>
                                                                    <div className="text-sm text-gray-500">{product.subCategory}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                                                {product.category}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 font-semibold text-gray-900">{product.price}</td>
                                                        <td className="py-4 px-6">
                                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                                                product.stock > 50 
                                                                    ? "bg-green-100 text-green-700" 
                                                                    : product.stock > 20 
                                                                    ? "bg-yellow-100 text-yellow-700" 
                                                                    : "bg-red-100 text-red-700"
                                                            }`}>
                                                                {product.stock}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <ToggleSwitch 
                                                                    isActive={product.active}
                                                                    onToggle={() => toggleActive(product.id)}
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
                                                                    onClick={() => console.log('Edit:', product.id)}
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                    Sửa
                                                                </ActionButton>
                                                                <ActionButton 
                                                                    variant="danger" 
                                                                    size="sm"
                                                                    onClick={() => console.log('Delete:', product.id)}
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
                        Hiển thị {filtered.length} sản phẩm
                        {search && ` cho "${search}"`}
                    </div>
                )}
            </div>
        </div>
    );
}
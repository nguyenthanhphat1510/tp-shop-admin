"use client";
import React, { useState, useEffect } from "react";
import { Search, Filter, X, Eye, Package, Truck, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function OrderManagement() {
    const router = useRouter();

    // ======= Config =======
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";
    const PAGE_SIZES = [5];

    // ======= States =======
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"table" | "card">("table");
    const [orderList, setOrderList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [showFilters, setShowFilters] = useState(false);
    const [filters, setFilters] = useState({
        status: "",
        paymentStatus: "",
        paymentMethod: "",
        dateRange: "",
    });

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    // ======= Fetch orders (Admin, no auth) =======
    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_BASE}/api/orders/admin/all`, {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();

                if (result.success) {
                    const transformedData = result.data.map((order: any) => ({
                        _id: order._id,
                        orderNumber: order.orderNumber || order._id.slice(-6),
                        customerName: order.shippingInfo?.fullName || "Khách hàng",
                        customerEmail: order.shippingInfo?.email?.trim() || "",
                        customerPhone: order.shippingInfo?.phone?.trim() || "",
                        total: Number(order.total) || 0,
                        status: order.status || "pending",
                        paymentStatus: order.paymentStatus || "pending",
                        paymentMethod: order.paymentMethod || "cod",
                        itemCount: order.orderItems?.length || 0,
                        createdAt: order.createdAt,
                        updatedAt: order.updatedAt,
                        note: order.note || "",
                        trackingNumber: order.trackingNumber || "",
                    }));

                    setOrderList(transformedData);
                    setError(null);
                } else {
                    throw new Error(result.message || "Không thể tải danh sách đơn hàng");
                }
            } catch (err: any) {
                setError("Không thể tải danh sách đơn hàng: " + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [API_BASE]);

    // ======= Labels / helpers =======
    const statusLabels: Record<string, string> = {
        pending: "Chờ xác nhận",
        confirmed: "Đã xác nhận",
        packing: "Đang đóng gói",
        shipping: "Đang giao",
        delivered: "Đã giao",
        cancelled: "Đã hủy",
    };

    const statusColors: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
        confirmed: "bg-blue-100 text-blue-700 border-blue-200",
        packing: "bg-purple-100 text-purple-700 border-purple-200",
        shipping: "bg-orange-100 text-orange-700 border-orange-200",
        delivered: "bg-green-100 text-green-700 border-green-200",
        cancelled: "bg-red-100 text-red-700 border-red-200",
    };

    const paymentStatusLabels: Record<string, string> = {
        pending: "Chờ thanh toán",
        paid: "Đã thanh toán",
        failed: "Thanh toán thất bại",
    };

    const paymentMethodLabels: Record<string, string> = {
        cod: "Tiền mặt",
        momo: "MoMo",
        zalopay: "ZaloPay",
    };

    // Hiển thị & lọc: đơn "delivered" luôn coi là "paid"
    const getEffectivePaymentStatus = (order: any) =>
        order?.status === "delivered" ? "paid" : order?.paymentStatus;

    // ======= Filter logic =======
    const filtered = orderList.filter((order) => {
        const matchesSearch =
            !search ||
            order.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
            order.customerName?.toLowerCase().includes(search.toLowerCase()) ||
            order.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
            order.customerPhone?.includes(search);

        const matchesStatus = !filters.status || order.status === filters.status;
        const matchesPaymentStatus =
            !filters.paymentStatus || getEffectivePaymentStatus(order) === filters.paymentStatus;
        const matchesPaymentMethod =
            !filters.paymentMethod || order.paymentMethod === filters.paymentMethod;

        const matchesDateRange =
            !filters.dateRange ||
            (() => {
                const orderDate = new Date(order.createdAt);
                const today = new Date();
                const diffTime = +today - +orderDate;
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                switch (filters.dateRange) {
                    case "today":
                        return diffDays <= 1;
                    case "week":
                        return diffDays <= 7;
                    case "month":
                        return diffDays <= 30;
                    default:
                        return true;
                }
            })();

        return (
            matchesSearch &&
            matchesStatus &&
            matchesPaymentStatus &&
            matchesPaymentMethod &&
            matchesDateRange
        );
    });

    // ======= Reset về trang 1 khi đổi từ khóa/bộ lọc =======
    useEffect(() => {
        setPage(1);
    }, [search, filters]);

    // ======= Pagination calculation =======
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIdx = (safePage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalItems);
    const paginated = filtered.slice(startIdx, endIdx);

    // ======= Helpers =======
    const clearFilters = () => {
        setFilters({ status: "", paymentStatus: "", paymentMethod: "", dateRange: "" });
        setSearch("");
    };

    const hasActiveFilters = !!search || Object.values(filters).some((f) => f !== "");

    // ======= Actions =======
    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            // gửi kèm paymentStatus khi đánh dấu đã giao
            const patch: any = {
                status: newStatus,
                updatedAt: new Date().toISOString(),
            };
            if (newStatus === "delivered") {
                patch.paymentStatus = "paid";
                patch.paidAt = new Date().toISOString(); // tuỳ BE
            }

            const response = await fetch(`${API_BASE}/api/orders/admin/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(patch),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Lỗi cập nhật trạng thái");
            }

            const result = await response.json();
            if (result.success) {
                setOrderList((prev) =>
                    prev.map((order) =>
                        order._id === orderId
                            ? {
                                ...order,
                                status: newStatus,
                                paymentStatus: newStatus === "delivered" ? "paid" : order.paymentStatus,
                                updatedAt: new Date().toISOString(),
                            }
                            : order
                    )
                );

                toast.success(
                    newStatus === "delivered"
                        ? 'Đã chuyển trạng thái "Đã giao" và đánh dấu "Đã thanh toán"'
                        : `Đã cập nhật trạng thái đơn hàng thành "${statusLabels[newStatus] || newStatus}"`
                );
            } else {
                throw new Error(result.message || "Cập nhật thất bại");
            }
        } catch (error: any) {
            toast.error(`Lỗi: ${error.message}`);
        }
    };

    // ======= Navigation =======
    const handleViewOrder = (orderId: string) => {
        router.push(`/orders/${orderId}`);
    };

    // ======= UI Components =======
    const ActionButton = ({
        onClick,
        variant = "primary",
        size = "sm",
        children,
        disabled = false,
    }: {
        onClick: () => void;
        variant?: "primary" | "success" | "warning" | "danger" | "secondary";
        size?: "sm" | "md" | "lg";
        children: React.ReactNode;
        disabled?: boolean;
    }) => {
        const baseClasses =
            "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

        const variants: Record<string, string> = {
            primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm hover:shadow-md",
            success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-sm hover:shadow-md",
            warning: "bg-orange-600 hover:bg-orange-700 text-white focus:ring-orange-500 shadow-sm hover:shadow-md",
            danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm hover:shadow-md",
            secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500 border border-gray-300",
        };

        const sizes: Record<string, string> = {
            sm: "px-3 py-2 text-sm",
            md: "px-4 py-2.5 text-sm",
            lg: "px-6 py-3 text-base",
        };

        return (
            <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}>
                {children}
            </button>
        );
    };

    const OrderCard = ({ order }: { order: any }) => {
        const ps = getEffectivePaymentStatus(order);

        return (
            <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 hover:shadow-md hover:border-gray-400 transition-all duration-200 overflow-hidden">
                <div className="p-4">
                    <div className="mb-4">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-gray-900 text-lg">#{order.orderNumber || order._id?.slice(-8) || ""}</h3>
                            <span
                                className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[order.status] || "bg-gray-100 text-gray-700 border-gray-200"}`}
                            >
                                {statusLabels[order.status] || order.status || "Không xác định"}
                            </span>
                        </div>
                        <p className="text-gray-900">{order.customerName || "Khách hàng"}</p>
                        {order.customerPhone && <p className="text-sm text-gray-700">{order.customerPhone}</p>}
                    </div>

                    <div className="flex flex-wrap gap-2 text-sm mb-3">
                        <span
                            className={`px-3 py-1 rounded-full border ${ps === "paid"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : ps === "failed"
                                    ? "bg-red-100 text-red-700 border-red-200"
                                    : "bg-yellow-100 text-yellow-700 border-yellow-200"
                                }`}
                        >
                            {paymentStatusLabels[ps] || ps || "Không xác định"}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-900 rounded-full border border-gray-300">
                            {paymentMethodLabels[order.paymentMethod] || order.paymentMethod || "Không xác định"}
                        </span>
                    </div>

                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                        <div className="text-xl font-semibold text-blue-600">{(order.total || 0).toLocaleString("vi-VN")}₫</div>
                        {order.itemCount > 0 && <div className="text-sm text-gray-700">{order.itemCount} sản phẩm</div>}
                    </div>

                    {order.createdAt && (
                        <div className="text-sm text-gray-700 mb-4">
                            {new Date(order.createdAt).toLocaleString("vi-VN")}
                        </div>
                    )}

                    <div className="flex gap-2 flex-wrap">
                        <ActionButton variant="primary" size="sm" onClick={() => handleViewOrder(order._id)}>
                            <Eye className="w-4 h-4" />
                            Xem
                        </ActionButton>

                        {order.status === "pending" && (
                            <ActionButton variant="success" size="sm" onClick={() => updateOrderStatus(order._id, "confirmed")}>
                                <CheckCircle className="w-4 h-4" />
                                Xác nhận
                            </ActionButton>
                        )}

                        {order.status === "confirmed" && (
                            <ActionButton variant="warning" size="sm" onClick={() => updateOrderStatus(order._id, "shipping")}>
                                <Truck className="w-4 h-4" />
                                Giao hàng
                            </ActionButton>
                        )}

                        {order.status === "shipping" && (
                            <ActionButton variant="success" size="sm" onClick={() => updateOrderStatus(order._id, "delivered")}>
                                <CheckCircle className="w-4 h-4" />
                                Đã giao
                            </ActionButton>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    // ======= Loading/Error =======
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-700">Đang tải đơn hàng...</p>
                </div>
            </div>
        );
    }

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

    // ======= Pagination Component =======
    const Pagination = () => {
        if (totalItems === 0) return null;

        const goTo = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

        const baseBtn =
            "px-3 md:px-4 py-2 text-sm md:text-base rounded-lg font-medium border-2 transition-colors";
        const normalBtn =
            "bg-gray-100 border-gray-300 text-gray-900 hover:bg-blue-50 hover:border-blue-400";
        const activeBtn = "bg-blue-600 border-blue-600 text-white hover:bg-blue-700";
        const disabledBtn = "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed";

        const pages: number[] = [];
        const windowSize = 1;
        const add = (n: number) => {
            if (!pages.includes(n)) pages.push(n);
        };

        add(1);
        for (let i = safePage - windowSize; i <= safePage + windowSize; i++) {
            if (i > 1 && i < totalPages) add(i);
        }
        if (totalPages > 1) add(totalPages);
        pages.sort((a, b) => a - b);

        return (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-6">
                <div className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">{totalItems ? startIdx + 1 : 0}-{endIdx}</span> /{" "}
                    <span className="font-medium">{totalItems}</span> đơn hàng
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700">Mỗi trang</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        }}
                        className="border-2 border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                        {PAGE_SIZES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => goTo(1)}
                        disabled={safePage === 1}
                        className={`${baseBtn} ${safePage === 1 ? disabledBtn : normalBtn}`}
                        aria-label="Trang đầu"
                    >
                        «
                    </button>
                    <button
                        onClick={() => goTo(safePage - 1)}
                        disabled={safePage === 1}
                        className={`${baseBtn} ${safePage === 1 ? disabledBtn : normalBtn}`}
                        aria-label="Trang trước"
                    >
                        Trước
                    </button>

                    {pages.map((p, idx) => {
                        const prev = pages[idx - 1];
                        const showEllipsis = idx > 0 && p - (prev ?? 0) > 1;
                        const isActive = p === safePage;
                        return (
                            <React.Fragment key={p}>
                                {showEllipsis && <span className="px-2 text-gray-500">…</span>}
                                <button
                                    onClick={() => goTo(p)}
                                    className={`${baseBtn} ${isActive ? activeBtn : normalBtn}`}
                                    aria-current={isActive ? "page" : undefined}
                                >
                                    {p}
                                </button>
                            </React.Fragment>
                        );
                    })}

                    <button
                        onClick={() => goTo(safePage + 1)}
                        disabled={safePage === totalPages}
                        className={`${baseBtn} ${safePage === totalPages ? disabledBtn : normalBtn}`}
                        aria-label="Trang sau"
                    >
                        Sau
                    </button>
                    <button
                        onClick={() => goTo(totalPages)}
                        disabled={safePage === totalPages}
                        className={`${baseBtn} ${safePage === totalPages ? disabledBtn : normalBtn}`}
                        aria-label="Trang cuối"
                    >
                        »
                    </button>
                </div>
            </div>
        );
    };

    // ======= Render =======
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto p-4 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Quản Lý Đơn Hàng</h1>
                            <p className="text-gray-700">Quản lý và theo dõi tất cả đơn hàng ({orderList.length} đơn hàng)</p>
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        <div className="relative flex-1 max-w-md">
                            <input
                                className="w-full border-2 border-gray-400 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors text-gray-900 placeholder-gray-500"
                                placeholder="Tìm kiếm mã đơn, khách hàng..."
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
                                        {Object.values(filters).filter((f) => f !== "").length + (search ? 1 : 0)}
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
                                    className={`px-3 py-2 text-sm rounded-md transition-colors ${viewMode === "table" ? "bg-white text-gray-900 shadow-sm border border-gray-300" : "text-gray-900 hover:text-gray-900"
                                        }`}
                                >
                                    Bảng
                                </button>
                                <button
                                    onClick={() => setViewMode("card")}
                                    className={`px-3 py-2 text-sm rounded-md transition-colors ${viewMode === "card" ? "bg-white text-gray-900 shadow-sm border border-gray-300" : "text-gray-900 hover:text-gray-900"
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
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái đơn</label>
                                    <select
                                        value={filters.status}
                                        onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    >
                                        <option value="">Tất cả trạng thái</option>
                                        <option value="pending">Chờ xác nhận</option>
                                        <option value="confirmed">Đã xác nhận</option>
                                        <option value="packing">Đang đóng gói</option>
                                        <option value="shipping">Đang giao</option>
                                        <option value="delivered">Đã giao</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Thanh toán</label>
                                    <select
                                        value={filters.paymentStatus}
                                        onChange={(e) => setFilters((prev) => ({ ...prev, paymentStatus: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="pending">Chờ thanh toán</option>
                                        <option value="paid">Đã thanh toán</option>
                                        <option value="failed">Thất bại</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phương thức</label>
                                    <select
                                        value={filters.paymentMethod}
                                        onChange={(e) => setFilters((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="cod">Tiền mặt</option>
                                        <option value="momo">MoMo</option>
                                        <option value="zalopay">ZaloPay</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian</label>
                                    <select
                                        value={filters.dateRange}
                                        onChange={(e) => setFilters((prev) => ({ ...prev, dateRange: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                                    >
                                        <option value="">Tất cả</option>
                                        <option value="today">Hôm nay</option>
                                        <option value="week">7 ngày qua</option>
                                        <option value="month">30 ngày qua</option>
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
                            <Package className="w-12 h-12 mx-auto mb-4" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy đơn hàng</h3>
                        <p className="text-gray-700">
                            {orderList.length === 0 ? "Chưa có đơn hàng nào" : "Thử thay đổi từ khóa tìm kiếm hoặc xóa bộ lọc"}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile/Tablet Card View */}
                        <div className="md:hidden">
                            <div className="grid gap-4">
                                {paginated.map((order) => (
                                    <OrderCard key={order._id} order={order} />
                                ))}
                            </div>
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block">
                            {viewMode === "card" ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {paginated.map((order) => (
                                        <OrderCard key={order._id} order={order} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border-2 border-gray-300 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b-2 border-gray-300">
                                                <tr>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Mã đơn</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Khách hàng</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Tổng tiền</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Trạng thái</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Thanh toán</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900 border-r border-gray-200">Ngày tạo</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y-2 divide-gray-200">
                                                {paginated.map((order) => {
                                                    const ps = getEffectivePaymentStatus(order);
                                                    return (
                                                        <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="py-4 px-6 border-r border-gray-200">
                                                                <div className="font-medium text-gray-900">#{order.orderNumber}</div>
                                                                {order.itemCount > 0 && (
                                                                    <div className="text-sm text-gray-700">{order.itemCount} sản phẩm</div>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-6 border-r border-gray-200">
                                                                <div className="font-medium text-gray-900">{order.customerName}</div>
                                                                {order.customerEmail && (
                                                                    <div className="text-sm text-gray-700">{order.customerEmail}</div>
                                                                )}
                                                            </td>
                                                            <td className="py-4 px-6 font-semibold text-gray-900 border-r border-gray-200">
                                                                {(order.total ?? 0).toLocaleString("vi-VN")}₫
                                                            </td>
                                                            <td className="py-4 px-6 border-r border-gray-200">
                                                                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${statusColors[order.status]}`}>
                                                                    {statusLabels[order.status] || order.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-4 px-6 border-r border-gray-200">
                                                                <div className="flex flex-col gap-1">
                                                                    <span
                                                                        className={`px-2 py-1 rounded text-xs font-medium ${ps === "paid"
                                                                            ? "bg-green-100 text-green-700"
                                                                            : ps === "failed"
                                                                                ? "bg-red-100 text-red-700"
                                                                                : "bg-yellow-100 text-yellow-700"
                                                                            }`}
                                                                    >
                                                                        {paymentStatusLabels[ps]}
                                                                    </span>
                                                                    <span className="text-xs text-gray-700">{paymentMethodLabels[order.paymentMethod]}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 px-6 text-sm text-gray-700 border-r border-gray-200">
                                                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString("vi-VN") : ""}
                                                            </td>
                                                            <td className="py-4 px-6">
                                                                <div className="flex gap-2 flex-wrap">
                                                                    <ActionButton variant="primary" size="sm" onClick={() => handleViewOrder(order._id)}>
                                                                        <Eye className="w-4 h-4" />
                                                                        Xem
                                                                    </ActionButton>

                                                                    {order.status === "pending" && (
                                                                        <ActionButton variant="success" size="sm" onClick={() => updateOrderStatus(order._id, "confirmed")}>
                                                                            <CheckCircle className="w-4 h-4" />
                                                                            Xác nhận
                                                                        </ActionButton>
                                                                    )}

                                                                    {order.status === "confirmed" && (
                                                                        <ActionButton variant="warning" size="sm" onClick={() => updateOrderStatus(order._id, "shipping")}>
                                                                            <Truck className="w-4 h-4" />
                                                                            Giao hàng
                                                                        </ActionButton>
                                                                    )}

                                                                    {order.status === "shipping" && (
                                                                        <ActionButton
                                                                            variant="success"
                                                                            size="sm"
                                                                            onClick={() => updateOrderStatus(order._id, "delivered")}
                                                                        >
                                                                            <CheckCircle className="w-4 h-4" />
                                                                            Đã giao
                                                                        </ActionButton>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {totalItems > 0 && <Pagination />}
                    </>
                )}
            </div>
        </div>
    );
}

"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
    Edit,
    Trash2,
    Plus,
    Search,
    Filter,
    Mail,
    Shield,
    User as UserIcon,
    LogIn,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";

// ==========================
// Types
// ==========================
interface RawUser {
    _id: string;
    email: string | null;
    password?: string | null; // sẽ không hiển thị
    fullName: string | null;
    role: "admin" | "user" | null;
    isActive: boolean | null;
    googleId: string | null;
    avatar: string | null;
    lastLoginAt: string | null; // ISO
    lastLoginMethod: "google" | "local" | null;
    createdAt: string | null; // ISO
    updatedAt: string | null; // ISO
}

interface UiUser {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: "admin" | "user" | "unknown";
    activeState: "active" | "inactive" | "unknown"; // vì API có thể null
    authProvider: "google" | "local" | "unknown";
    lastLoginAt: string | null; // ISO
    createdAt: string | null; // ISO
}

// ==========================
// Helpers
// ==========================
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";
const ENDPOINT = `${API_BASE}/api/user/`;

function normalize(u: RawUser): UiUser {
    return {
        id: u._id,
        name: u.fullName?.trim() || "(Chưa cập nhật)",
        email: u.email || "—",
        avatar: u.avatar ?? null,
        role: u.role ?? "unknown",
        activeState:
            u.isActive === true ? "active" : u.isActive === false ? "inactive" : "unknown",
        authProvider: u.lastLoginMethod ?? (u.googleId ? "google" : "unknown"),
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
    };
}

function timeAgo(iso?: string | null) {
    if (!iso) return "—";
    const dt = new Date(iso);
    if (isNaN(dt.getTime())) return "—";
    const diff = Date.now() - dt.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 1) return "vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ngày trước`;
    return dt.toLocaleString("vi-VN");
}

function classNames(...xs: Array<string | false | undefined>) {
    return xs.filter(Boolean).join(" ");
}

// ==========================
// Components nhỏ
// ==========================
function ActionButton({
    onClick,
    variant = "primary",
    size = "sm",
    children,
    disabled = false,
}: {
    onClick?: () => void;
    variant?: "primary" | "success" | "danger" | "secondary" | "outline";
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
    disabled?: boolean;
}) {
    const base =
        "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const variants: Record<string, string> = {
        primary:
            "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-sm hover:shadow-md",
        success:
            "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500 shadow-sm hover:shadow-md",
        danger:
            "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm hover:shadow-md",
        secondary:
            "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-500 border border-gray-300",
        outline:
            "border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
    };
    const sizes: Record<string, string> = {
        sm: "px-3 py-2 text-sm",
        md: "px-4 py-2.5 text-sm",
        lg: "px-6 py-3 text-base",
    };
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${variants[variant]} ${sizes[size]}`}
        >
            {children}
        </button>
    );
}

function RoleBadge({ role }: { role: UiUser["role"] }) {
    const map: Record<UiUser["role"], { wrap: string; label: string; Icon: any }> = {
        admin: {
            wrap: "bg-purple-100 text-purple-700 border-purple-200",
            label: "Admin",
            Icon: Shield,
        },
        user: {
            wrap: "bg-blue-100 text-blue-700 border-blue-200",
            label: "User",
            Icon: UserIcon,
        },
        unknown: {
            wrap: "bg-gray-100 text-gray-700 border-gray-200",
            label: "—",
            Icon: UserIcon,
        },
    };
    const { wrap, label, Icon } = map[role];
    return (
        <span
            className={classNames(
                "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border",
                wrap
            )}
        >
            <Icon className="w-3 h-3" />
            {label}
        </span>
    );
}

function ProviderBadge({ provider }: { provider: UiUser["authProvider"] }) {
    const label = provider === "google" ? "Google" : provider === "local" ? "Local" : "—";
    return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-50 text-gray-700 border-gray-200">
            <LogIn className="w-3 h-3" />
            {label}
        </span>
    );
}

function StatusPill({ state }: { state: UiUser["activeState"] }) {
    if (state === "active")
        return (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                Hoạt động
            </span>
        );
    if (state === "inactive")
        return (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                Tạm dừng
            </span>
        );
    return (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200">
            Không rõ
        </span>
    );
}

function SkeletonRow() {
    return (
        <tr className="animate-pulse">
            <td className="py-4 px-6">
                <div className="space-y-2">
                    <div className="h-3 w-28 bg-gray-200 rounded" />
                    <div className="h-3 w-40 bg-gray-100 rounded" />
                </div>
            </td>
            <td className="py-4 px-6">
                <div className="h-3 w-40 bg-gray-200 rounded" />
            </td>
            <td className="py-4 px-6">
                <div className="h-3 w-20 bg-gray-200 rounded" />
            </td>
            <td className="py-4 px-6">
                <div className="h-3 w-24 bg-gray-200 rounded" />
            </td>
            <td className="py-4 px-6">
                <div className="h-3 w-24 bg-gray-200 rounded" />
            </td>
            <td className="py-4 px-6">
                <div className="h-8 w-28 bg-gray-200 rounded-full" />
            </td>
        </tr>
    );
}

// ==========================
// Main Component
// ==========================
export default function UserManagement() {
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"table" | "card">("table");
    const [list, setList] = useState<UiUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roleFilter, setRoleFilter] = useState<"all" | UiUser["role"]>("all");
    const [providerFilter, setProviderFilter] = useState<"all" | UiUser["authProvider"]>("all");

    // Fetch
    useEffect(() => {
        let abort = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(ENDPOINT, { cache: "no-store" });
                if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
                const data: RawUser[] = await res.json();
                if (abort) return;
                setList(data.map(normalize));
            } catch (e: any) {
                if (!abort) setError(e?.message || "Không thể tải dữ liệu");
            } finally {
                if (!abort) setLoading(false);
            }
        }
        load();
        return () => {
            abort = true;
        };
    }, []);

    // Derived list
    const filtered = useMemo(() => {
        const kw = search.trim().toLowerCase();
        return list
            .filter((u) => (roleFilter === "all" ? true : u.role === roleFilter))
            .filter((u) => (providerFilter === "all" ? true : u.authProvider === providerFilter))
            .filter((u) =>
                kw
                    ? (u.name + " " + u.email + " " + u.role + " " + u.authProvider)
                        .toLowerCase()
                        .includes(kw)
                    : true
            );
    }, [list, roleFilter, providerFilter, search]);

    // UI sub-components
    const UserCard = ({ user }: { user: UiUser }) => (
        <div
            className={
                classNames(
                    "bg-white rounded-2xl shadow-sm border transition-shadow duration-200 overflow-hidden",
                    user.activeState !== "active" && "opacity-80"
                )
            }
        >
            <div className="p-4">
                <div className="mb-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate mb-1">{user.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <RoleBadge role={user.role} />
                            <ProviderBadge provider={user.authProvider} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div>Lần đăng nhập gần nhất: {timeAgo(user.lastLoginAt)}</div>
                    <StatusPill state={user.activeState} />
                </div>

                <div className="flex gap-2">
                    <ActionButton variant="secondary" size="sm" onClick={() => console.log("Edit", user.id)}>
                        <Edit className="w-4 h-4" /> Sửa
                    </ActionButton>
                    <ActionButton variant="danger" size="sm" onClick={() => console.log("Delete", user.id)}>
                        <Trash2 className="w-4 h-4" /> Xóa
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
                            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Quản Lý Người Dùng</h1>
                        </div>
                        <ActionButton variant="success" size="lg" onClick={() => console.log("Add new user")}>
                            <Plus className="w-5 h-5" /> Thêm người dùng
                        </ActionButton>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
                        <div className="relative flex-1 max-w-xl">
                            <input
                                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-900"
                                placeholder="Tìm tên, email, vai trò, phương thức đăng nhập..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex gap-2">
                            <ActionButton
                                variant="outline"
                                size="md"
                                onClick={() => {
                                    setRoleFilter("all");
                                    setProviderFilter("all");
                                    setSearch("");
                                }}
                            >
                                <Filter className="w-4 h-4" />
                                <span className="hidden sm:inline">Xóa lọc</span>
                            </ActionButton>
                            {/* View mode */}
                            <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode("table")}
                                    className={classNames(
                                        "px-3 py-2 text-sm rounded-md transition-colors",
                                        viewMode === "table"
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    )}
                                >
                                    Bảng
                                </button>
                                <button
                                    onClick={() => setViewMode("card")}
                                    className={classNames(
                                        "px-3 py-2 text-sm rounded-md transition-colors",
                                        viewMode === "card"
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-600 hover:text-gray-900"
                                    )}
                                >
                                    Thẻ
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick filters */}
                    <div className="mt-3 flex flex-wrap gap-2">
                        <select
                            className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-900"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value as any)}
                        >
                            <option value="all">Tất cả vai trò</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                            <option value="unknown">Không rõ</option>
                        </select>
                        <select
                            className="px-3 py-2 text-sm border rounded-lg bg-white text-gray-900"
                            value={providerFilter}
                            onChange={(e) => setProviderFilter(e.target.value as any)}
                        >
                            <option value="all">Mọi phương thức đăng nhập</option>
                            <option value="google">Google</option>
                            <option value="local">Local</option>
                            <option value="unknown">Không rõ</option>
                        </select>
                        <button
                            onClick={() => {
                                setLoading(true);
                                fetch(ENDPOINT, { cache: "no-store" })
                                    .then((r) => r.json())
                                    .then((data: RawUser[]) => setList(data.map(normalize)))
                                    .catch((e) => setError(e?.message || "Không thể tải dữ liệu"))
                                    .finally(() => setLoading(false));
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50"
                        >
                            <RefreshCw className="w-4 h-4" /> Tải lại
                        </button>
                    </div>
                </div>

                {/* Error state */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 mt-0.5" />
                        <div>
                            <div className="font-semibold">Không tải được danh sách người dùng</div>
                            <div className="text-sm">{error}</div>
                            <div className="text-sm text-red-600/80 mt-1">
                                Hãy kiểm tra API tại <code className="bg-red-100 px-1 rounded">{ENDPOINT}</code>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                {loading ? (
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left py-4 px-6 font-medium text-gray-900">Người dùng</th>
                                        <th className="text-left py-4 px-6 font-medium text-gray-900">Email</th>
                                        <th className="text-left py-4 px-6 font-medium text-gray-900">Vai trò</th>
                                        <th className="text-left py-4 px-6 font-medium text-gray-900">Phương thức</th>
                                        <th className="text-left py-4 px-6 font-medium text-gray-900">Đăng nhập gần nhất</th>
                                        <th className="text-left py-4 px-6 font-medium text-gray-900">Trạng thái</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <SkeletonRow key={i} />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
                        <div className="text-gray-400 mb-4">
                            <UserIcon className="w-12 h-12 mx-auto mb-4" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy người dùng</h3>
                        <p className="text-gray-500">
                            Thử thay đổi từ khóa tìm kiếm, vai trò hoặc phương thức đăng nhập
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Cards */}
                        <div className="md:hidden grid gap-4">
                            {filtered.map((u) => (
                                <UserCard key={u.id} user={u} />
                            ))}
                        </div>

                        {/* Desktop */}
                        <div className="hidden md:block">
                            {viewMode === "card" ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filtered.map((u) => (
                                        <UserCard key={u.id} user={u} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Người dùng</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Email</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Vai trò</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Phương thức</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Đăng nhập gần nhất</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Trạng thái</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {filtered.map((u) => (
                                                    <tr
                                                        key={u.id}
                                                        className={
                                                            classNames(
                                                                "hover:bg-gray-50 transition-colors",
                                                                u.activeState !== "active" && "opacity-80"
                                                            )
                                                        }
                                                    >
                                                        <td className="py-4 px-6">
                                                            <div className="font-medium text-gray-900">{u.name}</div>
                                                        </td>
                                                        <td className="py-4 px-6 text-sm text-gray-700">{u.email}</td>
                                                        <td className="py-4 px-6">
                                                            <RoleBadge role={u.role} />
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <ProviderBadge provider={u.authProvider} />
                                                        </td>
                                                        <td className="py-4 px-6 text-sm text-gray-600">{timeAgo(u.lastLoginAt)}</td>
                                                        <td className="py-4 px-6">
                                                            <StatusPill state={u.activeState} />
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex gap-2">
                                                                <ActionButton
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    onClick={() => console.log("Edit", u.id)}
                                                                >
                                                                    <Edit className="w-4 h-4" /> Sửa
                                                                </ActionButton>
                                                                <ActionButton
                                                                    variant="danger"
                                                                    size="sm"
                                                                    onClick={() => console.log("Delete", u.id)}
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
                    </>
                )}

                {/* Footer summary */}
                {!loading && (
                    <div className="mt-6 text-center text-sm text-gray-500">
                        Hiển thị {filtered.length} người dùng{search ? ` cho "${search}"` : ""}
                    </div>
                )}
            </div>
        </div>
    );
}

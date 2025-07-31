"use client";
import React, { useState } from "react";
import { Edit, Trash2, Plus, Search, Filter, Mail, Phone, Shield, User } from "lucide-react";

// Mock data người dùng
const users = [
    {
        id: 1,
        avatar: "https://via.placeholder.com/60x60/3B82F6/FFFFFF?text=AN",
        name: "Nguyễn Văn An",
        email: "nguyenvana@email.com",
        phone: "0901234567",
        role: "Admin",
        department: "IT",
        joinDate: "2023-01-15",
        active: true,
    },
    {
        id: 2,
        avatar: "https://via.placeholder.com/60x60/10B981/FFFFFF?text=BL",
        name: "Trần Thị Bình",
        email: "tranthib@email.com",
        phone: "0912345678",
        role: "Manager",
        department: "Sales",
        joinDate: "2023-03-22",
        active: true,
    },
    {
        id: 3,
        avatar: "https://via.placeholder.com/60x60/F59E0B/FFFFFF?text=CD",
        name: "Lê Minh Cường",
        email: "leminhc@email.com",
        phone: "0923456789",
        role: "Employee",
        department: "Marketing",
        joinDate: "2023-05-10",
        active: false,
    },
    {
        id: 4,
        avatar: "https://via.placeholder.com/60x60/EF4444/FFFFFF?text=DH",
        name: "Phạm Thu Hương",
        email: "phamthuh@email.com",
        phone: "0934567890",
        role: "Manager",
        department: "HR",
        joinDate: "2023-02-08",
        active: true,
    },
    {
        id: 5,
        avatar: "https://via.placeholder.com/60x60/8B5CF6/FFFFFF?text=EK",
        name: "Võ Đình Khang",
        email: "vodinhk@email.com",
        phone: "0945678901",
        role: "Employee",
        department: "Finance",
        joinDate: "2023-06-18",
        active: true,
    },
];

export default function UserManagement() {
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState("table");
    const [userList, setUserList] = useState(users);
    
    const filtered = userList.filter(
        (user) =>
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.role.toLowerCase().includes(search.toLowerCase()) ||
            user.department.toLowerCase().includes(search.toLowerCase())
    );

    const toggleActive = (userId) => {
        setUserList(prev => prev.map(user => 
            user.id === userId 
                ? { ...user, active: !user.active }
                : user
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

    const getRoleBadge = (role) => {
        const roleStyles = {
            Admin: "bg-purple-100 text-purple-700 border-purple-200",
            Manager: "bg-blue-100 text-blue-700 border-blue-200", 
            Employee: "bg-green-100 text-green-700 border-green-200"
        };
        
        const roleIcons = {
            Admin: Shield,
            Manager: User,
            Employee: User
        };
        
        const Icon = roleIcons[role] || User;
        
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${roleStyles[role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                <Icon className="w-3 h-3" />
                {role}
            </span>
        );
    };

    const UserCard = ({ user }) => (
        <div className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200 overflow-hidden ${!user.active ? 'opacity-75' : ''}`}>
            <div className="p-4">
                <div className="flex items-start gap-3 mb-4">
                    <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate mb-1">{user.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                            <Mail className="w-3 h-3" />
                            <span className="truncate">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Phone className="w-3 h-3" />
                            <span>{user.phone}</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                    {getRoleBadge(user.role)}
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                        {user.department}
                    </span>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-500">
                        Tham gia: {new Date(user.joinDate).toLocaleDateString('vi-VN')}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Trạng thái:</span>
                        <ToggleSwitch 
                            isActive={user.active}
                            onToggle={() => toggleActive(user.id)}
                        />
                        <span className={`text-xs font-medium ${user.active ? 'text-green-600' : 'text-gray-500'}`}>
                            {user.active ? 'Hoạt động' : 'Tạm dừng'}
                        </span>
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <ActionButton 
                        variant="secondary" 
                        size="sm"
                        onClick={() => console.log('Edit user:', user.id)}
                    >
                        <Edit className="w-4 h-4" />
                        Sửa
                    </ActionButton>
                    <ActionButton 
                        variant="danger" 
                        size="sm"
                        onClick={() => console.log('Delete user:', user.id)}
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
                                Quản Lý Người Dùng
                            </h1>
                            <p className="text-gray-600">
                                Quản lý thông tin và quyền hạn của người dùng trong hệ thống
                            </p>
                        </div>
                        <ActionButton
                            variant="success"
                            size="lg"
                            onClick={() => console.log('Add new user')}
                        >
                            <Plus className="w-5 h-5" />
                            Thêm người dùng
                        </ActionButton>
                    </div>

                    {/* Search and Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                        <div className="relative flex-1 max-w-md">
                            <input
                                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Tìm kiếm người dùng, email, vai trò..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                            <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                        </div>
                        
                        <div className="flex gap-2">
                            <ActionButton
                                variant="outline"
                                size="md"
                                onClick={() => console.log('Filter users')}
                            >
                                <Filter className="w-4 h-4" />
                                <span className="hidden sm:inline">Lọc</span>
                            </ActionButton>
                            
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
                            <User className="w-12 h-12 mx-auto mb-4" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Không tìm thấy người dùng
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
                                {filtered.map((user) => (
                                    <UserCard key={user.id} user={user} />
                                ))}
                            </div>
                        </div>

                        {/* Desktop Table/Card View */}
                        <div className="hidden md:block">
                            {viewMode === "card" ? (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {filtered.map((user) => (
                                        <UserCard key={user.id} user={user} />
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b">
                                                <tr>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Người dùng</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Liên hệ</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Vai trò</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Phòng ban</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Ngày tham gia</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Trạng thái</th>
                                                    <th className="text-left py-4 px-6 font-medium text-gray-900">Thao tác</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {filtered.map((user) => (
                                                    <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${!user.active ? 'opacity-60' : ''}`}>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <img 
                                                                    src={user.avatar} 
                                                                    alt={user.name} 
                                                                    className="w-10 h-10 rounded-full object-cover"
                                                                />
                                                                <div>
                                                                    <div className="font-medium text-gray-900">{user.name}</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="text-sm">
                                                                <div className="flex items-center gap-1 text-gray-900 mb-1">
                                                                    <Mail className="w-3 h-3" />
                                                                    {user.email}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-gray-500">
                                                                    <Phone className="w-3 h-3" />
                                                                    {user.phone}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            {getRoleBadge(user.role)}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                                                                {user.department}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 px-6 text-sm text-gray-600">
                                                            {new Date(user.joinDate).toLocaleDateString('vi-VN')}
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex items-center gap-3">
                                                                <ToggleSwitch 
                                                                    isActive={user.active}
                                                                    onToggle={() => toggleActive(user.id)}
                                                                />
                                                                <span className={`text-sm font-medium ${user.active ? 'text-green-600' : 'text-gray-500'}`}>
                                                                    {user.active ? 'Hoạt động' : 'Tạm dừng'}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <div className="flex gap-2">
                                                                <ActionButton 
                                                                    variant="secondary" 
                                                                    size="sm"
                                                                    onClick={() => console.log('Edit user:', user.id)}
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                    Sửa
                                                                </ActionButton>
                                                                <ActionButton 
                                                                    variant="danger" 
                                                                    size="sm"
                                                                    onClick={() => console.log('Delete user:', user.id)}
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
                        Hiển thị {filtered.length} người dùng
                        {search && ` cho "${search}"`}
                    </div>
                )}
            </div>
        </div>
    );
}
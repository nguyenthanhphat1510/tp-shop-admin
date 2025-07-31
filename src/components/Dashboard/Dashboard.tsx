import React from "react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { BarChart2, ShoppingCart, Users, LayoutDashboard, Plus, FileEdit } from "lucide-react";

// Mock data
const metrics = [
    { title: "Doanh Thu Hôm Nay", value: "12.500.000₫", percent: 12, icon: <BarChart2 className="w-6 h-6" /> },
    { title: "Đơn Hàng Mới", value: "120", percent: 5, icon: <ShoppingCart className="w-6 h-6" /> },
    { title: "Người Dùng Mới", value: "35", percent: -2, icon: <Users className="w-6 h-6" /> },
    { title: "Lượt Truy Cập", value: "2.340", percent: 8, icon: <LayoutDashboard className="w-6 h-6" /> },
];

const revenueData = [
    { name: "T2", doanhthu: 2 },
    { name: "T3", doanhthu: 3 },
    { name: "T4", doanhthu: 2.5 },
    { name: "T5", doanhthu: 4 },
    { name: "T6", doanhthu: 3.5 },
    { name: "T7", doanhthu: 5 },
    { name: "CN", doanhthu: 4.2 },
];

const pieData = [
    { name: "Áo Thun", value: 400 },
    { name: "Quần Jean", value: 300 },
    { name: "Giày", value: 300 },
    { name: "Phụ Kiện", value: 200 },
];
const pieColors = ["#34d399", "#60a5fa", "#fbbf24", "#f87171"];

const recentOrders = [
    { customer: "Nguyễn Văn A", product: "Áo Thun", time: "10 phút trước" },
    { customer: "Trần Thị B", product: "Quần Jean", time: "30 phút trước" },
    { customer: "Lê Văn C", product: "Giày Sneaker", time: "1 giờ trước" },
    { customer: "Phạm Thị D", product: "Phụ Kiện", time: "2 giờ trước" },
];

export default function Dashboard() {
    return (
        <div className="p-8 flex-1">
            <h1 className="text-2xl font-bold mb-6">Tổng Quan</h1>
            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {metrics.map((m, i) => (
                    <div key={i} className="bg-white rounded-lg shadow p-5 flex items-center gap-4">
                        <div className="bg-blue-100 text-blue-600 rounded-full p-3">{m.icon}</div>
                        <div>
                            <div className="text-sm text-gray-500">{m.title}</div>
                            <div className="text-xl font-bold">{m.value}</div>
                            <div className={`text-xs flex items-center gap-1 ${m.percent >= 0 ? "text-green-500" : "text-red-500"}`}>
                                {m.percent >= 0 ? "+" : ""}{m.percent}% so với hôm qua
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-5 col-span-2">
                    <div className="font-semibold mb-2">Biểu đồ Doanh Thu 7 ngày</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={revenueData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="doanhthu" stroke="#2563eb" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-lg shadow p-5">
                    <div className="font-semibold mb-2">Cơ Cấu Sản Phẩm</div>
                    <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={80} label>
                                {pieData.map((entry, idx) => (
                                    <Cell key={entry.name} fill={pieColors[idx % pieColors.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
            {/* Recent Orders & Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-5 col-span-2">
                    <div className="font-semibold mb-2">Hoạt Động Gần Đây</div>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500">
                                <th className="py-2">Khách Hàng</th>
                                <th>Sản Phẩm</th>
                                <th>Thời Gian</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentOrders.map((o, i) => (
                                <tr key={i} className="border-t">
                                    <td className="py-2">{o.customer}</td>
                                    <td>{o.product}</td>
                                    <td>{o.time}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-white rounded-lg shadow p-5 flex flex-col gap-4">
                    <div className="font-semibold mb-2">Lối Tắt</div>
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        <Plus className="w-4 h-4" /> Thêm Sản Phẩm
                    </button>
                    <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        <FileEdit className="w-4 h-4" /> Viết Bài Mới
                    </button>
                </div>
            </div>
        </div>
    );
}
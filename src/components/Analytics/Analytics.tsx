"use client";
import React, { useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, 
  Package, Calendar, Download, Filter 
} from "lucide-react";

// Mock data
const revenueData = [
  { month: "T1", revenue: 45000000, orders: 1200, customers: 340 },
  { month: "T2", revenue: 52000000, orders: 1350, customers: 410 },
  { month: "T3", revenue: 48000000, orders: 1180, customers: 380 },
  { month: "T4", revenue: 61000000, orders: 1520, customers: 450 },
  { month: "T5", revenue: 55000000, orders: 1380, customers: 420 },
  { month: "T6", revenue: 67000000, orders: 1650, customers: 520 },
  { month: "T7", revenue: 58000000, orders: 1420, customers: 460 },
  { month: "T8", revenue: 72000000, orders: 1780, customers: 580 },
  { month: "T9", revenue: 69000000, orders: 1690, customers: 550 },
  { month: "T10", revenue: 78000000, orders: 1920, customers: 620 },
  { month: "T11", revenue: 85000000, orders: 2100, customers: 680 },
  { month: "T12", revenue: 92000000, orders: 2280, customers: 750 },
];

const categoryData = [
  { name: "Áo", value: 35, color: "#3B82F6" },
  { name: "Quần", value: 25, color: "#10B981" },
  { name: "Giày", value: 20, color: "#F59E0B" },
  { name: "Phụ kiện", value: 15, color: "#EF4444" },
  { name: "Khác", value: 5, color: "#8B5CF6" },
];

const topProducts = [
  { name: "Áo Thun Basic", sales: 1240, revenue: "310.000.000₫" },
  { name: "Quần Jean Slim", sales: 980, revenue: "441.000.000₫" },
  { name: "Giày Sneaker", sales: 750, revenue: "675.000.000₫" },
  { name: "Áo Khoác Hoodie", sales: 650, revenue: "247.000.000₫" },
  { name: "Váy Suông", sales: 520, revenue: "166.400.000₫" },
];

const metrics = [
  {
    title: "Tổng Doanh Thu",
    value: "758.500.000₫",
    change: "+12.5%",
    trend: "up",
    icon: <DollarSign className="w-6 h-6" />,
    color: "blue"
  },
  {
    title: "Số Đơn Hàng",
    value: "18.970",
    change: "+8.2%",
    trend: "up",
    icon: <ShoppingCart className="w-6 h-6" />,
    color: "green"
  },
  {
    title: "Khách Hàng Mới",
    value: "6.180",
    change: "+15.3%",
    trend: "up",
    icon: <Users className="w-6 h-6" />,
    color: "purple"
  },
  {
    title: "Sản Phẩm Đã Bán",
    value: "4.135",
    change: "-2.1%",
    trend: "down",
    icon: <Package className="w-6 h-6" />,
    color: "orange"
  },
];

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("12months");

  return (
    <div className="p-4 sm:p-8 flex-1 bg-gray-50">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Báo Cáo & Phân Tích</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
            <option value="12months">12 tháng qua</option>
            <option value="year">Năm nay</option>
          </select>
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            <Download className="w-4 h-4" /> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-full bg-${metric.color}-100 text-${metric.color}-600`}>
                {metric.icon}
              </div>
              <div className={`flex items-center text-sm ${
                metric.trend === "up" ? "text-green-500" : "text-red-500"
              }`}>
                {metric.trend === "up" ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                {metric.change}
              </div>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">{metric.title}</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Doanh Thu Theo Tháng</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`${(value / 1000000).toFixed(1)}M`, "Doanh thu (₫)"]} />
              <Area type="monotone" dataKey="revenue" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Doanh Thu Theo Danh Mục</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Số Đơn Hàng & Khách Hàng Mới</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="orders" fill="#10B981" name="Đơn hàng" />
            <Bar dataKey="customers" fill="#F59E0B" name="Khách hàng mới" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Products Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Top Sản Phẩm Bán Chạy</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white" style={{ backgroundColor: "#374151" }}>
                <th className="py-2 px-4">Sản Phẩm</th>
                <th>Số Lượng Bán</th>
                <th>Doanh Thu</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.map((product, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-4 font-medium">{product.name}</td>
                  <td>{product.sales.toLocaleString()}</td>
                  <td>{product.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

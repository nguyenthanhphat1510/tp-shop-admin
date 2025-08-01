"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Package, ShoppingCart, BarChart2, Settings,
} from "lucide-react";

// Danh sách menu điều hướng
const navs = [
  { label: "Tổng Quan", icon: <LayoutDashboard className="w-5 h-5" />, page: "dashboard", href: "/" },
  { label: "Người Dùng", icon: <Users className="w-5 h-5" />, page: "users", href: "/users" },
  { label: "Sản Phẩm", icon: <Package className="w-5 h-5" />, page: "products", href: "/products" },
  { label: "Đơn Hàng", icon: <ShoppingCart className="w-5 h-5" />, page: "orders", href: "/orders" },
  { label: "Báo Cáo", icon: <BarChart2 className="w-5 h-5" />, page: "analytics", href: "/analytics" },
  { label: "Cài Đặt", icon: <Settings className="w-5 h-5" />, page: "settings", href: "/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-64 flex flex-col z-10"
      style={{
        background: "linear-gradient(5deg, #cb1c22 67.61%, #d9503f 95.18%)",
        position: "relative",
      }}
    >
      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(255,255,255,0.15)",
        zIndex: 0,
      }} />
      <div className="relative z-10 h-16 flex items-center justify-center border-b border-white/20 font-bold text-xl tracking-wide text-white">
        TPSHOP Admin
      </div>
      <nav className="relative z-10 flex-1 py-4">
        {navs.map(n => (
          <Link
            key={n.page}
            href={n.href}
            className={`flex items-center gap-3 px-6 py-3 w-full text-left rounded transition 
              ${pathname === n.href
                ? "bg-white/20 text-white font-semibold"
                : "text-white/80 hover:bg-white/10"}`}
          >
            {n.icon}
            <span>{n.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
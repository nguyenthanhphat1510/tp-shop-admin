"use client";
import React, { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart2, CalendarRange, Download, Printer, RefreshCw, AlertTriangle } from "lucide-react";

// ==========================
// Config
// ==========================
const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/$/, "");

// Đơn vị số liệu server trả về: 'dong' | 'million'
const REVENUE_SERVER_UNIT: "dong" | "million" = "million";
const UNIT_MULTIPLIER = REVENUE_SERVER_UNIT === "million" ? 1_000_000 : 1;

// ==========================
// Utilities
// ==========================
const VND = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" });

function downloadCSV(filename: string, rows: any[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function printNode(node: HTMLElement | null) {
  if (!node) return;
  const w = window.open("", "print");
  if (!w) return;
  w.document.write(`<!doctype html><html><head><title>Báo cáo</title>
  <style>
    *{box-sizing:border-box} body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Inter,Helvetica,Arial,sans-serif;padding:24px}
    h1{font-size:20px;margin:0 0 12px}
    .card{border:1px solid #e5e7eb;border-radius:16px;padding:16px;margin-bottom:16px}
    table{width:100%;border-collapse:collapse}
    th,td{border-top:1px solid #e5e7eb;padding:8px;text-align:left;font-size:12px}
  </style>
  </head><body>${node!.outerHTML}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
  w.close();
}

// ==========================
// Data helpers
// ==========================
const REVENUE_KEY = "doanhthu";

// Đọc giá trị doanh thu từ response và quy về VND đúng đơn vị
function getRevenueFromAPI(obj: any) {
  const v =
    Number(
      obj?.[REVENUE_KEY] ??
        obj?.revenue ??
        obj?.Revenue ??
        obj?.doanhThu ??
        obj?.DoanhThu ??
        0
    ) || 0;
  return v * UNIT_MULTIPLIER; // quy về đồng
}

function normalizeRevenueData(data: any[]) {
  if (!Array.isArray(data)) return [];

  // Trường hợp API trả 1 object không có name
  if (data.length === 1 && !data[0].name) {
    const revenueVND = getRevenueFromAPI(data[0]);
    return [{ name: "Tổng", [REVENUE_KEY]: revenueVND }];
  }

  return data.map((item) => ({
    name: item?.name ?? "Không xác định",
    [REVENUE_KEY]: getRevenueFromAPI(item), // đã là VND
    ...item,
  }));
}

const WEEK_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const YEAR_LABELS = ["T1", "T2", "T3", "T4", "T5", "T6", "T7", "T8", "T9", "T10", "T11", "T12"];

// Các hàm pad sử dụng trực tiếp doanhthu đã là VND, KHÔNG nhân lại
function padWeek(rows: any[]) {
  const map = new Map(rows.map((r) => [r.name, Number(r[REVENUE_KEY]) || 0]));
  return WEEK_LABELS.map((n) => ({ name: n, [REVENUE_KEY]: Number(map.get(n) ?? 0) }));
}
function padDay(rows: any[]) {
  const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
  const map = new Map(rows.map((r) => [r.name, Number(r[REVENUE_KEY]) || 0]));
  return hours.map((h) => ({ name: h, [REVENUE_KEY]: Number(map.get(h) ?? 0) }));
}
function padMonth(rows: any[], baseDate?: string) {
  const base = baseDate ? new Date(baseDate) : new Date();
  const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const map = new Map(rows.map((r) => [String(Number(r.name)), Number(r[REVENUE_KEY]) || 0]));
  return Array.from({ length: daysInMonth }, (_, i) => {
    const d = String(i + 1);
    return { name: d, [REVENUE_KEY]: Number(map.get(d) ?? 0) };
  });
}
function padYear(rows: any[]) {
  const map = new Map(rows.map((r) => [r.name, Number(r[REVENUE_KEY]) || 0]));
  return YEAR_LABELS.map((m) => ({ name: m, [REVENUE_KEY]: Number(map.get(m) ?? 0) }));
}

// ===== Date helpers =====
function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function getDefaultRange(range: string) {
  const now = new Date();
  if (range === "day") {
    const ymd = toYMD(now);
    return { from: ymd, to: ymd };
  }
  if (range === "week") {
    const d = new Date(now);
    const day = (d.getDay() + 6) % 7; // Monday=0
    const monday = new Date(d);
    monday.setDate(d.getDate() - day);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return { from: toYMD(monday), to: toYMD(sunday) };
  }
  if (range === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: toYMD(start), to: toYMD(end) };
  }
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear(), 11, 31);
  return { from: toYMD(start), to: toYMD(end) };
}

// ================== UI Bits ==================
function Segment({
  value,
  onChange,
  mounted,
}: {
  value: string;
  onChange: (v: string) => void;
  mounted: boolean;
}) {
  const items = [
    { key: "day", label: "Ngày" },
    { key: "week", label: "Tuần" },
    { key: "month", label: "Tháng" },
    { key: "year", label: "Năm" },
  ];

  if (!mounted) {
    return (
      <div className="inline-flex rounded-2xl bg-gray-100 p-1">
        <div className="h-8 w-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="inline-flex rounded-2xl bg-gray-100 p-1">
      {items.map((it) => (
        <button
          key={it.key}
          onClick={() => onChange(it.key)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
            value === it.key ? "bg-white shadow text-gray-900" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function SectionCard({
  title,
  right,
  children,
  className = "",
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">{title}</div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />;
}

// ================== Main ==================
export default function DashboardManagement() {
  const [range, setRange] = useState("week");
  const [mounted, setMounted] = useState(false);

  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [apiLoading, setApiLoading] = useState(false);
  const [error, setError] = useState("");

  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);

  const reportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    const { signal } = ac;

    async function load() {
      setApiLoading(true);
      setError("");
      try {
        const def = getDefaultRange(range);
        const from = (customFrom || def.from).trim();
        const to = (customTo || def.to).trim();

        // Revenue
        let padded: any[] = [];
        try {
          const qsRev = new URLSearchParams({ from, to });
          const url = `${API_BASE}/reports/revenue/?${qsRev.toString()}`;

          console.groupCollapsed("%c[API] GET revenue", "color:#2563eb;font-weight:bold;");
          console.log("URL:", url);

          const response = await fetch(url, {
            signal,
            cache: "no-store",
          });

          console.log("Status:", response.status, response.statusText, "OK:", response.ok);

          const raw = await response.clone().text();
          console.log("Raw body:", raw);

          let parsed: any = null;
          try {
            parsed = JSON.parse(raw);
            console.log("Parsed JSON:", parsed);
          } catch (err) {
            console.warn("Body is not valid JSON:", err);
          }

          if (response.ok) {
            const rev = parsed ?? (await response.json());
            const rawData = rev?.data ?? rev;
            const normalized = normalizeRevenueData(rawData);
            console.log("Normalized:", normalized);

            // Nếu chỉ có 1 điểm "Tổng", tạo dữ liệu giả cho chart (đã là VND)
            if (normalized.length === 1 && normalized[0].name === "Tổng") {
              const totalVND = Number(normalized[0][REVENUE_KEY]) || 0;

              if (range === "week") {
                padded = WEEK_LABELS.map((day, index) => ({
                  name: day,
                  [REVENUE_KEY]: index === 1 ? totalVND : 0, // đặt ở T3
                }));
              } else if (range === "day") {
                padded = Array.from({ length: 24 }, (_, i) => ({
                  name: `${String(i).padStart(2, "0")}:00`,
                  [REVENUE_KEY]: i === 10 ? totalVND : 0, // 10h
                }));
              } else if (range === "month") {
                const daysInMonth = new Date(new Date(from).getFullYear(), new Date(from).getMonth() + 1, 0).getDate();
                padded = Array.from({ length: daysInMonth }, (_, i) => ({
                  name: String(i + 1),
                  [REVENUE_KEY]: i === 10 ? totalVND : 0, // ngày 11
                }));
              } else {
                padded = YEAR_LABELS.map((month, index) => ({
                  name: month,
                  [REVENUE_KEY]: index === 7 ? totalVND : 0, // tháng 8
                }));
              }
            } else {
              if (range === "week") padded = padWeek(normalized);
              if (range === "day") padded = padDay(normalized);
              if (range === "month") padded = padMonth(normalized, from);
              if (range === "year") padded = padYear(normalized);
            }
          } else {
            throw new Error(`${response.status} ${response.statusText}`);
          }

          console.groupEnd();
        } catch (e: any) {
          console.groupCollapsed("%c[API] GET revenue FAILED", "color:#dc2626;font-weight:bold;");
          console.warn("Error:", e?.message || e);
          console.groupEnd();

          if (range === "week") padded = padWeek([]);
          if (range === "day") padded = padDay([]);
          if (range === "month") padded = padMonth([], from);
          if (range === "year") padded = padYear([]);
        }

        setRevenueData(padded);

        // Tổng doanh thu (VND) đúng theo UI
        const sumVND = padded.reduce((s, d) => s + (Number(d[REVENUE_KEY]) || 0), 0);
        console.log("[Revenue] Total (VND):", sumVND);
        setTotalRevenue(sumVND);
      } catch (e: any) {
        console.warn("Dashboard load failed:", e.message);
        setError(e.message || "Không thể tải dữ liệu");
      } finally {
        setApiLoading(false);
      }
    }

    if (mounted) load();
    return () => ac.abort();
  }, [range, customFrom, customTo, mounted]);

  const handleExportCSV = () => {
    const rows = [["Nhãn", "Doanh thu (VND)"]].concat(revenueData.map((d) => [d.name, Number(d[REVENUE_KEY]) || 0]));
    downloadCSV(`revenue_${range}.csv`, rows);
  };

  const handlePrint = () => {
    if (reportRef.current) printNode(reportRef.current);
  };

  const reload = () => setRange((r) => r);

  if (!mounted) {
    return (
      <div className="ml-64 p-6 lg:p-8 flex-1 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-2xl font-bold">Tổng Quan Doanh Thu</h1>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-2xl bg-gray-100 p-1">
              <div className="h-8 w-64 bg-gray-200 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 p-6 lg:p-8 flex-1 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold">Tổng Quan Doanh Thu</h1>
        <div className="flex items-center gap-3">
          <Segment value={range} onChange={setRange} mounted={mounted} />
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <CalendarRange className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="border rounded-lg px-2 py-1 bg-white text-gray-900"
            />
            <span className="text-gray-400">—</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border rounded-lg px-2 py-1 bg-white text-gray-900"
            />
          </div>
          <button onClick={reload} className="inline-flex items-center gap-2 bg-white border px-3 py-2 rounded-xl text-sm">
            <RefreshCw className="w-4 h-4" /> Làm mới
          </button>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-2 rounded-xl"
          >
            <Download className="w-4 h-4" /> Xuất CSV
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 bg-white border px-3 py-2 rounded-xl text-sm"
            title="In báo cáo"
          >
            <Printer className="w-4 h-4" /> In
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 p-3 rounded-xl">
          <AlertTriangle className="w-4 h-4" />
          <span>Lỗi: {error}</span>
        </div>
      )}

      {/* Metric: Tổng Doanh Thu */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" ref={reportRef}>
        {apiLoading && revenueData.length === 0 ? (
          Array.from({ length: 1 }).map((_, i) => <Skeleton key={i} className="h-24" />)
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
            <div className="bg-blue-100 text-blue-600 rounded-full p-3">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs text-gray-500">{range === "day" ? "Doanh Thu Hôm Nay" : "Tổng Doanh Thu"}</div>
              <div className="text-xl text-gray-500 font-bold">{VND.format(totalRevenue)}</div>
              <div className="text-[10px] text-gray-400">
                ĐV hiển thị: VND (server: {REVENUE_SERVER_UNIT === "million" ? "triệu" : "đồng"})
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Revenue Chart */}
      <SectionCard
        title={`Biểu đồ Doanh Thu theo ${
          range === "day" ? "giờ" : range === "week" ? "ngày" : range === "month" ? "ngày trong tháng" : "tháng trong năm"
        }`}
        right={<span className="text-xs text-gray-500">ĐV: VND</span>}
      >
        <div className="h-[300px]">
          {apiLoading && revenueData.length === 0 ? (
            <Skeleton className="h-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueData}>
                <XAxis dataKey="name" tickMargin={8} />
                <YAxis tickFormatter={(v) => VND.format(Number(v)).replace("₫", "")} />
                <Tooltip formatter={(v: number) => VND.format(v)} labelFormatter={(label) => `Thời điểm: ${label}`} />
                <Line type="monotone" dataKey={REVENUE_KEY} stroke="#2563eb" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionCard>

      <div className="text-xs text-gray-500 mt-2">
        <p>
          <strong>API:</strong> <code>GET {API_BASE}/reports/revenue/?from=YYYY-MM-DD&amp;to=YYYY-MM-DD</code>
        </p>
      </div>
    </div>
  );
}

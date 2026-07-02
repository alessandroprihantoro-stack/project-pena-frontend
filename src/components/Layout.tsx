import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth, type UserRole } from "../context/AuthContext";

// MENGIMPOR ASET VERBATIM DARI FOLDER ASSETS:
import logoPena from "../assets/logo_pena.png";
import logoJateng from "../assets/logo_jateng.png";
import bannerPena from "../assets/banner_pena.png";

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

export default function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // === MESIN SAKLAR TEMA PENA ===
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('pena_theme');
    return savedTheme ? savedTheme === 'dark' : true; 
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('bg-grid-pattern', 'light');
      localStorage.setItem('pena_theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.classList.add('bg-grid-pattern', 'light');
      localStorage.setItem('pena_theme', 'light');
    }
  }, [isDarkMode]);
  // ==============================

  // Otak Pemisah Kamar (Menu Sidebar menyesuaikan KTP)
  const getNavigation = (role?: UserRole): NavItem[] => {
    switch (role) {
      case "ADMIN":
        return [
          { name: "Pusat Kendali", path: "/admin/dashboard", icon: "⚡" },
          { name: "Kurasi Praktik Baik", path: "/admin/praktik-baik", icon: "💡" },
          { name: "Otoritas Pengawas", path: "/admin/pengawas", icon: "🛡️" },
          { name: "Institusi Sekolah", path: "/admin/sekolah", icon: "🏫" },
        ];
      case "PENGAWAS":
        return [
          { name: "Pusat Komando", path: "/pengawas/dashboard", icon: "🎯" },
          { name: "Sekolah Binaan", path: "/pengawas/sekolah", icon: "📁" },
          { name: "Log Jurnal Diri", path: "/pengawas/profil", icon: "📝" },
        ];
      case "SEKOLAH":
        return [
          { name: "Dasbor Sekolah", path: "/sekolah/dashboard", icon: "📊" },
          { name: "Dapur Input Data", path: "/sekolah/manajemen", icon: "⚙️" },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavigation(profile?.role);

  const handleKeluar = async () => {
    await logout();
    navigate("/login");
  };

  // Komponen Helper: Isi Sidebar agar tidak di-copy-paste 2x untuk Desktop & Mobile
  const SidebarContent = () => (
    <>
      {/* BRANDING LOGO */}
      <div className={`h-20 flex items-center gap-3.5 px-6 border-b shrink-0 transition-colors ${
        isDarkMode ? "border-slate-800/80 bg-slate-950/40" : "border-black border-b-4 bg-yellow-400"
      }`}>
        <img src={logoJateng} alt="Jateng" className="h-9 w-auto object-contain drop-shadow" />
        <div className={`h-6 w-px ${isDarkMode ? "bg-slate-800" : "bg-black w-0.5"}`} />
        <img src={logoPena} alt="PENA" className="h-7 w-auto object-contain drop-shadow" />
      </div>

      {/* KARTU IDENTITAS PENGGUNA */}
      <div className={`p-4 mx-3 my-4 rounded-2xl relative overflow-hidden shrink-0 transition-colors ${
        isDarkMode 
          ? "bg-linear-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 shadow-inner" 
          : "bg-purple-600 border-2 border-black shadow-neo"
      }`}>
        {isDarkMode && <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />}
        <div className="flex items-center gap-3 relative z-10">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className={`w-11 h-11 rounded-xl object-cover shrink-0 bg-white p-0.5 ${isDarkMode ? "border border-cyan-400" : "border-2 border-black"}`} />
          ) : (
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-slate-950 font-black text-base shadow-md shrink-0 font-mono ${isDarkMode ? "bg-linear-to-tr from-cyan-500 to-indigo-500" : "bg-yellow-400 border-2 border-black"}`}>
              {profile?.nama_lengkap?.[0] || "P"}
            </div>
          )}
          <div className="overflow-hidden">
            <h4 className={`text-xs font-black truncate ${isDarkMode ? "text-slate-100" : "text-white"}`}>
              {profile?.nama_lengkap || "Pengguna Sistem"}
            </h4>
            <span className={`text-[10px] font-mono font-bold uppercase tracking-wider block mt-0.5 ${isDarkMode ? "text-cyan-400" : "text-yellow-300"}`}>
              Lencana: {profile?.role || "GUEST"}
            </span>
          </div>
        </div>
      </div>

      {/* MENU NAVIGASI DINAMIS */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        <div className={`px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider ${isDarkMode ? "text-slate-500" : "text-slate-700"}`}>
          Menu Utama
        </div>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl text-xs transition-all duration-200
              ${isDarkMode 
                ? (isActive ? 'bg-linear-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 translate-x-1 font-bold' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 font-bold')
                : (isActive ? 'bg-white text-black border-2 border-black shadow-neo translate-x-1 font-black' : 'text-slate-700 hover:bg-white hover:border-2 hover:border-black hover:shadow-neo font-bold border-2 border-transparent')
              }
            `}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.name}</span>
          </NavLink>
        ))}

        {/* UCAPAN SELAMAT DATANG */}
        <div className="pt-6 pb-2">
          <div className={`mx-1 p-4 rounded-2xl text-center relative overflow-hidden transition-colors ${
            isDarkMode 
              ? "bg-linear-to-b from-slate-900/90 to-slate-950/90 border border-cyan-500/30 shadow-[0_0_25px_rgba(0,242,254,0.1)] group hover:border-purple-500/40"
              : "bg-white border-2 border-black shadow-neo"
          }`}>
            {isDarkMode && <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all duration-700 pointer-events-none" />}
            
            <div className="relative z-10 space-y-1.5">
              <span className={`text-[9px] font-mono font-bold uppercase tracking-widest block ${isDarkMode ? "text-slate-500" : "text-slate-400"}`}>
                • PENA Enterprise OS •
              </span>
              <div className="py-0.5">
                <span className={`font-black text-xs tracking-wider uppercase block ${isDarkMode ? "teks-ai-pena" : "text-black"}`}>
                  Selamat Datang di PENA
                </span>
              </div>
              <p className={`text-[9px] font-sans leading-relaxed italic ${isDarkMode ? "text-slate-400" : "text-slate-600"}`}>
                "Education Intelligence & AI Decision Support System"
              </p>
            </div>
          </div>
        </div>
      </nav>

      {/* BANNER ASET DI FOOTER SIDEBAR */}
      <div className={`p-3 m-3 rounded-2xl text-center relative overflow-hidden group shrink-0 transition-colors ${
        isDarkMode ? "bg-slate-950/60 border border-slate-800/80" : "bg-white border-2 border-black shadow-neo"
      }`}>
        <img src={bannerPena} alt="Banner" className="w-full h-auto object-contain rounded-xl mb-1.5 opacity-85 group-hover:opacity-100 transition-opacity max-h-20" />
        <span className={`text-[9px] font-mono block ${isDarkMode ? "text-slate-500" : "text-slate-700 font-bold"}`}>PENA Enterprise OS v2.0</span>
      </div>

      {/* TOMBOL KELUAR */}
      <div className={`p-3 border-t shrink-0 transition-colors ${
        isDarkMode ? "border-slate-800/80 bg-slate-950/20" : "border-black border-t-4 bg-white"
      }`}>
        <button
          onClick={handleKeluar}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all active:scale-95 cursor-pointer ${
            isDarkMode
              ? "text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 border border-rose-500/20"
              : "bg-rose-500 text-white border-2 border-black shadow-neo hover:-translate-y-0.5 hover:shadow-neo-md"
          }`}
        >
          <span>🚪</span> Keluar dari Markas
        </button>
      </div>
    </>
  );

  return (
    <div className={`min-h-screen flex font-sans selection:bg-cyan-500 selection:text-white relative overflow-hidden transition-colors duration-300 ${
      isDarkMode ? "bg-slate-950 text-slate-100" : "bg-transparent text-black"
    }`}>
      
      {/* SUNTIKAN GAYA ANIMASI KEKINIAN (Holographic AI Breathing) */}
      <style>{`
        @keyframes bernapas-kekinian {
          0%, 100% {
            background-position: 0% 50%;
            filter: drop-shadow(0 0 12px rgba(0, 242, 254, 0.4));
            transform: translateY(0px) scale(1);
          }
          50% {
            background-position: 100% 50%;
            filter: drop-shadow(0 0 22px rgba(168, 85, 247, 0.8));
            transform: translateY(-3px) scale(1.02);
          }
        }
        .teks-ai-pena {
          background: linear-gradient(135deg, #00f2fe 0%, #4facfe 35%, #a855f7 70%, #00c6ff 100%);
          background-size: 250% 250%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: bernapas-kekinian 4s ease-in-out infinite;
        }
      `}</style>

      {/* Efek Cahaya Latar (Ambient Plasma - Hanya Mode Malam) */}
      {isDarkMode && <div className="absolute top-0 right-1/4 w-125 h-125 bg-linear-to-br from-cyan-500/10 via-indigo-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />}

      {/* ================= 1. SIDEBAR DESKTOP (KIRI) ================= */}
      <aside className={`hidden lg:flex lg:flex-col w-72 z-30 shrink-0 select-none transition-colors duration-300 ${
        isDarkMode ? "bg-slate-900/60 backdrop-blur-2xl border-r border-slate-800/80" : "bg-white border-r-4 border-black"
      }`}>
        <SidebarContent />
      </aside>

      {/* ================= 1.5. SIDEBAR MOBILE (LACI GESER) ================= */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      <aside 
        className={`fixed inset-y-0 left-0 w-72 z-50 flex flex-col transform transition-all duration-300 ease-in-out lg:hidden ${
          isDarkMode ? "bg-slate-900/95 backdrop-blur-2xl border-r border-slate-800" : "bg-white border-r-4 border-black"
        } ${isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
      >
        <SidebarContent />
      </aside>

      {/* ================= 2. KONTEN UTAMA (KANAN) ================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* TOP NAVBAR */}
        <header className={`h-20 px-6 lg:px-10 flex items-center justify-between z-20 shrink-0 transition-colors duration-300 ${
          isDarkMode ? "border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xl" : "border-b-4 border-black bg-yellow-400"
        }`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-xl text-xl cursor-pointer transition-all active:scale-95 ${
                isDarkMode ? "bg-slate-800/50 border border-slate-700 hover:bg-slate-800 text-slate-300" : "bg-white border-2 border-black text-black shadow-neo hover:-translate-y-0.5 hover:shadow-neo-md"
              }`}
            >
              ☰
            </button>
            <div>
              {/* Teks "Sistem Terpusat Disdikbud" telah dihapus dari sini */}
              <h1 className={`text-sm font-black flex items-center gap-2 ${isDarkMode ? "text-slate-200" : "text-black"}`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? "bg-emerald-400" : "bg-green-500 border border-black"}`} /> 
                {profile?.role === 'ADMIN' ? 'Superuser Markas' : profile?.role === 'PENGAWAS' ? 'Wilayah Pengawasan' : 'Satuan Pendidikan'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* SAKLAR TEMA */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
                isDarkMode 
                  ? 'bg-slate-800/60 text-cyan-400 border border-slate-700/60 hover:bg-slate-700' 
                  : 'bg-white text-black border-2 border-black shadow-neo hover:-translate-y-0.5 hover:shadow-neo-md active:translate-y-0 active:shadow-none'
              }`}
            >
              {isDarkMode ? '🌞 Siang' : '🌙 Malam'}
            </button>
          </div>
        </header>

        {/* RUANG RENDER HALAMAN (Outlet) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 relative z-10 custom-scrollbar">
          <Outlet />
        </main>

      </div>
    </div>
  );
}
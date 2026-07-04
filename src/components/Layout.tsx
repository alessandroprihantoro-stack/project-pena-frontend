// @ts-nocheck
import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuth, type UserRole } from "../context/AuthContext";

// MENGIMPOR ASET
import logoPena from "../assets/logo_pena.png";
import logoJateng from "../assets/logo_jateng.png";
import bgDashboardSekolah from "../assets/dashboard_pena.png";

interface NavItem {
  name: string;
  path: string;
  icon: string;
  subItems?: { name: string; hash: string; icon: string }[];
}

export default function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // 🌟 STATE: Untuk mengingat menu mana yang sedang dibuka/dilipat
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

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
          { 
            name: "Dasbor Sekolah", 
            path: "/sekolah/dashboard", 
            icon: "📊",
            subItems: [
              { name: "Klasemen Kinerja", hash: "#klasemen", icon: "🏆" },
              { name: "Mantap Share", hash: "#mantap", icon: "💡" }
            ]
          },
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

  // 🌟 SIDEBAR CONTENT
  const renderSidebarContent = () => (
    <>
      {/* BRANDING LOGO */}
      <div className={`h-24 px-6 flex items-center justify-center gap-3 shrink-0 transition-all relative overflow-hidden ${
        isDarkMode 
          ? "border-b border-blue-500/30 bg-linear-to-b from-blue-900/40 via-[#061030]/80 to-transparent shadow-[0_4px_20px_rgba(0,0,0,0.2)]" 
          : "border-b-2 border-black/10 bg-linear-to-b from-blue-50/70 via-indigo-50/30 to-transparent"
      }`}>
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${isDarkMode ? "bg-linear-to-r from-cyan-400 via-blue-500 to-indigo-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" : "bg-linear-to-r from-blue-500 via-indigo-500 to-purple-500"}`} />
        
        <div className={`w-full py-2 px-3 rounded-2xl flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] duration-300 shadow-sm border ${
          isDarkMode 
            ? "bg-[#040c24]/90 border-cyan-400/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]" 
            : "bg-white border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,0.1)]"
        }`}>
          <img src={logoJateng} alt="Jateng" className="h-7 w-auto object-contain drop-shadow-sm transition-transform hover:scale-110 duration-200" />
          <div className={`h-6 w-0.5 rounded-full ${isDarkMode ? "bg-linear-to-b from-cyan-400 to-blue-600 shadow-sm" : "bg-black/20"}`} />
          <img src={logoPena} alt="PENA" className="h-7 w-auto object-contain drop-shadow-sm transition-transform hover:scale-110 duration-200" />
        </div>
      </div>

      {/* 🌟 MENU NAVIGASI DINAMIS (DIPERBARUI) */}
      <nav className="flex-1 px-5 py-6 space-y-2.5 overflow-y-auto custom-scrollbar flex flex-col">
        <div className={`px-2 pb-2 mb-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
          isDarkMode ? "text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" : "text-blue-700"
        }`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
          Menu Utama
        </div>
        
        <div className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActivePath = location.pathname === item.path;
            const isExpanded = expandedMenus[item.path] !== undefined ? expandedMenus[item.path] : isActivePath;

            return (
              <div key={item.path} className="flex flex-col">
                <NavLink
                  to={item.path}
                  onClick={(e) => {
                    setIsMobileMenuOpen(false);
                    if (item.subItems) {
                      if (isActivePath) e.preventDefault(); 
                      setExpandedMenus(prev => ({ ...prev, [item.path]: !isExpanded }));
                    }
                  }}
                  className={`
                    group flex items-center justify-between px-3.5 py-3.5 rounded-2xl transition-all duration-300 cursor-pointer 
                    ${isDarkMode 
                      ? (isActivePath 
                          ? 'bg-linear-to-r from-blue-600/40 via-cyan-500/20 to-transparent text-cyan-300 font-bold border-l-4 border-cyan-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_0_15px_rgba(6,182,212,0.2)]' 
                          : 'text-blue-200/70 hover:text-white hover:bg-blue-900/40 font-medium border-l-4 border-transparent hover:border-blue-500/50')
                      : (isActivePath 
                          // 🔥 GAYA NEO-BRUTALISM AKTIF (SIANG) 🔥
                          ? 'bg-white border-2 border-black shadow-[3px_3px_0px_rgba(0,0,0,1)] text-blue-700 font-black transform -translate-y-0.5' 
                          : 'bg-transparent border-2 border-transparent text-slate-600 hover:bg-slate-100 hover:border-black/20 hover:text-black font-bold')
                    }
                  `}
                >
                  <div className="flex items-center gap-3.5">
                    {/* Icon Box */}
                    <div className={`w-9 h-9 flex items-center justify-center rounded-xl text-base transition-all duration-300 shrink-0 ${
                      isDarkMode 
                        ? (isActivePath 
                            ? 'bg-linear-to-br from-cyan-400 to-blue-600 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.6)] scale-105 font-black' 
                            : 'bg-[#040c24] border border-blue-500/30 shadow-md group-hover:border-cyan-400/60 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]') 
                        : (isActivePath 
                            ? 'bg-blue-600 text-white shadow-sm scale-105 font-black border-2 border-black' 
                            : 'bg-white border-2 border-slate-200 shadow-xs text-slate-600 group-hover:border-black/30 group-hover:text-blue-600 group-hover:shadow-sm')
                    }`}>
                      {item.icon}
                    </div>
                    <span className="text-sm tracking-wide">{item.name}</span>
                  </div>
                  
                  {/* Rotasi Panah */}
                  <svg 
                    className={`w-4 h-4 transition-transform duration-300 ${
                      item.subItems 
                        ? (isExpanded ? 'rotate-90 text-blue-600 dark:text-cyan-400 opacity-100' : 'opacity-0 group-hover:opacity-100 text-slate-400 dark:text-blue-300/60') 
                        : 'opacity-0 group-hover:opacity-100 text-slate-400 group-hover:text-blue-600 dark:text-blue-300/60 group-hover:translate-x-1'
                    }`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </NavLink>

                {/* SUB-MENU (Dengan Garis Sambung Vertikal) */}
                {item.subItems && isExpanded && (
                  <div className={`ml-8 pl-6 mt-2 mb-3 flex flex-col gap-1.5 border-l-2 animate-fade-in ${isDarkMode ? 'border-cyan-500/30' : 'border-blue-400'}`}>
                    {item.subItems.map((sub, idx) => (
                      <a
                        key={idx}
                        href={`${item.path}${sub.hash}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 relative
                          ${isDarkMode 
                            ? 'text-blue-200/70 hover:text-cyan-300 hover:bg-blue-900/40' 
                            : 'text-slate-500 hover:text-blue-700 hover:bg-blue-50 hover:shadow-sm border-2 border-transparent hover:border-blue-200'}
                        `}
                      >
                        <span className="text-xs">{sub.icon}</span>
                        <span>{sub.name}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 🌟 LOGO PENA DI BAWAH MENU 🌟 */}
        <div className="mt-8 pt-6 border-t-2 border-dashed border-black/10 dark:border-slate-800/50 flex flex-col items-center justify-center opacity-60 hover:opacity-100 transition-all duration-300 cursor-default">
          <img src={logoPena} alt="PENA" className="w-20 h-auto object-contain drop-shadow-sm filter grayscale hover:grayscale-0 transition-all duration-300" />
          <span className="text-[9px] font-black tracking-widest uppercase mt-2 text-slate-400 dark:text-slate-500">PENA Enterprise OS</span>
        </div>
      </nav>

      {/* FOOTER SIDEBAR DENGAN TEMA */}
      <div className={`p-6 pb-8 shrink-0 transition-colors ${
        isDarkMode ? "border-t border-blue-500/30 bg-linear-to-t from-[#030818] via-[#040c24]/90 to-transparent" : "border-t-2 border-black/10 bg-white"
      }`}>
        <div className="flex items-center gap-3 mb-6 px-2">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className={`w-10 h-10 rounded-full object-cover shrink-0 bg-white p-0.5 shadow-sm border-2 ${isDarkMode ? "border-cyan-400/60 shadow-[0_0_10px_rgba(6,182,212,0.3)]" : "border-black"}`} />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 font-mono border-2 ${isDarkMode ? "bg-linear-to-br from-cyan-500 to-blue-600 shadow-[0_0_10px_rgba(6,182,212,0.4)] border-transparent" : "bg-blue-600 border-black shadow-sm"}`}>
              {profile?.nama_lengkap?.[0] || "U"}
            </div>
          )}
          <div className="overflow-hidden flex-1">
            <h4 className={`text-xs font-bold truncate ${isDarkMode ? "text-blue-100" : "text-slate-800"}`}>
              {profile?.nama_lengkap || "Pengguna"}
            </h4>
            <span className={`text-[9px] font-black uppercase tracking-wider block mt-1 px-2 py-0.5 rounded-md w-fit border ${
              isDarkMode 
                ? "bg-cyan-500/15 text-cyan-300 border-cyan-400/30 shadow-[0_0_8px_rgba(6,182,212,0.2)]" 
                : "bg-blue-100 text-blue-800 border-blue-300"
            }`}>
              {profile?.role || "GUEST"}
            </span>
          </div>
        </div>

        <button
          onClick={handleKeluar}
          className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer border shadow-sm ${
            isDarkMode
              ? "bg-rose-500/15 text-rose-300 border-rose-500/30 hover:bg-rose-500 hover:text-white hover:border-transparent hover:shadow-[0_0_15px_rgba(244,63,94,0.4)]"
              : "bg-rose-50 text-rose-600 border-2 border-rose-200 hover:bg-rose-600 hover:text-white hover:border-black shadow-[2px_2px_0px_rgba(0,0,0,0.1)] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          }`}
        >
          <span>🚪</span> Keluar
        </button>
      </div>
    </>
  );

  return (
    <div className={`min-h-screen flex font-sans selection:bg-cyan-500 selection:text-white relative overflow-hidden transition-colors duration-300 ${
      isDarkMode ? "bg-[#040c24] text-blue-50" : "bg-slate-50 text-slate-900"
    }`}>
      
      {/* 🌟 BACKGROUND GAMBAR KHUSUS MODE GELAP */}
      {isDarkMode && (
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <img 
            src={bgDashboardSekolah} 
            alt="Background Dashboard" 
            className="w-full h-full object-cover object-center opacity-80 select-none filter brightness-95 contrast-115"
          />
          <div className="absolute inset-0 bg-linear-to-t from-[#040c24] via-[#040c24]/70 to-blue-950/40" />
        </div>
      )}

      {/* Efek Cahaya Latar */}
      {isDarkMode && <div className="absolute top-0 right-1/4 w-125 h-125 bg-linear-to-br from-cyan-500/15 via-blue-500/10 to-transparent rounded-full blur-[140px] pointer-events-none z-0" />}

      {/* ================= SIDEBAR DESKTOP ================= */}
      <aside className={`hidden lg:flex lg:flex-col w-72 z-30 shrink-0 select-none transition-colors duration-300 relative ${
        isDarkMode ? "bg-linear-to-b from-[#061030]/95 via-[#040c24]/90 to-[#030818]/95 backdrop-blur-2xl border-r border-blue-500/30 shadow-[4px_0_30px_rgba(29,78,216,0.15)]" : "bg-white border-r border-slate-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.03)]"
      }`}>
        {renderSidebarContent()}
      </aside>

      {/* ================= SIDEBAR MOBILE ================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-[#030818]/80 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={() => setIsMobileMenuOpen(false)} />
      )}
      
      <aside 
        className={`fixed inset-y-0 left-0 w-72 z-50 flex flex-col transform transition-all duration-300 ease-in-out lg:hidden ${
          isDarkMode ? "bg-linear-to-b from-[#061030] via-[#040c24] to-[#030818] border-r border-blue-500/30 shadow-[8px_0_32px_rgba(6,182,212,0.2)]" : "bg-white shadow-[8px_0_32px_rgba(0,0,0,0.12)]"
        } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {renderSidebarContent()}
      </aside>

      {/* ================= KONTEN UTAMA ================= */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative z-10">
        
        {/* TOP NAVBAR */}
        <header className={`h-20 px-6 lg:px-10 flex items-center justify-between z-20 shrink-0 transition-colors duration-300 ${
          isDarkMode ? "border-b border-blue-500/30 bg-[#061030]/60 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.2)]" : "border-b border-slate-200/60 bg-white/70 backdrop-blur-xl"
        }`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-xl text-xl cursor-pointer transition-all active:scale-95 ${
                isDarkMode ? "bg-[#040c24] border border-blue-500/40 hover:bg-blue-900/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]" : "bg-white shadow-sm border border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              ☰
            </button>
            <div>
              <h1 className={`text-sm font-bold flex items-center gap-2.5 tracking-wide ${isDarkMode ? "text-blue-100" : "text-slate-800"}`}>
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse shadow-sm ${isDarkMode ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" : "bg-blue-600 shadow-blue-500/50"}`} /> 
                {profile?.role === 'ADMIN' ? 'Superuser Markas' : profile?.role === 'PENGAWAS' ? 'Wilayah Pengawasan' : 'Satuan Pendidikan'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-sm border ${
                isDarkMode 
                  ? 'bg-[#040c24] text-cyan-300 border-cyan-400/40 hover:bg-blue-900/50 hover:border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]' 
                  : 'bg-white text-slate-700 border-2 border-slate-200 hover:bg-slate-50 hover:border-black hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]'
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
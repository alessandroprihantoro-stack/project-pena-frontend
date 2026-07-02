import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

import bannerPena from "../../assets/banner_pena.png";
import logoPena from "../../assets/logo_pena.png";

export default function DashboardAdmin() {
  const [stats, setStats] = useState({
    sekolah: 0,
    pengawas: 0,
    praktikBaik: 0,
    loading: true
  });

  useEffect(() => {
    const fetchRadarStats = async () => {
      try {
        // 1. Ping Radar: Total Sekolah
        const { count: countSekolah } = await supabase
          .from("sekolah")
          .select("*", { count: "exact", head: true });

        // 2. Ping Radar: Total Pengawas (Dari tabel profiles)
        const { count: countPengawas } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "PENGAWAS");

        // 3. Ping Radar: Total Praktik Baik
        const { count: countPraktik } = await supabase
          .from("praktik_baik")
          .select("*", { count: "exact", head: true });

        // Update Radar UI
        setStats({
          sekolah: countSekolah || 0,
          pengawas: countPengawas || 0,
          praktikBaik: countPraktik || 0,
          loading: false
        });
      } catch (error) {
        console.error("Gagal menarik data radar satelit:", error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchRadarStats();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      
      {/* HERO BANNER UNIVERSAL */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mb-2 group shrink-0">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src={bannerPena} alt="Banner" className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-700" />
          <div className="absolute inset-0 bg-linear-to--r from-slate-950 via-slate-900/90 to-transparent" />
        </div>
        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-700/50 backdrop-blur-md shadow-xl">
              <div className="w-px h-10 bg-slate-700" />
              <img src={logoPena} alt="PENA" className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-lg" />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                PENA <span className="text-transparent bg-clip-text bg-linear-to--r from-cyan-400 to-indigo-400">Enterprise</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1 italic">"Platform Edukasi Navigasi & Analisis"</p>
            </div>
          </div>
          <div className="bg-linear-to--r from-cyan-500/10 to-indigo-500/10 border border-cyan-500/30 px-5 py-2.5 rounded-xl text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            Otoritas: ADMIN
          </div>
        </div>
      </div>

      {/* RADAR STATISTIK CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card Sekolah */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-300 hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest group-hover:text-blue-600 transition-colors">Total Institusi Sekolah</span>
            <span className="p-2.5 bg-blue-50 text-blue-500 rounded-xl group-hover:scale-110 transition-transform">🏢</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-5xl font-black text-slate-800 font-mono">
              {stats.loading ? "..." : stats.sekolah}
            </h3>
          </div>
        </div>

        {/* Card Pengawas */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-indigo-300 hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest group-hover:text-indigo-600 transition-colors">Total Otoritas Pengawas</span>
            <span className="p-2.5 bg-indigo-50 text-indigo-500 rounded-xl group-hover:scale-110 transition-transform">👥</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-5xl font-black text-slate-800 font-mono">
              {stats.loading ? "..." : stats.pengawas}
            </h3>
          </div>
        </div>

        {/* Card Praktik Baik */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-amber-300 hover:shadow-lg transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest group-hover:text-amber-600 transition-colors">Total Karya Inovasi</span>
            <span className="p-2.5 bg-amber-50 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">✨</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-5xl font-black text-slate-800 font-mono">
              {stats.loading ? "..." : stats.praktikBaik}
            </h3>
          </div>
        </div>

      </div>
      
      {/* KOTAK KOMANDO */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 mt-6 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-slate-50 rounded-full blur-3xl pointer-events-none"></div>
        <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <span>⚙️</span> Ruang Komando Utama
        </h3>
        <p className="text-slate-500 text-sm mt-3 leading-relaxed max-w-3xl">
          Selamat datang di <strong className="text-slate-700">Pusat Kendali PENA Enterprise</strong>. Anda memegang otoritas penuh atas sistem. Gunakan navigasi di sebelah kiri untuk meregistrasi hak akses Pengawas, mengelola pangkalan data Sekolah, dan memonitor seluruh pengajuan Inovasi dari lapangan.
        </p>
      </div>

    </div>
  );
}
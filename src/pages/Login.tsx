/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

import logoJateng from "../assets/logo_jateng.png";
import logoPena from "../assets/logo_pena.png";
import dashboardBg from "../assets/dashboard_pena.png"; 

export default function Login() {
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [loadingMasuk, setLoadingMasuk] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleMasuk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrId || !password) return;

    setLoadingMasuk(true);

    let finalPayload = emailOrId.trim();
    const sandiBersih = password.trim();
    let isNpsnMurni = false;

    // SISTEM INTELEJEN KONVERSI (CHECKPOINT PROTECTION - TETAP UTUH 100%)
    if (!finalPayload.includes("@")) {
      isNpsnMurni = /^\d+$/.test(finalPayload);
      
      if (isNpsnMurni) {
        finalPayload = `${finalPayload}@sekolah.pena.com`; 
      } else if (finalPayload.toLowerCase() === "puthut") {
        finalPayload = "puthutprihantoro86@gmail.com"; 
      } else {
        finalPayload = `${finalPayload.toLowerCase()}@pena.com`;
      }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalPayload,
        password: sandiBersih,
      });

      if (error) {
        // JURUS BYPASS MUTLAK UNTUK SEKOLAH
        if (isNpsnMurni && (error.message.includes("Invalid login credentials") || error.message.includes("User not found"))) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: finalPayload,
            password: sandiBersih,
          });
          
          if (signUpError) throw signUpError;
          
          if (signUpData.user) {
            const cleanNpsn = emailOrId.trim();
            await supabase.from('profiles').insert([{ id: signUpData.user.id, role: 'SEKOLAH', nama_lengkap: `Sekolah ${cleanNpsn}`, nomor_induk: cleanNpsn, email: finalPayload }]);
            await supabase.from('sekolah').insert([{ id: signUpData.user.id, user_id: signUpData.user.id, npsn: cleanNpsn, nama_sekolah: `Sekolah ${cleanNpsn}` }]);
            
            window.location.href = "/";
            return;
          }
        } else {
          throw error;
        }
      }

      if (data?.user) {
        window.location.href = "/";
      }
    } catch (error: any) {
      alert("Akses Ditolak: Periksa kembali NPSN / Email / NIP dan Kata Sandi Anda!");
      console.error("GOTRUE_REJECTION:", error);
    } finally {
      setLoadingMasuk(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-6 font-sans overflow-hidden bg-slate-950 selection:bg-cyan-500 selection:text-white">
      
      {/* 🌟 INJEKSI GAYA ANIMASI CSS UNTUK EFEK SCANNER TEKNOLOGI */}
      <style>
        {`
          @keyframes tech-scan {
            0% { transform: translateY(-10vh); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(110vh); opacity: 0; }
          }
          .animate-tech-scan {
            animation: tech-scan 4s linear infinite;
          }
        `}
      </style>

      {/* 🌟 LATAR BELAKANG DASHBOARD_PENA & GARIS SCANNER */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Gambar Latar Utama */}
        <img 
          src={dashboardBg} 
          alt="Dashboard Background" 
          className="w-full h-full object-cover object-top opacity-30 scale-105 transform filter contrast-125" 
        />
        {/* Overlay Gelap */}
        <div className="absolute inset-0 bg-linear-to-b from-slate-950/90 via-slate-900/70 to-slate-950/90" />
        
        {/* Garis Teknologi Bergerak (Scanner Laser) */}
        <div className="absolute top-0 left-0 w-full h-0.75 bg-cyan-400/80 shadow-[0_0_30px_8px_rgba(6,182,212,0.6)] animate-tech-scan z-10" />
      </div>

      {/* Efek Cahaya Sudut */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* KONTEN UTAMA LOGIN */}
      <div className="relative z-20 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6">
          <div className="flex items-center gap-4 px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-inner backdrop-blur-md">
            <img src={logoJateng} alt="Jawa Tengah" className="h-9 w-auto object-contain drop-shadow" />
            <div className="h-6 w-px bg-slate-700" />
            <img src={logoPena} alt="PENA OS" className="h-7 w-auto object-contain drop-shadow" />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono uppercase font-bold">
              <span>🚀</span> <span>Edisi Pemantauan Mutu v2.0</span>
              <div className="flex items-end gap-0.5 h-3.5 pl-1">
                <span className="w-0.5 bg-cyan-400 animate-[bounce_1s_infinite_100ms] h-full block rounded-full" />
                <span className="w-0.5 bg-blue-500 animate-[bounce_1s_infinite_300ms] h-2/3 block rounded-full" />
                <span className="w-0.5 bg-indigo-400 animate-[bounce_1s_infinite_150ms] h-4/5 block rounded-full" />
                <span className="w-0.5 bg-cyan-300 animate-[bounce_1s_infinite_400ms] h-1/2 block rounded-full" />
                <span className="w-0.5 bg-blue-400 animate-[bounce_1s_infinite_200ms] h-full block rounded-full" />
              </div>
            </div>
            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-none">
              Platform Edukasi <br />
              <span className="bg-linear-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Navigasi & Analisis
              </span>
            </h1>
          </div>

          <div className="w-full max-w-md rounded-2xl overflow-hidden border border-slate-800/80 shadow-2xl bg-slate-900/40 p-2 backdrop-blur-sm group">
            {/* 🌟 GAMBAR BANNER DIGANTI MENJADI DASHBOARD_PENA */}
            <img src={dashboardBg} alt="Dashboard PENA" className="w-full h-auto object-cover rounded-xl opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-[1.01]" />
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-slate-900/70 border border-slate-800/80 p-8 lg:p-10 rounded-3xl shadow-2xl backdrop-blur-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="border-b border-slate-800/80 pb-4">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 block mb-1">• PORTAL GERBANG UTAMA</span>
              <h2 className="text-2xl font-black text-white">Otentikasi Pengguna</h2>
              <p className="text-xs text-slate-400 mt-0.5 font-sans">Gunakan Email, NIP Pengawas, atau NPSN Sekolah</p>
            </div>

            <form onSubmit={handleMasuk} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">EMAIL / NPSN / NIP</label>
                <input type="text" required value={emailOrId} onChange={(e) => setEmailOrId(e.target.value)} placeholder="Contoh: puthutprihantoro..." className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-3.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all shadow-inner" />
              </div>
              
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 mb-1.5">KATA SANDI</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    required 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pl-4 pr-11 py-3.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all shadow-inner" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 focus:outline-none transition-colors cursor-pointer"
                    title={showPassword ? "Sembunyikan sandi" : "Tampilkan sandi"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loadingMasuk} 
                className="w-full py-4 mt-6 bg-linear-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loadingMasuk ? 'MEMPROSES MASUK...' : 'MASUK'}
              </button>
            </form>

            <div className="pt-4 border-t border-slate-800/80 text-center space-y-2.5">
              <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                Masyarakat Umum / Tamu?
              </p>
              
              <Link
                to="/publik"
                className="w-full py-3 px-4 bg-linear-to-r from-emerald-600/20 to-teal-600/20 hover:from-emerald-600 hover:to-teal-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-xl font-bold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 group shadow-lg cursor-pointer"
              >
                <span className="text-base group-hover:scale-110 transition-transform">🌐</span>
                <span>Masuk Portal Publik & Peringkat Mutu</span>
              </Link>
            </div>

            <div className="pt-1 text-center"><span className="text-[10px] font-mono text-slate-500">Sistem PENA OS • Berlisensi Resmi Disdikbud</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}
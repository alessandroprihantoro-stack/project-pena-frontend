import React, { useState } from "react";
import { supabase } from "../supabaseClient";

import logoJateng from "../assets/logo_jateng.png";
import logoPena from "../assets/logo_pena.png";
import bannerPena from "../assets/banner_pena.png";
import dashboardBg from "../assets/dashboard_pena.png";

export default function Login() {
  const [emailOrId, setEmailOrId] = useState("");
  const [password, setPassword] = useState("");
  const [loadingMasuk, setLoadingMasuk] = useState(false);

  const handleMasuk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrId || !password) return;

    setLoadingMasuk(true);

    let finalPayload = emailOrId.trim();
    const sandiBersih = password.trim();
    let isNpsnMurni = false;

    // SISTEM INTELEJEN KONVERSI
    if (!finalPayload.includes("@")) {
      isNpsnMurni = /^\d+$/.test(finalPayload);
      
      if (isNpsnMurni) {
        // Jika angka murni, gunakan domain sekolah
        finalPayload = `${finalPayload}@sekolah.pena.com`; 
      } else if (finalPayload.toLowerCase() === "puthut") {
        // Akun legendaris Puthut
        finalPayload = "puthutprihantoro86@gmail.com"; 
      } else {
        // Huruf murni (admin, suratno, dll) -> otomatis ke @pena.com
        finalPayload = `${finalPayload.toLowerCase()}@pena.com`;
      }
    }

    try {
      // 1. Coba Login Normal
      const { data, error } = await supabase.auth.signInWithPassword({
        email: finalPayload,
        password: sandiBersih,
      });

      if (error) {
        // 2. JURUS BYPASS MUTLAK UNTUK SEKOLAH
        if (isNpsnMurni && (error.message.includes("Invalid login credentials") || error.message.includes("User not found"))) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: finalPayload,
            password: sandiBersih,
          });
          
          if (signUpError) throw signUpError;
          
          if (signUpData.user) {
            const cleanNpsn = emailOrId.trim();
            // AUTO-INJECT DATA PROFIL AGAR TIDAK MENJADI AKUN HANTU
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
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
     <img src={dashboardBg} alt="Dashboard Background" className="w-full h-full object-cover object-top opacity-30 scale-105 transform" />
     <div className="absolute inset-0 bg-linear-to-t from-slate-950 via-slate-950/85 to-slate-900/40" />
   </div>

      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
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
            <img src={bannerPena} alt="Banner PENA" className="w-full h-auto object-cover rounded-xl opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-[1.01]" />
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
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-3.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all shadow-inner" />
              </div>
              <button 
                type="submit" 
                disabled={loadingMasuk} 
                className="w-full py-4 mt-6 bg-linear-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black rounded-xl uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)] transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border border-cyan-400/50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingMasuk ? 'MEMPROSES MASUK...' : 'MASUK'}
              </button>
            </form>
            <div className="pt-2 text-center"><span className="text-[10px] font-mono text-slate-500">Sistem PENA OS • Berlisensi Resmi Disdikbud</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}
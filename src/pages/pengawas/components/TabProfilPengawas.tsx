/* eslint-disable */
// @ts-nocheck

import React, { useState } from 'react';
import { supabase } from '../../../supabaseClient';
// 1. IMPORT FUNGSI KOMPRESI
import { compressImage } from '../../../utils/imageCompression';

// 🌟 STANDARDISASI UNOR (Untuk Filter Admin yang Akurat)
const DAFTAR_UNOR_JATENG = [
  "Cabang Dinas Pendidikan Wilayah I",
  "Cabang Dinas Pendidikan Wilayah II",
  "Cabang Dinas Pendidikan Wilayah III",
  "Cabang Dinas Pendidikan Wilayah IV",
  "Cabang Dinas Pendidikan Wilayah V",
  "Cabang Dinas Pendidikan Wilayah VI",
  "Cabang Dinas Pendidikan Wilayah VII",
  "Cabang Dinas Pendidikan Wilayah VIII",
  "Cabang Dinas Pendidikan Wilayah IX",
  "Cabang Dinas Pendidikan Wilayah X",
  "Cabang Dinas Pendidikan Wilayah XI",
  "Cabang Dinas Pendidikan Wilayah XII",
];

interface TabProfilPengawasProps {
  pNama: string;
  setPNama: (val: string) => void;
  pEmail: string;
  setPEmail: (val: string) => void;
  pInstansi: string;
  setPInstansi: (val: string) => void;
  pJabatan: string;
  setPJabatan: (val: string) => void;
  pNipResmi: string;
  setPNipResmi: (val: string) => void;
  pGolongan: string;
  setPGolongan: (val: string) => void;
  setPFotoFile: (file: File | null) => void;
  handleUpdateProfil: (e: React.FormEvent) => void;
  profilLoading: boolean;
  nomorIndukSistem?: string;
}

export default function TabProfilPengawas({
  pNama, setPNama, pEmail, setPEmail, pInstansi, setPInstansi,
  pJabatan, setPJabatan, pNipResmi, setPNipResmi, pGolongan, setPGolongan,
  setPFotoFile, handleUpdateProfil, profilLoading, nomorIndukSistem
}: TabProfilPengawasProps) {

  // 🌟 STATE KHUSUS UNTUK GANTI PASSWORD
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // 🌟 MESIN PENGGANTI PASSWORD SUPABASE
  const onUpdatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("⚠️ Kata sandi baru harus terdiri dari minimal 6 karakter!");
      return;
    }
    
    if (!window.confirm("Apakah Anda yakin ingin mengubah kata sandi akun ini?")) return;

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      alert("✅ Kata sandi berhasil diubah! Silakan gunakan kata sandi baru ini pada saat login berikutnya.");
      setNewPassword(''); // Kosongkan input setelah berhasil
    } catch (e: any) {
      alert("❌ Gagal merubah kata sandi: " + e.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // 2. FUNGSI HANDLER UNTUK MENGOMPRES FOTO PROFIL SEBELUM DISIMPAN KE STATE
  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressedFile = await compressImage(file);
      setPFotoFile(compressedFile as File);
    } else {
      setPFotoFile(null);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl space-y-6 max-w-3xl mx-auto shadow-2xl animate-fade-in relative z-20">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-lg font-black font-mono">⚙️ Pemutakhiran Data Diri Pengawas</h2>
      </div>
      <form onSubmit={handleUpdateProfil} className="space-y-4 text-xs">
        <div>
          <label className="block font-mono text-[11px] text-slate-400 mb-1">Akun / Nomor Induk Sistem</label>
          <input type="text" disabled value={nomorIndukSistem || ''} className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-slate-500 font-mono cursor-not-allowed" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-slate-300 mb-1">Nama Lengkap & Gelar</label>
            <input type="text" required value={pNama} onChange={e=>setPNama(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none" />
          </div>
          <div>
            <label className="block font-mono text-slate-300 mb-1">Email Kontak</label>
            <input type="email" value={pEmail} onChange={e=>setPEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 🌟 KOLOM INSTANSI / UNOR (DROPDOWN BAKU) */}
          <div>
            <label className="block font-mono text-slate-300 mb-1">Instansi / Unor</label>
            <select 
              value={pInstansi || ''} 
              onChange={e=>setPInstansi(e.target.value)} 
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none cursor-pointer"
            >
              <option value="" disabled>-- Pilih Cabang Dinas / Unor --</option>
              {DAFTAR_UNOR_JATENG.map((unor, idx) => (
                <option key={idx} value={unor} className="bg-slate-950 text-white py-1">
                  {unor}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-mono text-slate-300 mb-1">Jabatan Pengawas</label>
            <input type="text" value={pJabatan} onChange={e=>setPJabatan(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-mono text-slate-300 mb-1">NIP Resmi</label>
            <input type="text" value={pNipResmi} onChange={e=>setPNipResmi(e.target.value)} placeholder="Contoh: 19860918 202601 1 001" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none" />
          </div>
          <div>
            <label className="block font-mono text-slate-300 mb-1">Pangkat / Golongan</label>
            <input type="text" value={pGolongan} onChange={e=>setPGolongan(e.target.value)} placeholder="Contoh: Pembina / IV.a" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white focus:border-cyan-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="block font-mono text-slate-300 mb-1">Foto Profil / Avatar</label>
          <input type="file" accept="image/*" onChange={handleFotoChange} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer" />
        </div>
        
        <div className="pt-4">
          <button type="submit" disabled={profilLoading} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-cyan-900/50">
            {profilLoading ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
          </button>
        </div>
      </form>

      {/* 🌟 PEMISAH: ZONA GANTI PASSWORD 🌟 */}
      <div className="pt-8 mt-2 border-t border-slate-800">
        <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-2">
          <span>🔐</span> Keamanan Akun
        </h4>
        <p className="text-xs text-slate-400 mb-5 leading-relaxed font-sans">
          Ubah kata sandi Anda secara berkala untuk menjaga keamanan akun Pusat Komando Pengawas. Kata sandi minimal 6 karakter.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="password" 
            placeholder="Ketik kata sandi baru Anda di sini..." 
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            className="flex-1 bg-slate-950 border border-rose-900/50 focus:border-rose-400 rounded-xl p-3 text-white outline-none text-xs font-mono transition-colors"
          />
          <button 
            type="button"
            onClick={onUpdatePassword}
            disabled={isUpdatingPassword || !newPassword}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black font-mono text-xs rounded-xl uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.3)] flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {isUpdatingPassword ? "⏳ Memproses..." : "🔄 Update Sandi"}
          </button>
        </div>
      </div>

    </div>
  );
}
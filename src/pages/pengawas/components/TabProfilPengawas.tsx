import React from 'react';
// 1. IMPORT FUNGSI KOMPRESI (Sesuaikan jumlah '../' dengan lokasi folder utils Anda)
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

  // 2. FUNGSI HANDLER BARU UNTUK MENGOMPRES FOTO PROFIL SEBELUM DISIMPAN KE STATE
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
    <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl space-y-6 max-w-3xl mx-auto shadow-2xl animate-fade-in">
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
          {/* 🌟 KOLOM INSTANSI / UNOR (DIPERBARUI MENJADI DROPDOWN BAKU) */}
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
          {/* 3. UBAH onChange MENJADI handleFotoChange */}
          <input type="file" accept="image/*" onChange={handleFotoChange} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-cyan-500/10 file:text-cyan-400 hover:file:bg-cyan-500/20 cursor-pointer" />
        </div>
        
        <div className="pt-4">
          <button type="submit" disabled={profilLoading} className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl uppercase tracking-wider disabled:opacity-50 transition-all cursor-pointer">
            {profilLoading ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
          </button>
        </div>
      </form>
    </div>
  );
}
/* eslint-disable */
// @ts-nocheck

import React from 'react';

// Interface diperbarui dengan atribut baru MANTAP Share
export interface GaleriInovasiItem { 
  id: string; 
  judul: string; 
  deskripsi: string; 
  jenis_media: string; 
  media_url: string; 
  user_id?: string; 
  sekolah_id?: string; 
  npsn?: string; 
  profiles?: { nama_lengkap: string; avatar_url?: string; }; 
  kategori_program?: string;
  capaian_hasil?: string;
  tanggal_pelaksanaan?: string;
  created_at?: string;
}

interface GaleriInovasiProps {
  galeriDitampilkan: GaleriInovasiItem[];
  galeriTotal: number;
  tampilSemuaInovasi: boolean;
  setTampilSemuaInovasi: (val: boolean) => void;
  renderKaryaInovasiCard: (karya: GaleriInovasiItem) => any;
  kategoriShare: string;
  setKategoriShare: (val: string) => void;
}

export default function GaleriInovasi({
  galeriDitampilkan,
  galeriTotal,
  tampilSemuaInovasi,
  setTampilSemuaInovasi,
  renderKaryaInovasiCard,
  kategoriShare, setKategoriShare
}: GaleriInovasiProps) {
  
  // Daftar Kategori Resmi MANTAP Share
  const daftarKategori = ['SEMUA', 'SMA MANTAP', 'Branding Sekolah', 'Proyek Siswa', 'Praktik Baik'];

  return (
    // 🌟 WUJUD NEO-BRUTALISM: Gradasi Fuchsia-Pink-Purple untuk Mode Siang 🌟
    <div className="transition-all duration-300 bg-linear-to-br from-fuchsia-50 via-pink-50 to-purple-50 border-4 border-black shadow-neo rounded-3xl p-6 sm:p-8 hover:-translate-y-1 hover:shadow-neo-md dark:bg-[#061030]/80 dark:border-2 dark:border-fuchsia-500/30 dark:shadow-[0_4px_20px_rgba(217,70,239,0.1)] space-y-6">
      
      {/* HEADER MANTAP SHARE */}
      <div className="flex flex-col border-b-4 border-black/10 dark:border-slate-800 pb-4">
        <h3 className="text-xl font-black uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-400 flex items-center gap-2">
          🚀 MANTAP Share
        </h3>
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
          Feed jejaring sosial edukasi. Jelajahi karya inovasi unggulan se-Jawa Tengah.
        </p>
      </div>

      {/* FILTER KATEGORI (PILLS BUTTONS CERIA) */}
      <div className="flex flex-wrap gap-1.5 pb-2">
        {daftarKategori.map(kat => (
          <button 
            key={kat}
            onClick={() => setKategoriShare(kat)}
            className={`px-4 py-2 rounded-xl font-mono text-[10px] font-black uppercase transition-all cursor-pointer border-2 ${kategoriShare === kat ? 'bg-fuchsia-500 text-white border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:bg-fuchsia-500/20 dark:text-fuchsia-300 dark:border-fuchsia-500/40 dark:shadow-none' : 'bg-white/60 border-black/20 text-slate-600 hover:bg-white hover:text-black hover:border-black/50 hover:shadow-sm dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:text-fuchsia-300 dark:hover:border-slate-700'}`}
          >
            {kat}
          </button>
        ))}
      </div>
      
      {/* FEED MANTAP SHARE */}
      {galeriDitampilkan.length === 0 ? (
        <div className="bg-white/60 border-2 border-dashed border-black/30 rounded-3xl p-12 text-center text-sm font-bold text-slate-500 italic dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-500 shadow-sm">
          Belum ada postingan MANTAP Share yang sesuai kategori ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {galeriDitampilkan.map(renderKaryaInovasiCard)}
        </div>
      )}
      
      {/* TOMBOL AKORDEON MUAT SEMUA */}
      {galeriTotal > 3 && (
        <div className="mt-8 flex justify-center border-t-2 border-black/10 dark:border-slate-800/50 pt-6">
          <button 
            onClick={() => setTampilSemuaInovasi(!tampilSemuaInovasi)} 
            className="px-8 py-3.5 rounded-xl border-2 bg-white text-black border-black font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-neo hover:-translate-y-0.5 hover:shadow-neo-md hover:bg-fuchsia-50 dark:bg-slate-950 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:shadow-none dark:hover:text-fuchsia-400 dark:hover:translate-y-0"
          >
            {tampilSemuaInovasi ? "🔼 Tutup Feed" : `✨ Muat Semua Postingan (${galeriTotal})`}
          </button>
        </div>
      )}
    </div>
  );
}
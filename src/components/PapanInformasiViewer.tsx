/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

interface InformasiItem {
  id: string;
  judul: string;
  konten: string;
  kategori: string;
  is_active: boolean;
  lampiran_url?: string | null;
  lampiran_tipe?: string | null;
  created_at: string;
}

export default function PapanInformasiViewer() {
  const [listInformasi, setListInformasi] = useState<InformasiItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInformasiAktif = async () => {
    try {
      const { data, error } = await supabase
        .from('papan_informasi')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListInformasi(data || []);
    } catch (err: any) {
      console.error("Gagal memuat Papan Informasi:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInformasiAktif();
    
    // 🌟 CHECKPOINT PROTECTION: Gunakan ID unik agar tidak bentrok di React Strict Mode
    const uniqueChannelName = `public:papan_info_${Math.random().toString(36).substring(2, 9)}`;
    const subscription = supabase
      .channel(uniqueChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'papan_informasi' }, () => {
        fetchInformasiAktif();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) {
    return (
      <div className="w-full bg-white dark:bg-slate-900 border-2 border-black dark:border-slate-800 rounded-3xl p-6 shadow-neo dark:shadow-xl animate-pulse flex items-center justify-center">
        <span className="text-xs font-mono text-slate-500">📡 Memindai pengumuman resmi terbaru...</span>
      </div>
    );
  }

  // Jika tidak ada informasi yang tayang
  if (listInformasi.length === 0) {
    return null; 
  }

  return (
    <div className="w-full bg-white dark:bg-slate-900 border-2 sm:border-4 border-black dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-neo dark:shadow-2xl space-y-6 transition-colors duration-300">
      
      {/* HEADER WIDGET */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-black/10 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-yellow-400 dark:bg-cyan-500/20 border-2 border-black dark:border-cyan-400/40 flex items-center justify-center text-lg shadow-sm shrink-0">
            📢
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              Papan Informasi & Instruksi Resmi
            </h2>
            <p className="text-xs text-slate-400 font-mono">Pusat pengumuman real-time terintegrasi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            {listInformasi.length} Info Tayang
          </span>
        </div>
      </div>

      {/* DAFTAR PENGUMUMAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {listInformasi.map((item) => {
          const isDarurat = item.kategori === 'DARURAT';
          const isPenting = item.kategori === 'PENTING';
          const isPrestasi = item.kategori === 'PRESTASI';

          return (
            <div
              key={item.id}
              className={`p-5 sm:p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between gap-4 ${
                isDarurat
                  ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-500/80 dark:border-rose-500/40 shadow-[4px_4px_0px_rgba(244,63,94,0.3)]'
                  : isPenting
                  ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-500/80 dark:border-amber-500/40 shadow-[4px_4px_0px_rgba(245,158,11,0.3)]'
                  : isPrestasi
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-500/80 dark:border-emerald-500/40 shadow-[4px_4px_0px_rgba(16,185,129,0.3)]'
                  : 'bg-slate-50 dark:bg-slate-950/80 border-black/80 dark:border-slate-800 shadow-neo-sm dark:shadow-lg'
              }`}
            >
              <div className="space-y-3">
                {/* Badge Kategori & Tanggal */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-3 py-1 rounded-lg text-[10px] font-mono font-black uppercase tracking-wider border ${
                      isDarurat
                        ? 'bg-rose-500 text-white border-black dark:border-rose-400 animate-pulse'
                        : isPenting
                        ? 'bg-amber-400 text-black border-black dark:bg-amber-500 dark:text-slate-950'
                        : isPrestasi
                        ? 'bg-emerald-500 text-white border-black dark:bg-emerald-400 dark:text-slate-950'
                        : 'bg-blue-600 text-white border-black dark:bg-cyan-500 dark:text-slate-950'
                    }`}
                  >
                    {item.kategori || 'UMUM'}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                    📅 {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                {/* Judul & Konten */}
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                  {item.judul}
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-sans leading-relaxed whitespace-pre-wrap">
                  {item.konten}
                </p>
              </div>

              {/* RENDER LAMPIRAN (GAMBAR / DOKUMEN) */}
              {item.lampiran_url && (
                <div className="pt-3 border-t border-black/10 dark:border-slate-800/80 mt-2">
                  {item.lampiran_tipe === 'GAMBAR' ? (
                    <div className="space-y-2">
                      <div className="w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-slate-200 dark:bg-slate-950 border-2 border-black dark:border-slate-800 group relative">
                        <img
                          src={item.lampiran_url}
                          alt={item.judul}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <a
                        href={item.lampiran_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2 px-4 rounded-xl bg-white dark:bg-slate-800 border-2 border-black dark:border-slate-700 hover:bg-yellow-400 dark:hover:bg-slate-700 text-slate-900 dark:text-cyan-400 font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                      >
                        <span>🖼️</span> Buka Gambar Ukuran Penuh ↗
                      </a>
                    </div>
                  ) : (
                    <a
                      href={item.lampiran_url}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-500/40 hover:border-blue-600 dark:hover:border-cyan-400 text-blue-700 dark:text-cyan-300 font-mono text-xs font-bold flex items-center justify-between transition-all hover:bg-blue-100/50 dark:hover:bg-blue-900/30 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">📄</span>
                        <span className="underline">Unduh / Buka Dokumen Lampiran</span>
                      </div>
                      <span className="font-black">↗</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
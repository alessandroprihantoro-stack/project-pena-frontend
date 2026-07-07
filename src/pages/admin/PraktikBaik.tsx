/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

export default function PraktikBaik() {
  const [activeTab, setActiveTab] = useState<'INOVASI' | 'PRESTASI'>('INOVASI');
  const [inovasiList, setInovasiList] = useState<any[]>([]);
  const [prestasiList, setPrestasiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 🌟 CHECKPOINT PROTECTION: 1. Tarik Data Karya Inovasi dengan Auto-Fallback Relasi
      let { data: inovasiData, error: errInovasi } = await supabase
        .from("praktik_baik")
        .select("*, profiles!user_id(nama_lengkap, nomor_induk)")
        .order("created_at", { ascending: false });

      if (errInovasi && errInovasi.message.includes("relationship")) {
        const fallbackInovasi = await supabase
          .from("praktik_baik")
          .select("*, profiles!sekolah_id(nama_lengkap, nomor_induk)")
          .order("created_at", { ascending: false });
        inovasiData = fallbackInovasi.data;
        errInovasi = fallbackInovasi.error;
      }

      if (errInovasi) throw errInovasi;
      setInovasiList(inovasiData || []);

      // 🌟 CHECKPOINT PROTECTION: 2. Tarik Data Prestasi Sekolah dengan Auto-Fallback Relasi
      let { data: prestasiData, error: errPrestasi } = await supabase
        .from("prestasi")
        .select("*, profiles!user_id(nama_lengkap, nomor_induk)")
        .order("created_at", { ascending: false });

      if (errPrestasi && errPrestasi.message.includes("relationship")) {
        const fallbackPrestasi = await supabase
          .from("prestasi")
          .select("*, profiles!sekolah_id(nama_lengkap, nomor_induk)")
          .order("created_at", { ascending: false });
        prestasiData = fallbackPrestasi.data;
        errPrestasi = fallbackPrestasi.error;
      }

      if (errPrestasi) throw errPrestasi;
      setPrestasiList(prestasiData || []);

    } catch (error: any) {
      alert("❌ Gagal menarik data dari satelit: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDeleteInovasi = async (id: string, judul: string) => {
    if (window.confirm(`Hapus permanen karya inovasi "${judul}" dari database?`)) {
      await supabase.from('praktik_baik').delete().eq('id', id);
      fetchData();
    }
  };

  const handleDeletePrestasi = async (id: string, nama: string) => {
    if (window.confirm(`Hapus permanen data prestasi "${nama}" dari database?`)) {
      await supabase.from('prestasi').delete().eq('id', id);
      fetchData();
    }
  };

  // Helper Warna Status
  const getStatusBadge = (statusMentah: string) => {
    const st = String(statusMentah || 'MENUNGGU').toUpperCase();
    if (st.includes('SETUJU') || st.includes('VALID') || st === '1') {
      return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-emerald-200">Disetujui</span>;
    }
    if (st.includes('TOLAK') || st.includes('REVISI')) {
      return <span className="bg-rose-100 text-rose-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-rose-200">Ditolak/Revisi</span>;
    }
    return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border border-amber-200">Menunggu</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in relative pb-10">
      
      {/* HEADER HALAMAN */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <span>💡</span> Pusat Data Prestasi & Inovasi
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Pantau seluruh pencapaian dan praktik baik dari seluruh sekolah di wilayah Anda.</p>
        </div>
        
        {/* TOMBOL TAB RESPONSIF */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto justify-around">
          <button 
            onClick={() => setActiveTab('INOVASI')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'INOVASI' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            💡 Karya Inovasi ({inovasiList.length})
          </button>
          <button 
            onClick={() => setActiveTab('PRESTASI')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === 'PRESTASI' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            🏆 Prestasi ({prestasiList.length})
          </button>
        </div>
      </div>

      {/* ================= AREA KONTEN TAB: KARYA INOVASI ================= */}
      {activeTab === 'INOVASI' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 text-sm sm:text-base flex items-center gap-2"><span>🚀</span> Database Karya Inovasi (Praktik Baik)</h3>
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">Tampilan Otomatis Menyesuaikan Layar</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium font-mono text-xs sm:text-sm animate-pulse">Mengunduh data inovasi...</div>
          ) : inovasiList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs sm:text-sm">Belum ada karya inovasi yang diajukan oleh sekolah.</div>
          ) : (
            <>
              {/* 🌟 1. TAMPILAN DESKTOP (TABEL KLASIK - Sembunyi di Mobile) 🌟 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-4 px-6 w-12">No</th>
                      <th className="py-4 px-6">Satuan Pendidikan</th>
                      <th className="py-4 px-6">Karya Inovasi</th>
                      <th className="py-4 px-6">Media</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
                    {inovasiList.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-400">{index + 1}</td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-800 block">{item.profiles?.nama_lengkap || '-'}</span>
                          <span className="text-[10px] font-mono text-slate-500">NPSN: {item.profiles?.nomor_induk || item.npsn || '-'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-indigo-600 block">{item.judul}</span>
                          <span className="text-xs text-slate-500 line-clamp-1 max-w-xs mt-0.5">{item.deskripsi}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-[10px] bg-slate-100 border border-slate-200 px-2 py-1 rounded font-mono font-bold text-slate-600 uppercase">
                            {item.jenis_media || 'DOKUMEN'}
                          </span>
                          {item.media_url && (
                            <a href={item.media_url} target="_blank" rel="noreferrer" className="block text-[10px] font-bold text-blue-500 hover:underline mt-1">Lihat Bukti ↗</a>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {getStatusBadge(item.status_validasi || item.status || item.status_kurasi)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button onClick={() => handleDeleteInovasi(item.id, item.judul)} className="bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer">Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 🌟 2. TAMPILAN MOBILE (KARTU NATIVE - Sembunyi di Desktop) 🌟 */}
              <div className="md:hidden divide-y divide-slate-100 p-4 space-y-4">
                {inovasiList.map((item, index) => (
                  <div key={item.id} className="pt-4 first:pt-0 space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                        #{index + 1}
                      </span>
                      {getStatusBadge(item.status_validasi || item.status || item.status_kurasi)}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug">{item.judul}</h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.deskripsi}</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-150 text-xs space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-mono">Sekolah:</span>
                        <span className="font-bold text-slate-800 text-right">{item.profiles?.nama_lengkap || '-'}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-mono">NPSN:</span>
                        <span className="font-mono text-slate-600">{item.profiles?.nomor_induk || item.npsn || '-'}</span>
                      </div>
                      <div className="flex justify-between text-[11px] pt-1 border-t border-slate-100">
                        <span className="text-slate-400 font-mono">Media:</span>
                        <span className="font-bold text-indigo-600 uppercase">{item.jenis_media || 'DOKUMEN'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      {item.media_url ? (
                        <a 
                          href={item.media_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex-1 text-center py-2 px-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold transition-all active:scale-95 block"
                        >
                          🔗 Lihat Bukti ↗
                        </a>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 italic">Tidak ada lampiran</span>
                      )}

                      <button 
                        onClick={() => handleDeleteInovasi(item.id, item.judul)} 
                        className="py-2 px-4 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all active:scale-95 cursor-pointer"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ================= AREA KONTEN TAB: PRESTASI ================= */}
      {activeTab === 'PRESTASI' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 text-sm sm:text-base flex items-center gap-2"><span>🏆</span> Database Papan Prestasi</h3>
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">Tampilan Otomatis Menyesuaikan Layar</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium font-mono text-xs sm:text-sm animate-pulse">Mengunduh data prestasi...</div>
          ) : prestasiList.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs sm:text-sm">Belum ada prestasi yang dicatatkan oleh sekolah.</div>
          ) : (
            <>
              {/* 🌟 1. TAMPILAN DESKTOP (TABEL KLASIK) 🌟 */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-4 px-6 w-12">No</th>
                      <th className="py-4 px-6">Satuan Pendidikan</th>
                      <th className="py-4 px-6">Nama Prestasi</th>
                      <th className="py-4 px-6">Kategori</th>
                      <th className="py-4 px-6 text-center">Poin</th>
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
                    {prestasiList.map((item, index) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-6 font-medium text-slate-400">{index + 1}</td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-800 block">{item.profiles?.nama_lengkap || '-'}</span>
                          <span className="text-[10px] font-mono text-slate-500">NPSN: {item.profiles?.nomor_induk || item.npsn || '-'}</span>
                        </td>
                        <td className="py-4 px-6 font-bold text-amber-600">{item.nama_prestasi || item.judul || '-'}</td>
                        <td className="py-4 px-6">
                          <span className="text-xs bg-slate-100 px-2 py-1 rounded border border-slate-200 font-medium text-slate-600">
                            {item.kategori || item.jenis || 'Lomba'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-black font-mono text-slate-800">
                          {item.poin || item.points || 0}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {getStatusBadge(item.status_validasi || item.status || item.is_valid)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button onClick={() => handleDeletePrestasi(item.id, item.nama_prestasi || item.judul)} className="bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer">Hapus</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 🌟 2. TAMPILAN MOBILE (KARTU NATIVE) 🌟 */}
              <div className="md:hidden divide-y divide-slate-100 p-4 space-y-4">
                {prestasiList.map((item, index) => (
                  <div key={item.id} className="pt-4 first:pt-0 space-y-3 bg-slate-50/60 p-4 rounded-2xl border border-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                        #{index + 1}
                      </span>
                      {getStatusBadge(item.status_validasi || item.status || item.is_valid)}
                    </div>

                    <div>
                      <h4 className="text-sm font-black text-amber-600 leading-snug">{item.nama_prestasi || item.judul || '-'}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-slate-200/70 px-2 py-0.5 rounded text-slate-700 font-bold">
                          {item.kategori || item.jenis || 'Lomba'}
                        </span>
                        <span className="text-[10px] font-mono font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          +{item.poin || item.points || 0} Poin
                        </span>
                      </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-150 text-xs space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-mono">Sekolah:</span>
                        <span className="font-bold text-slate-800 text-right">{item.profiles?.nama_lengkap || '-'}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400 font-mono">NPSN:</span>
                        <span className="font-mono text-slate-600">{item.profiles?.nomor_induk || item.npsn || '-'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-1">
                      <button 
                        onClick={() => handleDeletePrestasi(item.id, item.nama_prestasi || item.judul)} 
                        className="w-full py-2 px-4 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold hover:bg-rose-500 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                      >
                        <span>🗑️</span> Hapus Data Prestasi
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
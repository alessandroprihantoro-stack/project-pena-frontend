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

      // Jika kolom relasi di DB bukan 'user_id', otomatis beralih ke 'sekolah_id'
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

      // Jika kolom relasi di DB bukan 'user_id', otomatis beralih ke 'sekolah_id'
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
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pusat Data Prestasi & Inovasi</h2>
          <p className="text-slate-500 text-sm mt-1">Pantau seluruh pencapaian dan praktik baik dari seluruh sekolah di wilayah Anda.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button 
            onClick={() => setActiveTab('INOVASI')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'INOVASI' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            💡 Karya Inovasi
          </button>
          <button 
            onClick={() => setActiveTab('PRESTASI')}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'PRESTASI' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            🏆 Prestasi Sekolah
          </button>
        </div>
      </div>

      {/* AREA KONTEN TAB: KARYA INOVASI */}
      {activeTab === 'INOVASI' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><span>💡</span> Database Karya Inovasi (Praktik Baik)</h3>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium font-mono text-sm animate-pulse">Mengunduh data inovasi...</div>
          ) : inovasiList.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Belum ada karya inovasi yang diajukan oleh sekolah.</div>
          ) : (
            <div className="overflow-x-auto">
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
                        <span className="text-xs text-slate-500 line-clamp-1 max-w-62.5 mt-0.5">{item.deskripsi}</span>
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
                        <button onClick={() => handleDeleteInovasi(item.id, item.judul)} className="bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* AREA KONTEN TAB: PRESTASI */}
      {activeTab === 'PRESTASI' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-bold text-slate-700 flex items-center gap-2"><span>🏆</span> Database Papan Prestasi</h3>
          </div>
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-medium font-mono text-sm animate-pulse">Mengunduh data prestasi...</div>
          ) : prestasiList.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Belum ada prestasi yang dicatatkan oleh sekolah.</div>
          ) : (
            <div className="overflow-x-auto">
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
                        <button onClick={() => handleDeletePrestasi(item.id, item.nama_prestasi || item.judul)} className="bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white border border-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors">Hapus</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
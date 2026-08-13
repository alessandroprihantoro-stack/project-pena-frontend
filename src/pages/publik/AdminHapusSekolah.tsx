import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const AdminHapusSekolah = () => {
  const [sekolahList, setSekolahList] = useState<string[]>([]);
  const [selectedSekolah, setSelectedSekolah] = useState<string>('');
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // GANTI PASSWORD INI JIKA PERLU
  const MASTER_PASSWORD = "SuperAdmin2026!";

  useEffect(() => {
    const fetchSchools = async () => {
      if (!isUnlocked) return;
      try {
        const { data } = await supabase.from('kebutuhan_guru').select('sekolah');
        if (data) {
          const uniqueSchools = Array.from(new Set(data.map(d => d.sekolah))).sort();
          setSekolahList(uniqueSchools);
        }
      } catch (err) {
        console.error("Gagal memuat daftar sekolah:", err);
      }
    };
    fetchSchools();
  }, [isUnlocked]);

  const handleUnlock = () => {
    if (passwordInput === MASTER_PASSWORD) setIsUnlocked(true);
    else { alert("Akses Ditolak! Master Password salah."); setPasswordInput(''); }
  };

  const handleDelete = async () => {
    if (!selectedSekolah) {
      alert("Pilih sekolah yang ingin dihapus terlebih dahulu.");
      return;
    }

    const konfirmasi = window.confirm(`⚠️ PERINGATAN BAHAYA ⚠️\n\nApakah Anda YAKIN ingin MENGHAPUS PERMANEN seluruh data:\n"${selectedSekolah}"?\n\nSemua data jumlah jam dan rincian guru akan hilang selamanya.`);
    if (!konfirmasi) return;

    setIsLoading(true);
    try {
      // 1. Hapus dari tabel rekap
      const { error: err1 } = await supabase.from('kebutuhan_guru').delete().eq('sekolah', selectedSekolah);
      if (err1) throw err1;

      // 2. Hapus dari tabel rincian guru
      const { error: err2 } = await supabase.from('guru_kelebihan').delete().eq('sekolah', selectedSekolah);
      if (err2) throw err2;

      alert(`✅ Data "${selectedSekolah}" berhasil dihapus permanen!`);
      setSelectedSekolah('');
      
      // Refresh daftar sekolah
      const { data } = await supabase.from('kebutuhan_guru').select('sekolah');
      if (data) setSekolahList(Array.from(new Set(data.map(d => d.sekolah))).sort());

    } catch (err) {
      alert("❌ Gagal menghapus: " + err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-xl border border-red-900/50 shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-rose-500 uppercase tracking-widest mb-2">Panel Super Admin</h1>
          <p className="text-slate-400 text-sm border-b border-slate-700 pb-4">Mode Penghapusan Instansi</p>
        </div>

        {!isUnlocked ? (
          <div className="flex flex-col gap-4">
            <input 
              type="password" 
              placeholder="Master Password..." 
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-center text-white py-3 rounded-lg focus:outline-none focus:border-rose-500 tracking-widest"
            />
            <button 
              onClick={handleUnlock} 
              className="bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-lg transition-colors"
            >
              BUKA PANEL HAPUS
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 animate-fade-in-up">
            <div className="bg-rose-900/20 p-4 rounded-lg border border-rose-900/50">
              <p className="text-rose-400 text-xs text-center">Pilih instansi yang akan dihapus dari Database Utama. Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            
            <select 
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-3 outline-none focus:border-rose-500"
              value={selectedSekolah}
              onChange={(e) => setSelectedSekolah(e.target.value)}
            >
              <option value="">-- Pilih Sekolah --</option>
              {sekolahList.map(sek => <option key={sek} value={sek}>{sek}</option>)}
            </select>

            <button 
              onClick={handleDelete}
              disabled={isLoading || !selectedSekolah}
              className={`py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${(!selectedSekolah || isLoading) ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50'}`}
            >
              {isLoading ? '⏳ MENGHAPUS...' : '⚠️ HAPUS DATA PERMANEN'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHapusSekolah;
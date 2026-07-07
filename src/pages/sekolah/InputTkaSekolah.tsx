/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

interface MapelInput {
  [key: string]: number | '';
}

export default function InputTkaSekolah() {
  const { profile } = useAuth();
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  
  // 🌟 STATE BARU UNTUK MESIN RIWAYAT
  const [historyTka, setHistoryTka] = useState<any[]>([]);

  // 1. Definisikan Struktur Mapel
  const mapelWajib = [
    { id: 'b_indonesia', label: '🇲🇨 Bahasa Indonesia Wajib' },
    { id: 'matematika', label: '🧮 Matematika Wajib' },
    { id: 'b_inggris', label: '🇬🇧 Bahasa Inggris Wajib' },
  ];

  const mapelIpa = [
    { id: 'fisika', label: '⚛️ Fisika' },
    { id: 'kimia', label: '🧪 Kimia' },
    { id: 'biologi', label: '🧬 Biologi' },
  ];

  const mapelIps = [
    { id: 'ekonomi', label: '📈 Ekonomi' },
    { id: 'geografi', label: '🗺️ Geografi' },
    { id: 'sociologi', label: '👥 Sosiologi' },
    { id: 'sejarah', label: '⏳ Sejarah' },
    { id: 'antropologi', label: '🗿 Antropologi' },
    { id: 'ppkn', label: '🛡️ PPKn' },
  ];

  const mapelLanjut = [
    { id: 'matematika_tl', label: '📐 Matematika Tkt. Lanjut' },
    { id: 'b_indonesia_tl', label: '✍️ Bhs. Indonesia Tkt. Lanjut' },
    { id: 'b_inggris_tl', label: '🗣️ Bhs. Inggris Tkt. Lanjut' },
  ];

  const mapelAsing = [
    { id: 'b_jerman', label: '🇩🇪 Bahasa Jerman' },
    { id: 'b_prancis', label: '🇫🇷 Bahasa Prancis' },
    { id: 'b_jepang', label: '🇯🇵 Bahasa Jepang' },
    { id: 'b_mandarin', label: '🇨🇳 Bahasa Mandarin' },
    { id: 'b_korea', label: '🇰🇷 Bahasa Korea' },
    { id: 'b_arab', label: '🇸🇦 Bahasa Arab' },
  ];

  const [nilai, setNilai] = useState<MapelInput>({
    b_indonesia: '', matematika: '', b_inggris: '',
    fisika: '', kimia: '', biologi: '',
    ekonomi: '', geografi: '', sociologi: '', sejarah: '', antropologi: '', ppkn: '',
    matematika_tl: '', b_indonesia_tl: '', b_inggris_tl: '',
    b_jerman: '', b_prancis: '', b_jepang: '', b_mandarin: '', b_korea: '', b_arab: ''
  });

  const [rataRataTotal, setRataRataTotal] = useState(0);

  // 🌟 FUNGSI PENARIK DATA RIWAYAT KESELURUHAN
  const fetchHistoryTka = async () => {
    if (!profile?.nomor_induk) return;
    try {
      const { data, error } = await supabase
        .from('tka_sekolah')
        .select('id, tahun_ajaran, semester, rata_rata_total, created_at')
        .eq('npsn', profile.nomor_induk)
        .order('tahun_ajaran', { ascending: false });

      if (error) throw error;
      setHistoryTka(data || []);
    } catch (err: any) {
      console.error("Gagal memuat riwayat TKA:", err.message);
    }
  };

  // FUNGSI PENARIK DATA FORM AKTIF
  const fetchNilaiTka = async () => {
    if (!profile?.id) return;
    setFetching(true);
    try {
      const npsnMutlak = profile?.nomor_induk || '';
      const { data, error } = await supabase
        .from('tka_sekolah')
        .select('*')
        .eq('npsn', npsnMutlak)
        .eq('tahun_ajaran', tahunAjaran)
        .eq('semester', 'TAHUNAN') 
        .maybeSingle();

      if (error) throw error;

      if (data && data.nilai_mapel) {
        const defaultNilai: MapelInput = { ...nilai };
        Object.keys(nilai).forEach(key => {
          defaultNilai[key] = (data.nilai_mapel[key] !== undefined && data.nilai_mapel[key] !== '') 
            ? Number(data.nilai_mapel[key]) 
            : '';
        });
        setNilai(defaultNilai);
        setRataRataTotal(Number(data.rata_rata_total) || 0);
      } else {
        setNilai({
          b_indonesia: '', matematika: '', b_inggris: '', fisika: '', kimia: '', biologi: '',
          ekonomi: '', geografi: '', sociologi: '', sejarah: '', antropologi: '', ppkn: '',
          matematika_tl: '', b_indonesia_tl: '', b_inggris_tl: '',
          b_jerman: '', b_prancis: '', b_jepang: '', b_mandarin: '', b_korea: '', b_arab: ''
        });
        setRataRataTotal(0);
      }
    } catch (err: any) {
      console.error("Gagal memuat TKA:", err.message);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchNilaiTka();
  }, [tahunAjaran, profile]);

  useEffect(() => {
    fetchHistoryTka();
  }, [profile]);

  const hitungRataRataLokal = (currentNilai: MapelInput) => {
    let totalScore = 0; let jumlahMapelTerisi = 0;
    Object.values(currentNilai).forEach(val => {
      if (val !== '' && !isNaN(Number(val))) { totalScore += Number(val); jumlahMapelTerisi++; }
    });
    return jumlahMapelTerisi > 0 ? Number((totalScore / jumlahMapelTerisi).toFixed(2)) : 0;
  };

  const handleInputChange = (mapelId: string, val: string) => {
    const numericVal = val === '' ? '' : Math.min(100, Math.max(0, parseFloat(val) || 0));
    const updateNilai: MapelInput = { ...nilai, [mapelId]: numericVal };
    setNilai(updateNilai);
    setRataRataTotal(hitungRataRataLokal(updateNilai));
  };

  const handleSimpanTka = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setLoading(true);

    try {
      const npsnMutlak = profile?.nomor_induk || '';
      const cleanNilasMapel: any = {};
      Object.keys(nilai).forEach(key => {
        if (nilai[key] !== '') cleanNilasMapel[key] = Number(nilai[key]);
      });

      const payload = {
        user_id: profile.id,
        npsn: npsnMutlak,
        tahun_ajaran: tahunAjaran,
        semester: 'TAHUNAN', 
        nilai_mapel: cleanNilasMapel,
        rata_rata_total: rataRataTotal
      };

      const { data: eksis } = await supabase.from('tka_sekolah').select('id').eq('npsn', npsnMutlak).eq('tahun_ajaran', tahunAjaran).eq('semester', 'TAHUNAN').maybeSingle();

      let dbError = null;
      if (eksis) {
        const { error } = await supabase.from('tka_sekolah').update(payload).eq('id', eksis.id);
        dbError = error;
      } else {
        const { error } = await supabase.from('tka_sekolah').insert(payload);
        dbError = error;
      }

      if (dbError) throw dbError;
      alert("✅ Sukses Permanen: Data Rapor Kemampuan Akademik (TKA) berhasil dikunci!");
      
      // Refresh riwayat setelah berhasil simpan
      fetchHistoryTka();
    } catch (err: any) {
      alert("❌ Gagal Menyimpan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🌟 FUNGSI EDIT RIWAYAT
  const handleEditHistory = (tahun_ajaran_target: string) => {
    setTahunAjaran(tahun_ajaran_target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 🌟 FUNGSI HAPUS RIWAYAT
  const handleDeleteHistory = async (id_target: string, tahun_ajaran_target: string) => {
    if (!window.confirm(`⚠️ PERINGATAN: Apakah Anda yakin ingin menghapus permanen data TKA Tahun Ajaran ${tahun_ajaran_target}?\n\nData yang dihapus akan hilang dari klasemen wilayah!`)) {
      return;
    }
    
    try {
      const { error } = await supabase.from('tka_sekolah').delete().eq('id', id_target);
      if (error) throw error;
      
      alert(`🗑️ Data TKA ${tahun_ajaran_target} berhasil dihapus.`);
      fetchHistoryTka(); // Refresh tabel bawah
      
      // Jika data yang dihapus adalah data yang sedang dibuka di form atas, refresh form atas
      if (tahunAjaran === tahun_ajaran_target) {
        fetchNilaiTka();
      }
    } catch (err: any) {
      alert("❌ Gagal menghapus data: " + err.message);
    }
  };

  // RENDER FIELD DENGAN SENTUHAN HOVER BIRU NEO-BRUTALISM
  const renderField = (m: { id: string; label: string }) => (
    <div key={m.id} className="p-3.5 rounded-xl border-2 transition-colors flex items-center justify-between gap-4 bg-white border-black/20 hover:border-blue-600 dark:bg-slate-950 dark:border-slate-800/80 dark:hover:border-cyan-500">
      <label className="font-mono font-black uppercase text-[10px] tracking-wide truncate text-slate-700 dark:text-slate-300">{m.label}</label>
      <input type="number" step="0.01" min="0" max="100" value={nilai[m.id]} onChange={e => handleInputChange(m.id, e.target.value)} placeholder="0.00" className="w-24 p-2 rounded-lg border-2 font-black font-mono text-center outline-none text-sm transition-colors bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm" />
    </div>
  );

  return (
    <div className="space-y-10 animate-fade-in relative transition-all">
      
      {/* ================= AREA FORM INPUT TKA ================= */}
      <form onSubmit={handleSimpanTka} className="space-y-6 relative transition-all">
        {fetching && <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/50 backdrop-blur-sm z-20 flex items-center justify-center font-mono font-black text-xs animate-pulse text-blue-700 dark:text-cyan-400 rounded-3xl">Memanggil Arsip TKA...</div>}

        {/* HEADER: Tahun Ajaran & Rata-rata */}
        <div className="p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all bg-white/50 border-2 border-black/20 dark:bg-slate-950/50 dark:border-slate-800/80">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-blue-800 dark:text-cyan-400">Tahun Ajaran Pelaksanaan:</span>
            <select value={tahunAjaran} onChange={e=>setTahunAjaran(e.target.value)} className="p-2.5 rounded-xl font-black outline-none cursor-pointer w-48 transition-colors border-2 bg-white border-black text-black focus:border-blue-600 dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm">
              <option value="2026/2027">2026/2027</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
            </select>
          </div>
          <div className="p-4 rounded-xl flex items-center gap-4 shrink-0 transition-all border-2 bg-white border-black shadow-neo-sm dark:bg-slate-900 dark:border-slate-700 dark:shadow-none">
            <div>
              <h4 className="text-[10px] font-mono font-black uppercase tracking-wider leading-none text-blue-700 dark:text-cyan-400">Rata-Rata Total</h4>
              <p className="text-[9px] mt-0.5 font-bold text-slate-500 dark:text-slate-400">Kalkulasi otomatis mapel terisi</p>
            </div>
            <span className="text-3xl font-black font-mono text-black dark:text-white">{rataRataTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* KELOMPOK MATA PELAJARAN */}
        <div className="space-y-6 bg-white/50 p-5 rounded-2xl border-2 border-black/20 dark:bg-slate-950/50 dark:border-slate-800/80">
          <div className="space-y-3"><h4 className="text-[10px] font-mono font-black uppercase tracking-widest border-b pb-1.5 border-black/10 text-blue-700 dark:text-cyan-400 dark:border-slate-800">📌 KELOMPOK MAPEL WAJIB</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{mapelWajib.map(renderField)}</div></div>
          <div className="space-y-3"><h4 className="text-[10px] font-mono font-black uppercase tracking-widest border-b pb-1.5 border-black/10 text-emerald-700 dark:text-emerald-400 dark:border-slate-800">🧪 KELOMPOK IPA / SAINS</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{mapelIpa.map(renderField)}</div></div>
          <div className="space-y-3"><h4 className="text-[10px] font-mono font-black uppercase tracking-widest border-b pb-1.5 border-black/10 text-orange-700 dark:text-amber-400 dark:border-slate-800">🗺️ KELOMPOK IPS / SOSSOS & HUMANIORA</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{mapelIps.map(renderField)}</div></div>
          <div className="space-y-3"><h4 className="text-[10px] font-mono font-black uppercase tracking-widest border-b pb-1.5 border-black/10 text-indigo-700 dark:text-indigo-400 dark:border-slate-800">📐 KELOMPOK TINGKAT LANJUT</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{mapelLanjut.map(renderField)}</div></div>
          <div className="space-y-3"><h4 className="text-[10px] font-mono font-black uppercase tracking-widest border-b pb-1.5 border-black/10 text-purple-700 dark:text-purple-400 dark:border-slate-800">🇩🇪 KELOMPOK BAHASA ASING</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{mapelAsing.map(renderField)}</div></div>
        </div>

        {/* TOMBOL SUBMIT TEMA BIRU NEO-BRUTALISM */}
        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={loading} className="w-full md:w-auto px-8 py-4 font-black rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 border-2 bg-blue-600 hover:bg-blue-500 text-white border-black shadow-neo hover:-translate-y-1 active:translate-y-0 active:shadow-none flex items-center justify-center gap-2 dark:bg-blue-500 dark:hover:bg-blue-400 dark:border-transparent dark:shadow-none">
            {loading ? "MENGUNCI DATA NILAI..." : <><span>💾</span> SIMPAN & KUNCI NILAI TKA</>}
          </button>
        </div>
      </form>

      {/* ================= AREA RIWAYAT INPUT TKA ================= */}
      <div className="bg-white/50 dark:bg-slate-950/50 p-6 rounded-3xl border-2 border-black/20 dark:border-slate-800/80 shadow-sm mt-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-black/10 dark:border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-lg font-black font-mono uppercase tracking-widest text-slate-800 dark:text-white flex items-center gap-2">
              <span>📚</span> RIWAYAT ARSIP TKA
            </h3>
            <p className="text-xs text-slate-500 mt-1 dark:text-slate-400">
              Rekam jejak seluruh pelaporan nilai TKA sekolah Anda ke sistem PENA.
            </p>
          </div>
        </div>

        {historyTka.length === 0 ? (
          <div className="text-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl">
            <span className="text-4xl block mb-2 opacity-50">📭</span>
            <p className="text-xs font-mono text-slate-500 dark:text-slate-400">Belum ada riwayat TKA yang tersimpan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <table className="w-full text-left border-collapse bg-white dark:bg-slate-950">
              <thead>
                <tr className="bg-slate-100 dark:bg-[#061030] text-[10px] font-mono font-black uppercase tracking-widest text-slate-600 dark:text-cyan-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 w-12 text-center">NO</th>
                  <th className="p-4">Tahun Ajaran</th>
                  <th className="p-4">Semester</th>
                  <th className="p-4">Rata-Rata Terkunci</th>
                  <th className="p-4">Waktu Lapor</th>
                  <th className="p-4 text-center">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-sans text-slate-700 dark:text-slate-300">
                {historyTka.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-4 font-bold text-blue-700 dark:text-blue-300">{row.tahun_ajaran}</td>
                    <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{row.semester}</td>
                    <td className="p-4">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-lg font-black font-mono">
                        {Number(row.rata_rata_total).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4 text-[11px] text-slate-500 dark:text-slate-400">
                      {new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* TOMBOL EDIT */}
                        <button 
                          onClick={() => handleEditHistory(row.tahun_ajaran)}
                          className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-amber-300 rounded-lg font-bold font-mono text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>✏️</span> Edit
                        </button>
                        {/* TOMBOL HAPUS */}
                        <button 
                          onClick={() => handleDeleteHistory(row.id, row.tahun_ajaran)}
                          className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 dark:bg-rose-500/20 dark:hover:bg-rose-500/30 dark:text-rose-300 rounded-lg font-bold font-mono text-[10px] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>🗑️</span> Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
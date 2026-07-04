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
        .eq('semester', 'TAHUNAN') // 👈 Semester dirahasiakan di background
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
        semester: 'TAHUNAN', // 👈 Paksa pengiriman status TAHUNAN agar database tidak menolak
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
    } catch (err: any) {
      alert("❌ Gagal Menyimpan: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 🌟 RENDER FIELD DENGAN SENTUHAN HOVER BIRU NEO-BRUTALISM
  const renderField = (m: { id: string; label: string }) => (
    <div key={m.id} className="p-3.5 rounded-xl border-2 transition-colors flex items-center justify-between gap-4 bg-white border-black/20 hover:border-blue-600 dark:bg-slate-950 dark:border-slate-800/80 dark:hover:border-cyan-500">
      <label className="font-mono font-black uppercase text-[10px] tracking-wide truncate text-slate-700 dark:text-slate-300">{m.label}</label>
      <input type="number" step="0.01" min="0" max="100" value={nilai[m.id]} onChange={e => handleInputChange(m.id, e.target.value)} placeholder="0.00" className="w-24 p-2 rounded-lg border-2 font-black font-mono text-center outline-none text-sm transition-colors bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm" />
    </div>
  );

  return (
    <form onSubmit={handleSimpanTka} className="space-y-6 animate-fade-in relative transition-all">
      {fetching && <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/50 backdrop-blur-sm z-20 flex items-center justify-center font-mono font-black text-xs animate-pulse text-blue-700 dark:text-cyan-400">Memanggil Arsip TKA...</div>}

      {/* HEADER: Tahun Ajaran & Rata-rata (DISESUAIKAN DENGAN BACKGROUND PUTIH/TRANSPARAN) */}
      <div className="p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all bg-white/50 border-2 border-black/20 dark:bg-slate-950/50 dark:border-slate-800/80">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-mono font-black uppercase tracking-wider text-blue-800 dark:text-cyan-400">Tahun Ajaran Pelaksanaan:</span>
          <select value={tahunAjaran} onChange={e=>setTahunAjaran(e.target.value)} className="p-2.5 rounded-xl font-black outline-none cursor-pointer w-48 transition-colors border-2 bg-white border-black text-black focus:border-blue-600 dark:bg-slate-950 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm">
            <option value="2026/2027">2026/2027</option>
            <option value="2025/2026">2025/2026</option>
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

      {/* 🌟 TOMBOL SUBMIT TEMA BIRU NEO-BRUTALISM */}
      <div className="pt-4 flex justify-end">
        <button type="submit" disabled={loading} className="w-full py-4 font-black rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 border-2 bg-blue-600 hover:bg-blue-500 text-white border-black shadow-neo hover:-translate-y-1 active:translate-y-0 active:shadow-none flex items-center justify-center gap-2 dark:bg-blue-500 dark:hover:bg-blue-400 dark:border-transparent dark:shadow-none">
          {loading ? "MENGUNCI DATA NILAI..." : <><span>💾</span> SIMPAN & KUNCI NILAI TKA</>}
        </button>
      </div>
    </form>
  );
}
import React, { useState, useEffect } from 'react';
import { TeacherData } from './DashboardStatistik';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

export interface ProcessedData {
    kabupaten: string;
    kecamatan: string;
    sekolah: string;
    mapel: Record<string, { kurang: number; kelebihan: number }>;
}

export interface ExtendedTeacherData extends TeacherData {
    is_rekomendasi_internal?: boolean;
    alasanRekomendasi?: string;
}

interface PanelProps {
  showAnalisis: boolean;
  setShowAnalisis: (val: boolean) => void;
  analisisSekolah: string;
  setAnalisisSekolah: (val: string) => void;
  listSekolah: string[];
  spreadsheetData: ProcessedData[];
  allTeachers: ExtendedTeacherData[];
  onTeacherClick: (t: TeacherData) => void;
}

interface UsulanMutasi {
    id: number;
    id_guru: number | string;
    nama_guru: string;
    mapel: string;
    sekolah_asal: string;
    sekolah_tujuan: string;
    npsn_tujuan: string;
    status: string;
}

interface MasterSekolahSimple {
    npsn: string;
    nama_sekolah: string;
}

const calculateBKEkuivalen = (inputVal: number): number => {
    if (inputVal === 0) return 0;
    if (inputVal <= 50) {
        if (inputVal >= 5) return 24 + ((inputVal - 5) * 2);
        else return Math.round((inputVal / 5) * 24);
    } else {
        if (inputVal >= 150) {
            const surplusSiswa = inputVal > 160 ? inputVal - 160 : 0;
            const surplusRombel = Math.floor(surplusSiswa / 32); 
            return 24 + (surplusRombel * 2);
        } else {
            return Math.round((inputVal / 160) * 24);
        }
    }
};

const getJamUtama = (t: TeacherData): number => {
    const isBK = t.bidangStudi?.toUpperCase().includes('KONSELING') || 
                 t.bidangStudi?.toUpperCase().includes('BIMBINGAN') || 
                 t.bidangStudi?.toUpperCase() === 'BK' || 
                 t.bidangStudi?.toUpperCase() === 'BP/BK';
    const jamRaw = Number(t.jamMengajar) || 0;
    return (isBK && jamRaw > 0) ? calculateBKEkuivalen(jamRaw) : jamRaw;
};

const PanelAnalisis: React.FC<PanelProps> = ({ 
  showAnalisis, setShowAnalisis, analisisSekolah, setAnalisisSekolah, 
  listSekolah, spreadsheetData, allTeachers, onTeacherClick 
}) => {
  const { profile } = useAuth();
  const userRole = String(profile?.role).toLowerCase();
  const isCabdinOrAdmin = userRole === 'cabdin' || userRole === 'super_admin';
  
  const [antrean, setAntrean] = useState<UsulanMutasi[]>([]);
  const [masterSekolah, setMasterSekolah] = useState<MasterSekolahSimple[]>([]);
  const [simulasiModal, setSimulasiModal] = useState<{isOpen: boolean, teacher: ExtendedTeacherData | null}>({isOpen: false, teacher: null});
  const [targetSekolah, setTargetSekolah] = useState('');
  
  const [expandedKandidatGuru, setExpandedKandidatGuru] = useState<Record<string, boolean>>({});
  const [expandedKandidatSekolah, setExpandedKandidatSekolah] = useState<Record<string, boolean>>({});

  const fetchAntreanManual = async () => {
      try {
          const { data, error } = await supabase.from('usulan_mutasi').select('*').eq('status', 'MENUNGGU').order('created_at', { ascending: false });
          if (!error && data) setAntrean(data as UsulanMutasi[]);
      } catch (err) { console.error(err); }
  };

  useEffect(() => {
      let isMounted = true;
      const loadPanelData = async () => {
          if (!showAnalisis) return;
          try {
              const { data: antreanData, error: antreanErr } = await supabase.from('usulan_mutasi').select('*').eq('status', 'MENUNGGU').order('created_at', { ascending: false });
              if (!antreanErr && antreanData && isMounted) setAntrean(antreanData as UsulanMutasi[]);
          } catch (err) { console.error(err); }

          try {
              const { data: sekolahData, error: sekolahErr } = await supabase.from('master_sekolah').select('npsn, nama_sekolah');
              if (!sekolahErr && sekolahData && isMounted) setMasterSekolah(sekolahData as MasterSekolahSimple[]);
          } catch (err) { console.error(err); }
      };
      loadPanelData();
      return () => { isMounted = false; };
  }, [showAnalisis]);

  if (!showAnalisis) return null;

  const dataSekolah = spreadsheetData.find(d => d.sekolah === analisisSekolah);
  const teachersInSchool = allTeachers.filter(t => t.sekolah === analisisSekolah);

  // 🌟 SORTIR PERMANEN: Guru Rekomendasi wajib di urutan 1
  teachersInSchool.sort((a, b) => {
      const aRek = a.is_rekomendasi_internal ? 1 : 0;
      const bRek = b.is_rekomendasi_internal ? 1 : 0;
      return bRek - aRek;
  });

  const handleAjukanMutasi = async () => {
      if(!simulasiModal.teacher || !targetSekolah) return;
      const t = simulasiModal.teacher;
      const targetData = masterSekolah.find(s => s.nama_sekolah === targetSekolah);
      
      try {
          const { error } = await supabase.from('usulan_mutasi').insert({
              id_guru: t.id,
              nama_guru: t.nama,
              mapel: t.tugasMengajar || t.bidangStudi || '-',
              sekolah_asal: t.sekolah,
              sekolah_tujuan: targetSekolah,
              npsn_tujuan: targetData?.npsn || '',
              status: 'MENUNGGU'
          });
          if(error) throw error;
          alert("✅ Simulasi Mutasi berhasil diajukan ke Cabdin!");
          setSimulasiModal({isOpen: false, teacher: null});
          setTargetSekolah('');
          fetchAntreanManual();
      } catch(err: unknown) {
          if (err instanceof Error) alert("❌ Gagal mengajukan: " + err.message);
      }
  };

  const handleAccMutasi = async (usulan: UsulanMutasi) => {
      if(!window.confirm(`✅ Yakin MENYETUJUI mutasi:\n${usulan.nama_guru}\nKe: ${usulan.sekolah_tujuan}?`)) return;
      try {
          const { error: err1 } = await supabase.from('usulan_mutasi').update({status: 'DISETUJUI'}).eq('id', usulan.id);
          if (err1) throw err1;
          
          const { error: err2 } = await supabase.from('guru_kelebihan').update({ sekolah: usulan.sekolah_tujuan, npsn: usulan.npsn_tujuan }).eq('id', usulan.id_guru);
          if (err2) throw err2;

          alert("✅ Mutasi Disetujui dan Dieksekusi Permanen!");
          window.location.reload();
      } catch (err: unknown) { 
          if (err instanceof Error) alert("❌ Terjadi kesalahan: " + err.message); 
      }
  };

  const handleTolakMutasi = async (usulan: UsulanMutasi) => {
      if(!window.confirm(`❌ Yakin MENOLAK mutasi ${usulan.nama_guru}?`)) return;
      try {
          const { error } = await supabase.from('usulan_mutasi').update({status: 'DITOLAK'}).eq('id', usulan.id);
          if (error) throw error;
          alert("❌ Mutasi Ditolak.");
          fetchAntreanManual();
      } catch (err: unknown) { 
          if (err instanceof Error) alert("❌ Terjadi kesalahan: " + err.message); 
      }
  };

  const mapelKurang = dataSekolah ? Object.entries(dataSekolah.mapel).filter((item) => item[1].kurang > 0) : [];
  const mapelSurplusCombined = new Set<string>();

  if (dataSekolah) {
      Object.entries(dataSekolah.mapel).forEach(([m, val]) => {
          if (val.kelebihan > 0) mapelSurplusCombined.add(m.toUpperCase());
      });
  }

  teachersInSchool.forEach(t => {
      // 🌟 JALUR VIP SURPLUS: Guru rekomendasi otomatis masuk radar Surplus
      if (t.is_rekomendasi_internal) {
          const m = t.tugasMengajar || t.bidangStudi;
          if (m) mapelSurplusCombined.add(m.toUpperCase());
      }
      const jam = getJamUtama(t);
      if (jam > 0 && jam < 24) {
          const m = t.tugasMengajar || t.bidangStudi;
          if (m) mapelSurplusCombined.add(m.toUpperCase());
      }
  });

  const combinedSurplusArray = Array.from(mapelSurplusCombined).sort();

  return (
    <div className="bg-slate-900 border border-amber-500/30 p-6 rounded-xl shadow-2xl mb-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
        <h2 className="text-xl font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">
            💡 Analisis Kebutuhan & Simulasi Mutasi
        </h2>
        <button onClick={() => setShowAnalisis(false)} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded font-bold transition-colors">Tutup Panel</button>
      </div>

      {isCabdinOrAdmin && antrean.length > 0 && (
          <div className="mb-8 bg-indigo-950/40 border border-indigo-500/50 p-5 rounded-xl shadow-inner animate-pulse-slow">
              <h3 className="text-sm font-black text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                  📥 Kotak Masuk: Pengajuan Mutasi ({antrean.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {antrean.map(u => (
                      <div key={u.id} className="bg-slate-900 border border-indigo-800 p-4 rounded-lg flex flex-col justify-between shadow-lg">
                          <div className="mb-4">
                              <strong className="text-white text-lg block">{u.nama_guru}</strong>
                              <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">{u.mapel}</span>
                              <div className="mt-3 text-sm flex flex-col gap-1">
                                  <div className="flex items-center gap-2"><span className="text-rose-400">Dari:</span> <span className="text-slate-200">{u.sekolah_asal}</span></div>
                                  <div className="flex items-center gap-2"><span className="text-emerald-400">Ke:</span> <span className="text-slate-200 font-bold">{u.sekolah_tujuan}</span></div>
                              </div>
                          </div>
                          <div className="flex gap-2">
                              <button onClick={() => handleAccMutasi(u)} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded text-xs font-black shadow-lg">✅ ACC / SETUJUI</button>
                              <button onClick={() => handleTolakMutasi(u)} className="flex-1 bg-rose-900 hover:bg-rose-700 text-rose-300 hover:text-white py-2 rounded text-xs font-bold border border-rose-800">❌ TOLAK</button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <div className="mb-6">
        <label className="block text-sm font-bold text-slate-300 mb-2">Pilih Sekolah yang Ingin Dianalisis & Disimulasikan:</label>
        <select value={analisisSekolah} onChange={(e) => setAnalisisSekolah(e.target.value)} className="w-full md:w-1/2 bg-slate-950 border border-amber-600/50 text-white rounded-lg px-4 py-3 outline-none focus:border-amber-400 font-bold shadow-inner">
          <option value="">-- Ketuk Untuk Memilih Sekolah --</option>
          {listSekolah.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {analisisSekolah && (
        <div className="animate-fade-in space-y-6">
          {!dataSekolah && (
              <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-4 rounded-lg flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <div>
                      <strong className="block">Data Spreadsheet Pemetaan Belum Siap / Gagal Terbaca!</strong>
                      <span className="text-xs">Sistem tidak dapat menarik data defisit/surplus dari Google Sheets untuk sekolah ini. Namun Anda tetap bisa melakukan simulasi mutasi dari data riil di bawah ini.</span>
                  </div>
              </div>
          )}

          {dataSekolah && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                  
                  {/* BLOK DEFISIT */}
                  <div className="bg-rose-950/20 border border-rose-900/50 p-5 rounded-xl shadow-inner">
                      <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest border-b border-rose-900/50 pb-2 mb-4">📉 Kekurangan Guru (Defisit)</h4>
                      {mapelKurang.length === 0 ? ( <div className="text-slate-500 italic text-sm text-center py-4">Tidak ada kekurangan guru.</div> ) : (
                          <ul className="space-y-4">
                              {mapelKurang.map(([namaMapel, val]) => {
                                  const kandidatGuru = allTeachers.filter(t => {
                                      if (t.sekolah === analisisSekolah) return false;
                                      
                                      const m = (t.bidangStudi || t.tugasMengajar || '').toUpperCase();
                                      if (m !== namaMapel.toUpperCase()) return false;
                                      
                                      const entrySheet = Object.entries(spreadsheetData.find(d => d.sekolah === t.sekolah)?.mapel || {}).find(([k]) => k.toUpperCase() === m);
                                      const schoolSurplus = entrySheet ? entrySheet[1].kelebihan : 0;
                                      
                                      const jamUtama = getJamUtama(t);
                                      const isKurangJam = jamUtama > 0 && jamUtama < 24;
                                      
                                      // 🌟 JALUR VIP: Guru Rekomendasi Pasti Lolos Filter!
                                      return schoolSurplus > 0 || isKurangJam || t.is_rekomendasi_internal;
                                  }).sort((a, b) => {
                                      // 🌟 SORTIR PERMANEN: Guru Rekomendasi ke Atas
                                      const aRek = a.is_rekomendasi_internal ? 1 : 0;
                                      const bRek = b.is_rekomendasi_internal ? 1 : 0;
                                      if (bRek !== aRek) return bRek - aRek;
                                      
                                      const aKecMatch = a.kecamatan === dataSekolah.kecamatan ? 1 : 0;
                                      const bKecMatch = b.kecamatan === dataSekolah.kecamatan ? 1 : 0;
                                      return bKecMatch - aKecMatch; 
                                  });

                                  const isExpandedGuru = expandedKandidatGuru[namaMapel];
                                  const displayedKandidat = isExpandedGuru ? kandidatGuru : kandidatGuru.slice(0, 3);

                                  return (
                                  <li key={namaMapel} className="bg-rose-900/20 rounded-lg border border-rose-800/30 overflow-hidden">
                                      <div className="flex justify-between items-center px-4 py-3 bg-rose-950/40 border-b border-rose-900/50">
                                          <span className="text-rose-100 font-bold">{namaMapel}</span>
                                          <span className="bg-rose-600 text-white text-xs font-black px-2 py-1 rounded">Butuh {val.kurang}</span>
                                      </div>
                                      
                                      <div className="p-3 bg-slate-900/50">
                                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-2">💡 Rekomendasi Guru (Surplus / Kurang Jam):</span>
                                          {kandidatGuru.length > 0 ? (
                                              <div className="space-y-2">
                                                  {displayedKandidat.map(kg => {
                                                      const kgJam = getJamUtama(kg);
                                                      const isKgDefisit = kgJam > 0 && kgJam < 24;
                                                      return (
                                                      <div key={kg.id} className="flex justify-between items-center bg-slate-800 border border-slate-700 p-2 rounded">
                                                          <div className="flex flex-col cursor-pointer w-full" onClick={() => onTeacherClick(kg)}>
                                                              <span className="text-xs font-bold text-sky-300 hover:text-amber-400">{kg.nama}</span>
                                                              <span className="text-[9px] text-slate-400">
                                                                  Dari: {kg.sekolah} | Kec. {kg.kecamatan} 
                                                                  {kg.kecamatan === dataSekolah.kecamatan && <span className="text-emerald-400 font-bold ml-1">(📍 1 Domisili)</span>}
                                                                  <span className={isKgDefisit ? "text-rose-400 font-bold ml-1" : "text-slate-500 ml-1"}> | Jam Utama: {kgJam} JP</span>
                                                              </span>
                                                              
                                                              {kg.is_rekomendasi_internal && (
                                                                  <span className="text-[9px] text-amber-400 font-black uppercase mt-1.5 block leading-tight border-t border-amber-900/50 pt-1.5">
                                                                      🌟 Prioritas Mutasi <br/>
                                                                      {kg.alasanRekomendasi && <span className="text-[8px] text-amber-200 font-normal italic normal-case">"{kg.alasanRekomendasi}"</span>}
                                                                  </span>
                                                              )}
                                                          </div>
                                                      </div>
                                                  )})}
                                                  
                                                  {kandidatGuru.length > 3 && (
                                                      <button 
                                                          onClick={() => setExpandedKandidatGuru(p => ({...p, [namaMapel]: !isExpandedGuru}))}
                                                          className="w-full mt-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 text-[10px] font-bold py-1.5 rounded transition-colors"
                                                      >
                                                          {isExpandedGuru ? 'Tutup Daftar Kandidat ⬆️' : `+ Lihat ${kandidatGuru.length - 3} Kandidat Lainnya ⬇️`}
                                                      </button>
                                                  )}
                                              </div>
                                          ) : (
                                              <div className="text-[10px] text-slate-500 italic">Belum ada guru surplus/kurang jam di mapel ini dari sekolah lain.</div>
                                          )}
                                      </div>
                                  </li>
                              )})}
                          </ul>
                      )}
                  </div>

                  {/* BLOK SURPLUS */}
                  <div className="bg-emerald-950/20 border border-emerald-900/50 p-5 rounded-xl shadow-inner">
                      <h4 className="text-sm font-black text-emerald-400 uppercase tracking-widest border-b border-emerald-900/50 pb-2 mb-4">📈 Kelebihan Guru & Defisit Jam (&lt; 24)</h4>
                      {combinedSurplusArray.length === 0 ? ( <div className="text-slate-500 italic text-sm text-center py-4">Tidak ada kelebihan guru maupun guru kurang jam.</div> ) : (
                          <div className="space-y-5">
                              {combinedSurplusArray.map(namaMapelUpper => {
                                  
                                  const sheetEntry = Object.entries(dataSekolah.mapel).find(([key]) => key.toUpperCase() === namaMapelUpper);
                                  const sheetVal = sheetEntry ? sheetEntry[1].kelebihan : 0;
                                  const displayNamaMapel = sheetEntry ? sheetEntry[0] : namaMapelUpper;

                                  const surplusTeachers = teachersInSchool.filter(t => {
                                      const m = (t.bidangStudi || t.tugasMengajar || '').toUpperCase();
                                      if (m !== namaMapelUpper) return false;
                                      
                                      // 🌟 JALUR VIP SURPLUS
                                      if (t.is_rekomendasi_internal) return true;
                                      
                                      if (sheetVal > 0) return true; 
                                      const jam = getJamUtama(t);
                                      return jam > 0 && jam < 24;
                                  });

                                  return (
                                      <div key={namaMapelUpper} className="bg-emerald-900/10 border border-emerald-800/30 rounded-lg overflow-hidden">
                                          <div className="flex justify-between items-center p-3 bg-emerald-950/40 border-b border-emerald-900/50">
                                              <strong className="text-emerald-200">{displayNamaMapel}</strong>
                                              <div className="flex gap-2">
                                                  {sheetVal > 0 && <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-1 rounded">Lebih {sheetVal}</span>}
                                                  {sheetVal === 0 && <span className="bg-rose-900/80 border border-rose-500 text-rose-300 text-[10px] font-black px-2 py-1 rounded">Ada Defisit JP</span>}
                                              </div>
                                          </div>
                                          
                                          {surplusTeachers.length > 0 ? (
                                              <div className="p-3 space-y-4 bg-slate-900/30">
                                                  {surplusTeachers.map(t => {
                                                      const jamThisT = getJamUtama(t);
                                                      const isThisDefisit = jamThisT > 0 && jamThisT < 24;

                                                      const kandidatSekolah = spreadsheetData.filter(d => {
                                                          if (d.sekolah === t.sekolah) return false;
                                                          const entry = Object.entries(d.mapel).find(([key]) => key.toUpperCase() === namaMapelUpper);
                                                          return entry && entry[1].kurang > 0;
                                                      }).sort((a, b) => {
                                                          const aKecMatch = a.kecamatan === t.kecamatan ? 1 : 0;
                                                          const bKecMatch = b.kecamatan === t.kecamatan ? 1 : 0;
                                                          return bKecMatch - aKecMatch;
                                                      });

                                                      const isExpandedSekolah = expandedKandidatSekolah[t.id];
                                                      const displayedSekolah = isExpandedSekolah ? kandidatSekolah : kandidatSekolah.slice(0, 3);

                                                      return (
                                                      <div key={t.id} className={`p-3 rounded-lg ${t.is_rekomendasi_internal ? 'bg-amber-900/20 border border-amber-600/50' : 'bg-slate-800 border border-slate-700'}`}>
                                                          <div className="flex justify-between items-start mb-2">
                                                              <div className="flex flex-col cursor-pointer" onClick={() => onTeacherClick(t)}>
                                                                  <span className="text-sm font-bold text-white hover:text-amber-400">{t.nama}</span>
                                                                  <span className="text-[10px] text-slate-400">
                                                                      Kec. Domisili: {t.kecamatan || '-'} | <span className={isThisDefisit ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>Jam Utama: {jamThisT} JP</span>
                                                                  </span>
                                                                  
                                                                  {t.is_rekomendasi_internal && (
                                                                      <span className="text-[9px] text-amber-400 font-black uppercase mt-1.5 block leading-tight">
                                                                          🌟 Prioritas Mutasi <br/>
                                                                          {t.alasanRekomendasi && <span className="text-[8px] text-amber-200 font-normal italic normal-case">"{t.alasanRekomendasi}"</span>}
                                                                      </span>
                                                                  )}
                                                              </div>
                                                              <button onClick={() => setSimulasiModal({isOpen: true, teacher: t})} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded text-[10px] font-black shadow-lg whitespace-nowrap">🚀 Ajukan Pindah</button>
                                                          </div>
                                                          
                                                          <div className="mt-2 pt-2 border-t border-slate-700">
                                                              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block mb-2">🎯 Rekomendasi Tujuan Mutasi:</span>
                                                              {kandidatSekolah.length > 0 ? (
                                                                  <div className="space-y-1.5">
                                                                      {displayedSekolah.map(ks => {
                                                                          const ksKurangVal = Object.entries(ks.mapel).find(([key]) => key.toUpperCase() === namaMapelUpper)?.[1].kurang || 0;
                                                                          return (
                                                                          <div key={ks.sekolah} className="flex justify-between items-center text-[10px] bg-slate-900 px-2 py-1.5 rounded border border-slate-700/50">
                                                                              <span className="text-slate-300">{ks.sekolah} {ks.kecamatan === t.kecamatan && <span className="text-emerald-400 font-bold ml-1">(📍 1 Domisili)</span>}</span>
                                                                              <span className="text-rose-400 font-bold">Butuh {ksKurangVal}</span>
                                                                          </div>
                                                                      )})}
                                                                      
                                                                      {kandidatSekolah.length > 3 && (
                                                                          <button 
                                                                              onClick={() => setExpandedKandidatSekolah(p => ({...p, [t.id]: !isExpandedSekolah}))}
                                                                              className="w-full mt-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 text-[9px] font-bold py-1 rounded transition-colors"
                                                                          >
                                                                              {isExpandedSekolah ? 'Tutup Daftar Instansi ⬆️' : `+ Lihat ${kandidatSekolah.length - 3} Instansi Lainnya ⬇️`}
                                                                          </button>
                                                                      )}
                                                                  </div>
                                                              ) : (
                                                                  <div className="text-[10px] text-slate-500 italic">Belum ada sekolah yang kekurangan mapel ini.</div>
                                                              )}
                                                          </div>
                                                      </div>
                                                  )})}
                                              </div>
                                          ) : ( <div className="p-3 text-[10px] text-slate-500 italic">Data nama riil guru untuk mapel ini belum diinput di Buku Induk.</div> )}
                                      </div>
                                  );
                              })}
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* FALLBACK TAMPILAN GURU JIKA TIDAK ADA SPREADSHEET */}
          {!dataSekolah && teachersInSchool.length > 0 && (
              <div className="bg-slate-950 border border-slate-700 p-5 rounded-xl">
                  <h4 className="text-sm font-black text-slate-300 uppercase tracking-widest border-b border-slate-700 pb-2 mb-4">👥 Daftar Pendidik Riil di {analisisSekolah}</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      {teachersInSchool.map(t => (
                          <div key={t.id} className={`flex justify-between items-center p-3 rounded-lg ${t.is_rekomendasi_internal ? 'bg-amber-900/30 border border-amber-600/50' : 'bg-slate-900 border border-slate-700'}`}>
                              <div className="flex flex-col cursor-pointer" onClick={() => onTeacherClick(t)}>
                                  <strong className="text-sm text-white hover:text-amber-400">{t.nama}</strong>
                                  <span className="text-xs text-slate-400">{t.tugasMengajar || t.bidangStudi}</span>
                                  {t.is_rekomendasi_internal && (
                                      <span className="text-[9px] text-amber-400 font-black uppercase mt-1">
                                          🌟 Prioritas Mutasi {t.alasanRekomendasi && <span className="font-normal italic normal-case text-amber-200">"{t.alasanRekomendasi}"</span>}
                                      </span>
                                  )}
                              </div>
                              <button onClick={() => setSimulasiModal({isOpen: true, teacher: t})} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-xs font-black shadow-lg">🚀 Ajukan Pindah</button>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>
      )}

      {/* 🌟 MODAL SIMULASI PENGAJUAN MUTASI */}
      {simulasiModal.isOpen && simulasiModal.teacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
           <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(79,70,229,0.3)] flex flex-col max-h-[90vh]">
              <div className="p-5 border-b bg-indigo-950/40 border-indigo-800/50">
                 <h3 className="text-xl font-black text-white tracking-wider">🚀 Form Pengajuan Mutasi</h3>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
                 <div className="bg-slate-950 border border-slate-700 p-4 rounded-lg">
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Identitas Pendidik (Surplus / Kurang Jam):</span>
                     <strong className="text-lg text-white block">{simulasiModal.teacher.nama}</strong>
                     <span className="text-xs text-amber-300 font-bold bg-slate-800 px-2 py-1 rounded inline-block mt-2">{simulasiModal.teacher.tugasMengajar || simulasiModal.teacher.bidangStudi}</span>
                 </div>
                 
                 <div className="bg-indigo-950/20 border border-indigo-900/50 p-4 rounded-lg">
                    <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block mb-3">Pilih Instansi Tujuan:</span>
                    <select className="w-full bg-slate-900 border border-indigo-500/50 text-white rounded-lg px-4 py-3 outline-none focus:border-indigo-400 font-bold shadow-inner" value={targetSekolah} onChange={(e) => setTargetSekolah(e.target.value)}>
                       <option value="">-- Cari Sekolah Tujuan --</option>
                       {listSekolah.map(s => {
                           if (s === simulasiModal.teacher?.sekolah) return null;
                           const d = spreadsheetData.find(x => x.sekolah === s);
                           const mapelGuru = simulasiModal.teacher?.tugasMengajar || simulasiModal.teacher?.bidangStudi || '';
                           const entry = d ? Object.entries(d.mapel).find(([key]) => key.toUpperCase() === mapelGuru.toUpperCase()) : null;
                           const kurangTarget = entry ? entry[1].kurang : 0;
                           return <option key={s} value={s}>{s} {kurangTarget > 0 ? `(🔥 Butuh ${kurangTarget} Guru)` : ''}</option>;
                       })}
                    </select>
                 </div>
              </div>
              <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3">
                 <button onClick={() => {setSimulasiModal({isOpen: false, teacher: null}); setTargetSekolah('');}} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-colors">Batal</button>
                 <button onClick={handleAjukanMutasi} disabled={!targetSekolah} className={`px-6 py-2.5 rounded-lg text-sm font-black transition-colors shadow-lg ${!targetSekolah ? 'bg-indigo-900 text-indigo-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}>📤 Kirim ke Cabdin</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PanelAnalisis;
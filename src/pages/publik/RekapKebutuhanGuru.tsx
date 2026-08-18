import React, { useEffect, useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { supabase } from '../../supabaseClient';

import DashboardStatistik, { TeacherData } from '../../components/rekap/DashboardStatistik';
import EditorInstansi from '../../components/rekap/EditorInstansi';
import PanelAnalisis, { ProcessedData } from '../../components/rekap/PanelAnalisis';
import UsulanFormasi from '../../components/rekap/UsulanFormasi'; 
import LaporanKepatuhan from '../../components/rekap/LaporanKepatuhan'; 
import FilterPencarian from '../../components/rekap/FilterPencarian';
import TabelDataGuru from '../../components/rekap/TabelDataGuru';
import ModalProfilGuru from '../../components/rekap/ModalProfilGuru';

interface SupaTeacherRow { id: string | number; sekolah?: string; nama?: string; nip?: string; pangkat?: string; status_pegawai?: string; ijasah?: string; bidang_studi?: string; tugas_mengajar?: string; jam_mengajar?: number | string; jam_tambahan?: number | string; rincian_tugas_tambahan?: string; total_jam?: number | string; kecamatan?: string; alamat?: string; bulan_tahun_pensiun?: string; }

const KAMUS_KABUPATEN_CABDIN_6: Record<string, string> = { 'SMA NEGERI 1 COLOMADU': 'Karanganyar', 'SMA NEGERI 1 KARANGANYAR': 'Karanganyar', 'SMA NEGERI 1 KERJO': 'Karanganyar', 'SMA NEGERI 1 MOJOGEDANG': 'Karanganyar', 'SMA NEGERI 2 KARANGANYAR': 'Karanganyar', 'SMA NEGERI GONDANGREJO': 'Karanganyar', 'SMA NEGERI JUMAPOLO': 'Karanganyar', 'SMA NEGERI KARANGPANDAN': 'Karanganyar', 'SMA NEGERI KEBAKKRAMAT': 'Karanganyar', 'SMA NEGERI TAWANGMANGU': 'Karanganyar', 'SMK NEGERI 2 KARANGANYAR': 'Karanganyar', 'SMK NEGERI 1 KARANGANYAR': 'Karanganyar', 'SMK NEGERI JATIPURO': 'Karanganyar', 'SMK NEGERI JENAWI': 'Karanganyar', 'SMK NEGERI JUMANTONO': 'Karanganyar', 'SMK NEGERI MATESIH': 'Karanganyar', 'SMK NEGERI NGARGOYOSO': 'Karanganyar', 'SLB NEGERI COLOMADU KARANGANYAR': 'Karanganyar', 'SLB NEGERI KARANGANYAR': 'Karanganyar', 'SMA NEGERI 1 GEMOLONG': 'Sragen', 'SMA NEGERI 1 GONDANG': 'Sragen', 'SMA NEGERI 1 PLUPUH': 'Sragen', 'SMA NEGERI 1 SAMBUNGMACAN': 'Sragen', 'SMA NEGERI 1 SRAGEN': 'Sragen', 'SMA NEGERI 1 SUKODONO': 'Sragen', 'SMA NEGERI 1 SUMBERLAWANG': 'Sragen', 'SMA NEGERI 1 TANGEN': 'Sragen', 'SMA NEGERI 2 SRAGEN': 'Sragen', 'SMA NEGERI 3 SRAGEN': 'Sragen', 'SMK NEGERI 2 SRAGEN': 'Sragen', 'SMK NEGERI 1 GESI': 'Sragen', 'SMK NEGERI 1 GONDANG': 'Sragen', 'SMK NEGERI 1 JENAR': 'Sragen', 'SMK NEGERI 1 KALIJAMBE': 'Sragen', 'SMK NEGERI 1 KEDAWUNG': 'Sragen', 'SMK NEGERI 1 MIRI': 'Sragen', 'SMK NEGERI 1 MONDOKAN': 'Sragen', 'SMK NEGERI 1 PLUPUH': 'Sragen', 'SMK NEGERI 1 SAMBIREJO': 'Sragen', 'SMK NEGERI 1 SRAGEN': 'Sragen', 'SMK NEGERI 1 TANON': 'Sragen', 'SLB NEGERI SRAGEN': 'Sragen', 'SMA NEGERI 1 BATURETNO': 'Wonogiri', 'SMA NEGERI 1 GIRIMARTO': 'Wonogiri', 'SMA NEGERI 1 JATISRONO': 'Wonogiri', 'SMA NEGERI 1 MANYARAN': 'Wonogiri', 'SMA NEGERI 1 NGUNTORONADI': 'Wonogiri', 'SMA NEGERI 1 PRACIMANTORO': 'Wonogiri', 'SMA NEGERI 1 PURWANTORO': 'Wonogiri', 'SLB NEGERI PURWANTORO': 'Wonogiri', 'SMA NEGERI 1 SIDOHARJO': 'Wonogiri', 'SMA NEGERI 1 SLOGOHIMO': 'Wonogiri', 'SMA NEGERI 1 WONOGIRI': 'Wonogiri', 'SMA NEGERI 2 WONOGIRI': 'Wonogiri', 'SMA NEGERI 3 WONOGIRI': 'Wonogiri', 'SLB NEGERI WONOGIRI': 'Wonogiri', 'SMA NEGERI 1 WURYANTORO': 'Wonogiri' };
const KAMUS_KECAMATAN_SEKOLAH: Record<string, string> = { 'SMA NEGERI 1 COLOMADU': 'Colomadu', 'SMA NEGERI GONDANGREJO': 'Gondangrejo', 'SMA NEGERI 1 KARANGANYAR': 'Karanganyar', 'SMA NEGERI 2 KARANGANYAR': 'Karanganyar', 'SMK NEGERI 1 KARANGANYAR': 'Karanganyar', 'SMK NEGERI 2 KARANGANYAR': 'Karanganyar', 'SMA NEGERI 1 KERJO': 'Kerjo', 'SMA NEGERI 1 MOJOGEDANG': 'Mojogedang', 'SMA NEGERI JUMAPOLO': 'Jumapolo', 'SMA NEGERI KARANGPANDAN': 'Karangpandan', 'SMA NEGERI KEBAKKRAMAT': 'Kebakkramat', 'SMA NEGERI TAWANGMANGU': 'Tawangmangu', 'SMK NEGERI JATIPURO': 'Jatipuro', 'SMK NEGERI JENAWI': 'Jenawi', 'SMK NEGERI JUMANTONO': 'Jumantono', 'SMK NEGERI MATESIH': 'Matesih', 'SMK NEGERI NGARGOYOSO': 'Ngargoyoso', 'SLB NEGERI COLOMADU KARANGANYAR': 'Colomadu', 'SLB NEGERI KARANGANYAR': 'Karanganyar', 'SMA NEGERI 1 GEMOLONG': 'Gemolong', 'SMA NEGERI 1 GONDANG': 'Gondang', 'SMK NEGERI 1 GONDANG': 'Gondang', 'SMA NEGERI 1 PLUPUH': 'Plupuh', 'SMK NEGERI 1 PLUPUH': 'Plupuh', 'SMA NEGERI 1 SAMBUNGMACAN': 'Sambungmacan', 'SMA NEGERI 1 SRAGEN': 'Sragen', 'SMA NEGERI 2 SRAGEN': 'Sragen', 'SMA NEGERI 3 SRAGEN': 'Sragen', 'SMK NEGERI 1 SRAGEN': 'Sragen', 'SMK NEGERI 2 SRAGEN': 'Sragen', 'SMA NEGERI 1 SUKODONO': 'Sukodono', 'SMA NEGERI 1 SUMBERLAWANG': 'Sumberlawang', 'SMA NEGERI 1 TANGEN': 'Tangen', 'SMK NEGERI 1 GESI': 'Gesi', 'SMK NEGERI 1 JENAR': 'Jenar', 'SMK NEGERI 1 KALIJAMBE': 'Kalijambe', 'SMK NEGERI 1 KEDAWUNG': 'Kedawung', 'SMK NEGERI 1 MIRI': 'Miri', 'SMK NEGERI 1 MONDOKAN': 'Mondokan', 'SMK NEGERI 1 SAMBIREJO': 'Sambirejo', 'SMK NEGERI 1 TANON': 'Tanon', 'SLB NEGERI SRAGEN': 'Sragen', 'SMA NEGERI 1 BATURETNO': 'Baturetno', 'SMA NEGERI 1 GIRIMARTO': 'Girimarto', 'SMA NEGERI 1 JATISRONO': 'Jatisrono', 'SMA NEGERI 1 MANYARAN': 'Manyaran', 'SMA NEGERI 1 NGUNTORONADI': 'Nguntoronadi', 'SMA NEGERI 1 PRACIMANTORO': 'Pracimantoro', 'SMA NEGERI 1 PURWANTORO': 'Purwantoro', 'SLB NEGERI PURWANTORO': 'Purwantoro', 'SMA NEGERI 1 SIDOHARJO': 'Sidoharjo', 'SMA NEGERI 1 SLOGOHIMO': 'Slogohimo', 'SMA NEGERI 1 WONOGIRI': 'Wonogiri', 'SMA NEGERI 2 WONOGIRI': 'Wonogiri', 'SMA NEGERI 3 WONOGIRI': 'Wonogiri', 'SLB NEGERI WONOGIRI': 'Wonogiri', 'SMA NEGERI 1 WURYANTORO': 'Wuryantoro' };
const normalizeStatus = (status: string | undefined | null): string => { if (!status) return 'Non ASN'; const up = status.toUpperCase().trim(); if (up.includes('PNS')) return 'PNS'; if (up.includes('PW') || up.includes('PARUH WAKTU')) return 'PPPK Paruh Waktu'; if (up.includes('P3K') || up.includes('PPPK')) return 'PPPK'; return 'Non ASN'; };
const calculatePensiunFromNIP = (nip: string, statusPegawai: string): string => { if (statusPegawai !== 'PNS' || !nip) return ''; const cleanNIP = nip.replace(/[^0-9]/g, ''); if (cleanNIP.length >= 8) { const yearStr = cleanNIP.substring(0, 4); const monthStr = cleanNIP.substring(4, 6); const birthYear = parseInt(yearStr); const birthMonth = parseInt(monthStr); if (birthYear > 1900 && birthYear < 2100 && birthMonth >= 1 && birthMonth <= 12) { let pensiunYear = birthYear + 60; let pensiunMonth = birthMonth + 1; if (pensiunMonth > 12) { pensiunMonth = 1; pensiunYear += 1; } return `${pensiunYear}-${String(pensiunMonth).padStart(2, '0')}`; } } return ''; };

const RekapKebutuhanGuru = () => {
  const [allTeachers, setAllTeachers] = useState<TeacherData[]>([]);
  const [spreadsheetData, setSpreadsheetData] = useState<ProcessedData[]>([]);
  const [listMapel, setListMapel] = useState<string[]>([]);
  const [listSekolah, setListSekolah] = useState<string[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [fKabupaten, setFKabupaten] = useState<string>('');
  const [fSekolah, setFSekolah] = useState<string>('');
  const [fMapel, setFMapel] = useState<string>(''); 
  const [fStatus, setFStatus] = useState<string>(''); 
  const [fPensiun, setFPensiun] = useState<string>('');

  const [showSecretMode, setShowSecretMode] = useState<boolean>(false);
  
  // STATE PANEL AKTIF
  const [showAnalisis, setShowAnalisis] = useState<boolean>(false);
  const [showFormasi, setShowFormasi] = useState<boolean>(false); 
  const [showLaporan, setShowLaporan] = useState<boolean>(false); 
  
  const [analisisSekolah, setAnalisisSekolah] = useState<string>('');
  const [selectedTeacherDetail, setSelectedTeacherDetail] = useState<TeacherData | null>(null);

  const isFetching = useRef(false);

  const fetchAllData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    const mapels = new Set<string>();
    const schools = new Set<string>();
    const groupedSpreadsheet: Record<string, ProcessedData> = {};

    try {
      const sheetId = "1lh8N_TeVWG7F_A_QwWOu0bn3zX0KIHviA3CEOePysm0";
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=422414743`;
      const sheetResponse = await new Promise<Record<string, string>[]>((resolve, reject) => { Papa.parse(csvUrl, { download: true, header: true, skipEmptyLines: true, complete: (results) => resolve(results.data as Record<string, string>[]), error: (err) => reject(err) }); });

      if (sheetResponse && sheetResponse.length > 0) {
        const rawData = sheetResponse;
        const headers = Object.keys(rawData[0]);
        const findCol = (keywords: string[]) => headers.find(h => keywords.some(kw => h.toLowerCase().includes(kw)));
        const colMapel = findCol(['pelajaran', 'mapel', 'guru', 'bidang']);
        const colSekolah = findCol(['sekolah', 'instansi', 'unit', 'satuan', 'pendidikan']); 
        const colKurang = findCol(['kurang', 'butuh', 'kebutuhan']);
        const colLebih = findCol(['lebih', 'sisa', 'surplus']);

        if (colMapel && colSekolah) {
          rawData.forEach(item => {
            const sek = item[colSekolah]?.trim().toUpperCase();
            const mapel = item[colMapel]?.trim();
            if (sek) schools.add(sek);
            if (mapel) {
                mapels.add(mapel);
                if (!groupedSpreadsheet[sek]) {
                    const autoKab = KAMUS_KABUPATEN_CABDIN_6[sek] || 'Lainnya';
                    const autoKec = KAMUS_KECAMATAN_SEKOLAH[sek] || 'Lainnya';
                    groupedSpreadsheet[sek] = { kabupaten: autoKab, kecamatan: autoKec, sekolah: sek, mapel: {} };
                }
                const valKurangStr = colKurang && item[colKurang] ? String(item[colKurang]).replace(/[^0-9-]/g, '') : '0';
                const valLebihStr = colLebih && item[colLebih] ? String(item[colLebih]).replace(/[^0-9-]/g, '') : '0';
                let vKurang = parseInt(valKurangStr) || 0;
                let vLebih = parseInt(valLebihStr) || 0;
                if (colKurang === colLebih) {
                    if (vKurang < 0) { vLebih = Math.abs(vKurang); vKurang = 0; }
                    else if (vKurang > 0) { vLebih = 0; }
                    else { vKurang = 0; vLebih = 0; }
                } else { vKurang = Math.abs(vKurang); vLebih = Math.abs(vLebih); }
                const existing = groupedSpreadsheet[sek].mapel[mapel] || { kurang: 0, kelebihan: 0 };
                groupedSpreadsheet[sek].mapel[mapel] = { kurang: existing.kurang + vKurang, kelebihan: existing.kelebihan + vLebih };
            }
          });
        }
      }
    } catch { console.warn("Spreadsheet tidak merespon."); }

    try {
      let allSupaTeachersRaw: SupaTeacherRow[] = [];
      let fromT = 0;
      const step = 1000;
      let hasMoreT = true;
      while (hasMoreT) {
        const { data: chunkT, error: errT } = await supabase.from('guru_kelebihan').select('*').range(fromT, fromT + step - 1);
        if (errT) break;
        if (chunkT && chunkT.length > 0) {
          allSupaTeachersRaw = [...allSupaTeachersRaw, ...(chunkT as SupaTeacherRow[])];
          fromT += step;
          if (chunkT.length < step) hasMoreT = false;
        } else { hasMoreT = false; }
      }
      if (allSupaTeachersRaw.length > 0) {
         const processedTeachers: TeacherData[] = allSupaTeachersRaw.map(t => {
           const sek = t.sekolah?.trim().toUpperCase() || '';
           const kab = KAMUS_KABUPATEN_CABDIN_6[sek] || 'Lainnya';
           if (sek) schools.add(sek);
           const statusNormalized = normalizeStatus(t.status_pegawai);
           const nipGuru = t.nip || '';
           let pensiunFinal = t.bulan_tahun_pensiun || '';
           if (!pensiunFinal && statusNormalized === 'PNS' && nipGuru) pensiunFinal = calculatePensiunFromNIP(nipGuru, 'PNS');
           return {
             id: t.id || Date.now(), sekolah: sek, kabupaten: kab, nama: t.nama || '', nip: nipGuru, pangkat: t.pangkat || '', statusPegawai: statusNormalized, ijasah: t.ijasah || '', bidangStudi: t.bidang_studi || '', tugasMengajar: t.tugas_mengajar || '', jamMengajar: t.jam_mengajar !== undefined && t.jam_mengajar !== null ? Number(t.jam_mengajar) : '', jamTambahan: t.jam_tambahan !== undefined && t.jam_tambahan !== null ? Number(t.jam_tambahan) : '', rincianTugasTambahan: t.rincian_tugas_tambahan || '', totalJam: t.total_jam !== undefined && t.total_jam !== null ? Number(t.total_jam) : '', kecamatan: t.kecamatan || '', alamat: t.alamat || '', bulanTahunPensiun: pensiunFinal
           };
         });
         setAllTeachers(processedTeachers);
      }
    } catch { setErrorMsg("Koneksi ke database terputus. Silakan muat ulang halaman."); }

    setSpreadsheetData(Object.values(groupedSpreadsheet));
    setListMapel(Array.from(mapels).sort((a,b) => a.localeCompare(b)));
    setListSekolah(Array.from(schools).sort((a,b) => a.localeCompare(b)));
    setLoading(false);
    isFetching.current = false;
  }, []);

  useEffect(() => { const delayTimer = setTimeout(() => { fetchAllData(); }, 0); return () => clearTimeout(delayTimer); }, [fetchAllData]);

  const handleDeleteTeacher = async (id: string | number, nama: string) => {
    const confirm = window.confirm(`⚠️ PERINGATAN ⚠️\n\nApakah Anda yakin ingin MENGHAPUS data guru: ${nama}?`);
    if(!confirm) return;
    const pass = window.prompt("🔑 Masukkan PIN / Password Otorisasi untuk menghapus:");
    if(pass !== "PuthutPrihantoro") { alert("❌ Akses Ditolak! Password salah."); return; }
    try {
        const { error } = await supabase.from('guru_kelebihan').delete().eq('id', id);
        if (error) throw error;
        alert(`✅ Data guru ${nama} berhasil dihapus dari database.`);
        window.location.reload(); 
    } catch (err: unknown) { if (err instanceof Error) alert("❌ Gagal menghapus data: " + err.message); }
  };

  const listKabupatenValid = ['Karanganyar', 'Sragen', 'Wonogiri'];
  const listStatusValid = ['PNS', 'PPPK', 'PPPK Paruh Waktu', 'Non ASN'];
  const uniquePensiun: string[] = Array.from(new Set(allTeachers.map(t => t.bulanTahunPensiun || '').filter(p => p !== ''))).sort();

  const filteredTeachers = allTeachers.filter(t => {
    const matchKab = !fKabupaten || t.kabupaten === fKabupaten;
    const matchSek = !fSekolah || t.sekolah === fSekolah;
    const matchMapel = !fMapel || t.bidangStudi === fMapel;
    const matchStatus = !fStatus || t.statusPegawai === fStatus;
    const matchPensiun = !fPensiun || t.bulanTahunPensiun === fPensiun;
    return matchKab && matchSek && matchMapel && matchStatus && matchPensiun;
  });

  const listSekolahFilter = listSekolah.filter(s => !fKabupaten || KAMUS_KABUPATEN_CABDIN_6[s] === fKabupaten || (allTeachers.find(t => (t.sekolah || '') === s)?.kabupaten || '') === fKabupaten);

  const renderSchoolSummary = () => {
    if (!fSekolah) return null;
    const schoolT = allTeachers.filter(t => t.sekolah === fSekolah);
    if (schoolT.length === 0) return null;

    const statusCounts = schoolT.reduce((acc, curr) => {
        const st = curr.statusPegawai || 'Lainnya';
        acc[st] = (acc[st] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const mapelCounts = schoolT.reduce((acc, curr) => {
        const mp = curr.bidangStudi || 'Lainnya';
        acc[mp] = (acc[mp] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return (
        <div className="bg-slate-800 p-6 rounded-xl border border-cyan-800/50 shadow-xl mb-6 print:hidden">
            <h3 className="text-xl font-bold text-white mb-4 border-b border-slate-700 pb-2">Keterangan Instansi: {fSekolah}</h3>
            <div className="flex gap-4 mb-6 flex-wrap">
                <div className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-center shadow-inner">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Total Guru</p>
                    <p className="text-3xl font-black text-white">{schoolT.length}</p>
                </div>
                {Object.entries(statusCounts).map(([status, count]) => (
                    <div key={status} className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-center shadow-inner">
                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">{status}</p>
                        <p className="text-3xl font-black text-cyan-400">{count}</p>
                    </div>
                ))}
            </div>
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Distribusi Guru Per Mata Pelajaran</h4>
            <div className="flex flex-wrap gap-2">
                {Object.entries(mapelCounts).sort((a,b) => b[1] - a[1]).map(([mapel, count]) => (
                    <span key={mapel} className="bg-cyan-900/30 border border-cyan-800 text-cyan-100 text-xs px-3 py-1.5 rounded-full shadow-sm">
                        {mapel} : <strong className="text-emerald-400 font-bold ml-1">{count}</strong>
                    </span>
                ))}
            </div>
        </div>
    );
  };

  const handleExportPDF = () => window.print();

  // VARIABEL FOKUS: Jika salah satu panel di atas terbuka, tabel di bawah disembunyikan
  const isPanelActive = showAnalisis || showFormasi || showLaporan;

  if (loading) return <div className="flex justify-center items-center h-screen font-mono text-slate-400">MEMUAT DATABASE GURU...</div>;
  if (errorMsg) return <div className="p-8 text-center text-red-500 bg-red-50/10 font-mono">ERROR: {errorMsg}</div>;

  return (
    <div className="p-8 min-h-screen bg-slate-900 text-slate-200 print:bg-white print:p-0 print:text-black relative">
      <div className="max-w-full mx-auto space-y-6">
        
        {/* HEADER BUKU INDUK (Disembunyikan saat Mode Laporan Aktif) */}
        <div className={isPanelActive ? "hidden" : "hidden print:block text-center mb-8 pt-8"}>
          <h1 className="text-2xl font-bold uppercase">Buku Induk Data Guru</h1>
          <hr className="mt-4 border-2 border-black" />
        </div>

        {/* DASHBOARD TOTAL (Disembunyikan dari hasil Print jika Laporan Aktif) */}
        <div className={isPanelActive ? "print:hidden" : ""}>
             <DashboardStatistik allTeachers={allTeachers} onToggleSecret={() => setShowSecretMode(!showSecretMode)} />
        </div>

        {/* TOMBOL NAVIGASI ATAS */}
        <div className="flex justify-center gap-3 flex-wrap print:hidden mb-4">
            <button onClick={() => {setShowAnalisis(!showAnalisis); setShowFormasi(false); setShowLaporan(false);}} className={`px-6 py-3 rounded-full font-black tracking-widest uppercase transition-all shadow-xl text-xs md:text-sm ${showAnalisis ? 'bg-slate-700 text-slate-300' : 'bg-linear-to-r from-amber-600 to-orange-500 text-white hover:scale-105'}`}>
                💡 Pemetaan
            </button>
            <button onClick={() => {setShowFormasi(!showFormasi); setShowAnalisis(false); setShowLaporan(false);}} className={`px-6 py-3 rounded-full font-black tracking-widest uppercase transition-all shadow-xl text-xs md:text-sm ${showFormasi ? 'bg-slate-700 text-slate-300' : 'bg-linear-to-r from-indigo-600 to-blue-500 text-white hover:scale-105'}`}>
                📈 Formasi ASN
            </button>
            <button onClick={() => {setShowLaporan(!showLaporan); setShowAnalisis(false); setShowFormasi(false);}} className={`px-6 py-3 rounded-full font-black tracking-widest uppercase transition-all shadow-xl text-xs md:text-sm ${showLaporan ? 'bg-slate-700 text-slate-300' : 'bg-linear-to-r from-rose-600 to-red-500 text-white hover:scale-105'}`}>
                ⚠️ Kepatuhan JP
            </button>
        </div>

        {/* PANEL AKTIF (MUNCUL BERGANTIAN) */}
        <PanelAnalisis showAnalisis={showAnalisis} setShowAnalisis={setShowAnalisis} analisisSekolah={analisisSekolah} setAnalisisSekolah={setAnalisisSekolah} listSekolah={listSekolah} spreadsheetData={spreadsheetData} allTeachers={allTeachers} onTeacherClick={setSelectedTeacherDetail} />
        <UsulanFormasi showFormasi={showFormasi} setShowFormasi={setShowFormasi} spreadsheetData={spreadsheetData} />
        <LaporanKepatuhan showLaporan={showLaporan} setShowLaporan={setShowLaporan} allTeachers={allTeachers} spreadsheetData={spreadsheetData} onTeacherClick={setSelectedTeacherDetail} />

        {/* ==================================================================================== */}
        {/* TABEL BUKU INDUK & FILTER: HANYA MUNCUL JIKA SEMUA PANEL ATAS SEDANG TERTUTUP/FOKUS  */}
        {/* ==================================================================================== */}
        {!isPanelActive && (
            <div className="animate-fade-in-up">
                <FilterPencarian fKabupaten={fKabupaten} setFKabupaten={setFKabupaten} fSekolah={fSekolah} setFSekolah={setFSekolah} fMapel={fMapel} setFMapel={setFMapel} fStatus={fStatus} setFStatus={setFStatus} fPensiun={fPensiun} setFPensiun={setFPensiun} listKabupatenValid={listKabupatenValid} listSekolahFilter={listSekolahFilter} listMapel={listMapel} listStatusValid={listStatusValid} uniquePensiun={uniquePensiun} onReset={() => {setFKabupaten(''); setFSekolah(''); setFMapel(''); setFStatus(''); setFPensiun('');}} />
                
                {renderSchoolSummary()}
                
                <TabelDataGuru filteredTeachers={filteredTeachers} onTeacherClick={setSelectedTeacherDetail} onDeleteTeacher={handleDeleteTeacher} onExportPDF={handleExportPDF} />
                
                <EditorInstansi mapelList={listMapel} listSekolahFilter={listSekolah} allTeachers={allTeachers} />
            </div>
        )}

        {selectedTeacherDetail && <ModalProfilGuru teacher={selectedTeacherDetail} onClose={() => setSelectedTeacherDetail(null)} />}

      </div>
    </div>
  );
};

export default RekapKebutuhanGuru;
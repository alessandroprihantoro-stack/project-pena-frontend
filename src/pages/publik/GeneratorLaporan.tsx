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
import PantauKinerjaPengawas from '../../components/rekap/PantauKinerjaPengawas';

interface SupaTeacherRow { id: string | number; sekolah?: string; npsn?: string; nama?: string; nip?: string; pangkat?: string; status_pegawai?: string; ijasah?: string; bidang_studi?: string; tugas_mengajar?: string; jam_mengajar?: number | string; jam_tambahan?: number | string; rincian_tugas_tambahan?: string; total_jam?: number | string; kecamatan?: string; alamat?: string; bulan_tahun_pensiun?: string; }

interface MasterSekolah { npsn: string; nama_sekolah: string; jenjang: string; kabupaten: string; kecamatan: string; total_rombel?: number; jumlah_guru?: number; }
interface KurikulumItem { id?: number; sekolah: string; npsn?: string; mapel: string; rombel: number; jp: number; }

const normalizeStatus = (status: string | undefined | null): string => { 
  if (!status) return 'Non ASN'; 
  const up = status.toUpperCase().trim(); 
  if (up.includes('PNS')) return 'PNS'; 
  if (up.includes('PW') || up.includes('PARUH WAKTU')) return 'PPPK Paruh Waktu'; 
  if (up.includes('P3K') || up.includes('PPPK')) return 'PPPK'; 
  if (up.includes('BKO') || up.includes('TERBANG')) return 'BKO / Guru Terbang';
  return 'Non ASN'; 
};

const calculatePensiunFromNIP = (nip: string): string => { 
    if (!nip) return ''; 
    const cleanNIP = nip.replace(/[^0-9]/g, ''); 
    if (cleanNIP.length >= 8) { 
        const yearStr = cleanNIP.substring(0, 4); 
        const monthStr = cleanNIP.substring(4, 6); 
        const birthYear = parseInt(yearStr); 
        const birthMonth = parseInt(monthStr); 
        if (birthYear > 1900 && birthYear < 2100 && birthMonth >= 1 && birthMonth <= 12) { 
            let pensiunYear = birthYear + 60; 
            let pensiunMonth = birthMonth + 1; 
            if (pensiunMonth > 12) { pensiunMonth = 1; pensiunYear += 1; } 
            return `${pensiunYear}-${String(pensiunMonth).padStart(2, '0')}`; 
        } 
    } 
    return ''; 
};

const findBestMasterSchoolMatch = (rawName: string, masterList: MasterSekolah[]): MasterSekolah | null => {
    if (!rawName) return null;
    let n = rawName.toUpperCase().trim();
    n = n.replace(/\bSMAN\b/g, 'SMA NEGERI').replace(/\bSMKN\b/g, 'SMK NEGERI').replace(/\bSLBN\b/g, 'SLB NEGERI');
    n = n.replace(/\bSMA N\b/g, 'SMA NEGERI').replace(/\bSMK N\b/g, 'SMK NEGERI').replace(/\bSLB N\b/g, 'SLB NEGERI');
    n = n.replace(/\s+KABUPATEN\b.*/g, '').replace(/\s+KAB\..*/g, '').replace(/\s+KAB\b.*/g, '');
    let match = masterList.find(m => m.nama_sekolah.toUpperCase() === n);
    if (match) return match;
    match = masterList.find(m => m.nama_sekolah.toUpperCase().includes(n) || n.includes(m.nama_sekolah.toUpperCase()));
    if (match) return match;
    const bareBones = (str: string) => str.replace(/\b(NEGERI|KABUPATEN|KAB|1|2|3|4|5|6|7|8|9|0)\b/g, '').replace(/[^A-Z]/g, '');
    const bareRaw = bareBones(n);
    if (bareRaw.length > 3) {
        const typeMatch = n.match(/\b(SMA|SMK|SLB)\b/);
        const rawType = typeMatch ? typeMatch[0] : '';
        match = masterList.find(m => {
            const mName = m.nama_sekolah.toUpperCase();
            if (rawType && !mName.includes(rawType)) return false;
            const bareM = bareBones(mName);
            return bareM.includes(bareRaw) || bareRaw.includes(bareM);
        });
        if (match) return match;
    }
    return null; 
};

const getJenjangGlobal = (namaSekolah: string): string => {
    if (!namaSekolah) return '';
    const upper = namaSekolah.toUpperCase();
    if (upper.includes('SMK')) return 'SMK';
    if (upper.includes('SLB')) return 'SLB';
    return 'SMA'; 
};
const getStatusSekolah = (namaSekolah: string): string => {
    if (!namaSekolah) return 'SWASTA';
    return namaSekolah.toUpperCase().includes('NEGERI') ? 'NEGERI' : 'SWASTA';
};

const normalizeMapel = (name: string): string => {
    if (!name) return '';
    let n = name.toUpperCase().trim();
    if (n.startsWith('GURU ')) n = n.substring(5).trim();
    n = n.replace(/\bBUDHA\b/g, 'BUDDHA');
    n = n.replace(/\bKATHOLIK\b/g, 'KATOLIK');
    n = n.replace(/\bPAI\b/g, 'PENDIDIKAN AGAMA ISLAM');
    n = n.replace(/\bAGAMA ISLAM\b/g, 'PENDIDIKAN AGAMA ISLAM');
    n = n.replace(/\bAGAMA KRISTEN\b/g, 'PENDIDIKAN AGAMA KRISTEN');
    n = n.replace(/\bAGAMA KATOLIK\b/g, 'PENDIDIKAN AGAMA KATOLIK');
    n = n.replace(/\bAGAMA HINDU\b/g, 'PENDIDIKAN AGAMA HINDU');
    n = n.replace(/\bAGAMA BUDDHA\b/g, 'PENDIDIKAN AGAMA BUDDHA');
    n = n.replace(/\bTINGKAT LANJUT\b/g, '');
    n = n.replace(/\bTINDAK LANJUT\b/g, '');
    n = n.replace(/\bTK\.?\s*LANJUT\b/g, ''); 
    n = n.replace(/\bTL\b/g, '');
    n = n.replace(/\bLANJUT\b/g, '');
    n = n.replace(/\bPEMINATAN\b/g, '');
    n = n.replace(/\s+/g, ' ').trim();
    return n;
};

const RekapKebutuhanGuru = () => {
  const [masterSekolahList, setMasterSekolahList] = useState<MasterSekolah[]>([]);
  const [allKurikulum, setAllKurikulum] = useState<KurikulumItem[]>([]);
  
  const [allTeachers, setAllTeachers] = useState<TeacherData[]>([]);
  const [spreadsheetData, setSpreadsheetData] = useState<ProcessedData[]>([]);
  const [listSekolah, setListSekolah] = useState<string[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [globalJenjang, setGlobalJenjang] = useState<string>('');
  const [globalStatusSekolah, setGlobalStatusSekolah] = useState<string>('');

  const [fKabupaten, setFKabupaten] = useState<string>('');
  const [fSekolah, setFSekolah] = useState<string>('');
  const [fMapel, setFMapel] = useState<string>(''); 
  const [fStatus, setFStatus] = useState<string>(''); 
  const [fPensiun, setFPensiun] = useState<string>('');

  const [showSecretMode, setShowSecretMode] = useState<boolean>(false);
  const [showAnalisis, setShowAnalisis] = useState<boolean>(false);
  const [showFormasi, setShowFormasi] = useState<boolean>(false); 
  const [showLaporan, setShowLaporan] = useState<boolean>(false); 
  const [showKinerja, setShowKinerja] = useState<boolean>(false); 
  
  const [analisisSekolah, setAnalisisSekolah] = useState<string>('');
  const [selectedTeacherDetail, setSelectedTeacherDetail] = useState<TeacherData | null>(null);

  const isFetching = useRef(false);

  const fetchAllData = useCallback(async () => {
    if (isFetching.current) return;
    isFetching.current = true;
    const schools = new Set<string>();
    const groupedSpreadsheet: Record<string, ProcessedData> = {};
    let localMasterSekolah: MasterSekolah[] = [];

    try {
        const { data, error } = await supabase.from('master_sekolah').select('*').order('nama_sekolah');
        if (error) throw error;
        if (data) {
            localMasterSekolah = data as MasterSekolah[];
            setMasterSekolahList(localMasterSekolah);
        }
    } catch (err) { console.error("Gagal menarik master sekolah:", err); }

    try {
        const { data, error } = await supabase.from('master_kurikulum').select('*');
        if (error) throw error;
        if (data) setAllKurikulum(data as KurikulumItem[]);
    } catch (err) { console.error("Gagal menarik kurikulum:", err); }

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
            const rawSek = item[colSekolah]?.trim() || '';
            const rawMapel = item[colMapel] || '';
            const mapel = normalizeMapel(rawMapel);
            
            const masterMatch = findBestMasterSchoolMatch(rawSek, localMasterSekolah);
            const sek = masterMatch ? masterMatch.nama_sekolah.toUpperCase() : rawSek.toUpperCase();

            if (sek) schools.add(sek);
            if (mapel) {
                if (!groupedSpreadsheet[sek]) {
                    const autoKab = masterMatch ? masterMatch.kabupaten : 'Lainnya';
                    const autoKec = masterMatch ? masterMatch.kecamatan : 'Lainnya';
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
           const sekRaw = t.sekolah?.trim() || '';
           let masterMatch = localMasterSekolah.find(ms => ms.npsn === t.npsn);
           if (!masterMatch) masterMatch = findBestMasterSchoolMatch(sekRaw, localMasterSekolah) || undefined;

           const sek = masterMatch ? masterMatch.nama_sekolah.toUpperCase() : sekRaw.toUpperCase();
           const kab = masterMatch ? masterMatch.kabupaten : 'Lainnya';
           const kec = masterMatch ? masterMatch.kecamatan : (t.kecamatan || '');
           
           if (sek) schools.add(sek);
           const statusNormalized = normalizeStatus(t.status_pegawai);
           const nipGuru = t.nip || '';
           let pensiunFinal = t.bulan_tahun_pensiun || '';
           
           if (!pensiunFinal && nipGuru) {
               pensiunFinal = calculatePensiunFromNIP(nipGuru);
           }

           return {
             id: t.id || Date.now(), 
             sekolah: sek, kabupaten: kab, nama: t.nama || '', nip: nipGuru, pangkat: t.pangkat || '', statusPegawai: statusNormalized, ijasah: t.ijasah || '', 
             bidangStudi: normalizeMapel(t.bidang_studi || ''),
             tugasMengajar: t.tugas_mengajar || '', jamMengajar: t.jam_mengajar !== undefined && t.jam_mengajar !== null ? Number(t.jam_mengajar) : '', jamTambahan: t.jam_tambahan !== undefined && t.jam_tambahan !== null ? Number(t.jam_tambahan) : '', rincianTugasTambahan: t.rincian_tugas_tambahan || '', totalJam: t.total_jam !== undefined && t.total_jam !== null ? Number(t.total_jam) : '', kecamatan: kec, alamat: t.alamat || '', bulanTahunPensiun: pensiunFinal
           };
         });
         setAllTeachers(processedTeachers);
      }
    } catch { setErrorMsg("Koneksi ke database terputus. Silakan muat ulang halaman."); }

    setSpreadsheetData(Object.values(groupedSpreadsheet));
    const finalSchools = Array.from(new Set([...Array.from(schools), ...localMasterSekolah.map(m => m.nama_sekolah.toUpperCase())])).sort();
    setListSekolah(finalSchools);
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

  const handleExportPDF = () => window.print();

  const globalFilteredTeachers = allTeachers.filter(t => {
      const jnj = getJenjangGlobal(t.sekolah || '');
      const sts = getStatusSekolah(t.sekolah || '');
      return (!globalJenjang || jnj === globalJenjang) && (!globalStatusSekolah || sts === globalStatusSekolah);
  });

  const globalFilteredSpreadsheet = spreadsheetData.filter(d => {
      const jnj = getJenjangGlobal(d.sekolah);
      const sts = getStatusSekolah(d.sekolah);
      return (!globalJenjang || jnj === globalJenjang) && (!globalStatusSekolah || sts === globalStatusSekolah);
  });

  const globalFilteredListSekolah = listSekolah.filter(s => {
      const jnj = getJenjangGlobal(s);
      const sts = getStatusSekolah(s);
      return (!globalJenjang || jnj === globalJenjang) && (!globalStatusSekolah || sts === globalStatusSekolah);
  });

  const globalFilteredMasterSekolah = masterSekolahList.filter(ms => {
      const jnj = getJenjangGlobal(ms.nama_sekolah);
      const sts = getStatusSekolah(ms.nama_sekolah);
      return (!globalJenjang || jnj === globalJenjang) && (!globalStatusSekolah || sts === globalStatusSekolah);
  });
  
  const globalFilteredMapels = Array.from(new Set([
      ...globalFilteredTeachers.map(t => t.bidangStudi).filter(m => m && m.trim() !== ''),
      ...globalFilteredSpreadsheet.flatMap(d => Object.keys(d.mapel))
  ])).sort((a, b) => a.localeCompare(b));

  const listKabupatenValid = ['Karanganyar', 'Sragen', 'Wonogiri'];
  const listStatusValid = ['PNS', 'PPPK', 'PPPK Paruh Waktu', 'Non ASN', 'BKO / Guru Terbang'];
  const uniquePensiun: string[] = Array.from(new Set(globalFilteredTeachers.map(t => t.bulanTahunPensiun || '').filter(p => p !== ''))).sort();

  const filteredTeachersTabel = globalFilteredTeachers.filter(t => {
    const matchKab = !fKabupaten || t.kabupaten?.toUpperCase().includes(fKabupaten.toUpperCase());
    const matchSek = !fSekolah || t.sekolah === fSekolah;
    const matchMapel = !fMapel || t.bidangStudi === fMapel;
    const matchStatus = !fStatus || t.statusPegawai === fStatus;
    const matchPensiun = !fPensiun || t.bulanTahunPensiun === fPensiun;
    return matchKab && matchSek && matchMapel && matchStatus && matchPensiun;
  });

  const listSekolahFilter = globalFilteredListSekolah.filter(s => {
      if (!fKabupaten) return true;
      const ms = globalFilteredMasterSekolah.find(m => m.nama_sekolah.toUpperCase() === s);
      return ms?.kabupaten.toUpperCase().includes(fKabupaten.toUpperCase());
  });

  const isPanelActive = showAnalisis || showFormasi || showLaporan || showKinerja;

  if (loading) return <div className="flex justify-center items-center h-screen font-mono text-slate-400">MEMUAT DATABASE GURU...</div>;
  if (errorMsg) return <div className="p-8 text-center text-red-500 bg-red-50/10 font-mono">ERROR: {errorMsg}</div>;

  return (
    <div className="p-8 min-h-screen bg-slate-900 text-slate-200 print:bg-white print:p-0 print:text-black relative">
      <div className="max-w-full mx-auto space-y-6">
        
        <div className={isPanelActive ? "hidden" : "hidden print:block text-center mb-8 pt-8"}>
          <h1 className="text-2xl font-bold uppercase">Buku Induk Data Guru</h1>
          <hr className="mt-4 border-2 border-black" />
        </div>

        <div className="bg-slate-950 border border-slate-700/50 p-4 rounded-xl flex flex-wrap gap-4 items-center justify-center print:hidden shadow-inner relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-linear-to-b from-cyan-500 to-fuchsia-500"></div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                Filter Global Sistem
            </span>
            
            <select 
                value={globalJenjang} 
                onChange={(e) => { 
                    setGlobalJenjang(e.target.value); 
                    setFSekolah(''); 
                    setAnalisisSekolah(''); 
                    setFMapel('');
                }} 
                className="bg-slate-900 text-cyan-300 border border-slate-600 px-5 py-2.5 rounded-lg text-sm font-bold outline-none focus:border-cyan-500 shadow-md transition-all cursor-pointer hover:bg-slate-800"
            >
                <option value="">🏫 Semua Jenjang Pendidikan</option>
                <option value="SMA">🎓 Khusus Jenjang SMA</option>
                <option value="SMK">⚙️ Khusus Jenjang SMK</option>
                <option value="SLB">🤝 Khusus Jenjang SLB</option>
            </select>

            <select 
                value={globalStatusSekolah} 
                onChange={(e) => { 
                    setGlobalStatusSekolah(e.target.value); 
                    setFSekolah(''); 
                    setAnalisisSekolah(''); 
                    setFMapel('');
                }} 
                className="bg-slate-900 text-fuchsia-300 border border-slate-600 px-5 py-2.5 rounded-lg text-sm font-bold outline-none focus:border-fuchsia-500 shadow-md transition-all cursor-pointer hover:bg-slate-800"
            >
                <option value="">🏢 Semua Status Instansi</option>
                <option value="NEGERI">🏛️ Instansi Negeri</option>
                <option value="SWASTA">🏬 Instansi Swasta</option>
            </select>
        </div>


        <div className={isPanelActive ? "print:hidden" : ""}>
             <DashboardStatistik 
                allTeachers={globalFilteredTeachers} 
                onToggleSecret={() => setShowSecretMode(!showSecretMode)} 
                filterSekolah={fSekolah}
                masterSekolahList={globalFilteredMasterSekolah}
                allKurikulum={allKurikulum}
             />
        </div>

        <div className="flex justify-center gap-3 flex-wrap print:hidden mb-4">
            <button onClick={() => {setShowAnalisis(!showAnalisis); setShowFormasi(false); setShowLaporan(false); setShowKinerja(false);}} className={`px-6 py-3 rounded-full font-black tracking-widest uppercase transition-all shadow-xl text-xs md:text-sm ${showAnalisis ? 'bg-slate-700 text-slate-300' : 'bg-linear-to-r from-amber-600 to-orange-500 text-white hover:scale-105'}`}>
                💡 Pemetaan
            </button>
            <button onClick={() => {setShowFormasi(!showFormasi); setShowAnalisis(false); setShowLaporan(false); setShowKinerja(false);}} className={`px-6 py-3 rounded-full font-black tracking-widest uppercase transition-all shadow-xl text-xs md:text-sm ${showFormasi ? 'bg-slate-700 text-slate-300' : 'bg-linear-to-r from-indigo-600 to-blue-500 text-white hover:scale-105'}`}>
                📈 Formasi ASN
            </button>
            <button onClick={() => {setShowLaporan(!showLaporan); setShowAnalisis(false); setShowFormasi(false); setShowKinerja(false);}} className={`px-6 py-3 rounded-full font-black tracking-widest uppercase transition-all shadow-xl text-xs md:text-sm ${showLaporan ? 'bg-slate-700 text-slate-300' : 'bg-linear-to-r from-rose-600 to-red-500 text-white hover:scale-105'}`}>
                ⚠️ Kepatuhan JP
            </button>
            <button onClick={() => {setShowKinerja(!showKinerja); setShowLaporan(false); setShowAnalisis(false); setShowFormasi(false);}} className={`px-6 py-3 rounded-full font-black tracking-widest uppercase transition-all shadow-xl text-xs md:text-sm ${showKinerja ? 'bg-slate-700 text-slate-300' : 'bg-linear-to-r from-emerald-600 to-teal-500 text-white hover:scale-105'}`}>
                🕵️ Kinerja Pengawas
            </button>
        </div>

        <PanelAnalisis showAnalisis={showAnalisis} setShowAnalisis={setShowAnalisis} analisisSekolah={analisisSekolah} setAnalisisSekolah={setAnalisisSekolah} listSekolah={globalFilteredListSekolah} spreadsheetData={globalFilteredSpreadsheet} allTeachers={globalFilteredTeachers} onTeacherClick={setSelectedTeacherDetail} />
        <UsulanFormasi showFormasi={showFormasi} setShowFormasi={setShowFormasi} spreadsheetData={globalFilteredSpreadsheet} />
        <LaporanKepatuhan showLaporan={showLaporan} setShowLaporan={setShowLaporan} allTeachers={globalFilteredTeachers} spreadsheetData={globalFilteredSpreadsheet} masterSekolahList={globalFilteredMasterSekolah} onTeacherClick={setSelectedTeacherDetail} />
        <PantauKinerjaPengawas showKinerja={showKinerja} setShowKinerja={setShowKinerja} masterSekolahList={globalFilteredMasterSekolah} allKurikulum={allKurikulum} allTeachers={globalFilteredTeachers} />

        {!isPanelActive && (
            <div className="animate-fade-in-up">
                <FilterPencarian fKabupaten={fKabupaten} setFKabupaten={setFKabupaten} fSekolah={fSekolah} setFSekolah={setFSekolah} fMapel={fMapel} setFMapel={setFMapel} fStatus={fStatus} setFStatus={setFStatus} fPensiun={fPensiun} setFPensiun={setFPensiun} listKabupatenValid={listKabupatenValid} listSekolahFilter={listSekolahFilter} listMapel={globalFilteredMapels} listStatusValid={listStatusValid} uniquePensiun={uniquePensiun} onReset={() => {setFKabupaten(''); setFSekolah(''); setFMapel(''); setFStatus(''); setFPensiun('');}} />
                
                <TabelDataGuru 
                  filteredTeachers={filteredTeachersTabel} 
                  masterSekolahList={globalFilteredMasterSekolah}
                  spreadsheetData={globalFilteredSpreadsheet}
                  onTeacherClick={setSelectedTeacherDetail} 
                  onDeleteTeacher={handleDeleteTeacher} 
                  onExportPDF={handleExportPDF} 
                />
                
                {/* 🌟 PEMANGGILAN KOMPONEN BARU YANG SUPER RINGKAS */}
                <EditorInstansi />
            </div>
        )}

        {selectedTeacherDetail && <ModalProfilGuru teacher={selectedTeacherDetail} onClose={() => setSelectedTeacherDetail(null)} />}

      </div>
    </div>
  );
};

export default RekapKebutuhanGuru;
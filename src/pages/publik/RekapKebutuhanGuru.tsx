import React, { useEffect, useState, useCallback, useRef } from 'react';
import Papa from 'papaparse';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';

import DashboardStatistik, { TeacherData } from '../../components/rekap/DashboardStatistik';
import EditorInstansi from '../../components/rekap/EditorInstansi';
import PanelAnalisis, { ProcessedData } from '../../components/rekap/PanelAnalisis';
import UsulanFormasi from '../../components/rekap/UsulanFormasi'; 
import LaporanKepatuhan from '../../components/rekap/LaporanKepatuhan'; 
import FilterPencarian from '../../components/rekap/FilterPencarian';
import TabelDataGuru, { ExtendedTeacherData } from '../../components/rekap/TabelDataGuru';
import ModalProfilGuru from '../../components/rekap/ModalProfilGuru';
import PantauKinerjaPengawas from '../../components/rekap/PantauKinerjaPengawas';

interface SupaTeacherRow { 
    id: string | number; 
    sekolah?: string; 
    npsn?: string; 
    nama?: string; 
    nip?: string; 
    pangkat?: string; 
    status_pegawai?: string; 
    ijasah?: string; 
    program_keahlian?: string; 
    bidang_studi?: string; 
    tugas_mengajar?: string; 
    jam_mengajar?: number | string; 
    jam_tambahan?: number | string; 
    rincian_tugas_tambahan?: string; 
    total_jam?: number | string; 
    kecamatan?: string; 
    alamat?: string; 
    bulan_tahun_pensiun?: string; 
    is_rekomendasi_internal?: boolean; 
    alasan_rekomendasi?: string;
}

interface MasterSekolah { 
    npsn: string; 
    nama_sekolah: string; 
    jenjang: string; 
    kabupaten: string; 
    kecamatan: string; 
    total_rombel?: number; 
    jumlah_guru?: number; 
}

interface KurikulumItem { 
    id?: number; 
    sekolah: string; 
    npsn?: string; 
    mapel: string; 
    rombel: number; 
    jp: number; 
}

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
    
    const bareRaw = n.replace(/\b(NEGERI|KABUPATEN|KAB|1|2|3|4|5|6|7|8|9|0)\b/g, '').replace(/[^A-Z]/g, '');
    if (bareRaw.length > 3) {
        const typeMatch = n.match(/\b(SMA|SMK|SLB)\b/);
        match = masterList.find(m => {
            const mName = m.nama_sekolah.toUpperCase();
            if (typeMatch && !mName.includes(typeMatch[0])) return false;
            const bareM = mName.replace(/\b(NEGERI|KABUPATEN|KAB|1|2|3|4|5|6|7|8|9|0)\b/g, '').replace(/[^A-Z]/g, '');
            return bareM.includes(bareRaw) || bareRaw.includes(bareM);
        });
    }
    return match || null; 
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
    
    n = n.replace(/\bDAN BUDI PEKERTI\b/g, '');
    n = n.replace(/\bILMU PENGETAHUAN ALAM\b/g, 'IPA');
    n = n.replace(/\bILMU PENGETAHUAN SOSIAL\b/g, 'IPS');
    n = n.replace(/\(DAN PRAKARYA\)/g, '');
    n = n.replace(/\(IPA\)/g, '');
    n = n.replace(/\(IPS\)/g, '');
    
    n = n.replace(/\bBUDHA\b/g, 'BUDDHA');
    n = n.replace(/\bKATHOLIK\b/g, 'KATOLIK');
    n = n.replace(/\bPAI\b/g, 'PENDIDIKAN AGAMA ISLAM');
    n = n.replace(/\bAGAMA ISLAM\b/g, 'PENDIDIKAN AGAMA ISLAM');
    n = n.replace(/\bAGAMA KRISTEN\b/g, 'PENDIDIKAN AGAMA KRISTEN');
    n = n.replace(/\bAGAMA KATOLIK\b/g, 'PENDIDIKAN AGAMA KATOLIK');
    n = n.replace(/\bAGAMA HINDU\b/g, 'PENDIDIKAN AGAMA HINDU');
    n = n.replace(/\bAGAMA BUDDHA\b/g, 'PENDIDIKAN AGAMA BUDDHA');
    n = n.replace(/\bAGAMA KHONGHUCU\b/g, 'PENDIDIKAN AGAMA KHONGHUCU');
    
    if (n === 'PENJASORKES' || n === 'PENDIDIKAN JASMANI, OLAHRAGA, DAN KESEHATAN') n = 'PJOK';
    if (n === 'PPKN' || n === 'PKN') n = 'PENDIDIKAN PANCASILA';
    if (n.includes('SENI BUDAYA')) n = 'SENI BUDAYA';
    
    n = n.replace(/\b(BAHASA INDONESIA|BAHASA INGGRIS|MATEMATIKA|SEJARAH)\s+(TK\.?\s*LANJUT|TINDAK LANJUT|TL|LANJUT|PEMINATAN)\b/g, '$1 TINGKAT LANJUT');
    
    n = n.replace(/\bPEMINATAN\b/g, '');
    n = n.replace(/\bLINTAS MINAT\b/g, '');
    n = n.replace(/\bTK\.?\s*LANJUT\b/g, ''); 
    n = n.replace(/\bTL\b/g, '');
    n = n.replace(/\bLANJUT\b/g, '');

    if (n.includes('KODING') || n.includes('KKA')) n = 'KODING DAN KECERDASAN ARTIFISIAL';
    if (n.includes('PROJEK IPAS') || n.includes('PROJECT IPAS') || n.includes('MIPAS')) n = 'PROJEK IPAS';

    n = n.replace(/\s+/g, ' ').trim();
    return n;
};

const RekapKebutuhanGuru = () => {
  const { profile } = useAuth();
  const userRole = String(profile?.role).toLowerCase();
  const isAdminOrCabdin = userRole === 'cabdin' || userRole === 'super_admin';

  const [masterSekolahList, setMasterSekolahList] = useState<MasterSekolah[]>([]);
  const [allKurikulum, setAllKurikulum] = useState<KurikulumItem[]>([]);
  const [allTeachers, setAllTeachers] = useState<ExtendedTeacherData[]>([]);
  const [spreadsheetData, setSpreadsheetData] = useState<ProcessedData[]>([]);
  const [listSekolah, setListSekolah] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isPemetaanLocked, setIsPemetaanLocked] = useState<boolean>(false); 

  const [globalJenjang, setGlobalJenjang] = useState<string>('');
  const [globalStatusSekolah, setGlobalStatusSekolah] = useState<string>('');
  
  const [fKabupaten, setFKabupaten] = useState<string>('');
  const [fSekolah, setFSekolah] = useState<string>('');
  const [fMapel, setFMapel] = useState<string>(''); 
  const [fStatus, setFStatus] = useState<string>(''); 
  const [fPensiun, setFPensiun] = useState<string>('');
  
  // 🌟 BARU: State khusus untuk pencarian teks Nama/NIP
  const [fKeyword, setFKeyword] = useState<string>(''); 

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

    let dataSudahDikunci = false;
    try {
        const { data: lockedData, error: lockedErr } = await supabase.from('master_pemetaan').select('*');
        if (!lockedErr && lockedData && lockedData.length > 0) {
            dataSudahDikunci = true;
            setIsPemetaanLocked(true);
            
            lockedData.forEach(item => {
                const rawSek = item.sekolah;
                const mapel = item.mapel;
                
                const masterMatch = findBestMasterSchoolMatch(rawSek, localMasterSekolah);
                const sek = masterMatch ? masterMatch.nama_sekolah.toUpperCase() : rawSek.toUpperCase();
                
                if (sek) schools.add(sek);
                if (mapel) {
                    if (!groupedSpreadsheet[sek]) {
                        groupedSpreadsheet[sek] = { kabupaten: masterMatch?.kabupaten || 'Lainnya', kecamatan: masterMatch?.kecamatan || 'Lainnya', sekolah: sek, mapel: {} };
                    }
                    groupedSpreadsheet[sek].mapel[mapel] = { kurang: item.kurang || 0, kelebihan: item.kelebihan || 0 };
                }
            });
        }
    } catch (err) { console.warn("Pengecekan Kunci Pemetaan gagal:", err); }

    if (!dataSudahDikunci) {
        setIsPemetaanLocked(false);
        try {
          const csvUrl = `https://docs.google.com/spreadsheets/d/1lh8N_TeVWG7F_A_QwWOu0bn3zX0KIHviA3CEOePysm0/export?format=csv&gid=422414743`;
          const sheetResponse = await new Promise<Record<string, string>[]>((resolve, reject) => { 
              Papa.parse(csvUrl, { download: true, header: true, skipEmptyLines: true, complete: (res) => resolve(res.data as Record<string, string>[]), error: reject }); 
          });
          
          if (sheetResponse && sheetResponse.length > 0) {
            const headers = Object.keys(sheetResponse[0]);
            const findCol = (keywords: string[]) => headers.find(h => keywords.some(kw => h.toLowerCase().includes(kw)));
            
            const colMapel = findCol(['pelajaran', 'mapel', 'guru', 'bidang']);
            const colSekolah = findCol(['sekolah', 'instansi', 'unit', 'satuan']); 
            const colKurangLebih = findCol(['kurang', 'lebih', 'sisa', 'surplus', 'kebutuhan']);

            if (colMapel && colSekolah) {
              const cMapel = colMapel;
              const cSekolah = colSekolah;
              const cKurangLebih = colKurangLebih || '';

              sheetResponse.forEach(item => {
                const rawSek = item[cSekolah]?.trim() || '';
                const rawMapel = item[cMapel] || '';
                const mapel = normalizeMapel(rawMapel); 
                
                const masterMatch = findBestMasterSchoolMatch(rawSek, localMasterSekolah);
                const sek = masterMatch ? masterMatch.nama_sekolah.toUpperCase() : rawSek.toUpperCase();
                
                if (sek) schools.add(sek);
                if (mapel) {
                    if (!groupedSpreadsheet[sek]) {
                        groupedSpreadsheet[sek] = { kabupaten: masterMatch?.kabupaten || 'Lainnya', kecamatan: masterMatch?.kecamatan || 'Lainnya', sekolah: sek, mapel: {} };
                    }
                    let vKurang = 0;
                    let vLebih = 0;
                    
                    if (cKurangLebih && item[cKurangLebih]) {
                        const rawVal = String(item[cKurangLebih]).trim();
                        const val = parseFloat(rawVal);
                        
                        if (!isNaN(val)) {
                            if (val < 0) {
                                vLebih = Math.abs(val); 
                            } else if (val > 0) {
                                vKurang = val; 
                            }
                        }
                    }
                    
                    const existing = groupedSpreadsheet[sek].mapel[mapel] || { kurang: 0, kelebihan: 0 };
                    groupedSpreadsheet[sek].mapel[mapel] = { kurang: existing.kurang + vKurang, kelebihan: existing.kelebihan + vLebih };
                }
              });
            }
          }
        } catch { console.warn("Spreadsheet tidak merespon atau link rusak."); }
    }

    try {
      let allSupaTeachersRaw: SupaTeacherRow[] = [];
      let fromT = 0;
      const step = 1000;
      let hasMoreT = true;
      
      while (hasMoreT) {
        const { data: chunkT, error } = await supabase.from('guru_kelebihan').select('*').range(fromT, fromT + step - 1);
        if (error) break;
        if (chunkT && chunkT.length > 0) {
          allSupaTeachersRaw = [...allSupaTeachersRaw, ...(chunkT as SupaTeacherRow[])];
          fromT += step;
          if (chunkT.length < step) hasMoreT = false;
        } else { hasMoreT = false; }
      }
      
      if (allSupaTeachersRaw.length > 0) {
         setAllTeachers(allSupaTeachersRaw.map(t => {
           const sekRaw = t.sekolah?.trim() || '';
           const masterMatch = localMasterSekolah.find(ms => ms.npsn === t.npsn) || findBestMasterSchoolMatch(sekRaw, localMasterSekolah);
           const sek = masterMatch ? masterMatch.nama_sekolah.toUpperCase() : sekRaw.toUpperCase();
           
           if (sek) schools.add(sek);
           
           return {
             id: t.id || Date.now(), sekolah: sek, kabupaten: masterMatch?.kabupaten || 'Lainnya', nama: t.nama || '', nip: t.nip || '', pangkat: t.pangkat || '', statusPegawai: normalizeStatus(t.status_pegawai), ijasah: t.ijasah || '', 
             programKeahlian: t.program_keahlian || '', 
             bidangStudi: normalizeMapel(t.bidang_studi || ''), 
             tugasMengajar: normalizeMapel(t.tugas_mengajar || ''), 
             jamMengajar: t.jam_mengajar !== undefined && t.jam_mengajar !== null ? Number(t.jam_mengajar) : '', jamTambahan: t.jam_tambahan !== undefined && t.jam_tambahan !== null ? Number(t.jam_tambahan) : '', rincianTugasTambahan: t.rincian_tugas_tambahan || '', totalJam: t.total_jam !== undefined && t.total_jam !== null ? Number(t.total_jam) : '', kecamatan: masterMatch?.kecamatan || t.kecamatan || '', alamat: t.alamat || '', bulanTahunPensiun: t.bulan_tahun_pensiun || calculatePensiunFromNIP(t.nip || ''), 
             is_rekomendasi_internal: t.is_rekomendasi_internal || false,
             alasanRekomendasi: t.alasan_rekomendasi || '' 
           };
         }));
      }
    } catch { setErrorMsg("Koneksi ke database terputus."); }

    setSpreadsheetData(Object.values(groupedSpreadsheet));
    setListSekolah(Array.from(new Set([...Array.from(schools), ...localMasterSekolah.map(m => m.nama_sekolah.toUpperCase())])).sort());
    setLoading(false);
    isFetching.current = false;
  }, []);

  useEffect(() => { 
      const delayTimer = setTimeout(() => { fetchAllData(); }, 0); 
      return () => clearTimeout(delayTimer); 
  }, [fetchAllData]);

  const handleLockPemetaan = async () => {
      if(!window.confirm("🔒 KUNCI DATA PEMETAAN KE SERVER?\n\nSistem akan menyimpan data pemetaan Excel saat ini ke dalam database permanen. \nPerubahan apapun di Excel (termasuk jika file dihapus) setelah ini TIDAK AKAN merusak sistem sampai Anda membuka kuncinya lagi.\n\nLanjutkan mengunci?")) return;

      const insertData: { sekolah: string; mapel: string; kurang: number; kelebihan: number; }[] = [];
      
      spreadsheetData.forEach(d => {
          Object.entries(d.mapel).forEach(([mapelName, val]) => {
              if (val.kurang > 0 || val.kelebihan > 0) {
                  insertData.push({ sekolah: d.sekolah, mapel: mapelName, kurang: val.kurang, kelebihan: val.kelebihan });
              }
          });
      });

      if (insertData.length === 0) {
          alert("⚠️ Batal Mengunci: Sistem mendeteksi Data Spreadsheet 0 (kosong) atau gagal terhubung ke Google Sheets."); return;
      }

      try {
          await supabase.from('master_pemetaan').delete().neq('id', 0);
          const { error } = await supabase.from('master_pemetaan').insert(insertData);
          if (error) throw error;
          alert(`✅ BERHASIL: ${insertData.length} baris data pemetaan telah dikunci permanen di server!`);
          window.location.reload();
      } catch (err: unknown) {
          if (err instanceof Error) alert("❌ Gagal menyimpan kunci: " + err.message);
      }
  };

  const handleUnlockPemetaan = async () => {
      if(!window.confirm("🔓 BUKA KUNCI PEMETAAN?\n\nSistem akan membuang data cadangan di server dan kembali bergantung pada data LIVE dari Google Spreadsheet.\n\nLanjutkan?")) return;
      try {
          await supabase.from('master_pemetaan').delete().neq('id', 0);
          alert("✅ BERHASIL: Kunci dibuka! Sistem kembali membaca secara live dari Excel.");
          window.location.reload();
      } catch (err: unknown) {
          if (err instanceof Error) alert("❌ Gagal membuka kunci: " + err.message);
      }
  };

  const handleDeleteTeacher = async (id: string | number, nama: string) => {
    if(!window.confirm(`⚠️ PERINGATAN ⚠️\nApakah Anda yakin ingin MENGHAPUS data guru: ${nama}?`)) return;
    if(window.prompt("🔑 Masukkan PIN / Password Otorisasi untuk menghapus:") !== "PuthutPrihantoro") { alert("❌ Akses Ditolak!"); return; }
    try {
        const { error } = await supabase.from('guru_kelebihan').delete().eq('id', id);
        if (error) throw error;
        alert(`✅ Data guru ${nama} berhasil dihapus.`);
        window.location.reload(); 
    } catch (err: unknown) { if (err instanceof Error) alert("❌ Gagal menghapus: " + err.message); }
  };

  const handleToggleRekomendasi = async (id: string | number, currentStatus: boolean, nama: string) => {
    const newStatus = !currentStatus;
    let alasan = '';
    
    if (newStatus) {
        const input = window.prompt(`🌟 JADIKAN PRIORITAS MUTASI?\nBerikan alasan/keterangan pengusulan mutasi untuk '${nama}':\n(Contoh: Kurang Jam, Domisili Jauh, dll)`);
        if (input === null) return; 
        alasan = input;
    } else {
        if(!window.confirm(`Cabut status Prioritas Mutasi dari '${nama}'?`)) return;
    }

    try {
        const { error } = await supabase.from('guru_kelebihan').update({ 
            is_rekomendasi_internal: newStatus,
            alasan_rekomendasi: alasan 
        }).eq('id', id);
        
        if (error) throw error;
        alert(`✅ Status Mutasi untuk ${nama} berhasil di-update!`);
        isFetching.current = false;
        fetchAllData(); 
    } catch (err: unknown) { if (err instanceof Error) alert("❌ Gagal mengupdate status: " + err.message); }
  };

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
  
  const globalFilteredMapels = Array.from(new Set([...globalFilteredTeachers.map(t => t.bidangStudi).filter(m => m && m.trim() !== ''), ...globalFilteredSpreadsheet.flatMap(d => Object.keys(d.mapel))])).sort();

  const uniquePensiun: string[] = Array.from(new Set(globalFilteredTeachers.map(t => t.bulanTahunPensiun || '').filter(p => p !== ''))).sort();

  // 🌟 REVISI LOGIKA PENCARIAN (Filter Data Guru Utama)
  const filteredTeachersTabel = globalFilteredTeachers.filter(t => {
    // Cocokkan text input dengan Nama LENGKAP (case-insensitive) atau NIP
    const matchKeyword = !fKeyword || 
          (t.nama?.toLowerCase() || '').includes(fKeyword.toLowerCase()) || 
          (t.nip || '').includes(fKeyword);

    return matchKeyword &&
           (!fKabupaten || t.kabupaten?.toUpperCase().includes(fKabupaten.toUpperCase())) &&
           (!fSekolah || t.sekolah === fSekolah) &&
           (!fMapel || t.bidangStudi === fMapel) &&
           (!fStatus || t.statusPegawai === fStatus) &&
           (!fPensiun || t.bulanTahunPensiun === fPensiun);
  }).sort((a, b) => {
      const aRek = a.is_rekomendasi_internal ? 1 : 0;
      const bRek = b.is_rekomendasi_internal ? 1 : 0;
      return bRek - aRek; 
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
                <svg className="w-4 h-4 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg> Filter Global
            </span>
            <select value={globalJenjang} onChange={(e) => { setGlobalJenjang(e.target.value); setFSekolah(''); setAnalisisSekolah(''); setFMapel(''); }} className="bg-slate-900 text-cyan-300 border border-slate-600 px-5 py-2.5 rounded-lg text-sm font-bold outline-none focus:border-cyan-500 shadow-md">
                <option value="">🏫 Semua Jenjang Pendidikan</option>
                <option value="SMA">🎓 Khusus Jenjang SMA</option>
                <option value="SMK">⚙️ Khusus Jenjang SMK</option>
                <option value="SLB">🤝 Khusus Jenjang SLB</option>
            </select>
            <select value={globalStatusSekolah} onChange={(e) => { setGlobalStatusSekolah(e.target.value); setFSekolah(''); setAnalisisSekolah(''); setFMapel(''); }} className="bg-slate-900 text-fuchsia-300 border border-slate-600 px-5 py-2.5 rounded-lg text-sm font-bold outline-none focus:border-fuchsia-500 shadow-md">
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

        <div className="flex justify-center gap-3 flex-wrap print:hidden mb-2">
            <button onClick={() => {setShowAnalisis(!showAnalisis); setShowFormasi(false); setShowLaporan(false); setShowKinerja(false);}} className={`px-6 py-3 rounded-full font-black tracking-widest uppercase shadow-xl text-xs md:text-sm ${showAnalisis ? 'bg-slate-700 text-slate-300' : 'bg-linear-to-r from-amber-600 to-orange-500 text-white hover:scale-105'}`}>💡 Pemetaan Desk</button>
            <button onClick={() => {setShowFormasi(!showFormasi); setShowAnalisis(false); setShowLaporan(false); setShowKinerja(false);}} className={`px-6 py-3 rounded-full font-black tracking-widest uppercase shadow-xl text-xs md:text-sm ${showFormasi ? 'bg-slate-700 text-slate-300' : 'bg-linear-to-r from-indigo-600 to-blue-500 text-white hover:scale-105'}`}>📈 Formasi Girisaka</button>
            <button onClick={() => {setShowLaporan(!showLaporan); setShowAnalisis(false); setShowFormasi(false); setShowKinerja(false);}} className={`px-6 py-3 rounded-full font-black tracking-widest uppercase shadow-xl text-xs md:text-sm ${showLaporan ? 'bg-slate-700 text-slate-300' : 'bg-linear-to-r from-rose-600 to-red-500 text-white hover:scale-105'}`}>⚠️ Kepatuhan JP & Kurikulum</button>
            <button onClick={() => {setShowKinerja(!showKinerja); setShowLaporan(false); setShowAnalisis(false); setShowFormasi(false);}} className={`px-6 py-3 rounded-full font-black tracking-widest uppercase shadow-xl text-xs md:text-sm ${showKinerja ? 'bg-slate-700 text-slate-300' : 'bg-linear-to-r from-emerald-600 to-teal-500 text-white hover:scale-105'}`}>🕵️ Pengawas</button>
        </div>

        {isAdminOrCabdin && !isPanelActive && (
            <div className="flex justify-center gap-3 print:hidden mb-6 animate-fade-in-up">
                {isPemetaanLocked ? (
                    <button onClick={handleUnlockPemetaan} className="text-[10px] md:text-xs bg-slate-900 hover:bg-slate-800 text-amber-400 px-5 py-2 rounded-full font-bold border border-amber-500/50 flex items-center gap-2 shadow-lg transition-colors">
                        🔒 Status Pemetaan: TERKUNCI DI SERVER (Klik untuk Buka & Live Excel)
                    </button>
                ) : (
                    <button onClick={handleLockPemetaan} className="text-[10px] md:text-xs bg-slate-900 hover:bg-slate-800 text-emerald-400 px-5 py-2 rounded-full font-bold border border-emerald-500/50 flex items-center gap-2 shadow-lg transition-colors">
                        🟢 Status Pemetaan: LIVE EXCEL (Klik untuk Kunci Permanen ke Server)
                    </button>
                )}
            </div>
        )}

        <PanelAnalisis showAnalisis={showAnalisis} setShowAnalisis={setShowAnalisis} analisisSekolah={analisisSekolah} setAnalisisSekolah={setAnalisisSekolah} listSekolah={globalFilteredListSekolah} spreadsheetData={globalFilteredSpreadsheet} allTeachers={globalFilteredTeachers} onTeacherClick={setSelectedTeacherDetail} />
        <UsulanFormasi showFormasi={showFormasi} setShowFormasi={setShowFormasi} spreadsheetData={globalFilteredSpreadsheet} />
        <LaporanKepatuhan showLaporan={showLaporan} setShowLaporan={setShowLaporan} allTeachers={globalFilteredTeachers} spreadsheetData={globalFilteredSpreadsheet} masterSekolahList={globalFilteredMasterSekolah} allKurikulum={allKurikulum} onTeacherClick={setSelectedTeacherDetail} />
        <PantauKinerjaPengawas showKinerja={showKinerja} setShowKinerja={setShowKinerja} masterSekolahList={globalFilteredMasterSekolah} allKurikulum={allKurikulum} allTeachers={globalFilteredTeachers} />

        {!isPanelActive && (
            <div className="animate-fade-in-up">
                {/* 🌟 PASSING PROPS PENCARIAN TEKS */}
                <FilterPencarian 
                    fKeyword={fKeyword} setFKeyword={setFKeyword}
                    fKabupaten={fKabupaten} setFKabupaten={setFKabupaten} 
                    fSekolah={fSekolah} setFSekolah={setFSekolah} 
                    fMapel={fMapel} setFMapel={setFMapel} 
                    fStatus={fStatus} setFStatus={setFStatus} 
                    fPensiun={fPensiun} setFPensiun={setFPensiun} 
                    listKabupatenValid={['Karanganyar', 'Sragen', 'Wonogiri']} 
                    listSekolahFilter={globalFilteredListSekolah.filter(s => !fKabupaten || globalFilteredMasterSekolah.find(m => m.nama_sekolah.toUpperCase() === s)?.kabupaten.toUpperCase().includes(fKabupaten.toUpperCase()))} 
                    listMapel={globalFilteredMapels} 
                    listStatusValid={['PNS', 'PPPK', 'PPPK Paruh Waktu', 'Non ASN', 'BKO / Guru Terbang']} 
                    uniquePensiun={uniquePensiun} 
                    onReset={() => {setFKeyword(''); setFKabupaten(''); setFSekolah(''); setFMapel(''); setFStatus(''); setFPensiun('');}} 
                />
                
                <TabelDataGuru filteredTeachers={filteredTeachersTabel} masterSekolahList={globalFilteredMasterSekolah} spreadsheetData={globalFilteredSpreadsheet} onTeacherClick={setSelectedTeacherDetail} onDeleteTeacher={handleDeleteTeacher} onToggleRekomendasi={handleToggleRekomendasi} onExportPDF={() => window.print()} />
                
                <EditorInstansi />
            </div>
        )}

        {selectedTeacherDetail && <ModalProfilGuru teacher={selectedTeacherDetail} onClose={() => setSelectedTeacherDetail(null)} />}
      </div>
    </div>
  );
};

export default RekapKebutuhanGuru;
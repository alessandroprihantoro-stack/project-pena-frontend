import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../../supabaseClient';

interface ProcessedData {
  kabupaten: string;
  sekolah: string;
  mapel: Record<string, { kurang: number; kelebihan: number; totalJam: number; guruAda: number }>;
}

interface SurplusTeacher {
  id: string | number;
  sekolah?: string;
  nama: string;
  nip: string;
  pangkat: string;
  statusPegawai: string;
  ijasah: string;
  bidangStudi: string;
  tugasMengajar: string;
  jamMengajar: number | '';
  jamTambahan: number | '';
  totalJam: number | '';
  alamat: string;
}

interface EditMapelData {
  totalJam: number | '';
  guruTersedia: number | '';
  kurang: number;
  kelebihan: number;
}

const RekapKebutuhanGuru = () => {
  const [data, setData] = useState<ProcessedData[]>([]);
  const [mapelList, setMapelList] = useState<string[]>([]);
  const [allSurplusTeachers, setAllSurplusTeachers] = useState<SurplusTeacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State Filter & Tampilan
  const [filterKabupaten, setFilterKabupaten] = useState<string>('');
  const [filterMapel, setFilterMapel] = useState<string>(''); 
  const [filterStatus, setFilterStatus] = useState<string>(''); 
  const [filterSekolah, setFilterSekolah] = useState<string>('');
  const [viewDetailSekolah, setViewDetailSekolah] = useState<ProcessedData | null>(null);

  // State Editor
  const [editSekolah, setEditSekolah] = useState<string>('');
  const [editFormData, setEditFormData] = useState<ProcessedData | null>(null);
  const [editCalc, setEditCalc] = useState<Record<string, EditMapelData>>({});
  const [surplusTeachers, setSurplusTeachers] = useState<SurplusTeacher[]>([]);
  
  // State Keamanan
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const SECRET_PIN = "6irisaka"; 

  // ================= PENGAMBILAN DATA (MERGE SHEETS & SUPABASE) =================
  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      const grouped: Record<string, ProcessedData> = {};
      const mapels = new Set<string>();

      // A. Ambil dari Sheets
      try {
        const sheetId = "1lh8N_TeVWG7F_A_QwWOu0bn3zX0KIHviA3CEOePysm0";
        const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        
        const sheetResponse = await new Promise<Record<string, string>[]>((resolve, reject) => {
          Papa.parse(csvUrl, { download: true, header: true, skipEmptyLines: true, complete: (results) => resolve(results.data as Record<string, string>[]), error: (err) => reject(err) });
        });

        if (sheetResponse && sheetResponse.length > 0) {
          const rawData = sheetResponse;
          const headers = Object.keys(rawData[0]);
          const findCol = (keywords: string[]) => headers.find(h => keywords.some(kw => h.toLowerCase().includes(kw)));

          const colMapel = findCol(['pelajaran', 'mapel', 'guru', 'bidang']);
          const colSekolah = findCol(['sekolah', 'instansi', 'unit', 'satuan']); 
          const colKabupaten = findCol(['kabupaten', 'kota', 'kab']); 
          const colKurang = findCol(['kurang']);
          let colLebih = findCol(['lebih', 'sisa']);

          if (colKurang === colLebih && colKurang) {
             const idx = headers.indexOf(colKurang);
             if (idx !== -1 && idx + 1 < headers.length) colLebih = headers[idx + 1]; 
          }

          if (colMapel && colSekolah) {
            rawData.forEach(item => {
              const kab = item[colKabupaten || ''] || '-';
              const sek = item[colSekolah]?.trim();
              const mapel = item[colMapel]?.trim();

              if (!sek) return;
              if (!grouped[sek]) grouped[sek] = { kabupaten: kab, sekolah: sek, mapel: {} };
              
              if (mapel) {
                grouped[sek].mapel[mapel] = {
                  kurang: parseInt(colKurang ? item[colKurang] : '0') || 0,
                  kelebihan: parseInt(colLebih ? item[colLebih] : '0') || 0,
                  totalJam: 0, guruAda: 0
                };
                mapels.add(mapel);
              }
            });
          }
        }
      } catch {
        console.warn("Spreadsheet tidak merespon. Mengandalkan Database.");
      }

      // B. Ambil Pembaruan & Data Sekolah Baru dari Supabase
      try {
        const { data: supaData } = await supabase.from('kebutuhan_guru').select('*');
        if (supaData) {
          supaData.forEach(row => {
            const sek = row.sekolah;
            const mapel = row.mapel;
            
            if (!grouped[sek]) {
              grouped[sek] = { kabupaten: row.kabupaten || '-', sekolah: sek, mapel: {} };
            } else if (row.kabupaten && row.kabupaten !== '-') {
              grouped[sek].kabupaten = row.kabupaten;
            }
            
            grouped[sek].mapel[mapel] = {
              kurang: row.kurang || 0,
              kelebihan: row.kelebihan || 0,
              totalJam: row.total_jam || 0,
              guruAda: row.guru_ada || 0
            };
            mapels.add(mapel);
          });
        }

        const { data: supaTeachers } = await supabase.from('guru_kelebihan').select('*');
        if (supaTeachers) {
           setAllSurplusTeachers(supaTeachers.map(t => ({
             id: t.id, sekolah: t.sekolah, nama: t.nama, nip: t.nip, pangkat: t.pangkat,
             statusPegawai: t.status_pegawai, ijasah: t.ijasah, bidangStudi: t.bidang_studi,
             tugasMengajar: t.tugas_mengajar, jamMengajar: t.jam_mengajar, jamTambahan: t.jam_tambahan,
             totalJam: t.total_jam, alamat: t.alamat
           })));
        }

      } catch {
        console.error("Gagal mengambil pembaruan dari database.");
      }

      if (Object.keys(grouped).length === 0) setError("Data kosong.");
      setMapelList(Array.from(mapels));
      setData(Object.values(grouped));
      setLoading(false);
    };
    fetchAllData();
  }, []);

  // ================= FILTER TABEL & KOLOM CERDAS =================
  const listKabupaten = Array.from(new Set(data.map(d => d.kabupaten).filter(Boolean)));
  const listSekolahFilter = data.filter(d => filterKabupaten === '' || d.kabupaten === filterKabupaten).map(d => d.sekolah);

  const filteredData = data.filter(d => {
    const matchKab = filterKabupaten === '' || d.kabupaten === filterKabupaten;
    const matchSek = filterSekolah === '' || d.sekolah === filterSekolah;
    let matchMapelDanStatus = true;

    if (filterStatus === 'kurang') {
      matchMapelDanStatus = filterMapel !== '' ? (d.mapel[filterMapel]?.kurang > 0) : Object.values(d.mapel).some(m => m.kurang > 0);
    } else if (filterStatus === 'lebih') {
      matchMapelDanStatus = filterMapel !== '' ? (d.mapel[filterMapel]?.kelebihan > 0) : Object.values(d.mapel).some(m => m.kelebihan > 0);
    } else {
      if (filterMapel !== '') matchMapelDanStatus = d.mapel[filterMapel] ? (d.mapel[filterMapel].kurang > 0 || d.mapel[filterMapel].kelebihan > 0) : false;
    }
    return matchKab && matchSek && matchMapelDanStatus;
  });

  const activeMapels = mapelList.filter(mapel => 
    filteredData.some(row => (row.mapel[mapel]?.kurang > 0 || row.mapel[mapel]?.kelebihan > 0))
  );

  // ================= FUNGSI EDITOR & SIMPAN =================
  const handleSelectEditSekolah = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sek = e.target.value;
    setEditSekolah(sek);
    setIsUnlocked(false);
    setPasswordInput('');

    if (sek === 'NEW') {
      setEditFormData({ kabupaten: '', sekolah: '', mapel: {} });
      const initialCalc: Record<string, EditMapelData> = {};
      mapelList.forEach(m => {
         initialCalc[m] = { totalJam: '', guruTersedia: '', kurang: 0, kelebihan: 0 };
      });
      setEditCalc(initialCalc);
      setSurplusTeachers([]);
    } else if (sek) {
      const schoolData = data.find(d => d.sekolah === sek);
      if (schoolData) {
        setEditFormData(JSON.parse(JSON.stringify(schoolData)));
        const initialCalc: Record<string, EditMapelData> = {};
        mapelList.forEach(m => {
           initialCalc[m] = { 
             totalJam: schoolData.mapel[m]?.totalJam || '', 
             guruTersedia: schoolData.mapel[m]?.guruAda || '', 
             kurang: schoolData.mapel[m]?.kurang || 0, 
             kelebihan: schoolData.mapel[m]?.kelebihan || 0 
           };
        });
        setEditCalc(initialCalc);
        const existingTeachers = allSurplusTeachers.filter(t => t.sekolah === sek);
        setSurplusTeachers(existingTeachers);
      }
    } else {
      setEditFormData(null);
      setSurplusTeachers([]);
    }
  };

  const handleUnlock = () => {
    if (passwordInput === SECRET_PIN) setIsUnlocked(true);
    else { alert("Akses Ditolak! PIN salah."); setPasswordInput(''); }
  };

  const handleCalculation = (mapel: string, field: 'totalJam' | 'guruTersedia', value: string) => {
    const numVal = value === '' ? '' : parseInt(value);
    const currentMapel = editCalc[mapel];
    const updatedMapel = { ...currentMapel, [field]: numVal };

    if (updatedMapel.totalJam !== '' && updatedMapel.guruTersedia !== '') {
      const kebutuhanIdeal = Math.ceil(Number(updatedMapel.totalJam) / 30);
      const selisih = Number(updatedMapel.guruTersedia) - kebutuhanIdeal;
      if (selisih < 0) { updatedMapel.kurang = Math.abs(selisih); updatedMapel.kelebihan = 0; } 
      else { updatedMapel.kelebihan = selisih; updatedMapel.kurang = 0; }
    } else {
      updatedMapel.kurang = 0; updatedMapel.kelebihan = 0;
    }

    setEditCalc(prev => ({ ...prev, [mapel]: updatedMapel }));

    if (editFormData) {
      setEditFormData({
        ...editFormData,
        mapel: { ...editFormData.mapel, [mapel]: { kurang: updatedMapel.kurang, kelebihan: updatedMapel.kelebihan, totalJam: Number(updatedMapel.totalJam)||0, guruAda: Number(updatedMapel.guruTersedia)||0 } }
      });
    }
  };

  const hasAnySurplus = Object.values(editCalc).some(calc => calc.kelebihan > 0);

  const handleSimpanData = async () => {
    if (!editFormData) return;
    
    const targetSekolah = editSekolah === 'NEW' ? editFormData.sekolah.trim() : editSekolah;
    
    if (!targetSekolah || !editFormData.kabupaten) {
      alert("⚠️ Nama Sekolah dan Kabupaten wajib diisi!");
      return;
    }

    setIsSaving(true);

    try {
      const kebutuhanPayload = mapelList.map(mapel => ({
        sekolah: targetSekolah,
        kabupaten: editFormData.kabupaten,
        mapel: mapel,
        kurang: editFormData.mapel[mapel]?.kurang || 0,
        kelebihan: editFormData.mapel[mapel]?.kelebihan || 0,
        total_jam: editFormData.mapel[mapel]?.totalJam || 0,
        guru_ada: editFormData.mapel[mapel]?.guruAda || 0,
        last_updated: new Date().toISOString()
      }));

      const { error: errKebutuhan } = await supabase.from('kebutuhan_guru').upsert(kebutuhanPayload, { onConflict: 'sekolah, mapel' });
      if (errKebutuhan) throw errKebutuhan;

      await supabase.from('guru_kelebihan').delete().eq('sekolah', targetSekolah);

      if (surplusTeachers.length > 0) {
        const teacherPayload = surplusTeachers.map(t => ({
          sekolah: targetSekolah, nama: t.nama, nip: t.nip, pangkat: t.pangkat, status_pegawai: t.statusPegawai, ijasah: t.ijasah, bidang_studi: t.bidangStudi, tugas_mengajar: t.tugasMengajar, jam_mengajar: Number(t.jamMengajar) || 0, jam_tambahan: Number(t.jamTambahan) || 0, total_jam: Number(t.totalJam) || 0, alamat: t.alamat
        }));
        const { error: errTeacher } = await supabase.from('guru_kelebihan').insert(teacherPayload);
        if (errTeacher) throw errTeacher;
      }

      alert("🎉 Data instansi berhasil disimpan ke Database secara permanen!");
      window.location.reload(); 

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      alert("❌ Gagal menyimpan data: " + errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditSekolah('');
    setEditFormData(null);
    setSurplusTeachers([]);
    setIsUnlocked(false);
    setPasswordInput('');
  };

  const handleExportPDF = () => window.print();

  const addSurplusRow = () => setSurplusTeachers([...surplusTeachers, { id: Date.now(), nama: '', nip: '', pangkat: '', statusPegawai: '', ijasah: '', bidangStudi: '', tugasMengajar: '', jamMengajar: '', jamTambahan: '', totalJam: '', alamat: '' }]);
  const updateSurplusRow = (id: string | number, field: keyof SurplusTeacher, value: string | number) => {
    setSurplusTeachers(surplusTeachers.map(teacher => {
      if (teacher.id === id) {
        const updated = { ...teacher, [field]: value };
        if (field === 'jamMengajar' || field === 'jamTambahan') updated.totalJam = (Number(updated.jamMengajar) || 0) + (Number(updated.jamTambahan) || 0);
        return updated;
      }
      return teacher;
    }));
  };
  const removeSurplusRow = (id: string | number) => setSurplusTeachers(surplusTeachers.filter(t => t.id !== id));

  // Logika Khusus untuk Mengurutkan Kekurangan Guru di Modal View Detail
  const getSortedKekuranganMapels = (sekolahData: ProcessedData) => {
    return mapelList
      .filter(m => sekolahData.mapel[m]?.kurang > 0)
      .sort((a, b) => sekolahData.mapel[b].kurang - sekolahData.mapel[a].kurang);
  };

  if (loading) return <div className="flex justify-center items-center h-screen font-mono text-slate-400">MEMUAT DATA TABEL...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50/10 font-mono">ERROR: {error}</div>;

  return (
    <div className="p-8 min-h-screen bg-slate-900 text-slate-200 print:bg-white print:p-0 print:text-black relative">
      <div className="max-w-full mx-auto space-y-6">
        
        {/* HEADER KHUSUS CETAK PDF UTAMA */}
        <div className={`hidden print:block text-center mb-8 pt-8 ${viewDetailSekolah ? 'print:hidden' : ''}`}>
          <h1 className="text-2xl font-bold uppercase">Laporan Rekapitulasi Kebutuhan Guru</h1>
          <hr className="mt-4 border-2 border-black" />
        </div>

        {/* PANEL FILTER */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl print:hidden">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-cyan-400 uppercase tracking-widest">Rekapitulasi Kebutuhan Guru</h1>
            </div>
            <div className="flex items-center gap-2 bg-emerald-900/30 px-4 py-2 rounded-lg">
              <span className="text-emerald-400 font-medium text-sm">Standar Perhitungan: 30 Jam/Guru</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <select className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5" value={filterKabupaten} onChange={(e) => { setFilterKabupaten(e.target.value); setFilterSekolah(''); }}>
              <option value="">Semua Kabupaten</option>
              {listKabupaten.map(kab => <option key={kab} value={kab}>{kab}</option>)}
            </select>
            <select className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5" value={filterMapel} onChange={(e) => setFilterMapel(e.target.value)}>
              <option value="">Semua Mata Pelajaran</option>
              {mapelList.map(mapel => <option key={mapel} value={mapel}>{mapel}</option>)}
            </select>
            <select className="w-full bg-slate-900 border border-slate-700 text-amber-400 font-semibold rounded-lg px-4 py-2.5" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Semua Status Sekolah</option>
              <option value="kurang">Tampilkan Sekolah Kekurangan Guru</option>
              <option value="lebih">Tampilkan Sekolah Kelebihan Guru</option>
            </select>
            <select className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-4 py-2.5" value={filterSekolah} onChange={(e) => setFilterSekolah(e.target.value)}>
              <option value="">Lihat Semua Sekolah</option>
              {listSekolahFilter.map(sek => <option key={sek} value={sek}>{sek}</option>)}
            </select>
          </div>
        </div>

        {/* TABEL UTAMA */}
        <div className={`bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl overflow-hidden print:bg-white print:p-0 print:border-none print:shadow-none ${viewDetailSekolah ? 'print:hidden' : ''}`}>
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h2 className="text-lg font-bold text-white uppercase">Tabel Rekapitulasi Data</h2>
            <button onClick={handleExportPDF} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg">📄 Cetak PDF Tabel</button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-700 print:border-black print:rounded-none">
            <table className="w-full border-collapse text-sm print:text-black">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-700 print:bg-gray-200 print:border-black">
                  <th rowSpan={2} className="border-r border-slate-700 print:border-black px-4 py-3 min-w-32">Kabupaten</th>
                  <th rowSpan={2} className="border-r border-slate-700 print:border-black px-4 py-3 min-w-56">Nama Sekolah</th>
                  {activeMapels.map(mapel => (
                    <th key={mapel} colSpan={2} className="border-r border-slate-700 print:border-black px-4 py-2 text-cyan-500 print:text-black whitespace-nowrap">{mapel}</th>
                  ))}
                  <th rowSpan={2} className="px-4 py-3 text-emerald-400 print:hidden">Aksi</th>
                </tr>
                <tr className="bg-slate-800/50 border-b border-slate-700 print:bg-gray-100 print:border-black">
                  {activeMapels.map(mapel => (
                    <React.Fragment key={`${mapel}-sub`}>
                      <th className="border-r border-slate-700 print:border-black px-3 py-2 text-amber-400/90 print:text-black text-xs">Kurang</th>
                      <th className="border-r border-slate-700 print:border-black px-3 py-2 text-emerald-400/90 print:text-black text-xs">Lebih</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-700/50 border-b border-slate-700/50 print:border-black last:border-0">
                    <td className="border-r border-slate-700/50 print:border-black px-4 py-3 text-slate-400 print:text-black">{row.kabupaten}</td>
                    <td className="border-r border-slate-700/50 print:border-black px-4 py-3 font-medium text-slate-200 print:text-black">{row.sekolah}</td>
                    {activeMapels.map(mapel => {
                      const cell = row.mapel[mapel];
                      return (
                        <React.Fragment key={`${row.sekolah}-${mapel}`}>
                          <td className="border-r border-slate-700/50 print:border-black px-3 py-3 text-center text-amber-300/80 print:text-black">{(cell?.kurang > 0) ? cell.kurang : '-'}</td>
                          <td className="border-r border-slate-700/50 print:border-black px-3 py-3 text-center text-emerald-300/80 print:text-black">{(cell?.kelebihan > 0) ? cell.kelebihan : '-'}</td>
                        </React.Fragment>
                      );
                    })}
                    <td className="px-4 py-3 text-center print:hidden">
                      <button onClick={() => setViewDetailSekolah(row)} className="bg-cyan-900/50 hover:bg-cyan-600 text-cyan-300 hover:text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">Lihat Detail</button>
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr><td colSpan={activeMapels.length * 2 + 3} className="text-center py-8 text-slate-500 print:text-black">Tidak ada data. Semua mapel dalam kondisi AMAN atau tidak ada instansi yang cocok.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL KETERANGAN DETAIL SEKOLAH */}
        {viewDetailSekolah && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:static print:bg-transparent print:p-0 print:block">
            <div className="bg-slate-800 w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl border border-slate-600 shadow-2xl p-6 print:bg-white print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:text-black">
              
              <div className="flex justify-between items-center mb-6 border-b border-slate-700 print:border-black pb-4">
                <h2 className="text-2xl font-bold text-white print:text-black uppercase">Rincian Data: {viewDetailSekolah.sekolah}</h2>
                <div className="flex gap-3 print:hidden">
                  <button onClick={handleExportPDF} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2">📄 Cetak PDF Rincian</button>
                  <button onClick={() => setViewDetailSekolah(null)} className="text-slate-400 hover:text-white bg-slate-700 px-4 py-2 rounded font-bold">X TUTUP</button>
                </div>
              </div>

              {/* DETAIL KEKURANGAN */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-amber-400 print:text-black mb-3 border-l-4 border-amber-400 print:border-black pl-3">Daftar Kekurangan Guru</h3>
                <div className="space-y-3">
                  {getSortedKekuranganMapels(viewDetailSekolah).map(m => {
                    const data = viewDetailSekolah.mapel[m];
                    const isCritical = data.kurang > 1;
                    const rataRata = data.guruAda > 0 ? (data.totalJam / data.guruAda).toFixed(1) : data.totalJam;
                    
                    return (
                      <div key={m} className={`bg-slate-900/50 print:bg-transparent p-4 rounded-lg border ${isCritical ? 'border-red-900/50 print:border-red-500' : 'border-amber-900/30 print:border-black'}`}>
                        <p className="font-bold text-slate-200 print:text-black text-lg mb-1">
                          {m} 
                          <span className={`px-2 py-0.5 rounded text-sm ml-2 print:text-black print:font-bold ${isCritical ? 'text-red-400 bg-red-900/30' : 'text-amber-400 bg-amber-900/30'}`}>
                            Kurang {data.kurang} Guru
                          </span>
                        </p>
                        <p className="text-sm text-slate-400 print:text-gray-800">
                          Saat ini mata pelajaran ini memiliki total beban <strong className="text-white print:text-black">{data.totalJam || 0} Jam Pelajaran</strong>, dan hanya diampu oleh <strong className="text-white print:text-black">{data.guruAda || 0} Guru</strong>. <br/>
                          (Beban rata-rata saat ini menembus: <strong className={`${isCritical ? 'text-red-300 print:text-black' : 'text-amber-200 print:text-black'}`}>{rataRata} Jam/Guru</strong>).
                        </p>
                      </div>
                    );
                  })}
                  {getSortedKekuranganMapels(viewDetailSekolah).length === 0 && <p className="text-slate-500 print:text-gray-600 italic">Tidak ada kekurangan guru.</p>}
                </div>
              </div>

              {/* DETAIL KELEBIHAN & TABEL GURU */}
              <div>
                <h3 className="text-lg font-bold text-emerald-400 print:text-black mb-3 border-l-4 border-emerald-400 print:border-black pl-3">Daftar Kelebihan Guru & Rincian Nama</h3>
                <div className="space-y-6">
                  {mapelList.filter(m => viewDetailSekolah.mapel[m]?.kelebihan > 0).map(m => {
                    const data = viewDetailSekolah.mapel[m];
                    const guruList = allSurplusTeachers.filter(t => t.sekolah === viewDetailSekolah.sekolah && t.bidangStudi === m);
                    return (
                      <div key={m} className="bg-slate-900/50 print:bg-transparent p-4 rounded-lg border border-emerald-900/30 print:border-black overflow-x-auto print:overflow-visible">
                        <p className="font-bold text-slate-200 print:text-black text-lg mb-1">
                          {m} 
                          <span className="text-emerald-400 bg-emerald-900/30 print:text-black print:bg-transparent print:border print:border-black px-2 py-0.5 rounded text-sm ml-2">
                            Kelebihan {data.kelebihan} Guru
                          </span>
                        </p>
                        <p className="text-sm text-slate-400 print:text-gray-800 mb-4">Total beban {data.totalJam || 0} Jam Pelajaran, namun diampu oleh {data.guruAda || 0} Guru.</p>
                        
                        <table className="w-full text-left text-xs border border-slate-700 print:border-black">
                          <thead className="bg-slate-800 text-emerald-400 print:bg-gray-200 print:text-black text-center">
                            <tr>
                              <th className="p-2 border border-slate-700 print:border-black">Nama</th>
                              <th className="p-2 border border-slate-700 print:border-black">NIP</th>
                              <th className="p-2 border border-slate-700 print:border-black">Pangkat, Golongan, Jabatan</th>
                              <th className="p-2 border border-slate-700 print:border-black">PNS/ CPNS/ P3K</th>
                              <th className="p-2 border border-slate-700 print:border-black">Ijasah Terakhir</th>
                              <th className="p-2 border border-slate-700 print:border-black">Bidang Studi Serdik</th>
                              <th className="p-2 border border-slate-700 print:border-black">Tugas Mengajar</th>
                              <th className="p-2 border border-slate-700 print:border-black">Jumlah Jam Mengajar</th>
                              <th className="p-2 border border-slate-700 print:border-black">Tugas Tambahan (jam)</th>
                              <th className="p-2 border border-slate-700 print:border-black">Total Jam</th>
                              <th className="p-2 border border-slate-700 print:border-black">Alamat Domisi Tempat Tinggal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {guruList.map(g => (
                              <tr key={g.id} className="border-b border-slate-700/50 print:border-black">
                                <td className="p-2 border-r border-slate-700 print:border-black">{g.nama}</td>
                                <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.nip}</td>
                                <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.pangkat}</td>
                                <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.statusPegawai}</td>
                                <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.ijasah}</td>
                                <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.bidangStudi}</td>
                                <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.tugasMengajar}</td>
                                <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.jamMengajar}</td>
                                <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.jamTambahan}</td>
                                <td className="p-2 font-bold text-emerald-200 print:text-black border-r border-slate-700 print:border-black text-center">{g.totalJam}</td>
                                <td className="p-2 border-r border-slate-700 print:border-black">{g.alamat}</td>
                              </tr>
                            ))}
                            {guruList.length === 0 && <tr><td colSpan={11} className="p-4 text-center text-rose-400 print:text-black italic">Admin sekolah belum menginputkan rincian nama guru pada mata pelajaran ini.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    );
                  })}
                  {mapelList.filter(m => viewDetailSekolah.mapel[m]?.kelebihan > 0).length === 0 && <p className="text-slate-500 print:text-gray-600 italic">Tidak ada kelebihan guru.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= AREA EDITOR ================= */}
        <div className="border-t border-slate-700 pt-5 mt-5 print:hidden">
          <h2 className="text-xs font-bold text-emerald-500/80 uppercase tracking-wider mb-3">📝 Mode Editor Instansi & Input Sekolah Baru</h2>
          <select className="w-full max-w-md bg-slate-950 border border-emerald-700/50 text-emerald-400 rounded-lg px-4 py-2.5" value={editSekolah} onChange={handleSelectEditSekolah}>
            <option value="">-- Pilih Sekolah Untuk Diedit --</option>
            <option value="NEW" className="text-cyan-400 font-bold">➕ TAMBAH SEKOLAH BARU</option>
            {listSekolahFilter.map(sek => <option key={sek} value={sek}>{sek}</option>)}
          </select>
        </div>

        {editSekolah && editFormData && (
          <div className="bg-slate-800 p-6 rounded-xl border border-cyan-700/50 shadow-2xl mt-6 print:hidden">
            {!isUnlocked ? (
              <div className="py-12 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-red-900/30 text-red-400 flex items-center justify-center mb-4">🔒</div>
                <p className="text-sm text-slate-400 mb-6 text-center">Masukkan PIN Otorisasi</p>
                <div className="flex gap-2">
                  <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-center text-white" />
                  <button onClick={handleUnlock} className="bg-cyan-600 hover:bg-cyan-500 px-6 py-2 rounded-lg font-bold">Buka</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-8 flex flex-col md:flex-row gap-4 border-b border-slate-700 pb-6">
                   <div className="flex-1">
                     <label className="block text-sm font-semibold text-slate-300 mb-2">Nama Sekolah</label>
                     {editSekolah === 'NEW' ? (
                         <input type="text" value={editFormData.sekolah} onChange={(e) => setEditFormData({...editFormData, sekolah: e.target.value.toUpperCase()})} placeholder="Ketik nama sekolah baru..." className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" />
                     ) : (
                         <input type="text" value={editSekolah} disabled className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed font-bold" />
                     )}
                   </div>
                   <div className="flex-1">
                      <label className="block text-sm font-semibold text-slate-300 mb-2">Kabupaten / Kota</label>
                      <select value={editFormData.kabupaten} onChange={(e) => setEditFormData({...editFormData, kabupaten: e.target.value})} className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none">
                        <option value="">-- Pilih Kabupaten --</option>
                        <option value="Karanganyar">Karanganyar</option>
                        <option value="Sragen">Sragen</option>
                        <option value="Wonogiri">Wonogiri</option>
                      </select>
                   </div>
                </div>

                <div className="mb-8">
                  <label className="block text-sm font-semibold text-slate-300 mb-4">Kalkulator Kebutuhan Guru Per Mapel (Otomatis Basis 30 Jam)</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {mapelList.map(mapel => (
                      <div key={mapel} className="bg-slate-900/50 p-4 rounded-lg border border-slate-700">
                        <p className="text-sm font-bold text-cyan-400 mb-3 truncate">{mapel}</p>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">TOTAL JAM</label>
                            <input type="number" min="0" value={editCalc[mapel]?.totalJam} onChange={(e) => handleCalculation(mapel, 'totalJam', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-center"/>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">GURU SAAT INI</label>
                            <input type="number" min="0" value={editCalc[mapel]?.guruTersedia} onChange={(e) => handleCalculation(mapel, 'guruTersedia', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-center"/>
                          </div>
                        </div>
                        <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg">
                          <div className="text-center"><span className="text-[10px] text-slate-500 block">KURANG</span><span className="text-sm font-bold text-amber-400">{editCalc[mapel]?.kurang || 0}</span></div>
                          <div className="text-center"><span className="text-[10px] text-slate-500 block">LEBIH</span><span className="text-sm font-bold text-emerald-400">{editCalc[mapel]?.kelebihan || 0}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {hasAnySurplus && (
                  <div className="bg-rose-900/30 border-l-4 border-rose-500 p-4 rounded-r-lg mb-6">
                    <p className="text-rose-400 font-bold text-lg mb-1">⚠️ Peringatan: Terdeteksi Kelebihan Guru!</p>
                    <p className="text-slate-300 text-sm">Sesuai prosedur, Anda diwajibkan untuk menginputkan <strong>SELURUH data rincian guru</strong> pada mata pelajaran yang berstatus "Lebih" ke dalam tabel di bawah ini.</p>
                  </div>
                )}

                <div className="mb-8 border-t border-slate-700 pt-8">
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-semibold text-slate-300">Tabel Data Kelebihan Guru</label>
                    <button onClick={addSurplusRow} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/50">+ Tambah Baris Guru</button>
                  </div>
                  
                  <div className="overflow-x-auto rounded-lg border border-slate-700">
                    <table className="w-full border-collapse text-sm">
                      <thead className="bg-slate-900 text-slate-300 text-center whitespace-nowrap">
                        <tr>
                          <th className="p-3 border-r border-slate-700">No</th>
                          <th className="p-3 border-r border-slate-700">Nama</th>
                          <th className="p-3 border-r border-slate-700">NIP</th>
                          <th className="p-3 border-r border-slate-700">Pangkat, Golongan, Jabatan</th>
                          <th className="p-3 border-r border-slate-700">PNS/ CPNS/ P3K</th>
                          <th className="p-3 border-r border-slate-700">Ijasah S1</th>
                          <th className="p-3 border-r border-slate-700">Bidang Studi Serdik</th>
                          <th className="p-3 border-r border-slate-700">Tugas Mengajar</th>
                          <th className="p-3 border-r border-slate-700">Jumlah Jam Mengajar</th>
                          <th className="p-3 border-r border-slate-700">Tugas Tambahan (jam)</th>
                          <th className="p-3 border-r border-slate-700">Total Jam</th>
                          <th className="p-3 border-r border-slate-700">Alamat Domisi Tempat Tinggal</th>
                          <th className="p-3">Hapus</th>
                        </tr>
                      </thead>
                      <tbody>
                        {surplusTeachers.length === 0 ? (
                          <tr><td colSpan={13} className="text-center py-8 text-slate-500 italic font-medium">Belum ada rincian data guru kelebihan.</td></tr>
                        ) : (
                          surplusTeachers.map((teacher, index) => (
                            <tr key={teacher.id} className="border-b border-slate-700/50">
                              <td className="p-2 border-r border-slate-700/50 text-center text-slate-400">{index + 1}</td>
                              <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.nama} onChange={(e) => updateSurplusRow(teacher.id, 'nama', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors" /></td>
                              <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.nip} onChange={(e) => updateSurplusRow(teacher.id, 'nip', e.target.value)} className="w-full min-w-32 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors" /></td>
                              <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.pangkat} onChange={(e) => updateSurplusRow(teacher.id, 'pangkat', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors" /></td>
                              <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.statusPegawai} onChange={(e) => updateSurplusRow(teacher.id, 'statusPegawai', e.target.value)} className="w-full min-w-32 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors" /></td>
                              <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.ijasah} onChange={(e) => updateSurplusRow(teacher.id, 'ijasah', e.target.value)} className="w-full min-w-32 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors" /></td>
                              <td className="p-2 border-r border-slate-700/50">
                                <select value={teacher.bidangStudi} onChange={(e) => updateSurplusRow(teacher.id, 'bidangStudi', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors">
                                  <option value="">Pilih Bidang Studi...</option>
                                  {mapelList.map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                              </td>
                              <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.tugasMengajar} onChange={(e) => updateSurplusRow(teacher.id, 'tugasMengajar', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors" /></td>
                              <td className="p-2 border-r border-slate-700/50"><input type="number" min="0" value={teacher.jamMengajar} onChange={(e) => updateSurplusRow(teacher.id, 'jamMengajar', e.target.value)} className="w-full min-w-24 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none text-center transition-colors" /></td>
                              <td className="p-2 border-r border-slate-700/50"><input type="number" min="0" value={teacher.jamTambahan} onChange={(e) => updateSurplusRow(teacher.id, 'jamTambahan', e.target.value)} className="w-full min-w-24 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none text-center transition-colors" /></td>
                              <td className="p-2 border-r border-slate-700/50"><input type="number" value={teacher.totalJam} readOnly className="w-full min-w-20 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-emerald-400 font-bold outline-none text-center cursor-not-allowed" /></td>
                              <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.alamat} onChange={(e) => updateSurplusRow(teacher.id, 'alamat', e.target.value)} className="w-full min-w-56 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors" /></td>
                              <td className="p-2 text-center"><button onClick={() => removeSurplusRow(teacher.id)} className="text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded transition-colors font-bold">X</button></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-700 pt-6">
                  <button onClick={handleCancelEdit} disabled={isSaving} className="px-6 py-3 rounded-lg font-bold transition-all text-slate-300 bg-slate-700 hover:bg-slate-600 hover:text-white">
                    ❌ BATAL / TUTUP
                  </button>
                  <button onClick={handleSimpanData} disabled={isSaving} className={`px-8 py-3 rounded-lg font-bold transition-all shadow-lg ${isSaving ? 'bg-slate-600 text-slate-400 cursor-not-allowed shadow-none' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/50'}`}>
                    {isSaving ? '🔄 MENYIMPAN DATA...' : '💾 SIMPAN DATA SEKOLAH'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RekapKebutuhanGuru;
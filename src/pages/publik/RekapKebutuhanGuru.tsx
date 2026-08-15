import React, { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../../supabaseClient';
import { calculateKebutuhan } from '../../utils/kalkulasiGuru';

import DashboardStatistik from '../../components/rekap/DashboardStatistik';
import ModalDetailSekolah from '../../components/rekap/ModalDetailSekolah';
import EditorInstansi from '../../components/rekap/EditorInstansi';

export interface ProcessedData {
  kabupaten: string;
  sekolah: string;
  mapel: Record<string, { kurang: number; kelebihan: number; totalJam: number; guruAda: number }>;
}

export interface SurplusTeacher {
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
  rincianTugasTambahan?: string; // FITUR BARU
  totalJam: number | '';
  alamat: string;
}

const RekapKebutuhanGuru = () => {
  const [data, setData] = useState<ProcessedData[]>([]);
  const [mapelList, setMapelList] = useState<string[]>([]);
  const [allSurplusTeachers, setAllSurplusTeachers] = useState<SurplusTeacher[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [filterJenjang, setFilterJenjang] = useState<string>('Semua'); 
  const [filterKabupaten, setFilterKabupaten] = useState<string>('');
  const [filterMapel, setFilterMapel] = useState<string>(''); 
  const [filterStatus, setFilterStatus] = useState<string>(''); 
  const [filterSekolah, setFilterSekolah] = useState<string>('');
  
  const [viewDetailSekolah, setViewDetailSekolah] = useState<ProcessedData | null>(null);
  const [searchSurplusMapel, setSearchSurplusMapel] = useState<string>('');

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      const grouped: Record<string, ProcessedData> = {};
      const mapels = new Set<string>();

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

          if (colMapel && colSekolah) {
            rawData.forEach(item => {
              const kab = item[colKabupaten || ''] || '-';
              const sek = item[colSekolah]?.trim();
              const mapel = item[colMapel]?.trim();

              if (!sek) return;
              if (!grouped[sek]) grouped[sek] = { kabupaten: kab, sekolah: sek, mapel: {} };
              
              if (mapel) {
                grouped[sek].mapel[mapel] = { kurang: 0, kelebihan: 0, totalJam: 0, guruAda: 0 };
                mapels.add(mapel);
              }
            });
          }
        }
      } catch { console.warn("Spreadsheet tidak merespon."); }

      try {
        const { data: supaData } = await supabase.from('kebutuhan_guru').select('*');
        if (supaData) {
          supaData.forEach(row => {
            const sek = row.sekolah;
            const mapel = row.mapel;
            
            if (!grouped[sek]) grouped[sek] = { kabupaten: row.kabupaten || '-', sekolah: sek, mapel: {} };
            else if (row.kabupaten && row.kabupaten !== '-') grouped[sek].kabupaten = row.kabupaten;

            const T = row.total_jam || 0;
            const G = row.guru_ada || 0;
            const { kurang, kelebihan } = calculateKebutuhan(mapel, T, G);
            
            grouped[sek].mapel[mapel] = { kurang, kelebihan, totalJam: T, guruAda: G };
            mapels.add(mapel);
          });
        }

        const { data: supaTeachers } = await supabase.from('guru_kelebihan').select('*');
        if (supaTeachers) {
           setAllSurplusTeachers(supaTeachers.map(t => ({
             id: t.id, sekolah: t.sekolah, nama: t.nama, nip: t.nip, pangkat: t.pangkat,
             statusPegawai: t.status_pegawai, ijasah: t.ijasah, bidangStudi: t.bidang_studi,
             tugasMengajar: t.tugas_mengajar, jamMengajar: t.jam_mengajar, jamTambahan: t.jam_tambahan,
             rincianTugasTambahan: t.rincian_tugas_tambahan || '', // MENARIK DATA RINCIAN
             totalJam: t.total_jam, alamat: t.alamat
           })));
        }

      } catch { console.error("Gagal mengambil database."); }

      if (Object.keys(grouped).length === 0) setError("Data kosong.");
      setMapelList(Array.from(mapels));
      setData(Object.values(grouped));
      setLoading(false);
    };
    fetchAllData();
  }, []);

  const dataByJenjang = data.filter(d => {
    const namaSekolah = d.sekolah.toUpperCase();
    if (filterJenjang === 'SMA') {
      // \b memastikan sistem mencari kata utuh (SMA / SMAN / SMAS), 
      // sehingga huruf "SMA" di dalam kata KISMANTORO akan diabaikan.
      return /\b(SMA|SMAN|SMAS)\b/.test(namaSekolah);
    }
    if (filterJenjang === 'SMK') {
      return /\b(SMK|SMKN|SMKS)\b/.test(namaSekolah);
    }
    return true;
  });

  const listKabupaten = Array.from(new Set(dataByJenjang.map(d => d.kabupaten).filter(Boolean)));
  const listSekolahFilter = dataByJenjang.filter(d => filterKabupaten === '' || d.kabupaten === filterKabupaten).map(d => d.sekolah);

  const filteredData = dataByJenjang.filter(d => {
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

  const matchedSurplusTeachers = allSurplusTeachers.filter(t => searchSurplusMapel === '' || t.bidangStudi === searchSurplusMapel);

  const handleExportPDF = () => window.print();

  if (loading) return <div className="flex justify-center items-center h-screen font-mono text-slate-400">MEMUAT DATA TABEL...</div>;
  if (error) return <div className="p-8 text-center text-red-500 bg-red-50/10 font-mono">ERROR: {error}</div>;

  return (
    <div className="p-8 min-h-screen bg-slate-900 text-slate-200 print:bg-white print:p-0 print:text-black relative">
      <div className="max-w-full mx-auto space-y-6">
        
        <div className={`hidden print:block text-center mb-8 pt-8 ${viewDetailSekolah ? 'print:hidden' : ''}`}>
          <h1 className="text-2xl font-bold uppercase">Laporan Rekapitulasi Kebutuhan Guru</h1>
          <hr className="mt-4 border-2 border-black" />
        </div>

        <DashboardStatistik 
          dashboardData={dataByJenjang}
          mapelList={mapelList}
          searchSurplusMapel={searchSurplusMapel}
          setSearchSurplusMapel={setSearchSurplusMapel}
          matchedSurplusTeachers={matchedSurplusTeachers}
        />

        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl print:hidden mt-6">
          <div className="flex justify-between items-center mb-3">
             <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">🛠️ Filter Tampilan Tabel Analisis</h2>
             <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-cyan-800/50">
               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pilih Jenjang:</span>
               <select className="bg-transparent text-cyan-400 font-bold outline-none text-xs" value={filterJenjang} onChange={(e) => { setFilterJenjang(e.target.value); setFilterSekolah(''); }}>
                 <option value="Semua">SELURUH CABDIN</option>
                 <option value="SMA">KHUSUS SMA</option>
                 <option value="SMK">KHUSUS SMK</option>
               </select>
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
              <option value="">Lihat Semua Sekolah {filterJenjang !== 'Semua' ? filterJenjang : ''}</option>
              {listSekolahFilter.map(sek => <option key={sek} value={sek}>{sek}</option>)}
            </select>
          </div>
        </div>

        <div className={`bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl overflow-hidden print:bg-white print:p-0 print:border-none print:shadow-none ${viewDetailSekolah ? 'print:hidden' : ''}`}>
          <div className="flex justify-between items-center mb-6 print:hidden">
            <h2 className="text-lg font-bold text-white uppercase">Tabel Rekapitulasi Data {filterJenjang !== 'Semua' ? filterJenjang : ''}</h2>
            <button onClick={handleExportPDF} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg">📄 Cetak Laporan PDF</button>
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
                  <tr><td colSpan={activeMapels.length * 2 + 3} className="text-center py-8 text-slate-500 print:text-black">Tidak ada data instansi yang cocok dengan filter.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {viewDetailSekolah && (
          <ModalDetailSekolah 
            viewDetailSekolah={viewDetailSekolah}
            setViewDetailSekolah={setViewDetailSekolah}
            mapelList={mapelList}
            allSurplusTeachers={allSurplusTeachers}
            handleExportPDF={handleExportPDF}
          />
        )}

        <EditorInstansi 
          data={data}
          mapelList={mapelList}
          listSekolahFilter={Array.from(new Set(data.map(d => d.sekolah)))}
          allSurplusTeachers={allSurplusTeachers}
        />

      </div>
    </div>
  );
};

export default RekapKebutuhanGuru;
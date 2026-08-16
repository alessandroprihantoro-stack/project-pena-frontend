import React, { useState } from 'react';

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
  rincianTugasTambahan?: string;
  totalJam: number | '';
  alamat: string;
}

interface DashboardProps {
  dashboardData: ProcessedData[];
  mapelList: string[];
  searchSurplusMapel: string;
  setSearchSurplusMapel: (val: string) => void;
  matchedSurplusTeachers: SurplusTeacher[];
  sekolahSudahInput: string[];
}

const DashboardStatistik: React.FC<DashboardProps> = ({
  dashboardData,
  mapelList,
  searchSurplusMapel,
  setSearchSurplusMapel,
  matchedSurplusTeachers,
  sekolahSudahInput
}) => {
  const [chartScope, setChartScope] = useState<string>('CABDIN 6');
  const [selectedTeacherDetail, setSelectedTeacherDetail] = useState<SurplusTeacher | null>(null);

  // MENGGUNAKAN DATA LANGSUNG (TIDAK DIHITUNG ULANG AGAR TIDAK ERROR)
  let totalKekurangan = 0;
  let totalKelebihan = 0;
  dashboardData.forEach(school => {
    Object.values(school.mapel).forEach(m => {
      totalKekurangan += m.kurang || 0;
      totalKelebihan += m.kelebihan || 0;
    });
  });

  const rawChartData: Record<string, { kurang: number; lebih: number }> = {};
  
  if (chartScope === 'CABDIN 6') {
    dashboardData.forEach(school => {
      const kab = school.kabupaten || 'Lainnya';
      if (!rawChartData[kab]) rawChartData[kab] = { kurang: 0, lebih: 0 };
      Object.values(school.mapel).forEach(m => {
        rawChartData[kab].kurang += m.kurang || 0;
        rawChartData[kab].lebih += m.kelebihan || 0;
      });
    });
  } else {
    dashboardData.filter(d => d.kabupaten === chartScope).forEach(school => {
      Object.entries(school.mapel).forEach(([namaMapel, m]) => {
        if (!rawChartData[namaMapel]) rawChartData[namaMapel] = { kurang: 0, lebih: 0 };
        rawChartData[namaMapel].kurang += m.kurang || 0;
        rawChartData[namaMapel].lebih += m.kelebihan || 0;
      });
    });
  }

  let chartData = Object.entries(rawChartData)
    .map(([label, stats]) => ({ label, ...stats }))
    .filter(d => d.kurang > 0 || d.lebih > 0);
  
  if (chartScope !== 'CABDIN 6') {
      chartData = chartData.sort((a, b) => (b.kurang + b.lebih) - (a.kurang + a.lebih));
  }

  const maxChartValue = Math.max(...chartData.flatMap(d => [d.kurang, d.lebih]), 1) * 1.2;

  const formatChartLabel = (label: string, scope: string) => {
    if (scope === 'CABDIN 6') return label.substring(0, 3); 
    return label.toUpperCase().replace(/^GURU\s+/i, '').substring(0, 8);
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl print:border-none print:shadow-none print:bg-transparent relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-700 print:border-black pb-4">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400 print:text-black uppercase tracking-widest">Dashboard Distribusi Guru</h1>
          <p className="text-sm text-slate-400 print:text-gray-600 mt-1">Pemetaan & Pusat Relokasi Guru Tingkat Menengah</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-2 bg-emerald-900/30 print:bg-transparent px-4 py-2 rounded-lg print:p-0">
          <span className="text-emerald-400 print:text-black font-medium text-sm">Jam ideal guru 30 jam pelajaran (Min: 30, Maks: 37)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/50 print:bg-white p-4 rounded-xl border border-amber-900/30 print:border-black text-center">
              <p className="text-[10px] font-bold text-slate-500 print:text-black uppercase mb-1">Total Kekurangan</p>
              <p className="text-3xl font-black text-amber-400 print:text-black">{totalKekurangan}</p>
            </div>
            <div className="bg-slate-900/50 print:bg-white p-4 rounded-xl border border-emerald-900/30 print:border-black text-center">
              <p className="text-[10px] font-bold text-slate-500 print:text-black uppercase mb-1">Total Kelebihan</p>
              <p className="text-3xl font-black text-emerald-400 print:text-black">{totalKelebihan}</p>
            </div>
          </div>

          <div className="bg-slate-900/50 print:bg-transparent p-5 rounded-xl border border-slate-700 print:border-black h-72 flex flex-col justify-between">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-xs font-bold text-slate-300 print:text-black uppercase">Statistik Pemetaan</h3>
               <select 
                  className="bg-slate-950 border border-cyan-800 text-cyan-400 text-xs rounded px-2 py-1 outline-none cursor-pointer"
                  value={chartScope} onChange={(e) => setChartScope(e.target.value)}
               >
                  <option value="CABDIN 6">CABDIN 6 (Global)</option>
                  <option value="Karanganyar">Kab. Karanganyar</option>
                  <option value="Sragen">Kab. Sragen</option>
                  <option value="Wonogiri">Kab. Wonogiri</option>
               </select>
            </div>
            
            <div className="flex-1 flex items-end gap-4 justify-start overflow-x-auto border-b border-slate-700 print:border-black pb-2 pt-4 relative snap-x" style={{ scrollbarWidth: 'thin' }}>
              {chartData.length === 0 && <p className="absolute inset-0 flex items-center justify-center text-xs text-slate-600">Tidak ada data terdeteksi.</p>}
              
              {chartData.map(d => (
                <div 
                   key={d.label} 
                   onClick={() => {
                     if (chartScope !== 'CABDIN 6') setSearchSurplusMapel(d.label);
                   }}
                   className={`flex flex-col items-center gap-2 min-w-12 h-full justify-end group overflow-hidden snap-center px-1 rounded-t-lg transition-colors ${chartScope !== 'CABDIN 6' ? 'cursor-pointer hover:bg-slate-700/50' : ''}`}
                   title={chartScope !== 'CABDIN 6' ? `Klik untuk mencari guru mapel ${d.label}` : d.label}
                >
                  <div className="flex items-end gap-1 w-full justify-center h-full">
                    <div className="relative w-4 sm:w-5 bg-amber-500/80 hover:bg-amber-400 print:bg-gray-400 rounded-t flex flex-col justify-end items-center transition-all" style={{ height: `${(d.kurang / maxChartValue) * 100}%`, minHeight: d.kurang > 0 ? '10px' : '0' }}>
                       <span className="opacity-0 group-hover:opacity-100 absolute -top-6 text-[10px] font-bold text-amber-300 print:text-black bg-slate-900 px-1 rounded transition-opacity z-10">{d.kurang}</span>
                    </div>
                    <div className="relative w-4 sm:w-5 bg-emerald-500/80 hover:bg-emerald-400 print:bg-black rounded-t flex flex-col justify-end items-center transition-all" style={{ height: `${(d.lebih / maxChartValue) * 100}%`, minHeight: d.lebih > 0 ? '10px' : '0' }}>
                       <span className="opacity-0 group-hover:opacity-100 absolute -top-6 text-[10px] font-bold text-emerald-300 print:text-black bg-slate-900 px-1 rounded transition-opacity z-10">{d.lebih}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 group-hover:text-white print:text-black uppercase truncate w-full text-center transition-colors">
                    {formatChartLabel(d.label, chartScope)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4 mt-3">
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-500/80 rounded-sm"></div><span className="text-[10px] text-slate-400">Kurang</span></div>
               <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500/80 rounded-sm"></div><span className="text-[10px] text-slate-400">Lebih</span></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-900/80 p-5 rounded-xl border border-cyan-900/50 print:hidden flex flex-col h-full relative">
          <h3 className="text-lg font-bold text-cyan-400 mb-2 border-b border-slate-700 pb-2 flex items-center gap-2">
            🔍 Pusat Pencarian Guru (Mutasi)
          </h3>
          <p className="text-xs text-slate-400 mb-4">
             Pilih mata pelajaran di bawah ini <strong className="text-cyan-300">(atau klik batangan grafik di samping)</strong>. Klik pada kartu nama guru untuk melihat rincian datanya.
          </p>
          
          <select 
            className="w-full bg-slate-800 border border-slate-600 text-slate-200 rounded-lg px-4 py-2 mb-4 focus:border-cyan-500 outline-none cursor-pointer" 
            value={searchSurplusMapel} 
            onChange={(e) => setSearchSurplusMapel(e.target.value)}
          >
            <option value="">-- Tampilkan Semua Guru Berlebih --</option>
            {mapelList.map(mapel => <option key={mapel} value={mapel}>{mapel}</option>)}
          </select>

          <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '250px' }}>
            {matchedSurplusTeachers.length === 0 ? (
              <div className="h-full flex items-center justify-center border-2 border-dashed border-slate-700 rounded-lg p-6">
                <p className="text-slate-500 text-sm text-center">Tidak ada guru kelebihan yang terdata pada mata pelajaran ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {matchedSurplusTeachers.map((t, idx) => (
                  <div 
                     key={idx} 
                     onClick={() => setSelectedTeacherDetail(t)} 
                     className="bg-slate-800 p-3 rounded-lg border border-slate-600 hover:border-emerald-500 hover:bg-slate-700/50 transition-all shadow-lg cursor-pointer group"
                     title="Klik untuk melihat detail profil guru ini"
                  >
                    <p className="font-bold text-white text-sm truncate group-hover:text-emerald-300 transition-colors">{t.nama}</p>
                    <p className="text-xs text-slate-400 mb-2">{t.nip}</p>
                    <div className="flex justify-between items-center text-[10px]">
                       <span className="bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded truncate max-w-[60%]" title={t.sekolah}>{t.sekolah}</span>
                       <span className="bg-emerald-900/50 text-emerald-300 px-2 py-0.5 rounded font-bold">{t.bidangStudi}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-slate-900/50 p-5 rounded-xl border border-emerald-900/50 print:hidden">
         <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
            ✅ Daftar Instansi Yang Telah Menyimpan Form Kalkulator Guru
         </h3>
         <div className="flex flex-wrap gap-2">
            {sekolahSudahInput.length === 0 ? (
               <span className="text-xs text-slate-500 italic">Belum ada sekolah yang menginput data ke database.</span>
            ) : (
               sekolahSudahInput.sort().map(sek => (
                  <span key={sek} className="bg-emerald-900/40 text-emerald-300 border border-emerald-700/50 px-3 py-1 rounded-full text-[11px] font-bold shadow-md">
                     {sek}
                  </span>
               ))
            )}
         </div>
      </div>

      {selectedTeacherDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:hidden animate-fade-in-up">
          <div className="bg-slate-800 w-full max-w-2xl rounded-xl border border-emerald-500/50 shadow-2xl p-6 relative">
            
            <button 
              onClick={() => setSelectedTeacherDetail(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-700 hover:bg-rose-600 px-3 py-1.5 rounded font-bold transition-colors text-xs"
            >
              X TUTUP
            </button>
            
            <div className="flex items-center gap-3 border-b border-slate-700 pb-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-emerald-900/50 flex items-center justify-center border border-emerald-500 text-xl">
                 🧑‍🏫
              </div>
              <div>
                 <h2 className="text-xl font-bold text-white leading-tight">Profil Detail Guru Mutasi</h2>
                 <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Kandidat Relokasi</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                 <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Nama Lengkap</span>
                 <strong className="text-emerald-300 text-base">{selectedTeacherDetail.nama}</strong>
              </div>
              <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                 <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">NIP</span>
                 <strong className="text-slate-200">{selectedTeacherDetail.nip || '-'}</strong>
              </div>
              <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                 <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Asal Sekolah</span>
                 <strong className="text-cyan-300">{selectedTeacherDetail.sekolah}</strong>
              </div>
              <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                 <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Bidang Studi Serdik</span>
                 <strong className="text-amber-300">{selectedTeacherDetail.bidangStudi}</strong>
              </div>
              <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                 <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Status Pegawai</span>
                 <strong className="text-slate-200">{selectedTeacherDetail.statusPegawai || '-'}</strong>
              </div>
              <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                 <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Pangkat / Golongan</span>
                 <strong className="text-slate-200">{selectedTeacherDetail.pangkat || '-'}</strong>
              </div>
              <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                 <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Ijasah S1</span>
                 <strong className="text-slate-200">{selectedTeacherDetail.ijasah || '-'}</strong>
              </div>
              <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
                 <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Tugas Mengajar</span>
                 <strong className="text-slate-200">{selectedTeacherDetail.tugasMengajar || '-'}</strong>
              </div>
              
              <div className="md:col-span-2 flex gap-4 bg-slate-950 p-4 rounded-lg border border-slate-700 shadow-inner">
                <div className="flex-1 text-center border-r border-slate-700">
                   <span className="text-slate-500 block text-[10px] uppercase font-bold">Jam Mengajar</span>
                   <strong className="text-white text-lg">{selectedTeacherDetail.jamMengajar || 0}</strong>
                </div>
                <div className="flex-1 text-center border-r border-slate-700 flex flex-col justify-center">
                   <span className="text-slate-500 block text-[10px] uppercase font-bold">Jam Tambahan</span>
                   <strong className="text-white text-lg leading-none mt-1">{selectedTeacherDetail.jamTambahan || 0}</strong>
                   {selectedTeacherDetail.rincianTugasTambahan && (
                     <span className="text-[10px] text-amber-400 font-medium italic mt-1 px-2 truncate" title={selectedTeacherDetail.rincianTugasTambahan}>
                       ({selectedTeacherDetail.rincianTugasTambahan})
                     </span>
                   )}
                </div>
                <div className="flex-1 text-center">
                   <span className="text-emerald-500 block text-[10px] uppercase font-bold">TOTAL BEBAN JAM</span>
                   <strong className="text-emerald-400 text-2xl">{selectedTeacherDetail.totalJam || 0}</strong>
                </div>
              </div>
              
              <div className="md:col-span-2">
                 <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Alamat Domisili</span>
                 <p className="text-slate-200 bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 italic">
                    {selectedTeacherDetail.alamat || 'Alamat belum diinputkan.'}
                 </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardStatistik;
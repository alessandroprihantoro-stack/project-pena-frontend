import React, { useState } from 'react';

export interface ProcessedData {
  kabupaten: string;
  sekolah: string;
  mapel: Record<string, { kurang: number; kelebihan: number }>;
}

// 🌟 BARU: Extend interface untuk menangkap status Rekomendasi
export interface SurplusTeacher {
  id: string | number;
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
  sekolah?: string;
  bulanTahunPensiun?: string;
  is_rekomendasi_internal?: boolean;
  alasanRekomendasi?: string;
}

interface ModalProps {
  viewDetailSekolah: ProcessedData;
  setViewDetailSekolah: (data: ProcessedData | null) => void;
  mapelList: string[];
  allSurplusTeachers: SurplusTeacher[];
  handleExportPDF: () => void;
}

const ModalDetailSekolah: React.FC<ModalProps> = ({
  viewDetailSekolah,
  setViewDetailSekolah,
  mapelList,
  allSurplusTeachers,
  handleExportPDF
}) => {
  
  const [filterStatusPegawai, setFilterStatusPegawai] = useState<string | null>(null);

  const getSortedKekuranganMapels = (sekolahData: ProcessedData) => {
    return mapelList
      .filter(m => (sekolahData.mapel[m]?.kurang || 0) > 0)
      .sort((a, b) => (sekolahData.mapel[b]?.kurang || 0) - (sekolahData.mapel[a]?.kurang || 0));
  };

  const mapelKelebihan = mapelList.filter(m => (viewDetailSekolah.mapel[m]?.kelebihan || 0) > 0);
  const guruDiSekolahIni = allSurplusTeachers.filter(t => t.sekolah === viewDetailSekolah.sekolah);
  const totalGuruMutasi = guruDiSekolahIni.length;

  const statusCounts = guruDiSekolahIni.reduce((acc, curr) => {
    const rawStatus = curr.statusPegawai?.trim() || 'Lainnya';
    acc[rawStatus] = (acc[rawStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:static print:bg-transparent print:p-0 print:block">
      <div className="bg-slate-800 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-600 shadow-2xl p-6 print:bg-white print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:text-black relative" style={{ scrollbarWidth: 'thin' }}>
        
        <div className="flex justify-between items-center mb-6 border-b border-slate-700 print:border-black pb-4 sticky top-0 bg-slate-800 z-20 print:static">
          <h2 className="text-2xl font-bold text-white print:text-black uppercase">Data Instansi: {viewDetailSekolah.sekolah}</h2>
          <div className="flex gap-3 print:hidden">
            <button onClick={handleExportPDF} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 shadow-lg">
              📄 Cetak PDF
            </button>
            <button onClick={() => setViewDetailSekolah(null)} className="text-slate-400 hover:text-white bg-slate-700 px-4 py-2 rounded font-bold transition-colors">
              X TUTUP
            </button>
          </div>
        </div>

        {totalGuruMutasi > 0 && (
          <div className="mb-8 flex flex-col md:flex-row gap-6 print:hidden">
            <div className="bg-white rounded-2xl p-5 shadow-lg w-full md:w-80 shrink-0">
               <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                  <div className="flex items-center gap-2 text-teal-800 font-bold text-lg">
                     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                     Total Data
                  </div>
                  <div className="bg-teal-50 text-teal-700 font-black px-4 py-1.5 rounded-full text-lg shadow-sm border border-teal-100">
                     {String(totalGuruMutasi).padStart(4, '0')}
                  </div>
               </div>
               
               <p className="text-[10px] font-bold text-gray-400 mb-3 tracking-widest uppercase">Filter Status Kepegawaian</p>
               
               <div className="space-y-2">
                  <button 
                      onClick={() => setFilterStatusPegawai(null)}
                      className={`w-full flex justify-between items-center py-2 px-3 rounded-lg transition-all ${filterStatusPegawai === null ? 'bg-teal-50 border border-teal-200 shadow-sm' : 'hover:bg-gray-50 border border-transparent'}`}
                  >
                     <span className={`font-semibold ${filterStatusPegawai === null ? 'text-teal-800' : 'text-slate-600'}`}>Tampilkan Semua</span>
                  </button>
                  {Object.entries(statusCounts).map(([status, count]) => {
                     const isSelected = filterStatusPegawai === status;
                     return (
                       <button 
                           key={status}
                           onClick={() => setFilterStatusPegawai(status)}
                           className={`w-full flex justify-between items-center py-2 px-3 rounded-lg transition-all ${isSelected ? 'bg-teal-50 border border-teal-200 shadow-sm' : 'hover:bg-gray-50 border border-transparent'}`}
                       >
                          <span className={`font-semibold ${isSelected ? 'text-teal-800' : 'text-slate-600'}`}>{status}</span>
                          <span className="bg-slate-100 text-slate-800 font-bold px-3 py-1 rounded-lg border border-slate-200">{count}</span>
                       </button>
                     );
                  })}
               </div>
            </div>

            <div className="bg-cyan-900/20 border border-cyan-800/50 p-5 rounded-2xl flex-1 flex flex-col justify-center">
               <h3 className="text-xl font-bold text-cyan-400 mb-2">Pusat Filter Rincian Guru</h3>
               <p className="text-slate-300 text-sm leading-relaxed">
                 Gunakan panel di samping untuk menyaring (filter) daftar guru berdasarkan status kepegawaiannya (PNS, PPPK, dll).
                 Klik pada salah satu status untuk melihat nama-nama guru yang bersangkutan pada tabel di bawah ini.
               </p>
               {filterStatusPegawai && (
                  <div className="mt-4 inline-block bg-teal-900/50 border border-teal-500 text-teal-300 px-4 py-2 rounded-lg text-sm font-bold animate-pulse">
                     Tabel di bawah sedang menampilkan khusus status: {filterStatusPegawai}
                  </div>
               )}
            </div>
          </div>
        )}

        <div className="mb-8 mt-4">
          <h3 className="text-lg font-bold text-amber-400 print:text-black mb-3 border-l-4 border-amber-400 print:border-black pl-3">Daftar Kekurangan Guru</h3>
          <div className="space-y-3">
            {getSortedKekuranganMapels(viewDetailSekolah).map(m => {
              const data = viewDetailSekolah.mapel[m];
              const kurang = data.kurang; 
              const isCritical = kurang > 1;
              
              return (
                <div key={m} className={`bg-slate-900/50 print:bg-transparent p-4 rounded-lg border ${isCritical ? 'border-red-900/50 print:border-red-500' : 'border-amber-900/30 print:border-black'}`}>
                  <p className="font-bold text-slate-200 print:text-black text-lg mb-1">
                    {m} 
                    <span className={`px-2 py-0.5 rounded text-sm ml-2 print:text-black print:font-bold ${isCritical ? 'text-red-400 bg-red-900/30' : 'text-amber-400 bg-amber-900/30'}`}>
                      Kurang {kurang} Guru
                    </span>
                  </p>
                  <p className="text-sm text-slate-400 print:text-gray-800">
                    Berdasarkan data perhitungan sistem, saat ini sekolah mengalami kekurangan guru pada mata pelajaran ini.
                  </p>
                </div>
              );
            })}
            {getSortedKekuranganMapels(viewDetailSekolah).length === 0 && <p className="text-slate-500 print:text-gray-600 italic">Sekolah ini tidak mengalami kekurangan guru.</p>}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-emerald-400 print:text-black mb-3 border-l-4 border-emerald-400 print:border-black pl-3">Daftar Kelebihan Guru & Rincian Nama</h3>
          <div className="space-y-6">
            {mapelKelebihan.map(m => {
              const data = viewDetailSekolah.mapel[m];
              
              let guruList = allSurplusTeachers.filter(t => t.sekolah === viewDetailSekolah.sekolah && (t.bidangStudi === m || t.tugasMengajar === m));
              
              if (filterStatusPegawai) {
                  guruList = guruList.filter(t => (t.statusPegawai?.trim() || 'Lainnya') === filterStatusPegawai);
              }

              // 🌟 SORTING: Guru Prioritas Mutasi naik ke Atas
              guruList.sort((a, b) => {
                  const aRek = a.is_rekomendasi_internal ? 1 : 0;
                  const bRek = b.is_rekomendasi_internal ? 1 : 0;
                  return bRek - aRek;
              });

              if (filterStatusPegawai && guruList.length === 0) return null;

              return (
                <div key={m} className="bg-slate-900/50 print:bg-transparent p-4 rounded-lg border border-emerald-900/30 print:border-black overflow-x-auto print:overflow-visible relative mt-8">
                  
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 pr-0 sm:pr-40 pt-4 sm:pt-0">
                    <div>
                      <p className="font-bold text-slate-200 print:text-black text-lg mb-1">
                        {m} 
                        <span className="px-2 py-0.5 rounded text-sm ml-2 print:text-black print:bg-transparent print:border print:border-black text-emerald-400 bg-emerald-900/30">
                          Kelebihan {data.kelebihan} Guru
                        </span>
                      </p>
                      <p className="text-sm text-slate-400 print:text-gray-800">
                        Berdasarkan data perhitungan sistem pusat, sekolah ini terdeteksi mengalami kelebihan guru. Berikut daftar rinciannya:
                      </p>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-700 print:border-black mt-4">
                    <thead className="bg-slate-800 text-emerald-400 print:bg-gray-200 print:text-black text-center">
                      <tr>
                        <th className="p-2 border border-slate-700 print:border-black">No</th>
                        <th className="p-2 border border-slate-700 print:border-black min-w-40">Nama Lengkap</th>
                        <th className="p-2 border border-slate-700 print:border-black">NIP</th>
                        <th className="p-2 border border-slate-700 print:border-black bg-teal-900/30 print:bg-transparent">Status Pegawai</th>
                        <th className="p-2 border border-slate-700 print:border-black">Pangkat/Golongan</th>
                        <th className="p-2 border border-slate-700 print:border-black">Ijasah S1</th>
                        <th className="p-2 border border-slate-700 print:border-black">Bidang Studi Serdik</th>
                        <th className="p-2 border border-slate-700 print:border-black">Mengajar</th>
                        <th className="p-2 border border-slate-700 print:border-black">Tambahan</th>
                        <th className="p-2 border border-slate-700 print:border-black text-amber-300">Rincian Tambahan</th>
                        <th className="p-2 border border-slate-700 print:border-black">Total Jam</th>
                        <th className="p-2 border border-slate-700 print:border-black">Pensiun</th>
                        <th className="p-2 border border-slate-700 print:border-black min-w-32">Domisili</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guruList.map((g, index) => (
                        <tr key={g.id} className={`border-b border-slate-700/50 print:border-black hover:bg-slate-800/50 transition-colors ${g.is_rekomendasi_internal ? 'bg-amber-900/10' : ''}`}>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center align-top">{index + 1}</td>
                          
                          <td className="p-2 border-r border-slate-700 print:border-black font-medium align-top">
                              {g.nama}
                              {/* 🌟 LENCANA REKOMENDASI PRIORITAS */}
                              {g.is_rekomendasi_internal && (
                                  <span className="text-[9px] text-amber-400 font-black uppercase mt-1.5 block leading-tight border-t border-amber-900/50 pt-1.5">
                                      🌟 Prioritas Mutasi <br/>
                                      {g.alasanRekomendasi && <span className="text-[8px] text-amber-200 font-normal italic normal-case">"{g.alasanRekomendasi}"</span>}
                                  </span>
                              )}
                          </td>
                          
                          <td className="p-2 border-r border-slate-700 print:border-black text-center align-top">{g.nip}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center font-bold text-teal-300 print:text-black align-top">{g.statusPegawai}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center align-top">{g.pangkat}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center align-top">{g.ijasah}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center align-top">{g.bidangStudi}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center align-top">{g.jamMengajar}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center align-top">{g.jamTambahan}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center italic text-amber-300/80 align-top">{g.rincianTugasTambahan || '-'}</td>
                          <td className="p-2 font-bold text-emerald-200 print:text-black border-r border-slate-700 print:border-black text-center align-top">{g.totalJam}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center font-medium text-cyan-300 print:text-black align-top">{g.bulanTahunPensiun || '-'}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black align-top">{g.alamat}</td>
                        </tr>
                      ))}
                      {guruList.length === 0 && !filterStatusPegawai && <tr><td colSpan={13} className="p-4 text-center text-rose-400 print:text-black italic">Admin sekolah belum menginputkan rincian nama guru pada mata pelajaran ini.</td></tr>}
                    </tbody>
                  </table>
                </div>
              );
            })}
            {mapelKelebihan.length === 0 && <p className="text-slate-500 print:text-gray-600 italic">Sekolah ini tidak memiliki kelebihan guru.</p>}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ModalDetailSekolah;
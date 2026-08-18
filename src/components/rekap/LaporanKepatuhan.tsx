import React, { useState } from 'react';
import { TeacherData } from './DashboardStatistik';
import { ProcessedData } from './PanelAnalisis';

interface LaporanProps {
  showLaporan: boolean;
  setShowLaporan: (val: boolean) => void;
  allTeachers: TeacherData[];
  spreadsheetData?: ProcessedData[]; 
  onTeacherClick: (t: TeacherData) => void;
}

const LaporanKepatuhan: React.FC<LaporanProps> = ({ 
  showLaporan, 
  setShowLaporan, 
  allTeachers = [], 
  spreadsheetData = [], 
  onTeacherClick 
}) => {
  const [filterWilayah, setFilterWilayah] = useState<string>('SEMUA');

  if (!showLaporan) return null;

  // ENGINE PENYARING KEPATUHAN REGULASI SERTIFIKASI
  const nonCompliantTeachers = allTeachers.filter(t => {
      const jam = Number(t.totalJam) || 0;
      return (jam > 0 && jam < 24) || jam > 38;
  });

  // FILTER BERDASARKAN KABUPATEN
  const filteredTeachers = filterWilayah === 'SEMUA' 
      ? nonCompliantTeachers 
      : nonCompliantTeachers.filter(t => t.kabupaten === filterWilayah);

  // MENGHITUNG STATISTIK
  const countDefisit = filteredTeachers.filter(t => (Number(t.totalJam) || 0) < 24).length;
  const countOverload = filteredTeachers.filter(t => (Number(t.totalJam) || 0) > 38).length;

  // MESIN CERDAS: PENCARI REKOMENDASI SEKOLAH TERDEKAT
  const getRekomendasiTerdekat = (teacher: TeacherData, jam: number) => {
      if (!teacher.bidangStudi) return <span className="text-slate-500 italic">Data mapel kosong</span>;

      const needySchools = spreadsheetData.filter(d => {
          if (!d.mapel) return false;
          const butuh = d.mapel[teacher.bidangStudi]?.kurang || 0;
          return butuh > 0 && d.sekolah !== teacher.sekolah;
      });

      if (needySchools.length === 0) {
          return <span className="text-rose-400 print:text-red-600 italic text-[10px]">Belum ada instansi yang kekurangan mapel ini.</span>;
      }

      needySchools.sort((a, b) => {
          const aKecMatch = a.kecamatan === teacher.kecamatan;
          const bKecMatch = b.kecamatan === teacher.kecamatan;
          if (aKecMatch !== bKecMatch) return aKecMatch ? -1 : 1;

          const aKabMatch = a.kabupaten === teacher.kabupaten;
          const bKabMatch = b.kabupaten === teacher.kabupaten;
          if (aKabMatch !== bKabMatch) return aKabMatch ? -1 : 1;

          return 0;
      });

      const topTarget = needySchools[0];
      const isSatuKecamatan = topTarget.kecamatan && topTarget.kecamatan === teacher.kecamatan;
      const butuhBerapa = topTarget.mapel[teacher.bidangStudi].kurang;

      const actionText = jam < 24 ? "Tambah Jam ke" : "Mutasi ke";

      return (
          <div className="flex flex-col">
              <span className="font-bold text-indigo-300 print:text-blue-800">
                  {actionText}: {topTarget.sekolah}
              </span>
              <div className="flex items-center gap-1 mt-1">
                  {isSatuKecamatan ? (
                      <span className="bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-500 print:border-none print:text-green-700">🌟 SATU KECAMATAN</span>
                  ) : (
                      <span className="text-[9px] text-slate-400 print:text-gray-600">Kec. {topTarget.kecamatan || '-'}</span>
                  )}
                  <span className="text-[9px] text-amber-400 print:text-orange-600">(Butuh {butuhBerapa} Guru)</span>
              </div>
          </div>
      );
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border-2 border-rose-500 shadow-2xl mb-6 animate-fade-in-up print:bg-white print:border-none print:shadow-none print:p-0">
      
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4 print:hidden">
          <div>
              <h2 className="text-xl font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">⚠️ Laporan Kepatuhan & Penataan Jam</h2>
              <p className="text-xs text-slate-400 mt-1">Deteksi dini pendidik bermasalah jam (&lt; 24 JP atau &gt; 38 JP) beserta rekomendasi penataan terdekat.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded font-bold transition-colors shadow-lg">🖨️ CETAK LAPORAN</button>
            <button onClick={() => setShowLaporan(false)} className="text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded font-bold transition-colors">Tutup Panel</button>
          </div>
      </div>

      <div className="mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700 print:hidden">
          <label className="block text-sm font-bold text-slate-300 mb-2">Pilih Lingkup Laporan:</label>
          <select className="w-full max-w-md bg-slate-950 border border-rose-600/50 text-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-rose-400 shadow-inner" value={filterWilayah} onChange={(e) => setFilterWilayah(e.target.value)}>
              <option value="SEMUA">🌐 Semua Wilayah (Cabdin VI)</option>
              <option value="Karanganyar">Kabupaten Karanganyar</option>
              <option value="Sragen">Kabupaten Sragen</option>
              <option value="Wonogiri">Kabupaten Wonogiri</option>
          </select>
      </div>

      <div className="hidden print:block text-center mb-6">
          <h1 className="text-xl font-bold uppercase">Laporan Evaluasi Pemenuhan Beban Mengajar Pendidik</h1>
          <p className="text-sm mt-1">
              Lingkup Wilayah: <strong>{filterWilayah === 'SEMUA' ? 'Cabang Dinas Pendidikan Wilayah VI' : `Kabupaten ${filterWilayah}`}</strong>
          </p>
          <hr className="mt-4 border-2 border-black" />
      </div>

      <div className="flex flex-wrap gap-4 mb-6 print:hidden">
          <div className="bg-slate-900 border border-slate-700 px-4 py-3 rounded-lg flex-1 text-center shadow-inner">
              <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Pendidik Bermasalah</span>
              <span className="text-3xl font-black text-white">{filteredTeachers.length}</span>
          </div>
          <div className="bg-rose-950/30 border border-rose-900/50 px-4 py-3 rounded-lg flex-1 text-center shadow-inner">
              <span className="text-xs font-bold text-rose-400 uppercase block mb-1">Defisit Jam (&lt; 24 JP)</span>
              <span className="text-3xl font-black text-rose-300">{countDefisit}</span>
          </div>
          <div className="bg-amber-950/30 border border-amber-900/50 px-4 py-3 rounded-lg flex-1 text-center shadow-inner">
              <span className="text-xs font-bold text-amber-400 uppercase block mb-1">Overload (&gt; 38 JP)</span>
              <span className="text-3xl font-black text-amber-300">{countOverload}</span>
          </div>
      </div>

      {filteredTeachers.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-700 print:text-black print:border-none">
              <span className="text-4xl block mb-2">🎉</span>
              <h3 className="text-lg font-bold text-emerald-400 print:text-black">Semua Aman & Terkendali!</h3>
              <p className="text-slate-400 text-sm print:text-gray-600">Seluruh pendidik di lingkup ini telah memenuhi syarat beban mengajar ideal.</p>
          </div>
      ) : (
          <div className="overflow-x-auto rounded-lg border border-slate-700 print:border-black" style={{ scrollbarWidth: 'thin' }}>
              <table className="w-full text-left text-xs border-collapse print:text-[10px]">
                  <thead className="bg-slate-950 text-rose-400 text-center print:bg-gray-200 print:text-black">
                      <tr>
                          <th className="p-3 border border-slate-700 print:border-black w-10">No</th>
                          <th className="p-3 border border-slate-700 print:border-black min-w-40">Nama Pendidik</th>
                          <th className="p-3 border border-slate-700 print:border-black min-w-40">Asal Sekolah</th>
                          <th className="p-3 border border-slate-700 print:border-black min-w-48">Alamat Domisili</th>
                          <th className="p-3 border border-slate-700 print:border-black text-indigo-300 min-w-56">Rekomendasi Mutasi / Tambah Jam Terdekat</th>
                          <th className="p-3 border border-slate-700 print:border-black min-w-32">Keterangan</th>
                      </tr>
                  </thead>
                  <tbody>
                      {filteredTeachers.map((t, idx) => {
                          const jam = Number(t.totalJam) || 0;
                          const isDefisit = jam < 24;
                          const selisih = isDefisit ? 24 - jam : jam - 38;

                          return (
                              <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-800/50 print:border-black">
                                  <td className="p-2 border border-slate-700/50 print:border-black text-center text-slate-400 print:text-black">{idx + 1}</td>
                                  
                                  <td className="p-2 border border-slate-700/50 print:border-black cursor-pointer hover:text-amber-400" onClick={() => onTeacherClick(t)}>
                                      <strong className="text-slate-200 print:text-black block text-sm">{t.nama}</strong>
                                      <span className="text-[10px] text-cyan-400 print:text-gray-600">{t.bidangStudi} | {t.statusPegawai}</span>
                                  </td>
                                  
                                  <td className="p-2 border border-slate-700/50 print:border-black text-slate-300 print:text-black">
                                      {t.sekolah}
                                  </td>
                                  
                                  <td className="p-2 border border-slate-700/50 print:border-black text-slate-400 print:text-black italic">
                                      {t.alamat || '-'}
                                      <div className="text-[9px] text-fuchsia-300 font-bold mt-1">Kec. {t.kecamatan || 'Kosong'}</div>
                                  </td>
                                  
                                  <td className="p-2 border border-slate-700/50 print:border-black bg-slate-900/30 print:bg-transparent">
                                      {getRekomendasiTerdekat(t, jam)}
                                  </td>
                                  
                                  <td className="p-2 border border-slate-700/50 print:border-black text-center">
                                      <div className={`px-2 py-1 rounded font-bold text-[10px] inline-block ${isDefisit ? 'bg-rose-900/50 text-rose-300 border border-rose-600 print:text-red-600 print:border-none' : 'bg-amber-900/50 text-amber-300 border border-amber-600 print:text-orange-600 print:border-none'}`}>
                                          Total: {jam} JP
                                      </div>
                                      <div className="text-[9px] text-slate-400 print:text-gray-600 mt-1 font-bold">
                                          {isDefisit ? `Defisit -${selisih} JP` : `Kelebihan +${selisih} JP`}
                                      </div>
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      )}
    </div>
  );
};

export default LaporanKepatuhan;
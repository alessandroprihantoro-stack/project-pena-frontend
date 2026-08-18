import React, { useState } from 'react';
import { TeacherData } from './DashboardStatistik';

export interface ProcessedData {
  kabupaten: string;
  kecamatan: string;
  sekolah: string;
  mapel: Record<string, { kurang: number; kelebihan: number }>;
}

interface PanelProps {
  showAnalisis: boolean;
  setShowAnalisis: (val: boolean) => void;
  analisisSekolah: string;
  setAnalisisSekolah: (val: string) => void;
  listSekolah: string[];
  spreadsheetData: ProcessedData[];
  allTeachers: TeacherData[];
  onTeacherClick: (t: TeacherData) => void;
}

const getJenjang = (namaSekolah: string): string => {
  const upper = namaSekolah.toUpperCase();
  if (upper.includes('SMK')) return 'SMK';
  if (upper.includes('SLB')) return 'SLB';
  return 'SMA'; 
};

const isMapelUmum = (mapel: string): boolean => {
  const m = mapel.toUpperCase();
  const mapelUmum = [
    'AGAMA', 'PPKN', 'PKN', 'BAHASA INDONESIA', 'MATEMATIKA', 
    'SEJARAH', 'BAHASA INGGRIS', 'SENI BUDAYA', 'PENJAS', 'OLAHRAGA', 
    'FISIKA', 'KIMIA', 'BIOLOGI', 'EKONOMI', 'GEOGRAFI', 'SOSIOLOGI', 
    'ANTROPOLOGI', 'BIMBINGAN KONSELING', 'INFORMATIKA', 'TIK', 
    'BAHASA JAWA', 'BAHASA ARAB', 'BAHASA JEPANG', 'BAHASA JERMAN', 
    'BAHASA MANDARIN', 'BAHASA PERANCIS', 'PRAKARYA', 'PKWU'
  ];
  return mapelUmum.some(u => m.includes(u));
};

// FITUR ENGINE 4: Menghitung Sisa Bulan Pensiun
const getMonthsToRetire = (pensiunStr: string | undefined | null): number => {
    if (!pensiunStr || !pensiunStr.includes('-')) return 999; // Jika kosong, dianggap masih lama
    const [yyyy, mm] = pensiunStr.split('-');
    const pensiunDate = new Date(parseInt(yyyy), parseInt(mm) - 1);
    const currentDate = new Date(); // Waktu saat ini (Akan membaca tahun 2026 sesuai server BKN/Sistem)
    
    const diffMonths = (pensiunDate.getFullYear() - currentDate.getFullYear()) * 12 + (pensiunDate.getMonth() - currentDate.getMonth());
    return diffMonths;
};

// FITUR ENGINE 4: Bobot Prioritas ASN (PNS > PPPK > PPPK Paruh > Non ASN)
const getStatusWeight = (status: string | undefined): number => {
    if (!status) return 4;
    const s = status.toUpperCase();
    if (s.includes('PNS')) return 1;
    if (s === 'PPPK') return 2;
    if (s.includes('PARUH WAKTU')) return 3;
    return 4; // Non ASN
};

interface SimulationRecord {
    teacher: TeacherData;
    targetSekolah: string;
    targetMapel: string;
}

const PanelAnalisis: React.FC<PanelProps> = ({ showAnalisis, setShowAnalisis, analisisSekolah, setAnalisisSekolah, listSekolah, spreadsheetData, allTeachers, onTeacherClick }) => {
  
  const [simulations, setSimulations] = useState<SimulationRecord[]>([]);

  if (!showAnalisis) return null;
  const schoolData = spreadsheetData.find(d => d.sekolah === analisisSekolah);
  const targetJenjang = analisisSekolah ? getJenjang(analisisSekolah) : '';

  const handleAddSimulation = (e: React.MouseEvent, teacher: TeacherData, mapel: string) => {
      e.stopPropagation(); 
      setSimulations(prev => [...prev, { teacher, targetSekolah: analisisSekolah, targetMapel: mapel }]);
  };

  const handleRemoveSimulation = (e: React.MouseEvent, teacherId: string | number) => {
      e.stopPropagation();
      setSimulations(prev => prev.filter(s => s.teacher.id !== teacherId));
  };

  const simulatedTeacherIds = simulations.map(s => s.teacher.id);

  return (
    <div className="bg-slate-800 p-6 rounded-xl border-2 border-amber-500 shadow-2xl mb-6 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
          <div>
              <h2 className="text-xl font-black text-amber-400 uppercase tracking-widest flex items-center gap-2">💡 Analisis Kebutuhan & Simulasi Mutasi</h2>
              <p className="text-xs text-slate-400 mt-1">Geo-Mapping, Lintas Jenjang, & Prioritas Skoring (ASN + Usia)</p>
          </div>
          <div className="flex gap-3">
              {simulations.length > 0 && (
                  <button onClick={() => setSimulations([])} className="text-xs bg-rose-900/50 border border-rose-500 text-rose-200 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded font-bold transition-colors shadow-lg">
                      🗑️ RESET SIMULASI ({simulations.length})
                  </button>
              )}
              <button onClick={() => setShowAnalisis(false)} className="text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded font-bold transition-colors">Tutup Panel</button>
          </div>
      </div>

      <div className="mb-6">
          <label className="block text-sm font-bold text-slate-300 mb-2">Pilih Sekolah yang Ingin Dianalisis:</label>
          <select className="w-full max-w-md bg-slate-900 border border-amber-600/50 text-slate-200 rounded-lg px-4 py-2 text-sm outline-none shadow-inner" value={analisisSekolah} onChange={(e) => setAnalisisSekolah(e.target.value)}>
              <option value="">-- Pilih Sekolah --</option>
              {listSekolah.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
      </div>

      {analisisSekolah && schoolData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* === KOLOM 1: DAFTAR KEKURANGAN === */}
              <div className="bg-slate-900/50 p-5 rounded-xl border border-rose-900/30">
                  <div className="mb-4 border-b border-rose-900/50 pb-2 flex justify-between items-end">
                      <h3 className="text-rose-400 font-bold text-lg flex items-center gap-2">🔻 Daftar Kekurangan Guru</h3>
                      <div className="flex flex-col items-end gap-1">
                         <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest border border-cyan-700 bg-cyan-900/30 px-2 py-0.5 rounded">JENJANG {targetJenjang}</span>
                         <span className="text-xs text-indigo-300 font-bold bg-indigo-900/30 px-2 py-1 rounded">📍 Target: Kec. {schoolData.kecamatan}</span>
                      </div>
                  </div>
                  {Object.entries(schoolData.mapel).filter((entry) => entry[1].kurang > 0).length === 0 ? (
                      <p className="text-slate-500 italic text-sm">Tidak ada kekurangan guru di sekolah ini.</p>
                  ) : (
                      Object.entries(schoolData.mapel).filter((entry) => entry[1].kurang > 0).map(([mapel, data]) => {
                          
                          const mapelIsUmum = isMapelUmum(mapel);
                          
                          const currentSimulations = simulations.filter(s => s.targetSekolah === analisisSekolah && s.targetMapel === mapel);
                          const sisaKurang = data.kurang - currentSimulations.length;

                          const effectiveSurplusSchools = spreadsheetData.filter(d => {
                              if (d.sekolah === analisisSekolah) return false;
                              const originalSurplus = d.mapel[mapel]?.kelebihan || 0;
                              const simulatedAwayFromD = simulations.filter(s => s.teacher.sekolah === d.sekolah && s.teacher.bidangStudi === mapel).length;
                              return (originalSurplus - simulatedAwayFromD) > 0;
                          }).map(d => d.sekolah);

                          const recommendedTeachers = allTeachers.filter(t => {
                              if (t.bidangStudi !== mapel) return false;
                              if (!effectiveSurplusSchools.includes(t.sekolah || '')) return false;
                              if (simulatedTeacherIds.includes(t.id)) return false; 

                              // LOGIKA ENGINE 2: LINTAS JENJANG
                              const guruJenjang = getJenjang(t.sekolah || '');
                              if (!mapelIsUmum && guruJenjang !== targetJenjang) return false;

                              // LOGIKA ENGINE 4: FILTER MASA PENSIUN (SEMBUNYIKAN JIKA SISA <= 12 BULAN / 1 TAHUN)
                              const monthsLeft = getMonthsToRetire(t.bulanTahunPensiun);
                              if (monthsLeft <= 12) return false; // Ditolak dari daftar rekomendasi mutasi

                              return true;
                          }).sort((a, b) => {
                              // LOGIKA ENGINE 1: PRIORITAS KECAMATAN TERDEKAT
                              const aMatch = a.kecamatan === schoolData.kecamatan;
                              const bMatch = b.kecamatan === schoolData.kecamatan;
                              if (aMatch !== bMatch) return aMatch ? -1 : 1;

                              // LOGIKA ENGINE 4: PRIORITAS STATUS ASN
                              const weightA = getStatusWeight(a.statusPegawai);
                              const weightB = getStatusWeight(b.statusPegawai);
                              return weightA - weightB;
                          });

                          return (
                              <div key={mapel} className="mb-4 bg-slate-800 rounded-lg p-4 border-l-4 border-rose-500 shadow-md">
                                  <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                                      <span className="font-bold text-slate-200 text-sm">
                                          {mapel} 
                                          {!mapelIsUmum && <span className="ml-2 text-[8px] bg-red-900/50 text-red-300 px-1 py-0.5 rounded border border-red-700" title="Mapel Kejuruan/Khusus (Tidak bisa lintas jenjang)">🔒 KHUSUS {targetJenjang}</span>}
                                      </span>
                                      
                                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${sisaKurang <= 0 ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-500' : 'bg-rose-900/50 text-rose-300'}`}>
                                          Kurang {data.kurang} {currentSimulations.length > 0 && ` ➡️ SISA: ${sisaKurang}`}
                                      </span>
                                  </div>

                                  {currentSimulations.length > 0 && (
                                      <div className="bg-indigo-900/40 p-3 rounded mb-3 border border-indigo-500/50 shadow-inner">
                                          <p className="text-[10px] text-indigo-300 font-bold uppercase mb-2">🔄 Draft Simulasi Mutasi (Pemenuhan):</p>
                                          <ul className="space-y-2">
                                              {currentSimulations.map(sim => (
                                                  <li key={sim.teacher.id} className="text-xs bg-slate-900/80 p-2 rounded flex justify-between items-center border border-indigo-500/30">
                                                      <span>
                                                          <strong className="text-amber-300">{sim.teacher.nama}</strong><br/>
                                                          <span className="text-[9px] text-slate-400">Ditarik dari: {sim.teacher.sekolah}</span>
                                                      </span>
                                                      <button onClick={(e) => handleRemoveSimulation(e, sim.teacher.id)} className="bg-rose-600/80 hover:bg-rose-500 text-white text-[9px] px-2 py-1 rounded font-bold shadow-sm">❌ BATAL</button>
                                                  </li>
                                              ))}
                                          </ul>
                                      </div>
                                  )}

                                  <div className="bg-slate-900 p-3 rounded mt-2 relative">
                                      <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] text-emerald-400 font-bold uppercase">Rekomendasi Kandidat Lintas Instansi:</p>
                                        <span className="text-[8px] text-slate-500 italic">*Pensiun &lt; 1 thn disembunyikan</span>
                                      </div>
                                      {recommendedTeachers.length > 0 ? (
                                          <ul className="space-y-2">
                                              {recommendedTeachers.map(t => {
                                                  const isMatchKecamatan = t.kecamatan && schoolData.kecamatan && t.kecamatan === schoolData.kecamatan;
                                                  const guruJenjang = getJenjang(t.sekolah || '');
                                                  const isLintasJenjang = guruJenjang !== targetJenjang;
                                                  const isASN = t.statusPegawai && (t.statusPegawai.includes('PNS') || t.statusPegawai.includes('PPPK'));

                                                  return (
                                                  <li key={t.id} onClick={() => onTeacherClick(t)} className={`text-xs flex justify-between items-center border-b border-slate-700/50 pb-2 pt-2 cursor-pointer hover:bg-slate-700/50 px-2 rounded transition-colors group ${isMatchKecamatan ? 'bg-indigo-900/20 border-l-2 border-l-indigo-400' : ''}`}>
                                                      <div className="flex-1">
                                                        <strong className="text-white group-hover:text-amber-300 text-sm">
                                                          {t.nama || '-'} 
                                                          {isASN && <span className="ml-1.5 bg-blue-900/50 text-blue-300 px-1 py-0.5 rounded text-[8px] border border-blue-500">🛡️ {t.statusPegawai}</span>}
                                                        </strong> <br/>
                                                        <span className="text-[10px] text-cyan-400">{t.sekolah} (Total: {t.totalJam} Jam)</span>
                                                        
                                                        <div className="mt-1 flex flex-wrap gap-1">
                                                            {isMatchKecamatan ? (
                                                              <span className="bg-emerald-600/20 border border-emerald-500 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">🌟 SATU KECAMATAN</span>
                                                            ) : (
                                                              <span className="bg-slate-800 border border-slate-600 text-slate-300 px-1.5 py-0.5 rounded text-[9px] uppercase">📍 Kec. {t.kecamatan || 'Belum Diisi'}</span>
                                                            )}
                                                            {isLintasJenjang && (
                                                              <span className="bg-fuchsia-900/50 border border-fuchsia-500/50 text-fuchsia-300 px-1.5 py-0.5 rounded text-[9px] uppercase font-bold">🔄 LINTAS: {guruJenjang} ➡️ {targetJenjang}</span>
                                                            )}
                                                        </div>
                                                      </div>

                                                      <div className="ml-2 pl-2 border-l border-slate-700/50 flex flex-col justify-center">
                                                          <button 
                                                            onClick={(e) => handleAddSimulation(e, t, mapel)} 
                                                            disabled={sisaKurang <= 0}
                                                            className={`text-[9px] px-3 py-1.5 rounded font-black tracking-wider transition-all shadow-md ${sisaKurang <= 0 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-500 hover:scale-105'}`}
                                                          >
                                                              + TARIK
                                                          </button>
                                                      </div>
                                                  </li>
                                                  );
                                              })}
                                          </ul>
                                      ) : ( <p className="text-xs text-slate-500 italic">Belum ada kandidat tersisa untuk ditarik.</p> )}
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>

              {/* === KOLOM 2: DAFTAR KELEBIHAN === */}
              <div className="bg-slate-900/50 p-5 rounded-xl border border-emerald-900/30">
                  <h3 className="text-emerald-400 font-bold text-lg mb-4 flex items-center gap-2 border-b border-emerald-900/50 pb-2">🔺 Daftar Kelebihan Guru</h3>
                  {Object.entries(schoolData.mapel).filter((entry) => entry[1].kelebihan > 0).length === 0 ? (
                      <p className="text-slate-500 italic text-sm">Tidak ada kelebihan guru di sekolah ini.</p>
                  ) : (
                      Object.entries(schoolData.mapel).filter((entry) => entry[1].kelebihan > 0).map(([mapel, data]) => {
                          
                          const simulatedAway = simulations.filter(s => s.teacher.sekolah === analisisSekolah && s.teacher.bidangStudi === mapel);
                          const sisaLebih = data.kelebihan - simulatedAway.length;

                          // Urutkan guru internal berdasarkan status ASN juga
                          const internalTeachers = allTeachers.filter(t => t.sekolah === analisisSekolah && t.bidangStudi === mapel)
                                                              .filter(t => !simulatedTeacherIds.includes(t.id))
                                                              .sort((a,b) => getStatusWeight(a.statusPegawai) - getStatusWeight(b.statusPegawai));

                          return (
                              <div key={mapel} className="mb-4 bg-slate-800 rounded-lg p-4 border-l-4 border-emerald-500 shadow-md">
                                  <div className="flex justify-between items-center mb-2 border-b border-slate-700 pb-2">
                                      <span className="font-bold text-slate-200">{mapel}</span>
                                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${sisaLebih <= 0 ? 'bg-slate-700 text-slate-400' : 'bg-emerald-900/50 text-emerald-300'}`}>
                                          Lebih {data.kelebihan} {simulatedAway.length > 0 && ` ➡️ SISA: ${sisaLebih}`}
                                      </span>
                                  </div>

                                  {simulatedAway.length > 0 && (
                                      <div className="bg-rose-900/30 p-3 rounded mb-3 border border-rose-500/30">
                                          <p className="text-[10px] text-rose-300 font-bold uppercase mb-2">🚀 Sedang Ditarik ke Sekolah Lain:</p>
                                          <ul className="space-y-1">
                                              {simulatedAway.map(sim => (
                                                  <li key={sim.teacher.id} className="text-[10px] text-slate-300 flex justify-between border-b border-rose-900/50 pb-1">
                                                      <span>{sim.teacher.nama}</span>
                                                      <span className="font-bold text-rose-200">➡️ {sim.targetSekolah}</span>
                                                  </li>
                                              ))}
                                          </ul>
                                      </div>
                                  )}

                                  <div className="bg-slate-900 p-3 rounded mt-2">
                                      <p className="text-[10px] text-amber-400 font-bold uppercase mb-2">Daftar Pendidik Tersedia (Internal):</p>
                                      {internalTeachers.length > 0 ? (
                                          <ul className="space-y-2">
                                              {internalTeachers.map(t => {
                                                  // Peringatan jika guru ini akan segera pensiun
                                                  const isRetiringSoon = getMonthsToRetire(t.bulanTahunPensiun) <= 12;

                                                  return (
                                                  <li key={t.id} onClick={() => onTeacherClick(t)} className="text-xs text-slate-300 flex justify-between items-center border-b border-slate-700/50 pb-2 pt-1 cursor-pointer hover:bg-slate-700/50 px-2 rounded transition-colors group">
                                                      <span>
                                                        <strong className={`text-sm ${isRetiringSoon ? 'text-rose-300' : 'text-white'} group-hover:text-amber-300`}>
                                                            {t.nama || '-'}
                                                        </strong> <br/>
                                                        <span className="text-[10px] text-slate-400">Status: {t.statusPegawai}</span>
                                                        <span className="ml-2 bg-slate-800 border border-slate-600 text-slate-300 px-1.5 py-0.5 rounded text-[9px] uppercase shadow-sm">📍 Kec. {t.kecamatan || 'Belum Diisi'}</span>
                                                        
                                                        {isRetiringSoon && (
                                                            <div className="mt-1">
                                                                <span className="bg-rose-900/80 text-rose-200 px-1.5 py-0.5 rounded text-[8px] font-bold border border-rose-500 shadow-sm">⚠️ MASA PENSIUN ≤ 1 TAHUN</span>
                                                            </div>
                                                        )}
                                                      </span>
                                                      <span className="bg-slate-700 px-2 py-1 rounded text-[10px] font-bold group-hover:bg-slate-600 text-slate-200">Total: {t.totalJam} Jam</span>
                                                  </li>
                                                  );
                                              })}
                                          </ul>
                                      ) : ( <p className="text-[10px] text-rose-400 italic">Semua data guru sudah terdistribusi atau belum diinputkan.</p> )}
                                  </div>
                              </div>
                          );
                      })
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default PanelAnalisis;
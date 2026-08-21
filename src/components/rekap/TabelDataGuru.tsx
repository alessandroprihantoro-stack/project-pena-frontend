import React, { useState } from 'react';
import { TeacherData } from './DashboardStatistik';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

// 🌟 REVISI: Tambahkan alasanRekomendasi pada interface
export interface ExtendedTeacherData extends TeacherData {
    is_rekomendasi_internal?: boolean;
    alasanRekomendasi?: string;
}

interface MasterSekolah {
  npsn: string;
  nama_sekolah: string;
  jenjang: string; 
}

interface ProcessedData {
    kabupaten: string;
    kecamatan: string;
    sekolah: string;
    mapel: Record<string, { kurang: number; kelebihan: number }>;
}

interface TabelProps {
  filteredTeachers: ExtendedTeacherData[];
  masterSekolahList: MasterSekolah[]; 
  spreadsheetData: ProcessedData[]; 
  onTeacherClick: (t: TeacherData) => void;
  onDeleteTeacher: (id: string | number, nama: string) => void;
  onToggleRekomendasi?: (id: string | number, currentStatus: boolean, nama: string) => void;
  onExportPDF: () => void;
}

const calculateBKEkuivalen = (inputVal: number): { ekuivalen: number, tipe: string } => {
    if (inputVal === 0) return { ekuivalen: 0, tipe: "Rombel" };
    if (inputVal <= 50) {
        if (inputVal >= 5) {
            return { ekuivalen: 24 + ((inputVal - 5) * 2), tipe: "Rombel" }; 
        } else {
            return { ekuivalen: Math.round((inputVal / 5) * 24), tipe: "Rombel" }; 
        }
    } else {
        if (inputVal >= 150) {
            const surplusSiswa = inputVal > 160 ? inputVal - 160 : 0;
            const surplusRombel = Math.floor(surplusSiswa / 32); 
            return { ekuivalen: 24 + (surplusRombel * 2), tipe: "Siswa" };
        } else {
            return { ekuivalen: Math.round((inputVal / 160) * 24), tipe: "Siswa" };
        }
    }
};

const TabelDataGuru: React.FC<TabelProps> = ({ 
    filteredTeachers, masterSekolahList, spreadsheetData, onTeacherClick, onDeleteTeacher, onExportPDF 
}) => {
  const { profile } = useAuth();
  
  const userRole = String(profile?.role).toLowerCase();
  const isAdminOrCabdin = userRole === 'super_admin' || userRole === 'cabdin';

  const [mutasiState, setMutasiState] = useState<{ 
      isOpen: boolean; teacher: ExtendedTeacherData | null; targetNpsn: string; isMutasiLoading: boolean; 
  }>({ isOpen: false, teacher: null, targetNpsn: '', isMutasiLoading: false });
  
  const [radarState, setRadarState] = useState<{ 
      isOpen: boolean; teacher: ExtendedTeacherData | null; recommendations: {sekolah: string, kecamatan: string, defisit: number}[]; 
  }>({ isOpen: false, teacher: null, recommendations: [] });

  const handleMutasiCepat = async () => {
      const { teacher, targetNpsn } = mutasiState;
      if (!teacher || !targetNpsn) return;
      
      const targetSchool = masterSekolahList.find(s => s.npsn === targetNpsn);
      if (!targetSchool) return;

      const confirm = window.confirm(`🚀 KONFIRMASI MUTASI 🚀\n\nPindahkan ${teacher.nama}\nDari: ${teacher.sekolah}\nKe: ${targetSchool.nama_sekolah}\n\nLanjutkan mutasi permanen ini?`);
      if (!confirm) return;

      setMutasiState(prev => ({ ...prev, isMutasiLoading: true }));
      try {
          const { error } = await supabase
            .from('guru_kelebihan')
            .update({ npsn: targetSchool.npsn, sekolah: targetSchool.nama_sekolah })
            .eq('id', teacher.id); 
            
          if (error) throw error;
          
          alert(`✅ BERHASIL: Data ${teacher.nama} resmi dipindahkan ke ${targetSchool.nama_sekolah}!`);
          window.location.reload(); 
      } catch (err: unknown) { 
          if (err instanceof Error) {
              alert("❌ Gagal memutasi guru: " + err.message);
          }
      } finally { 
          setMutasiState(prev => ({ ...prev, isMutasiLoading: false, isOpen: false })); 
      }
  };

  const handleOpenRadar = (t: ExtendedTeacherData) => {
      const mapelTarget = t.bidangStudi;
      const kecTarget = t.kecamatan;
      if (!mapelTarget) { 
          alert("Bidang studi guru belum diisi secara valid!"); 
          return; 
      }

      const recs = spreadsheetData.filter(d => {
          if (d.kecamatan !== kecTarget || d.sekolah === t.sekolah) return false;
          const mapelData = d.mapel[mapelTarget];
          if (!mapelData) return false;
          
          const defisitBersih = mapelData.kurang - mapelData.kelebihan;
          return defisitBersih > 0;
      }).map(d => ({
          sekolah: d.sekolah, 
          kecamatan: d.kecamatan, 
          defisit: d.mapel[mapelTarget].kurang - d.mapel[mapelTarget].kelebihan
      })).sort((a,b) => b.defisit - a.defisit);

      setRadarState({ isOpen: true, teacher: t, recommendations: recs });
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl overflow-hidden print:bg-white print:p-0 print:border-none print:shadow-none print:overflow-visible relative">
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Tabel Data Pendidik ({filteredTeachers.length} Guru)</h2>
        <button onClick={onExportPDF} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg">📄 Cetak Data PDF</button>
      </div>

      <div className="overflow-x-auto print:overflow-visible rounded-lg border border-slate-700 print:border-black max-h-150 print:max-h-none" style={{ scrollbarWidth: 'thin' }}>
        <table className="w-full text-left text-xs border-collapse print:text-black relative print:w-full">
          <thead className="bg-slate-900 text-cyan-400 print:bg-gray-200 print:text-black text-center sticky top-0 print:static z-10 shadow-md print:shadow-none">
            <tr>
              <th className="p-3 border border-slate-700 print:border-black whitespace-nowrap">No</th>
              <th className="p-3 border border-slate-700 print:border-black min-w-40">Nama Lengkap</th>
              <th className="p-3 border border-slate-700 print:border-black min-w-32">Sekolah Asal</th>
              <th className="p-3 border border-slate-700 print:border-black">Status Pegawai</th>
              <th className="p-3 border border-slate-700 print:border-black min-w-32">Bidang Studi</th>
              <th className="p-3 border border-slate-700 print:border-black text-amber-400">Jam Mengajar</th>
              <th className="p-3 border border-slate-700 print:border-black text-fuchsia-400">Tugas Tambahan</th>
              <th className="p-3 border border-slate-700 print:border-black text-emerald-400">Total Jam</th>
              <th className="p-3 border border-slate-700 print:border-black text-amber-400">Tahun Pensiun</th>
              <th className="p-3 border border-slate-700 print:border-black print:hidden">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length === 0 ? (
                <tr><td colSpan={10} className="p-8 text-center text-slate-500 italic text-sm">Tidak ada data guru yang cocok dengan filter.</td></tr>
            ) : (
                filteredTeachers.map((t, idx) => {
                  let displayPensiun = t.bulanTahunPensiun || '-';
                  if(t.bulanTahunPensiun && t.bulanTahunPensiun.includes('-')) {
                      const [yyyy, mm] = t.bulanTahunPensiun.split('-');
                      displayPensiun = new Date(parseInt(yyyy), parseInt(mm) - 1).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                  }

                  const isBK = t.bidangStudi?.toUpperCase().includes('KONSELING') || t.bidangStudi?.toUpperCase().includes('BIMBINGAN') || t.bidangStudi?.toUpperCase() === 'BK' || t.bidangStudi?.toUpperCase() === 'BP/BK';
                  const jamMengajarRaw = Number(t.jamMengajar) || 0;
                  const jamTambahan = Number(t.jamTambahan) || 0;
                  
                  let ekuivalenMengajar = jamMengajarRaw;
                  let tipeInputBK = "";
                  
                  if (isBK && jamMengajarRaw > 0) {
                      const hasilBK = calculateBKEkuivalen(jamMengajarRaw);
                      ekuivalenMengajar = hasilBK.ekuivalen;
                      tipeInputBK = hasilBK.tipe;
                  }

                  const totalJamFinal = ekuivalenMengajar + jamTambahan;
                  
                  let jamClass = "text-emerald-400 font-black print:text-black";
                  let badgeClass = "";
                  let jamLabel = isBK ? "Beban Ekuivalensi BK Aman" : "Beban Mengajar Aman";
                  
                  if (totalJamFinal > 0 && totalJamFinal < 24) {
                      jamClass = "text-rose-300 font-black print:text-black";
                      badgeClass = "bg-rose-900/40 border border-rose-500 px-2 py-0.5 rounded shadow-sm print:bg-transparent print:border-none";
                      jamLabel = `⚠️ Bahaya: Total Jam < 24 JP`;
                  } else if (totalJamFinal > 38) {
                      jamClass = "text-amber-300 font-black print:text-black";
                      badgeClass = "bg-amber-900/40 border border-amber-500 px-2 py-0.5 rounded shadow-sm print:bg-transparent print:border-none";
                      jamLabel = "⚠️ Peringatan: Beban Mengajar Berlebih (> 38 JP)";
                  }

                  return (
                  <tr key={t.id} className={`border-b transition-colors print:border-black ${t.is_rekomendasi_internal ? 'bg-amber-900/20 border-amber-700/50' : 'border-slate-700/50 hover:bg-slate-700/50'}`} style={{ pageBreakInside: 'avoid' }}>
                    <td className="p-2 border-r border-slate-700/50 print:border-black text-center text-slate-400 print:text-black align-top">{idx + 1}</td>
                    
                    <td className="p-2 border-r border-slate-700/50 print:border-black cursor-pointer hover:bg-slate-800 align-top" onClick={() => onTeacherClick(t)} title="Klik untuk melihat detail profil">
                        <strong className="text-white print:text-black hover:text-amber-400 block">{t.nama}</strong>
                        <span className="text-[10px] text-slate-400">NIP: {t.nip || '-'}</span>
                        
                        {/* 🌟 LENCANA REKOMENDASI TERINTEGRASI */}
                        {t.is_rekomendasi_internal && (
                            <span className="text-[9px] text-amber-400 font-black uppercase mt-1.5 block leading-tight border-t border-amber-900/50 pt-1.5 print:border-none print:text-orange-600">
                                🌟 Prioritas Mutasi <br/>
                                {t.alasanRekomendasi && <span className="text-[8px] text-amber-200 font-normal italic normal-case print:text-gray-600">"{t.alasanRekomendasi}"</span>}
                            </span>
                        )}
                    </td>
                    
                    <td className="p-2 border-r border-slate-700/50 print:border-black text-cyan-300 print:text-black font-medium align-top">{t.sekolah}</td>
                    <td className="p-2 border-r border-slate-700/50 print:border-black text-center font-bold text-emerald-300 print:text-black align-top">{t.statusPegawai}</td>
                    <td className="p-2 border-r border-slate-700/50 print:border-black text-amber-100 print:text-black align-top">{t.bidangStudi}</td>
                    
                    <td className="p-2 border-r border-slate-700/50 print:border-black text-center align-top">
                        {isBK ? (
                            <div className="flex flex-col items-center" title="Sistem ekuivalensi Guru BK Aktif">
                                <span className="font-bold text-sky-300 text-sm">{jamMengajarRaw} {tipeInputBK}</span>
                                <span className="text-[9px] bg-sky-900/50 text-sky-200 border border-sky-600 px-1 py-0.5 rounded mt-1 shadow-sm">Ekuivalen: {ekuivalenMengajar} JP</span>
                            </div>
                        ) : (<span className="font-bold text-white text-sm">{jamMengajarRaw} JP</span>)}
                    </td>
                    
                    <td className="p-2 border-r border-slate-700/50 print:border-black text-center align-top">
                        {jamTambahan > 0 ? (
                           <div className="flex flex-col items-center">
                               <span className="font-bold text-fuchsia-300 text-sm">{jamTambahan} JP</span>
                               <span className="text-[9px] text-slate-400 italic">({t.rincianTugasTambahan || 'Tugas Lain'})</span>
                           </div>
                        ) : (<span className="text-slate-600">-</span>)}
                    </td>
                    
                    <td className="p-2 border-r border-slate-700/50 print:border-black text-center text-sm bg-slate-900/50 align-top" title={jamLabel}>
                        <span className={badgeClass ? `${badgeClass} ${jamClass}` : jamClass}>{totalJamFinal}</span>
                    </td>

                    <td className="p-2 border-r border-slate-700/50 print:border-black text-center font-bold text-amber-300 print:text-black align-top">{displayPensiun}</td>
                    
                    <td className="p-2 text-center print:hidden flex flex-col gap-1.5 items-center justify-center align-top">
                        <button onClick={() => onDeleteTeacher(t.id, t.nama)} className="bg-rose-900/50 hover:bg-rose-600 text-rose-300 hover:text-white px-2 py-1 rounded text-[10px] font-bold transition-colors w-24">Hapus</button>
                        
                        {isAdminOrCabdin && (
                            <button onClick={() => setMutasiState({ isOpen: true, teacher: t, targetNpsn: '', isMutasiLoading: false })} className="bg-indigo-900/50 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-600/50 px-2 py-1 rounded text-[10px] font-bold transition-colors shadow-sm w-24" title="Mutasi Pindah Sekolah">🔄 Mutasi</button>
                        )}

                        {totalJamFinal < 24 && (
                            <button onClick={() => handleOpenRadar(t)} className="bg-sky-900/50 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-600/50 px-2 py-1 rounded text-[10px] font-bold transition-colors shadow-sm w-24" title="Cari Sekolah Kekurangan Guru">📡 Radar</button>
                        )}
                    </td>
                  </tr>
                  )
                })
            )}
          </tbody>
        </table>
      </div>

      {/* 🌟 MODAL MUTASI */}
      {mutasiState.isOpen && mutasiState.teacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-slate-900 border border-indigo-500/50 rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(79,70,229,0.3)] overflow-hidden animate-scale-in flex flex-col max-h-[90vh]">
              <div className="p-5 border-b bg-indigo-950/40 border-indigo-800/50">
                  <h3 className="text-xl font-black text-white tracking-wider flex items-center gap-2">🔄 Mutasi Instansi Pendidik</h3>
              </div>
              <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
                 <div className="bg-slate-950 border border-slate-700 p-4 rounded-lg">
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Identitas Pendidik:</span>
                     <strong className="text-lg text-white block">{mutasiState.teacher.nama}</strong>
                     <span className="text-xs text-amber-300">{mutasiState.teacher.bidangStudi} | {mutasiState.teacher.statusPegawai}</span>
                     
                     {/* 🌟 LENCANA REKOMENDASI TERINTEGRASI DI MODAL MUTASI */}
                     {mutasiState.teacher.is_rekomendasi_internal && (
                        <span className="text-[9px] text-amber-400 font-black uppercase mt-1.5 block leading-tight border-t border-amber-900/50 pt-1.5">
                            🌟 Prioritas Mutasi <br/>
                            {mutasiState.teacher.alasanRekomendasi && <span className="text-[8px] text-amber-200 font-normal italic normal-case">"{mutasiState.teacher.alasanRekomendasi}"</span>}
                        </span>
                     )}
                 </div>
                 <div className="bg-rose-950/30 border border-rose-900/50 p-4 rounded-lg">
                     <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest block mb-1">Dari Instansi Asal:</span>
                     <strong className="text-rose-200">{mutasiState.teacher.sekolah}</strong>
                 </div>
                 <div className="bg-emerald-950/30 border border-emerald-900/50 p-4 rounded-lg relative overflow-visible">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block mb-2">Pilih Instansi Tujuan:</span>
                    <select className="w-full bg-slate-900 border border-emerald-500/50 text-white rounded-lg px-4 py-2.5 outline-none focus:border-emerald-400 shadow-sm" value={mutasiState.targetNpsn} onChange={(e) => setMutasiState(prev => ({ ...prev, targetNpsn: e.target.value }))}>
                       <option value="">-- Cari dan Pilih Sekolah Tujuan Mutasi --</option>
                       {masterSekolahList.map(s => ( 
                           s.nama_sekolah.toUpperCase() !== mutasiState.teacher?.sekolah?.toUpperCase() && ( 
                               <option key={s.npsn} value={s.npsn}>[{s.jenjang || 'Sekolah'}] {s.nama_sekolah}</option> 
                           ) 
                       ))}
                    </select>
                 </div>
              </div>
              <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3 shrink-0">
                 <button onClick={() => setMutasiState({ ...mutasiState, isOpen: false })} disabled={mutasiState.isMutasiLoading} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-sm font-bold transition-colors">Batal</button>
                 <button onClick={handleMutasiCepat} disabled={!mutasiState.targetNpsn || mutasiState.isMutasiLoading} className={`px-6 py-2.5 rounded-lg text-sm font-black transition-colors flex items-center gap-2 ${(!mutasiState.targetNpsn || mutasiState.isMutasiLoading) ? 'bg-indigo-900 text-indigo-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50'}`}>
                    {mutasiState.isMutasiLoading ? '⏳ Memproses Mutasi...' : '✅ Eksekusi Mutasi'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* 🌟 MODAL RADAR */}
      {radarState.isOpen && radarState.teacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-slate-900 border border-sky-500/50 rounded-2xl w-full max-w-2xl shadow-[0_0_40px_rgba(14,165,233,0.3)] overflow-hidden animate-scale-in flex flex-col max-h-[85vh]">
              <div className="p-5 border-b bg-sky-950/40 border-sky-800/50 flex justify-between items-center shrink-0">
                  <h3 className="text-xl font-black text-white tracking-wider flex items-center gap-2">📡 Radar Pemenuhan Jam BKO</h3>
                  <button onClick={() => setRadarState({...radarState, isOpen: false})} className="text-slate-400 hover:text-white font-bold text-xl">&times;</button>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar">
                  <div className="bg-slate-950 border border-slate-700 p-4 rounded-lg mb-5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Guru Kurang Jam:</span>
                      <strong className="text-lg text-rose-300 block">{radarState.teacher.nama}</strong>
                      <span className="text-xs text-slate-300">Mapel: {radarState.teacher.bidangStudi} | Total Jam saat ini: <b className="text-rose-400">{Number(radarState.teacher.jamMengajar || 0) + Number(radarState.teacher.jamTambahan || 0)} JP</b></span><br/>
                      <span className="text-xs text-sky-300">Kecamatan: {radarState.teacher.kecamatan}</span>
                      
                      {/* 🌟 LENCANA REKOMENDASI TERINTEGRASI DI MODAL RADAR */}
                      {radarState.teacher.is_rekomendasi_internal && (
                          <span className="text-[9px] text-amber-400 font-black uppercase mt-1.5 block leading-tight border-t border-amber-900/50 pt-1.5">
                              🌟 Prioritas Mutasi <br/>
                              {radarState.teacher.alasanRekomendasi && <span className="text-[8px] text-amber-200 font-normal italic normal-case">"{radarState.teacher.alasanRekomendasi}"</span>}
                          </span>
                      )}
                  </div>
                  
                  <h4 className="text-sm font-bold text-sky-400 uppercase mb-3">Rekomendasi Sekolah Terdekat</h4>
                  
                  {radarState.recommendations.length === 0 ? ( 
                      <div className="text-center p-6 border border-dashed border-slate-700 rounded-lg text-slate-500 italic">
                          Tidak ditemukan sekolah defisit di kecamatan <b className="text-slate-400">{radarState.teacher.kecamatan}</b>.
                      </div> 
                  ) : (
                      <div className="space-y-3">
                          {radarState.recommendations.map((rec, idx) => ( 
                              <div key={idx} className="bg-sky-950/20 border border-sky-900/50 p-4 rounded-lg flex justify-between items-center hover:bg-sky-900/40 transition-colors">
                                  <div>
                                      <h5 className="font-bold text-sky-200">{rec.sekolah}</h5>
                                      <span className="text-xs text-slate-400">Kec. {rec.kecamatan}</span>
                                  </div>
                                  <div className="bg-sky-900 border border-sky-500 px-4 py-2 rounded-lg text-center shadow-lg">
                                      <span className="block text-[10px] text-sky-300 font-bold uppercase">Butuh Tambahan</span>
                                      <span className="text-lg font-black text-white">{rec.defisit} Guru</span>
                                  </div>
                              </div> 
                          ))}
                      </div>
                  )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TabelDataGuru;
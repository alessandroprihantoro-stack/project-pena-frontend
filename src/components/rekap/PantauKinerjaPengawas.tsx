import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { TeacherData } from './DashboardStatistik';

// Gunakan interface yang sama
interface MasterSekolah {
  npsn: string;
  nama_sekolah: string;
  jenjang: string;
  total_rombel?: number;
  jumlah_guru?: number;
}

interface KurikulumItem {
  sekolah: string;
  npsn?: string;
  mapel: string;
  rombel: number;
}

interface KinerjaProps {
  showKinerja: boolean;
  setShowKinerja: (val: boolean) => void;
  masterSekolahList: MasterSekolah[];
  allKurikulum: KurikulumItem[];
  allTeachers: TeacherData[];
}

interface PengawasProfile {
  id: string;
  nama_lengkap: string;
  sekolah_binaan: string[]; // Array of NPSN
}

const PantauKinerjaPengawas: React.FC<KinerjaProps> = ({ 
  showKinerja, setShowKinerja, masterSekolahList, allKurikulum, allTeachers 
}) => {
  const [listPengawas, setListPengawas] = useState<PengawasProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 🌟 PERBAIKAN 1: Fungsi dimasukkan ke DALAM useEffect agar tidak ada masalah urutan (hoisting)
  useEffect(() => {
    const fetchPengawas = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('master_users')
          .select('id, nama_lengkap, role, sekolah_binaan')
          .ilike('role', '%pengawas%')
          .order('nama_lengkap');
          
        if (error) throw error;
        
        if (data) {
            // 🌟 PERBAIKAN 2: Tipe 'any' diganti dengan struktur data yang spesifik
            const formattedData = data.map((p: { id: string; nama_lengkap?: string; nama?: string; sekolah_binaan?: string[] }) => ({
                id: p.id,
                nama_lengkap: p.nama_lengkap || p.nama || 'Pengawas Tanpa Nama',
                sekolah_binaan: p.sekolah_binaan || []
            }));
            setListPengawas(formattedData);
        }
      } catch (err) {
        console.error("Gagal menarik data pengawas:", err);
      }
      setLoading(false);
    };

    if (showKinerja) {
      fetchPengawas();
    }
  }, [showKinerja]);

  if (!showKinerja) return null;

  return (
    <div className="bg-slate-800 p-6 rounded-xl border-2 border-emerald-500 shadow-2xl mb-6 animate-fade-in-up print:bg-white print:border-none print:shadow-none print:p-0">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4 print:hidden">
          <div>
              <h2 className="text-xl font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">🕵️ Radar Kinerja Pengawas</h2>
              <p className="text-xs text-slate-400 mt-1">Pemantauan *real-time* kepatuhan Pengawas dalam mengawal *input* data Instansi Binaan.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded font-bold transition-colors shadow-lg">🖨️ CETAK KINERJA</button>
            <button onClick={() => setShowKinerja(false)} className="text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded font-bold transition-colors">Tutup Panel</button>
          </div>
      </div>

      {loading ? (
         <div className="py-12 text-center text-emerald-400 font-bold animate-pulse">Memindai Data Kinerja Pengawas...</div>
      ) : listPengawas.length === 0 ? (
         <div className="text-center py-10 text-slate-400 italic">Tidak ada data Pengawas yang ditemukan di sistem.</div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {listPengawas.map(pengawas => {
               // 🌟 MESIN ANALISIS KINERJA PER PENGAWAS
               const binaan = pengawas.sekolah_binaan || [];
               let tuntas = 0;
               
               const detailSekolah = binaan.map(npsn => {
                   const sekolahMaster = masterSekolahList.find(s => s.npsn === npsn);
                   const namaSekolah = sekolahMaster ? sekolahMaster.nama_sekolah : `NPSN: ${npsn}`;
                   
                   // 1. Cek Rombel (Profil)
                   const isRombelOk = (sekolahMaster?.total_rombel || 0) > 0 && (sekolahMaster?.jumlah_guru || 0) > 0;
                   
                   // 2. Cek Kurikulum
                   const isKurikulumOk = allKurikulum.some(k => k.sekolah?.toUpperCase() === namaSekolah.toUpperCase() || k.npsn === npsn);
                   
                   // 3. Cek Buku Induk (Minimal 50% target guru terisi)
                   const riilGuru = allTeachers.filter(t => t.sekolah?.toUpperCase() === namaSekolah.toUpperCase()).length;
                   const targetGuru = sekolahMaster?.jumlah_guru || 0;
                   const isGuruOk = riilGuru > 0 && targetGuru > 0 && riilGuru >= (targetGuru * 0.5);

                   const isSelesai = isRombelOk && isKurikulumOk && isGuruOk;
                   if (isSelesai) tuntas++;

                   return { npsn, namaSekolah, isRombelOk, isKurikulumOk, isGuruOk, isSelesai, riilGuru, targetGuru };
               });

               const totalBinaan = binaan.length;
               const persentase = totalBinaan === 0 ? 0 : Math.round((tuntas / totalBinaan) * 100);
               const isExpanded = expandedId === pengawas.id;

               // Warna Progress Bar
               let progressColor = "bg-rose-500";
               if (persentase >= 50) progressColor = "bg-amber-400";
               if (persentase === 100) progressColor = "bg-emerald-500";

               return (
                 <div key={pengawas.id} className="bg-slate-900/80 border border-slate-700 rounded-xl overflow-hidden shadow-lg transition-all hover:border-emerald-500/50">
                    <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="font-bold text-white uppercase truncate pr-4">{pengawas.nama_lengkap}</h3>
                           <span className="text-xs font-black text-emerald-300 bg-emerald-950/50 px-2 py-1 rounded border border-emerald-800">
                               {tuntas} / {totalBinaan} Tuntas
                           </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-800 rounded-full h-2.5 mb-1 overflow-hidden border border-slate-700">
                           <div className={`${progressColor} h-2.5 rounded-full transition-all duration-1000`} style={{ width: `${persentase}%` }}></div>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 text-right mb-4">{persentase}% Selesai</div>

                        <button 
                           onClick={() => setExpandedId(isExpanded ? null : pengawas.id)}
                           className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold rounded-lg transition-colors"
                        >
                           {isExpanded ? 'Sembunyikan Rincian 🔼' : 'Lihat Rincian Binaan 🔽'}
                        </button>
                    </div>

                    {/* Rincian Expandable */}
                    {isExpanded && (
                       <div className="bg-slate-950 border-t border-slate-700 p-4 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
                          {detailSekolah.length === 0 ? (
                             <p className="text-xs text-slate-500 italic text-center">Belum ada sekolah binaan yang ditugaskan.</p>
                          ) : (
                             <ul className="space-y-3">
                                {detailSekolah.map((sek, idx) => (
                                   <li key={idx} className="border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                                      <div className="text-xs font-bold text-slate-200 mb-1.5">{sek.namaSekolah}</div>
                                      <div className="flex gap-2">
                                         <span className={`text-[9px] px-2 py-0.5 rounded flex-1 text-center font-bold border ${sek.isRombelOk ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' : 'bg-rose-900/40 text-rose-400 border-rose-800/50'}`}>
                                            Profil {sek.isRombelOk ? '✅' : '❌'}
                                         </span>
                                         <span className={`text-[9px] px-2 py-0.5 rounded flex-1 text-center font-bold border ${sek.isKurikulumOk ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' : 'bg-rose-900/40 text-rose-400 border-rose-800/50'}`}>
                                            Kurikulum {sek.isKurikulumOk ? '✅' : '❌'}
                                         </span>
                                         <span className={`text-[9px] px-2 py-0.5 rounded flex-1 text-center font-bold border ${sek.isGuruOk ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' : 'bg-rose-900/40 text-rose-400 border-rose-800/50'}`} title={`Input: ${sek.riilGuru} / Target: ${sek.targetGuru}`}>
                                            Guru {sek.isGuruOk ? `✅ (${sek.riilGuru}/${sek.targetGuru})` : '❌'}
                                         </span>
                                      </div>
                                   </li>
                                ))}
                             </ul>
                          )}
                       </div>
                    )}
                 </div>
               );
            })}
         </div>
      )}
    </div>
  );
};

export default PantauKinerjaPengawas;
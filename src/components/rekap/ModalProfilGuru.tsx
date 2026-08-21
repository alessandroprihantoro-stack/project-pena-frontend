import React from 'react';
import { TeacherData } from './DashboardStatistik';

interface ModalProps {
  teacher: TeacherData;
  onClose: () => void;
}

// 🌟 HELPER EKUIVALENSI BK (Diambil dari Standar Laporan Kepatuhan)
const calculateBKEkuivalen = (inputVal: number): number => {
    if (inputVal === 0) return 0;
    if (inputVal <= 50) {
        // Mode Rombel
        if (inputVal >= 5) return 24 + ((inputVal - 5) * 2);
        else return Math.round((inputVal / 5) * 24);
    } else {
        // Mode Siswa
        if (inputVal >= 150) {
            const surplusSiswa = inputVal > 160 ? inputVal - 160 : 0;
            const surplusRombel = Math.floor(surplusSiswa / 32); 
            return 24 + (surplusRombel * 2);
        } else {
            return Math.round((inputVal / 160) * 24);
        }
    }
};

const ModalProfilGuru: React.FC<ModalProps> = ({ teacher, onClose }) => {
  const jam = Number(teacher.totalJam) || 0;
  let jamClass = "text-emerald-400";
  let labelAlert = "";
  let borderClass = "border-slate-700";

  if (jam > 0 && jam < 24) {
      jamClass = "text-rose-400";
      borderClass = "border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]";
      labelAlert = "⚠️ Kurang dari 24 JP (Berisiko Sertifikasi)";
  } else if (jam > 38) {
      jamClass = "text-amber-400";
      borderClass = "border-amber-500";
      labelAlert = "⚠️ Beban Overload (> 38 JP)";
  }

  // 🌟 DETEKSI CERDAS GURU BK
  const isBK = teacher.bidangStudi?.toUpperCase().includes('KONSELING') || 
               teacher.bidangStudi?.toUpperCase().includes('BIMBINGAN') || 
               teacher.bidangStudi?.toUpperCase() === 'BK' || 
               teacher.bidangStudi?.toUpperCase() === 'BP/BK' ||
               teacher.tugasMengajar?.toUpperCase() === 'BK' ||
               teacher.tugasMengajar?.toUpperCase().includes('BIMBINGAN');

  const rawInput = Number(teacher.jamMengajar) || 0;
  const isRombel = rawInput <= 50;
  const ekuivalenJP = isBK ? calculateBKEkuivalen(rawInput) : rawInput;
  const kekuranganBK = isRombel ? (5 - rawInput) : (150 - rawInput);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:hidden animate-fade-in-up">
      <div className="bg-slate-800 w-full max-w-2xl rounded-xl border border-amber-500/50 shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-700 hover:bg-rose-600 px-3 py-1.5 rounded font-bold transition-colors text-xs">X TUTUP</button>
        <div className="flex items-center gap-3 border-b border-slate-700 pb-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-900/50 flex items-center justify-center border border-amber-500 text-xl">🧑‍🏫</div>
          <div>
             <h2 className="text-xl font-bold text-white leading-tight">Profil Lengkap Pendidik</h2>
             <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">{teacher.sekolah}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-sm">
          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50"><span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Nama Lengkap</span><strong className="text-amber-300 text-base">{teacher.nama || '-'}</strong></div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50"><span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">NIP</span><strong className="text-slate-200">{teacher.nip || '-'}</strong></div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50"><span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Asal Sekolah</span><strong className="text-cyan-300">{teacher.sekolah}</strong></div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50"><span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Bidang Studi Serdik</span><strong className="text-emerald-300">{teacher.bidangStudi || '-'}</strong></div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50"><span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Status Pegawai</span><strong className="text-slate-200">{teacher.statusPegawai || '-'}</strong></div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50"><span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Pangkat / Golongan</span><strong className="text-slate-200">{teacher.pangkat || '-'}</strong></div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50">
             <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Bulan & Tahun Pensiun</span>
             <strong className="text-rose-300">
                {(() => {
                   if(teacher.bulanTahunPensiun && teacher.bulanTahunPensiun.includes('-')) {
                       const [yyyy, mm] = teacher.bulanTahunPensiun.split('-');
                       return new Date(parseInt(yyyy), parseInt(mm) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
                   }
                   return '-';
                })()}
             </strong>
          </div>
          <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50"><span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Tugas Mengajar</span><strong className="text-slate-200">{teacher.tugasMengajar || '-'}</strong></div>
          
          <div className={`md:col-span-2 flex gap-4 bg-slate-950 p-4 rounded-lg border shadow-inner mt-2 ${borderClass}`}>
            
            {/* 🌟 BLOK CERDAS: BERUBAH JIKA GURU BK 🌟 */}
            {isBK ? (
                <div className="flex-1 text-center border-r border-slate-700 flex flex-col justify-center items-center">
                    <span className="text-cyan-400 block text-[10px] uppercase font-bold mb-1">Ekuivalensi BK</span>
                    <div className="flex items-baseline justify-center gap-1.5">
                        <strong className="text-white text-2xl leading-none">{rawInput}</strong>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{isRombel ? 'Rombel' : 'Siswa'}</span>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-bold mt-2 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">Setara {ekuivalenJP} JP</span>
                    {ekuivalenJP < 24 && (
                        <span className="text-[8px] text-rose-400 font-bold mt-1.5 block">
                            (Kurang {kekuranganBK > 0 ? kekuranganBK : 0} {isRombel ? 'Rombel' : 'Siswa'})
                        </span>
                    )}
                </div>
            ) : (
                <div className="flex-1 text-center border-r border-slate-700 flex flex-col justify-center items-center">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Jam Mengajar</span>
                    <strong className="text-white text-2xl leading-none">{teacher.jamMengajar || 0}</strong>
                    <span className="text-[9px] text-slate-500 mt-2 font-bold uppercase tracking-widest">Tatap Muka</span>
                </div>
            )}

            <div className="flex-1 text-center border-r border-slate-700 flex flex-col justify-center">
               <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Jam Tambahan</span>
               <strong className="text-white text-2xl leading-none mt-1">{teacher.jamTambahan || 0}</strong>
               {teacher.rincianTugasTambahan && <span className="text-[10px] text-amber-400 font-medium italic mt-2 px-2 truncate block">({teacher.rincianTugasTambahan})</span>}
            </div>
            
            <div className="flex-1 text-center flex flex-col justify-center items-center">
               <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">TOTAL BEBAN JAM</span>
               <strong className={`text-3xl font-black ${jamClass} mt-1`}>{teacher.totalJam || 0}</strong>
               {labelAlert && <span className={`mt-2 px-2 py-0.5 rounded text-[8px] font-bold uppercase text-center ${jam < 24 ? 'bg-rose-900/50 text-rose-300' : 'bg-amber-900/50 text-amber-300'}`}>{labelAlert}</span>}
            </div>
          </div>
          
          <div className="md:col-span-2 mt-2">
             <span className="text-slate-500 block text-[10px] uppercase font-bold mb-1">Kecamatan Domisili</span>
             <p className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/50 italic font-bold text-indigo-300">{teacher.kecamatan || 'Belum diinputkan.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalProfilGuru;
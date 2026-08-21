import React, { useState } from 'react';
import { ProcessedData } from './PanelAnalisis';

// 🌟 BARU: Interface untuk menampung raw data agar hitungan formasi presisi
export interface LocalExtendedTeacherData {
    sekolah?: string;
    kabupaten?: string;
    kecamatan?: string;
    bidangStudi?: string;
    tugasMengajar?: string;
    tugasNonLinier?: string;
    tugasNonLinier2?: string;
}

export interface MasterSekolah {
  npsn: string;
  nama_sekolah: string;
  jenjang: string;
  kabupaten: string;
  kecamatan: string;
  total_rombel?: number; 
}

export interface KurikulumItem {
  sekolah?: string;
  mapel: string;
  rombel: number;
  rombel_gabungan?: number;
  jp: number;
  jp_p5?: number;
}

interface FormasiProps {
  spreadsheetData: ProcessedData[];
  showFormasi: boolean;
  setShowFormasi: (val: boolean) => void;
  // 🌟 BARU: Props opsional untuk Injeksi Engine Baru
  allTeachers?: LocalExtendedTeacherData[];
  allKurikulum?: KurikulumItem[];
  masterSekolahList?: MasterSekolah[];
}

interface DetailSekolah {
  nama: string;
  qty: number;
}

interface RekapFormasi {
  mapel: string;
  totalKurang: number;
  totalLebih: number;
  usulanMurni: number;
  sekolahKurang: DetailSekolah[]; 
  sekolahLebih: DetailSekolah[];  
}

const UsulanFormasi: React.FC<FormasiProps> = ({ 
  spreadsheetData, 
  showFormasi, 
  setShowFormasi,
  allTeachers,
  allKurikulum,
  masterSekolahList
}) => {
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    title: string;
    tipe: 'KURANG' | 'LEBIH';
    listSekolah: DetailSekolah[];
  }>({
    isOpen: false,
    title: '',
    tipe: 'KURANG',
    listSekolah: []
  });

  if (!showFormasi) return null;

  // 🚀 ENGINE REKAPITULASI FORMASI PER KABUPATEN (DIPERBARUI DENGAN BATAS 38 JP)
  const hitungFormasi = () => {
    const hasil: Record<string, Record<string, RekapFormasi>> = {};

    // 🌟 JIKA PROPS LENGKAP, GUNAKAN ENGINE BARU (38 JP & LINIER 2)
    if (masterSekolahList && allKurikulum && allTeachers && masterSekolahList.length > 0) {
        masterSekolahList.forEach(sekolah => {
            const kab = sekolah.kabupaten || 'Tidak Diketahui';
            const namaSekolah = sekolah.nama_sekolah;
            const jenjang = sekolah.jenjang?.toUpperCase() || 'SMA';

            if (!hasil[kab]) hasil[kab] = {};

            const kurikulumSekolah = allKurikulum.filter(k => k.sekolah?.toUpperCase() === namaSekolah.toUpperCase());
            const uniqueMapels = Array.from(new Set(kurikulumSekolah.map(k => k.mapel.toUpperCase()))).filter(m => m !== '');

            uniqueMapels.forEach(mapelName => {
                const kItem = kurikulumSekolah.find(k => k.mapel.toUpperCase() === mapelName);
                let totalJP = 0;
                
                if (kItem && kItem.rombel > 0) {
                    if (jenjang === 'SMA' || jenjang === 'SMK') {
                        totalJP = (kItem.rombel * (kItem.jp || 0)) + (kItem.rombel * (kItem.jp_p5 || 0));
                    } else if (jenjang === 'SLB') {
                        const effRombel = kItem.rombel_gabungan && kItem.rombel_gabungan > 0 ? kItem.rombel_gabungan : kItem.rombel;
                        totalJP = effRombel * (kItem.jp || 0);
                    } else {
                        totalJP = kItem.rombel * (kItem.jp || 0);
                    }
                }

                // Jangan masukkan mapel pengecualian ke usulan CPNS/PPPK
                const isPengecualian = jenjang === 'SLB' || mapelName.includes('PILIHAN') || mapelName.includes('KETERAMPILAN') || mapelName.includes('PKL') || totalJP === 0;

                if (isPengecualian) return; 

                const idealGuru = Math.ceil(totalJP / 24);
                const batasMinGuru = Math.ceil(totalJP / 38);

                const listGuruRiil = allTeachers.filter(t => t.sekolah?.toUpperCase() === namaSekolah.toUpperCase() && 
                    (t.tugasMengajar?.toUpperCase() === mapelName || 
                     t.bidangStudi?.toUpperCase() === mapelName ||
                     t.tugasNonLinier?.toUpperCase() === mapelName ||
                     t.tugasNonLinier2?.toUpperCase() === mapelName) 
                );
                const jumlahGuruRiil = listGuruRiil.length;

                let kurang = 0;
                let lebih = 0;

                if (jumlahGuruRiil < batasMinGuru) {
                    kurang = batasMinGuru - jumlahGuruRiil;
                } else if (jumlahGuruRiil > idealGuru) {
                    lebih = jumlahGuruRiil - idealGuru;
                }

                if (kurang > 0 || lebih > 0) {
                    if (!hasil[kab][mapelName]) {
                        hasil[kab][mapelName] = { mapel: mapelName, totalKurang: 0, totalLebih: 0, usulanMurni: 0, sekolahKurang: [], sekolahLebih: [] };
                    }
                    hasil[kab][mapelName].totalKurang += kurang;
                    hasil[kab][mapelName].totalLebih += lebih;

                    if (kurang > 0) hasil[kab][mapelName].sekolahKurang.push({ nama: namaSekolah, qty: kurang });
                    if (lebih > 0) hasil[kab][mapelName].sekolahLebih.push({ nama: namaSekolah, qty: lebih });
                }
            });
        });
    } else {
        // 🌟 FALLBACK: JIKA PROPS BARU BELUM DILEMPAR DARI COMPONENT INDUK, GUNAKAN ENGINE LAMA
        spreadsheetData.forEach(sekolah => {
          const kab = sekolah.kabupaten || 'Tidak Diketahui';
          if (!hasil[kab]) hasil[kab] = {};

          Object.entries(sekolah.mapel).forEach(([mapel, data]) => {
            if (!hasil[kab][mapel]) {
              hasil[kab][mapel] = { mapel, totalKurang: 0, totalLebih: 0, usulanMurni: 0, sekolahKurang: [], sekolahLebih: [] };
            }
            
            hasil[kab][mapel].totalKurang += data.kurang;
            hasil[kab][mapel].totalLebih += data.kelebihan;

            if (data.kurang > 0) {
                hasil[kab][mapel].sekolahKurang.push({ nama: sekolah.sekolah, qty: data.kurang });
            }
            if (data.kelebihan > 0) {
                hasil[kab][mapel].sekolahLebih.push({ nama: sekolah.sekolah, qty: data.kelebihan });
            }
          });
        });
    }

    // Menghitung Usulan Murni (Defisit Mutlak Tingkat Kabupaten)
    Object.keys(hasil).forEach(kab => {
      Object.keys(hasil[kab]).forEach(mapel => {
        const item = hasil[kab][mapel];
        const selisih = item.totalKurang - item.totalLebih;
        item.usulanMurni = selisih > 0 ? selisih : 0; 
      });
    });

    return hasil;
  };

  const dataFormasi = hitungFormasi();

  const handleOpenModal = (title: string, listSekolah: DetailSekolah[], tipe: 'KURANG' | 'LEBIH') => {
      const sortedList = [...listSekolah].sort((a, b) => b.qty - a.qty);
      setModalData({ isOpen: true, title, tipe, listSekolah: sortedList });
  };

  const closeModal = () => setModalData({ ...modalData, isOpen: false });

  return (
    <div className="bg-slate-800 p-6 rounded-xl border-2 border-indigo-500 shadow-2xl mb-6 animate-fade-in-up print:bg-white print:border-none print:shadow-none print:p-0 relative">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4 print:hidden">
          <div>
              <h2 className="text-xl font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">📑 Usulan Formasi CPNS & PPPK Otomatis</h2>
              <p className="text-xs text-slate-400 mt-1">
                  Klik pada tombol <b className="text-rose-400">Kurang</b> atau <b className="text-amber-400">Lebih</b> untuk melihat rincian instansi. 
                  <span className="ml-1 text-indigo-300 font-bold">(Engine Presisi Batas 38 JP AKTIF)</span>
              </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded font-bold transition-colors shadow-lg">🖨️ CETAK USULAN</button>
            <button onClick={() => setShowFormasi(false)} className="text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded font-bold transition-colors">Tutup Panel</button>
          </div>
      </div>

      <div className="hidden print:block text-center mb-8">
          <h1 className="text-2xl font-bold uppercase">Dokumen Usulan Formasi Guru ASN (CPNS/PPPK)</h1>
          <p className="text-sm mt-1">Berdasarkan Analisis Defisit Mutlak Kapasitas Maksimal 38 JP - Cabdin Wilayah VI</p>
          <hr className="mt-4 border-2 border-black" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Karanganyar', 'Sragen', 'Wonogiri'].map(kab => {
          const mapelsDiKab = dataFormasi[kab] 
            ? Object.values(dataFormasi[kab])
                .filter(m => m.usulanMurni > 0 || m.totalLebih > 0)
                .sort((a,b) => b.usulanMurni - a.usulanMurni || b.totalLebih - a.totalLebih) 
            : [];
            
          const totalUsulanKab = mapelsDiKab.reduce((sum, m) => sum + m.usulanMurni, 0);

          return (
            <div key={kab} className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 print:border-black print:bg-transparent">
               <div className="flex justify-between items-center border-b border-slate-600 print:border-black pb-3 mb-4">
                  <h3 className="text-lg font-bold text-indigo-300 print:text-black uppercase">Kab. {kab}</h3>
                  <span className="bg-indigo-900/50 border border-indigo-500 text-indigo-200 px-2 py-1 rounded text-xs font-bold print:border-none print:text-black print:bg-transparent">
                     Total Usulan: {totalUsulanKab}
                  </span>
               </div>
               
               {mapelsDiKab.length === 0 ? (
                 <p className="text-xs text-slate-500 italic print:text-black">Belum ada data formasi.</p>
               ) : (
                 <ul className="space-y-2.5">
                    {mapelsDiKab.map(m => (
                       <li key={m.mapel} className="flex justify-between items-center text-xs border-b border-slate-800 pb-2 print:border-gray-300 group">
                          <span className="font-semibold text-slate-300 print:text-black truncate pr-2" title={m.mapel}>{m.mapel}</span>
                          
                          <div className="flex gap-1.5 items-center shrink-0">
                             {m.totalLebih > 0 && (
                                <button 
                                  onClick={() => handleOpenModal(m.mapel, m.sekolahLebih, 'LEBIH')}
                                  className="px-2 py-0.5 rounded-md bg-amber-950/40 text-amber-400 border border-amber-800/50 hover:bg-amber-900 hover:text-white transition-colors cursor-pointer print:border-none print:text-black"
                                  title="Klik untuk melihat sekolah yang kelebihan"
                                >
                                   Lebih: {m.totalLebih}
                                </button>
                             )}

                             {m.totalKurang > 0 && (
                                <button 
                                  onClick={() => handleOpenModal(m.mapel, m.sekolahKurang, 'KURANG')}
                                  className="px-2 py-0.5 rounded-md bg-rose-950/40 text-rose-400 border border-rose-800/50 hover:bg-rose-900 hover:text-white transition-colors cursor-pointer print:border-none print:text-black"
                                  title="Klik untuk melihat sekolah yang kekurangan"
                                >
                                   Kurang: {m.totalKurang}
                                </button>
                             )}

                             <span 
                               className="font-black text-indigo-400 print:text-black text-sm w-7 text-right ml-1 border-l border-slate-700 pl-2 print:border-none" 
                               title="Usulan Murni (Total Kekurangan dikurangi Kelebihan)"
                             >
                                {m.usulanMurni > 0 ? `+${m.usulanMurni}` : '-'}
                             </span>
                          </div>
                       </li>
                    ))}
                 </ul>
               )}
            </div>
          );
        })}
      </div>

      {modalData.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in print:hidden">
           <div className="bg-slate-900 border border-slate-600 rounded-2xl w-full max-w-lg shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[85vh] animate-scale-in">
              <div className={`p-5 flex justify-between items-start border-b ${modalData.tipe === 'KURANG' ? 'bg-rose-950/40 border-rose-800/50' : 'bg-amber-950/40 border-amber-800/50'}`}>
                 <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-wider">{modalData.title}</h3>
                    <p className={`text-xs font-bold mt-1 uppercase tracking-widest ${modalData.tipe === 'KURANG' ? 'text-rose-400' : 'text-amber-400'}`}>
                       Daftar Instansi {modalData.tipe === 'KURANG' ? 'Kekurangan' : 'Kelebihan'} Guru
                    </p>
                 </div>
                 <button onClick={closeModal} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 w-8 h-8 rounded-full flex items-center justify-center font-bold transition-colors">✕</button>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                 {modalData.listSekolah.length === 0 ? (
                    <p className="text-slate-500 text-center italic py-4">Data instansi tidak ditemukan.</p>
                 ) : (
                    <ul className="space-y-2">
                       {modalData.listSekolah.map((sek, idx) => (
                          <li key={idx} className="flex justify-between items-center bg-slate-950/50 border border-slate-700/50 p-3 rounded-lg hover:border-slate-500 transition-colors">
                             <span className="text-sm font-bold text-slate-300">{sek.nama}</span>
                             <span className={`px-3 py-1 rounded-md text-xs font-black ${modalData.tipe === 'KURANG' ? 'bg-rose-900 text-rose-200' : 'bg-amber-900 text-amber-200'}`}>
                                {sek.qty} Guru
                             </span>
                          </li>
                       ))}
                    </ul>
                 )}
              </div>
              <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end">
                 <button onClick={closeModal} className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-colors">Tutup Rincian</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default UsulanFormasi;
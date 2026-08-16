import React from 'react';
import { calculateKebutuhan } from '../../utils/kalkulasiGuru';

export interface ProcessedData {
  kabupaten: string;
  sekolah: string;
  mapel: Record<string, { kurang: number; kelebihan: number; totalJam: number; guruAda: number }>;
}

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
  
  const getSortedKekuranganMapels = (sekolahData: ProcessedData) => {
    return mapelList
      .filter(m => (sekolahData.mapel[m]?.kurang || 0) > 0)
      .sort((a, b) => (sekolahData.mapel[b]?.kurang || 0) - (sekolahData.mapel[a]?.kurang || 0));
  };

  const mapelKelebihan = mapelList.filter(m => (viewDetailSekolah.mapel[m]?.kelebihan || 0) > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:static print:bg-transparent print:p-0 print:block">
      <div className="bg-slate-800 w-full max-w-4xl max-h-[85vh] overflow-y-auto rounded-xl border border-slate-600 shadow-2xl p-6 print:bg-white print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:text-black relative">
        
        <div className="flex justify-between items-center mb-6 border-b border-slate-700 print:border-black pb-4 sticky top-0 bg-slate-800 z-20 print:static">
          <h2 className="text-2xl font-bold text-white print:text-black uppercase">Rincian Data: {viewDetailSekolah.sekolah}</h2>
          <div className="flex gap-3 print:hidden">
            <button onClick={handleExportPDF} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded font-bold flex items-center gap-2 shadow-lg">
              📄 Cetak PDF
            </button>
            <button onClick={() => setViewDetailSekolah(null)} className="text-slate-400 hover:text-white bg-slate-700 px-4 py-2 rounded font-bold transition-colors">
              X TUTUP
            </button>
          </div>
        </div>

        <div className="mb-8 mt-4">
          <h3 className="text-lg font-bold text-amber-400 print:text-black mb-3 border-l-4 border-amber-400 print:border-black pl-3">Daftar Kekurangan Guru</h3>
          <div className="space-y-3">
            {getSortedKekuranganMapels(viewDetailSekolah).map(m => {
              const data = viewDetailSekolah.mapel[m];
              const isBK = m.toLowerCase().includes('bimbingan') || m.toLowerCase().includes('konseling') || m.toLowerCase() === 'bk';
              const kurang = data.kurang; 
              const isCritical = kurang > 1;
              const labelSatuan = isBK ? 'Kelas' : 'Jam Pelajaran';
              
              return (
                <div key={m} className={`bg-slate-900/50 print:bg-transparent p-4 rounded-lg border ${isCritical ? 'border-red-900/50 print:border-red-500' : 'border-amber-900/30 print:border-black'}`}>
                  <p className="font-bold text-slate-200 print:text-black text-lg mb-1">
                    {m} 
                    <span className={`px-2 py-0.5 rounded text-sm ml-2 print:text-black print:font-bold ${isCritical ? 'text-red-400 bg-red-900/30' : 'text-amber-400 bg-amber-900/30'}`}>
                      Kurang {kurang} Guru
                    </span>
                  </p>
                  <p className="text-sm text-slate-400 print:text-gray-800">
                    Saat ini memiliki beban <strong className="text-white print:text-black">{data.totalJam || 0} {labelSatuan}</strong>, namun hanya diampu oleh <strong className="text-white print:text-black">{data.guruAda || 0} Guru</strong>. <br/>
                    (Jam ideal guru adalah 30 jam pelajaran).
                  </p>
                </div>
              );
            })}
            {getSortedKekuranganMapels(viewDetailSekolah).length === 0 && <p className="text-slate-500 print:text-gray-600 italic">Sekolah ini tidak mengalami kekurangan jam mengajar/guru.</p>}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-emerald-400 print:text-black mb-3 border-l-4 border-emerald-400 print:border-black pl-3">Daftar Kelebihan Guru & Rincian Nama</h3>
          <div className="space-y-6">
            {mapelKelebihan.map(m => {
              const data = viewDetailSekolah.mapel[m];
              const guruList = allSurplusTeachers.filter(t => t.sekolah === viewDetailSekolah.sekolah && t.bidangStudi === m);
              
              const kelebihan = data.kelebihan; 
              const { warningMessages, isBK } = calculateKebutuhan(m, data.totalJam || 0, data.guruAda || 0);
              const labelSatuan = isBK ? 'Kelas' : 'Jam Pelajaran';

              return (
                <div key={m} className="bg-slate-900/50 print:bg-transparent p-4 rounded-lg border border-emerald-900/30 print:border-black overflow-x-auto print:overflow-visible relative mt-8">
                  
                  {warningMessages.length > 0 && (
                     <div className="absolute -top-6 right-2 sm:right-4 flex flex-col gap-1 items-end z-10">
                        {warningMessages.map((msg, idx) => (
                           <div key={idx} className="bg-rose-900 border border-rose-500 shadow-xl px-3 py-1.5 rounded-lg text-rose-200 text-xs font-bold animate-bounce">
                              ⚠️ ( {msg} )
                           </div>
                        ))}
                     </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-start mb-4 pr-0 sm:pr-40 pt-4 sm:pt-0">
                    <div>
                      <p className="font-bold text-slate-200 print:text-black text-lg mb-1">
                        {m} 
                        <span className="text-emerald-400 bg-emerald-900/30 print:text-black print:bg-transparent print:border print:border-black px-2 py-0.5 rounded text-sm ml-2">
                          Kelebihan {kelebihan} Guru
                        </span>
                      </p>
                      <p className="text-sm text-slate-400 print:text-gray-800">
                        Total beban {data.totalJam || 0} {labelSatuan}, namun diampu oleh {data.guruAda || 0} Guru. <br/>
                        (Jam ideal guru adalah 30 jam pelajaran).
                      </p>
                    </div>
                  </div>
                  
                  <table className="w-full text-left text-xs border border-slate-700 print:border-black mt-4">
                    <thead className="bg-slate-800 text-emerald-400 print:bg-gray-200 print:text-black text-center">
                      <tr>
                        <th className="p-2 border border-slate-700 print:border-black">No</th>
                        <th className="p-2 border border-slate-700 print:border-black">Nama</th>
                        <th className="p-2 border border-slate-700 print:border-black">NIP</th>
                        <th className="p-2 border border-slate-700 print:border-black">Pangkat/Golongan</th>
                        <th className="p-2 border border-slate-700 print:border-black">PNS/P3K</th>
                        <th className="p-2 border border-slate-700 print:border-black">Ijasah S1</th>
                        <th className="p-2 border border-slate-700 print:border-black">Bidang Studi Serdik</th>
                        <th className="p-2 border border-slate-700 print:border-black">Mengajar</th>
                        <th className="p-2 border border-slate-700 print:border-black">Tambahan</th>
                        <th className="p-2 border border-slate-700 print:border-black text-amber-300">Rincian Tambahan</th>
                        <th className="p-2 border border-slate-700 print:border-black">Total Jam</th>
                        <th className="p-2 border border-slate-700 print:border-black">Domisili</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guruList.map((g, index) => (
                        <tr key={g.id} className="border-b border-slate-700/50 print:border-black">
                          <td className="p-2 border-r border-slate-700 print:border-black text-center">{index + 1}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black">{g.nama}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.nip}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.pangkat}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.statusPegawai}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.ijasah}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.bidangStudi}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.jamMengajar}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center">{g.jamTambahan}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black text-center italic text-amber-300/80">{g.rincianTugasTambahan || '-'}</td>
                          <td className="p-2 font-bold text-emerald-200 print:text-black border-r border-slate-700 print:border-black text-center">{g.totalJam}</td>
                          <td className="p-2 border-r border-slate-700 print:border-black">{g.alamat}</td>
                        </tr>
                      ))}
                      {guruList.length === 0 && <tr><td colSpan={12} className="p-4 text-center text-rose-400 print:text-black italic">Admin sekolah belum menginputkan rincian nama guru pada mata pelajaran ini.</td></tr>}
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
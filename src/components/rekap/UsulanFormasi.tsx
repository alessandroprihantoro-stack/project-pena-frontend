import React from 'react';
import { ProcessedData } from './PanelAnalisis';

interface FormasiProps {
  spreadsheetData: ProcessedData[];
  showFormasi: boolean;
  setShowFormasi: (val: boolean) => void;
}

interface RekapFormasi {
  mapel: string;
  totalKurang: number;
  totalLebih: number;
  usulanMurni: number;
}

const UsulanFormasi: React.FC<FormasiProps> = ({ spreadsheetData, showFormasi, setShowFormasi }) => {
  if (!showFormasi) return null;

  // ENGINE REKAPITULASI FORMASI PER KABUPATEN
  const hitungFormasi = () => {
    const hasil: Record<string, Record<string, RekapFormasi>> = {};

    spreadsheetData.forEach(sekolah => {
      const kab = sekolah.kabupaten;
      if (!hasil[kab]) hasil[kab] = {};

      Object.entries(sekolah.mapel).forEach(([mapel, data]) => {
        if (!hasil[kab][mapel]) {
          hasil[kab][mapel] = { mapel, totalKurang: 0, totalLebih: 0, usulanMurni: 0 };
        }
        hasil[kab][mapel].totalKurang += data.kurang;
        hasil[kab][mapel].totalLebih += data.kelebihan;
      });
    });

    // Menghitung Usulan Murni (Defisit Mutlak)
    Object.keys(hasil).forEach(kab => {
      Object.keys(hasil[kab]).forEach(mapel => {
        const item = hasil[kab][mapel];
        const selisih = item.totalKurang - item.totalLebih;
        item.usulanMurni = selisih > 0 ? selisih : 0; // Jika kelebihan lebih banyak, usulan 0
      });
    });

    return hasil;
  };

  const dataFormasi = hitungFormasi();

  return (
    <div className="bg-slate-800 p-6 rounded-xl border-2 border-indigo-500 shadow-2xl mb-6 animate-fade-in-up print:bg-white print:border-none print:shadow-none print:p-0">
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4 print:hidden">
          <div>
              <h2 className="text-xl font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">📑 Usulan Formasi CPNS & PPPK Otomatis</h2>
              <p className="text-xs text-slate-400 mt-1">Sistem otomatis menghitung Defisit Murni (Total Kekurangan dikurangi Total Kelebihan) per Kabupaten.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded font-bold transition-colors shadow-lg">🖨️ CETAK USULAN</button>
            <button onClick={() => setShowFormasi(false)} className="text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded font-bold transition-colors">Tutup Panel</button>
          </div>
      </div>

      <div className="hidden print:block text-center mb-8">
          <h1 className="text-2xl font-bold uppercase">Dokumen Usulan Formasi Guru ASN (CPNS/PPPK)</h1>
          <p className="text-sm mt-1">Berdasarkan Analisis Defisit Mutlak Kebutuhan Cabdin Wilayah VI</p>
          <hr className="mt-4 border-2 border-black" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Karanganyar', 'Sragen', 'Wonogiri'].map(kab => {
          const mapelsDiKab = dataFormasi[kab] ? Object.values(dataFormasi[kab]).filter(m => m.usulanMurni > 0).sort((a,b) => b.usulanMurni - a.usulanMurni) : [];
          const totalUsulanKab = mapelsDiKab.reduce((sum, m) => sum + m.usulanMurni, 0);

          return (
            <div key={kab} className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 print:border-black print:bg-transparent">
               <div className="flex justify-between items-center border-b border-slate-600 print:border-black pb-3 mb-4">
                  <h3 className="text-lg font-bold text-indigo-300 print:text-black uppercase">Kab. {kab}</h3>
                  <span className="bg-indigo-900/50 border border-indigo-500 text-indigo-200 px-2 py-1 rounded text-xs font-bold print:border-none print:text-black print:bg-transparent">
                     Total Usulan: {totalUsulanKab} Guru
                  </span>
               </div>
               
               {mapelsDiKab.length === 0 ? (
                 <p className="text-xs text-slate-500 italic print:text-black">Kebutuhan guru sudah terpenuhi/surplus.</p>
               ) : (
                 <ul className="space-y-2">
                    {mapelsDiKab.map(m => (
                       <li key={m.mapel} className="flex justify-between items-center text-xs border-b border-slate-800 pb-1 print:border-gray-300">
                          <span className="font-semibold text-slate-300 print:text-black">{m.mapel}</span>
                          <div className="flex gap-2 items-center">
                             <span className="text-[9px] text-rose-400 print:text-gray-600" title={`Kurang ${m.totalKurang}, bisa ditutup Surplus ${m.totalLebih}`}>
                               (Defisit Asli: {m.totalKurang} - {m.totalLebih})
                             </span>
                             <span className="font-black text-indigo-400 print:text-black text-sm w-6 text-right">+{m.usulanMurni}</span>
                          </div>
                       </li>
                    ))}
                 </ul>
               )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UsulanFormasi;
import React from 'react';

interface FilterProps {
  fKabupaten: string; setFKabupaten: (v: string) => void;
  fSekolah: string; setFSekolah: (v: string) => void;
  fMapel: string; setFMapel: (v: string) => void;
  fStatus: string; setFStatus: (v: string) => void;
  fPensiun: string; setFPensiun: (v: string) => void;
  fKeyword: string; setFKeyword: (v: string) => void; // 🌟 BARU: State untuk kata kunci pencarian
  listKabupatenValid: string[];
  listSekolahFilter: string[];
  listMapel: string[];
  listStatusValid: string[];
  uniquePensiun: string[];
  onReset: () => void;
}

const FilterPencarian: React.FC<FilterProps> = (props) => {
  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl print:hidden mt-6">
      <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
         <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">🔍 Filter & Pencarian Buku Induk</h2>
         <button onClick={props.onReset} className="text-xs text-slate-400 hover:text-white underline font-medium">Reset Filter</button>
      </div>

      {/* 🌟 BARU: Kotak Pencarian Teks (Nama / NIP) */}
      <div className="mb-4">
         <input 
             type="text" 
             placeholder="Ketik Nama Lengkap atau NIP Guru untuk mencari..." 
             className="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-4 py-2.5 outline-none focus:border-emerald-500 shadow-inner transition-colors"
             value={props.fKeyword}
             onChange={(e) => props.setFKeyword(e.target.value)}
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <select className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={props.fKabupaten} onChange={(e) => { props.setFKabupaten(e.target.value); props.setFSekolah(''); }}>
          <option value="">Semua Kabupaten</option>
          {props.listKabupatenValid.map(kab => <option key={kab} value={kab}>{kab}</option>)}
        </select>
        <select className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={props.fSekolah} onChange={(e) => props.setFSekolah(e.target.value)}>
          <option value="">Semua Sekolah</option>
          {props.listSekolahFilter.map(sek => <option key={sek} value={sek}>{sek}</option>)}
        </select>
        <select className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={props.fMapel} onChange={(e) => props.setFMapel(e.target.value)}>
          <option value="">Semua Mata Pelajaran</option>
          {props.listMapel.map(mapel => <option key={mapel} value={mapel}>{mapel}</option>)}
        </select>
        <select className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={props.fStatus} onChange={(e) => props.setFStatus(e.target.value)}>
          <option value="">Semua Status Kepegawaian</option>
          {props.listStatusValid.map(st => <option key={st} value={st}>{st}</option>)}
        </select>
        <select className="bg-slate-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm outline-none" value={props.fPensiun} onChange={(e) => props.setFPensiun(e.target.value)}>
          <option value="">Semua Tahun Pensiun</option>
          {props.uniquePensiun.map(p => {
              if(!p) return null;
              const [yyyy, mm] = p.split('-');
              const displayDate = new Date(parseInt(yyyy), parseInt(mm) - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
              return <option key={p} value={p}>{displayDate}</option>;
          })}
        </select>
      </div>
    </div>
  );
};
export default FilterPencarian;
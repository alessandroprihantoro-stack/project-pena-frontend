import React from 'react';

export interface TeacherData {
  id: string | number;
  sekolah?: string;
  kabupaten?: string;
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
  kecamatan: string; // FITUR BARU: Geo-Mapping
  alamat: string;
  bulanTahunPensiun?: string;
}

interface DashboardProps {
  allTeachers: TeacherData[];
  onToggleSecret: () => void;
}

const DashboardStatistik: React.FC<DashboardProps> = ({ allTeachers, onToggleSecret }) => {
  
  const totalGuru = allTeachers.length;
  
  const stats = allTeachers.reduce((acc, curr) => {
    const status = curr.statusPegawai?.toUpperCase() || 'LAINNYA';
    if (status.includes('PNS')) acc.pns++;
    else if (status.includes('PARUH WAKTU')) acc.pppkParuh++;
    else if (status.includes('PPPK') || status.includes('P3K')) acc.pppk++;
    else acc.nonAsn++;
    return acc;
  }, { pns: 0, pppk: 0, pppkParuh: 0, nonAsn: 0 });

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl print:border-none print:shadow-none print:bg-transparent mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-700 print:border-black pb-4">
        <div>
          <h1 
            onDoubleClick={onToggleSecret} 
            className="text-2xl font-bold text-cyan-400 print:text-black uppercase tracking-widest cursor-pointer select-none"
            title="Klik Ganda (Double-Click) untuk membuka mode rahasia"
          >
            Sistem Pendataan Guru Terpadu
          </h1>
          <p className="text-sm text-slate-400 print:text-gray-600 mt-1">Buku Induk Pendidik & Tenaga Kependidikan Cabdin Wilayah VI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-linear-to-br from-cyan-900/50 to-slate-900 p-5 rounded-xl border border-cyan-800/50 shadow-inner flex flex-col justify-center items-center text-center">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-2">Total Guru Terdata</span>
            <span className="text-5xl font-black text-white">{totalGuru}</span>
        </div>
        
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Guru PNS</span>
            <span className="text-3xl font-black text-emerald-400">{stats.pns}</span>
        </div>

        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Guru PPPK (Penuh)</span>
            <span className="text-3xl font-black text-amber-400">{stats.pppk}</span>
        </div>

        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PPPK Paruh Waktu</span>
            <span className="text-3xl font-black text-rose-400">{stats.pppkParuh}</span>
        </div>

        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-700 flex flex-col justify-center items-center text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Non ASN / Honorer</span>
            <span className="text-3xl font-black text-slate-300">{stats.nonAsn}</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardStatistik;
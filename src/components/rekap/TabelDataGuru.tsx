import React from 'react';
import { TeacherData } from './DashboardStatistik';

interface TabelProps {
  filteredTeachers: TeacherData[];
  onTeacherClick: (t: TeacherData) => void;
  onDeleteTeacher: (id: string | number, nama: string) => void;
  onExportPDF: () => void;
}

const TabelDataGuru: React.FC<TabelProps> = ({ filteredTeachers, onTeacherClick, onDeleteTeacher, onExportPDF }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl overflow-hidden print:bg-white print:p-0 print:border-none print:shadow-none print:overflow-visible">
      
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">Tabel Data Pendidik ({filteredTeachers.length} Guru)</h2>
        <button onClick={onExportPDF} className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-lg">📄 Cetak Data PDF</button>
      </div>

      {/* PERBAIKAN: Menambahkan print:overflow-visible dan print:max-h-none agar tabel tidak terpotong saat dicetak */}
      <div className="overflow-x-auto print:overflow-visible rounded-lg border border-slate-700 print:border-black max-h-150 print:max-h-none" style={{ scrollbarWidth: 'thin' }}>
        
        <table className="w-full text-left text-xs border-collapse print:text-black relative print:w-full">
          {/* PERBAIKAN: Menambahkan print:static agar Header tabel tidak error/menumpuk di halaman ke-2 dan seterusnya */}
          <thead className="bg-slate-900 text-cyan-400 print:bg-gray-200 print:text-black text-center sticky top-0 print:static z-10 shadow-md print:shadow-none">
            <tr>
              <th className="p-3 border border-slate-700 print:border-black whitespace-nowrap">No</th>
              <th className="p-3 border border-slate-700 print:border-black min-w-40">Nama Lengkap</th>
              <th className="p-3 border border-slate-700 print:border-black">NIP</th>
              <th className="p-3 border border-slate-700 print:border-black min-w-40">Sekolah Asal</th>
              <th className="p-3 border border-slate-700 print:border-black">Status Pegawai</th>
              <th className="p-3 border border-slate-700 print:border-black min-w-32">Bidang Studi</th>
              <th className="p-3 border border-slate-700 print:border-black min-w-32">Tugas Mengajar</th>
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

                  const jam = Number(t.totalJam) || 0;
                  let jamClass = "text-emerald-400 font-black print:text-black";
                  let badgeClass = "";
                  let jamLabel = "Beban Jam Normal (Aman Sertifikasi)";
                  
                  if (jam > 0 && jam < 24) {
                      jamClass = "text-rose-300 font-black print:text-black";
                      badgeClass = "bg-rose-900/40 border border-rose-500 px-2 py-0.5 rounded shadow-sm print:bg-transparent print:border-none";
                      jamLabel = "⚠️ Bahaya: Jam < 24 JP (Berisiko tidak cair tunjangan sertifikasi)";
                  } else if (jam > 38) {
                      jamClass = "text-amber-300 font-black print:text-black";
                      badgeClass = "bg-amber-900/40 border border-amber-500 px-2 py-0.5 rounded shadow-sm print:bg-transparent print:border-none";
                      jamLabel = "⚠️ Peringatan: Beban Mengajar Berlebih (> 38 JP)";
                  }

                  return (
                  <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-700/50 transition-colors print:border-black" style={{ pageBreakInside: 'avoid' }}>
                    <td className="p-2 border-r border-slate-700/50 print:border-black text-center text-slate-400 print:text-black">{idx + 1}</td>
                    <td className="p-2 border-r border-slate-700/50 print:border-black font-bold text-white print:text-black cursor-pointer hover:text-amber-400" onClick={() => onTeacherClick(t)} title="Klik untuk melihat detail profil">{t.nama}</td>
                    <td className="p-2 border-r border-slate-700/50 print:border-black text-slate-300 print:text-black">{t.nip || '-'}</td>
                    <td className="p-2 border-r border-slate-700/50 print:border-black text-cyan-300 print:text-black font-medium">{t.sekolah}</td>
                    <td className="p-2 border-r border-slate-700/50 print:border-black text-center font-bold text-emerald-300 print:text-black">{t.statusPegawai}</td>
                    <td className="p-2 border-r border-slate-700/50 print:border-black text-amber-100 print:text-black">{t.bidangStudi}</td>
                    <td className="p-2 border-r border-slate-700/50 print:border-black print:text-black">{t.tugasMengajar}</td>
                    
                    <td className="p-2 border-r border-slate-700/50 print:border-black text-center text-sm" title={jamLabel}>
                        <span className={badgeClass ? `${badgeClass} ${jamClass}` : jamClass}>{t.totalJam || 0}</span>
                    </td>

                    <td className="p-2 border-r border-slate-700/50 print:border-black text-center font-bold text-amber-300 print:text-black">{displayPensiun}</td>
                    <td className="p-2 text-center print:hidden">
                        <button onClick={() => onDeleteTeacher(t.id, t.nama)} className="bg-rose-900/50 hover:bg-rose-600 text-rose-300 hover:text-white px-3 py-1.5 rounded font-bold transition-colors shadow-sm">Hapus</button>
                    </td>
                  </tr>
                  )
                })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TabelDataGuru;
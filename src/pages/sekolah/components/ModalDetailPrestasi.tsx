// Mendefinisikan interface agar komponen ini mandiri dan TypeScript aman
interface PrestasiDetailItem {
  id: string;
  peringkat?: string | number;
  juara?: string;
  nama_siswa_atau_kegiatan?: string;
  nama_prestasi?: string;
  jenis_prestasi?: string;
  bidang?: string;
  tahun?: string;
  poin?: number;
  bukti_sertifikat?: string;
}

interface ModalDetailPrestasiProps {
  myPrestasiDetail: PrestasiDetailItem[];
  setShowDetailPrestasi: (val: boolean) => void;
}

export default function ModalDetailPrestasi({ 
  myPrestasiDetail, 
  setShowDetailPrestasi 
}: ModalDetailPrestasiProps) {
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-4 max-h-[85vh] flex flex-col shadow-2xl relative">
        <button onClick={() => setShowDetailPrestasi(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white font-black text-xl transition-colors cursor-pointer p-2">✕</button>
        <div>
          <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">🥇 Berkas Trofi Sah Satuan Pendidikan</h3>
          <p className="text-xs text-slate-400 mt-1">Daftar menyeluruh peraih juara lomba, kelulusan, atau nilai TKA siswa yang valid</p>
        </div>
        
        <div className="overflow-y-auto custom-scrollbar flex-1 pr-1 space-y-3">
          {myPrestasiDetail.length === 0 ? (
            <p className="text-xs font-mono text-slate-500 italic text-center py-8">Belum ada data berkas berstatus valid/disetujui.</p>
          ) : (
            myPrestasiDetail.map((pr) => (
              <div key={pr.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-cyan-500/30 transition-all">
                <div className="space-y-1">
                  <span className="inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full uppercase tracking-wider">🏆 {pr.peringkat || pr.juara || 'Item Valid'}</span>
                  <h4 className="font-bold text-white text-sm">{pr.nama_siswa_atau_kegiatan || pr.nama_prestasi || 'Data Prestasi/TKA Siswa'}</h4>
                  <p className="text-xs text-slate-400">{pr.jenis_prestasi || pr.bidang || 'Lomba/Akademik'} • Tahun Ajaran {pr.tahun || '-'}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right font-mono hidden sm:block">
                    <span className="block text-[9px] text-slate-500 uppercase tracking-widest font-bold">Bobot Poin</span>
                    <span className="text-sm font-black text-cyan-400">+{pr.poin || 1}</span>
                  </div>
                  {pr.bukti_sertifikat && (
                    <a href={pr.bukti_sertifikat} target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-all">
                      <span>👁️</span> Bukti ↗
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="pt-2 border-t border-slate-800/60 flex justify-end">
          <button onClick={() => setShowDetailPrestasi(false)} className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer">Tutup Monitor</button>
        </div>
      </div>
    </div>
  );
}
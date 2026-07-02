// Mendefinisikan tipe data agar komponen ini bisa mandiri
interface PrestasiAjuan { 
  id: string; 
  sekolah_id: string; 
  user_id: string; 
  nama_siswa_atau_kegiatan: string; 
  jenis_prestasi: string; 
  jalur?: string; 
  juara: string; 
  tahun: string; 
  poin: number; 
  bukti_sertifikat: string; 
  status_validasi: string; 
  created_at: string; 
  nama_sekolah?: string; 
  logo_url?: string | null; 
  npsn?: string;
  kategori?: string;
  jenis?: string;
  nama_prestasi?: string;
}

interface TabValidasiPrestasiProps {
  prestasiMenunggu: PrestasiAjuan[];
  handleReviewBukti: (url?: string | null) => void;
  handleValidasiPrestasi: (id: string, statusBaru: 'DISETUJUI' | 'DITOLAK') => void;
}

export default function TabValidasiPrestasi({ 
  prestasiMenunggu, 
  handleReviewBukti, 
  handleValidasiPrestasi 
}: TabValidasiPrestasiProps) {

  return (
    <div className="bg-slate-900/60 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl border border-slate-800 animate-fade-in">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="font-mono text-amber-400 font-bold text-base flex items-center gap-2">
          <span>🎖️</span> ANTREAN VALIDASI PRESTASI ({prestasiMenunggu.length})
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">Verifikasi keabsahan piagam/sertifikat lomba sekolah binaan.</p>
      </div>
      
      {prestasiMenunggu.length === 0 ? (
        <p className="text-xs text-slate-500 italic p-8 text-center font-mono">Tidak ada pengajuan piagam prestasi saat ini.</p>
      ) : (
        prestasiMenunggu.map(p => (
          <div key={p.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs group hover:border-amber-500/50 transition-all">
            <div className="space-y-1">
              <span className="text-amber-400 font-mono text-[10px] font-bold block">{p.jenis_prestasi} • Juara {p.juara} ({p.tahun})</span>
              <strong className="text-white text-sm block">{p.nama_siswa_atau_kegiatan}</strong>
              <span className="text-slate-400 block">{p.nama_sekolah} • Bobot Peringkat: <b className="text-amber-400 font-mono">{p.poin} Poin</b></span>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleReviewBukti(p.bukti_sertifikat)} className="px-4 py-2.5 bg-slate-900 text-amber-300 border border-amber-500/30 rounded-xl font-bold cursor-pointer">👁️ Cek Piagam</button>
              <button onClick={() => handleValidasiPrestasi(p.id, 'DISETUJUI')} className="px-5 py-2.5 bg-emerald-500 text-slate-950 font-black rounded-xl cursor-pointer">Sah & Setujui</button>
              <button onClick={() => handleValidasiPrestasi(p.id, 'DITOLAK')} className="px-4 py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl font-bold cursor-pointer">Tolak</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
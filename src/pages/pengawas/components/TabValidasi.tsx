// Mendefinisikan tipe data agar komponen ini bisa mandiri (Strict Type Checking)
interface PraktikBaik { 
  id: string; 
  user_id: string; 
  sekolah_id: string; 
  judul: string; 
  deskripsi: string; 
  jenis_media: string; 
  media_url: string; 
  status_validasi: string; 
  created_at: string; 
  nama_sekolah?: string; 
  npsn?: string;
}

interface TabValidasiPraktikProps {
  praktikMenunggu: PraktikBaik[];
  handleReviewBukti: (url?: string | null) => void;
  handleValidasiPraktik: (id: string, statusBaru: 'DISETUJUI' | 'DITOLAK') => void;
}

export default function TabValidasiPraktik({ 
  praktikMenunggu, 
  handleReviewBukti, 
  handleValidasiPraktik 
}: TabValidasiPraktikProps) {
  
  return (
    <div className="bg-slate-900/60 p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl border border-slate-800 animate-fade-in">
      <div className="border-b border-slate-800 pb-3">
        <h2 className="font-mono text-cyan-400 font-bold text-base flex items-center gap-2">
          <span>💡</span> ANTREAN VALIDASI PRAKTIK BAIK ({praktikMenunggu.length})
        </h2>
        <p className="text-xs text-slate-400 mt-0.5 font-mono">Tinjau kesesuaian karya sebelum dipublikasikan.</p>
      </div>
      
      {praktikMenunggu.length === 0 ? (
        <p className="text-xs text-slate-500 italic p-8 text-center font-mono">Tidak ada antrean karya inovasi saat ini.</p>
      ) : (
        praktikMenunggu.map(pb => (
          <div key={pb.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs group hover:border-cyan-500 transition-all">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 uppercase">[{pb.jenis_media}]</span>
                <span className="text-slate-300 font-bold">{pb.nama_sekolah}</span>
              </div>
              <strong className="text-white text-sm block">{pb.judul}</strong>
              <p className="text-slate-400 italic line-clamp-2">"{pb.deskripsi}"</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleReviewBukti(pb.media_url)} className="px-4 py-2.5 bg-slate-900 text-cyan-300 border border-cyan-500/30 rounded-xl font-bold cursor-pointer">👁️ Cek Karya</button>
              <button onClick={() => handleValidasiPraktik(pb.id, 'DISETUJUI')} className="px-5 py-2.5 bg-emerald-500 text-slate-950 font-black rounded-xl cursor-pointer">Setujui Karya</button>
              <button onClick={() => handleValidasiPraktik(pb.id, 'DITOLAK')} className="px-4 py-2.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl font-bold cursor-pointer">Tolak</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
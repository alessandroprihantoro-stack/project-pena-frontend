// Kita definisikan interface-nya di sini agar komponen ini mandiri
interface MasterSekolah {
  id: string;
  npsn: string;
  nama_sekolah: string;
  nama_kepala_sekolah?: string;
  logo_url?: string | null;
}

interface TabSekolahBinaanProps {
  listSekolahMaster: MasterSekolah[];
}

export default function TabSekolahBinaan({ listSekolahMaster }: TabSekolahBinaanProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-lg sm:text-xl font-black text-white font-mono flex items-center gap-2.5">
          <span className="text-blue-400 text-2xl">🏫</span> DAFTAR SEKOLAH BINAAN
        </h2>
        <p className="text-xs text-slate-400 mt-1">Daftar satuan pendidikan yang berada di bawah pengawasan dan binaan Anda.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {listSekolahMaster.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 font-mono italic bg-slate-950/50 rounded-2xl border border-slate-800">
            Belum ada data sekolah binaan yang terdaftar untuk Anda. Sedang memindai data... (Refresh jika perlu)
          </div>
        ) : (
          listSekolahMaster.map((sek, idx) => (
            <div key={sek.id || idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex items-center gap-4 hover:border-cyan-500/50 transition-all group shadow-md">
              {sek.logo_url ? (
                <img src={sek.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-cover border border-slate-700 bg-white p-1 shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">🏫</div>
              )}
              <div className="overflow-hidden w-full">
                <h3 className="font-bold text-white text-sm truncate group-hover:text-cyan-400 transition-colors" title={sek.nama_sekolah}>{sek.nama_sekolah}</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-1">NPSN: <span className="text-cyan-300 font-bold">{sek.npsn}</span></p>
                <div className="mt-2 pt-2 border-t border-slate-800/80">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Kepala Sekolah</p>
                  <p className="text-xs text-slate-300 truncate" title={sek.nama_kepala_sekolah}>{sek.nama_kepala_sekolah}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
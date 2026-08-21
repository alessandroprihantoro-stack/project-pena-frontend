import React, { useMemo } from 'react';

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

interface MasterSekolah {
  npsn: string;
  nama_sekolah: string;
  jenjang: string;
  kabupaten: string;
  kecamatan: string;
  total_rombel?: number; // 🌟 TAMBAHAN UNTUK KALKULASI ROMBEL
}

interface KurikulumItem {
  id?: number;
  sekolah: string;
  mapel: string;
  rombel: number;
  jp: number;
}

interface DashboardProps {
  allTeachers: TeacherData[];
  onToggleSecret: () => void;
  filterSekolah?: string;
  masterSekolahList?: MasterSekolah[];
  allKurikulum?: KurikulumItem[];
}

// =========================================================================
// 🚀 ENGINE KALKULATOR KURIKULUM BAKU (DI-COPY DARI LAPORAN KEPATUHAN)
// =========================================================================
const hitungKebutuhanIdeal = (jenjang: string, mapel: string, totalRombel: number): { ideal: number, kategori: string, toleransi: boolean } => {
    if (totalRombel === 0 || !mapel) return { ideal: 0, kategori: 'Umum', toleransi: false };
    
    const m = mapel.toUpperCase();
    
    // --- SLB ENGINE ---
    if (jenjang === 'SLB') {
        const isPKK = m.includes('KEBUTUHAN KHUSUS') || m.includes('NETRA') || m.includes('RUNGU') || m.includes('INTELEKTUAL') || m.includes('FISIK') || m.includes('MENTAL');
        const isKeterampilan = m.includes('KETERAMPILAN') || m.includes('TATA BOGA') || m.includes('TIK') || m.includes('OTOMOTIF');
        
        if (isPKK) return { ideal: Math.max(1, Math.ceil(totalRombel / 6)), kategori: 'Program Kebutuhan Khusus', toleransi: true };
        if (isKeterampilan) return { ideal: Math.ceil((25 * totalRombel) / 24), kategori: 'Kelompok Keterampilan', toleransi: false };
        return { ideal: Math.max(1, Math.ceil((2 * totalRombel) / 24)), kategori: 'Wajib Umum (2 JP)', toleransi: true };
    }

    // --- BK ENGINE ---
    if (m === 'BIMBINGAN KONSELING' || m === 'BK') {
        return { ideal: Math.ceil(totalRombel / 5), kategori: 'Layanan BK', toleransi: false };
    }

    // --- SMK ENGINE ---
    if (jenjang === 'SMK') {
        const mapelUmumSMK: Record<string, number> = {
            'PENDIDIKAN AGAMA ISLAM': 2.5, 'PENDIDIKAN AGAMA KRISTEN': 2.5, 'PENDIDIKAN AGAMA KATOLIK': 2.5, 'PENDIDIKAN AGAMA HINDU': 2.5, 'PENDIDIKAN AGAMA BUDDHA': 2.5,
            'PENDIDIKAN PANCASILA': 1.66, 'BAHASA INDONESIA': 2.83, 'PJOK': 1.66, 'SEJARAH': 1.33, 'SENI BUDAYA': 0.66,
            'MATEMATIKA': 2.5, 'BAHASA INGGRIS': 3, 'INFORMATIKA': 1, 'PROJEK IPAS': 1.66
        };

        if (mapelUmumSMK[m]) {
            return { ideal: Math.ceil((totalRombel * mapelUmumSMK[m]) / 24), kategori: 'Umum / Kejuruan Umum', toleransi: false };
        }
        if (m.includes('PKL') || m.includes('PRAKTIK KERJA LAPANGAN')) {
            return { ideal: Math.max(1, Math.ceil(totalRombel / 4)), kategori: 'Tugas Pembimbingan (Blok)', toleransi: true };
        }
        
        const estimasiJurusan = Math.max(1, Math.floor(totalRombel / 6));
        let idealProduktif = estimasiJurusan * 3; 
        if (totalRombel > 0 && totalRombel <= 12) idealProduktif = estimasiJurusan * 2; 
        return { ideal: Math.max(1, idealProduktif), kategori: 'Produktif / Kejuruan', toleransi: false };
    }

    // --- SMA ENGINE ---
    const mapelWajibSMA: Record<string, number> = {
        'PENDIDIKAN AGAMA ISLAM': 3, 'PENDIDIKAN AGAMA KRISTEN': 3, 'PENDIDIKAN AGAMA KATOLIK': 3, 'PENDIDIKAN AGAMA HINDU': 3, 'PENDIDIKAN AGAMA BUDDHA': 3,
        'PENDIDIKAN PANCASILA': 2, 'BAHASA INDONESIA': 4, 'MATEMATIKA': 4, 'BAHASA INGGRIS': 3, 'PJOK': 3, 'SENI BUDAYA': 2,
        'SEJARAH': 1.33, 'INFORMATIKA': 0.66
    };

    if (mapelWajibSMA[m]) {
        return { ideal: Math.ceil((totalRombel * mapelWajibSMA[m]) / 24), kategori: 'Wajib', toleransi: false };
    }
    
    return { ideal: Math.max(1, Math.ceil(totalRombel / 9)), kategori: 'Pilihan / Peminatan', toleransi: true }; 
};


// 🌟 HELPER UNTUK MENGHITUNG JP GURU (Termasuk Ekuivalensi BK)
const calculateBKEkuivalen = (inputVal: number): number => {
    if (inputVal === 0) return 0;
    if (inputVal <= 50) {
        if (inputVal >= 5) return 24 + ((inputVal - 5) * 2);
        else return Math.round((inputVal / 5) * 24);
    } else {
        if (inputVal >= 150) {
            const surplusSiswa = inputVal > 160 ? inputVal - 160 : 0;
            const surplusRombel = Math.floor(surplusSiswa / 32); 
            return 24 + (surplusRombel * 2);
        } else {
            return Math.round((inputVal / 160) * 24);
        }
    }
};

const getJamUtama = (t: TeacherData): number => {
    const isBK = t.bidangStudi?.toUpperCase().includes('KONSELING') || 
                 t.bidangStudi?.toUpperCase().includes('BIMBINGAN') || 
                 t.bidangStudi?.toUpperCase() === 'BK' || 
                 t.bidangStudi?.toUpperCase() === 'BP/BK';
    const jamRaw = Number(t.jamMengajar) || 0;
    return (isBK && jamRaw > 0) ? calculateBKEkuivalen(jamRaw) : jamRaw;
};


const DashboardStatistik: React.FC<DashboardProps> = ({ 
  allTeachers, 
  onToggleSecret,
  filterSekolah,
  masterSekolahList = [],
  allKurikulum = []
}) => {
  
  const totalGuru = allTeachers.length;
  
  // 🌟 STATE UNTUK METRIK GLOBAL
  let totalDefisitJP = 0;
  let totalOverloadJP = 0;

  const stats = allTeachers.reduce((acc, curr) => {
    // 1. Hitung Status Pegawai
    const status = curr.statusPegawai?.toUpperCase() || 'LAINNYA';
    if (status.includes('PNS')) acc.pns++;
    else if (status.includes('PARUH WAKTU')) acc.pppkParuh++;
    else if (status.includes('PPPK') || status.includes('P3K')) acc.pppk++;
    else acc.nonAsn++;

    // 2. Hitung Metrik Global Defisit & Overload
    const jam = getJamUtama(curr);
    if (jam > 0 && jam < 24) totalDefisitJP++;
    if (jam > 38) totalOverloadJP++;

    return acc;
  }, { pns: 0, pppk: 0, pppkParuh: 0, nonAsn: 0 });


  // =========================================================================
  // 🌟 ENGINE 2: MENGHITUNG KEKURANGAN & KELEBIHAN DETAIL PER MAPEL
  // =========================================================================
  const activeSchool = useMemo(() => {
     if (!filterSekolah || filterSekolah === 'Semua Sekolah') return null;
     return masterSekolahList.find(s => s.nama_sekolah.toUpperCase() === filterSekolah.toUpperCase()) || null;
  }, [filterSekolah, masterSekolahList]);

  const detailFormasi = useMemo(() => {
    if (!activeSchool) return null;

    const npsn = activeSchool.npsn;
    const jenjang = activeSchool.jenjang.toUpperCase();
    const totalRombel = activeSchool.total_rombel || 0;

    // 1. Kumpulkan mapel yang diinput di Editor Instansi Kurikulum
    const kurikulumSekolah = allKurikulum.filter(k => k.sekolah === npsn);
    const mapelDariKurikulum = new Set(kurikulumSekolah.map(k => k.mapel.toUpperCase()));

    // 2. Kumpulkan mapel yang ada gurunya di Buku Induk (tapi mungkin belum diinput di kurikulum)
    const guruSekolah = allTeachers.filter(t => t.sekolah?.toUpperCase() === activeSchool.nama_sekolah.toUpperCase());
    const mapelDariGuru = new Set(guruSekolah.map(t => t.bidangStudi.toUpperCase()).filter(m => m !== ''));

    // Gabungkan keduanya: Daftar mapel yang AKTIF di sekolah ini
    const activeMapels = Array.from(new Set([...mapelDariKurikulum, ...mapelDariGuru]));

    const defisitList: { mapel: string, qty: number }[] = [];
    const surplusList: { mapel: string, qty: number }[] = [];
    const idealList: string[] = [];

    let totalDefisitGlobal = 0;
    let totalSurplusGlobal = 0;

    activeMapels.forEach(mapelName => {
        if (!mapelName) return;

        // Hitung Kebutuhan via Permendikdasmen
        const kalkulasi = hitungKebutuhanIdeal(jenjang, mapelName, totalRombel);
        
        // Cek jumlah guru riil
        const guruRiil = guruSekolah.filter(t => t.bidangStudi.toUpperCase() === mapelName).length;
        
        const selisih = guruRiil - kalkulasi.ideal;

        // JIKA TOLERANSI (SLB/PKL), anggap ideal.
        if (kalkulasi.toleransi && selisih < 0) {
            idealList.push(mapelName);
            return;
        }

        if (selisih < 0) {
            defisitList.push({ mapel: mapelName, qty: Math.abs(selisih) });
            totalDefisitGlobal += Math.abs(selisih);
        } else if (selisih > 0) {
            surplusList.push({ mapel: mapelName, qty: selisih });
            totalSurplusGlobal += selisih;
        } else {
            idealList.push(mapelName);
        }
    });

    return { defisitList, surplusList, idealList, totalDefisitGlobal, totalSurplusGlobal, totalRombel };
  }, [activeSchool, allKurikulum, allTeachers]);


  return (
    <div className="mb-6">
      {/* 1. BAGIAN STATISTIK UTAMA (Selalu Tampil) */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl print:border-none print:shadow-none print:bg-transparent">
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

        {/* BARIS PERTAMA: Total Guru + 4 Status Kepegawaian */}
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

        {/* 🌟 BARIS KEDUA: KARTU METRIK DEFISIT & OVERLOAD GLOBAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 print:hidden">
            <div className="bg-linear-to-r from-rose-950/40 to-slate-900 border border-rose-800/50 p-5 rounded-xl shadow-inner flex justify-between items-center group hover:border-rose-500/50 transition-colors">
                <div>
                    <h3 className="text-xs font-black text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        ⚠️ Total Defisit Jam
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium leading-tight">Guru yang jam utamanya kurang dari 24 JP,<br/>potensial untuk dimutasi / diberi tugas tambahan.</p>
                </div>
                <div className="flex items-baseline gap-1 shrink-0 ml-4">
                    <span className="text-4xl font-black text-white group-hover:text-rose-300 transition-colors">{totalDefisitJP}</span>
                    <span className="text-[10px] text-rose-500 font-bold uppercase">Orang</span>
                </div>
            </div>

            <div className="bg-linear-to-r from-emerald-950/40 to-slate-900 border border-emerald-800/50 p-5 rounded-xl shadow-inner flex justify-between items-center group hover:border-emerald-500/50 transition-colors">
                <div>
                    <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                        🔥 Total Overload Jam
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium leading-tight">Guru yang beban kerjanya melebihi 38 JP,<br/>instansi ini butuh mutasi masuk guru baru.</p>
                </div>
                <div className="flex items-baseline gap-1 shrink-0 ml-4">
                    <span className="text-4xl font-black text-white group-hover:text-emerald-300 transition-colors">{totalOverloadJP}</span>
                    <span className="text-[10px] text-emerald-500 font-bold uppercase">Orang</span>
                </div>
            </div>
        </div>
      </div>

      {/* 2. KARTU PROFIL SEKOLAH & LAPORAN DETAIL FORMASI */}
      {activeSchool && detailFormasi && (
        <div className="mt-6 bg-slate-900 border border-slate-700 p-6 rounded-xl mb-6 shadow-xl relative overflow-hidden animate-fade-in-up print:bg-white print:border-black">
           
           <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
           
           <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
              <div className="flex-1">
                 <h2 className="text-2xl font-black text-white uppercase tracking-wider print:text-black">{activeSchool.nama_sekolah}</h2>
                 <div className="flex flex-wrap gap-2 mt-3 text-[10px] font-mono font-bold uppercase">
                    <span className="bg-slate-800 text-slate-300 border border-slate-600 px-3 py-1 rounded">NPSN: {activeSchool.npsn}</span>
                    <span className="bg-indigo-900/50 text-indigo-300 border border-indigo-600 px-3 py-1 rounded">{activeSchool.kabupaten}</span>
                    <span className="bg-sky-900/50 text-sky-300 border border-sky-600 px-3 py-1 rounded">KEC. {activeSchool.kecamatan}</span>
                    <span className={`px-3 py-1 rounded border ${detailFormasi.totalRombel > 0 ? 'bg-emerald-900/50 text-emerald-300 border-emerald-600' : 'bg-rose-900/50 text-rose-300 border-rose-600'}`}>
                        {detailFormasi.totalRombel > 0 ? `${detailFormasi.totalRombel} Rombel Aktif` : 'Data Rombel Kosong!'}
                    </span>
                 </div>
              </div>

              <div className="flex gap-4 self-stretch">
                  <div className="bg-emerald-950/20 border border-emerald-900 px-6 py-3 rounded-xl flex flex-col justify-center items-center min-w-32 shadow-inner">
                      <span className="text-[9px] font-bold text-emerald-500 uppercase mb-1">Total Kelebihan</span>
                      <div className="text-2xl font-black text-emerald-400">
                          {detailFormasi.totalSurplusGlobal} <span className="text-xs font-normal">Guru</span>
                      </div>
                  </div>
                  <div className="bg-rose-950/20 border border-rose-900 px-6 py-3 rounded-xl flex flex-col justify-center items-center min-w-32 shadow-inner">
                      <span className="text-[9px] font-bold text-rose-500 uppercase mb-1">Total Kekurangan</span>
                      <div className="text-2xl font-black text-rose-400">
                          {detailFormasi.totalDefisitGlobal} <span className="text-xs font-normal">Guru</span>
                      </div>
                  </div>
              </div>
           </div>

           {/* 🌟 RINCIAN MATA PELAJARAN 🌟 */}
           {detailFormasi.totalRombel > 0 ? (
               <div className="mt-6 pt-5 border-t border-slate-800 space-y-4 relative z-10 print:hidden">
                  
                  {detailFormasi.defisitList.length > 0 && (
                      <div>
                          <span className="text-xs font-bold text-rose-400 uppercase tracking-widest block mb-2">🔻 Kekurangan Pendidik:</span>
                          <div className="flex flex-wrap gap-2">
                              {detailFormasi.defisitList.map(d => (
                                  <span key={d.mapel} className="bg-rose-950/40 text-rose-300 border border-rose-800/80 px-2.5 py-1.5 rounded-lg text-xs font-medium shadow-sm hover:bg-rose-900/60 transition-colors cursor-default">
                                      {d.mapel} <strong className="ml-1 bg-rose-900 text-rose-200 px-1.5 py-0.5 rounded text-[10px]">- {d.qty}</strong>
                                  </span>
                              ))}
                          </div>
                      </div>
                  )}

                  {detailFormasi.surplusList.length > 0 && (
                      <div>
                          <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-2 mt-4">⚠️ Kelebihan Pendidik:</span>
                          <div className="flex flex-wrap gap-2">
                              {detailFormasi.surplusList.map(s => (
                                  <span key={s.mapel} className="bg-amber-950/40 text-amber-300 border border-amber-800/80 px-2.5 py-1.5 rounded-lg text-xs font-medium shadow-sm hover:bg-amber-900/60 transition-colors cursor-default">
                                      {s.mapel} <strong className="ml-1 bg-amber-900 text-amber-200 px-1.5 py-0.5 rounded text-[10px]">+ {s.qty}</strong>
                                  </span>
                              ))}
                          </div>
                      </div>
                  )}

                  {detailFormasi.idealList.length > 0 && (
                      <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 mt-4">✅ Mapel Terpenuhi / Ideal / Toleransi:</span>
                          <div className="flex flex-wrap gap-1.5">
                              {detailFormasi.idealList.map(m => (
                                  <span key={m} className="text-[10px] text-slate-400 bg-slate-800/50 border border-slate-700/50 px-2 py-1 rounded cursor-default">
                                      {m}
                                  </span>
                              ))}
                          </div>
                      </div>
                  )}

               </div>
           ) : (
               <div className="mt-6 pt-5 border-t border-slate-800 relative z-10 print:hidden text-center">
                   <span className="text-xs text-rose-500 font-bold bg-rose-950/30 px-4 py-2 rounded-full border border-rose-900/50">
                       ⚠️ Silakan lengkapi "Data Total Rombel" di menu Editor Instansi agar Rincian Kebutuhan dapat dihitung sistem.
                   </span>
               </div>
           )}

        </div>
      )}
    </div>
  );
};

export default DashboardStatistik;
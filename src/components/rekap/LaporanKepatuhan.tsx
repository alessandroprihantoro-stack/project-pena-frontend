import React, { useState } from 'react';
import { TeacherData } from './DashboardStatistik';
import { ProcessedData } from './PanelAnalisis';

export interface ExtendedTeacherData extends TeacherData {
    is_rekomendasi_internal?: boolean;
    alasanRekomendasi?: string;
    tugasNonLinier?: string; 
    tugasNonLinier2?: string; 
}

export interface MasterSekolah {
  npsn: string;
  nama_sekolah: string;
  jenjang: string;
  kabupaten: string;
  kecamatan: string;
  total_rombel?: number; 
}

export interface KurikulumItem {
  id?: number;
  sekolah?: string;
  npsn?: string;
  mapel: string;
  kategori_mapel?: string;
  rombel: number;
  rombel_gabungan?: number;
  jp: number;
  jp_p5?: number;
}

interface LaporanProps {
  showLaporan: boolean;
  setShowLaporan: (val: boolean) => void;
  allTeachers: ExtendedTeacherData[];
  spreadsheetData?: ProcessedData[]; 
  masterSekolahList?: MasterSekolah[]; 
  allKurikulum?: KurikulumItem[]; 
  onTeacherClick: (t: ExtendedTeacherData) => void;
}

const getJenjangGlobal = (namaSekolah: string): string => {
    if (!namaSekolah) return 'SMA';
    const upper = namaSekolah.toUpperCase();
    if (upper.includes('SMK')) return 'SMK';
    if (upper.includes('SLB')) return 'SLB';
    return 'SMA'; 
};

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

const getJamUtama = (t: ExtendedTeacherData): number => {
    const isBK = t.bidangStudi?.toUpperCase().includes('KONSELING') || 
                 t.bidangStudi?.toUpperCase().includes('BIMBINGAN') || 
                 t.bidangStudi?.toUpperCase() === 'BK' || 
                 t.bidangStudi?.toUpperCase() === 'BP/BK';
    
    const jamRaw = Number(t.jamMengajar) || 0;
    return (isBK && jamRaw > 0) ? calculateBKEkuivalen(jamRaw) : jamRaw;
};

const LaporanKepatuhan: React.FC<LaporanProps> = ({ 
  showLaporan, 
  setShowLaporan, 
  allTeachers = [], 
  spreadsheetData = [], 
  masterSekolahList = [], 
  allKurikulum = [],
  onTeacherClick 
}) => {
  const [filterWilayah, setFilterWilayah] = useState<string>('SEMUA');
  const [activeTab, setActiveTab] = useState<'INDIVIDU' | 'AUDIT_KURIKULUM'>('INDIVIDU');
  const [auditSekolah, setAuditSekolah] = useState<string>('');

  if (!showLaporan) return null;

  const nonCompliantTeachers = allTeachers.filter(t => {
      if (t.is_rekomendasi_internal) return true;

      const jam = getJamUtama(t); 
      const isSLB = getJenjangGlobal(t.sekolah || '') === 'SLB';
      if (isSLB && jam > 0 && jam < 24) return false; 
      
      return (jam > 0 && jam < 24) || jam > 38;
  });

  const filteredTeachers = filterWilayah === 'SEMUA' 
      ? nonCompliantTeachers 
      : nonCompliantTeachers.filter(t => t.kabupaten === filterWilayah);

  filteredTeachers.sort((a, b) => {
      // Prioritas 1: Rekomendasi Internal Pengawas
      const aRek = a.is_rekomendasi_internal ? 1 : 0;
      const bRek = b.is_rekomendasi_internal ? 1 : 0;
      
      if (bRek !== aRek) {
          return bRek - aRek;
      }

      // Prioritas 2: Total Jam paling sedikit (Paling Kritis)
      const jamA = getJamUtama(a);
      const jamB = getJamUtama(b);
      
      return jamA - jamB; 
  });

  const countDefisit = filteredTeachers.filter(t => {
      const jam = getJamUtama(t);
      return jam > 0 && jam < 24;
  }).length;
  
  const countOverload = filteredTeachers.filter(t => {
      const jam = getJamUtama(t);
      return jam > 38;
  }).length;

  const getRekomendasiTerdekat = (teacher: ExtendedTeacherData, jam: number) => {
      if (!teacher.bidangStudi) return <span className="text-slate-500 italic">Data mapel kosong</span>;

      const needySchools = spreadsheetData.filter(d => {
          if (!d.mapel) return false;
          const entry = Object.entries(d.mapel).find(([key]) => key.toUpperCase() === teacher.bidangStudi!.toUpperCase());
          const butuh = entry ? entry[1].kurang : 0;
          return butuh > 0 && d.sekolah !== teacher.sekolah;
      });

      if (needySchools.length === 0) {
          return <span className="text-rose-400 print:text-red-600 italic text-[10px]">Belum ada instansi yang kekurangan mapel ini.</span>;
      }

      needySchools.sort((a, b) => {
          const aKecMatch = a.kecamatan === teacher.kecamatan;
          const bKecMatch = b.kecamatan === teacher.kecamatan;
          if (aKecMatch !== bKecMatch) return aKecMatch ? -1 : 1;
          const aKabMatch = a.kabupaten === teacher.kabupaten;
          const bKabMatch = b.kabupaten === teacher.kabupaten;
          if (aKabMatch !== bKabMatch) return aKabMatch ? -1 : 1;
          return 0;
      });

      const topTarget = needySchools[0];
      const isSatuKecamatan = topTarget.kecamatan && topTarget.kecamatan === teacher.kecamatan;
      const entryTarget = Object.entries(topTarget.mapel).find(([key]) => key.toUpperCase() === teacher.bidangStudi!.toUpperCase());
      const butuhBerapa = entryTarget ? entryTarget[1].kurang : 0;
      
      const actionText = jam < 24 ? "Tambah Jam ke" : "Mutasi ke";

      return (
          <div className="flex flex-col">
              <span className="font-bold text-indigo-300 print:text-blue-800">
                  {actionText}: {topTarget.sekolah}
              </span>
              <div className="flex items-center gap-1 mt-1">
                  {isSatuKecamatan ? (
                      <span className="bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded text-[9px] font-bold border border-emerald-500 print:border-none print:text-green-700">🌟 SATU KECAMATAN</span>
                  ) : (
                      <span className="text-[9px] text-slate-400 print:text-gray-600">Kec. {topTarget.kecamatan || '-'}</span>
                  )}
                  <span className="text-[9px] text-amber-400 print:text-orange-600">(Butuh {butuhBerapa} Guru)</span>
              </div>
          </div>
      );
  };

  const auditSekolahMaster = masterSekolahList?.find(s => s.nama_sekolah.toUpperCase() === auditSekolah.toUpperCase());
  const auditJenjang = auditSekolahMaster ? auditSekolahMaster.jenjang.toUpperCase() : 'SMA';
  const totalRombelValid = auditSekolahMaster?.total_rombel || 0; 
  const klasifikasiUkuran = totalRombelValid === 0 ? 'Belum Diatur' : (totalRombelValid <= 12 ? 'Kecil' : (totalRombelValid <= 21 ? 'Menengah' : 'Besar'));

  const mapelKurikulum = allKurikulum?.filter(k => k.sekolah?.toUpperCase() === auditSekolah.toUpperCase()) || [];
  const uniqueMapels = Array.from(new Set([...mapelKurikulum.map(k => k.mapel.toUpperCase())])).filter(m => m !== '').sort();

  return (
    <div className="bg-slate-800 p-6 rounded-xl border-2 border-rose-500 shadow-2xl mb-6 animate-fade-in-up print:bg-white print:border-none print:shadow-none print:p-0">
      
      <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4 print:hidden">
          <div>
              <h2 className="text-xl font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">⚠️ Laporan Kepatuhan & Audit Kurikulum</h2>
              <p className="text-xs text-slate-400 mt-1">Sistem Evaluasi Ganda: Kepatuhan Individu (Beban Mengajar Utama) & Audit Kurikulum Presisi (Beban Maks 38 JP).</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="text-xs bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded font-bold transition-colors shadow-lg">🖨️ CETAK LAPORAN</button>
            <button onClick={() => setShowLaporan(false)} className="text-xs text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded font-bold transition-colors">Tutup Panel</button>
          </div>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-700 print:hidden">
          <button 
            onClick={() => setActiveTab('INDIVIDU')} 
            className={`px-6 py-2 rounded-t-lg font-bold text-sm transition-colors ${activeTab === 'INDIVIDU' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-700'}`}
          >
            1. Kepatuhan Beban Individu
          </button>
          <button 
            onClick={() => setActiveTab('AUDIT_KURIKULUM')} 
            className={`px-6 py-2 rounded-t-lg font-bold text-sm transition-colors ${activeTab === 'AUDIT_KURIKULUM' ? 'bg-fuchsia-600 text-white' : 'bg-slate-900 text-slate-400 hover:bg-slate-700'}`}
          >
            2. Audit Kurikulum Presisi
          </button>
      </div>

      {activeTab === 'INDIVIDU' && (
        <div className="animate-fade-in">
          <div className="mb-6 bg-slate-900/50 p-4 rounded-xl border border-slate-700 print:hidden">
              <label className="block text-sm font-bold text-slate-300 mb-2">Pilih Lingkup Wilayah Laporan:</label>
              <select className="w-full max-w-md bg-slate-950 border border-rose-600/50 text-slate-200 rounded-lg px-4 py-2 text-sm outline-none focus:border-rose-400 shadow-inner" value={filterWilayah} onChange={(e) => setFilterWilayah(e.target.value)}>
                  <option value="SEMUA">🌐 Semua Wilayah (Cabdin VI)</option>
                  <option value="Karanganyar">Kabupaten Karanganyar</option>
                  <option value="Sragen">Kabupaten Sragen</option>
                  <option value="Wonogiri">Kabupaten Wonogiri</option>
              </select>
          </div>

          <div className="hidden print:block text-center mb-6">
              <h1 className="text-xl font-bold uppercase">Laporan Evaluasi Pemenuhan Beban Mengajar Pendidik</h1>
              <p className="text-sm mt-1">
                  Lingkup Wilayah: <strong>{filterWilayah === 'SEMUA' ? 'Cabang Dinas Pendidikan Wilayah VI' : `Kabupaten ${filterWilayah}`}</strong>
              </p>
              <hr className="mt-4 border-2 border-black" />
          </div>

          <div className="flex flex-wrap gap-4 mb-6 print:hidden">
              <div className="bg-slate-900 border border-slate-700 px-4 py-3 rounded-lg flex-1 text-center shadow-inner">
                  <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Pendidik Dalam Daftar</span>
                  <span className="text-3xl font-black text-white">{filteredTeachers.length}</span>
              </div>
              <div className="bg-rose-950/30 border border-rose-900/50 px-4 py-3 rounded-lg flex-1 text-center shadow-inner">
                  <span className="text-xs font-bold text-rose-400 uppercase block mb-1">Defisit Jam (&lt; 24 JP)</span>
                  <span className="text-3xl font-black text-rose-300">{countDefisit}</span>
              </div>
              <div className="bg-amber-950/30 border border-amber-900/50 px-4 py-3 rounded-lg flex-1 text-center shadow-inner">
                  <span className="text-xs font-bold text-amber-400 uppercase block mb-1">Overload (&gt; 38 JP)</span>
                  <span className="text-3xl font-black text-amber-300">{countOverload}</span>
              </div>
          </div>

          {filteredTeachers.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-slate-700 print:text-black print:border-none">
                  <span className="text-4xl block mb-2">🎉</span>
                  <h3 className="text-lg font-bold text-emerald-400 print:text-black">Semua Aman & Terkendali!</h3>
                  <p className="text-slate-400 text-sm print:text-gray-600">Seluruh pendidik di lingkup ini telah memenuhi syarat beban mengajar utama (pengecualian SLB diterapkan otomatis).</p>
              </div>
          ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-700 print:border-black" style={{ scrollbarWidth: 'thin' }}>
                  <table className="w-full text-left text-xs border-collapse print:text-[10px]">
                      <thead className="bg-slate-950 text-rose-400 text-center print:bg-gray-200 print:text-black">
                          <tr>
                              <th className="p-3 border border-slate-700 print:border-black w-10">No</th>
                              <th className="p-3 border border-slate-700 print:border-black min-w-40">Nama Pendidik</th>
                              <th className="p-3 border border-slate-700 print:border-black min-w-40">Asal Sekolah</th>
                              <th className="p-3 border border-slate-700 print:border-black min-w-32">Mata Pelajaran</th>
                              <th className="p-3 border border-slate-700 print:border-black min-w-48">Alamat Domisili</th>
                              <th className="p-3 border border-slate-700 print:border-black text-indigo-300 min-w-56">Rekomendasi Mutasi / Tambah Jam Terdekat</th>
                              <th className="p-3 border border-slate-700 print:border-black min-w-32">Keterangan</th>
                          </tr>
                      </thead>
                      <tbody>
                          {filteredTeachers.map((t, idx) => {
                              const jam = getJamUtama(t); 
                              const isDefisit = jam < 24;
                              const isOverload = jam > 38;

                              // 🌟 Cek Total Jam Gabungan (Utama + Tambahan)
                              const totalBebanGabungan = Number(t.totalJam) || 0;
                              const isTotalDefisitKritis = totalBebanGabungan > 0 && totalBebanGabungan < 24;

                              // 🌟 Setup class untuk background baris (Prioritas Visual)
                              let rowClass = `border-b hover:bg-slate-800/50 print:border-black transition-colors `;
                              if (t.is_rekomendasi_internal) {
                                  rowClass += `bg-amber-900/10 border-slate-700/50`;
                              } else if (isTotalDefisitKritis) {
                                  rowClass += `bg-rose-950/20 border-rose-900/30`; // Background merah transparan
                              } else {
                                  rowClass += `border-slate-700/50`;
                              }

                              return (
                                  <tr key={t.id} className={rowClass}>
                                      <td className="p-2 border border-slate-700/50 print:border-black text-center text-slate-400 print:text-black">{idx + 1}</td>
                                      
                                      <td className="p-2 border border-slate-700/50 print:border-black cursor-pointer hover:text-amber-400" onClick={() => onTeacherClick(t)}>
                                          <strong className="text-slate-200 print:text-black block text-sm">{t.nama}</strong>
                                          <span className="text-[10px] text-cyan-400 print:text-gray-600">{t.statusPegawai}</span>
                                          
                                          {t.is_rekomendasi_internal && (
                                              <span className="text-[9px] text-amber-400 font-black uppercase mt-1.5 block leading-tight border-t border-amber-900/50 pt-1.5">
                                                  🌟 Prioritas Mutasi <br/>
                                                  {t.alasanRekomendasi && <span className="text-[8px] text-amber-200 font-normal italic normal-case">"{t.alasanRekomendasi}"</span>}
                                              </span>
                                          )}

                                          {/* 🌟 TANDA PERINGATAN KRITIS: TOTAL JAM GABUNGAN < 24 */}
                                          {isTotalDefisitKritis && (
                                              <span className="text-[9px] text-rose-400 font-black uppercase mt-1.5 block leading-tight border-t border-rose-900/50 pt-1.5 animate-pulse print:text-red-600 print:border-red-600">
                                                  🚨 Total Beban Masih {totalBebanGabungan} JP
                                              </span>
                                          )}
                                      </td>
                                      
                                      <td className="p-2 border border-slate-700/50 print:border-black text-slate-300 print:text-black">{t.sekolah}</td>
                                      
                                      <td className="p-2 border border-slate-700/50 print:border-black text-emerald-300 print:text-black font-medium">
                                          {t.tugasMengajar || t.bidangStudi || '-'}
                                      </td>

                                      <td className="p-2 border border-slate-700/50 print:border-black text-slate-400 print:text-black italic">
                                          {t.alamat || '-'}
                                          <div className="text-[9px] text-fuchsia-300 font-bold mt-1">Kec. {t.kecamatan || 'Kosong'}</div>
                                      </td>
                                      
                                      <td className="p-2 border border-slate-700/50 print:border-black bg-slate-900/30 print:bg-transparent">
                                          {getRekomendasiTerdekat(t, jam)}
                                      </td>
                                      
                                      <td className="p-2 border border-slate-700/50 print:border-black text-center">
                                          <div className={`px-2 py-1 rounded font-bold text-[10px] inline-block border print:border-none 
                                              ${isDefisit ? 'bg-rose-900/50 text-rose-300 border-rose-600 print:text-red-600' : 
                                                isOverload ? 'bg-amber-900/50 text-amber-300 border-amber-600 print:text-orange-600' : 
                                                'bg-blue-900/50 text-blue-300 border-blue-600 print:text-blue-600'}`}>
                                              Jam Utama: {jam} JP
                                          </div>
                                          <div className="text-[9px] text-slate-400 print:text-gray-600 mt-1 font-bold">
                                              {isDefisit ? `Defisit -${24 - jam} JP` : isOverload ? `Kelebihan +${jam - 38} JP` : 'Jam Ideal (Rekomendasi Manual)'}
                                          </div>
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
          )}
        </div>
      )}

      {activeTab === 'AUDIT_KURIKULUM' && (
        <div className="animate-fade-in">
           <div className="mb-6 bg-fuchsia-950/30 p-5 rounded-xl border border-fuchsia-700 print:hidden shadow-inner">
              <label className="flex text-sm font-bold text-fuchsia-300 mb-2 items-center gap-2">
                  <span>🔬</span> Pilih Instansi untuk Audit Kurikulum:
              </label>
              <select className="w-full max-w-md bg-slate-900 border border-fuchsia-500/50 text-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-fuchsia-400 shadow-md transition-all" value={auditSekolah} onChange={(e) => setAuditSekolah(e.target.value)}>
                 <option value="">-- Pilih Sekolah --</option>
                 {masterSekolahList?.map(d => <option key={d.nama_sekolah} value={d.nama_sekolah}>{d.nama_sekolah}</option>)}
              </select>

              {auditSekolah && (
                  <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono">
                      <span className="bg-slate-900 px-3 py-1.5 rounded-md border border-slate-700">Jenjang: <strong className="text-cyan-400">{auditJenjang}</strong></span>
                      <span className="bg-slate-900 px-3 py-1.5 rounded-md border border-slate-700">Skala Instansi: <strong className="text-amber-400">{klasifikasiUkuran}</strong></span>
                      <span className="bg-slate-900 px-3 py-1.5 rounded-md border border-emerald-700/50">
                          Total Rombel Aktif: <strong className={totalRombelValid > 0 ? "text-emerald-400" : "text-rose-400"}>{totalRombelValid}</strong>
                      </span>
                  </div>
              )}
          </div>

          {auditSekolah && totalRombelValid === 0 && (
             <div className="text-center py-10 bg-rose-950/30 rounded-xl border border-rose-800">
                <p className="text-rose-400 font-bold text-lg">⚠️ Data Rombel Kosong!</p>
                <p className="text-slate-400 text-sm mt-2">Mohon lengkapi profil "Total Rombel" di menu <strong>Editor Instansi</strong> terlebih dahulu agar kalkulator dapat bekerja.</p>
             </div>
          )}

          {auditSekolah && totalRombelValid > 0 && (
              <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                  <div className="p-4 bg-fuchsia-900/40 border-b border-slate-700 flex justify-between items-center print:bg-gray-200">
                      <h3 className="font-black text-fuchsia-300 text-lg uppercase tracking-wider print:text-black">Laporan Audit Formasi Presisi</h3>
                      <span className="text-[10px] text-fuchsia-200 bg-fuchsia-950 border border-fuchsia-600 px-2 py-1 rounded hidden md:block">Metode Kapasitas Beban Maksimal (38 JP)</span>
                  </div>
                  
                  <div className="overflow-x-auto p-4">
                      {uniqueMapels.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 italic">Sekolah ini belum mengisi Struktur Kurikulum di Pusat Manajemen Pendidik.</div>
                      ) : (
                      <table className="w-full text-left text-[11px] border-collapse">
                          <thead className="bg-slate-800 text-slate-300">
                              <tr>
                                  <th className="p-3 border border-slate-700 min-w-48">Mata Pelajaran (Sesuai Kurikulum)</th>
                                  <th className="p-3 border border-slate-700 text-center">Total JP<br/>Sekolah</th>
                                  <th className="p-3 border border-slate-700 text-center text-cyan-300 bg-cyan-950/30">Standar Ideal<br/>(24 JP/Guru)</th>
                                  <th className="p-3 border border-slate-700 text-center text-rose-300 bg-rose-950/30">Jumlah Minimal Guru<br/>(Beban Maks 38 JP)</th>
                                  <th className="p-3 border border-slate-700 text-center text-amber-300 bg-amber-950/30">Guru Riil<br/>(Buku Induk)</th>
                                  <th className="p-3 border border-slate-700 min-w-40 text-center">Status Audit Presisi</th>
                              </tr>
                          </thead>
                          <tbody>
                              {uniqueMapels.map((mapelName) => {
                                  const kItem = mapelKurikulum.find(k => k.mapel.toUpperCase() === mapelName);
                                  let totalJP = 0;
                                  
                                  if (kItem && kItem.rombel > 0) {
                                      if (auditJenjang === 'SMA' || auditJenjang === 'SMK') {
                                          totalJP = (kItem.rombel * (kItem.jp || 0)) + (kItem.rombel * (kItem.jp_p5 || 0));
                                      } else if (auditJenjang === 'SLB') {
                                          const effRombel = kItem.rombel_gabungan && kItem.rombel_gabungan > 0 ? kItem.rombel_gabungan : kItem.rombel;
                                          totalJP = effRombel * (kItem.jp || 0);
                                      } else {
                                          totalJP = kItem.rombel * (kItem.jp || 0);
                                      }
                                  }

                                  const idealGuru = Math.ceil(totalJP / 24);
                                  const batasMinGuru = Math.ceil(totalJP / 38);
                                  
                                  const listGuruRiil = allTeachers.filter(t => t.sekolah?.toUpperCase() === auditSekolah.toUpperCase() && 
                                      (t.tugasMengajar?.toUpperCase() === mapelName || 
                                       t.bidangStudi?.toUpperCase() === mapelName ||
                                       t.tugasNonLinier?.toUpperCase() === mapelName ||
                                       t.tugasNonLinier2?.toUpperCase() === mapelName) 
                                  );
                                  const jumlahGuruRiil = listGuruRiil.length;

                                  const totalBebanRiil = listGuruRiil.reduce((acc, curr) => acc + (Number(curr.totalJam) || 0), 0);

                                  let statusClass: string;
                                  let statusText: string;
                                  
                                  const isPengecualian = auditJenjang === 'SLB' || mapelName.includes('PILIHAN') || mapelName.includes('KETERAMPILAN') || mapelName.includes('PKL') || totalJP === 0;

                                  if (isPengecualian) {
                                      statusClass = "bg-slate-800 text-slate-400 border border-slate-600";
                                      statusText = "Toleransi / Khusus";
                                  } else if (jumlahGuruRiil < batasMinGuru) {
                                      statusClass = "bg-rose-900/80 text-rose-200 border border-rose-500 font-black animate-pulse shadow-[0_0_10px_rgba(225,29,72,0.5)]";
                                      statusText = `🔴 DEFISIT KRITIS (-${batasMinGuru - jumlahGuruRiil})`;
                                  } else if (jumlahGuruRiil >= batasMinGuru && jumlahGuruRiil < idealGuru) {
                                      statusClass = "bg-amber-900/80 text-amber-200 border border-amber-500 font-bold";
                                      statusText = `🟡 AMAN (Beban 24-38 JP)`;
                                  } else if (jumlahGuruRiil === idealGuru) {
                                      statusClass = "bg-blue-900/60 text-blue-300 border border-blue-500 font-black";
                                      statusText = `🟢 IDEAL (~24 JP)`;
                                  } else if (jumlahGuruRiil > idealGuru) {
                                      statusClass = "bg-emerald-900/60 text-emerald-300 border border-emerald-500 font-bold";
                                      statusText = `🟠 SURPLUS GURU (+${jumlahGuruRiil - idealGuru})`;
                                  } else {
                                      statusClass = "bg-slate-800 text-slate-400";
                                      statusText = "Tidak Terdeteksi";
                                  }

                                  return (
                                      <tr key={mapelName} className="border-b border-slate-700/50 hover:bg-slate-800/80 transition-colors">
                                          <td className="p-3 border border-slate-700/50">
                                              <strong className="text-slate-200 text-[12px] block">{mapelName}</strong>
                                              <span className="text-[9px] text-slate-500">{kItem?.kategori_mapel || 'Sesuai Input Kurikulum'}</span>
                                          </td>
                                          <td className="p-3 border border-slate-700/50 text-center font-bold text-slate-300 text-sm">{totalJP > 0 ? totalJP : '-'}</td>
                                          <td className="p-3 border border-slate-700/50 text-center font-black text-cyan-400 text-sm bg-cyan-950/10">{totalJP > 0 ? idealGuru : '-'}</td>
                                          <td className="p-3 border border-slate-700/50 text-center font-black text-rose-400 text-sm bg-rose-950/10">{totalJP > 0 ? batasMinGuru : '-'}</td>
                                          
                                          <td className="p-3 border border-slate-700/50 text-center bg-amber-950/10">
                                              <span className="font-black text-amber-400 text-sm block">{jumlahGuruRiil} Guru</span>
                                              {jumlahGuruRiil > 0 && <span className="text-[9px] text-amber-200/70 italic">(Membawa beban {totalBebanRiil} JP)</span>}
                                          </td>
                                          
                                          <td className="p-3 border border-slate-700/50 text-center">
                                              <span className={`px-2 py-1.5 rounded text-[10px] inline-block min-w-36 ${statusClass}`}>
                                                  {statusText}
                                              </span>
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                      </table>
                      )}
                  </div>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LaporanKepatuhan;
/* eslint-disable */
// @ts-nocheck

import React, { useState } from 'react';

export interface KlasemenItem {
  nama: string;
  npsn: string;
  kepala: string;
  logo: string | null;
  trofi: number;
  pts: number;
  tka_score: number;
  cabang_dinas?: string;
  kabupaten_kota?: string;
}

export interface PraktikBaik {
  id: string; user_id: string; sekolah_id: string; judul: string; deskripsi: string; jenis_media: string; media_url: string; status_validasi: string; created_at: string; nama_sekolah?: string; npsn?: string;
  kategori_program?: string;
  capaian_hasil?: string;
  tanggal_pelaksanaan?: string;
}

// 🗺️ PEMETAAN DATA CABANG DINAS UNTUK FILTER
const DATA_WILAYAH = {
  "Cabang Dinas Wilayah I": ["Kabupaten Semarang", "Kota Salatiga", "Kabupaten Demak"],
  "Cabang Dinas Wilayah II": ["Kota Semarang", "Kabupaten Kendal"],
  "Cabang Dinas Wilayah III": ["Kabupaten Jepara", "Kabupaten Pati", "Kabupaten Kudus"],
  "Cabang Dinas Wilayah IV": ["Kabupaten Grobogan", "Kabupaten Blora", "Kabupaten Rembang"],
  "Cabang Dinas Wilayah V": ["Kabupaten Boyolali", "Kabupaten Klaten"],
  "Cabang Dinas Wilayah VI": ["Kabupaten Wonogiri", "Kabupaten Karanganyar", "Kabupaten Sragen"],
  "Cabang Dinas Wilayah VII": ["Kota Surakarta", "Kabupaten Sukoharjo"],
  "Cabang Dinas Wilayah VIII": ["Kota Magelang", "Kabupaten Magelang", "Kabupaten Temanggung"],
  "Cabang Dinas Wilayah IX": ["Kabupaten Wonosobo", "Kabupaten Banjarnegara", "Kabupaten Kebumen", "Kabupaten Purworejo"],
  "Cabang Dinas Wilayah X": ["Kabupaten Cilacap", "Kabupaten Purbalingga", "Kabupaten Banyumas"],
  "Cabang Dinas Wilayah XI": ["Kabupaten Brebes", "Kabupaten Tegal", "Kota Tegal"],
  "Cabang Dinas Wilayah XII": ["Kabupaten Pemalang", "Kabupaten Pekalongan", "Kabupaten Batang", "Kota Pekalongan"]
};

// 🎯 OPSI DROPDOWN
const OPSI_KATEGORI_PRESTASI = [
  "Semua", "Akademik", "Non Akademik", "Olahraga", "Seni",
  "Keagamaan", "Pramuka", "PMR", "Paskibra", "Teknologi",
  "Kewirausahaan", "Lingkungan", "Guru", "Kepala Sekolah", "Sekolah"
];

const OPSI_JENIS_PRESTASI = [
  "Semua", "OSN", "OPSI", "O2SN", "POPDA", "POPPROV",
  "POPNAS", "GSI", "FLS3N", "FIKSI", "LDBI", "NSDC",
  "KSM", "MTQ", "Adiwiyata", "Sekolah Sehat", "GTK Award",
  "Guru Berprestasi", "Kepala Sekolah Berprestasi", "Kejurkab", "Kejurprov"
];

interface TabShowcaseProps {
  filterKategori: 'SEMUA' | 'LOMBA' | 'LULUSAN' | 'TKA';
  setFilterKategori: (val: 'SEMUA' | 'LOMBA' | 'LULUSAN' | 'TKA') => void;
  // 🌟 PROPS BARU DARI INDUK
  pilihKategoriPrestasi: string;
  setPilihKategoriPrestasi: (val: string) => void;
  pilihJenisPrestasi: string;
  setPilihJenisPrestasi: (val: string) => void;
  
  papanDataUtuh: KlasemenItem[];
  tampilSemuaSekolah: boolean;
  setTampilSemuaSekolah: (val: boolean) => void;
  inovasiDitampilkan: PraktikBaik[];
  inovasiTotal: number;
  tampilSemuaInovasi: boolean;
  setTampilSemuaInovasi: (val: boolean) => void;
  renderKaryaPengawasCard: (karya: PraktikBaik) => any;
}

export default function TabShowcase({
  filterKategori, setFilterKategori,
  pilihKategoriPrestasi, setPilihKategoriPrestasi,
  pilihJenisPrestasi, setPilihJenisPrestasi,
  papanDataUtuh, tampilSemuaSekolah, setTampilSemuaSekolah,
  inovasiDitampilkan, inovasiTotal, tampilSemuaInovasi, setTampilSemuaInovasi,
  renderKaryaPengawasCard
}: TabShowcaseProps) {
  
  // State Filter Wilayah 3 Tingkat
  const [tingkatWilayah, setTingkatWilayah] = useState<'PROVINSI' | 'CABDIN' | 'KABKOTA'>('PROVINSI');
  const [pilihCabdin, setPilihCabdin] = useState('');
  const [pilihKabKota, setPilihKabKota] = useState('');

  // 🧠 LOGIKA PENYARINGAN CERDAS (Hanya memproses Wilayah)
  let dataTerfilter = [...(papanDataUtuh || [])];

  if (tingkatWilayah === 'CABDIN' && pilihCabdin) {
    dataTerfilter = dataTerfilter.filter(s => s.cabang_dinas === pilihCabdin);
  } else if (tingkatWilayah === 'KABKOTA' && pilihKabKota) {
    dataTerfilter = dataTerfilter.filter(s => s.kabupaten_kota === pilihKabKota);
  }

  // Hitung ulang peringkat setelah filter wilayah
  dataTerfilter.forEach((item, idx) => {
    item.peringkat = idx + 1;
  });

  const klasemenDitampilkan = tampilSemuaSekolah ? dataTerfilter : dataTerfilter.slice(0, 5);
  const daftarKabKota = pilihCabdin ? DATA_WILAYAH[pilihCabdin as keyof typeof DATA_WILAYAH] || [] : [];

  return (
    <div className="space-y-12 animate-fade-in">
      
      {/* SEKSI 1: PAPAN KLASEMEN */}
      <div className="bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="flex flex-col xl:flex-row items-start justify-between border-b border-slate-800 pb-5 mb-6 gap-4">
          <div>
            <h2 className="text-xl font-black text-amber-400 font-mono flex items-center gap-2">🏆 PAPAN KLASEMEN BINAAN</h2>
            <p className="text-xs text-slate-400 mt-1">Peringkat poin klasemen tertinggi & nilai TKA sekolah binaan Anda.</p>
          </div>
          
          {/* 🌟 FILTER GABUNGAN: SUMBER, KATEGORI, JENIS */}
          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value as 'SEMUA' | 'LOMBA' | 'LULUSAN' | 'TKA')}
              className="p-2 text-xs rounded-xl border-2 font-bold cursor-pointer outline-none bg-amber-500/20 border-amber-500 text-white shadow-sm"
            >
              <option value="SEMUA">Semua Sumber</option>
              <option value="LOMBA">Lomba</option>
              <option value="LULUSAN">Lulusan</option>
              <option value="TKA">TKA</option>
            </select>

            <div className={`flex gap-3 transition-opacity duration-300 ${(filterKategori === "TKA" || filterKategori === "LULUSAN") ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
              <select
                value={pilihKategoriPrestasi}
                onChange={(e) => setPilihKategoriPrestasi(e.target.value)}
                className="p-2 text-xs rounded-xl border border-slate-700 font-bold cursor-pointer outline-none bg-slate-900 text-white focus:border-cyan-500 shadow-sm"
              >
                {OPSI_KATEGORI_PRESTASI.map((kat) => (
                  <option key={kat} value={kat}>{kat}</option>
                ))}
              </select>

              <select
                value={pilihJenisPrestasi}
                onChange={(e) => setPilihJenisPrestasi(e.target.value)}
                className="p-2 text-xs rounded-xl border border-slate-700 font-bold cursor-pointer outline-none bg-slate-900 text-white focus:border-cyan-500 shadow-sm"
              >
                {OPSI_JENIS_PRESTASI.map((jenis) => (
                  <option key={jenis} value={jenis}>{jenis}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* FILTER WILAYAH PENGENDALI KLASEMEN */}
        <div className="mb-6 bg-slate-950/50 border border-slate-800 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center">
          <div className="flex bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shrink-0 shadow-sm w-full md:w-auto">
            <button onClick={() => { setTingkatWilayah('PROVINSI'); setPilihCabdin(''); setPilihKabKota(''); }} className={`px-4 py-2 text-[10px] font-black uppercase font-mono transition-colors ${tingkatWilayah === 'PROVINSI' ? 'bg-cyan-500 text-slate-950' : 'hover:bg-slate-800 text-slate-400'}`}>Provinsi</button>
            <button onClick={() => { setTingkatWilayah('CABDIN'); setPilihKabKota(''); }} className={`px-4 py-2 text-[10px] font-black uppercase font-mono border-l border-r border-slate-700 transition-colors ${tingkatWilayah === 'CABDIN' ? 'bg-cyan-500 text-slate-950' : 'hover:bg-slate-800 text-slate-400'}`}>Cabdin</button>
            <button onClick={() => setTingkatWilayah('KABKOTA')} className={`px-4 py-2 text-[10px] font-black uppercase font-mono transition-colors ${tingkatWilayah === 'KABKOTA' ? 'bg-cyan-500 text-slate-950' : 'hover:bg-slate-800 text-slate-400'}`}>Kab/Kota</button>
          </div>

          <div className="flex-1 flex gap-3 w-full">
            {(tingkatWilayah === 'CABDIN' || tingkatWilayah === 'KABKOTA') && (
              <select value={pilihCabdin} onChange={e => { setPilihCabdin(e.target.value); setPilihKabKota(''); }} className="w-full p-2 text-xs rounded-xl border font-bold outline-none cursor-pointer bg-slate-900 border-slate-700 text-white focus:border-cyan-500 shadow-sm">
                <option value="" disabled>-- Pilih Cabang Dinas --</option>
                {Object.keys(DATA_WILAYAH).map(cabdin => <option key={cabdin} value={cabdin}>{cabdin}</option>)}
              </select>
            )}

            {tingkatWilayah === 'KABKOTA' && (
              <select value={pilihKabKota} onChange={e => setPilihKabKota(e.target.value)} disabled={!pilihCabdin} className="w-full p-2 text-xs rounded-xl border font-bold outline-none cursor-pointer bg-slate-900 border-slate-700 text-white focus:border-cyan-500 shadow-sm disabled:opacity-50">
                <option value="" disabled>-- Pilih Kab/Kota --</option>
                {daftarKabKota.map(kab => <option key={kab} value={kab}>{kab}</option>)}
              </select>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-4 px-6 font-bold w-16 text-center">Rank</th>
                <th className="py-4 px-6 font-bold w-20 text-center">Logo</th>
                <th className="py-4 px-6 font-bold">Instansi & Pimpinan</th>
                <th className="py-4 px-6 font-bold text-center">{filterKategori === 'TKA' ? 'Nilai Rata-Rata' : 'Trofi'}</th>
                <th className="py-4 px-6 font-bold text-center w-32">
                  {filterKategori === 'TKA' ? 'Status' : (filterKategori === 'SEMUA' ? 'Poin Total' : 'Pts')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-900/40">
              {klasemenDitampilkan.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500 italic">Belum ada data tervalidasi di wilayah/kategori ini.</td></tr>
              ) : (
                klasemenDitampilkan.map((klub, idx) => (
                  <tr key={klub.npsn} className="hover:bg-slate-800/50 transition-colors group">
                    <td className="py-4 px-6 text-center font-black text-lg">
                      {klub.peringkat === 1 ? '🥇' : klub.peringkat === 2 ? '🥈' : klub.peringkat === 3 ? '🥉' : <span className="text-slate-500 text-sm">{klub.peringkat}</span>}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {klub.logo ? <img src={klub.logo} alt="" className="w-10 h-10 rounded-full object-cover mx-auto border-2 border-slate-700" /> : <div className="w-10 h-10 rounded-full bg-slate-800 mx-auto flex items-center justify-center font-black text-slate-500 border-2 border-slate-700">🏫</div>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-white group-hover:text-amber-400 transition-colors text-base">{klub.nama}</div>
                      <div className="text-[10px] font-mono text-slate-500 mb-1">{klub.cabang_dinas || 'Wilayah Belum Diatur'} • {klub.kabupaten_kota || '-'}</div>
                      <div className="text-xs text-slate-400">Kepsek: <span className="text-emerald-400">{klub.kepala}</span></div>
                    </td>
                    
                    <td className="py-4 px-6 text-center">
                       {filterKategori === 'TKA' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono font-black text-xs">📊 {klub.tka_score.toFixed(2)}</span>
                       ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-black text-xs">🏆 {klub.trofi}</span>
                       )}
                    </td>
                    <td className="py-4 px-6 text-center font-mono font-black text-white text-base">
                       {filterKategori === 'TKA' ? (
                          klub.tka_score > 0 ? <span className="text-[10px] text-emerald-400 font-sans uppercase">Terdata</span> : <span className="text-[10px] text-slate-500 font-sans uppercase">Kosong</span>
                       ) : (
                          <div className="flex flex-col items-center justify-center">
                             <span>{filterKategori === 'SEMUA' ? Number(klub.pts + klub.tka_score).toFixed(2).replace(/\.00$/, '') : klub.pts}</span>
                             {filterKategori === 'SEMUA' && klub.tka_score > 0 && (
                                <span className="text-[9px] text-cyan-400 mt-1 uppercase tracking-widest leading-none font-bold">(+TKA)</span>
                             )}
                          </div>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* TOMBOL AKORDEON PAPAN PRESTASI */}
        {dataTerfilter.length > 5 && (
          <div className="mt-6 flex justify-center">
            <button 
              onClick={() => setTampilSemuaSekolah(!tampilSemuaSekolah)} 
              className="px-6 py-2.5 rounded-full bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md hover:text-amber-400"
            >
              {tampilSemuaSekolah ? "🔼 Sembunyikan Papan Klasemen" : `🔽 Lihat Semua Sekolah (${dataTerfilter.length})`}
            </button>
          </div>
        )}
      </div>

      {/* SEKSI 2: GALERI INOVASI */}
      <div className="bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl">
        <div className="border-b border-slate-800 pb-5 mb-6">
          <h2 className="text-xl font-black text-cyan-400 font-mono flex items-center gap-2">💡 MANTAP SHARE BINAAN (TOP 3)</h2>
          <p className="text-xs text-slate-400 mt-1">Karya inovasi yang paling banyak di-apresiasi (Diusut otomatis dari jumlah Like 🌟).</p>
        </div>

        {inovasiDitampilkan.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-500 text-sm font-mono italic">Belum ada karya inovasi yang disetujui.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inovasiDitampilkan.map(karya => renderKaryaPengawasCard(karya))}
          </div>
        )}

        {/* TOMBOL AKORDEON GALERI INOVASI */}
        {inovasiTotal > 3 && (
          <div className="mt-8 flex justify-center border-t border-slate-800/50 pt-6">
            <button 
              onClick={() => setTampilSemuaInovasi(!tampilSemuaInovasi)} 
              className="px-8 py-3.5 rounded-xl bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-widest shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all transform hover:-translate-y-1 flex items-center gap-2 cursor-pointer"
            >
              {tampilSemuaInovasi ? "🔼 Tutup Galeri Ekstra" : `✨ Eksplorasi Semua Karya (${inovasiTotal})`}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
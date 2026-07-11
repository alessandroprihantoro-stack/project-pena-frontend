import React, { useState } from "react";

// Menambahkan cabang_dinas dan kabupaten_kota pada interface
export interface KlasemenKlub {
  id: string;
  peringkat: number;
  nama_sekolah: string;
  nama_kepsek: string;
  logo_url: string | null;
  jumlah_prestasi: number;
  total_poin: number;
  tka_score: number;
  is_me: boolean;
  cabang_dinas?: string;
  kabupaten_kota?: string;
  kategori_lomba?: string; 
  jenis_prestasi?: string; 
}

interface PapanKlasemenProps {
  filterKategori: "SEMUA" | "LOMBA" | "LULUSAN" | "TKA";
  setFilterKategori: (val: "SEMUA" | "LOMBA" | "LULUSAN" | "TKA") => void;
  pilihKategoriPrestasi: string;
  setPilihKategoriPrestasi: (val: string) => void;
  pilihJenisPrestasi: string;
  setPilihJenisPrestasi: (val: string) => void;
  papanDataUtuh: KlasemenKlub[];
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
  "Cabang Dinas Wilayah XII": ["Kabupaten Pemalang", "Kabupaten Pekalongan", "Kabupaten Batang", "Kota Pekalongan"],
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

export default function PapanKlasemen({
  filterKategori,
  setFilterKategori,
  pilihKategoriPrestasi,
  setPilihKategoriPrestasi,
  pilihJenisPrestasi,
  setPilihJenisPrestasi,
  papanDataUtuh,
}: PapanKlasemenProps) {
  const [tampilSemuaSekolah, setTampilSemuaSekolah] = useState(false);

  // State Filter Wilayah 3 Tingkat
  const [tingkatWilayah, setTingkatWilayah] = useState<"PROVINSI" | "CABDIN" | "KABKOTA">("PROVINSI");
  const [pilihCabdin, setPilihCabdin] = useState("");
  const [pilihKabKota, setPilihKabKota] = useState("");

  // 🧠 LOGIKA PENYARINGAN WILAYAH
  let dataTerfilter = [...papanDataUtuh];

  if (tingkatWilayah === "CABDIN" && pilihCabdin) {
    dataTerfilter = dataTerfilter.filter((s) => s.cabang_dinas === pilihCabdin);
  } else if (tingkatWilayah === "KABKOTA" && pilihKabKota) {
    dataTerfilter = dataTerfilter.filter((s) => s.kabupaten_kota === pilihKabKota);
  }

  // filterKategori, pilihKategoriPrestasi, & pilihJenisPrestasi sudah diproses di tingkat induk (DashboardSekolah) 
  // untuk mencegah data hilang akibat duplikasi filter objek.

  // Hitung ulang peringkat di UI setelah filter wilayah aktif
  dataTerfilter.forEach((item, idx) => {
    item.peringkat = idx + 1;
  });

  const papanDitampilkan = tampilSemuaSekolah ? dataTerfilter : dataTerfilter.slice(0, 5);
  const daftarKabKota = pilihCabdin ? DATA_WILAYAH[pilihCabdin as keyof typeof DATA_WILAYAH] || [] : [];

  return (
    <div className="transition-all duration-300 bg-linear-to-br from-yellow-50 via-orange-50 to-rose-50 border-4 border-black shadow-neo rounded-3xl p-6 sm:p-8 hover:-translate-y-1 hover:shadow-neo-md dark:bg-[#061030]/80 dark:border-2 dark:border-orange-500/30 dark:shadow-[0_4px_20px_rgba(249,115,22,0.1)] space-y-6">
      
      {/* HEADER */}
      <div className="border-b-4 border-black/10 dark:border-slate-800 pb-4">
        <h3 className="text-lg font-black uppercase tracking-widest text-orange-600 dark:text-amber-400 flex items-center gap-2">
          🏆 Papan Prestasi Siswa
        </h3>
        <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
          Peringkat akumulasi poin trofi valid antar sekolah
        </p>
      </div>

      {/* FILTER WILAYAH 3 TINGKAT */}
      <div className="bg-white/60 border-2 border-black/10 p-4 rounded-2xl dark:bg-slate-950/50 dark:border-slate-800/80 flex flex-col md:flex-row gap-4 items-center">
        <div className="flex bg-white border-2 border-black rounded-xl overflow-hidden dark:bg-slate-900 dark:border-slate-700 w-full md:w-auto shrink-0 shadow-sm">
          <button
            onClick={() => { setTingkatWilayah("PROVINSI"); setPilihCabdin(""); setPilihKabKota(""); }}
            className={`px-4 py-2 text-[10px] font-black uppercase font-mono transition-colors ${tingkatWilayah === "PROVINSI" ? "bg-black text-white dark:bg-amber-500 dark:text-slate-950" : "hover:bg-slate-100 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"}`}
          >
            Provinsi
          </button>
          <button
            onClick={() => { setTingkatWilayah("CABDIN"); setPilihKabKota(""); }}
            className={`px-4 py-2 text-[10px] font-black uppercase font-mono border-l-2 border-r-2 border-black transition-colors dark:border-slate-700 ${tingkatWilayah === "CABDIN" ? "bg-black text-white dark:bg-amber-500 dark:text-slate-950" : "hover:bg-slate-100 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"}`}
          >
            Cabdin
          </button>
          <button
            onClick={() => setTingkatWilayah("KABKOTA")}
            className={`px-4 py-2 text-[10px] font-black uppercase font-mono transition-colors ${tingkatWilayah === "KABKOTA" ? "bg-black text-white dark:bg-amber-500 dark:text-slate-950" : "hover:bg-slate-100 text-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"}`}
          >
            Kab/Kota
          </button>
        </div>

        <div className="flex-1 flex gap-3 w-full">
          {(tingkatWilayah === "CABDIN" || tingkatWilayah === "KABKOTA") && (
            <select
              value={pilihCabdin}
              onChange={(e) => { setPilihCabdin(e.target.value); setPilihKabKota(""); }}
              className="w-full p-2 text-xs rounded-xl border-2 font-bold cursor-pointer outline-none bg-white border-black text-black focus:border-orange-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-amber-500 shadow-sm"
            >
              <option value="" disabled>-- Pilih Cabang Dinas --</option>
              {Object.keys(DATA_WILAYAH).map((cabdin) => (
                <option key={cabdin} value={cabdin}>{cabdin}</option>
              ))}
            </select>
          )}

          {tingkatWilayah === "KABKOTA" && (
            <select
              value={pilihKabKota}
              onChange={(e) => setPilihKabKota(e.target.value)}
              disabled={!pilihCabdin}
              className="w-full p-2 text-xs rounded-xl border-2 font-bold cursor-pointer outline-none bg-white border-black text-black focus:border-orange-500 disabled:opacity-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-amber-500 shadow-sm"
            >
              <option value="" disabled>-- Pilih Kab/Kota --</option>
              {daftarKabKota.map((kab) => (
                <option key={kab} value={kab}>{kab}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* FILTER TAMBAHAN: SUMBER, KATEGORI & JENIS */}
      <div className="bg-white/60 border-2 border-black/10 p-3 rounded-2xl dark:bg-slate-950/50 dark:border-slate-800/80 flex flex-col md:flex-row gap-4 items-center w-full">
        
        <div className="w-full md:w-1/3 flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 min-w-15">Sumber:</span>
          <select
            value={filterKategori}
            onChange={(e) => setFilterKategori(e.target.value as "SEMUA" | "LOMBA" | "LULUSAN" | "TKA")}
            className="w-full p-2 text-xs rounded-xl border-2 font-bold cursor-pointer outline-none bg-orange-100 border-orange-500 text-black shadow-sm dark:bg-amber-500/20 dark:border-amber-500 dark:text-white"
          >
            <option value="SEMUA">Semua Data</option>
            <option value="LOMBA">Lomba</option>
            <option value="LULUSAN">Lulusan</option>
            <option value="TKA">TKA</option>
          </select>
        </div>

        <div className={`w-full md:w-2/3 flex flex-col sm:flex-row gap-4 transition-opacity duration-300 ${(filterKategori === "TKA" || filterKategori === "LULUSAN") ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
          <div className="w-full sm:w-1/2 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 min-w-15">Kategori:</span>
            <select
              value={pilihKategoriPrestasi}
              onChange={(e) => setPilihKategoriPrestasi(e.target.value)}
              className="w-full p-2 text-xs rounded-xl border-2 font-bold cursor-pointer outline-none bg-white border-black text-black focus:border-orange-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white shadow-sm"
            >
              {OPSI_KATEGORI_PRESTASI.map((kat) => (
                <option key={kat} value={kat}>{kat}</option>
              ))}
            </select>
          </div>
          <div className="w-full sm:w-1/2 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 min-w-12.5">Jenis:</span>
            <select
              value={pilihJenisPrestasi}
              onChange={(e) => setPilihJenisPrestasi(e.target.value)}
              className="w-full p-2 text-xs rounded-xl border-2 font-bold cursor-pointer outline-none bg-white border-black text-black focus:border-orange-500 dark:bg-slate-900 dark:border-slate-700 dark:text-white shadow-sm"
            >
              {OPSI_JENIS_PRESTASI.map((jenis) => (
                <option key={jenis} value={jenis}>{jenis}</option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* TABEL KLASEMEN */}
      <div className="overflow-x-auto custom-scrollbar border-4 border-black rounded-2xl bg-white dark:bg-slate-900/40 dark:border-slate-800 shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-orange-100 border-b-4 border-black dark:bg-slate-950/80 dark:border-slate-800">
            <tr className="font-mono text-[10px] font-black uppercase tracking-widest text-orange-900 dark:text-amber-400">
              <th className="py-4 px-4 text-center w-16">Rank</th>
              <th className="py-4 px-4">Satuan Pendidikan</th>
              <th className="py-4 px-4 hidden sm:table-cell border-l-2 border-black/10 dark:border-slate-800/50">Nama Kepala Sekolah</th>
              <th className="py-4 px-4 text-center w-32 border-l-2 border-black/10 dark:border-slate-800/50">
                {filterKategori === "TKA" ? "Rata-Rata TKA" : "Jumlah Item"}
              </th>
              <th className="py-4 px-4 text-center w-28 border-l-2 border-black/10 dark:border-slate-800/50">
                {filterKategori === "TKA" ? "Status" : "Total Poin"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black/10 dark:divide-slate-800/40 text-sm font-bold text-slate-800 dark:text-slate-200">
            {papanDitampilkan.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-500 dark:text-slate-500 italic">
                  Data belum tersedia di wilayah/kategori ini.
                </td>
              </tr>
            ) : (
              papanDitampilkan.map((klub) => (
                <tr
                  key={klub.id}
                  className={`transition-colors duration-200 hover:bg-orange-50/50 dark:hover:bg-slate-800/40 ${klub.is_me ? "bg-yellow-100/50 dark:bg-amber-500/10 border-l-4 border-l-orange-500 dark:border-l-amber-400" : ""}`}
                >
                  <td className="py-4 px-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-xs font-mono font-black border-2 ${klub.peringkat === 1 ? "bg-yellow-300 text-black border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30" : klub.peringkat === 2 ? "bg-slate-200 text-black border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:bg-slate-400/20 dark:text-slate-300 dark:border-slate-400/30" : klub.peringkat === 3 ? "bg-orange-300 text-black border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] dark:bg-amber-700/20 dark:text-amber-600 dark:border-amber-700/30" : "bg-white text-slate-600 border-black/30 dark:bg-transparent dark:border-slate-700"}`}
                    >
                      {klub.peringkat}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {klub.logo_url ? (
                        <img src={klub.logo_url} alt="" className="w-10 h-10 rounded-xl object-cover bg-white p-0.5 shrink-0 border-2 border-black dark:border-slate-600" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-orange-200 border-2 border-black flex items-center justify-center text-sm shrink-0 font-mono dark:bg-slate-800 dark:border-slate-700">🏫</div>
                      )}
                      <div className="flex flex-col">
                        <span className={`truncate max-w-xs sm:max-w-md ${klub.is_me ? "text-orange-700 dark:text-amber-400 font-black" : "text-slate-800 dark:text-slate-200 font-bold"}`}>
                          {klub.nama_sekolah} {klub.is_me && "⭐"}
                        </span>
                        <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {klub.cabang_dinas || "Wilayah Belum Diatur"} • {klub.kabupaten_kota || "-"}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600 dark:text-slate-400 truncate max-w-xs hidden sm:table-cell border-l-2 border-black/5 dark:border-slate-800/50">
                    {klub.nama_kepsek}
                  </td>
                  <td className="py-4 px-4 text-center border-l-2 border-black/5 dark:border-slate-800/50">
                    {filterKategori === "TKA" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-100 border-2 border-blue-300 text-blue-700 font-mono font-black text-xs dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-400">
                        📊 {klub.tka_score.toFixed(2)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-yellow-100 border-2 border-black text-black font-mono font-black text-xs shadow-sm dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">
                        💎 {klub.jumlah_prestasi}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-black text-black dark:text-slate-100 text-lg border-l-2 border-black/5 dark:border-slate-800/50">
                    {filterKategori === "TKA" ? (
                      klub.tka_score > 0 ? (
                        <span className="text-[10px] text-green-600 dark:text-emerald-400 font-sans uppercase">Terdata</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-sans uppercase">Kosong</span>
                      )
                    ) : (
                      <span className="bg-orange-100 px-3 py-1 rounded-xl border-2 border-orange-300 text-orange-800 dark:bg-transparent dark:border-transparent dark:text-amber-400 inline-block min-w-12 text-center">
                        {klub.total_poin}
                      </span>
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
        <div className="mt-6 flex justify-center pt-2">
          <button
            onClick={() => setTampilSemuaSekolah(!tampilSemuaSekolah)}
            className="px-6 py-3 rounded-xl border-2 bg-white text-black border-black font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-neo hover:-translate-y-0.5 hover:shadow-neo-md dark:bg-slate-950 dark:hover:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:shadow-none dark:hover:text-amber-400 dark:hover:translate-y-0"
          >
            {tampilSemuaSekolah ? "🔼 Sembunyikan Papan" : `🔽 Lihat Semua Sekolah (${dataTerfilter.length})`}
          </button>
        </div>
      )}
    </div>
  );
}
import React from "react";
// 1. IMPORT FUNGSI KOMPRESI (Pastikan path folder utils ini sesuai dengan struktur Anda)
import { compressImage } from "../../../utils/imageCompression";

// Mendefinisikan interface agar komponen ini memahami tipe data yang dilempar dari Induk
interface FormEditSekolahProps {
  formNamaSekolah: string;
  setFormNamaSekolah: (val: string) => void;
  formKepsek: string;
  setFormKepsek: (val: string) => void;
  formNipKepsek: string;
  setFormNipKepsek: (val: string) => void;
  formAlamat: string;
  setFormAlamat: (val: string) => void;
  formTotalGuru: number;
  setFormTotalGuru: (val: number) => void;
  formTotalMurid: number;
  setFormTotalMurid: (val: number) => void;
  formTotalTendik: number;
  setFormTotalTendik: (val: number) => void;
  setFormLogoFile: (file: File | null) => void;

  // PROPS BARU UNTUK CABANG DINAS & KAB/KOTA
  formCabdin: string;
  setFormCabdin: (val: string) => void;
  formKabKota: string;
  setFormKabKota: (val: string) => void;

  setIsEditing: (val: boolean) => void;
  handleSimpanPemutakhiran: (e: React.FormEvent) => void;
  saving: boolean;
}

// 🗺️ PEMETAAN DATA CABANG DINAS PROVINSI JAWA TENGAH KELAS A
const DATA_WILAYAH = {
  "Cabang Dinas Wilayah I": [
    "Kabupaten Semarang",
    "Kota Salatiga",
    "Kabupaten Demak",
  ],
  "Cabang Dinas Wilayah II": ["Kota Semarang", "Kabupaten Kendal"],
  "Cabang Dinas Wilayah III": [
    "Kabupaten Jepara",
    "Kabupaten Pati",
    "Kabupaten Kudus",
  ],
  "Cabang Dinas Wilayah IV": [
    "Kabupaten Grobogan",
    "Kabupaten Blora",
    "Kabupaten Rembang",
  ],
  "Cabang Dinas Wilayah V": ["Kabupaten Boyolali", "Kabupaten Klaten"],
  "Cabang Dinas Wilayah VI": [
    "Kabupaten Wonogiri",
    "Kabupaten Karanganyar",
    "Kabupaten Sragen",
  ],
  "Cabang Dinas Wilayah VII": ["Kota Surakarta", "Kabupaten Sukoharjo"],
  "Cabang Dinas Wilayah VIII": [
    "Kota Magelang",
    "Kabupaten Magelang",
    "Kabupaten Temanggung",
  ],
  "Cabang Dinas Wilayah IX": [
    "Kabupaten Wonosobo",
    "Kabupaten Banjarnegara",
    "Kabupaten Kebumen",
    "Kabupaten Purworejo",
  ],
  "Cabang Dinas Wilayah X": [
    "Kabupaten Cilacap",
    "Kabupaten Purbalingga",
    "Kabupaten Banyumas",
  ],
  "Cabang Dinas Wilayah XI": [
    "Kabupaten Brebes",
    "Kabupaten Tegal",
    "Kota Tegal",
  ],
  "Cabang Dinas Wilayah XII": [
    "Kabupaten Pemalang",
    "Kabupaten Pekalongan",
    "Kabupaten Batang",
    "Kota Pekalongan",
  ],
};

export default function FormEditSekolah({
  formNamaSekolah,
  setFormNamaSekolah,
  formKepsek,
  setFormKepsek,
  formNipKepsek,
  setFormNipKepsek,
  formAlamat,
  setFormAlamat,
  formTotalGuru,
  setFormTotalGuru,
  formTotalMurid,
  setFormTotalMurid,
  formTotalTendik,
  setFormTotalTendik,
  setFormLogoFile,
  formCabdin,
  setFormCabdin,
  formKabKota,
  setFormKabKota,
  setIsEditing,
  handleSimpanPemutakhiran,
  saving,
}: FormEditSekolahProps) {
  // Ambil daftar Kab/Kota berdasarkan Cabdin yang dipilih
  const daftarKabKota =
    formCabdin && DATA_WILAYAH[formCabdin as keyof typeof DATA_WILAYAH]
      ? DATA_WILAYAH[formCabdin as keyof typeof DATA_WILAYAH]
      : [];

  // 2. FUNGSI HANDLER BARU UNTUK KOMPRESI GAMBAR SEBELUM DI-SET KE STATE
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Eksekusi kompresi secara background
      const compressedFile = await compressImage(file);
      // Lempar file hasil kompresi kembali ke komponen induk
      setFormLogoFile(compressedFile as File);
    } else {
      setFormLogoFile(null);
    }
  };

  return (
    <form
      onSubmit={handleSimpanPemutakhiran}
      className="p-6 sm:p-8 space-y-6 transition-all bg-white border-4 border-black shadow-neo rounded-3xl dark:bg-slate-900 dark:border-2 dark:border-slate-800 dark:shadow-2xl animate-fade-in"
    >
      <h3 className="text-lg font-black font-mono uppercase tracking-wider flex items-center gap-2 border-b-2 pb-3 text-black border-black/20 dark:text-cyan-400 dark:border-slate-800">
        ⚙️ Panel Pemutakhiran Data Pokok
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Nama Sekolah Resmi
          </label>
          <input
            type="text"
            value={formNamaSekolah}
            onChange={(e) => setFormNamaSekolah(e.target.value)}
            required
            className="w-full p-3 text-sm rounded-xl border-2 outline-none transition-all font-bold bg-white border-black text-black focus:border-blue-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-cyan-500"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Nama Kepala Sekolah
          </label>
          <input
            type="text"
            value={formKepsek}
            onChange={(e) => setFormKepsek(e.target.value)}
            required
            className="w-full p-3 text-sm rounded-xl border-2 outline-none transition-all font-bold bg-white border-black text-black focus:border-blue-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-cyan-500"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            NIP Kepala Sekolah
          </label>
          <input
            type="text"
            value={formNipKepsek}
            onChange={(e) => setFormNipKepsek(e.target.value)}
            className="w-full p-3 text-sm rounded-xl border-2 outline-none transition-all font-bold font-mono bg-white border-black text-black focus:border-blue-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-cyan-500"
            placeholder="Contoh: 198203112009031002"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Alamat Lengkap
          </label>
          <input
            type="text"
            value={formAlamat}
            onChange={(e) => setFormAlamat(e.target.value)}
            className="w-full p-3 text-sm rounded-xl border-2 outline-none transition-all font-bold bg-white border-black text-black focus:border-blue-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-cyan-500"
          />
        </div>
      </div>

      {/* BARIS BARU: CABANG DINAS & KABUPATEN/KOTA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-2xl border-2 transition-colors bg-blue-50 border-black/20 dark:bg-slate-950/50 dark:border-slate-800/80">
        <div className="space-y-2">
          <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-blue-700 dark:text-cyan-400">
            Wilayah Cabang Dinas (Jateng)
          </label>
          <select
            value={formCabdin}
            onChange={(e) => {
              setFormCabdin(e.target.value);
              setFormKabKota(""); // Reset Kab/kota jika cabdin diganti
            }}
            className="w-full p-3 text-sm rounded-xl border-2 outline-none cursor-pointer font-bold bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500"
          >
            <option value="" disabled>
              -- Pilih Cabang Dinas --
            </option>
            {Object.keys(DATA_WILAYAH).map((cabdin) => (
              <option key={cabdin} value={cabdin}>
                {cabdin}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-blue-700 dark:text-cyan-400">
            Kabupaten / Kota
          </label>
          <select
            value={formKabKota}
            onChange={(e) => setFormKabKota(e.target.value)}
            disabled={!formCabdin}
            className="w-full p-3 text-sm rounded-xl border-2 outline-none cursor-pointer font-bold disabled:opacity-50 disabled:cursor-not-allowed bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500"
          >
            <option value="" disabled>
              -- Pilih Kab/Kota --
            </option>
            {daftarKabKota.map((kab) => (
              <option key={kab} value={kab}>
                {kab}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
        <div className="space-y-2">
          <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Total Guru
          </label>
          <input
            type="number"
            value={formTotalGuru}
            onChange={(e) => setFormTotalGuru(Number(e.target.value))}
            className="w-full p-3 text-sm rounded-xl border-2 outline-none transition-all font-mono font-bold bg-white border-black text-black focus:border-blue-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-cyan-500"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Total Murid/Siswa
          </label>
          <input
            type="number"
            value={formTotalMurid}
            onChange={(e) => setFormTotalMurid(Number(e.target.value))}
            className="w-full p-3 text-sm rounded-xl border-2 outline-none transition-all font-mono font-bold bg-white border-black text-black focus:border-blue-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-cyan-500"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Total Tendik
          </label>
          <input
            type="number"
            value={formTotalTendik}
            onChange={(e) => setFormTotalTendik(Number(e.target.value))}
            className="w-full p-3 text-sm rounded-xl border-2 outline-none transition-all font-mono font-bold bg-white border-black text-black focus:border-blue-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-cyan-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
          Ganti Berkas Logo Institusi (Opsional)
        </label>
        {/* 3. UBAH onChange MENJADI handleLogoChange */}
        <input
          type="file"
          accept="image/*"
          onChange={handleLogoChange}
          className="w-full text-xs cursor-pointer file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-2 file:border-black file:text-xs file:font-mono file:font-black file:bg-yellow-400 file:text-black dark:file:border-transparent dark:file:bg-slate-800 dark:file:text-cyan-400 text-slate-600 dark:text-slate-400"
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t-2 border-black/20 dark:border-slate-800/60">
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer border-2 bg-white text-slate-700 border-black shadow-sm hover:-translate-y-0.5 dark:bg-slate-800 dark:border-transparent dark:text-slate-300 dark:shadow-none dark:hover:bg-slate-700"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer border-2 bg-yellow-400 hover:bg-yellow-300 text-black border-black shadow-neo hover:-translate-y-1 active:translate-y-0 active:shadow-none dark:bg-linear-to-r dark:from-cyan-500 dark:to-indigo-600 dark:hover:from-cyan-400 dark:hover:to-indigo-500 dark:text-slate-950 dark:border-transparent dark:shadow-lg dark:shadow-cyan-500/20 dark:hover:translate-y-0"
        >
          {saving ? "Menyimpan..." : "💾 Simpan Pemutakhiran"}
        </button>
      </div>
    </form>
  );
}
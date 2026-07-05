/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

export default function PrestasiSekolah() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // State Tunggal untuk 14 Kolom Form (TIDAK DIUBAH)
  const [formData, setFormData] = useState({
    nama_prestasi: '',
    kategori: 'Akademik',
    bidang: 'OSN',
    jenis_peserta: 'Siswa',
    tingkat: 'Kabupaten',
    tahun: new Date().getFullYear().toString(),
    penyelenggara: '',
    peringkat: 'Juara 1',
    nama_peraih: '',
    nomor_sertifikat: '',
    tanggal: '',
    bukti_sertifikat: '',
    bukti_foto: '',
    keterangan: ''
  });

  // Opsi Dropdown Sesuai Standar Dapodik / PENA (TIDAK DIUBAH)
  const optKategori = ["Akademik", "Non Akademik", "Olahraga", "Seni", "Keagamaan", "Pramuka", "PMR", "Paskibra", "Teknologi", "Kewirausahaan", "Lingkungan", "Guru", "Kepala Sekolah", "Sekolah"];
  const optBidang = ["OSN", "OPSI", "O2SN", "POPDA", "POPPROV", "POPNAS", "GSI", "FLS3N", "FIKSI", "LDBI", "NSDC", "KSM", "MTQ", "Adiwiyata", "Sekolah Sehat", "GTK Award", "Guru Berprestasi", "Kepala Sekolah Berprestasi", "Kejurkab", "Kejurprov", "Kejurnas", "ASEAN School Games", "PON", "PORPROV", "POR Pelajar", "Lainnya"];
  const optPeserta = ["Siswa", "Guru", "Kepala Sekolah", "Sekolah"];
  const optTingkat = ["Sekolah", "Kecamatan", "Kabupaten", "Provinsi", "Nasional", "Internasional"];
  const optPeringkat = ["Juara 1", "Juara 2", "Juara 3"];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSimpanPrestasi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setLoading(true);

    try {
      // 1. Logika Kalkulator Poin Otomatis
      let poinDihitung = 1;
      const peringkatCek = formData.peringkat.toLowerCase();
      if (peringkatCek.includes('juara 1')) poinDihitung = 3;
      else if (peringkatCek.includes('juara 2')) poinDihitung = 2;
      else if (peringkatCek.includes('juara 3')) poinDihitung = 1;

      // 2. Merakit Payload dengan Jembatan Database Lama (Backward Compatibility)
      const payload = {
        sekolah_id: profile.id,         
        npsn: profile.nomor_induk,      
        poin: poinDihitung,             
        status_validasi: 'MENUNGGU',    
        
        // --- JEMBATAN WAJIB UNTUK KOLOM LAMA ---
        nama_siswa_atau_kegiatan: `${formData.nama_peraih} - ${formData.nama_prestasi}`,
        jalur: formData.kategori,
        jenis_prestasi: formData.bidang,
        juara: formData.peringkat,
        // ---------------------------------------
        
        ...formData
      };

      const { error } = await supabase.from('prestasi').insert([payload]);
      
      if (error) throw error;

      alert(`🏆 Luar Biasa! Data Prestasi berhasil ditambahkan.\nSistem mendeteksi Peringkat: ${formData.peringkat} (+${poinDihitung} Poin)`);
      
      // Reset Form ke default setelah sukses
      setFormData(prev => ({
        ...prev,
        nama_prestasi: '', penyelenggara: '', nama_peraih: '', nomor_sertifikat: '', 
        tanggal: '', bukti_sertifikat: '', bukti_foto: '', keterangan: ''
      }));

    } catch (err: any) {
      alert("⚠️ Gagal menyimpan data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 rounded-3xl transition-all bg-white border-4 border-black shadow-neo dark:bg-slate-900/60 dark:border-2 dark:border-slate-800 dark:shadow-none space-y-6">
      
      {/* HEADER FORM */}
      <div className="border-b-2 border-black/20 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2 text-black dark:text-cyan-400">
          <span>🏆</span> DAPUR INPUT PRESTASI
        </h2>
        <p className="text-xs mt-1 font-bold text-slate-600 dark:text-slate-400">Formulir pelaporan pencapaian satuan pendidikan terintegrasi.</p>
      </div>

      <form onSubmit={handleSimpanPrestasi} className="space-y-6 font-bold">
        
        {/* BLOK 1: IDENTITAS PRESTASI */}
        <div className="bg-slate-50 border-2 border-black/20 rounded-2xl p-5 space-y-4 dark:bg-slate-950/50 dark:border-slate-800/80">
          <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500 border-b border-black/10 dark:border-slate-800 pb-2">1️⃣ Detail Capaian</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black uppercase tracking-wider text-blue-700 dark:text-cyan-400">Nama Prestasi</label>
              <input type="text" required name="nama_prestasi" value={formData.nama_prestasi} onChange={handleChange} placeholder="Cth: Medali Emas Olimpiade Fisika..." className="w-full p-3 text-xs rounded-xl border-2 outline-none transition-colors bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black uppercase tracking-wider text-blue-700 dark:text-cyan-400">Nama Peraih (Individu/Tim)</label>
              <input type="text" required name="nama_peraih" value={formData.nama_peraih} onChange={handleChange} placeholder="Cth: Budi Santoso / Tim Basket Putra" className="w-full p-3 text-xs rounded-xl border-2 outline-none transition-colors bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">Penyelenggara</label>
              <input type="text" required name="penyelenggara" value={formData.penyelenggara} onChange={handleChange} placeholder="Cth: Puspresnas / Disdikbud" className="w-full p-3 text-xs rounded-xl border-2 outline-none bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black uppercase tracking-wider text-orange-600 dark:text-amber-400">Peringkat & Tahun</label>
              <div className="flex gap-2">
                <select name="peringkat" value={formData.peringkat} onChange={handleChange} className="w-2/3 p-3 text-xs rounded-xl border-2 outline-none cursor-pointer font-black bg-yellow-50 border-black text-orange-700 focus:border-orange-500 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-400 dark:focus:border-amber-400 shadow-sm">
                  {optPeringkat.map(opt => <option key={opt} value={opt}>🏆 {opt}</option>)}
                </select>
                <input type="number" required name="tahun" value={formData.tahun} onChange={handleChange} className="w-1/3 p-3 text-xs rounded-xl border-2 outline-none font-mono bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm text-center" />
              </div>
            </div>
          </div>
        </div>

        {/* BLOK 2: KATEGORI & TINGKAT */}
        <div className="bg-slate-50 border-2 border-black/20 rounded-2xl p-5 space-y-4 dark:bg-slate-950/50 dark:border-slate-800/80">
          <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500 border-b border-black/10 dark:border-slate-800 pb-2">2️⃣ Kategori & Level</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">Kategori</label>
              <select name="kategori" value={formData.kategori} onChange={handleChange} className="w-full p-3 text-xs rounded-xl border-2 outline-none cursor-pointer bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm">
                {optKategori.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">Bidang/Ajang</label>
              <select name="bidang" value={formData.bidang} onChange={handleChange} className="w-full p-3 text-xs rounded-xl border-2 outline-none cursor-pointer bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm">
                {optBidang.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">Peserta</label>
              <select name="jenis_peserta" value={formData.jenis_peserta} onChange={handleChange} className="w-full p-3 text-xs rounded-xl border-2 outline-none cursor-pointer bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm">
                {optPeserta.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">Tingkat</label>
              <select name="tingkat" value={formData.tingkat} onChange={handleChange} className="w-full p-3 text-xs rounded-xl border-2 outline-none cursor-pointer bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm">
                {optTingkat.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* BLOK 3: BUKTI & LEGALITAS */}
        <div className="bg-slate-50 border-2 border-black/20 rounded-2xl p-5 space-y-4 dark:bg-slate-950/50 dark:border-slate-800/80">
          <h3 className="text-[10px] font-mono font-black uppercase tracking-widest text-slate-500 border-b border-black/10 dark:border-slate-800 pb-2">3️⃣ Bukti Pendukung (Tautan Google Drive)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black uppercase tracking-wider text-blue-700 dark:text-cyan-400">🔗 Link Sertifikat (Wajib)</label>
              <input type="url" required name="bukti_sertifikat" value={formData.bukti_sertifikat} onChange={handleChange} placeholder="https://drive.google.com/..." className="w-full p-3 text-xs rounded-xl border-2 outline-none font-mono bg-blue-50 border-black text-blue-800 focus:border-blue-600 dark:bg-slate-900 dark:border-cyan-500/50 dark:text-cyan-300 dark:focus:border-cyan-400 shadow-sm" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">🔗 Link Dokumentasi Foto (Opsional)</label>
              <input type="url" name="bukti_foto" value={formData.bukti_foto} onChange={handleChange} placeholder="https://drive.google.com/..." className="w-full p-3 text-xs rounded-xl border-2 outline-none font-mono bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">Tanggal Ditetapkan</label>
              <input type="date" required name="tanggal" value={formData.tanggal} onChange={handleChange} className="w-full p-3 text-xs rounded-xl border-2 outline-none font-mono bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm" />
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">Nomor Sertifikat</label>
              <input type="text" name="nomor_sertifikat" value={formData.nomor_sertifikat} onChange={handleChange} placeholder="Cth: 001/OSN/2026" className="w-full p-3 text-xs rounded-xl border-2 outline-none font-mono bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm" />
            </div>
            <div className="space-y-1.5 md:col-span-1">
              <label className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-700 dark:text-slate-400">Keterangan Opsional</label>
              <input type="text" name="keterangan" value={formData.keterangan} onChange={handleChange} placeholder="Catatan tambahan..." className="w-full p-3 text-xs rounded-xl border-2 outline-none bg-white border-black text-black focus:border-blue-600 dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:focus:border-cyan-500 shadow-sm" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t-2 border-black/10 dark:border-slate-800">
          <button type="submit" disabled={loading} className="w-full py-4 font-black rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer disabled:opacity-50 border-2 bg-yellow-400 hover:bg-yellow-300 text-black border-black shadow-neo hover:-translate-y-1 active:translate-y-0 active:shadow-none dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 dark:border-transparent dark:shadow-none dark:hover:translate-y-0 flex items-center justify-center gap-2">
            {loading ? "Menyimpan Data..." : <><span>🚀</span> Ajukan Prestasi</>}
          </button>
        </div>

      </form>
    </div>
  );
}
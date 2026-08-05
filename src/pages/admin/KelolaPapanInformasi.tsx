/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
// 1. IMPORT FUNGSI KOMPRESI (Sesuaikan path-nya jika berbeda)
import { compressImage } from '../../utils/imageCompression';

interface InformasiItem {
  id: string;
  judul: string;
  konten: string;
  kategori: string;
  is_active: boolean;
  lampiran_url?: string | null;
  lampiran_tipe?: string | null;
  created_at: string;
}

export default function KelolaPapanInformasi() {
  const { profile } = useAuth();
  const [listInformasi, setListInformasi] = useState<InformasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [judul, setJudul] = useState('');
  const [konten, setKonten] = useState('');
  const [kategori, setKategori] = useState('UMUM');
  const [isActive, setIsActive] = useState(true);
  
  // 🌟 STATE BARU UNTUK UPLOAD FILE LAMPIRAN
  const [lampiranFile, setLampiranFile] = useState<File | null>(null);

  // 1. Tarik Semua Data (Aktif & Non-Aktif) khusus untuk Admin
  const fetchSemuaInformasi = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('papan_informasi')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListInformasi(data || []);
    } catch (err: any) {
      alert("❌ Gagal memuat daftar informasi: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemuaInformasi();
  }, []);

  // 2. FUNGSI HANDLER BARU UNTUK DETEKSI & KOMPRESI FILE
  const handleLampiranChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setLampiranFile(null);
      return;
    }

    // Cek apakah file yang diunggah adalah gambar
    if (file.type.startsWith('image/')) {
      // Jika gambar, jalankan kompresi
      const compressedFile = await compressImage(file);
      setLampiranFile(compressedFile as File);
    } else {
      // Jika dokumen (PDF, DOC), biarkan file asli tanpa kompresi
      setLampiranFile(file);
    }
  };

  // 3. Simpan Berita Baru ke Database (Lengkap dengan Upload Lampiran)
  const handleSimpan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return alert("⚠️ Sesi Admin tidak valid!");

    const cleanJudul = judul.trim();
    const cleanKonten = konten.trim();

    if (!cleanJudul || !cleanKonten) {
      return alert("⚠️ Judul dan Konten informasi wajib diisi!");
    }

    setIsSubmitting(true);
    try {
      let publicUrl = null;
      let tipeLampiran = null;

      // 🌟 PROSES UPLOAD KE SUPABASE STORAGE JIKA ADA FILE DIPILIH
      if (lampiranFile) {
        const fileExt = lampiranFile.name.split('.').pop()?.toLowerCase() || '';
        const randomStr = Math.random().toString(36).substring(2, 8);
        const fileName = `${Date.now()}-${randomStr}.${fileExt}`;
        const filePath = `berita/${fileName}`;

        // Tentukan tipe lampiran otomatis
        const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fileExt);
        tipeLampiran = isImage ? 'GAMBAR' : 'DOKUMEN';

        const { error: uploadError } = await supabase.storage
          .from('papan_informasi_lampiran')
          .upload(filePath, lampiranFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          throw new Error("Gagal mengunggah file lampiran: " + uploadError.message);
        }

        const { data: urlData } = supabase.storage
          .from('papan_informasi_lampiran')
          .getPublicUrl(filePath);

        publicUrl = urlData.publicUrl;
      }

      // 🌟 INSERT DATA KE TABEL PAPAN INFORMASI
      const { error } = await supabase.from('papan_informasi').insert([
        {
          judul: cleanJudul,
          konten: cleanKonten,
          kategori: kategori,
          is_active: isActive,
          author_id: profile.id,
          lampiran_url: publicUrl,
          lampiran_tipe: tipeLampiran
        }
      ]);

      if (error) throw error;

      alert("✅ Berita & lampiran berhasil diterbitkan ke Papan Informasi!");
      setJudul('');
      setKonten('');
      setKategori('UMUM');
      setIsActive(true);
      setLampiranFile(null);
      
      // Reset input file di DOM
      const fileInput = document.getElementById('fileLampiranInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      fetchSemuaInformasi();
    } catch (err: any) {
      alert("❌ Gagal menerbitkan berita: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Toggle Status Aktif / Non-Aktif (Kendali Siar Cepat)
  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('papan_informasi')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      setListInformasi(prev =>
        prev.map(item => item.id === id ? { ...item, is_active: !currentStatus } : item)
      );
    } catch (err: any) {
      alert("❌ Gagal mengubah status tayang: " + err.message);
    }
  };

  // 5. Hapus Berita
  const handleDelete = async (id: string, judulBerita: string) => {
    if (window.confirm(`🚨 PERINGATAN 🚨\n\nAnda yakin ingin menghapus permanen pengumuman "${judulBerita}"?`)) {
      try {
        const { error } = await supabase.from('papan_informasi').delete().eq('id', id);
        if (error) throw error;
        alert("🗑️ Berita berhasil dihapus!");
        setListInformasi(prev => prev.filter(item => item.id !== id));
      } catch (err: any) {
        alert("❌ Gagal menghapus berita: " + err.message);
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-16 max-w-6xl mx-auto">
      
      {/* HEADER HALAMAN */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border-2 border-black dark:border-slate-800 shadow-neo dark:shadow-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors duration-300">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>📢</span> Manajemen Papan Informasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-mono mt-1">
            Dapur publikasi pengumuman & instruksi resmi untuk seluruh ekosistem PENA OS.
          </p>
        </div>
        <div className="bg-blue-600 text-white font-mono text-xs font-bold px-4 py-2 rounded-xl shadow-sm uppercase tracking-wider">
          Otoritas: SUPERUSER
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* FORM INPUT BERITA BARU */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border-2 border-black dark:border-slate-800 shadow-neo dark:shadow-2xl space-y-5 transition-colors duration-300">
          <h2 className="text-sm font-mono font-black text-blue-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-2 border-b-2 border-slate-100 dark:border-slate-800 pb-3">
            <span>✍️</span> Buat Pengumuman Baru
          </h2>
          
          <form onSubmit={handleSimpan} className="space-y-4 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-[10px]">Judul Pengumuman</label>
              <input
                type="text"
                required
                value={judul}
                onChange={e => setJudul(e.target.value)}
                placeholder="Contoh: Jadwal Pemutakhiran Rapor Pendidikan..."
                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white outline-none focus:border-blue-600 dark:focus:border-cyan-400 font-sans font-medium transition-colors"
              />
            </div>

            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-[10px]">Kategori Berita</label>
              <select
                value={kategori}
                onChange={e => setKategori(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white outline-none focus:border-blue-600 dark:focus:border-cyan-400 font-mono transition-colors cursor-pointer"
              >
                <option value="UMUM">📘 UMUM (Informasi Biasa)</option>
                <option value="PENTING">⚠️ PENTING (Instruksi Resmi)</option>
                <option value="DARURAT">🚨 DARURAT (Batas Waktu / Urgent)</option>
                <option value="PRESTASI">🏆 PRESTASI (Apresiasi / Juara)</option>
              </select>
            </div>

            <div>
              <label className="block mb-1.5 uppercase tracking-wider text-[10px]">Isi Konten & Instruksi</label>
              <textarea
                rows={4}
                required
                value={konten}
                onChange={e => setKonten(e.target.value)}
                placeholder="Tuliskan isi pengumuman secara lengkap dan jelas di sini..."
                className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white outline-none focus:border-blue-600 dark:focus:border-cyan-400 font-sans font-medium transition-colors resize-none"
              />
            </div>

            {/* 🌟 KOLOM INPUT UPLOAD FILE LAMPIRAN 🌟 */}
            <div className="p-3.5 bg-blue-50/50 dark:bg-slate-950/80 rounded-2xl border-2 border-dashed border-blue-300 dark:border-slate-700 space-y-2">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-blue-700 dark:text-cyan-400 font-black">
                📎 Unggah Lampiran (Opsional)
              </label>
              {/* 4. UBAH onChange MENJADI handleLampiranChange */}
              <input
                id="fileLampiranInput"
                type="file"
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleLampiranChange}
                className="w-full text-xs text-slate-500 dark:text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:bg-blue-600 file:text-white hover:file:bg-blue-700 dark:file:bg-cyan-500 dark:file:text-slate-950 cursor-pointer"
              />
              <p className="text-[9px] text-slate-400 font-mono italic">
                *Mendukung Gambar (JPG, PNG, WEBP) & Dokumen (PDF, DOC).
              </p>
            </div>

            <div className="flex items-center gap-3 py-2 bg-slate-100 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <input
                type="checkbox"
                id="checkActive"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
              <label htmlFor="checkActive" className="cursor-pointer text-xs select-none">
                Langsung tayangkan ke seluruh dasbor pengguna
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 rounded-xl text-white font-black text-xs uppercase tracking-widest shadow-lg transition-all duration-300 flex items-center justify-center gap-2 border-2 border-black dark:border-transparent ${
                isSubmitting
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 dark:bg-linear-to-r dark:from-cyan-500 dark:to-blue-600 dark:hover:from-cyan-400 dark:hover:to-blue-500 hover:-translate-y-0.5 cursor-pointer shadow-blue-500/30'
              }`}
            >
              <span>{isSubmitting ? "🚀 MENGUNGGAH & MENERBITKAN..." : "🚀 TERBITKAN SEKARANG"}</span>
            </button>
          </form>
        </div>

        {/* TABEL ARSIP PENGUMUMAN */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border-2 border-black dark:border-slate-800 shadow-neo dark:shadow-2xl space-y-4 transition-colors duration-300">
          <div className="flex items-center justify-between border-b-2 border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-mono font-black text-slate-900 dark:text-white">
              Arsip Berita & Instruksi ({listInformasi.length})
            </h3>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
              Klik tombol status untuk mengubah penayangan
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs animate-pulse">
              Mengunduh data pengumuman dari server...
            </div>
          ) : listInformasi.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
              <span className="text-4xl block mb-2">📭</span>
              <p className="text-slate-500 text-xs font-medium">Belum ada pengumuman yang pernah dibuat.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-160 overflow-y-auto pr-1 custom-scrollbar">
              {listInformasi.map(item => (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between gap-3 ${
                    item.is_active
                      ? 'bg-slate-50 dark:bg-slate-950/80 border-slate-300 dark:border-slate-800 shadow-sm'
                      : 'bg-slate-100/50 dark:bg-slate-950/30 border-dashed border-slate-300 dark:border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-black uppercase tracking-wider ${
                          item.kategori === 'DARURAT' ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' :
                          item.kategori === 'PENTING' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30' :
                          item.kategori === 'PRESTASI' ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' :
                          'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                        }`}>
                          {item.kategori || 'UMUM'}
                        </span>

                        {/* Indikator Jika Ada Lampiran */}
                        {item.lampiran_url && (
                          <span className="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold flex items-center gap-1">
                            <span>{item.lampiran_tipe === 'GAMBAR' ? '🖼️ Gambar' : '📄 Dokumen'}</span>
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <h4 className="text-base font-black text-slate-900 dark:text-white leading-snug pt-1">
                      {item.judul}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed whitespace-pre-wrap">
                      {item.konten}
                    </p>
                  </div>

                  {/* AKSI ADMIN: TOGGLE & HAPUS */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800/80 mt-1">
                    <button
                      onClick={() => handleToggleActive(item.id, item.is_active)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 border ${
                        item.is_active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500 hover:text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700'
                      }`}
                      title="Klik untuk mengubah status penayangan"
                    >
                      <span className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{item.is_active ? '🟢 Sedang Tayang' : '⚪ Disembunyikan'}</span>
                    </button>

                    <button
                      onClick={() => handleDelete(item.id, item.judul)}
                      className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 font-mono text-xs font-bold px-2.5 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer flex items-center gap-1"
                      title="Hapus permanen"
                    >
                      <span>🗑️</span> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
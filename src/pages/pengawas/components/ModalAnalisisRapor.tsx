import React, { useState } from 'react';
import * as XLSX from 'xlsx';
// Sesuaikan jumlah '../' dengan lokasi file supabaseClient.ts Anda di proyek
import { supabase } from '../../../supabaseClient'; 

interface SekolahDetails {
  id?: string;
  npsn?: string;
  nama_sekolah?: string;
  nama_kepala_sekolah?: string;
  [key: string]: unknown;
}

interface RaporAjuan {
  id: string;
  sekolah_id: string;
  data_mentah_json: {
    nama_file: string;
    tahun_ajaran: string;
    tautan_unduh_excel: string;
    ukuran_bytes: number;
  };
  hasil_analisis_ai: string | null;
  catatan_pengawas: string | null;
  status_ai: string;
  profiles?: {
    nama_lengkap: string;
    nomor_induk: string;
  };
}

interface ModalAnalisisRaporProps {
  isOpen: boolean;
  onClose: () => void;
  raporItem: RaporAjuan;
  sekolahDetails?: SekolahDetails;
  onSuccess: () => void;
}

export default function ModalAnalisisRapor({ 
  isOpen, 
  onClose, 
  raporItem, 
  sekolahDetails, 
  onSuccess 
}: ModalAnalisisRaporProps) {
  const [loadingAi, setLoadingAi] = useState(false);
  const [errorAi, setErrorAi] = useState<string | null>(null);
  const [hasilSementara, setHasilSementara] = useState<string | null>(raporItem.hasil_analisis_ai);

  if (!isOpen) return null;

  const handleMulaiAnalisis = async () => {
    setLoadingAi(true);
    setErrorAi(null);

    try {
      // 🌟 SOLUSI TS(2339): Type casting import.meta.env secara aman
      const customEnv = (import.meta as unknown as { env: Record<string, string | undefined> }).env;
      const apiKey = (customEnv.VITE_GEMINI_API_KEY || localStorage.getItem('PENA_GEMINI_KEY') || '').trim();

      if (!apiKey || apiKey.toUpperCase() === 'DEMO') {
        throw new Error("API Key Gemini belum dikonfigurasi dengan benar di file .env server.");
      }

      // --- [PENA SHIELD: PROTEKSI KUOTA & ANTI-SPAM] ---
      const lastRequestTime = localStorage.getItem('PENA_LAST_AI_REQUEST');
      const now = Date.now();
      if (lastRequestTime && now - parseInt(lastRequestTime) < 30000) {
        const sisaDetik = Math.ceil((30000 - (now - parseInt(lastRequestTime))) / 1000);
        throw new Error(`🛡️ PENA Shield: Batas frekuensi aktif. Silakan tunggu ${sisaDetik} detik lagi demi penghematan kuota.`);
      }
      localStorage.setItem('PENA_LAST_AI_REQUEST', now.toString());
      // --- [SELESAI PENA SHIELD] ---

      const namaSekolahFix = sekolahDetails?.nama_sekolah || raporItem.profiles?.nama_lengkap || 'Satuan Pendidikan';
      const tahunAjaranFix = raporItem.data_mentah_json.tahun_ajaran || '2025/2026';

      // 1. Update status di database Supabase ke PROSES_AI
      await supabase.from('rapor_sekolah').update({ status_ai: 'PROSES_AI' }).eq('id', raporItem.id);
      onSuccess();

      // 2. Download berkas Excel dari Supabase Storage
      const urlPenuh = raporItem.data_mentah_json.tautan_unduh_excel;
      const pathStorage = urlPenuh.substring(urlPenuh.indexOf('rapor_dokumen/') + 14);
      const { data: blob, error: errDownload } = await supabase.storage.from('rapor_dokumen').download(pathStorage);
      
      if (errDownload || !blob) {
        throw new Error("Gagal mengunduh berkas Excel Rapor dari server Supabase.");
      }

      // 3. Parse Excel Sheet 1 ke format CSV
      const buffer = await blob.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const rawCsv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[1]]);

      // 4. 🌟 PROMPT UPGRADE: 12 INDIKATOR & PAKSAAN PENGISIAN RENCANA KERJA
      const promptKetat = `Anda adalah Analis Rapor Pendidikan dan Pakar Manajemen Sekolah Kemdikbud RI. 
Analisis data CSV Laporan Rapor Pendidikan ${namaSekolahFix} Tahun ${tahunAjaranFix} berikut: """${rawCsv}"""

Tugas Anda adalah menyajikannya ke dalam bentuk tabel HTML murni yang rapi, indah, dan mudah dibaca dengan kontras warna tinggi.

WAJIB IKUTI ATURAN STRUKTUR, DESAIN, & KONTEN BERIKUT SECARA ABSOLUT:
1. Hasil akhir harus dibungkus dalam tag: <div class="w-full overflow-x-auto bg-white p-6 rounded-2xl shadow-xl border border-slate-100 text-slate-900 my-4">
2. Berikan Judul Atas berupa div dengan kelas: <div class="bg-emerald-600 text-white font-black text-center py-3.5 text-sm tracking-wide uppercase rounded-t-xl">Laporan Rapor Pendidikan 12 Indikator Prioritas (${namaSekolahFix} - Tahun ${tahunAjaranFix})</div>
3. Gunakan tag <table class="w-full text-left border-collapse text-xs">
4. Baris header <tr> wajib memiliki kelas "bg-emerald-100 text-emerald-950 border-b-2 border-emerald-500 text-center font-black". Kolom header terdiri dari tepat 6 kolom: [Indikator Prioritas, Nilai Lama, Nilai Baru, Tren, Rencana Tindak Lanjut, Program Kegiatan].
5. Semua teks di dalam isi tabel (<tbody>) WAJIB berwarna gelap jernih agar terbaca sempurna di latar putih. Gunakan class "hover:bg-slate-50 text-slate-900 border-b border-slate-200" pada setiap baris <tr>.
6. Untuk kolom TREN, tampilkan dengan format badge pil:
   - Jika naik: <span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded-full inline-block">⬆️ Naik</span>
   - Jika turun: <span class="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-full inline-block">⬇️ Turun</span>
   - Jika stabil/tetap/baru: <span class="px-2 py-0.5 bg-blue-100 text-blue-700 font-bold rounded-full inline-block">➡️ Stabil / Baru</span>
7. 💥 ATURAN MUTLAK KONTEN (TIDAK BOLEH KOSONG): Kolom "Rencana Tindak Lanjut" dan "Program Kegiatan" TIDAK BOLEH KOSONG ATAU STRIP (-) SECARA SAMA SEKALI! Jika di dalam CSV tidak tertulis rencana kerjanya, Anda SEBAGAI AI PAKAR PENDIDIKAN WAJIB MERUMUSKAN SENDIRI minimal 1 kalimat Solusi Klinis/Tindak Lanjut yang aplikatif dan 1 nama Program Kegiatan nyata di sekolah untuk setiap baris indikator tersebut berdasarkan skor dan trennya!
8. Tampilkan LENGKAP seluruh 12 INDIKATOR PRIORITAS berikut secara berurutan di dalam tabel:
   1. Kemampuan Literasi
   2. Kemampuan Numerasi
   3. Indeks Karakter
   4. Iklim Keamanan Sekolah
   5. Iklim Kebinekaan
   6. Partisipasi Warga Satuan
   7. Proporsi Pemanfaatan SDM
   8. Pemanfaatan TIK untuk Pengelolaan Anggaran
   9. Program dan Kebijakan Sekolah
   10. Tujuh Kebiasaan Anak Indonesia Hebat (Kode D.19) - Fokus pada pemetaan karakter pembiasaan: Bangun Pagi, Beribadah, Berolahraga, Makan Sehat dan Bergizi, Gemar Belajar, Bermasyarakat, serta Tidur Cepat.
   11. Ketersediaan Buku Pendidikan (Kode E.6) - Fokus pada evaluasi kecukupan dan distribusi buku teks utama serta buku non-teks di perpustakaan/pojok baca sekolah.
   12. Kesiapsiagaan Bencana dan Perubahan Iklim (Kode D.18) - Fokus pada program Satuan Pendidikan Aman Bencana (SPAB), pemahaman risiko bencana, manajemen, dan fasilitas pengamanan infrastruktur sekolah.

Jika nilai untuk indikator nomor 10, 11, atau 12 belum tercantum secara eksplisit di angka CSV lama, perkirakan berdasarkan korelasi iklim keamanan & karakter, lalu beri penanda "(Evaluasi SPAB/Baru)" pada angkanya, NAMUN Rencana Tindak Lanjut dan Program Kegiatannya WAJIB TETAP DIISI KONGKRET sesuai standar Kemdikbud!

Jangan gunakan format markdown (\`\`\`html ... \`\`\`). Berikan HANYA struktur tag elemen <div class="w-full...">...</div> langsung.`;

      // 5. Kirim ke Google Gemini 2.5 Flash
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: promptKetat }] }] })
      });

      if (!res.ok) {
        throw new Error(`Gagal menghubungi satelit Gemini (Status: ${res.status})`);
      }

      const json = await res.json();
      if (json.error) throw new Error(json.error.message);

      let htmlAI = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      htmlAI = htmlAI.replace(/```html/g, '').replace(/```/g, '').trim();

      if (!htmlAI) {
        throw new Error("Gemini tidak menghasilkan analisis yang valid.");
      }

      // 6. Simpan hasil HTML ke database Supabase
      await supabase.from('rapor_sekolah').update({ 
        hasil_analisis_ai: htmlAI, 
        status_ai: 'SELESAI' 
      }).eq('id', raporItem.id);

      setHasilSementara(htmlAI);
      onSuccess(); // Refresh tabel induk
    } catch (err: unknown) {
      console.error("PENA AI ERROR:", err);
      const pesanError = err instanceof Error ? err.message : "Terjadi kesalahan sistem saat memproses AI.";
      setErrorAi(pesanError);
      
      // Kembalikan status jika gagal
      await supabase.from('rapor_sekolah').update({ status_ai: 'MENUNGGU_PENGAWAS' }).eq('id', raporItem.id);
      onSuccess();
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      {/* Kontainer Modal dengan Nuansa Digital Cyber Blue */}
      <div className="bg-white dark:bg-[#061030] border-4 border-black dark:border-cyan-500/50 rounded-3xl p-6 sm:p-8 max-w-5xl w-full shadow-neo relative max-h-[90vh] flex flex-col justify-between transition-colors">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-slate-200 dark:border-blue-500/30 shrink-0">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-cyan-500/15 dark:text-cyan-300 border dark:border-cyan-400/30">
              PENA AI Engine • 12 Indikator Prioritas
            </span>
            <h2 className="text-lg sm:text-xl font-black flex items-center gap-2 mt-1 text-black dark:text-white">
              <span>🤖</span> Bedah Rapor AI: <span className="text-blue-600 dark:text-cyan-400">{sekolahDetails?.nama_sekolah || 'Satuan Pendidikan'}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">📄 Berkas: {raporItem.data_mentah_json.nama_file}</p>
          </div>
          
          <button 
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-rose-500 text-white font-black rounded-xl hover:bg-rose-600 transition-all cursor-pointer shadow-sm shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Isi / Ruang Render Analisis */}
        <div className="py-6 overflow-y-auto custom-scrollbar flex-1 my-2 space-y-4">
          {!hasilSementara && !loadingAi && !errorAi && (
            <div className="text-center py-12 px-4 bg-slate-50 dark:bg-[#040c24]/60 border-2 border-dashed border-slate-300 dark:border-blue-500/30 rounded-2xl">
              <div className="text-4xl mb-3">⚡</div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">Siap Menganalisis 12 Indikator Rapor</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                Tekan tombol di bawah untuk memproses data. Gemini AI akan otomatis merumuskan <strong>Rencana Tindak Lanjut</strong> dan <strong>Program Kegiatan</strong> untuk seluruh 12 Indikator termasuk 7 Kebiasaan Anak Hebat (D.19), Buku (E.6), dan SPAB (D.18).
              </p>
            </div>
          )}

          {loadingAi && (
            <div className="text-center py-16 space-y-4">
              <div className="w-14 h-14 border-4 border-blue-600 dark:border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto shadow-[0_0_15px_rgba(6,182,212,0.4)]" />
              <div>
                <p className="font-mono text-xs font-bold text-blue-600 dark:text-cyan-400 animate-pulse uppercase tracking-wider">
                  ⏳ Bedah Rapor AI (12 Indikator) Sedang Berlangsung...
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Menyusun rekomendasi klinis & menyuntikkan indikator D.19, E.6, serta D.18.
                </p>
              </div>
            </div>
          )}

          {errorAi && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border-2 border-rose-500 rounded-2xl text-rose-700 dark:text-rose-300 text-xs space-y-1 animate-fade-in">
              <p className="font-bold flex items-center gap-1.5 text-sm"><span>❌</span> Gagal Memproses Analisis AI:</p>
              <p className="font-mono bg-rose-100 dark:bg-rose-900/40 p-2.5 rounded-xl">{errorAi}</p>
            </div>
          )}

          {hasilSementara && !loadingAi && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b border-black/10 dark:border-cyan-500/20 pb-2">
                <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">⚡ Hasil Generasi Gemini 2.5 Flash (12 Indikator)</span>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> TERSIMPAN DI SUPABASE
                </span>
              </div>
              
              {/* Render HTML Tabel Rapor dari Gemini */}
              {hasilSementara.includes('<div') || hasilSementara.includes('<table') ? (
                <div 
                  className="w-full overflow-x-auto rounded-2xl"
                  dangerouslySetInnerHTML={{ __html: hasilSementara }} 
                />
              ) : (
                <pre className="whitespace-pre-wrap text-slate-800 dark:text-slate-200 text-xs bg-slate-100 dark:bg-[#040c24] p-4 rounded-xl font-mono">
                  {hasilSementara}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer Tombol Kendali */}
        <div className="pt-4 border-t-2 border-slate-200 dark:border-blue-500/30 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
          >
            Tutup Panel
          </button>
          
          <button
            onClick={handleMulaiAnalisis}
            disabled={loadingAi}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 border-2 border-black dark:border-cyan-400 shadow-neo dark:shadow-[0_0_15px_rgba(6,182,212,0.3)] cursor-pointer ${
              loadingAi 
                ? 'bg-slate-400 text-white cursor-not-allowed border-transparent' 
                : 'bg-yellow-400 text-black hover:bg-yellow-500 dark:bg-linear-to-r dark:from-cyan-500 dark:to-blue-600 dark:text-slate-950 dark:hover:scale-[1.02]'
            }`}
          >
            <span>⚡</span> {hasilSementara ? 'Analisis Ulang (12 Indikator)' : 'Mulai Analisis AI Sekarang'}
          </button>
        </div>

      </div>
    </div>
  );
}
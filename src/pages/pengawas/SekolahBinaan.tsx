import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import * as XLSX from 'xlsx';

import logoPena from '../../assets/logo_pena.png';
import bannerPena from '../../assets/banner_pena.png';

interface SekolahBinaan { 
  id: string; 
  npsn: string; 
  nama_sekolah?: string;
  nama_kepala_sekolah?: string; 
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

export default function SekolahBinaanDanRapor() {
  const { profile } = useAuth();
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('PENA_GEMINI_KEY') || '');

  const [listSekolah, setListSekolah] = useState<SekolahBinaan[]>([]);
  const [listRapor, setListRapor] = useState<RaporAjuan[]>([]);
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [inputCatatan, setInputCatatan] = useState<{ [key: string]: string }>({});

  // Form Tambah Sekolah
  const [sbNpsn, setSbNpsn] = useState('');
  const [sbNama, setSbNama] = useState('');

  // STATE BARU UNTUK FITUR DROPDOWN
  const [selectedNpsn, setSelectedNpsn] = useState<string>('');

  const fetchRaporAjuan = async () => {
    const { data } = await supabase
      .from('rapor_sekolah')
      .select('*, profiles(nama_lengkap, nomor_induk)')
      .order('created_at', { ascending: false });
    
    setListRapor(data || []);
    const cat: {[k:string]:string} = {}; 
    (data || []).forEach(r => { 
      if (r.catatan_pengawas) cat[r.id] = r.catatan_pengawas; 
    });
    setInputCatatan(cat);
  };

  const fetchSekolahBinaan = async () => {
    if (!profile?.id) return;
    try {
      const [resBinaan, resMaster] = await Promise.all([
        supabase.from('sekolah_binaan').select('*').eq('pengawas_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('sekolah').select('npsn, nama_kepala_sekolah')
      ]);

      const binaanRaw = resBinaan.data || [];
      const masterRaw = resMaster.data || [];

      const rakitanBinaan = binaanRaw.map(b => {
        const mst = masterRaw.find(m => m.npsn === b.npsn);
        return {
          ...b,
          nama_kepala_sekolah: b.nama_kepala_sekolah || mst?.nama_kepala_sekolah || 'Belum dikonfigurasi'
        };
      });

      setListSekolah(rakitanBinaan);
    } catch (err: any) { 
      console.error("Gagal menarik data binaan:", err); 
    }
  };

  useEffect(() => { 
    fetchSekolahBinaan();
    fetchRaporAjuan(); 
  }, [profile]);

  const handleSimpanKey = (key: string) => {
    setGeminiKey(key); 
    localStorage.setItem('PENA_GEMINI_KEY', key); 
  };

  // 💥 PERBAIKAN MUTLAK: IMMUNITY BYPASS "users_email_partial_key" 💥
  const handleTambahSekolahBinaan = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!profile?.id) return;

    const npsnBersih = sbNpsn.trim(); 
    const namaBersih = sbNama.trim();
    if (!npsnBersih || !namaBersih) {
      alert("NPSN dan Nama Sekolah wajib diisi!"); 
      return; 
    }

    if (listSekolah.some(s => s.npsn === npsnBersih)) { 
      alert(` ℹ️ Sekolah NPSN (${npsnBersih}) sudah ada di binaan Anda.`); 
      return; 
    }

    try {
      const emailSekolah = `${npsnBersih}@sekolah.pena.com`; 
      const passwordSekolah = npsnBersih;
      let targetUserId = null;

      const { data: existingProf } = await supabase.from('profiles').select('id').eq('nomor_induk', npsnBersih).maybeSingle();
      
      if (existingProf) {
         targetUserId = existingProf.id;
      } else {
         const { data: { session: currentSession } } = await supabase.auth.getSession();
         const { data: authData, error: authError } = await supabase.auth.signUp({ email: emailSekolah, password: passwordSekolah });
         
         if (authError) {
             const { data: loginData } = await supabase.auth.signInWithPassword({ email: emailSekolah, password: passwordSekolah });
             targetUserId = loginData?.user?.id;
         } else {
             targetUserId = authData?.user?.id;
         }

         if (currentSession) {
           await supabase.auth.setSession({ access_token: currentSession.access_token, refresh_token: currentSession.refresh_token });
         }
      }

      if (!targetUserId) throw new Error("Gagal sinkronisasi ID Autentikasi.");

      await supabase.from('profiles').upsert(
         { id: targetUserId, role: 'SEKOLAH', nama_lengkap: namaBersih, nomor_induk: npsnBersih, email: emailSekolah },
         { onConflict: 'id' }
      );
      
      const { error: errSekolah } = await supabase.from('sekolah').upsert(
         { id: targetUserId, user_id: targetUserId, npsn: npsnBersih, nama_sekolah: namaBersih, pengawas_id: profile.id },
         { onConflict: 'id' }
      );
      
      if (errSekolah && !errSekolah.message.includes('users_email_partial_key') && !errSekolah.message.includes('duplicate key')) {
         throw new Error("Database Sekolah: " + errSekolah.message);
      }

      const { data: cekBinaan } = await supabase.from('sekolah_binaan').select('id').eq('sekolah_id', targetUserId).eq('pengawas_id', profile.id).maybeSingle();
      if (!cekBinaan) {
         await supabase.from('sekolah_binaan').insert([{ pengawas_id: profile.id, sekolah_id: targetUserId, npsn: npsnBersih, nama_sekolah: namaBersih }]);
      }
      
      setSbNpsn(''); 
      setSbNama('');
      fetchSekolahBinaan();
      alert(` ✅ BERHASIL! Satuan Pendidikan didaftarkan.\n\nNPSN: ${npsnBersih}\nSandi: ${passwordSekolah}`);

    } catch (err: any) { 
      alert(` ⚠️ ERROR SISTEM:\n\n${err.message}`); 
    }
  };

  const handleDeleteSekolahBinaan = async (id: string, nama: string) => {
    if (window.confirm(`Hapus ${nama} dari daftar binaan?`)) { 
      await supabase.from('sekolah_binaan').delete().eq('id', id);
      setListSekolah(p => p.filter(x => x.id !== id)); 
      if (selectedNpsn === listSekolah.find(x => x.id === id)?.npsn) setSelectedNpsn('');
    }
  };

  const handleDeleteRapor = async (id: string, namaSekolah: string) => {
    if (window.confirm(`Hapus permanen arsip Rapor AI milik ${namaSekolah}?`)) { 
      await supabase.from('rapor_sekolah').delete().eq('id', id); 
      setListRapor(p => p.filter(r => r.id !== id)); 
    }
  };

  const handleSimpanCatatanRapor = async (raporId: string) => {
    await supabase.from('rapor_sekolah').update({ catatan_pengawas: inputCatatan[raporId] || '' }).eq('id', raporId);
    alert("Catatan rekomendasi berhasil dikirim!"); 
    fetchRaporAjuan();
  };

  const handleDownloadPDFRapor = (htmlContent: string, namaSekolah: string, tahun: string) => {
    const w = window.open('', '_blank'); 
    if (!w) { alert("Izinkan pop-up browser."); return; }
    
    w.document.write(`<!DOCTYPE html><html><head><title>Rapor AI - ${namaSekolah}</title><script src="https://cdn.tailwindcss.com"></script></head><body class="p-10 font-sans text-slate-900 bg-white"><div class="border-b-4 border-slate-900 pb-4 mb-6"> <h1 class="text-2xl font-black uppercase">LAPORAN ANALISIS RAPOR PENDIDIKAN (PENA AI)</h1> <p class="text-sm font-bold text-slate-600">${namaSekolah} • Tahun Ajaran ${tahun}</p></div>${htmlContent}<div class="mt-16 pt-6 border-t-2 border-slate-300 text-xs font-bold text-slate-600 flex justify-between"><span>Disahkan oleh: Pengawas Satuan Pendidikan</span><span>Decision Support System PENA OS v2.0</span></div></body></html>`);
    w.document.close(); 
    w.focus(); 
    setTimeout(() => { w.print(); }, 1000);
  };

  const handleTriggerKecerdasanBuatan = async (raporItem: RaporAjuan) => {
    const key = geminiKey.trim();
    
    if (!key) { 
      alert("Masukkan Kunci API Gemini Anda di kotak atas!"); 
      return; 
    }
    if (key.toUpperCase() === 'DEMO') {
      alert("🚨 Mode 'DEMO' dinonaktifkan. Silakan gunakan API Key asli.");
      return;
    }

    setAiLoadingId(raporItem.id);

    const matchSek = listSekolah.find(s => s.npsn === raporItem.profiles?.nomor_induk);
    const namaSekolahFix = matchSek?.nama_sekolah || raporItem.profiles?.nama_lengkap || 'Satuan Pendidikan';
    const tahunAjaranFixFix = raporItem.data_mentah_json.tahun_ajaran || '2025/2026';

    try {
      await supabase.from('rapor_sekolah').update({ status_ai: 'PROSES_AI' }).eq('id', raporItem.id); 
      fetchRaporAjuan();
      
      const urlPenuh = raporItem.data_mentah_json.tautan_unduh_excel; 
      const pathStorage = urlPenuh.substring(urlPenuh.indexOf('rapor_dokumen/') + 14);
      const { data: blob } = await supabase.storage.from('rapor_dokumen').download(pathStorage);
      if (!blob) throw new Error("Gagal mendownload berkas Excel Rapor dari server");

      const buffer = await blob.arrayBuffer(); 
      const wb = XLSX.read(buffer, { type: 'array' });
      const rawCsv = XLSX.utils.sheet_to_csv(wb.Sheets[wb.SheetNames[1]]);
      
      const promptKetat = `Anda adalah Analis Rapor Pendidikan Kemdikbud RI. 
Analisis data CSV Laporan Rapor Pendidikan ${namaSekolahFix} Tahun ${tahunAjaranFixFix} berikut: """${rawCsv}"""

Tugas Anda adalah menyajikannya ke dalam bentuk tabel HTML murni yang rapi, indah, dan mudah dibaca dengan kontras warna tinggi.

WAJIB IKUTI ATURAN STRUKTUR & DESAIN BERIKUT SECARA ABSOLUT:
1. Hasil akhir harus dibungkus dalam tag: <div class="w-full overflow-x-auto bg-white p-6 rounded-2xl shadow-xl border border-slate-100 text-slate-900 my-4">
2. Berikan Judul Atas berupa div dengan kelas: <div class="bg-emerald-600 text-white font-black text-center py-3.5 text-sm tracking-wide uppercase rounded-t-xl">Laporan Rapor Pendidikan 9 Indikator Prioritas (${namaSekolahFix} - Tahun ${tahunAjaranFixFix})</div>
3. Gunakan tag <table class="w-full text-left border-collapse text-xs">
4. Baris header <tr> wajib memiliki kelas "bg-emerald-100 text-emerald-950 border-b-2 border-emerald-500 text-center font-black". Kolom header terdiri dari: [Indikator Prioritas, Nilai Lama, Nilai Baru, Tren, Rencana Tindak Lanjut, Program Kegiatan].
5. Semua teks di dalam isi tabel (<tbody>) WAJIB berwarna gelap jernih agar terbaca sempurna di latar putih. Gunakan class "hover:bg-slate-50 text-slate-900" pada setiap <tr>.
6. Untuk kolom TREN, tampilkan dengan format badge pil:
   - Jika naik: <span class="px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded-full">⬆️ Naik</span>
   - Jika turun: <span class="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded-full">⬇️ Turun</span>
7. Tampilkan LENGKAP seluruh 9 INDIKATOR PRIORITAS Kemdikbud berikut secara berurutan:
   1. Kemampuan Literasi
   2. Kemampuan Numerasi
   3. Indeks Karakter
   4. Iklim Keamanan Sekolah
   5. Iklim Kebhinekaan
   6. Partisipasi Warga Satuan
   7. Proporsi Pemanfaatan SDM
   8. Pemanfaatan TIK untuk Pengelolaan Anggaran
   9. Program dan Kebijakan Sekolah

Jangan gunakan format markdown (\`\`\`html ... \`\`\`). Berikan HANYA struktur tag elemen <div class="w-full...">...</div> langsung.`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ contents: [{ parts: [{ text: promptKetat }] }] })
      });
      const json = await res.json(); 
      if (json.error) throw new Error(json.error.message);
      
      let htmlAI = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
      htmlAI = htmlAI.replace(/```html/g, '').replace(/```/g, '').trim();

      await supabase.from('rapor_sekolah').update({ hasil_analisis_ai: htmlAI, status_ai: 'SELESAI' }).eq('id', raporItem.id);
      fetchRaporAjuan();
    } catch (e:any) { 
      alert("Peringatan AI: " + e.message); 
      await supabase.from('rapor_sekolah').update({ status_ai: 'MENUNGGU_PENGAWAS' }).eq('id', raporItem.id); 
      fetchRaporAjuan(); 
    } finally { 
      setAiLoadingId(null); 
    }
  };

  // IDENTIFIKASI DATA YANG DIPILIH DARI DROPDOWN
  const selectedSekolahDetails = listSekolah.find(s => s.npsn === selectedNpsn);
  const selectedRaporData = listRapor.find(r => r.profiles?.nomor_induk === selectedNpsn);

  return (
    <div className="space-y-8 animate-fade-in text-slate-100 font-sans pb-16 select-none max-w-7xl mx-auto px-4">
      
      {/* HERO BANNER UNIVERSAL */}
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mb-2 group shrink-0">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src={bannerPena} alt="" className="w-full h-full object-cover opacity-20" />
          <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-900/90 to-transparent" />
        </div>
        <div className="relative z-10 p-6 sm:p-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img src={logoPena} alt="" className="w-10 h-10 object-contain" />
            <div>
              <h2 className="text-xl font-black">PENA Enterprise</h2>
              <p className="text-xs text-slate-300">"Sekolah Binaan & Bedah Rapor AI (9 Indikator)"</p>
            </div>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded-xl w-64">
            <input type="password" value={geminiKey} onChange={e=>handleSimpanKey(e.target.value)} placeholder="API Key / Ketik DEMO" className="w-full bg-transparent text-xs text-white font-mono outline-none" />
          </div>
        </div>
      </div>

      {/* SEKSI 1: FORM TAMBAH BINAAN (Tetap dipertahankan agar tidak hilang) */}
      <div className="bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800/80 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-mono text-blue-400 font-bold text-base flex items-center gap-2"><span>🏫</span> REGISTRASI SEKOLAH BINAAN</h2>
            <p className="text-xs text-slate-400">Tambahkan sekolah baru ke dalam daftar wewenang Anda.</p>
          </div>
        </div>
        <form onSubmit={handleTambahSekolahBinaan} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          <input type="text" required value={sbNpsn} onChange={e=>setSbNpsn(e.target.value)} placeholder="NPSN (Contoh: 20312172)" className="sm:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-blue-500" />
          <input type="text" required value={sbNama} onChange={e=>setSbNama(e.target.value)} placeholder="Nama Instansi (Contoh: SMA Negeri 1 Mirit)" className="sm:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-blue-500" />
          <button type="submit" className="sm:col-span-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-black rounded-xl p-3 cursor-pointer shadow-lg">➕ Daftarkan</button>
        </form>
      </div>

      {/* SEKSI 2: UI DROPDOWN PILIH SEKOLAH & BEDAH RAPOR */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <label className="block text-sm font-mono font-black text-cyan-400 uppercase tracking-widest mb-3">
            🗺️ Pilih Sekolah Binaan untuk Dibedah
          </label>
          <div className="flex gap-4 items-center">
            <select
              value={selectedNpsn}
              onChange={(e) => setSelectedNpsn(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:border-cyan-500 outline-none font-sans font-bold cursor-pointer transition-all"
            >
              <option value="">-- SILAKAN PILIH SEKOLAH BINAAN ({listSekolah.length} Terdaftar) --</option>
              {listSekolah.map((sekolah) => (
                <option key={sekolah.id} value={sekolah.npsn}>
                  🏫 {sekolah.nama_sekolah} (NPSN: {sekolah.npsn})
                </option>
              ))}
            </select>
            
            {/* Tombol Hapus Binaan Muncul Jika Sekolah Dipilih */}
            {selectedSekolahDetails && (
              <button 
                onClick={() => handleDeleteSekolahBinaan(selectedSekolahDetails.id, selectedSekolahDetails.nama_sekolah || selectedSekolahDetails.npsn)} 
                className="px-6 py-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-xl font-bold hover:bg-rose-500 hover:text-white transition-colors cursor-pointer shrink-0" 
                title="Hapus dari daftar binaan"
              >
                Hapus Binaan
              </button>
            )}
          </div>
        </div>

        {/* LOGIKA TAMPILAN BERDASARKAN DROPDOWN */}
        {!selectedNpsn && (
          <div className="py-12 text-center border-2 border-dashed border-slate-800 rounded-2xl">
            <span className="text-4xl block mb-3">🏫</span>
            <p className="text-slate-400 text-sm font-medium">Pilih sekolah melalui menu *dropdown* di atas untuk memuat dasbor Bedah Rapor AI.</p>
          </div>
        )}

        {selectedNpsn && !selectedRaporData && (
          <div className="p-6 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-center text-sm font-medium animate-fade-in">
            ⚠️ <strong>{selectedSekolahDetails?.nama_sekolah}</strong> belum melakukan unggah / submission Rapor Pendidikan Excel di akun dasbor mereka.
          </div>
        )}

        {/* PANEL UTAMA: KETIKA SEKOLAH MEMILIKI RAPOR */}
        {selectedNpsn && selectedRaporData && (
          <div className="bg-slate-950/50 border border-blue-500/30 rounded-2xl p-6 space-y-6 shadow-xl relative animate-fade-in">
            <div className="absolute top-0 right-0 bg-blue-500 text-slate-950 px-4 py-1 rounded-bl-xl rounded-tr-xl font-black text-[10px] uppercase tracking-wider">
              Berkas Rapor Ditemukan
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-2xl font-black text-white">{selectedSekolahDetails?.nama_sekolah}</h3>
                <p className="text-sm text-emerald-400 font-medium mt-1">Kepsek: {selectedSekolahDetails?.nama_kepala_sekolah}</p>
                <span className="text-xs text-slate-400 font-mono block mt-2">📄 File: {selectedRaporData.data_mentah_json.nama_file}</span>
              </div>
              
              <div className="flex flex-wrap items-center gap-2">
                <a href={selectedRaporData.data_mentah_json.tautan_unduh_excel} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-slate-900 rounded-xl text-xs font-mono font-bold border border-slate-700 hover:border-cyan-400 transition-colors">📥 Excel Asli</a>
                
                {selectedRaporData.status_ai === 'SELESAI' && selectedRaporData.hasil_analisis_ai && (
                  <button onClick={() => handleDownloadPDFRapor(selectedRaporData.hasil_analisis_ai || '', selectedSekolahDetails?.nama_sekolah || '', selectedRaporData.data_mentah_json.tahun_ajaran)} className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-lg cursor-pointer transition-transform active:scale-95"><span>🖨️</span> Cetak PDF</button>
                )}
                
                <button onClick={() => handleTriggerKecerdasanBuatan(selectedRaporData)} disabled={aiLoadingId === selectedRaporData.id} className="px-5 py-2.5 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-400 text-white font-black rounded-xl text-xs shadow-lg cursor-pointer transition-transform active:scale-95">
                  {aiLoadingId === selectedRaporData.id ? "⏳ MEMPROSES DATA..." : selectedRaporData.status_ai === 'SELESAI' ? "🔄 Update Analisis AI" : "✨ Bedah Rapor AI"}
                </button>
                
                <button onClick={() => handleDeleteRapor(selectedRaporData.id, selectedSekolahDetails?.nama_sekolah || '')} className="px-3 py-2.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/20 rounded-xl text-xs font-bold transition-colors cursor-pointer" title="Hapus Berkas Rapor">🗑️</button>
              </div>
            </div>

            {selectedRaporData.status_ai === 'SELESAI' && (
              <div className="space-y-4 font-sans bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                  <span className="text-xs font-mono font-black text-indigo-400 uppercase tracking-widest">🤖 Hasil Analisis Kecerdasan Buatan</span>
                </div>
                
                {selectedRaporData.hasil_analisis_ai?.includes('<div') ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedRaporData.hasil_analisis_ai }} />
                ) : (
                  <pre className="whitespace-pre-wrap text-slate-300 text-sm bg-slate-950 p-4 rounded-lg">{selectedRaporData.hasil_analisis_ai}</pre>
                )}
                
                {/* FORM CATATAN KLINIS PENGAWAS */}
                <div className="mt-6 bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <label className="block text-xs font-mono text-amber-400 font-bold uppercase tracking-wider">📝 Keputusan & Tindak Lanjut Pengawas :</label>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-2">Tuliskan instruksi resmi untuk kepala sekolah terkait perbaikan mutu berdasarkan tabel AI di atas.</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <textarea 
                      value={inputCatatan[selectedRaporData.id] || ''} 
                      onChange={e => setInputCatatan(p => ({ ...p, [selectedRaporData.id]: e.target.value }))} 
                      placeholder="Ketik instruksi atau apresiasi Anda di sini. Catatan ini akan langsung tampil di dasbor sekolah..." 
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-white outline-none focus:border-amber-500 h-24 resize-none" 
                    />
                    <button 
                      onClick={() => handleSimpanCatatanRapor(selectedRaporData.id)} 
                      className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black rounded-xl px-6 py-3 text-xs cursor-pointer shadow-lg shrink-0 sm:w-32 transition-transform active:scale-95"
                    >
                      💾 Kirim Catatan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
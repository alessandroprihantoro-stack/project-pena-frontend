/* eslint-disable */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import PrestasiSekolah from './PrestasiSekolah';
import InputTkaSekolah from './InputTkaSekolah'; 

interface Prestasi { 
  id: string; 
  nama_prestasi?: string;
  nama_siswa_atau_kegiatan?: string;
  bidang?: string;
  jenis_prestasi?: string;
  peringkat?: string;
  juara?: string;
  tahun: string; 
  poin: number; 
  bukti_sertifikat: string; 
  status_validasi: string; 
}

// 👈 Interface diperbarui dengan atribut baru MANTAP Share
export interface PraktikBaik { 
  id: string; 
  judul: string; 
  jenis_media: string; 
  media_url: string; 
  deskripsi: string; 
  status_validasi: string; 
  kategori_program?: string;
  capaian_hasil?: string;
  tanggal_pelaksanaan?: string;
  user_id?: string;
  profiles?: { nama_lengkap: string; avatar_url?: string };
}

interface RaporSekolah { id: string; data_mentah_json: { nama_file: string; tahun_ajaran: string; tautan_unduh_excel: string; ukuran_bytes: number; diunggah_pada?: string; }; hasil_analisis_ai: string | null; catatan_pengawas: string | null; status_ai: string; }

type TabType = 'PRESTASI' | 'PRAKTIK' | 'RAPOR' | 'TKA'; 

// Daftar Kategori Resmi MANTAP Share untuk Dropdown Form & Filter Feed
export const DAFTAR_KATEGORI_MANTAP = ['SMA MANTAP', 'Branding Sekolah', 'Proyek Siswa', 'Praktik Baik'];

export default function ManajemenSekolah() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('PRESTASI');
  const [liveProfile, setLiveProfile] = useState(profile);

  const [listPrestasi, setListPrestasi] = useState<Prestasi[]>([]);
  const [listPraktik, setListPraktik] = useState<PraktikBaik[]>([]); 
  
  const [formLoadingPraktik, setFormLoadingPraktik] = useState(false);
  
  // 👈 STATE BARU UNTUK MANTAP SHARE
  const [pbJudul, setPbJudul] = useState(''); 
  const [pbKategoriProgram, setPbKategoriProgram] = useState(DAFTAR_KATEGORI_MANTAP[0]); // Default ke SMA MANTAP
  const [pbJenisMedia, setPbJenisMedia] = useState('FOTO'); // Pilihan: FOTO / VIDEO
  const [pbMediaFile, setPbMediaFile] = useState<File | null>(null); 
  const [pbDeskripsi, setPbDeskripsi] = useState(''); 
  const [pbCapaianHasil, setPbCapaianHasil] = useState('');
  const [pbTanggalPelaksanaan, setPbTanggalPelaksanaan] = useState(new Date().toISOString().split('T')[0]); // Default hari ini
  
  const [listRapor, setListRapor] = useState<RaporSekolah[]>([]); 
  const [formLoadingRapor, setFormLoadingRapor] = useState(false);
  const [raporFile, setRaporFile] = useState<File | null>(null); const [raporTahun, setRaporTahun] = useState('2026/2027');

  const fetchProfileAwal = async () => {
    if (!profile?.id) return;
    const { data: profKtp } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
    if (profKtp) setLiveProfile(profKtp);
    const npsnJangkar = profKtp?.nomor_induk || profile?.nomor_induk || '';
    const [resSekolah, resBinaan] = await Promise.all([
      supabase.from('sekolah').select('nama_sekolah').eq('npsn', npsnJangkar).maybeSingle(),
      supabase.from('sekolah_binaan').select('nama_sekolah').eq('npsn', npsnJangkar).maybeSingle(),
    ]);
    const namaTerkuat = resBinaan.data?.nama_sekolah || resSekolah.data?.nama_sekolah || profKtp?.nama_lengkap;
    if (namaTerkuat && liveProfile) setLiveProfile(prev => prev ? { ...prev, nama_lengkap: namaTerkuat } : null);
  };

  const fetchPrestasi = async () => { if (!profile?.id) return; const { data } = await supabase.from('prestasi').select('*').eq('sekolah_id', profile.id).order('created_at', { ascending: false }); setListPrestasi(data || []); };
  const handleDeletePrestasi = async (id: string, nama: string) => { if (window.confirm(`Batal ajukan ${nama}?`)) { await supabase.from('prestasi').delete().eq('id', id); setListPrestasi(p => p.filter(x => x.id !== id)); } };

  const fetchPraktikBaik = async () => { if (!profile?.id) return; const { data } = await supabase.from('praktik_baik').select('*').eq('sekolah_id', profile.id).order('created_at', { ascending: false }); setListPraktik(data || []); };
  
  const handleAddPraktikBaik = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!profile?.id || !pbMediaFile) return alert("❌ Judul, Media, dan Deskripsi wajib diisi!"); 
    setFormLoadingPraktik(true); 
    
    try {
      // 1. Tentukan Folder Berdasarkan Jenis Media (foto/ atau video/)
      const folderPath = pbJenisMedia === 'VIDEO' ? 'video' : 'foto';
      const fileExt = pbMediaFile.name.split('.').pop();
      const safeFileName = `${folderPath}/${profile.id}-${Date.now()}.${fileExt}`;
      
      // 2. Upload Media ke Storage 'praktik_baik_media'
      const { error: uploadError } = await supabase.storage
        .from('praktik_baik_media')
        .upload(safeFileName, pbMediaFile); 
        
      if (uploadError) throw new Error("Gagal upload: " + uploadError.message);
      
      // 3. Dapatkan Public URL Media
      const { data: urlData } = supabase.storage.from('praktik_baik_media').getPublicUrl(safeFileName);
      const finalUrl = urlData.publicUrl;
      
      // 4. Rakit Payload MANTAP Share (Atribut Baru Diikutsertakan)
      const payload = { 
        sekolah_id: profile.id, 
        user_id: profile.id, 
        npsn: liveProfile?.nomor_induk || profile.nomor_induk, 
        
        // Atribut Utama (MANTAP Share)
        judul: pbJudul.trim(), 
        kategori_program: pbKategoriProgram, 
        deskripsi: pbDeskripsi.trim(), 
        jenis_media: pbJenisMedia, // FOTO / VIDEO
        media_url: finalUrl, 
        
        // Atribut Baru
        capaian_hasil: pbCapaianHasil.trim() || null, 
        tanggal_pelaksanaan: pbTanggalPelaksanaan, 
        
        file_pendukung: null, // Dinonaktifkan di form, kunci null
        status_validasi: 'MENUNGGU' 
      };
      
      // 5. Simpan ke Tabel `praktik_baik`
      const { error: dbError } = await supabase.from('praktik_baik').insert(payload);
      if (dbError) throw new Error(dbError.message);
      
      // 6. Reset Form & Notifikasi Berhasil
      setPbJudul(''); 
      setPbDeskripsi(''); 
      setPbMediaFile(null); 
      setPbKategoriProgram(DAFTAR_KATEGORI_MANTAP[0]);
      setPbCapaianHasil('');
      setPbTanggalPelaksanaan(new Date().toISOString().split('T')[0]);
      
      alert("🚀 MANTAP Share Berhasil Dikirim untuk Verifikasi!"); 
      await fetchPraktikBaik();
    } catch (e: any) { alert("❌ Error: " + e.message); } finally { setFormLoadingPraktik(false); }
  };
  const handleDeletePraktikBaik = async (id: string, jdl: string) => { if (window.confirm(`Hapus postingan MANTAP Share: "${jdl}"?`)) { await supabase.from('praktik_baik').delete().eq('id', id); setListPraktik(p => p.filter(x => x.id !== id)); } };

  const fetchRaporSekolah = async () => { if (!profile?.id) return; const { data } = await supabase.from('rapor_sekolah').select('*').eq('sekolah_id', profile.id).order('created_at', { ascending: false }); setListRapor(data || []); };
  const handleAddRaporSekolah = async (e: React.FormEvent) => {
    e.preventDefault(); if (!profile?.id || !raporFile) return; setFormLoadingRapor(true);
    try {
      const path = `${raporTahun.replace('/', '-')}/RAPOR_${profile.id}_${Date.now()}.${raporFile.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage.from('rapor_dokumen').upload(path, raporFile); if (uploadError) throw uploadError; 
      const publicUrl = supabase.storage.from('rapor_dokumen').getPublicUrl(path).data.publicUrl;
      await supabase.from('rapor_sekolah').insert({ sekolah_id: profile.id, data_mentah_json: { nama_file: raporFile.name, tahun_ajaran: raporTahun, tautan_unduh_excel: publicUrl, ukuran_bytes: raporFile.size, diunggah_pada: new Date().toISOString() }, status_ai: 'MENUNGGU_PENGAWAS' });
      setRaporFile(null); await fetchRaporSekolah(); alert("Berkas Excel Rapor terkirim!");
    } catch (err: any) { alert("Error: " + err.message); } finally { setFormLoadingRapor(false); }
  };

  useEffect(() => { 
    fetchProfileAwal();
    if (activeTab === 'PRESTASI') fetchPrestasi(); 
    if (activeTab === 'PRAKTIK') fetchPraktikBaik(); 
    if (activeTab === 'RAPOR') fetchRaporSekolah(); 
  }, [activeTab, profile]);

  return (
    <div className="space-y-8 animate-fade-in text-black dark:text-slate-100 font-sans pb-12 select-none transition-colors duration-300">
      
      {/* HEADER HERO */}
      <div className="bg-purple-200 border-4 border-black shadow-neo dark:bg-linear-to-r dark:from-slate-900 dark:via-indigo-950/40 dark:to-slate-900 dark:border-2 dark:border-slate-800 p-8 rounded-3xl dark:backdrop-blur-2xl dark:shadow-2xl transition-all">
        <h1 className="text-3xl font-black text-black dark:text-white">{liveProfile?.nama_lengkap || profile?.nama_lengkap || "Satuan Pendidikan"}</h1>
        <p className="text-xs font-mono mt-1 font-bold text-slate-700 dark:text-slate-400">UID: [{profile?.id}]</p>
      </div>

      {/* NAVIGASI TABS */}
      <div className="flex items-center gap-2 p-2 rounded-2xl overflow-x-auto bg-white border-4 border-black shadow-neo dark:bg-slate-900/80 dark:border-2 dark:border-slate-800 dark:shadow-none transition-all">
        {[
          { id: 'PRESTASI', label: '🏆 Pengajuan Prestasi' }, 
          { id: 'PRAKTIK', label: '🚀 MANTAP Share' }, // 👈 Ganti Label Tab
          { id: 'RAPOR', label: '📄 Rapor & Hasil AI' },
          { id: 'TKA', label: '📊 Nilai TKA Akademik' } 
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id as TabType)} 
            className={`flex-1 min-w-37.5 py-3.5 px-4 rounded-xl text-xs font-black cursor-pointer transition-all border-2 
              ${activeTab === t.id 
                ? 'bg-yellow-400 text-black border-black shadow-neo-md -translate-y-1 dark:bg-cyan-500 dark:text-slate-950 dark:shadow-lg dark:border-transparent dark:translate-y-0' 
                : 'bg-transparent border-transparent text-slate-600 hover:text-black hover:border-black/20 dark:text-slate-400 dark:hover:text-white dark:hover:border-transparent'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* KONTEN TAB: PRESTASI */}
      {activeTab === 'PRESTASI' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2"><PrestasiSekolah /></div>
          
          <div className="p-6 rounded-2xl space-y-4 transition-all bg-white border-4 border-black shadow-neo dark:bg-slate-900/60 dark:border-2 dark:border-slate-800 dark:shadow-xl">
            <div className="flex justify-between items-center border-b-2 border-black/20 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-black text-black dark:text-amber-400 uppercase tracking-widest">Riwayat Ajuan ({listPrestasi.length})</h3>
              <button onClick={fetchPrestasi} className="text-xs font-bold cursor-pointer text-blue-600 hover:text-blue-800 dark:text-slate-400 dark:hover:text-white">🔄 Refresh</button>
            </div>
            <div className="space-y-2 max-h-150 overflow-y-auto custom-scrollbar pr-2">
              {listPrestasi.map(p => {
                  const namaTampil = p.nama_prestasi || p.nama_siswa_atau_kegiatan || 'Prestasi';
                  const bidangTampil = p.bidang || p.jenis_prestasi || '-';
                  const peringkatTampil = p.peringkat || p.juara || '-';
                  return (
                  <div key={p.id} className="py-3 px-3 rounded-xl border-2 transition-colors flex justify-between items-start gap-4 text-xs bg-slate-50 border-black/20 hover:border-black dark:bg-transparent dark:border-slate-800/50 dark:hover:bg-slate-800/30">
                    <div>
                      <strong className="block text-sm mb-1 font-black text-black dark:text-white">{namaTampil}</strong>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border bg-yellow-100 text-yellow-800 border-yellow-400 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20">{bidangTampil} • {peringkatTampil} • {p.tahun}</span>
                    </div>
                    <div className="text-right flex flex-col items-end shrink-0 gap-1.5">
                      <span className={`text-[9px] px-2 py-0.5 rounded block font-bold uppercase tracking-wider border-2 ${p.status_validasi === 'DISETUJUI' ? 'bg-green-100 text-green-700 border-green-400 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-transparent' : p.status_validasi === 'DITOLAK' ? 'bg-red-100 text-red-700 border-red-400 dark:bg-rose-500/10 dark:text-rose-400 dark:border-transparent' : 'bg-orange-100 text-orange-700 border-orange-400 dark:bg-amber-500/10 dark:text-amber-400 dark:border-transparent'}`}>{p.status_validasi}</span>
                      <button onClick={()=>handleDeletePrestasi(p.id, namaTampil)} className="font-bold cursor-pointer text-red-600 hover:text-red-800 dark:text-rose-400 dark:hover:text-rose-300">🗑️ Batal</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 👈 KONTEN TAB: MANTAP SHARE (REVISI TOTAL FORM) */}
      {activeTab === 'PRAKTIK' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          <div className="p-6 rounded-2xl space-y-4 transition-all bg-cyan-100 border-4 border-black shadow-neo dark:bg-slate-900/60 dark:border-2 dark:border-slate-800 dark:shadow-none">
            <h3 className="text-sm font-black uppercase tracking-widest text-black dark:text-cyan-400 flex items-center gap-2"><span>🚀</span> Posting MANTAP Share</h3>
            
            <form onSubmit={handleAddPraktikBaik} className="space-y-4 text-xs font-bold">
              
              {/* JUDUL PROGRAM (Wajib) */}
              <input type="text" required value={pbJudul} onChange={e=>setPbJudul(e.target.value)} placeholder="Judul Program (Wajib)" className="w-full p-3 rounded-xl border-2 outline-none transition-colors bg-white border-black text-black focus:border-blue-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-cyan-500" />
              
              {/* KATEGORI PROGRAM (Dropdown) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black font-mono uppercase tracking-widest text-slate-700 dark:text-slate-400">Kategori Program</label>
                <select value={pbKategoriProgram} onChange={e=>setPbKategoriProgram(e.target.value)} className="w-full p-3 rounded-xl border-2 outline-none cursor-pointer bg-white border-black text-black focus:border-blue-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-cyan-500 shadow-sm">
                  {DAFTAR_KATEGORI_MANTAP.map(kat => <option key={kat} value={kat}>{kat}</option>)}
                </select>
              </div>

              {/* UNGGAH MEDIA (FOTO / VIDEO 1 MENIT) */}
              <div className="space-y-1.5 p-3 rounded-xl border-2 bg-white border-black dark:bg-slate-950 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🖼️</span>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Unggah Media Utama</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <select value={pbJenisMedia} onChange={e=>setPbJenisMedia(e.target.value)} className="p-2.5 rounded-lg border-2 outline-none cursor-pointer bg-slate-50 border-black/20 text-black dark:bg-slate-900 dark:border-slate-700 dark:text-white"><option value="FOTO">🖼️ Foto / Gambar</option><option value="VIDEO">🎥 Video (Maks. 1 Menit)</option></select>
                  <input type="file" required accept={pbJenisMedia === 'VIDEO' ? 'video/mp4,video/x-m4v,video/*' : 'image/jpeg,image/png,image/webp,image/*'} onChange={e=>e.target.files&&setPbMediaFile(e.target.files[0])} className="p-1.5 rounded-lg border-2 text-[10px] cursor-pointer bg-slate-50 border-black/20 text-slate-700 file:mr-2 file:py-1 file:px-2 file:rounded file:border file:bg-slate-200 file:text-xs file:font-bold dark:bg-slate-900 dark:border-slate-700 dark:text-white dark:file:bg-slate-800 dark:file:text-cyan-400" />
                </div>
              </div>

              {/* DESKRIPSI SINGKAT (Maks 500 Karakter) */}
              <div className="space-y-1">
                <label className="text-[10px] font-black font-mono uppercase tracking-widest text-slate-700 dark:text-slate-400">Deskripsi Singkat Program</label>
                <textarea required rows={5} maxLength={500} value={pbDeskripsi} onChange={e=>setPbDeskripsi(e.target.value)} placeholder="Ceritakan tujuan, langkah nyata, dan dampak inovasi dalam maksimal 500 karakter..." className="w-full p-3 rounded-xl border-2 leading-relaxed font-sans outline-none bg-white border-black text-black placeholder:text-slate-400 focus:border-blue-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-cyan-500" />
                <div className="text-right text-[9px] font-mono font-bold text-slate-500 dark:text-slate-500 pr-1">{pbDeskripsi.length} / 500 Karakter</div>
              </div>

              {/* CAPAIAN / HASIL */}
              <textarea rows={3} value={pbCapaianHasil} onChange={e=>setPbCapaianHasil(e.target.value)} placeholder="Capaian / Hasil (Contoh: jumlah siswa yang terlibat, omzet, prestasi yang diraih)" className="w-full p-3 rounded-xl border-2 leading-relaxed font-sans outline-none bg-white border-black text-black placeholder:text-slate-400 focus:border-blue-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-cyan-500" />

              {/* TANGGAL PELAKSANAAN & TOMBOL KIRIM */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-end pt-2 border-t border-black/10 dark:border-slate-800">
                <div className="space-y-1">
                   <label className="text-[10px] font-black font-mono uppercase tracking-widest text-slate-700 dark:text-slate-400 pr-1">Pelaksanaan</label>
                   <input type="date" required value={pbTanggalPelaksanaan} onChange={e=>setPbTanggalPelaksanaan(e.target.value)} className="w-full p-3 rounded-xl border-2 outline-none bg-white border-black text-black focus:border-blue-600 dark:bg-slate-950 dark:border-slate-800 dark:text-white dark:focus:border-cyan-500" />
                </div>
                <button type="submit" disabled={formLoadingPraktik} className="w-full py-3.5 font-black rounded-xl cursor-pointer transition-all disabled:opacity-50 border-2 uppercase tracking-widest bg-yellow-400 hover:bg-yellow-300 border-black text-black shadow-neo hover:-translate-y-1 active:translate-y-0 active:shadow-none dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:border-transparent dark:text-slate-950 dark:shadow-none dark:hover:translate-y-0 text-xs">
                   {formLoadingPraktik ? "🚀 Mengirim..." : "Kirim untuk Verifikasi"}
                </button>
              </div>
              
            </form>
          </div>
          
          <div className="xl:col-span-2 p-6 rounded-2xl space-y-4 transition-all bg-white border-4 border-black shadow-neo dark:bg-slate-900/60 dark:border-2 dark:border-slate-800 dark:shadow-none h-full">
            <div className="flex justify-between items-center border-b-2 border-black/20 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-black dark:text-white">Arsip Postingan Sekolah ({listPraktik.length})</h3>
              <button onClick={fetchPraktikBaik} className="text-xs font-bold cursor-pointer text-blue-600 hover:text-blue-800 dark:text-cyan-400 dark:hover:text-white">🔄 Segarkan</button>
            </div>
            <div className="space-y-3">
              {listPraktik.length === 0 ? (
                 <div className="p-8 text-center text-xs font-bold text-slate-500 dark:text-slate-500 border-2 border-dashed border-black/10 rounded-2xl dark:border-slate-800">Belum ada postingan MANTAP Share dari sekolah Anda.</div>
              ) : listPraktik.map(x=>(
                <div key={x.id} className="py-3 px-4 rounded-xl border-2 flex justify-between items-start gap-4 text-xs transition-colors bg-slate-50 border-black/20 hover:border-black dark:bg-transparent dark:border-slate-800/50 dark:hover:bg-slate-800/30">
                  <div className="space-y-1.5 max-w-lg">
                    <strong className="block text-sm font-black text-black dark:text-white">{x.judul}</strong>
                    <div className="flex flex-wrap gap-2 pt-0.5">
                       <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 border border-purple-300 dark:bg-transparent dark:border-none dark:text-purple-400 dark:p-0">[{x.kategori_program || 'Karya Sekolah'}]</span>
                       <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">📅 {x.tanggal_pelaksanaan || '-'}</span>
                    </div>
                    <p className="text-[11px] line-clamp-2 italic text-slate-600 dark:text-slate-400">{x.deskripsi}</p>
                    {x.capaian_hasil && <p className="text-[10px] line-clamp-1 font-bold text-emerald-700 dark:text-emerald-400">🎯 {x.capaian_hasil}</p>}
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[9px] px-2 py-0.5 rounded block font-bold uppercase tracking-wider border-2 ${x.status_validasi === 'DISETUJUI' ? 'bg-green-100 text-green-700 border-green-400 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-transparent' : x.status_validasi === 'DITOLAK' ? 'bg-red-100 text-red-700 border-red-400 dark:bg-rose-500/10 dark:text-rose-400 dark:border-transparent' : 'bg-orange-100 text-orange-700 border-orange-400 dark:bg-amber-500/10 dark:text-amber-400 dark:border-transparent'}`}>{x.status_validasi}</span>
                    <button onClick={()=>handleDeletePraktikBaik(x.id,x.judul)} className="font-bold cursor-pointer text-red-600 hover:text-red-800 dark:text-rose-400 dark:hover:text-rose-300">🗑️ Hapus</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KONTEN TAB: RAPOR & AI */}
      {activeTab === 'RAPOR' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
          
          <div className="p-6 rounded-2xl space-y-4 transition-all bg-emerald-100 border-4 border-black shadow-neo border-t-8 border-t-emerald-500 dark:bg-slate-900/60 dark:border-2 dark:border-slate-800 dark:border-t-2 dark:border-t-emerald-500 dark:shadow-none">
            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400">📊 Upload Excel Rapor</h3>
            <form onSubmit={handleAddRaporSekolah} className="space-y-3 text-xs font-bold">
              <select value={raporTahun} onChange={e=>setRaporTahun(e.target.value)} className="w-full p-3 rounded-xl border-2 outline-none cursor-pointer bg-white border-black text-black focus:border-emerald-500 dark:bg-slate-950 dark:border-slate-800 dark:text-white">
                <option value="2026/2027">Tahun 2026/2027</option>
                <option value="2025/2026">Tahun 2025/2026</option>
              </select>
              <input type="file" required accept=".xlsx, .xls" onChange={e=>e.target.files&&setRaporFile(e.target.files[0])} className="w-full p-2 rounded-xl border-2 cursor-pointer bg-white border-black text-slate-700 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-2 file:border-black file:bg-emerald-300 file:text-black file:font-bold dark:bg-slate-950 dark:border-slate-800 dark:text-slate-300 dark:file:border-0 dark:file:bg-emerald-500/20 dark:file:text-emerald-300" />
              <button type="submit" disabled={formLoadingRapor} className="w-full py-3 font-black rounded-xl cursor-pointer transition-all disabled:opacity-50 border-2 uppercase tracking-widest bg-emerald-400 hover:bg-emerald-300 border-black text-black shadow-neo hover:-translate-y-1 active:translate-y-0 active:shadow-none dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:border-transparent dark:text-slate-950 dark:shadow-none dark:hover:translate-y-0">Kirim Berkas Rapor</button>
            </form>
          </div>
          
          <div className="xl:col-span-2 p-6 rounded-2xl space-y-4 transition-all bg-white border-4 border-black shadow-neo dark:bg-slate-900/60 dark:border-2 dark:border-slate-800 dark:shadow-xl">
            <div className="flex justify-between items-center border-b-2 border-black/20 dark:border-slate-800 pb-2">
              <h3 className="text-sm font-black uppercase tracking-widest text-black dark:text-white">Arsip Rapor & Hasil Analisis AI ({listRapor.length})</h3>
              <button onClick={fetchRaporSekolah} className="text-xs font-bold cursor-pointer text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-white">🔄 Segarkan</button>
            </div>
            <div className="space-y-4">
              {listRapor.map(r => (
                <div key={r.id} className="p-5 rounded-2xl border-2 transition-all space-y-4 bg-slate-50 border-black/20 dark:bg-slate-950/80 dark:border-slate-800">
                  <div className="flex flex-wrap justify-between items-center gap-3 border-b-2 border-black/10 dark:border-slate-800 pb-3">
                    <div>
                      <strong className="text-sm font-black block text-black dark:text-white">{r.data_mentah_json.nama_file}</strong>
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">{r.data_mentah_json.tahun_ajaran}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={r.data_mentah_json.tautan_unduh_excel} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all border-2 bg-white text-black border-black shadow-sm hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-700 dark:shadow-none dark:hover:bg-slate-800">📥 Excel Asli</a>
                      <span className="px-3 py-1.5 rounded-lg border-2 text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-700 border-green-400 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-transparent">{r.status_ai}</span>
                    </div>
                  </div>
                  {r.status_ai === 'SELESAI' ? (
                    <div className="space-y-4 pt-1 font-sans">
                      {r.hasil_analisis_ai?.includes('<div') ? ( 
                        <div dangerouslySetInnerHTML={{ __html: r.hasil_analisis_ai }} className="p-4 rounded-2xl overflow-x-auto border-2 bg-white border-black text-black shadow-neo-sm dark:bg-white dark:border-transparent dark:shadow-2xl dark:text-slate-900" /> 
                      ) : ( 
                        <div className="p-4 rounded-xl border-2 text-xs whitespace-pre-line leading-relaxed font-medium bg-slate-100 border-slate-300 text-slate-800 dark:bg-slate-900 dark:border-emerald-500/20 dark:text-slate-200">{r.hasil_analisis_ai}</div> 
                      )}
                      
                      {r.catatan_pengawas && ( 
                        <div className="p-4 rounded-xl border-2 space-y-1 bg-yellow-50 border-yellow-400 dark:bg-amber-500/10 dark:border-amber-500/20">
                          <span className="text-[10px] font-mono font-black uppercase block text-yellow-800 dark:text-amber-400">✍️ Catatan Rekomendasi Pengawas:</span>
                          <p className="text-xs italic leading-relaxed font-medium text-slate-700 dark:text-amber-100/90">"{r.catatan_pengawas}"</p>
                        </div> 
                      )}
                      
                      <div className="pt-2 flex justify-end">
                        <button onClick={() => window.print()} className="py-2.5 px-6 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer flex items-center gap-2 font-mono transition-all border-2 bg-blue-500 text-white border-black shadow-neo hover:-translate-y-1 active:translate-y-0 active:shadow-none dark:bg-linear-to-r dark:from-emerald-500 dark:to-teal-600 dark:border-transparent dark:text-slate-950 dark:shadow-lg dark:shadow-emerald-500/20 dark:hover:translate-y-0">
                          <span>🖨️</span> Cetak PDF Rapor Resmi
                        </button>
                      </div>
                    </div>
                  ) : <p className="text-xs font-bold italic py-4 text-center text-slate-500 dark:text-slate-500">⏳ Menunggu Pengawas memicu analisis AI...</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KONTEN TAB: TKA */}
      {activeTab === 'TKA' && (
        <div className="p-6 sm:p-8 rounded-3xl space-y-4 transition-all bg-white border-4 border-black shadow-neo dark:bg-slate-900/40 dark:border-2 dark:border-slate-800 dark:shadow-2xl">
          <div className="border-b-2 border-black/20 dark:border-slate-800 pb-4 mb-6">
             <h3 className="text-base font-black font-mono uppercase tracking-widest flex items-center gap-2 text-black dark:text-white">
               <span className="text-blue-600 dark:text-cyan-400">📊</span> Tes Kemampuan Akademik (TKA)
             </h3>
             <p className="text-xs font-bold mt-1 text-slate-600 dark:text-slate-400">
               Input nilai rata-rata pencapaian siswa per mata pelajaran secara modular.
             </p>
          </div>
          <InputTkaSekolah />
        </div>
      )}

    </div>
  );
}
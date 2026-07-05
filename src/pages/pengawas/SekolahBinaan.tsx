/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';
import * as XLSX from 'xlsx';

import logoPena from "../../assets/logo_pena.png";
import bannerPena from "../../assets/banner_pena.png";

// 🌟 IMPOR MODAL ISOLASI AI (Akan kita periksa/buat di Langkah 2)
import ModalAnalisisRapor from './components/ModalAnalisisRapor';

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
  // 🛡️ CHECKPOINT PROTECTION: Menambahkan 'user' agar tidak melempar ReferenceError
  const { profile, user } = useAuth();
  
  const [listSekolah, setListSekolah] = useState<SekolahBinaan[]>([]);
  const [listRapor, setListRapor] = useState<RaporAjuan[]>([]);
  const [inputCatatan, setInputCatatan] = useState<{ [key: string]: string }>({});

  // Form Tambah Sekolah
  const [sbNpsn, setSbNpsn] = useState('');
  const [sbNama, setSbNama] = useState('');

  // STATE BARU UNTUK FITUR DROPDOWN & ISOLASI MODAL AI
  const [selectedNpsn, setSelectedNpsn] = useState<string>('');
  const [isModalAiOpen, setIsModalAiOpen] = useState(false);
  const [selectedRaporForAi, setSelectedRaporForAi] = useState<RaporAjuan | null>(null);

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

  // 💥 CHECKPOINT PROTECTION: ANTI FALSE-ALARM & SAFE REGISTRATION GUARD 💥
  const handleTambahSekolahBinaan = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    // 1. Dual-Layer ID Fallback Pengawas
    let pengawasId = profile?.id || user?.id;
    if (!pengawasId) {
      const { data: { session } } = await supabase.auth.getSession();
      pengawasId = session?.user?.id;
    }

    if (!pengawasId) {
      alert("⚠️ ERROR SISTEM: Sesi Pengawas tidak terbaca. Silakan refresh (Ctrl + F5) atau login ulang.");
      return;
    }

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

      // 2. Cek eksistensi awal di tabel profiles dan sekolah
      const { data: existingProf } = await supabase
        .from('profiles')
        .select('id')
        .or(`nomor_induk.eq.${npsnBersih},email.eq.${emailSekolah}`)
        .maybeSingle();
      
      if (existingProf) {
          targetUserId = existingProf.id;
      } else {
          const { data: existingSekolah } = await supabase
            .from('sekolah')
            .select('id, user_id')
            .eq('npsn', npsnBersih)
            .maybeSingle();

          if (existingSekolah) {
            targetUserId = existingSekolah.user_id || existingSekolah.id;
          } else {
            // 3. Pengamanan Sesi: Simpan sesi pengawas sebelum proses Auth
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            
            const { data: authData, error: authError } = await supabase.auth.signUp({ 
              email: emailSekolah, 
              password: passwordSekolah,
              options: {
                data: {
                  role: 'SEKOLAH',
                  nama_lengkap: namaBersih,
                  nomor_induk: npsnBersih
                }
              }
            });
            
            // 4. Wajib: Langsung kembalikan sesi Pengawas terlebih dahulu agar tidak tergeser!
            if (currentSession) {
              await supabase.auth.setSession({ 
                access_token: currentSession.access_token, 
                refresh_token: currentSession.refresh_token 
              });
            }

            // 5. Analisis Error Presisi (Anti False-Alarm)
            if (authError) {
              const errorMsg = authError.message.toLowerCase();
              // HANYA lakukan fallback login jika errornya memang karena email sudah ada (Error 422 / Already Registered)
              if (errorMsg.includes('already registered') || errorMsg.includes('duplicate') || authError.status === 422) {
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ 
                  email: emailSekolah, 
                  password: passwordSekolah 
                });
                if (loginError) {
                  throw new Error(`Email (${emailSekolah}) sudah terdaftar di sistem Auth dengan sandi berbeda.`);
                }
                targetUserId = loginData?.user?.id;
                
                // Kembalikan lagi sesi pengawas setelah fallback login
                if (currentSession) {
                  await supabase.auth.setSession({ 
                    access_token: currentSession.access_token, 
                    refresh_token: currentSession.refresh_token 
                  });
                }
              } else {
                // Jika Error 500 atau error lainnya, tampilkan pesan ASLI dari Supabase agar transparan!
                throw new Error(`Supabase Auth Error (${authError.status || '500'}): ${authError.message}`);
              }
            } else if (!authData?.user?.id) {
              throw new Error("Supabase tidak mengembalikan ID User. Pastikan layanan Auth Supabase aktif.");
            } else {
              targetUserId = authData.user.id;
            }
          }
      }

      if (!targetUserId) {
        throw new Error("Gagal mendapatkan ID Autentikasi untuk akun sekolah.");
      }

      // 6. Upsert tabel profiles (Aman tanpa merusak RLS)
      await supabase.from('profiles').upsert(
         { id: targetUserId, role: 'SEKOLAH', nama_lengkap: namaBersih, nomor_induk: npsnBersih, email: emailSekolah },
         { onConflict: 'id' }
      );
      
      // 7. Upsert tabel sekolah
      const { error: errSekolah } = await supabase.from('sekolah').upsert(
         { id: targetUserId, user_id: targetUserId, npsn: npsnBersih, nama_sekolah: namaBersih, pengawas_id: pengawasId },
         { onConflict: 'id' }
      );
      
      if (errSekolah && !errSekolah.message.includes('users_email_partial_key') && !errSekolah.message.includes('duplicate key')) {
         throw new Error("Database Sekolah: " + errSekolah.message);
      }

      // 8. Relasikan ke tabel sekolah_binaan
      const { data: cekBinaan } = await supabase
        .from('sekolah_binaan')
        .select('id')
        .eq('sekolah_id', targetUserId)
        .eq('pengawas_id', pengawasId)
        .maybeSingle();

      if (!cekBinaan) {
         await supabase.from('sekolah_binaan').insert([
           { pengawas_id: pengawasId, sekolah_id: targetUserId, npsn: npsnBersih, nama_sekolah: namaBersih }
         ]);
      }
      
      setSbNpsn(''); 
      setSbNama('');
      if (typeof fetchSekolahBinaan === 'function') {
        fetchSekolahBinaan();
      }
      
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

  // 🌟 PEMICU BARU: Membuka Modal Isolasi AI (Hemat Kuota Mutlak)
  const handleOpenModalAi = (raporItem: RaporAjuan) => {
    setSelectedRaporForAi(raporItem);
    setIsModalAiOpen(true);
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
          
          <div className="bg-slate-950/80 border border-emerald-500/30 px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-inner">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-emerald-400 tracking-wider uppercase">AI Engine: Isolated</span>
          </div>
        </div>
      </div>

      {/* SEKSI 1: FORM TAMBAH BINAAN */}
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
                
                {/* 🌟 TOMBOL PEMICU BARU: Membuka Modal Isolasi AI */}
                <button 
                  onClick={() => handleOpenModalAi(selectedRaporData)} 
                  className="px-5 py-2.5 bg-linear-to-r from-blue-500 to-indigo-600 hover:from-blue-400 text-white font-black rounded-xl text-xs shadow-lg cursor-pointer transition-transform active:scale-95 flex items-center gap-1.5"
                >
                  <span>✨</span> {selectedRaporData.status_ai === 'SELESAI' ? "🔄 Bedah Ulang / Lihat AI" : "✨ Bedah Rapor AI"}
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

      {/* 🌟 RENDER MODAL ISOLASI AI (DI BAWAH KONTEN UTAMA) */}
      {isModalAiOpen && selectedRaporForAi && (
        <ModalAnalisisRapor
          isOpen={isModalAiOpen}
          onClose={() => {
            setIsModalAiOpen(false);
            setSelectedRaporForAi(null);
          }}
          raporItem={selectedRaporForAi}
          sekolahDetails={selectedSekolahDetails}
          onSuccess={() => {
            fetchRaporAjuan(); // Refresh data otomatis setelah AI selesai menganalisis
          }}
        />
      )}

    </div>
  );
}
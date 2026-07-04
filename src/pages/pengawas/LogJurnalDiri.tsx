/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

import logoPena from '../../assets/logo_pena.png';
import logoJateng from '../../assets/logo_jateng.png';
import bannerPena from '../../assets/banner_pena.png';

interface JurnalItem {
  id: string;
  tanggal: string;
  sasaran_sekolah: string;
  aktivitas: string;
  hasil_capaian: string;
  bukti_dukung?: string;
}

export default function LogJurnalDiri() {
  const { profile } = useAuth();
  const [listJurnal, setListJurnal] = useState<JurnalItem[]>([]);
  const [loading, setLoading] = useState(false);

  const [jTanggal, setJTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [jTempat, setJTempat] = useState('CABDISDIK');
  const [jKegiatan, setJKegiatan] = useState('');
  const [jHasil, setJHasil] = useState('');
  const [jFileBukti, setJFileBukti] = useState<File | null>(null);

  const fetchJurnal = async () => {
    if (!profile?.id) return;
    
    // PERBAIKAN 1: Pastikan mengambil data dari TABEL jurnal_pengawas
    const { data } = await supabase
      .from('jurnal_pengawas')
      .select('*')
      .eq('user_id', profile.id)
      .order('hari_tanggal', { ascending: false });
    
    const formattedData = (data || []).map((d: any) => ({
      id: d.id,
      tanggal: d.hari_tanggal,
      sasaran_sekolah: d.tempat,
      aktivitas: d.kegiatan,
      hasil_capaian: d.hasil,
      bukti_dukung: d.bukti_dukung
    }));

    setListJurnal(formattedData);
  };

  useEffect(() => { fetchJurnal(); }, [profile]);

  const handleSimpanJurnal = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!profile?.id) return; 
    setLoading(true);
    
    try {
      let publicUrl = '';

      if (jFileBukti) {
        const fileExt = jFileBukti.name.split('.').pop();
        const randomString = Math.random().toString(36).substring(2, 8);
        const fileName = `${profile.id}-${Date.now()}-${randomString}.${fileExt}`;
        const filePath = `jurnal/${fileName}`;

        // Upload ke BUCKET jurnal_foto
        const { error: uploadError } = await supabase.storage
          .from('jurnal_foto')
          .upload(filePath, jFileBukti, {
            cacheControl: '3600',
            upsert: true 
          });

        if (uploadError) {
          console.error("Storage Error:", uploadError);
          throw new Error("Gagal mengunggah foto ke server. Pastikan format gambar didukung.");
        }

        // PERBAIKAN 2: Mengambil URL juga dari BUCKET jurnal_foto
        const { data: publicUrlData } = supabase.storage
          .from('jurnal_foto')
          .getPublicUrl(filePath);

        publicUrl = publicUrlData.publicUrl;
      }

      // Insert data ke TABEL jurnal_pengawas
      const { error } = await supabase.from('jurnal_pengawas').insert({
        user_id: profile.id,
        hari_tanggal: jTanggal,
        tempat: jTempat.trim(),
        kegiatan: jKegiatan.trim(),
        hasil: jHasil.trim(),
        bukti_dukung: publicUrl || null
      });
      
      if (error) {
        console.error("Database Error:", error);
        if (error.code === '23505') {
          throw new Error("Tabel database Anda memiliki batasan 'Unique' pada user_id. Silakan periksa pengaturan Supabase Anda.");
        }
        throw error;
      }
      
      setJTempat('CABDISDIK'); 
      setJKegiatan(''); 
      setJHasil(''); 
      setJFileBukti(null);
      const fileInput = document.getElementById('fileBukti') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      alert("📝 Jurnal Kegiatan & Foto Bukti berhasil dicatat!");
      fetchJurnal();
    } catch (err: any) {
      alert("Gagal menyimpan jurnal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJurnal = async (id: string) => {
    if (window.confirm("Hapus catatan log jurnal ini?")) {
      await supabase.from('jurnal_pengawas').delete().eq('id', id);
      setListJurnal(p => p.filter(x => x.id !== id));
    }
  };

  const handleCetakPDFJurnal = () => {
    const w = window.open('', '_blank'); 
    if (!w) return;

    const bulanIndo = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const d = new Date();
    const namaBulan = bulanIndo[d.getMonth()];
    const tahun = d.getFullYear();

    const p = profile as any; 
    const nip = p?.nip_resmi || p?.nomor_induk || '-';
    const golongan = p?.golongan || '-';
    const namaLengkap = p?.nama_lengkap || 'PENGAWAS SATUAN PENDIDIKAN';
    const instansi = p?.instansi || 'Cabang Dinas Pendidikan Wilayah VI';

    let barisTabel = '';
    listJurnal.forEach((j: JurnalItem, idx: number) => {
      
      let selDokumentasi = '-';
      if (j.bukti_dukung) {
        const link = j.bukti_dukung.toLowerCase();
        if (link.match(/\.(jpeg|jpg|gif|png|webp)$/) != null || link.includes('storage/v1/object/public')) {
          selDokumentasi = `<img src="${j.bukti_dukung}" class="w-full h-auto max-h-32 object-cover border border-slate-300 rounded shadow-sm" alt="Bukti" />`;
        } else if (link.includes("drive.google.com")) {
           selDokumentasi = `<div class="bg-blue-50 border border-blue-200 p-2 rounded text-center"><a href="${j.bukti_dukung}" target="_blank" class="text-blue-700 text-[10px] font-bold underline block mb-1">🔗 Buka Arsip Drive</a><span class="text-[9px] text-slate-500 italic">Preview tidak didukung</span></div>`;
        } else {
           selDokumentasi = `<a href="${j.bukti_dukung}" target="_blank" class="text-blue-600 underline font-bold text-[10px]">Lihat Tautan</a>`;
        }
      }

      const tglObj = new Date(j.tanggal);
      const namaHari = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][tglObj.getDay()];
      const tglFormat = `${namaHari}, ${tglObj.getDate()} ${bulanIndo[tglObj.getMonth()]} ${tglObj.getFullYear()}`;

      barisTabel += `
        <tr class="border-b border-black">
          <td class="p-2 text-center align-top border-r border-black font-semibold">${idx+1}</td>
          <td class="p-2 align-top border-r border-black font-medium">${tglFormat}</td>
          <td class="p-2 align-top border-r border-black">${j.sasaran_sekolah}</td>
          <td class="p-2 align-top border-r border-black">${j.aktivitas}</td>
          <td class="p-2 align-top border-r border-black">${j.hasil_capaian}</td>
          <td class="p-2 align-top w-40 text-center">${selDokumentasi}</td>
        </tr>`;
    });

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Laporan Jurnal Harian Pengawas</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            @page { size: landscape; margin: 15mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body class="p-8 font-serif text-black bg-white text-sm">
        <div class="text-center font-bold mb-8">
          <h1 class="text-lg uppercase tracking-wide">LAPORAN HASIL PENDAMPINGAN PENGAWAS SEKOLAH</h1>
          <h2 class="text-base uppercase tracking-wide">BULAN : ${namaBulan.toUpperCase()} ${tahun}</h2>
        </div>
        <div class="mb-6 space-y-1 font-bold">
          <div class="flex"><div class="w-48">Nama Pengawas</div><div class="w-4">:</div><div>${namaLengkap}</div></div>
          <div class="flex"><div class="w-48">NIP</div><div class="w-4">:</div><div>${nip}</div></div>
          <div class="flex"><div class="w-48">Pangkat / Golongan</div><div class="w-4">:</div><div>${golongan}</div></div>
          <div class="flex"><div class="w-48">Cabang Dinas Pendidikan</div><div class="w-4">:</div><div>${instansi}</div></div>
        </div>
        <table class="w-full text-left border-collapse border border-black mb-12">
          <thead>
            <tr class="border-b border-black text-center font-bold">
              <th class="p-2 border-r border-black w-10">NO</th>
              <th class="p-2 border-r border-black w-40">Hari, Tanggal</th>
              <th class="p-2 border-r border-black w-48">Tempat</th>
              <th class="p-2 border-r border-black">Kegiatan</th>
              <th class="p-2 border-r border-black w-64">Tujuan / Hasil</th>
              <th class="p-2 w-40">Dokumentasi</th>
            </tr>
          </thead>
          <tbody>
            ${barisTabel}
          </tbody>
        </table>
        <div class="flex justify-end pr-12">
          <div class="text-center">
            <p class="mb-20">Pengawas Satuan Pendidikan,</p>
            <p class="font-bold underline">${namaLengkap}</p>
            <p>NIP. ${nip}</p>
          </div>
        </div>
      </body>
      </html>
    `);
    
    w.document.close(); 
    w.focus(); 
    setTimeout(() => { w.print(); }, 1500);
  };

  return (
    <div className="space-y-8 animate-fade-in text-slate-100 font-sans pb-16 select-none max-w-7xl mx-auto px-4">
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl mb-2 group shrink-0">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src={bannerPena} alt="Banner" className="w-full h-full object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-700" />
          <div className="absolute inset-0 bg-linear-to--r from-slate-950 via-slate-900/90 to-transparent" />
        </div>
        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-2xl border border-slate-700/50 backdrop-blur-md shadow-xl">
              <img src={logoJateng} alt="Jateng" className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-lg" />
              <div className="w-px h-10 bg-slate-700" />
              <img src={logoPena} alt="PENA" className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-lg" />
            </div>
            <div>
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                PENA <span className="text-transparent bg-clip-text bg-linear-to--r from-cyan-400 to-indigo-400">Enterprise</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-mono mt-1 italic">"Log Jurnal Diri • Rekam Jejak Pendampingan Satuan Pendidikan"</p>
            </div>
          </div>
          <div className="bg-linear-to--r from-amber-500/10 to-orange-500/10 border border-amber-500/30 px-5 py-2.5 rounded-xl text-amber-400 font-mono text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow">
            Otoritas: {profile?.role || 'PENGAWAS'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 bg-slate-950 p-6 sm:p-8 rounded-3xl border border-amber-500/30 space-y-4 shadow-2xl">
          <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <span>📝</span> CATAT JURNAL PENDAMPINGAN
          </h3>
          <form onSubmit={handleSimpanJurnal} className="space-y-4 text-xs">
            <div><label className="block text-slate-400 mb-1 font-mono">Tanggal</label><input type="date" required value={jTanggal} onChange={e=>setJTanggal(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white font-mono outline-none focus:border-amber-500" /></div>
            <div><label className="block text-slate-400 mb-1 font-mono">Tempat</label><input type="text" required value={jTempat} onChange={e=>setJTempat(e.target.value)} placeholder="SMA Negeri 1 Mirit / Cabdindik VI..." className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" /></div>
            <div><label className="block text-slate-400 mb-1 font-mono">Kegiatan</label><textarea rows={3} required value={jKegiatan} onChange={e=>setJKegiatan(e.target.value)} placeholder="Mendampingi Kepala Sekolah membedah Rapor Pendidikan..." className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" /></div>
            <div><label className="block text-slate-400 mb-1 font-mono">Hasil</label><textarea rows={2} required value={jHasil} onChange={e=>setJHasil(e.target.value)} placeholder="Sekolah sepakat merevisi RKAS triwulan depan..." className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500" /></div>
            
            <div>
              <label className="block text-cyan-400 mb-1 font-mono font-bold">📷 Unggah Foto Bukti Dukung</label>
              <input 
                id="fileBukti"
                type="file" 
                accept="image/*"
                onChange={e => setJFileBukti(e.target.files ? e.target.files[0] : null)} 
                className="w-full bg-slate-900 border border-cyan-500/30 rounded-xl p-2 text-cyan-300 font-mono outline-none focus:border-cyan-400 
                  file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 
                  file:text-xs file:font-black file:bg-cyan-500/20 file:text-cyan-400 
                  hover:file:bg-cyan-500/30 cursor-pointer" 
              />
            </div>
            
            <button 
  type="submit" 
  disabled={loading} 
  className={`w-full mt-6 py-4 rounded-xl text-lg font-black uppercase tracking-widest shadow-xl transition-all duration-300 flex items-center justify-center gap-3 ${
    loading 
      ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
      : 'bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-1 cursor-pointer'
  }`}
>
  {loading ? (
    <>
      <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
      <span>MENYIMPAN...</span>
    </>
  ) : (
    <>
      <span className="text-2xl">💾</span> 
      <span>SIMPAN JURNAL</span>
    </>
  )}
</button>
          </form>
        </div>

        <div className="lg:col-span-7 bg-slate-900/60 p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-black text-white font-mono">Arsip Jurnal Harian ({listJurnal.length})</h3>
            <button onClick={handleCetakPDFJurnal} className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer shadow"><span>🖨️</span> Cetak PDF Jurnal</button>
          </div>

          <div className="space-y-3 max-h-150 overflow-y-auto pr-1 font-medium">
            {listJurnal.length === 0 ? <p className="p-12 text-center text-xs text-slate-500 font-mono">Belum ada rekaman log jurnal.</p> : listJurnal.map(j => (
              <div key={j.id} className="p-5 bg-slate-950 rounded-2xl border border-slate-800/80 space-y-2.5 relative group hover:border-amber-500/40 transition-all shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 font-bold">📅 {j.tanggal}</span>
                    <span className="text-slate-400">• 📍 {j.sasaran_sekolah}</span>
                  </div>
                  <button onClick={() => handleDeleteJurnal(j.id)} className="text-rose-400 hover:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-sm" title="Hapus catatan">🗑️</button>
                </div>
                <div className="text-xs space-y-1.5 text-slate-300 leading-relaxed font-sans">
                  <p><strong className="text-slate-400 font-mono uppercase text-[10px]">Kegiatan:</strong> {j.aktivitas}</p>
                  <p className="text-amber-200/90 bg-slate-900/80 p-2.5 rounded-xl border border-amber-500/10"><strong className="text-amber-400 font-mono uppercase text-[10px] block mb-0.5 font-bold">Hasil:</strong> {j.hasil_capaian}</p>
                </div>
                {j.bukti_dukung && (
                  <div className="pt-2 border-t border-slate-900 flex justify-end">
                    <a href={j.bukti_dukung} target="_blank" rel="noreferrer" className="text-[11px] font-mono font-bold text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-lg">
                      <span>🖼️</span> Lihat Foto Bukti ↗
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
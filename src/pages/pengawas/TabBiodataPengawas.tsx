/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

interface TabBiodataPengawasProps {
  profile: any;
}

export default function TabBiodataPengawas({ profile }: TabBiodataPengawasProps) {

  // 🌟 STATE FORMULIR KOSONG (Akan disinkronisasi oleh useEffect)
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    nip_resmi: '',
    tempat_tgl_lahir: '',
    golongan: '',
    jabatan: '',
    tmt_cpns: '',
    tmt_pns: '',
    tmt_pengawas: '',
    instansi: '',
    alamat_rumah: '',
    npwp: '',
    karpeg: '',
    nuptk: '',
    nrg: '',
    serdik_guru: '',
    nik: '',
    rekening: '',
    link_drive_berkas: ''
  });

  // 🌟 SINKRONISASI DATA (Mencegah data hilang saat tab dibuka ulang)
  useEffect(() => {
    if (profile) {
      setFormData({
        nama_lengkap: profile.nama_lengkap || '',
        nip_resmi: profile.nip_resmi || profile.nomor_induk || '',
        tempat_tgl_lahir: profile.tempat_tgl_lahir || '',
        golongan: profile.golongan || '',
        jabatan: profile.jabatan || 'Pengawas Sekolah Ahli Muda',
        tmt_cpns: profile.tmt_cpns || '',
        tmt_pns: profile.tmt_pns || '',
        tmt_pengawas: profile.tmt_pengawas || '',
        instansi: profile.instansi || '',
        alamat_rumah: profile.alamat_rumah || '',
        npwp: profile.npwp || '',
        karpeg: profile.karpeg || '',
        nuptk: profile.nuptk || '',
        nrg: profile.nrg || '',
        serdik_guru: profile.serdik_guru || '',
        nik: profile.nik || '',
        rekening: profile.rekening || '',
        link_drive_berkas: profile.link_drive_berkas || ''
      });
    }
  }, [profile]);

  const [isSaving, setIsSaving] = useState(false);
  const [showModalCetak, setShowModalCetak] = useState(false);
  const [tempatCetak, setTempatCetak] = useState('Sukoharjo');
  const [tglCetak, setTglCetak] = useState(new Date().toISOString().split('T')[0]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSimpanBiodata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('id', profile.id);

      if (error) throw error;
      alert("✅ Biodata dan Tautan Arsip Berkas berhasil disimpan permanen!");
    } catch (err: any) {
      alert("❌ Gagal menyimpan data!\n\nPesan Sistem: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTanggalCetak = (dateString?: string) => {
    if (!dateString) return '-';
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  // 🌟 MESIN CETAK PRESISI (Disusun ulang 1 s.d 17)
  const handleEksekusiCetak = () => {
    const w = window.open('', '_blank');
    if (!w) {
      alert("❌ Pop-up terblokir. Harap izinkan pop-up untuk situs ini agar dapat mencetak.");
      return;
    }

    const nama = formData.nama_lengkap || "-";
    const nip = formData.nip_resmi || "-";
    const tpatTgl = formData.tempat_tgl_lahir || "-";
    const pangkat = formData.golongan || "-";
    const jabatan = formData.jabatan || "-";
    const tmtCpns = formData.tmt_cpns || "-";
    const tmtPns = formData.tmt_pns || "-";
    const tmt = formData.tmt_pengawas || "-";
    const alamatKantor = formData.instansi || "-";
    const alamatRumah = formData.alamat_rumah || "-";
    const npwp = formData.npwp || "-";
    const karpeg = formData.karpeg || "-";
    const nuptk = formData.nuptk || "-";
    const nrg = formData.nrg || "-";
    const serdikGuru = formData.serdik_guru || "-";
    const nik = formData.nik || "-";
    const rekening = formData.rekening || "-";

    const fotoUrl = profile?.avatar_url || "https://placehold.co/150x200/slate/white?text=PAS+FOTO";
    const lokasiTanggalTtd = `${tempatCetak}, ${formatTanggalCetak(tglCetak)}`;

    const formatMultiLine = (text: string) => {
      if (text === "-") return "-";
      return text.split('\n').map((line, idx) => `<div class="${idx > 0 ? 'mt-1' : ''}">${line}</div>`).join('');
    };

    w.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Biodata PNS - ${nama}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @media print {
            @page { size: A4 portrait; margin: 20mm 15mm 20mm 20mm; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
          table { border-collapse: collapse; width: 100%; }
          td { padding-top: 6px; padding-bottom: 6px; vertical-align: top; }
        </style>
      </head>
      <body class="font-serif text-black bg-white text-[13px] leading-relaxed p-4">
        
        <div class="text-center font-bold mb-8">
          <h1 class="text-base uppercase tracking-wider underline">BIODATA PEGAWAI NEGERI SIPIL</h1>
        </div>

        <table class="w-full mb-8">
          <tbody>
            <tr><td style="width: 5%;">1.</td><td style="width: 38%; font-weight: 600;">Nama Lengkap</td><td style="width: 3%;">:</td><td style="width: 54%; font-weight: 700;">${nama}</td></tr>
            <tr><td>2.</td><td class="font-semibold">NIP</td><td>:</td><td>${nip}</td></tr>
            <tr><td>3.</td><td class="font-semibold">Tempat, Tgl Lahir</td><td>:</td><td>${tpatTgl}</td></tr>
            <tr><td>4.</td><td class="font-semibold">Pangkat, Golruang</td><td>:</td><td>${pangkat}</td></tr>
            <tr><td>5.</td><td class="font-semibold">Jabatan</td><td>:</td><td>${jabatan}</td></tr>
            <tr><td>6.</td><td class="font-semibold">TMT CPNS</td><td>:</td><td>${tmtCpns}</td></tr>
            <tr><td>7.</td><td class="font-semibold">TMT PNS</td><td>:</td><td>${tmtPns}</td></tr>
            <tr><td>8.</td><td class="font-semibold">TMT Pengawas</td><td>:</td><td>${tmt}</td></tr>
            <tr><td>9.</td><td class="font-semibold">Alamat Kantor</td><td>:</td><td>${formatMultiLine(alamatKantor)}</td></tr>
            <tr><td></td><td class="font-semibold pt-4">Rumah</td><td class="pt-4">:</td><td class="pt-4">${formatMultiLine(alamatRumah)}</td></tr>
            <tr><td class="pt-4">10.</td><td class="font-semibold pt-4">NPWP</td><td class="pt-4">:</td><td class="pt-4">${npwp}</td></tr>
            <tr><td>11.</td><td class="font-semibold">No Kartu Pegawai/KARPEG</td><td>:</td><td>${karpeg}</td></tr>
            <tr><td>12.</td><td class="font-semibold">NUPTK</td><td>:</td><td>${nuptk}</td></tr>
            <tr><td>13.</td><td class="font-semibold">NRG ( No Register Guru )</td><td>:</td><td>${nrg}</td></tr>
            <tr><td>14.</td><td class="font-semibold">No Peserta Sertifikasi Guru</td><td>:</td><td>${serdikGuru}</td></tr>
            <tr><td>15.</td><td class="font-semibold">NIK (No Induk Kependudukan)</td><td>:</td><td>${nik}</td></tr>
            <tr><td>16.</td><td class="font-semibold">No Rekening</td><td>:</td><td>${formatMultiLine(rekening)}</td></tr>
          </tbody>
        </table>

        <div class="flex justify-end mt-6 pr-8">
          <div class="text-center w-64">
            <p class="font-semibold">${lokasiTanggalTtd}</p>
            <p class="font-semibold mb-3">Yang bersangkutan</p>
            <div class="my-3 flex justify-center"><img src="${fotoUrl}" alt="Pasfoto" class="w-24 h-32 object-cover border border-slate-400 p-0.5 shadow-sm" /></div>
            <p class="font-bold underline mt-4">${nama}</p>
            <p class="text-xs">NIP. ${nip}</p>
          </div>
        </div>

      </body>
      </html>
    `);

    w.document.close();
    w.focus();
    setShowModalCetak(false);
    setTimeout(() => { w.print(); }, 1200);
  };

  return (
    <div className="relative bg-slate-900/80 border-2 border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-8 animate-fade-in text-slate-100">
      
      {showModalCetak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#061030] border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-[0_0_40px_rgba(6,182,212,0.2)] space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-black font-mono text-white flex items-center gap-2"><span>🖨️</span> Konfigurasi Cetak</h3>
              <button onClick={() => setShowModalCetak(false)} className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold transition-colors cursor-pointer">✕</button>
            </div>
            <p className="text-xs text-slate-300 font-sans leading-relaxed">Sesuaikan tempat dan tanggal dokumen Biodata PNS.</p>
            <div className="space-y-4 text-xs font-mono">
              <div><label className="block text-slate-400 mb-1.5 font-bold">📍 Tempat Penandatanganan</label><input type="text" value={tempatCetak} onChange={e => setTempatCetak(e.target.value)} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
              <div><label className="block text-slate-400 mb-1.5 font-bold">📅 Tanggal Dokumen</label><input type="date" value={tglCetak} onChange={e => setTglCetak(e.target.value)} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={() => setShowModalCetak(false)} className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 font-mono text-xs font-bold transition-all border border-slate-800 cursor-pointer">Batal</button>
              <button type="button" onClick={handleEksekusiCetak} className="flex-1 py-3 px-4 rounded-xl bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-mono text-xs font-black transition-all cursor-pointer"><span>🖨️</span> Cetak Sekarang</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-black font-mono text-white flex items-center gap-2"><span>📋</span> BIODATA PENGAWAS SATUAN PENDIDIKAN</h3>
          <p className="text-xs text-slate-400 font-sans mt-1">Rekam identitas resmi dan arsip kepegawaian terintegrasi cloud satelit.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button type="button" onClick={() => setShowModalCetak(true)} className="px-5 py-2.5 bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-mono text-xs font-black rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all active:scale-95 cursor-pointer flex items-center gap-2"><span>🖨️</span> Cetak Biodata Resmi</button>
        </div>
      </div>

      <form onSubmit={handleSimpanBiodata} className="space-y-6 text-xs">
        
        {/* SECTION A: IDENTITAS */}
        <div className="space-y-4">
          <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider border-l-4 border-amber-400 pl-2">A. Identitas Diri & Jabatan</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
            <div><label className="block text-slate-400 mb-1 font-semibold">1. Nama Lengkap & Gelar</label><input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
            <div><label className="block text-slate-400 mb-1 font-semibold">2. NIP Resmi</label><input type="text" name="nip_resmi" value={formData.nip_resmi} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
            <div><label className="block text-slate-400 mb-1 font-semibold">3. Tempat, Tgl Lahir</label><input type="text" name="tempat_tgl_lahir" value={formData.tempat_tgl_lahir} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
            
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">4. Pangkat, Gol. Ruang</label>
              <select name="golongan" value={formData.golongan} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none cursor-pointer appearance-none">
                <option value="" disabled>-- Pilih Pangkat/Golongan --</option>
                <option value="Penata / III/c">Penata / III/c</option>
                <option value="Penata Tingkat I / III/d">Penata Tingkat I / III/d</option>
                <option value="Pembina / IV/a">Pembina / IV/a</option>
                <option value="Pembina Tingkat I / IV/b">Pembina Tingkat I / IV/b</option>
                <option value="Pembina Utama Muda / IV/c">Pembina Utama Muda / IV/c</option>
                <option value="Pembina Utama Madya / IV/d">Pembina Utama Madya / IV/d</option>
                <option value="Pembina Utama / IV/e">Pembina Utama / IV/e</option>
              </select>
            </div>
            
            <div><label className="block text-slate-400 mb-1 font-semibold">5. Jabatan</label><input type="text" name="jabatan" value={formData.jabatan} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
            <div><label className="block text-slate-400 mb-1 font-semibold">6. TMT CPNS</label><input type="date" name="tmt_cpns" value={formData.tmt_cpns} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none cursor-pointer" /></div>
            <div><label className="block text-slate-400 mb-1 font-semibold">7. TMT PNS</label><input type="date" name="tmt_pns" value={formData.tmt_pns} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none cursor-pointer" /></div>
            <div><label className="block text-slate-400 mb-1 font-semibold">8. TMT Pengawas</label><input type="date" name="tmt_pengawas" value={formData.tmt_pengawas} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none cursor-pointer" /></div>
          </div>
        </div>

        {/* SECTION B: ALAMAT */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider border-l-4 border-amber-400 pl-2">B. Alamat Instansi & Domisili</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono">
            <div><label className="block text-slate-400 mb-1 font-semibold">9. Alamat Kantor (Cabdisdik)</label><textarea rows={2} name="instansi" value={formData.instansi} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
            <div><label className="block text-slate-400 mb-1 font-semibold">10. Alamat Rumah</label><textarea rows={2} name="alamat_rumah" value={formData.alamat_rumah} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
          </div>
        </div>

        {/* SECTION C: LEGALITAS (Sudah direvisi, tanpa NPA PGRI & Serdik Pengawas) */}
        <div className="space-y-4 pt-2">
          <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider border-l-4 border-amber-400 pl-2">C. Registrasi & Dokumen Kepegawaian</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
            <div><label className="block text-slate-400 mb-1 font-semibold">11. NPWP</label><input type="text" name="npwp" value={formData.npwp} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
            <div><label className="block text-slate-400 mb-1 font-semibold">12. No. KARPEG</label><input type="text" name="karpeg" value={formData.karpeg} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
            <div><label className="block text-slate-400 mb-1 font-semibold">13. NUPTK</label><input type="text" name="nuptk" value={formData.nuptk} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
            <div><label className="block text-slate-400 mb-1 font-semibold">14. NRG (Register Guru)</label><input type="text" name="nrg" value={formData.nrg} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
            <div><label className="block text-slate-400 mb-1 font-semibold">15. No. Peserta Sertifikasi</label><input type="text" name="serdik_guru" value={formData.serdik_guru} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
            <div><label className="block text-slate-400 mb-1 font-semibold">16. NIK (Kependudukan)</label><input type="text" name="nik" value={formData.nik} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
            <div className="sm:col-span-2 lg:col-span-2"><label className="block text-slate-400 mb-1 font-semibold">17. No. Rekening Bank (Gaji/Tunjangan)</label><textarea rows={2} name="rekening" value={formData.rekening} onChange={handleChange} className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl p-3 text-white outline-none" /></div>
          </div>
        </div>

        {/* SECTION D: LINK DRIVE */}
        <div className="bg-linear-to-r from-blue-950/60 to-slate-900 p-5 sm:p-6 rounded-2xl border-2 border-cyan-500/40 space-y-3 mt-6 shadow-xl">
          <div className="flex items-center gap-2 text-cyan-300 font-mono font-bold text-sm"><span>🔗</span><h4>PORTAL ARSIP BERKAS KEPEGAWAIAN</h4></div>
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">Tempelkan tautan folder Google Drive yang berisi arsip SK, Ijazah, PAK, dll.</p>
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <input type="url" name="link_drive_berkas" value={formData.link_drive_berkas} onChange={handleChange} placeholder="https://drive.google.com/..." className="flex-1 bg-slate-950 border border-cyan-500/50 focus:border-cyan-400 rounded-xl p-3 text-cyan-300 font-mono text-xs outline-none" />
            <a href={formData.link_drive_berkas || '#'} target="_blank" rel="noreferrer" onClick={(e) => { if(!formData.link_drive_berkas) { e.preventDefault(); alert('Tautan masih kosong!'); } }} className="px-5 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl font-mono font-bold text-xs text-center cursor-pointer">↗ Uji Buka Link</a>
          </div>
        </div>

        {/* TOMBOL SIMPAN KE SUPABASE */}
        <div className="pt-4 flex justify-end">
          <button type="submit" disabled={isSaving} className="w-full sm:w-auto px-8 py-4 bg-linear-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black font-mono rounded-xl uppercase tracking-widest shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50">
            {isSaving ? "⏳ MENYIMPAN..." : "<span>💾</span> SIMPAN PEMUTAKHIRAN BIODATA"}
          </button>
        </div>

      </form>
    </div>
  );
}
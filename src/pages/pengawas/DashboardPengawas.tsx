/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

// IMPORT GAMBAR BANNER BARU
import dashboardPena from '../../assets/dashboard_pena.png'; 
import bannerPena from '../../assets/banner_pena.png'; 

// 🚀 IMPORT KE-5 KOMPONEN ANAK KITA
import TabProfilPengawas from './components/TabProfilPengawas';
import TabSekolahBinaan from './components/TabSekolahBinaan';
import TabShowcase from './components/TabShowcase';
import TabValidasiPraktik from './components/TabValidasi'; 
import TabValidasiPrestasi from './components/TabValidasiPrestasi';

interface PrestasiAjuan { id: string; sekolah_id: string; user_id: string; nama_siswa_atau_kegiatan: string; jenis_prestasi: string; jalur?: string; juara: string; tahun: string; poin: number; bukti_sertifikat: string; status_validasi: string; created_at: string; nama_sekolah?: string; logo_url?: string | null; npsn?: string; kategori?: string; jenis?: string; nama_prestasi?: string;}
interface PraktikBaik { id: string; user_id: string; sekolah_id: string; judul: string; deskripsi: string; jenis_media: string; media_url: string; status_validasi: string; created_at: string; nama_sekolah?: string; npsn?: string;}

// 👈 Interface MasterSekolah ditambah atribut wilayah
interface MasterSekolah { id: string; npsn: string; nama_sekolah: string; nama_kepala_sekolah?: string; logo_url?: string | null; cabang_dinas?: string; kabupaten_kota?: string; }

interface Reaksi { id: string; praktik_baik_id: string; user_id: string; jenis: 'LIKE' | 'DISLIKE'; }
interface Komentar { id: string; praktik_baik_id: string; user_id: string; komentar: string; created_at: string; profiles?: { nama_lengkap: string; avatar_url: string }; }

type TabKomando = 'SHOWCASE' | 'SEKOLAH_BINAAN' | 'VALIDASI_PRAKTIK' | 'PRESTASI' | 'PROFIL';

const panenKepalaSekolah = (targetNpsn: string, targetId: string, allSeks: any[], allBinaan: any[], allProfs: any[]) => {
  const npsnClean = String(targetNpsn || '').trim();
  const idClean = String(targetId || '').trim();
  const isNamaValid = (str: any) => str && String(str).trim() !== '' && String(str).toLowerCase() !== 'belum diatur';

  const sek = allSeks.find(s => (idClean && String(s.user_id) === idClean) || (npsnClean && String(s.npsn) === npsnClean));
  if (isNamaValid(sek?.nama_kepala_sekolah)) return String(sek.nama_kepala_sekolah).trim();

  const bin = allBinaan.find(b => (npsnClean && String(b.npsn) === npsnClean) || (idClean && String(b.sekolah_id) === idClean));
  if (isNamaValid(bin?.nama_kepala_sekolah)) return String(bin.nama_kepala_sekolah).trim();

  const prof = allProfs.find(p => p.id === idClean || p.nomor_induk === npsnClean);
  if (isNamaValid(prof?.nama_kepala_sekolah)) return String(prof.nama_kepala_sekolah).trim();

  return 'Belum diatur';
};

export default function DashboardPengawas() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKomando>('SHOWCASE');
  const [listPrestasi, setListPrestasi] = useState<PrestasiAjuan[]>([]);
  const [listPraktik, setListPraktik] = useState<PraktikBaik[]>([]);
  const [listSekolahMaster, setListSekolahMaster] = useState<MasterSekolah[]>([]);
  const [listTka, setListTka] = useState<any[]>([]);

  const [listReaksi, setListReaksi] = useState<Reaksi[]>([]);
  const [listKomentar, setListKomentar] = useState<Komentar[]>([]);
  const [expandedKaryaId, setExpandedKaryaId] = useState<string | null>(null);

  const [filterKategori, setFilterKategori] = useState<'SEMUA' | 'LOMBA' | 'LULUSAN' | 'TKA'>('SEMUA');
  const [tampilSemuaSekolah, setTampilSemuaSekolah] = useState(false);
  const [tampilSemuaInovasi, setTampilSemuaInovasi] = useState(false);

  const [pNama, setPNama] = useState('');
  const [pEmail, setPEmail] = useState('');
  const [pInstansi, setPInstansi] = useState('Cabdindik Wilayah VI');
  const [pJabatan, setPJabatan] = useState('Pengawas Satuan Pendidikan');
  const [pFotoUrl, setPFotoUrl] = useState('');
  const [pFotoFile, setPFotoFile] = useState<File | null>(null);
  const [profilLoading, setProfilLoading] = useState(false);
  
  const [pNipResmi, setPNipResmi] = useState('');
  const [pGolongan, setPGolongan] = useState('');
  const defaultComments = [
  "Luar biasa, sangat menginspirasi! 🚀",
  "Inovasi yang cerdas dan solutif. 💡",
  "Praktik baik yang patut dicontoh. 👏",
  "Sangat kreatif, maju terus! 🔥",
  "Izin mengadaptasi program ini di sekolah kami. ✨"
];

  const fetchInteraksi = async () => {
    try {
      const { data: rx } = await supabase.from('praktik_baik_reaksi').select('*');
      if (rx) setListReaksi(rx);
      
      const { data: km } = await supabase.from('praktik_baik_komentar')
        .select('*, profiles(nama_lengkap, avatar_url)')
        .order('created_at', { ascending: true });
      if (km) setListKomentar(km);
    } catch (error) { console.log("Interaksi table check fallback", error); }
  };

  const jalankanPipelineSinkronisasi = async () => {
    if (!profile?.id) return { binaan: [], sekolah: [], profs: [] };

    const { data: allProfs } = await supabase.from('profiles').select('*');
    const { data: rawBinaan } = await supabase.from('sekolah_binaan').select('*').eq('pengawas_id', profile.id);
    const { data: rawSekolah } = await supabase.from('sekolah').select('*');

    let currentBinaan = rawBinaan || [];
    let currentSekolah = rawSekolah || [];
    const profs = allProfs || [];

    let isSekolahUpdated = false;

    const profilSekolah = profs.filter(p => String(p.role).toUpperCase() === 'SEKOLAH');
    const npsnMasterAda = currentSekolah.map(s => String(s.npsn).trim());
    
    const sekolahTanpaMaster = profilSekolah.filter(ps => {
       const npsn = String(ps.nomor_induk).trim();
       return npsn && npsn !== '-' && !npsnMasterAda.includes(npsn);
    });

    if (sekolahTanpaMaster.length > 0) {
       for (const sek of sekolahTanpaMaster) {
          const npsnSek = String(sek.nomor_induk).trim();
          const { data: exist } = await supabase.from('sekolah').select('id').eq('npsn', npsnSek).maybeSingle();
          
          if (!exist) {
             await supabase.from('sekolah').insert({
                id: sek.id, user_id: sek.id, npsn: npsnSek,
                nama_sekolah: sek.nama_lengkap || `Sekolah (${npsnSek})`,
                nama_kepala_sekolah: 'Belum diatur', alamat: 'Menunggu pemutakhiran profil'
             });
             isSekolahUpdated = true;
          }
       }
    }

    if (isSekolahUpdated) {
       const { data: newSekolah } = await supabase.from('sekolah').select('*');
       currentSekolah = newSekolah || [];
    }

    return { binaan: currentBinaan, sekolah: currentSekolah, profs: profs };
  };

  const fetchSemuaDataMaster = async () => {
    if (!profile?.id) return;

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
    if (prof) {
      setPNama(prof.nama_lengkap || ''); setPEmail(prof.email || '');
      setPInstansi(prof.instansi || 'Cabdindik Wilayah VI'); setPJabatan(prof.jabatan || 'Pengawas Satuan Pendidikan');
      setPFotoUrl(prof.avatar_url || ''); setPNipResmi(prof.nip_resmi || ''); setPGolongan(prof.golongan || '');
    }

    const { binaan: binaanList, sekolah: masterSeks, profs: allProfs } = await jalankanPipelineSinkronisasi();

    const { data: resTka } = await supabase.from('tka_sekolah').select('*');
    setListTka(resTka || []);

    setListSekolahMaster(binaanList.map(b => {
      const b_npsn = String(b.npsn || '').trim();
      const b_id = String(b.sekolah_id || '').trim();

      const matching = masterSeks.find(s => String(s.npsn || '').trim() === b_npsn || (s.id && String(s.id).trim() === b_id));
      const profMatch = allProfs.find(p => String(p.nomor_induk || '').trim() === b_npsn || (p.id && String(p.id).trim() === b_id));
      
      let finalNama = matching?.nama_sekolah || b.nama_sekolah || profMatch?.nama_lengkap;
      if (!finalNama || String(finalNama).trim() === '' || String(finalNama).startsWith('Satuan Pendidikan')) {
         finalNama = profMatch?.nama_lengkap || b.nama_sekolah || `Sekolah (${b_npsn || 'Belum Terdaftar'})`;
      }

      const finalKepsek = panenKepalaSekolah(b_npsn, b_id, masterSeks, binaanList, allProfs);

      // 👈 WILAYAH DISUNTIKKAN KE MASTER
      return {
        id: matching?.id || b.sekolah_id || b.npsn, npsn: b_npsn || '-', nama_sekolah: finalNama,
        nama_kepala_sekolah: finalKepsek, logo_url: matching?.logo_url || profMatch?.avatar_url || null,
        cabang_dinas: matching?.cabang_dinas || '', kabupaten_kota: matching?.kabupaten_kota || ''
      };
    }));

    const cariPemilik = (targetId: string, targetNpsn?: string) => {
      const tId = String(targetId || '').trim(); const tNpsn = String(targetNpsn || '').trim();
      const profMatch = allProfs.find(x => String(x.id).trim() === tId || (tNpsn && String(x.nomor_induk).trim() === tNpsn));
      const matchSek = masterSeks.find(s => String(s.id).trim() === tId || (tNpsn && String(s.npsn).trim() === tNpsn)) || 
                       binaanList.find(b => String(b.sekolah_id).trim() === tId || (tNpsn && String(b.npsn).trim() === tNpsn));
      
      let namaAsli = matchSek?.nama_sekolah || profMatch?.nama_lengkap;
      if (!namaAsli || String(namaAsli).trim() === '' || String(namaAsli).startsWith('Satuan Pendidikan')) {
         namaAsli = profMatch?.nama_lengkap || (tNpsn ? `Sekolah (${tNpsn})` : 'Satuan Pendidikan Terdaftar');
      }

      return { nama: (namaAsli && isNaN(Number(namaAsli))) ? namaAsli : (tNpsn ? `Sekolah (${tNpsn})` : 'Satuan Pendidikan Terdaftar'), logo: (matchSek as any)?.logo_url || profMatch?.avatar_url || null };
    };

    const { data: presRaw } = await supabase.from('prestasi').select('*').order('created_at', { ascending: false });
    setListPrestasi((presRaw || []).map((p: any) => {
      const info = cariPemilik(p.sekolah_id || p.user_id, p.npsn);
      let npsnAsli = String(p.npsn || '').trim();
      if (!npsnAsli) {
        const profilPemilik = allProfs.find(x => String(x.id) === String(p.sekolah_id) || String(x.id) === String(p.user_id));
        npsnAsli = String(profilPemilik?.nomor_induk || '').trim();
      }
      return { ...p, status_validasi: (p.status_validasi || p.status || 'MENUNGGU').toUpperCase(), nama_sekolah: info.nama, logo_url: info.logo, npsn: npsnAsli };
    }));

    const { data: prakRaw } = await supabase.from('praktik_baik').select('*').order('created_at', { ascending: false });
    setListPraktik((prakRaw || []).map((pb: any) => {
      const info = cariPemilik(pb.sekolah_id || pb.user_id, pb.npsn);
      return { id: pb.id, user_id: pb.user_id || '', sekolah_id: pb.sekolah_id || '', judul: pb.judul || pb.nama_karya || 'Inovasi Tanpa Judul', deskripsi: pb.deskripsi || pb.isi || pb.ringkasan || 'Tidak ada deskripsi', jenis_media: (pb.jenis_media || pb.tipe || 'DOKUMEN').toUpperCase(), media_url: pb.media_url || pb.file_pendukung || pb.link_drive || '', status_validasi: (pb.status_validasi || pb.status || pb.status_karya || 'MENUNGGU').toUpperCase(), created_at: pb.created_at || new Date().toISOString(), nama_sekolah: info.nama, npsn: pb.npsn || '' };
    }));

    fetchInteraksi();
  };

  useEffect(() => { fetchSemuaDataMaster(); }, [profile]);

  const handleReviewBukti = (url?: string | null) => {
    if (!url) { alert("Tautan karya tidak terdeteksi."); return; }
    let link = url.trim(); if (!link.startsWith('http')) link = 'https://' + link; window.open(link, '_blank');
  };

  const handleValidasiPraktik = async (id: string, statusBaru: 'DISETUJUI' | 'DITOLAK') => {
    try { let res = await supabase.from('praktik_baik').update({ status_validasi: statusBaru }).eq('id', id); if (res.error) res = await supabase.from('praktik_baik').update({ status: statusBaru }).eq('id', id); if (res.error) throw res.error; alert(` ✅ Karya Inovasi berhasil ${statusBaru.toLowerCase()}!`); fetchSemuaDataMaster(); } catch (e: any) { alert("Gagal memproses: " + e.message); }
  };

  const handleValidasiPrestasi = async (id: string, statusBaru: 'DISETUJUI' | 'DITOLAK') => {
    try { let res = await supabase.from('prestasi').update({ status_validasi: statusBaru }).eq('id', id); if (res.error) res = await supabase.from('prestasi').update({ status: statusBaru }).eq('id', id); if (res.error) throw res.error; alert(` ✅ Prestasi berhasil ${statusBaru.toLowerCase()}!`); fetchSemuaDataMaster(); } catch (e: any) { alert("Gagal memproses: " + e.message); }
  };

  const handleUpdateProfil = async (e: React.FormEvent) => {
    e.preventDefault(); if (!profile?.id) return; setProfilLoading(true);
    try { 
      let finalFoto = pFotoUrl; 
      if (pFotoFile) { 
        const ext = pFotoFile.name.split('.').pop(); 
        const path = `pengawas/${profile.id}-${Date.now()}.${ext}`; 
        const { error: errUp } = await supabase.storage.from('pengawas_foto').upload(path, pFotoFile, { upsert: true }); 
        if (errUp) throw errUp; 
        finalFoto = supabase.storage.from('pengawas_foto').getPublicUrl(path).data.publicUrl; 
      } 
      await supabase.from('profiles').update({ 
        nama_lengkap: pNama.trim(), email: pEmail.trim(), instansi: pInstansi.trim(), 
        jabatan: pJabatan.trim(), avatar_url: finalFoto, nip_resmi: pNipResmi.trim(), golongan: pGolongan.trim()
      }).eq('id', profile.id); 
      
      setPFotoUrl(finalFoto); 
      alert("Profil Pengawas berhasil diperbarui!"); 
    } catch (err: any) { alert("Gagal update profil: " + err.message); } finally { setProfilLoading(false); }
  };

  // MESIN PENGOLAHAN LOGIKA KLASEMEN & FILTER
  const praktikMenunggu = listPraktik.filter(p => p.status_validasi === 'MENUNGGU');
  const praktikDisetujui = listPraktik.filter(p => p.status_validasi === 'DISETUJUI');
  const prestasiMenunggu = listPrestasi.filter(p => p.status_validasi === 'MENUNGGU');
  let prestasiTerfilter = listPrestasi.filter(p => p.status_validasi === 'DISETUJUI');

  if (filterKategori === 'LOMBA') {
    prestasiTerfilter = prestasiTerfilter.filter(pr => { const val = String(pr.jalur || pr.jenis_prestasi || '').toUpperCase(); return val.includes('LOMBA') || ['OSN', 'O2SN', 'FLS3N', 'KOSN', 'LDI', 'FIKSI', 'OPSI'].includes(val); });
  } else if (filterKategori === 'LULUSAN') {
    prestasiTerfilter = prestasiTerfilter.filter(pr => { const val = String(pr.jalur || pr.jenis_prestasi || '').toUpperCase(); return val.includes('LULUSAN') || val.includes('KELULUSAN') || ['SNBP', 'SNBT', 'MANDIRI', 'KEDINASAN'].includes(val); });
  } else if (filterKategori === 'TKA') {
    prestasiTerfilter = prestasiTerfilter.filter(pr => { const val = String(pr.jalur || pr.kategori || pr.jenis_prestasi || pr.jenis || pr.nama_prestasi || '').toUpperCase(); return val.includes('TKA') || val.includes('AKADEMIK') || val.includes('NILAI'); });
  }

  // 👈 PEMETAAN KLASEMEN DENGAN ATRIBUT WILAYAH
  const mapKlasemen = listSekolahMaster.reduce((acc, sek) => {
    const safeNpsn = String(sek.npsn || '').trim();
    if (safeNpsn && safeNpsn !== '-') {
      const tkaRow = listTka.find(t => String(t.npsn).trim() === safeNpsn || String(t.user_id).trim() === sek.id);
      const scoreTka = tkaRow ? Number(tkaRow.rata_rata_total) : 0;
      acc[safeNpsn] = { 
        nama: sek.nama_sekolah || `Sekolah (${safeNpsn})`, 
        npsn: safeNpsn, 
        kepala: sek.nama_kepala_sekolah && sek.nama_kepala_sekolah !== '-' ? sek.nama_kepala_sekolah : 'Belum diatur', 
        logo: sek.logo_url || null, 
        trofi: 0, 
        pts: filterKategori === 'SEMUA' ? scoreTka : 0, 
        tka_score: scoreTka,
        cabang_dinas: sek.cabang_dinas || '',
        kabupaten_kota: sek.kabupaten_kota || ''
      };
    }
    return acc;
  }, {} as Record<string, { nama: string; npsn: string; kepala: string; logo: string | null; trofi: number; pts: number; tka_score: number; cabang_dinas?: string; kabupaten_kota?: string; }>);

  prestasiTerfilter.forEach(curr => {
    const npsnPrestasi = String(curr.npsn || '').trim();
    if (npsnPrestasi && mapKlasemen[npsnPrestasi]) {
      mapKlasemen[npsnPrestasi].trofi += 1;
      mapKlasemen[npsnPrestasi].pts = Number((mapKlasemen[npsnPrestasi].pts + (Number(curr.poin) || 0)).toFixed(2));
    } else if (npsnPrestasi && !mapKlasemen[npsnPrestasi]) {
      const tkaRow = listTka.find(t => String(t.npsn).trim() === npsnPrestasi || String(t.user_id).trim() === curr.sekolah_id);
      const scoreTka = tkaRow ? Number(tkaRow.rata_rata_total) : 0;
      
      const sekMaster = listSekolahMaster.find(s => s.npsn === npsnPrestasi);
      
      mapKlasemen[npsnPrestasi] = { 
        nama: curr.nama_sekolah || `Sekolah (${npsnPrestasi})`, 
        npsn: npsnPrestasi, 
        kepala: 'Belum diatur', 
        logo: curr.logo_url || null, 
        trofi: 1, 
        pts: Number(((filterKategori === 'SEMUA' ? scoreTka : 0) + (Number(curr.poin) || 0)).toFixed(2)), 
        tka_score: scoreTka,
        cabang_dinas: sekMaster?.cabang_dinas || '',
        kabupaten_kota: sekMaster?.kabupaten_kota || ''
      };
    }
  });

  const sortedKlasemen = Object.values(mapKlasemen)
    .filter(k => filterKategori === 'TKA' ? k.tka_score > 0 || listSekolahMaster.some(s => String(s.npsn).trim() === k.npsn) : (k.trofi > 0 || k.pts > 0 || listSekolahMaster.some(s => String(s.npsn).trim() === k.npsn)))
    .sort((a, b) => {
      if (filterKategori === 'TKA') return b.tka_score - a.tka_score; 
      if (filterKategori === 'SEMUA') {
        const totalB = b.pts + b.tka_score; const totalA = a.pts + a.tka_score;
        if (totalB !== totalA) return totalB - totalA;
      } else {
        if (b.pts !== a.pts) return b.pts - a.pts;
      }
      return b.trofi - a.trofi;
    });

  const inovasiTerurut = [...praktikDisetujui].sort((a, b) => {
    const likesA = listReaksi.filter(r => r.praktik_baik_id === a.id && r.jenis === 'LIKE').length;
    const likesB = listReaksi.filter(r => r.praktik_baik_id === b.id && r.jenis === 'LIKE').length;
    return likesB - likesA;
  });

  const inovasiDitampilkan = tampilSemuaInovasi ? inovasiTerurut : inovasiTerurut.slice(0, 3);

  const handleReaksi = async (karyaId: string, jenis: 'LIKE' | 'DISLIKE') => {
    if (!profile?.id) return alert("Sesi tidak valid.");
    try {
      const exist = listReaksi.find(r => r.praktik_baik_id === karyaId && r.user_id === profile.id);
      if (exist) {
        if (exist.jenis === jenis) await supabase.from('praktik_baik_reaksi').delete().eq('id', exist.id);
        else await supabase.from('praktik_baik_reaksi').update({ jenis }).eq('id', exist.id);
      } else await supabase.from('praktik_baik_reaksi').insert({ praktik_baik_id: karyaId, user_id: profile.id, jenis });
      await fetchInteraksi();
    } catch (e: any) { alert(`❌ Reaksi Ditolak Database!\nPesan: ${e.message}`); }
  };

  const handleKirimKomentarCepat = async (karyaId: string, teks: string) => {
    if (!profile?.id) return alert("Sesi tidak valid.");
    try {
      await supabase.from('praktik_baik_komentar').insert({ praktik_baik_id: karyaId, user_id: profile.id, komentar: teks });
      await fetchInteraksi();
    } catch (e: any) { alert(`❌ Komentar Ditolak Database!\nPesan: ${e.message}`); }
  };

  const handleDeleteGaleriInovasi = async (id: string, judulKarya: string) => {
    if (window.confirm(`🚨 PERINGATAN OTORITAS 🚨\n\nAnda yakin ingin menghapus permanen karya inovasi "${judulKarya}" dari Galeri Publik?`)) {
      try { await supabase.from('praktik_baik').delete().eq('id', id); alert("🗑️ Karya inovasi berhasil dihapus."); fetchSemuaDataMaster(); } catch (err: any) { alert("Gagal menghapus karya: " + err.message); }
    }
  };

  const renderKaryaPengawasCard = (karya: PraktikBaik) => {
    const jm = String(karya.jenis_media || '').toUpperCase(); const urlMentah = String(karya.media_url || '').trim(); const urlLower = urlMentah.toLowerCase();
    let tipe = 'DOCUMENT'; 
    if (jm.includes('GAMBAR') || jm.includes('FOTO') || urlLower.endsWith('.jpg') || urlLower.endsWith('.png') || urlLower.endsWith('.webp')) tipe = 'IMAGE'; 
    else if (jm.includes('VIDEO') || urlLower.includes('youtube.com') || urlLower.includes('youtu.be') || urlLower.endsWith('.mp4')) tipe = 'VIDEO';

    const cardReaksi = listReaksi.filter(r => r.praktik_baik_id === karya.id);
    const myLike = cardReaksi.find(r => r.user_id === profile?.id && r.jenis === 'LIKE');
    const myDislike = cardReaksi.find(r => r.user_id === profile?.id && r.jenis === 'DISLIKE');
    const likesCount = cardReaksi.filter(r => r.jenis === 'LIKE').length;
    const dislikesCount = cardReaksi.filter(r => r.jenis === 'DISLIKE').length;
    const cardKomentar = listKomentar.filter(k => k.praktik_baik_id === karya.id);
    const isExpanded = expandedKaryaId === karya.id;

    return (
      <div key={karya.id} className="bg-white border-2 border-black shadow-neo hover:-translate-y-1 hover:shadow-neo-md dark:bg-slate-900/80 dark:border-slate-800 dark:shadow-xl rounded-3xl p-6 flex flex-col justify-between dark:hover:border-cyan-500/50 transition-all duration-300 group">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${tipe === 'VIDEO' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : tipe === 'IMAGE' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'}`}>
              {tipe === 'VIDEO' ? '▶️ VIDEO' : tipe === 'IMAGE' ? '🖼️ GAMBAR' : '📄 DOKUMEN'}
            </span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-45">{karya.nama_sekolah}</span>
          </div>
          <h3 className="font-black text-lg text-black group-hover:text-cyan-600 dark:text-white dark:group-hover:text-cyan-300 transition-colors leading-snug">{karya.judul}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 italic">"{karya.deskripsi}"</p>
        </div>

        {urlMentah && (
          <div className="mt-4 pt-4 border-t border-black/20 dark:border-slate-800/80 space-y-3">
            {tipe === 'IMAGE' && (
              <div className="space-y-2">
                <div className="w-full h-36 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-950 border-2 border-black dark:border-slate-800 group/img relative">
                  <img src={urlMentah} alt={karya.judul} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-900/90 text-cyan-300 font-mono text-xs font-bold border border-cyan-500/30">🔍 Klik untuk Perbesar</span>
                  </div>
                </div>
                <a href={urlMentah} target="_blank" rel="noreferrer" className="w-full py-2.5 px-4 rounded-xl bg-yellow-400 border-2 border-black shadow-neo text-black font-mono text-xs font-black flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-none dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-cyan-400 dark:border-transparent dark:shadow-none">
                  <span>👁️</span> Buka Gambar Penuh ↗
                </a>
              </div>
            )}
            {tipe === 'VIDEO' && (
              <a href={urlMentah} target="_blank" rel="noreferrer" className="w-full h-36 rounded-2xl bg-red-100 border-2 border-black shadow-neo dark:bg-linear-to-br dark:from-slate-950 dark:to-red-950/30 dark:border-red-500/20 flex flex-col items-center justify-center group/vid relative overflow-hidden transition-all dark:hover:border-red-500/40 dark:shadow-none">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center pl-1 shadow-[0_0_20px_rgba(220,38,38,0.5)] group-hover/vid:scale-110 transition-transform">
                  <span className="text-xl font-black">▶</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-red-700 dark:text-red-300 mt-2 tracking-widest uppercase">Tonton Video ↗</span>
              </a>
            )}
            {tipe === 'DOCUMENT' && (
              <a href={urlMentah} target="_blank" rel="noreferrer" className="w-full py-3 px-4 rounded-2xl bg-blue-100 border-2 border-black shadow-neo text-blue-800 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:border-blue-500/20 dark:text-blue-300 font-mono text-xs font-bold flex items-center justify-between transition-all hover:-translate-y-0.5 dark:shadow-none">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">📄</span>
                  <span className="truncate max-w-37.5">Buka Tautan</span>
                </div>
                <span className="text-blue-600 dark:text-cyan-400 font-black">↗</span>
              </a>
            )}

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/20 dark:border-slate-800/40">
              <div className="flex gap-2">
                <button onClick={() => handleReaksi(karya.id, 'LIKE')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${myLike ? 'bg-cyan-400 text-black border-black shadow-neo dark:bg-cyan-500 dark:text-slate-950 dark:border-cyan-400 dark:shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-white text-slate-700 border-black hover:-translate-y-0.5 hover:shadow-neo dark:bg-slate-950 dark:text-slate-400 dark:border-slate-700 dark:hover:border-cyan-500/50 dark:hover:text-cyan-400 dark:shadow-none'}`}>
                  👍 <span>{likesCount}</span>
                </button>
                <button onClick={() => handleReaksi(karya.id, 'DISLIKE')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${myDislike ? 'bg-rose-500 text-white border-black shadow-neo dark:border-rose-400 dark:shadow-none' : 'bg-white text-slate-700 border-black hover:-translate-y-0.5 hover:shadow-neo dark:bg-slate-950 dark:text-slate-400 dark:border-slate-700 dark:hover:border-rose-500/50 dark:hover:text-rose-400 dark:shadow-none'}`}>
                  👎 <span>{dislikesCount}</span>
                </button>
              </div>
              <button onClick={() => setExpandedKaryaId(isExpanded ? null : karya.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black border-2 border-black hover:-translate-y-0.5 hover:shadow-neo dark:bg-slate-950 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white text-xs font-bold transition-all cursor-pointer dark:shadow-none">
                💬 {cardKomentar.length} Diskusi
              </button>
            </div>
            <button onClick={() => handleDeleteGaleriInovasi(karya.id, karya.judul)} className="w-full mt-2 py-1.5 border-2 border-rose-500 border-dashed text-rose-600 bg-rose-50 hover:bg-rose-100 dark:border-rose-500/30 dark:text-rose-400 dark:bg-transparent dark:hover:bg-rose-500/10 rounded-xl text-[10px] font-bold uppercase cursor-pointer transition-colors">
              🗑️ Cabut Karya
            </button>

            {isExpanded && (
              <div className="pt-3 border-t border-black/20 dark:border-slate-800 animate-fade-in space-y-3">
                <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                  {cardKomentar.length === 0 ? (
                    <p className="text-[10px] text-slate-500 font-mono italic text-center py-2">Belum ada tanggapan.</p>
                  ) : (
                    cardKomentar.map(kom => (
                      <div key={kom.id} className="bg-slate-50 border-2 border-black/20 dark:bg-slate-950 rounded-xl p-2.5 flex gap-2.5 text-xs dark:border-slate-800/80">
                        {kom.profiles?.avatar_url ? (
                          <img src={kom.profiles.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5 border border-black dark:border-transparent" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-slate-300 dark:bg-slate-800 flex items-center justify-center shrink-0 text-[9px] mt-0.5">👤</div>
                        )}
                        <div className="space-y-0.5 overflow-hidden">
                          <span className="font-bold text-blue-600 dark:text-cyan-400 block text-[10px] truncate">{kom.profiles?.nama_lengkap || 'Pengguna'}</span>
                          <span className="text-slate-800 dark:text-slate-300 text-xs block leading-snug">{kom.komentar}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <div className="space-y-1.5 pt-2 border-t border-black/20 dark:border-slate-800/60">
                  <span className="block text-[9px] font-mono text-slate-600 dark:text-slate-400 uppercase tracking-wider">Kirim apresiasi cepat:</span>
                  <div className="flex flex-wrap gap-1">
                    {defaultComments.map((txt, idx) => (
                      <button key={idx} onClick={() => handleKirimKomentarCepat(karya.id, txt)} className="px-2.5 py-1 rounded-lg bg-white border-2 border-black text-black hover:bg-yellow-400 dark:bg-slate-950 dark:hover:bg-cyan-500 dark:hover:text-slate-950 dark:text-slate-300 dark:border-slate-800 dark:hover:border-cyan-400 text-[10px] font-medium transition-all text-left cursor-pointer">
                        {txt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in text-black dark:text-slate-100 font-sans pb-16 select-none max-w-7xl mx-auto px-4 transition-colors duration-300">
      
      {/* HEADER & PROFIL PENGAWAS TERPADU */}
      <div className="relative rounded-3xl overflow-hidden shadow-neo mb-6 border-4 border-black dark:border-2 dark:border-slate-800 dark:shadow-2xl w-full flex flex-col justify-end min-h-75 sm:min-h-100">
        {/* Latar Belakang Gambar Full tanpa efek zoom */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src={dashboardPena} alt="PENA Enterprise" className="w-full h-full object-cover object-center" />
          {/* Gradasi gelap di bagian bawah agar teks profil tetap terbaca jelas */}
          <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-900/20 to-transparent dark:from-slate-950 dark:via-slate-900/50" />
        </div>
        
        {/* Badge Otoritas */}
        <div className="absolute top-4 right-4 z-10 px-4 py-2 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-white/90 border-2 border-black text-black shadow-neo-sm dark:bg-slate-900/90 dark:border-cyan-500/30 dark:text-cyan-400 dark:shadow-none">
          OTORITAS: PENGAWAS
        </div>

        {/* Konten Profil di Atas Banner */}
        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mt-auto w-full">
          <div className="flex items-end sm:items-center gap-5">
            {pFotoUrl ? (
              <img src={pFotoUrl} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-xl shrink-0 dark:border-slate-800" />
            ) : (
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black font-mono shrink-0 bg-yellow-400 border-4 border-white text-black shadow-xl dark:bg-slate-800 dark:border-slate-700 dark:text-cyan-400">P</div>
            )}
            <div className="mb-1 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md">{pNama || profile?.nama_lengkap || "Pengawas Satuan Pendidikan"}</h1>
              <p className="text-xs font-mono mt-1.5 font-bold text-slate-200 drop-shadow-md">{pInstansi} • {pJabatan}</p>
            </div>
          </div>
          <button onClick={() => setActiveTab('PROFIL')} className="px-6 py-3.5 font-black rounded-xl text-xs uppercase tracking-wider transition-all transform cursor-pointer border-2 bg-yellow-400 hover:bg-yellow-300 text-black border-black shadow-neo hover:-translate-y-1 active:translate-y-0 active:shadow-none dark:bg-linear-to-r dark:from-cyan-600 dark:to-blue-700 dark:hover:from-cyan-500 dark:hover:to-blue-600 dark:text-white dark:border-transparent dark:shadow-[0_0_20px_rgba(6,182,212,0.4)] dark:hover:shadow-[0_0_30px_rgba(6,182,212,0.7)]">
            ⚙️ Edit Profil & Logo
          </button>
        </div>
      </div>

      {/* NAVIGASI TAB */}
      <div className="flex gap-2 p-2 rounded-2xl overflow-x-auto font-mono text-xs transition-all bg-white border-4 border-black shadow-neo dark:bg-slate-900/80 dark:border-2 dark:border-slate-800 dark:shadow-none">
        <button onClick={() => setActiveTab('SHOWCASE')} className={`flex-1 min-w-45 py-3.5 px-4 rounded-xl font-black transition-all cursor-pointer flex items-center justify-center gap-2 border-2 ${activeTab === 'SHOWCASE' ? 'bg-yellow-400 text-black border-black shadow-neo-md -translate-y-1 dark:bg-blue-600 dark:text-white dark:border-transparent dark:shadow-lg dark:shadow-blue-600/30 dark:translate-y-0' : 'bg-transparent border-transparent text-slate-600 hover:text-black hover:border-black/20 dark:text-slate-400 dark:hover:text-white dark:hover:border-transparent'}`}>🏆 Dasbor Papan</button>
        <button onClick={() => setActiveTab('SEKOLAH_BINAAN')} className={`flex-1 min-w-45 py-3.5 px-4 rounded-xl font-black transition-all cursor-pointer flex items-center justify-center gap-2 border-2 ${activeTab === 'SEKOLAH_BINAAN' ? 'bg-yellow-400 text-black border-black shadow-neo-md -translate-y-1 dark:bg-blue-600 dark:text-white dark:border-transparent dark:shadow-lg dark:shadow-blue-600/30 dark:translate-y-0' : 'bg-transparent border-transparent text-slate-600 hover:text-black hover:border-black/20 dark:text-slate-400 dark:hover:text-white dark:hover:border-transparent'}`}>🏫 Sekolah Binaan</button>
        <button onClick={() => setActiveTab('VALIDASI_PRAKTIK')} className={`flex-1 min-w-50 py-3.5 px-4 rounded-xl font-black transition-all cursor-pointer flex items-center justify-center gap-2 border-2 ${activeTab === 'VALIDASI_PRAKTIK' ? 'bg-yellow-400 text-black border-black shadow-neo-md -translate-y-1 dark:bg-blue-600 dark:text-white dark:border-transparent dark:translate-y-0' : 'bg-transparent border-transparent text-slate-600 hover:text-black hover:border-black/20 dark:text-slate-400 dark:hover:text-white dark:hover:border-transparent'}`}>💡 Validasi Praktik {praktikMenunggu.length > 0 && <span className="px-1.5 py-0.2 bg-red-500 text-white border border-black dark:border-none rounded-full text-[10px] animate-pulse">{praktikMenunggu.length}</span>}</button>
        <button onClick={() => setActiveTab('PRESTASI')} className={`flex-1 min-w-45 py-3.5 px-4 rounded-xl font-black transition-all cursor-pointer flex items-center justify-center gap-2 border-2 ${activeTab === 'PRESTASI' ? 'bg-yellow-400 text-black border-black shadow-neo-md -translate-y-1 dark:bg-blue-600 dark:text-white dark:border-transparent dark:translate-y-0' : 'bg-transparent border-transparent text-slate-600 hover:text-black hover:border-black/20 dark:text-slate-400 dark:hover:text-white dark:hover:border-transparent'}`}>🎖️ Validasi Prestasi {prestasiMenunggu.length > 0 && <span className="px-1.5 py-0.2 bg-amber-500 text-black border border-black dark:border-none rounded-full text-[10px] animate-pulse">{prestasiMenunggu.length}</span>}</button>
      </div>

      {/* RENDER KE-5 KOMPONEN ANAK SECARA BERSIH DAN ELEGAN */}
      
      {activeTab === 'SHOWCASE' && (
        <TabShowcase 
          filterKategori={filterKategori} setFilterKategori={setFilterKategori}
          // 👈 DATA YANG DIKIRIM SEKARANG DATA UTUH BUKAN POTONGAN
          papanDataUtuh={sortedKlasemen} 
          tampilSemuaSekolah={tampilSemuaSekolah} setTampilSemuaSekolah={setTampilSemuaSekolah}
          inovasiDitampilkan={inovasiDitampilkan} inovasiTotal={inovasiTerurut.length}
          tampilSemuaInovasi={tampilSemuaInovasi} setTampilSemuaInovasi={setTampilSemuaInovasi}
          renderKaryaPengawasCard={renderKaryaPengawasCard}
        />
      )}

      {activeTab === 'SEKOLAH_BINAAN' && (
        <TabSekolahBinaan listSekolahMaster={listSekolahMaster} />
      )}

      {activeTab === 'VALIDASI_PRAKTIK' && (
        <TabValidasiPraktik 
          praktikMenunggu={praktikMenunggu} 
          handleReviewBukti={handleReviewBukti} 
          handleValidasiPraktik={handleValidasiPraktik} 
        />
      )}

      {activeTab === 'PRESTASI' && (
        <TabValidasiPrestasi 
          prestasiMenunggu={prestasiMenunggu} 
          handleReviewBukti={handleReviewBukti} 
          handleValidasiPrestasi={handleValidasiPrestasi} 
        />
      )}

      {activeTab === 'PROFIL' && (
        <TabProfilPengawas
          pNama={pNama} setPNama={setPNama}
          pEmail={pEmail} setPEmail={setPEmail}
          pInstansi={pInstansi} setPInstansi={setPInstansi}
          pJabatan={pJabatan} setPJabatan={setPJabatan}
          pNipResmi={pNipResmi} setPNipResmi={setPNipResmi}
          pGolongan={pGolongan} setPGolongan={setPGolongan}
          setPFotoFile={setPFotoFile}
          handleUpdateProfil={handleUpdateProfil}
          profilLoading={profilLoading}
          nomorIndukSistem={profile?.nomor_induk}
        />
      )}
    </div>
  );
}
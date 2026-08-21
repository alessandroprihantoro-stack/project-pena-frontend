/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

// Import aset gambar
import bannerPena from '../../assets/banner_pena.png'; 
import logoJateng from '../../assets/logo_jateng.png';
import logoPena from '../../assets/logo_pena.png';

// Import komponen Showcase
import TabShowcase from '../pengawas/components/TabShowcase';

interface DetailBinaan {
  npsn: string;
  nama_sekolah: string;
  is_tuntas: boolean;
  // 🌟 INDIKATOR 3 PILAR KINERJA PENGAWAS
  is_profil: boolean;
  is_kurikulum: boolean;
  is_guru: boolean;
}

interface PengawasWilayah {
  id: string;
  nama_lengkap: string;
  nip_resmi: string;
  instansi: string;
  avatar_url: string;
  username_or_nip: string; 
  total_binaan: number;
  total_tuntas: number;
  persentase: number;
  rincian_binaan: DetailBinaan[];
}

type TabCabdin = 'RADAR_KINERJA' | 'SHOWCASE';

export default function DashboardCabdin() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabCabdin>('RADAR_KINERJA');

  const [listPengawas, setListPengawas] = useState<PengawasWilayah[]>([]);
  const [selectedPengawas, setSelectedPengawas] = useState<PengawasWilayah | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchPengawas, setSearchPengawas] = useState('');

  const [listPrestasi, setListPrestasi] = useState<any[]>([]);
  const [listPraktik, setListPraktik] = useState<any[]>([]);
  const [listSekolahMaster, setListSekolahMaster] = useState<any[]>([]);
  const [listTka, setListTka] = useState<any[]>([]);
  const [listReaksi, setListReaksi] = useState<any[]>([]);
  const [listKomentar, setListKomentar] = useState<any[]>([]);
  
  const [filterKategori, setFilterKategori] = useState<'SEMUA' | 'LOMBA' | 'LULUSAN' | 'TKA'>('SEMUA');
  const [pilihKategoriPrestasi, setPilihKategoriPrestasi] = useState("Semua");
  const [pilihJenisPrestasi, setPilihJenisPrestasi] = useState("Semua");
  
  const [tampilSemuaSekolah, setTampilSemuaSekolah] = useState(false);
  const [tampilSemuaInovasi, setTampilSemuaInovasi] = useState(false);

  const [modalKomentarKarya, setModalKomentarKarya] = useState<any | null>(null);
  const [teksKomentar, setTeksKomentar] = useState('');
  const [isSubmittingKomentar, setIsSubmittingKomentar] = useState(false);

  // 🌟 MESIN PENARIK DATA KINERJA WILAYAH (3 PILAR VALIDASI)
  const fetchSemuaDataCabdin = async () => {
    if (!profile?.id) return;
    setLoading(true);

    try {
      const myInstansi = String(profile.instansi || '').toLowerCase();
      const kataWilayah = myInstansi.match(/wilayah\s+[a-z0-9]+/i)?.[0] || myInstansi;

      // 1. Tarik Data Master Sekolah (Tahap 1)
      const { data: rawSekolah } = await supabase.from('master_sekolah').select('*');
      const sekolahMasterList = rawSekolah || [];

      // 2. Tarik Data Kurikulum (Tahap 2)
      const { data: rawKurikulum } = await supabase.from('master_kurikulum').select('npsn');
      const kurikulumList = rawKurikulum || [];

      // 3. Tarik Data Guru Riil (Tahap 3)
      const { data: rawGuru } = await supabase.from('guru_kelebihan').select('npsn, tugas_mengajar, jam_mengajar, total_jam, kecamatan');
      const guruList = rawGuru || [];

      // 4. Tarik Data Semua Binaan & Profil
      const { data: rawMasterUsers } = await supabase.from('master_users').select('username, sekolah_binaan').eq('role', 'pengawas');
      const masterUsersList = rawMasterUsers || [];

      const { data: rawProfs } = await supabase.from('profiles').select('*').eq('role', 'PENGAWAS');
      const pengawasWilayah = (rawProfs || []).filter(p => {
        const inst = String(p.instansi || '').toLowerCase();
        return !myInstansi || inst.includes(kataWilayah) || myInstansi.includes(inst);
      });

      // Validasi Fungsi untuk Cek Nilai Jam (agar angka 0 tetap dianggap sah)
      const isInputValid = (val: any) => val !== null && val !== undefined && String(val).trim() !== '';

      const pengawasWithKinerja: PengawasWilayah[] = pengawasWilayah.map(p => {
        const pUsername = String(p.nomor_induk || p.nip_resmi || p.email?.split('@')[0] || '').trim();
        const userMaster = masterUsersList.find(u => String(u.username).trim() === pUsername);
        
        let arrayNpsnBinaan: string[] = [];
        if (userMaster?.sekolah_binaan) {
            try {
                if (Array.isArray(userMaster.sekolah_binaan)) {
                    arrayNpsnBinaan = userMaster.sekolah_binaan.map(String);
                } else if (typeof userMaster.sekolah_binaan === 'string') {
                    if (userMaster.sekolah_binaan.startsWith('[')) {
                        arrayNpsnBinaan = JSON.parse(userMaster.sekolah_binaan).map(String);
                    } else {
                        arrayNpsnBinaan = userMaster.sekolah_binaan.split(',');
                    }
                }
            } catch (e) { console.warn("Parse binaan gagal untuk:", pUsername); }
        }

        const npsnBinaanBersih = arrayNpsnBinaan.map(n => n.toUpperCase().trim()).filter(Boolean);
        const totalBinaan = npsnBinaanBersih.length;
        
        let totalTuntas = 0;
        
        // 🌟 PROSES AUDIT 3 TAHAPAN UNTUK MASING-MASING NPSN
        const rincianBinaan: DetailBinaan[] = npsnBinaanBersih.map(npsn => {
            const matchSekolah = sekolahMasterList.find(s => String(s.npsn).toUpperCase().trim() === npsn);
            
            // Tahap 1: Cek Profil
            const isProfilTuntas = !!matchSekolah;
            
            // Tahap 2: Cek Struktur Kurikulum
            const isKurikulumTuntas = kurikulumList.some(k => String(k.npsn).toUpperCase().trim() === npsn);
            
            // Tahap 3: Cek Guru Riil berserta 4 data wajib
            const guruSekolahIni = guruList.filter(g => String(g.npsn).toUpperCase().trim() === npsn);
            const isGuruTuntas = guruSekolahIni.length > 0 && guruSekolahIni.every(g => {
                const mapelUtama = String(g.tugas_mengajar || '').trim();
                const kec = String(g.kecamatan || '').trim();
                return mapelUtama !== '' && kec !== '' && isInputValid(g.jam_mengajar) && isInputValid(g.total_jam);
            });

            // Status Final
            const isTuntas = isProfilTuntas && isKurikulumTuntas && isGuruTuntas;
            if (isTuntas) totalTuntas++;
            
            return {
                npsn: npsn,
                nama_sekolah: matchSekolah ? matchSekolah.nama_sekolah : `NPSN: ${npsn} (Belum Terdaftar)`,
                is_tuntas: isTuntas,
                is_profil: isProfilTuntas,
                is_kurikulum: isKurikulumTuntas,
                is_guru: isGuruTuntas
            };
        });

        const persentase = totalBinaan === 0 ? 0 : Math.round((totalTuntas / totalBinaan) * 100);

        return {
          id: p.id,
          nama_lengkap: p.nama_lengkap || 'Pengawas Wilayah',
          nip_resmi: p.nip_resmi || p.nomor_induk || '-',
          instansi: p.instansi || 'Cabang Dinas Pendidikan',
          avatar_url: p.avatar_url || '',
          username_or_nip: pUsername,
          total_binaan: totalBinaan,
          total_tuntas: totalTuntas,
          persentase: persentase,
          rincian_binaan: rincianBinaan
        };
      });

      setListPengawas(pengawasWithKinerja.sort((a, b) => a.persentase - b.persentase));

      // --- SISA LOGIKA SHOWCASE (TETAP SAMA) ---
      const { data: rawSekolahWilayah } = await supabase.from('sekolah').select('*');
      const sekolahWilayah = (rawSekolahWilayah || []).filter(s => {
        const cb = String(s.cabang_dinas || '').toLowerCase();
        return !myInstansi || cb.includes(kataWilayah) || myInstansi.includes(cb);
      });
      setListSekolahMaster(sekolahWilayah);

      const { data: rawTka } = await supabase.from('tka_sekolah').select('*');
      setListTka(rawTka || []);

      const { data: rawPres } = await supabase.from('prestasi').select('*').order('created_at', { ascending: false });
      setListPrestasi((rawPres || []).map(pr => ({
        ...pr,
        status_validasi: (pr.status_validasi || pr.status || 'MENUNGGU').toUpperCase(),
        nama_sekolah: sekolahWilayah.find(s => s.id === pr.sekolah_id || s.npsn === pr.npsn)?.nama_sekolah || `Sekolah (${pr.npsn || '-'})`
      })));

      const { data: rawPrak } = await supabase.from('praktik_baik').select('*').order('created_at', { ascending: false });
      setListPraktik((rawPrak || []).map(pb => ({
        id: pb.id, user_id: pb.user_id || '', sekolah_id: pb.sekolah_id || '', judul: pb.judul || pb.nama_karya || 'Inovasi Tanpa Judul', deskripsi: pb.deskripsi || pb.isi || 'Tidak ada deskripsi', jenis_media: (pb.jenis_media || pb.tipe || 'DOKUMEN').toUpperCase(), media_url: pb.media_url || pb.file_pendukung || pb.link_drive || '', status_validasi: (pb.status_validasi || pb.status || 'MENUNGGU').toUpperCase(), created_at: pb.created_at || new Date().toISOString(), nama_sekolah: sekolahWilayah.find(s => s.id === pb.sekolah_id || s.npsn === pb.npsn)?.nama_sekolah || `Sekolah (${pb.npsn || '-'})`, npsn: pb.npsn || ''
      })));

      const { data: rx } = await supabase.from('praktik_baik_reaksi').select('*');
      setListReaksi(rx || []);
      
      const { data: km } = await supabase.from('praktik_baik_komentar').select('*, profiles(nama_lengkap, avatar_url)').order('created_at', { ascending: true });
      setListKomentar(km || []);

    } catch (err: any) {
      console.error("Gagal menarik data Cabdin:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSemuaDataCabdin(); }, [profile]);

  const handleReaksi = async (karyaId: string, jenis: 'LIKE' | 'DISLIKE') => {
    if (!profile?.id) { alert("❌ Anda harus masuk untuk memberikan apresiasi!"); return; }
    try {
      const existing = listReaksi.find(r => r.praktik_baik_id === karyaId && r.user_id === profile.id);
      if (existing) {
        if (existing.jenis === jenis) await supabase.from('praktik_baik_reaksi').delete().eq('id', existing.id);
        else await supabase.from('praktik_baik_reaksi').update({ jenis }).eq('id', existing.id);
      } else await supabase.from('praktik_baik_reaksi').insert([{ praktik_baik_id: karyaId, user_id: profile.id, jenis }]);
      fetchSemuaDataCabdin();
    } catch (err: any) { console.error("Gagal memproses reaksi:", err.message); }
  };

  const handleKirimKomentar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id || !modalKomentarKarya || !teksKomentar.trim()) return;
    setIsSubmittingKomentar(true);
    try {
      const { error } = await supabase.from('praktik_baik_komentar').insert([{ praktik_baik_id: modalKomentarKarya.id, user_id: profile.id, komentar: teksKomentar.trim(), isi_komentar: teksKomentar.trim() }]);
      if (error) throw error;
      setTeksKomentar(''); fetchSemuaDataCabdin();
    } catch (err: any) { alert("❌ Gagal mengirim komentar:\n" + err.message); } finally { setIsSubmittingKomentar(false); }
  };

  const pengawasTerfilter = listPengawas.filter(p => 
    p.nama_lengkap.toLowerCase().includes(searchPengawas.toLowerCase()) ||
    p.nip_resmi.toLowerCase().includes(searchPengawas.toLowerCase())
  );

  const praktikDisetujui = listPraktik.filter(p => p.status_validasi === 'DISETUJUI');
  let prestasiTerfilter = listPrestasi.filter(p => p.status_validasi === 'DISETUJUI');

  if (filterKategori === 'LOMBA') {
      prestasiTerfilter = prestasiTerfilter.filter(pr => { 
        const val = String(pr.jalur || pr.kategori || pr.jenis_prestasi || pr.jenis || '').toUpperCase(); 
        return val.includes('LOMBA') || ['OSN', 'O2SN', 'FLS3N', 'KOSN', 'LDI', 'FIKSI', 'OPSI', 'POPDA', 'POPPROV', 'POPNAS', 'GSI', 'NSDC', 'LDBI', 'KSM', 'MTQ'].some(k => val.includes(k)); 
      });
  } else if (filterKategori === 'LULUSAN') {
      prestasiTerfilter = prestasiTerfilter.filter(pr => { const val = String(pr.jalur || pr.kategori || pr.jenis_prestasi || pr.jenis || '').toUpperCase(); return val.includes('LULUSAN') || val.includes('KELULUSAN') || ['SNBP', 'SNBT', 'MANDIRI', 'KEDINASAN'].includes(val); });
  } else if (filterKategori === 'TKA') {
      prestasiTerfilter = prestasiTerfilter.filter(pr => { const val = String(pr.jalur || pr.kategori || pr.jenis_prestasi || pr.jenis || pr.nama_prestasi || '').toUpperCase(); return val.includes('TKA') || val.includes('AKADEMIK') || val.includes('NILAI'); });
  }

  if ((filterKategori === 'SEMUA' || filterKategori === 'LOMBA') && pilihKategoriPrestasi !== "Semua") {
      const keywordKategori = pilihKategoriPrestasi.toLowerCase().trim();
      prestasiTerfilter = prestasiTerfilter.filter(pr => {
          const val = String(pr.kategori_prestasi || pr.kategori_lomba || pr.kategori || pr.jalur || pr.bidang || pr.jenis_prestasi || pr.jenis || pr.nama_kegiatan || pr.nama_prestasi || '').toLowerCase();
          const mapOlahraga = ['popda', 'o2sn', 'popnas', 'popprov', 'gsi', 'silat', 'taekwondo', 'atletik', 'renang', 'karate', 'volly', 'basket'];
          const mapSeni = ['fls3n', 'seni', 'musik', 'tari', 'aktris', 'teater', 'vokal'];
          const mapAkademik = ['osn', 'opsi', 'ksm', 'olimpiade', 'karya tulis', 'akademik'];
          let isMatch = val.includes(keywordKategori);
          if (keywordKategori === 'olahraga' && mapOlahraga.some(m => val.includes(m))) isMatch = true;
          if (keywordKategori === 'seni' && mapSeni.some(m => val.includes(m))) isMatch = true;
          if (keywordKategori === 'akademik' && mapAkademik.some(m => val.includes(m))) isMatch = true;
          return isMatch;
      });
  }

  if ((filterKategori === 'SEMUA' || filterKategori === 'LOMBA') && pilihJenisPrestasi !== "Semua") {
      const keywordJenis = pilihJenisPrestasi.toLowerCase().trim();
      prestasiTerfilter = prestasiTerfilter.filter(pr => {
          const val = String(pr.jenis_prestasi || pr.nama_prestasi || pr.nama_lomba || pr.jenis || pr.nama_kegiatan || pr.jalur || '').toLowerCase();
          return val.includes(keywordJenis);
      });
  }

  const mapKlasemen = listSekolahMaster.reduce((acc, sek) => {
    const safeNpsn = String(sek.npsn || '').trim();
    if (safeNpsn && safeNpsn !== '-') {
      const tkaRow = listTka.find(t => String(t.npsn).trim() === safeNpsn || String(t.user_id).trim() === sek.id);
      const scoreTka = tkaRow ? Number(tkaRow.rata_rata_total) : 0;
      acc[safeNpsn] = { nama: sek.nama_sekolah || `Sekolah (${safeNpsn})`, npsn: safeNpsn, kepala: sek.nama_kepala_sekolah || 'Belum diatur', logo: sek.logo_url || null, trofi: 0, pts: filterKategori === 'SEMUA' ? scoreTka : 0, tka_score: scoreTka };
    }
    return acc;
  }, {} as Record<string, any>);

  prestasiTerfilter.forEach(curr => {
    const npsn = String(curr.npsn || '').trim();
    if (npsn && mapKlasemen[npsn]) {
      mapKlasemen[npsn].trofi += 1;
      mapKlasemen[npsn].pts = Number((mapKlasemen[npsn].pts + (Number(curr.poin) || 0)).toFixed(2));
    }
  });

  const sortedKlasemen = Object.values(mapKlasemen).sort((a: any, b: any) => b.pts - a.pts || b.trofi - a.trofi);
  const inovasiTerurut = [...praktikDisetujui].sort((a, b) => {
    const likesA = listReaksi.filter(r => r.praktik_baik_id === a.id && r.jenis === 'LIKE').length;
    const likesB = listReaksi.filter(r => r.praktik_baik_id === b.id && r.jenis === 'LIKE').length;
    return likesB - likesA;
  });
  const inovasiDitampilkan = tampilSemuaInovasi ? inovasiTerurut : inovasiTerurut.slice(0, 3);

  const renderKaryaCardCabdin = (karya: any) => {
    const cardReaksi = listReaksi.filter(r => r.praktik_baik_id === karya.id);
    const likesCount = cardReaksi.filter(r => r.jenis === 'LIKE').length;
    const dislikesCount = cardReaksi.filter(r => r.jenis === 'DISLIKE').length;
    const cardKomentar = listKomentar.filter(k => k.praktik_baik_id === karya.id);
    const myReaksi = cardReaksi.find(r => r.user_id === profile?.id)?.jenis;

    const isImageUrl = karya.media_url && (
      karya.media_url.match(/\.(jpeg|jpg|gif|png|webp)$/i) || 
      karya.media_url.includes('googleusercontent') || 
      karya.media_url.includes('drive.google.com')
    );

    return (
      <div key={karya.id} className="bg-white border-2 border-black shadow-neo dark:bg-slate-900/90 dark:border-slate-800 dark:shadow-xl rounded-3xl p-6 flex flex-col justify-between hover:border-emerald-500/50 transition-all duration-300">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 uppercase tracking-wider">
              💡 INOVASI WILAYAH
            </span>
            <span className="text-xs font-bold text-slate-400 truncate max-w-45">{karya.nama_sekolah}</span>
          </div>
          <h3 className="font-black text-lg text-white leading-snug group-hover:text-emerald-300 transition-colors">{karya.judul}</h3>
          <p className="text-xs text-slate-300 leading-relaxed italic line-clamp-3">"{karya.deskripsi}"</p>
        </div>

        {karya.media_url && (
          <div className="mt-4 relative h-44 rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-950 shadow-md group/img">
            {isImageUrl ? (
              <img src={karya.media_url} alt={karya.judul} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-2 bg-slate-900">
                <span className="text-3xl">📁</span><span>Dokumen / Arsip Karya</span>
              </div>
            )}
            <a href={karya.media_url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-xs font-mono font-bold text-cyan-300 transition-opacity gap-1.5">
              <span>↗</span> Buka Media Penuh
            </a>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-800 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => handleReaksi(karya.id, 'LIKE')} className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all cursor-pointer active:scale-95 ${myReaksi === 'LIKE' ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20' : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'}`}>
              <span>👍</span> <span>{likesCount}</span>
            </button>
            <button type="button" onClick={() => handleReaksi(karya.id, 'DISLIKE')} className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 font-bold transition-all cursor-pointer active:scale-95 ${myReaksi === 'DISLIKE' ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-500/20' : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'}`}>
              <span>👎</span> <span>{dislikesCount}</span>
            </button>
          </div>
          <button type="button" onClick={() => setModalKomentarKarya(karya)} className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95">
            <span>💬</span> <span>{cardKomentar.length} Diskusi</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in text-black dark:text-slate-100 font-sans pb-16 select-none max-w-7xl mx-auto px-4 transition-colors duration-300 relative">
      
      {/* MODUL MODAL RUANG DISKUSI KOMENTAR */}
      {modalKomentarKarya && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#061030] border-2 border-cyan-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col max-h-[85vh] space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
              <div>
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">Ruang Diskusi Inovasi</span>
                <h3 className="text-base font-black text-white truncate max-w-75 sm:max-w-95 mt-0.5">{modalKomentarKarya.judul}</h3>
              </div>
              <button onClick={() => setModalKomentarKarya(null)} className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold transition-colors cursor-pointer shrink-0">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar min-h-55 max-h-95">
              {listKomentar.filter(k => k.praktik_baik_id === modalKomentarKarya.id).length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 font-mono text-xs py-12 space-y-2">
                  <span className="text-3xl">💬</span><p>Belum ada ulasan/diskusi pada karya inovasi ini.<br/>Jadilah yang pertama memberikan apresiasi!</p>
                </div>
              ) : (
                listKomentar.filter(k => k.praktik_baik_id === modalKomentarKarya.id).map(com => (
                  <div key={com.id} className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {com.profiles?.avatar_url ? (
                          <img src={com.profiles.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover border border-cyan-400/50" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-[10px] font-bold text-white font-mono">{com.profiles?.nama_lengkap?.charAt(0) || 'U'}</div>
                        )}
                        <span className="text-xs font-bold text-cyan-300">{com.profiles?.nama_lengkap || 'Pengguna PENA'}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">{new Date(com.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-slate-200 font-sans pl-8 leading-relaxed">{com.komentar || com.isi_komentar || '-'}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleKirimKomentar} className="pt-3 border-t border-slate-800 flex gap-2 shrink-0">
              <input type="text" placeholder="Tulis ulasan pembinaan / apresiasi..." value={teksKomentar} onChange={(e) => setTeksKomentar(e.target.value)} disabled={isSubmittingKomentar} className="flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-xl px-4 py-3 text-white font-sans text-xs outline-none transition-colors" />
              <button type="submit" disabled={isSubmittingKomentar || !teksKomentar.trim()} className="px-5 py-3 bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs font-black rounded-xl transition-all cursor-pointer disabled:opacity-50 shrink-0 flex items-center gap-1 shadow-md shadow-cyan-500/20">{isSubmittingKomentar ? "⏳" : "↗ Kirim"}</button>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 HEADER DASBOR EKSEKUTIF CABANG DINAS 🌟 */}
      <div className="relative rounded-3xl overflow-hidden shadow-neo mb-6 border-4 border-black dark:border-2 dark:border-slate-800 dark:shadow-2xl w-full flex flex-col justify-end min-h-75 sm:min-h-90">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src={bannerPena} alt="Banner PENA" className="w-full h-full object-cover object-center scale-105" />
          <div className="absolute inset-0 bg-linear-to-b from-slate-950/80 via-slate-900/60 to-slate-950/90" />
        </div>
        
        <div className="absolute top-4 right-4 z-10 px-4 py-2 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-white/90 border-2 border-black text-black shadow-neo-sm dark:bg-slate-900/90 dark:border-emerald-500/30 dark:text-emerald-400 dark:shadow-none">
          OTORITAS EKSEKUTIF: CABANG DINAS
        </div>

        <div className="relative z-10 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mt-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-2xl border border-slate-700/80 backdrop-blur-md shadow-xl shrink-0 w-fit">
              <img src={logoJateng} alt="Jateng" className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-lg" />
              <div className="w-px h-8 bg-slate-700" />
              <img src={logoPena} alt="PENA" className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-4xl font-black text-white drop-shadow-md tracking-tight">Pusat Kendali Wilayah VI</h1>
              <p className="text-xs sm:text-sm font-mono mt-1 font-bold text-emerald-400 drop-shadow-md bg-slate-950/50 px-3 py-1 rounded-lg border border-emerald-500/20 w-fit">
                📍 {profile?.instansi || "Disdik Prov. Jawa Tengah"}
              </p>
            </div>
          </div>

          <button onClick={fetchSemuaDataCabdin} className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono text-xs font-black rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0">
            <span>🔄</span> Segarkan Data
          </button>
        </div>
      </div>

      {/* NAVIGASI TAB CABANG DINAS */}
      <div className="flex gap-2 p-2 rounded-2xl overflow-x-auto font-mono text-xs transition-all bg-white border-4 border-black shadow-neo dark:bg-slate-900/80 dark:border-2 dark:border-slate-800 dark:shadow-none">
        <button 
          onClick={() => { setActiveTab('RADAR_KINERJA'); setSelectedPengawas(null); }} 
          className={`flex-1 min-w-50 py-3.5 px-4 rounded-xl font-black transition-all cursor-pointer flex items-center justify-center gap-2 border-2 ${activeTab === 'RADAR_KINERJA' ? 'bg-emerald-400 text-black border-black shadow-neo-md -translate-y-1 dark:bg-emerald-600 dark:text-white dark:border-transparent dark:shadow-lg dark:shadow-emerald-600/30 dark:translate-y-0' : 'bg-transparent border-transparent text-slate-600 hover:text-black hover:border-black/20 dark:text-slate-400 dark:hover:text-white dark:hover:border-transparent'}`}
        >
          <span>🕵️</span> Radar Kinerja Pengawas ({listPengawas.length})
        </button>

        <button 
          onClick={() => setActiveTab('SHOWCASE')} 
          className={`flex-1 min-w-50 py-3.5 px-4 rounded-xl font-black transition-all cursor-pointer flex items-center justify-center gap-2 border-2 ${activeTab === 'SHOWCASE' ? 'bg-emerald-400 text-black border-black shadow-neo-md -translate-y-1 dark:bg-emerald-600 dark:text-white dark:border-transparent dark:shadow-lg dark:shadow-emerald-600/30 dark:translate-y-0' : 'bg-transparent border-transparent text-slate-600 hover:text-black hover:border-black/20 dark:text-slate-400 dark:hover:text-white dark:hover:border-transparent'}`}
        >
          <span>🏆</span> Papan Prestasi & Mantap Share
        </button>
      </div>

      {/* TAB 1: RADAR KINERJA PENGAWAS */}
      {activeTab === 'RADAR_KINERJA' && (
        <div className="space-y-6 animate-fade-in">
          {loading ? (
            <div className="bg-slate-900/80 border-2 border-slate-800 rounded-3xl p-16 text-center text-slate-400 font-mono space-y-3 shadow-xl">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-400 mx-auto"></div>
              <p className="text-xs">Memindai satelit kinerja pengawas wilayah...</p>
            </div>
          ) : selectedPengawas === null ? (
            <div className="bg-slate-900/80 border-2 border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-black font-mono text-white flex items-center gap-2">
                    <span>🕵️</span> RADAR KINERJA PENGINPUTAN DATA
                  </h3>
                  <p className="text-xs text-slate-400 font-sans mt-1">
                    Pemantauan *real-time* kepatuhan Pengawas dalam mengawal input data Pusat Manajemen Pendidik (Pemetaan & Buku Induk).
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Cari nama pengawas / NIP..."
                  value={searchPengawas}
                  onChange={e => setSearchPengawas(e.target.value)}
                  className="w-full sm:w-64 bg-slate-950 border border-slate-700 focus:border-emerald-400 rounded-xl p-3 text-white font-mono text-xs outline-none transition-colors shadow-inner"
                />
              </div>

              {pengawasTerfilter.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-500 font-mono bg-slate-950/40 rounded-2xl border border-slate-800">
                  📭 Belum ada akun pengawas terdaftar di wilayah ini.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {pengawasTerfilter.map(pgw => (
                    <div 
                      key={pgw.id}
                      className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative overflow-hidden"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        {pgw.avatar_url ? (
                          <img src={pgw.avatar_url} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-700 shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-2xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center font-mono font-black text-xl text-slate-500 shrink-0">
                            {pgw.nama_lengkap.charAt(0)}
                          </div>
                        )}
                        <div className="overflow-hidden space-y-1 w-full">
                          <div className="flex justify-between items-start">
                            <h4 className="font-black text-sm text-white truncate leading-snug uppercase max-w-40">{pgw.nama_lengkap}</h4>
                            <span className="text-[10px] font-mono font-bold bg-slate-900 px-2 py-1 rounded text-emerald-400 border border-slate-800">
                              {pgw.total_tuntas} / {pgw.total_binaan} Tuntas
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 🌟 PROGRESS BAR KINERJA 🌟 */}
                      <div className="space-y-1.5 mb-5 mt-1">
                        <div className="w-full bg-slate-900 rounded-full h-2 border border-slate-800 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                              pgw.persentase === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 
                              pgw.persentase >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`} 
                            style={{ width: `${pgw.persentase}%` }} 
                          />
                        </div>
                        <div className="flex justify-end">
                          <span className={`text-[9px] font-bold font-mono ${pgw.persentase === 100 ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {pgw.persentase}% Selesai
                          </span>
                        </div>
                      </div>

                      <button 
                        onClick={() => setSelectedPengawas(pgw)}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                      >
                        Lihat Rincian Binaan ⬇️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-900/90 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSelectedPengawas(null)}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow"
                  >
                    ⬅️ Kembali
                  </button>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2 leading-snug">
                      <span>🕵️</span> Rincian Binaan: <span className="text-emerald-400 underline uppercase">{selectedPengawas.nama_lengkap}</span>
                    </h3>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      Progress Pengawalan: <span className="font-bold text-white">{selectedPengawas.persentase}%</span> ({selectedPengawas.total_tuntas} dari {selectedPengawas.total_binaan} Institusi)
                    </p>
                  </div>
                </div>
              </div>

              {selectedPengawas.rincian_binaan.length === 0 ? (
                <div className="p-16 text-center text-xs text-slate-500 font-mono bg-slate-950/60 rounded-2xl border border-slate-800">
                  📭 Pengawas ini belum mendaftarkan satupun Sekolah Binaan.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-162.5 rounded-2xl border border-slate-800 bg-slate-950/90 shadow-2xl custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-[#061030] text-[10px] font-mono font-black uppercase tracking-wider text-emerald-400 sticky top-0 z-10 shadow-sm">
                        <th className="py-3.5 px-4 border-r border-slate-800/80 w-24 text-center">NPSN</th>
                        <th className="py-3.5 px-4 border-r border-slate-800/80 min-w-50">Nama Institusi Pendidikan</th>
                        {/* 🌟 3 KOLOM BARU UNTUK PILAR VALIDASI */}
                        <th className="py-3.5 px-2 border-r border-slate-800/80 w-20 text-center">1. Profil</th>
                        <th className="py-3.5 px-2 border-r border-slate-800/80 w-24 text-center">2. Kurikulum</th>
                        <th className="py-3.5 px-2 border-r border-slate-800/80 w-28 text-center">3. Guru Riil</th>
                        <th className="py-3.5 px-4 text-center w-36">Status Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 text-[11px] text-slate-200 font-sans">
                      {selectedPengawas.rincian_binaan.map((sek, idx) => (
                        <tr key={idx} className="hover:bg-slate-900 transition-colors">
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-400 border-r border-slate-800/80 align-middle">
                            {sek.npsn}
                          </td>
                          <td className="py-3 px-4 font-bold text-white border-r border-slate-800/80 align-middle truncate max-w-50" title={sek.nama_sekolah}>
                            {sek.nama_sekolah}
                          </td>
                          
                          {/* INDIKATOR TAHAP 1 */}
                          <td className="py-3 px-2 text-center border-r border-slate-800/80 align-middle">
                            {sek.is_profil ? <span title="Profil Sudah Tersimpan">✅</span> : <span title="Belum Input Profil">❌</span>}
                          </td>
                          {/* INDIKATOR TAHAP 2 */}
                          <td className="py-3 px-2 text-center border-r border-slate-800/80 align-middle">
                            {sek.is_kurikulum ? <span title="Struktur Kurikulum Sudah Diinput">✅</span> : <span title="Belum Input Kurikulum">❌</span>}
                          </td>
                          {/* INDIKATOR TAHAP 3 */}
                          <td className="py-3 px-2 text-center border-r border-slate-800/80 align-middle">
                            {sek.is_guru ? <span title="Data Guru Riil Valid">✅</span> : <span title="Data Guru Kosong/Tidak Valid">❌</span>}
                          </td>

                          {/* STATUS FINAL */}
                          <td className="py-3 px-4 text-center align-middle">
                            {sek.is_tuntas ? (
                              <span className="inline-block px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[9px] font-bold w-full">
                                TUNTAS
                              </span>
                            ) : (
                              <span className="inline-block px-3 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 font-mono text-[9px] font-bold w-full">
                                BELUM
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SHOWCASE */}
      {activeTab === 'SHOWCASE' && (
        <TabShowcase 
          filterKategori={filterKategori} setFilterKategori={setFilterKategori}
          pilihKategoriPrestasi={pilihKategoriPrestasi} setPilihKategoriPrestasi={setPilihKategoriPrestasi}
          pilihJenisPrestasi={pilihJenisPrestasi} setPilihJenisPrestasi={setPilihJenisPrestasi}
          papanDataUtuh={sortedKlasemen} 
          tampilSemuaSekolah={tampilSemuaSekolah} setTampilSemuaSekolah={setTampilSemuaSekolah}
          inovasiDitampilkan={inovasiDitampilkan} inovasiTotal={inovasiTerurut.length}
          tampilSemuaInovasi={tampilSemuaInovasi} setTampilSemuaInovasi={setTampilSemuaInovasi}
          renderKaryaPengawasCard={renderKaryaCardCabdin}
        />
      )}

    </div>
  );
}
/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

import logoPena from '../../assets/logo_pena.png';
import bannerPena from '../../assets/banner_pena.png';

const MASTER_WILAYAH: { [key: string]: string[] } = {
  "Cabang Dinas Wilayah I": ["Kabupaten Semarang", "Kota Salatiga", "Kabupaten Demak"],
  "Cabang Dinas Wilayah II": ["Kota Semarang", "Kabupaten Kendal"],
  "Cabang Dinas Wilayah III": ["Kabupaten Jepara", "Kabupaten Pati", "Kabupaten Kudus"],
  "Cabang Dinas Wilayah IV": ["Kabupaten Grobogan", "Kabupaten Blora", "Kabupaten Rembang"],
  "Cabang Dinas Wilayah V": ["Kabupaten Boyolali", "Kabupaten Klaten"],
  "Cabang Dinas Wilayah VI": ["Kabupaten Wonogiri", "Kabupaten Karanganyar", "Kabupaten Sragen"],
  "Cabang Dinas Wilayah VII": ["Kota Surakarta", "Kabupaten Sukoharjo"],
  "Cabang Dinas Wilayah VIII": ["Kota Magelang", "Kabupaten Magelang", "Kabupaten Temanggung"],
  "Cabang Dinas Wilayah IX": ["Kabupaten Wonosobo", "Kabupaten Banjarnegara", "Kabupaten Kebumen", "Kabupaten Purworejo"],
  "Cabang Dinas Wilayah X": ["Kabupaten Cilacap", "Kabupaten Purbalingga", "Kabupaten Banyumas"],
  "Cabang Dinas Wilayah XI": ["Kabupaten Brebes", "Kabupaten Tegal", "Kota Tegal"],
  "Cabang Dinas Wilayah XII": ["Kabupaten Pemalang", "Kabupaten Pekalongan", "Kabupaten Batang", "Kota Pekalongan"],
};

interface PraktikBaikPublik {
  id: string; judul?: string; penulis?: string; sekolah?: string; kabupaten?: string; cabdin?: string; deskripsi?: string; likes?: number; jumlah_like?: number; kategori?: string; created_at?: string; foto_url?: string; gambar_url?: string; url_foto?: string; video_url?: string; url_video?: string; media_url?: string; tautan?: string;
  sekolah_id?: string; user_id?: string; npsn?: string;
}

interface SekolahPeringkat {
  id: string;
  nama_sekolah: string;
  npsn: string;
  kabupaten?: string;
  cabdin?: string;
  nama_kepala_sekolah?: string;
  logo_url?: string;
  trofi: number;
  poin_total: number;
  skor_lomba: number;
  skor_lulusan: number;
  skor_tka: number;
}

const SmartMediaRenderer = ({ url, title }: { url?: string; title?: string }) => {
  const [imgError, setImgError] = useState(false);
  if (!url || imgError) {
    return (
      <div className="w-full h-full bg-linear-to-br from-slate-900 via-indigo-950/40 to-slate-950 flex flex-col items-center justify-center p-4 text-center">
        <span className="text-3xl mb-1 opacity-60">💡</span>
        <span className="text-[11px] font-mono text-slate-400 font-bold tracking-wider uppercase">Inovasi Praktik Baik PENA</span>
      </div>
    );
  }
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let embedUrl = url;
    if (url.includes('watch?v=')) embedUrl = url.replace('watch?v=', 'embed/');
    else if (url.includes('youtu.be/')) embedUrl = `https://www.youtube.com/embed/${url.split('youtu.be/')[1]?.split('?')[0]}`;
    return <iframe src={embedUrl} title={title || "Video Karya PENA"} className="w-full h-full object-cover border-0" allowFullScreen />;
  }
  const isVideoFormat = /\.(mp4|webm|ogg|mov)$/i.test(url) || url.toLowerCase().includes('/video/') || url.toLowerCase().includes('mp4');
  if (isVideoFormat) return <video src={url} controls className="w-full h-full object-cover bg-black" preload="metadata">Video tidak didukung.</video>;
  
  return <img src={url} alt={title || "Foto Karya"} onError={() => setImgError(true)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />;
};

export default function EtalasePublik() {
  const [activeTab, setActiveTab] = useState<'PERINGKAT' | 'KARYA'>('PERINGKAT');
  const [loading, setLoading] = useState(true);

  const [filterCabdin, setFilterCabdin] = useState<string>('SEMUA');
  const [filterKabupaten, setFilterKabupaten] = useState<string>('SEMUA');
  const [filterPrestasi, setFilterPrestasi] = useState<'SEMUA' | 'LOMBA' | 'LULUSAN' | 'TKA'>('SEMUA');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [filterKategoriKarya, setFilterKategoriKarya] = useState<'SEMUA' | 'SMA MANTAP' | 'BRANDING SEKOLAH' | 'PROYEK SISWA' | 'PRAKTIK BAIK'>('SEMUA');

  const [listKarya, setListKarya] = useState<PraktikBaikPublik[]>([]);
  const [listPeringkat, setListPeringkat] = useState<SekolahPeringkat[]>([]);
  const [likedItems, setLikedItems] = useState<{ [key: string]: boolean }>({});

  const handleCabdinChange = (cabdin: string) => {
    setFilterCabdin(cabdin);
    setFilterKabupaten('SEMUA');
  };

  const fetchPublicData = async () => {
    setLoading(true);
    try {
      const [resKarya, resSekolah, resTka, resPrestasi] = await Promise.all([
        supabase.from('praktik_baik').select('*').eq('status_validasi', 'DISETUJUI').order('created_at', { ascending: false }),
        supabase.from('sekolah').select('*'),
        supabase.from('tka_sekolah').select('*'),
        supabase.from('prestasi').select('*').eq('status_validasi', 'DISETUJUI')
      ]);

      const rawSekolah = resSekolah.data || [];
      const rawTka = resTka.data || [];
      const rawPrestasi = resPrestasi.data || [];
      const rawKarya = resKarya.data || [];

      const sekolahReal = rawSekolah.map(s => {
        const npsn = String(s.npsn || '').trim();
        const id = String(s.id || '').trim();

        const tkaRow = rawTka.find(t => String(t.npsn).trim() === npsn || String(t.user_id).trim() === id);
        const tka_score = tkaRow ? Number(tkaRow.rata_rata_total || 0) : 0;

        const prestasiSekolah = rawPrestasi.filter(p => String(p.npsn).trim() === npsn || String(p.sekolah_id).trim() === id || String(p.user_id).trim() === id);
        
        let skor_lomba = 0, skor_lulusan = 0, total_poin_prestasi = 0;
        const trofi = prestasiSekolah.length;

        prestasiSekolah.forEach(pr => {
          const poin = Number(pr.poin) || 0;
          total_poin_prestasi += poin;
          const val = String(pr.jalur || pr.jenis_prestasi || '').toUpperCase();
          if (val.includes('LOMBA') || ['OSN', 'O2SN', 'FLS3N', 'KOSN', 'LDI', 'FIKSI', 'OPSI'].includes(val)) skor_lomba += poin;
          else if (val.includes('LULUSAN') || val.includes('KELULUSAN') || ['SNBP', 'SNBT', 'MANDIRI', 'KEDINASAN'].includes(val)) skor_lulusan += poin;
        });

        return {
          id: s.id || npsn,
          nama_sekolah: s.nama_sekolah || s.nama || `Sekolah NPSN ${npsn}`,
          npsn: npsn || '-',
          kabupaten: s.kabupaten || s.kota || 'Kabupaten Karanganyar',
          cabdin: s.cabdin || s.cabang_dinas || 'Cabang Dinas Wilayah VI',
          nama_kepala_sekolah: s.nama_kepala_sekolah || s.kepsek || 'Belum diatur',
          logo_url: s.logo_url || s.logo || null,
          trofi: trofi,
          skor_lomba: Number(skor_lomba.toFixed(2)),
          skor_lulusan: Number(skor_lulusan.toFixed(2)),
          skor_tka: Number(tka_score.toFixed(2)),
          poin_total: Number((total_poin_prestasi + tka_score).toFixed(2))
        };
      });

      setListPeringkat(sekolahReal);

      const karyaDenganSekolah = rawKarya.map((karya: any) => {
        const matchSekolah = rawSekolah.find(s => String(s.id) === String(karya.sekolah_id) || String(s.id) === String(karya.user_id) || String(s.npsn) === String(karya.npsn));
        return {
          ...karya,
          sekolah: karya.nama_sekolah || matchSekolah?.nama_sekolah || 'Satuan Pendidikan',
          cabdin: karya.cabdin || matchSekolah?.cabang_dinas || matchSekolah?.cabdin || 'Wilayah Jawa Tengah',
          kabupaten: karya.kabupaten || matchSekolah?.kabupaten_kota || matchSekolah?.kabupaten || 'Provinsi Jawa Tengah'
        };
      });

      setListKarya(karyaDenganSekolah);

    } catch (err) {
      console.error("Gagal memuat data publik real:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicData();
    const savedLikes = localStorage.getItem('PENA_PUBLIC_LIKES');
    if (savedLikes) setLikedItems(JSON.parse(savedLikes));
  }, []);

  const handleLike = async (id: string, currentLikesRaw?: number) => {
    if (likedItems[id]) { alert("❤️ Terima kasih! Anda sudah memberikan apresiasi untuk karya ini."); return; }
    const nextLikes = (Number(currentLikesRaw) || 0) + 1;
    setListKarya(prev => prev.map(item => item.id === id ? { ...item, likes: nextLikes, jumlah_like: nextLikes } : item));
    const newLiked = { ...likedItems, [id]: true };
    setLikedItems(newLiked);
    localStorage.setItem('PENA_PUBLIC_LIKES', JSON.stringify(newLiked));
    try { await supabase.from('praktik_baik').update({ likes: nextLikes }).eq('id', id); } 
    catch (e) { try { await supabase.from('praktik_baik').update({ jumlah_like: nextLikes }).eq('id', id); } catch (err2) {} }
  };

  const handleShare = (item: PraktikBaikPublik) => {
    const shareText = `🌟 *${item.judul || "Karya Praktik Baik"}* 🌟\nOleh: ${item.penulis || "Guru"} (${item.sekolah || "Sekolah"})\n\nLihat selengkapnya di Platform PENA:`;
    const shareUrl = window.location.origin + '/publik';
    if (navigator.share) navigator.share({ title: item.judul, text: shareText, url: shareUrl }).catch(() => {});
    else { navigator.clipboard.writeText(`${shareText}\n${shareUrl}`); alert("📋 Tautan disalin!"); }
  };

  const filteredPeringkat = listPeringkat
    .filter(item => {
      const matchCabdin = filterCabdin === 'SEMUA' || (item.cabdin && item.cabdin.includes(filterCabdin.replace("Cabang Dinas ", "")));
      const matchKab = filterKabupaten === 'SEMUA' || (item.kabupaten && item.kabupaten.toLowerCase().includes(filterKabupaten.toLowerCase()));
      const matchSearch = item.nama_sekolah.toLowerCase().includes(searchQuery.toLowerCase()) || item.npsn.includes(searchQuery);
      return matchCabdin && matchKab && matchSearch;
    })
    .sort((a, b) => {
      if (filterPrestasi === 'LOMBA') return b.skor_lomba - a.skor_lomba;
      if (filterPrestasi === 'LULUSAN') return b.skor_lulusan - a.skor_lulusan;
      if (filterPrestasi === 'TKA') return b.skor_tka - a.skor_tka;
      return b.poin_total - a.poin_total;
    });

  const filteredKarya = listKarya.filter(item => {
    const matchCabdin = filterCabdin === 'SEMUA' || (item.cabdin && item.cabdin.includes(filterCabdin.replace("Cabang Dinas ", "")));
    const matchKab = filterKabupaten === 'SEMUA' || (item.kabupaten && item.kabupaten.toLowerCase().includes(filterKabupaten.toLowerCase()));
    const matchSearch = (item.judul && item.judul.toLowerCase().includes(searchQuery.toLowerCase())) || (item.sekolah && item.sekolah.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const targetKategori = String(item.kategori || '').toUpperCase();
    let matchKategoriKarya = true;
    if (filterKategoriKarya !== 'SEMUA') {
        if (filterKategoriKarya === 'SMA MANTAP') matchKategoriKarya = targetKategori.includes('MANTAP');
        else if (filterKategoriKarya === 'BRANDING SEKOLAH') matchKategoriKarya = targetKategori.includes('BRANDING');
        else if (filterKategoriKarya === 'PROYEK SISWA') matchKategoriKarya = targetKategori.includes('PROYEK') || targetKategori.includes('SISWA');
        else if (filterKategoriKarya === 'PRAKTIK BAIK') matchKategoriKarya = targetKategori.includes('PRAKTIK') || targetKategori.includes('BAIK');
    }

    return matchCabdin && matchKab && matchSearch && matchKategoriKarya;
  });

  const daftarKabupatenTersedia = filterCabdin === 'SEMUA' ? Object.values(MASTER_WILAYAH).flat() : MASTER_WILAYAH[filterCabdin] || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20 select-none">
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoPena} alt="Logo PENA" className="w-10 h-10 object-contain" />
            <div>
              <span className="text-lg font-black tracking-wider bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent block">PENA PUBLIK</span>
              <span className="text-[10px] font-mono text-slate-400 block uppercase tracking-widest">Portal Prestasi & Inovasi Sekolah</span>
            </div>
          </div>
          <Link to="/login" className="px-5 py-2.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg flex items-center gap-2">
            <span>🔒</span> Masuk / Login Sistem
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-10">
          <div className="absolute inset-0 z-0 pointer-events-none opacity-25">
            <img src={bannerPena} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-r from-slate-950 via-slate-900/95 to-transparent" />
          </div>
          <div className="relative z-10 max-w-2xl space-y-3">
            <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest inline-block">✨ Transparansi & Apresiasi Pendidikan</span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">Etalase Praktik Baik & Peringkat Mutu</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider"><span>🗺️</span> Filter Wilayah Kerja Resmi</div>
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs font-bold">
            <div className="sm:col-span-4">
              <label className="block text-[10px] text-slate-400 mb-1 uppercase font-mono">Cabang Dinas:</label>
              <select value={filterCabdin} onChange={e => handleCabdinChange(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500 cursor-pointer font-sans">
                <option value="SEMUA">-- Semua Cabang Dinas --</option>
                {Object.keys(MASTER_WILAYAH).map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[10px] text-slate-400 mb-1 uppercase font-mono">Kabupaten / Kota:</label>
              <select value={filterKabupaten} onChange={e => setFilterKabupaten(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500 cursor-pointer font-sans disabled:opacity-50">
                <option value="SEMUA">-- Semua Kab/Kota --</option>
                {daftarKabupatenTersedia.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div className="sm:col-span-4">
              <label className="block text-[10px] text-slate-400 mb-1 uppercase font-mono">Cari Sekolah:</label>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="NPSN / Nama..." className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-cyan-500 font-sans" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-8">
        <div className="flex border-b border-slate-800 gap-6">
          <button onClick={() => setActiveTab('PERINGKAT')} className={`pb-4 font-black text-sm tracking-wide flex items-center gap-2 border-b-2 cursor-pointer ${activeTab === 'PERINGKAT' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}><span>🏆</span> PAPAN KLASEMEN</button>
          <button onClick={() => setActiveTab('KARYA')} className={`pb-4 font-black text-sm tracking-wide flex items-center gap-2 border-b-2 cursor-pointer ${activeTab === 'KARYA' ? 'border-cyan-400 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'}`}><span>💡</span> MANTAP SHARE</button>
        </div>
      </div>

      {activeTab === 'PERINGKAT' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="text-xs font-mono font-bold text-slate-300 uppercase"><span>🎯</span> Filter Kategori :</div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'SEMUA', label: '🌐 Semua (Poin Klasemen)', color: 'from-cyan-600 to-blue-600' },
                { id: 'LOMBA', label: '🏆 Lomba & Kejuaraan', color: 'from-amber-600 to-orange-600' },
                { id: 'LULUSAN', label: '🎓 Serapan Lulusan / PTN', color: 'from-emerald-600 to-teal-600' },
                { id: 'TKA', label: '📈 Skor TKA / Akademik', color: 'from-purple-600 to-indigo-600' }
              ].map(btn => (
                <button
                  key={btn.id} onClick={() => setFilterPrestasi(btn.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md ${filterPrestasi === btn.id ? `bg-linear-to-r ${btn.color} text-white scale-105 ring-2 ring-white/20` : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 bg-slate-900/50 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="font-black text-base text-white">Klasemen Prestasi: <span className="text-cyan-400">{filterPrestasi === 'SEMUA' ? 'Poin Total Klasemen' : filterPrestasi === 'LOMBA' ? 'Lomba & Kejuaraan' : filterPrestasi === 'LULUSAN' ? 'Serapan Lulusan / PTN' : 'Skor TKA / Akademik'}</span></h3>
              </div>
              <span className="text-xs font-mono bg-cyan-950 text-cyan-300 px-3 py-1 rounded-full border border-cyan-800">{filteredPeringkat.length} Sekolah Ditampilkan</span>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-16 text-center text-slate-400 font-mono text-xs animate-pulse">⏳ MENGHITUNG KLASEMEN...</div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase tracking-wider">
                    <tr>
                      <th className="py-4 px-6 font-bold w-16 text-center">Rank</th>
                      <th className="py-4 px-6 font-bold">Instansi & Pimpinan</th>
                      <th className="py-4 px-6 font-bold">Wilayah / Cabang Dinas</th>
                      <th className="py-4 px-6 font-bold text-center">Trofi</th>
                      <th className="py-4 px-6 font-bold text-center">Poin Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredPeringkat.map((item, index) => {
                      const skorTampil = filterPrestasi === 'LOMBA' ? item.skor_lomba : filterPrestasi === 'LULUSAN' ? item.skor_lulusan : filterPrestasi === 'TKA' ? item.skor_tka : item.poin_total;
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 text-center font-black text-base font-mono">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}</td>
                          <td className="p-4 flex items-center gap-3">
                            {item.logo_url ? <img src={item.logo_url} alt="" className="w-10 h-10 rounded-full object-cover bg-white p-0.5 border border-slate-700 shrink-0" /> : <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-xs text-slate-400 shrink-0">🏫</div>}
                            <div>
                              <div className="font-black text-sm text-white">{item.nama_sekolah}</div>
                              <div className="text-[11px] text-emerald-400 font-sans mt-0.5">Kepsek: <strong className="text-slate-200">{item.nama_kepala_sekolah}</strong></div>
                              <div className="text-[10px] text-slate-500 font-mono">NPSN: {item.npsn}</div>
                            </div>
                          </td>
                          <td className="p-4"><div className="text-slate-200 font-bold">{item.kabupaten}</div><div className="text-[11px] text-slate-400">{item.cabdin}</div></td>
                          <td className="p-4 text-center"><span className="px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-xl font-bold font-mono inline-flex items-center gap-1.5"><span>🏆</span> <span>{item.trofi}</span></span></td>
                          <td className="p-4 text-center">
                            <div>
                              <span className="text-base font-black font-mono text-cyan-300">{skorTampil}</span>
                              {filterPrestasi === 'SEMUA' && item.skor_tka > 0 && <span className="block text-[9px] font-mono font-bold text-cyan-400 mt-0.5">(+TKA)</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredPeringkat.length === 0 && (
                      <tr><td colSpan={5} className="p-12 text-center text-slate-400">📭 Belum ada data.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'KARYA' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-8 mt-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
            <div className="text-xs font-mono font-bold text-slate-300 uppercase"><span>📁</span> Filter Kategori Inovasi :</div>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'SEMUA', label: '🌐 Semua Karya' },
                { id: 'SMA MANTAP', label: '🏫 SMA Mantap' },
                { id: 'BRANDING SEKOLAH', label: '🚀 Branding Sekolah' },
                { id: 'PROYEK SISWA', label: '👨‍🎓 Proyek Siswa' },
                { id: 'PRAKTIK BAIK', label: '💡 Praktik Baik' }
              ].map(btn => (
                <button
                  key={btn.id} onClick={() => setFilterKategoriKarya(btn.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-md ${filterKategoriKarya === btn.id ? 'bg-cyan-600 text-white scale-105 ring-2 ring-white/20' : 'bg-slate-950 text-slate-400 border border-slate-800'}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
             <div className="p-16 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400 font-mono text-xs animate-pulse">⏳ MEMUAT ETALASE KARYA...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredKarya.map((item) => {
                const mediaFix = item.foto_url || item.gambar_url || item.url_foto || item.video_url || item.url_video || item.media_url || item.tautan;
                return (
                  <div key={item.id} className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-xl">
                    <div className="w-full h-56 bg-slate-950 relative border-b border-slate-800/80">
                      <SmartMediaRenderer url={mediaFix} title={item.judul} />
                      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-700 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-cyan-400 uppercase shadow pointer-events-none">
                        📁 {item.kategori || 'Inovasi Sekolah'}
                      </div>
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <h4 className="text-lg font-black text-white">{item.judul || "Karya Inovasi"}</h4>
                        <div className="text-xs text-emerald-400 font-medium mt-1 mb-2">Oleh: <strong className="text-white">{item.penulis || 'Warga Sekolah'}</strong> • {item.sekolah}</div>
                        <p className="text-xs text-slate-300 bg-slate-950 p-4 rounded-2xl border border-slate-800/80 line-clamp-3">"{item.deskripsi}"</p>
                      </div>
                      <div className="flex items-center justify-between border-t border-slate-800 pt-4">
                        <button onClick={() => handleShare(item)} className="px-3.5 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs font-bold border border-slate-700">🚀 Share</button>
                        <button onClick={() => handleLike(item.id, item.likes)} className="px-4 py-2 rounded-xl text-xs font-black bg-slate-950 text-rose-400 border border-rose-500/30"><span>{likedItems[item.id] ? '❤️' : '🤍'}</span> <span>{item.likes || 0}</span></button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filteredKarya.length === 0 && (
                <div className="col-span-full py-16 text-center bg-slate-900 border-2 border-dashed border-slate-800 rounded-3xl text-slate-400">
                  <span className="text-4xl block mb-3">🔍</span>
                  <p className="text-sm font-medium">Belum ada karya inovasi di kategori ini sesuai filter pencarian Anda.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
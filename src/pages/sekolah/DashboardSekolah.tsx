/* eslint-disable */
// @ts-nocheck

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../supabaseClient';

// IMPORT GAMBAR BANNER BARU
// @ts-ignore
import dashboardPena from '../../assets/dashboard_pena.png'; 
// @ts-ignore
import bannerPena from '../../assets/banner_pena.png'; 

// IMPORT KOMPONEN ANAK
import ModalDetailPrestasi from './components/ModalDetailPrestasi';
import FormEditSekolah from './components/FormEditSekolah';
import PapanKlasemen from './components/PapanKlasemen';
import GaleriInovasi, { GaleriInovasiItem } from './components/GaleriInovasi';

interface SekolahPelengkap { id?: string; user_id?: string; npsn?: string; nama_sekolah?: string; nama_kepala_sekolah?: string; nip_kepala_sekolah?: string; alamat?: string; logo_url?: string; total_guru?: number; total_murid?: number; total_tendik?: number; cabang_dinas?: string; kabupaten_kota?: string; }
interface KlasemenKlub { id: string; peringkat: number; nama_sekolah: string; nama_kepsek: string; logo_url: string | null; jumlah_prestasi: number; total_poin: number; tka_score: number; is_me: boolean; cabang_dinas?: string; kabupaten_kota?: string; }
interface Reaksi { id: string; praktik_baik_id: string; user_id: string; jenis: 'LIKE' | 'DISLIKE'; }
interface Komentar { id: string; praktik_baik_id: string; user_id: string; komentar: string; created_at: string; profiles?: { nama_lengkap: string; avatar_url: string }; }
interface StatPrestasi { juara1: number; juara2: number; juara3: number; lainnya: number; total: number; }

const bersihkanNamaSekolah = (prof: any, sek: any, bin: any) => {
  const kandidat = [sek?.nama_sekolah, bin?.nama_sekolah, prof?.nama_lengkap];
  const namaValid = kandidat.find(n => n && !String(n).toLowerCase().includes('satuan pendidikan npsn'));
  return namaValid ? String(namaValid).trim() : `Sekolah (${prof?.nomor_induk || sek?.npsn || 'NPSN'})`;
};

const panenKepalaSekolah = (targetNpsn: string, targetId: string, targetNama: string, allSeks: any[], allBinaan: any[], allProfs: any[]) => {
  const npsnClean = String(targetNpsn || '').trim(); const idClean = String(targetId || '').trim(); const namaClean = String(targetNama || '').trim();
  const isNamaValid = (str: any) => { if (!str) return false; const s = String(str).trim(); return s !== '' && s !== '-' && s.toLowerCase() !== 'belum diatur' && s.toLowerCase() !== 'menunggu update data'; };
  const normNama = (s: string) => { return String(s || '').toLowerCase().replace(/sma negeri/g, 'sman').replace(/smk negeri/g, 'smkn').replace(/smp negeri/g, 'smpn').replace(/[^a-z0-9]/g, ''); };
  
  const sek = allSeks.find(s => (idClean && String(s.user_id).trim() === idClean) || (npsnClean && String(s.npsn).trim() === npsnClean));
  if (isNamaValid(sek?.nama_kepala_sekolah)) return String(sek.nama_kepala_sekolah).trim();
  const bin = allBinaan.find(b => (npsnClean && String(b.npsn).trim() === npsnClean) || (idClean && String(b.sekolah_id).trim() === idClean));
  if (isNamaValid(bin?.nama_kepala_sekolah)) return String(bin.nama_kepala_sekolah).trim();
  if (namaClean && !namaClean.toLowerCase().includes('satuan pendidikan')) {
    const targetNorm = normNama(namaClean); const binFuzzy = allBinaan.find(b => normNama(b.nama_sekolah) === targetNorm);
    if (isNamaValid(binFuzzy?.nama_kepala_sekolah)) return String(binFuzzy.nama_kepala_sekolah).trim();
  }
  const prof = allProfs.find(p => p.id === idClean || p.nomor_induk === npsnClean);
  if (isNamaValid(prof?.nama_kepala_sekolah)) return String(prof.nama_kepala_sekolah).trim();
  if (isNamaValid((prof?.raw_user_meta_data as any)?.kepala_sekolah)) return String((prof?.raw_user_meta_data as any).kepala_sekolah).trim();
  return 'Belum diatur';
};

export default function DashboardSekolah() {
  const { profile } = useAuth();
  const [liveProfile, setLiveProfile] = useState(profile);
  const [dataSekolah, setDataSekolah] = useState<SekolahPelengkap | null>(null);
  const [papanPrestasi, setPapanPrestasi] = useState<KlasemenKlub[]>([]);
  const [galeri, setGaleri] = useState<GaleriInovasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filterKategori, setFilterKategori] = useState<'SEMUA' | 'LOMBA' | 'LULUSAN' | 'TKA'>('SEMUA');
  
  // STATE MANTAP SHARE
  const [kategoriShare, setKategoriShare] = useState('SEMUA');
  
  const [listReaksi, setListReaksi] = useState<Reaksi[]>([]);
  const [listKomentar, setListKomentar] = useState<Komentar[]>([]);
  const [expandedKaryaId, setExpandedKaryaId] = useState<string | null>(null);
  const [tampilSemuaInovasi, setTampilSemuaInovasi] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [formNamaSekolah, setFormNamaSekolah] = useState('');
  const [formKepsek, setFormKepsek] = useState('');
  const [formNipKepsek, setFormNipKepsek] = useState('');
  const [formAlamat, setFormAlamat] = useState('');
  const [formTotalGuru, setFormTotalGuru] = useState(0);
  const [formTotalMurid, setFormTotalMurid] = useState(0);
  const [formTotalTendik, setFormTotalTendik] = useState(0);
  const [formCabdin, setFormCabdin] = useState('');
  const [formKabKota, setFormKabKota] = useState('');
  const [formLogoFile, setFormLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [grafikPrestasi, setGrafikPrestasi] = useState<StatPrestasi>({ juara1: 0, juara2: 0, juara3: 0, lainnya: 0, total: 0 });
  const [myPrestasiDetail, setMyPrestasiDetail] = useState<any[]>([]);
  const [showDetailPrestasi, setShowDetailPrestasi] = useState(false);
  const [karyaTerbaruSekolah, setKaryaTerbaruSekolah] = useState<GaleriInovasiItem | null>(null);

  const defaultComments = [ "Luar biasa, sangat menginspirasi! 🚀", "Inovasi yang cerdas & solutif. 💡", "Praktik baik yang patut dicontoh. 👏", "Sangat kreatif, maju terus! 🔥", "Izin mengadaptasi program ini. ✨" ];

  const fetchInteraksi = async () => {
    try {
      const resRx = await supabase.from('praktik_baik_reaksi').select('*');
      if (resRx.data) setListReaksi(resRx.data);
      const resKm = await supabase.from('praktik_baik_komentar').select('*, profiles(nama_lengkap, avatar_url)').order('created_at', { ascending: true });
      if (resKm.data) setListKomentar(resKm.data);
    } catch (error) { console.error("Gagal koneksi tabel interaksi:", error); }
  };

  const memuatSeluruhData = async () => {
    if (!profile?.id) return;
    setLoading(true);
    try {
      const { data: profKtp } = await supabase.from('profiles').select('*').eq('id', profile.id).single();
      if (profKtp) setLiveProfile(profKtp);
      const npsnJangkar = profKtp?.nomor_induk || profile?.nomor_induk || '';
      
      const [resSek, resBinaan, resAllProfs, resAllSeks, resAllBinaan, resAllPrestasi, resRawGaleri, resTka] = await Promise.all([
        supabase.from('sekolah').select('*').eq('npsn', npsnJangkar).maybeSingle(),
        supabase.from('sekolah_binaan').select('*').eq('npsn', npsnJangkar).maybeSingle(),
        supabase.from('profiles').select('*'),
        supabase.from('sekolah').select('*'),
        supabase.from('sekolah_binaan').select('*'),
        supabase.from('prestasi').select('*'),
        supabase.from('praktik_baik').select('*'),
        supabase.from('tka_sekolah').select('*') 
      ]);
      
      const sekRow = resSek.data;
      const binaanRow = resBinaan.data;
      const cacheKepsek = localStorage.getItem(`pena_kpsk_${profile.id}`);
      const cacheAlamat = localStorage.getItem(`pena_almt_${profile.id}`);
      const allProfs = resAllProfs.data || [];
      const allSeks = resAllSeks.data || [];
      const allBinaan = resAllBinaan.data || [];
      const allPrestasi = resAllPrestasi.data || [];
      const allTka = resTka.data || []; 
      const namaAsliInstitusi = bersihkanNamaSekolah(profKtp, sekRow, binaanRow);
      let kepsekAsliInstitusi = panenKepalaSekolah(npsnJangkar, profile.id, namaAsliInstitusi, allSeks, allBinaan, allProfs);
      
      if (kepsekAsliInstitusi === 'Belum diatur' && cacheKepsek) kepsekAsliInstitusi = cacheKepsek;
      const alamatTerkuat = sekRow?.alamat || cacheAlamat || '';
      const nipTerkuat = sekRow?.nip_kepala_sekolah || '';
      
      setDataSekolah({
        ...sekRow, nama_sekolah: namaAsliInstitusi, nama_kepala_sekolah: kepsekAsliInstitusi,
        nip_kepala_sekolah: nipTerkuat, alamat: alamatTerkuat,
        total_guru: sekRow?.total_guru || 0, total_murid: sekRow?.total_murid || 0, total_tendik: sekRow?.total_tendik || 0,
        cabang_dinas: sekRow?.cabang_dinas || '', kabupaten_kota: sekRow?.kabupaten_kota || ''
      });
      
      setFormNamaSekolah(namaAsliInstitusi);
      setFormKepsek(kepsekAsliInstitusi);
      setFormNipKepsek(nipTerkuat);
      setFormAlamat(alamatTerkuat);
      setFormTotalGuru(sekRow?.total_guru || 0);
      setFormTotalMurid(sekRow?.total_murid || 0);
      setFormTotalTendik(sekRow?.total_tendik || 0);
      setFormCabdin(sekRow?.cabang_dinas || '');
      setFormKabKota(sekRow?.kabupaten_kota || '');
      
      const isLolosKurasi = (val: any) => {
        if (!val) return false; const st = String(val).toUpperCase(); return st.includes('SETUJU') || st.includes('VALID') || st.includes('ACC') || st === '1' || val === true;
      };
      
      const validPrestasi = allPrestasi.filter(pr => isLolosKurasi(pr.status_validasi || pr.status || pr.is_valid));
      const myPrestasiList = validPrestasi.filter(pr => String(pr.sekolah_id) === String(profile.id) || String(pr.sekolah_id) === String(npsnJangkar));
      
      let gabunganCapaian = [...myPrestasiList];
      const myTkaRow = allTka.find(t => String(t.npsn) === String(npsnJangkar) || String(t.user_id) === String(profile.id));
      if (myTkaRow) {
        gabunganCapaian.push({
          id: 'tka-' + myTkaRow.id,
          nama_siswa_atau_kegiatan: 'Skor Rata-rata TKA Sekolah',
          jenis_prestasi: 'Evaluasi TKA',
          peringkat: 'Terdata',
          poin: myTkaRow.rata_rata_total || 0,
          tahun: new Date().getFullYear().toString()
        });
      }

      setMyPrestasiDetail(gabunganCapaian);
      
      let j1 = 0, j2 = 0, j3 = 0, jL = 0;
      gabunganCapaian.forEach(pr => {
        const val = String(pr.peringkat || pr.juara || '').toLowerCase();
        if (val.includes('1') || val.includes('satu')) j1++;
        else if (val.includes('2') || val.includes('dua')) j2++;
        else if (val.includes('3') || val.includes('tiga')) j3++;
        else jL++; 
      });
      setGrafikPrestasi({ juara1: j1, juara2: j2, juara3: j3, lainnya: jL, total: gabunganCapaian.length });
      
      const daftarSekolah = allProfs.filter(p => String(p.role).toUpperCase() === 'SEKOLAH');
      const rakitanKlasemen: KlasemenKlub[] = daftarSekolah.map((p) => {
        const isMe = p.id === profile.id;
        const matchingSek = allSeks.find(s => String(s.npsn) === String(p.nomor_induk) || String(s.user_id) === String(p.id));
        const matchingBinaan = allBinaan.find(b => String(b.npsn) === String(p.nomor_induk) || String(b.sekolah_id) === String(p.id));
        let pList = validPrestasi.filter(pr => String(pr.sekolah_id) === String(p.id) || String(pr.sekolah_id) === String(p.nomor_induk));
        
        if (filterKategori === 'LOMBA') {
          pList = pList.filter(pr => { const val = String(pr.jalur || pr.kategori || pr.jenis_prestasi || pr.jenis || '').toUpperCase(); return val.includes('LOMBA') || ['OSN', 'O2SN', 'FLS3N', 'KOSN', 'LDI', 'FIKSI', 'OPSI'].includes(val); });
        } else if (filterKategori === 'LULUSAN') {
          pList = pList.filter(pr => { const val = String(pr.jalur || pr.kategori || pr.jenis_prestasi || pr.jenis || '').toUpperCase(); return val.includes('LULUSAN') || val.includes('KELULUSAN') || ['SNBP', 'SNBT', 'MANDIRI', 'KEDINASAN'].includes(val); });
        }
        
        const pts = pList.reduce((acc, curr) => acc + (Number(curr.poin) || Number(curr.points) || 1), 0);
        const namaSekolahBersih = isMe ? namaAsliInstitusi : bersihkanNamaSekolah(p, matchingSek, matchingBinaan);
        let kepsekBersih = panenKepalaSekolah(p.nomor_induk, p.id, namaSekolahBersih, allSeks, allBinaan, allProfs);
        if (isMe && kepsekBersih === 'Belum diatur') kepsekBersih = kepsekAsliInstitusi;
        
        const tkaRow = allTka.find(t => String(t.npsn) === String(p.nomor_induk) || String(t.user_id) === String(p.id));
        const scoreTka = tkaRow ? Number(tkaRow.rata_rata_total) : 0;
        
        return { 
          id: p.id, peringkat: 0, nama_sekolah: namaSekolahBersih, nama_kepsek: kepsekBersih, 
          logo_url: matchingSek?.logo_url || p.avatar_url || null, jumlah_prestasi: pList.length, 
          total_poin: pts, tka_score: scoreTka, is_me: isMe,
          cabang_dinas: matchingSek?.cabang_dinas || '', 
          kabupaten_kota: matchingSek?.kabupaten_kota || ''
        };
      });
      
      rakitanKlasemen.sort((a, b) => {
        if (filterKategori === 'TKA') return b.tka_score - a.tka_score;
        return b.jumlah_prestasi !== a.jumlah_prestasi ? b.jumlah_prestasi - a.jumlah_prestasi : b.total_poin - a.total_poin;
      });
      rakitanKlasemen.forEach((item, idx) => item.peringkat = idx + 1);
      setPapanPrestasi(rakitanKlasemen);
      
      const rawGaleri = resRawGaleri.data || [];
      const approvedGaleri: GaleriInovasiItem[] = rawGaleri.filter(item => isLolosKurasi(item.status_validasi || item.status || item.status_kurasi)).map(karya => {
          const pPenulis = allProfs.find(x => String(x.id) === String(karya.user_id || karya.sekolah_id) || String(x.nomor_induk) === String(karya.npsn));
          const sPenulis = allSeks.find(x => String(x.npsn) === String(karya.npsn) || String(x.user_id) === String(karya.user_id));
          return {
            id: karya.id, judul: karya.judul || (karya as any).title || 'Inovasi Tanpa Judul', deskripsi: karya.deskripsi || (karya as any).description || (karya as any).konten || '', jenis_media: karya.jenis_media || (karya as any).kategori || (karya as any).tipe || 'DOKUMEN', media_url: karya.media_url || (karya as any).link_dokumen || (karya as any).file_url || '',
            kategori_program: karya.kategori_program || '', capaian_hasil: karya.capaian_hasil || '', tanggal_pelaksanaan: karya.tanggal_pelaksanaan || '', created_at: karya.created_at || new Date().toISOString(),
            profiles: { nama_lengkap: bersihkanNamaSekolah(pPenulis, sPenulis, null), avatar_url: sPenulis?.logo_url || pPenulis?.avatar_url }
          };
        });
      setGaleri(approvedGaleri); 
      
      const myLatestInovasi = rawGaleri
        .filter((item: any) => String(item.user_id) === String(profile.id) || String(item.npsn) === String(npsnJangkar))
        .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())[0];
      
      setKaryaTerbaruSekolah(myLatestInovasi ? {
        id: myLatestInovasi.id, judul: myLatestInovasi.judul || myLatestInovasi.title || 'Inovasi Tanpa Judul', deskripsi: myLatestInovasi.deskripsi || myLatestInovasi.description || myLatestInovasi.konten || '', jenis_media: myLatestInovasi.jenis_media || myLatestInovasi.kategori || myLatestInovasi.tipe || 'DOKUMEN', media_url: myLatestInovasi.media_url || myLatestInovasi.link_dokumen || myLatestInovasi.file_url || '',
      } : null);

      fetchInteraksi();
    } catch (err) { console.error("PENA Harvester Error:", err); } finally { setLoading(false); }
  };

  useEffect(() => { memuatSeluruhData(); }, [profile, filterKategori]);

  const handleReaksi = async (karyaId: string, jenis: 'LIKE' | 'DISLIKE') => {
    if (!profile?.id) return alert("Sesi tidak valid.");
    try {
      const exist = listReaksi.find(r => r.praktik_baik_id === karyaId && r.user_id === profile.id);
      if (exist) {
        if (exist.jenis === jenis) await supabase.from('praktik_baik_reaksi').delete().eq('id', exist.id);
        else await supabase.from('praktik_baik_reaksi').update({ jenis }).eq('id', exist.id);
      } else await supabase.from('praktik_baik_reaksi').insert({ praktik_baik_id: karyaId, user_id: profile.id, jenis });
      await fetchInteraksi();
    } catch (e: any) { alert(`❌ Error: ${e.message}`); }
  };

  const handleKirimKomentarCepat = async (karyaId: string, teks: string) => {
    if (!profile?.id) return;
    try { await supabase.from('praktik_baik_komentar').insert({ praktik_baik_id: karyaId, user_id: profile.id, komentar: teks }); await fetchInteraksi(); } 
    catch (e: any) { alert(`❌ Error: ${e.message}`); }
  };

  const handleSimpanPemutakhiran = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setSaving(true);
    try {
      const npsnMutlak = liveProfile?.nomor_induk || profile?.nomor_induk || '';
      let finalAvatarUrl = liveProfile?.avatar_url;
      if (formLogoFile) {
        const ext = formLogoFile.name.split('.').pop();
        const path = `logo/${profile.id}-${Date.now()}.${ext}`;
        const { error: errUp } = await supabase.storage.from('school_assets').upload(path, formLogoFile, { upsert: true });
        if (errUp) throw errUp;
        const { data: urlObj } = supabase.storage.from('school_assets').getPublicUrl(path);
        finalAvatarUrl = urlObj.publicUrl;
      }
      
      const muatanSekolah = { 
        user_id: profile.id, npsn: npsnMutlak, nama_sekolah: formNamaSekolah.trim(), nama_kepala_sekolah: formKepsek.trim(), nip_kepala_sekolah: formNipKepsek.trim(), alamat: formAlamat.trim(), logo_url: finalAvatarUrl, total_guru: Number(formTotalGuru) || 0, total_murid: Number(formTotalMurid) || 0, total_tendik: Number(formTotalTendik) || 0, cabang_dinas: formCabdin, kabupaten_kota: formKabKota
      };
      
      await supabase.from('profiles').update({ nama_lengkap: muatanSekolah.nama_sekolah, avatar_url: finalAvatarUrl }).eq('id', profile.id);
      
      const { data: resUpdateUser, error: errUpdate } = await supabase.from('sekolah').update(muatanSekolah).eq('user_id', profile.id).select();
      if (errUpdate) throw errUpdate;
      
      if (!resUpdateUser || resUpdateUser.length === 0) {
        const { data: resUpdateNpsn, error: errNpsn } = await supabase.from('sekolah').update(muatanSekolah).eq('npsn', npsnMutlak).select();
        if (errNpsn) throw errNpsn;
        if (!resUpdateNpsn || resUpdateNpsn.length === 0) {
           const { error: errInsert } = await supabase.from('sekolah').insert(muatanSekolah);
           if (errInsert) throw errInsert;
        }
      }
      
      setDataSekolah(prev => ({ ...prev, ...muatanSekolah }) as any);
      setLiveProfile(prev => prev ? ({ ...prev, nama_lengkap: muatanSekolah.nama_sekolah, avatar_url: finalAvatarUrl }) : null);
      alert("✅ BERHASIL MURNI! Data Pokok, Wilayah, & NIP resmi mengunci di Supabase!");
      setIsEditing(false); memuatSeluruhData();
    } catch (err: any) { console.error("PENA DB ERROR:", err); alert(`❌ Gagal menyimpan:\n"${err.message}"`); } finally { setSaving(false); }
  };

  const renderKaryaInovasiCard = (karya: GaleriInovasiItem) => {
    const jm = String(karya.jenis_media || '').toUpperCase(); const urlMentah = String(karya.media_url || '').trim(); const urlLower = urlMentah.toLowerCase();
    let tipe = 'DOCUMENT';
    if (jm.includes('GAMBAR') || urlLower.endsWith('.jpg') || urlLower.endsWith('.png') || urlLower.endsWith('.webp')) tipe = 'IMAGE'; 
    else if (jm.includes('VIDEO') || urlLower.includes('youtu')) tipe = 'VIDEO';
    const cardReaksi = listReaksi.filter(r => r.praktik_baik_id === karya.id);
    const myLike = cardReaksi.find(r => r.user_id === profile?.id && r.jenis === 'LIKE');
    const myDislike = cardReaksi.find(r => r.user_id === profile?.id && r.jenis === 'DISLIKE');
    const likesCount = cardReaksi.filter(r => r.jenis === 'LIKE').length;
    const dislikesCount = cardReaksi.filter(r => r.jenis === 'DISLIKE').length;
    
    const cardKomentar = listKomentar.filter(k => k.praktik_baik_id === karya.id);
    const isExpanded = expandedKaryaId === karya.id;
    return (
      <div key={karya.id} className="transition-all duration-300 group flex flex-col justify-between rounded-3xl p-6 bg-white border-2 border-black shadow-neo hover:-translate-y-1 hover:shadow-neo-md dark:bg-slate-900/80 dark:border-slate-800 dark:shadow-xl dark:hover:border-cyan-500/50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-wider ${tipe === 'VIDEO' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20' : tipe === 'IMAGE' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20'}`}>
              {tipe === 'VIDEO' ? '▶️ VIDEO' : tipe === 'IMAGE' ? '🖼️ GAMBAR' : '📄 DOKUMEN'}
            </span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-35">{karya.profiles?.nama_lengkap || 'Sekolah Terdaftar'}</span>
          </div>
          <h3 className="font-black text-lg text-black dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors leading-snug">{karya.judul}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2 italic">"{karya.deskripsi}"</p>

          {/* Menambahkan Label Atribut MANTAP Share */}
          <div className="flex flex-wrap gap-2 pt-1">
            {karya.kategori_program && <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border border-purple-200 dark:border-purple-500/20 rounded-md text-[9px] font-black uppercase tracking-wider">{karya.kategori_program}</span>}
            {karya.tanggal_pelaksanaan && <span className="px-2 py-1 bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 rounded-md text-[9px] font-bold">📅 {karya.tanggal_pelaksanaan}</span>}
          </div>
          {karya.capaian_hasil && (
            <div className="p-2 bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10 rounded-lg mt-2">
              <p className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400">🎯 Capaian/Hasil:</p>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5 line-clamp-2">{karya.capaian_hasil}</p>
            </div>
          )}
        </div>
        
        {urlMentah && (
          <div className="mt-4 pt-4 border-t border-black/20 dark:border-slate-800/80 space-y-3">
            {tipe === 'IMAGE' && (
              <div className="space-y-2">
                <div className="w-full h-36 rounded-2xl overflow-hidden bg-slate-200 dark:bg-slate-950 border-2 border-black dark:border-slate-800 group/img relative">
                  <img src={urlMentah} alt={karya.judul} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500" />
                </div>
                {/* Tombol Lihat Detail */}
                <a href={urlMentah} target="_blank" rel="noreferrer" className="w-full py-2 px-4 rounded-xl font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all bg-yellow-400 text-black border-2 border-black shadow-neo hover:-translate-y-0.5 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-cyan-400 dark:border-transparent dark:shadow-none">
                  <span>👁️</span> Lihat Detail ↗
                </a>
              </div>
            )}
            {tipe === 'VIDEO' && (
              <a href={urlMentah} target="_blank" rel="noreferrer" className="w-full h-36 rounded-2xl flex flex-col items-center justify-center group/vid relative overflow-hidden transition-all bg-red-100 border-2 border-black shadow-neo dark:bg-linear-to-r dark:from-slate-950 dark:to-red-950/30 dark:border-red-500/20 dark:shadow-none">
                <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center pl-1 shadow-[0_0_20px_rgba(220,38,38,0.5)] group-hover/vid:scale-110 transition-transform">
                  <span className="text-xl font-black">▶</span>
                </div>
                <span className="text-[11px] font-mono font-bold text-red-700 dark:text-red-300 mt-2 tracking-widest uppercase">Lihat Detail Video ↗</span>
              </a>
            )}
            {tipe === 'DOCUMENT' && (
              <a href={urlMentah} target="_blank" rel="noreferrer" className="w-full py-3 px-4 rounded-2xl font-mono text-xs font-bold flex items-center justify-between transition-all bg-blue-100 border-2 border-black text-blue-800 shadow-neo hover:-translate-y-0.5 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 dark:border-blue-500/20 dark:text-blue-300 dark:shadow-none">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">📄</span>
                  <span className="truncate max-w-37.5">Lihat Detail Dokumen</span>
                </div>
                <span className="font-black text-blue-600 dark:text-cyan-400">↗</span>
              </a>
            )}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/20 dark:border-slate-800/40">
              <div className="flex gap-2">
                <button onClick={() => handleReaksi(karya.id, 'LIKE')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${myLike ? 'bg-cyan-400 text-black border-black shadow-neo dark:bg-cyan-500 dark:text-slate-950 dark:border-cyan-400 dark:shadow-[0_0_10px_rgba(6,182,212,0.4)]' : 'bg-white text-slate-700 border-black hover:-translate-y-0.5 hover:shadow-neo dark:bg-slate-950 dark:text-slate-400 dark:border-slate-700 dark:hover:border-cyan-500/50 dark:hover:text-cyan-400 dark:shadow-none'}`}>
                  👍 <span>{likesCount}</span>
                </button>
                <button onClick={() => handleReaksi(karya.id, 'DISLIKE')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 ${myDislike ? 'bg-rose-500 text-white border-black shadow-neo dark:border-rose-400 dark:shadow-none' : 'bg-white text-slate-700 border-black hover:-translate-y-0.5 hover:shadow-neo dark:bg-slate-950 dark:text-slate-400 dark:border-slate-700 dark:hover:border-rose-500/50 dark:hover:text-rose-400 dark:shadow-none'}`}>
                  👎 <span>{dislikesCount}</span>
                </button>
              </div>
              <button onClick={() => setExpandedKaryaId(isExpanded ? null : karya.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 bg-white text-black border-black hover:-translate-y-0.5 hover:shadow-neo dark:bg-slate-950 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-white dark:shadow-none">
                💬 {cardKomentar.length} Diskusi
              </button>
            </div>
            {isExpanded && (
              <div className="pt-3 border-t border-black/20 dark:border-slate-800 animate-fade-in space-y-3">
                <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                  {cardKomentar.length === 0 ? (
                    <p className="text-[10px] font-mono italic text-center py-2 text-slate-500">Belum ada tanggapan.</p>
                  ) : (
                    cardKomentar.map(kom => (
                      <div key={kom.id} className="rounded-xl p-2.5 flex gap-2.5 text-xs border-2 bg-slate-50 border-black dark:bg-slate-950 dark:border-slate-800/80">
                        {kom.profiles?.avatar_url ? (
                          <img src={kom.profiles.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5 border border-black dark:border-transparent" />
                        ) : (
                          <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] mt-0.5 bg-slate-300 dark:bg-slate-800">👤</div>
                        )}
                        <div className="space-y-0.5 overflow-hidden">
                          <span className="font-bold block text-[10px] truncate text-blue-600 dark:text-cyan-400">{kom.profiles?.nama_lengkap || 'Sekolah Terdaftar'}</span>
                          <span className="text-xs block leading-snug text-slate-800 dark:text-slate-300">{kom.komentar}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="space-y-1.5 pt-2 border-t border-black/20 dark:border-slate-800/60">
                  <span className="block text-[9px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400">Kirim apresiasi cepat:</span>
                  <div className="flex flex-wrap gap-1">
                    {defaultComments.map((txt, idx) => ( 
                      <button key={idx} onClick={() => handleKirimKomentarCepat(karya.id, txt)} className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all text-left cursor-pointer border-2 bg-white text-black border-black hover:bg-yellow-400 dark:bg-slate-950 dark:hover:bg-cyan-500 dark:hover:text-slate-950 dark:text-slate-300 dark:border-slate-800 dark:hover:border-cyan-400">
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

  if (loading) return <div className="h-96 flex items-center justify-center font-mono animate-pulse text-cyan-600 dark:text-cyan-400">Menghubungkan ke Satelit PENA AI...</div>;
  
  const pJ1 = grafikPrestasi.total > 0 ? (grafikPrestasi.juara1 / grafikPrestasi.total) * 100 : 0;
  const pJ2 = grafikPrestasi.total > 0 ? (grafikPrestasi.juara2 / grafikPrestasi.total) * 100 : 0;
  const pJ3 = grafikPrestasi.total > 0 ? (grafikPrestasi.juara3 / grafikPrestasi.total) * 100 : 0;
  const pJL = grafikPrestasi.total > 0 ? (grafikPrestasi.lainnya / grafikPrestasi.total) * 100 : 0;

  // LOGIKA 1 TERBARU + 2 TERPOPULER UNTUK MANTAP SHARE
  const galeriTerfilter = galeri.filter(item => kategoriShare === 'SEMUA' || item.kategori_program === kategoriShare);
  const sortedByDate = [...galeriTerfilter].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
  
  let galeriDitampilkan: GaleriInovasiItem[] = [];
  if (sortedByDate.length > 0) {
    const latest = sortedByDate[0];
    const remaining = sortedByDate.slice(1);
    const sortedByPopularity = remaining.sort((a, b) => {
      const likesA = listReaksi.filter(r => r.praktik_baik_id === a.id && r.jenis === 'LIKE').length;
      const likesB = listReaksi.filter(r => r.praktik_baik_id === b.id && r.jenis === 'LIKE').length;
      return likesB - likesA;
    });
    galeriDitampilkan = tampilSemuaInovasi ? [latest, ...sortedByPopularity] : [latest, ...sortedByPopularity.slice(0, 2)];
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16 font-sans select-none max-w-7xl mx-auto w-full relative text-slate-900 dark:text-slate-100">
      
      {/* HEADER & PROFIL SEKOLAH TERPADU */}
      <div className="relative rounded-3xl overflow-hidden shadow-neo mb-6 border-4 border-black dark:border-2 dark:border-slate-800 dark:shadow-2xl w-full flex flex-col justify-end min-h-75 sm:min-h-100">
        {/* Latar Belakang Gambar Full tanpa efek zoom */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img src={dashboardPena} alt="PENA Enterprise" className="w-full h-full object-cover object-top" />
          <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent dark:from-slate-950/80 dark:to-transparent" />
        </div>
        
        {/* Badge Otoritas */}
        <div className="absolute top-4 right-4 z-10 px-4 py-2 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-white/95 border-2 border-black text-black shadow-neo-sm dark:bg-cyan-500/10 dark:border-cyan-500/30 dark:text-cyan-400 dark:shadow-none">
          OTORITAS: SEKOLAH
        </div>

        {/* Konten Profil di Atas Banner (Dibungkus Card Neo-Brutalist) */}
        <div className="relative z-10 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mt-auto w-full">
          
          {/* WADAH IDENTITAS (NAMEPLATE) */}
          <div className="flex items-center gap-4 bg-white/95 backdrop-blur-md border-2 border-black p-3 sm:p-4 rounded-2xl shadow-neo dark:bg-slate-900/90 dark:border-slate-700 dark:shadow-none max-w-2xl">
            {liveProfile?.avatar_url ? (
              <img src={liveProfile.avatar_url} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover p-1 bg-white shrink-0 border-2 border-black dark:border-slate-600" />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex flex-col items-center justify-center shrink-0 font-mono bg-yellow-400 border-2 border-black text-black dark:bg-slate-800 dark:border-slate-700 dark:text-cyan-400"><span className="text-2xl font-black">🏫</span></div>
            )}
            <div className="mb-0 pr-2">
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-wider border-2 bg-blue-100 text-blue-800 border-blue-400 dark:bg-cyan-500/10 dark:border-cyan-500/20 dark:text-cyan-400 dark:border">NPSN: {liveProfile?.nomor_induk || '---'}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black border-2 bg-green-100 text-green-800 border-green-400 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:border">Satuan Pendidikan</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-black dark:text-white leading-tight">{dataSekolah?.nama_sekolah || liveProfile?.nama_lengkap || "Nama Belum Terdaftar"}</h1>
              <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mt-1">👤 Kepsek: <strong className="text-blue-700 dark:text-cyan-300">{dataSekolah?.nama_kepala_sekolah || "Belum dikonfigurasi"}</strong></p>
            </div>
          </div>

          <button onClick={() => setIsEditing(!isEditing)} className="px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer border-2 bg-white text-black border-black shadow-neo hover:-translate-y-0.5 hover:shadow-neo-md dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-cyan-400 dark:shadow-none dark:hover:translate-y-0 shrink-0">
            {isEditing ? "❌ Tutup Panel" : "⚙️ Edit Profil & Data Pokok"}
          </button>
        </div>
      </div>
      
      {/* INFO STATISTIK SEKOLAH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Detail Wilayah & Jumlah Personal */}
        <div className="p-6 sm:p-8 rounded-3xl transition-colors bg-white border-4 border-black shadow-neo dark:bg-slate-900/60 dark:border-2 dark:border-slate-800 dark:shadow-xl h-full flex flex-col justify-between">
          <div className="space-y-4">
             <div className="flex items-start gap-3">
               <span className="text-xl">📍</span>
               <div>
                 <p className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Alamat & Domisili</p>
                 <p className="text-sm font-bold text-black dark:text-white">{dataSekolah?.alamat || "Alamat belum diatur"}</p>
                 {dataSekolah?.cabang_dinas && (
                   <p className="text-xs font-mono font-bold text-blue-600 dark:text-cyan-400 mt-1">{dataSekolah.cabang_dinas} • {dataSekolah.kabupaten_kota}</p>
                 )}
               </div>
             </div>
             
             <div className="pt-4 border-t-2 border-black/10 dark:border-slate-800/50 flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-300 dark:bg-blue-500/10 dark:border-blue-500/20">👨‍🏫</div>
                  <div>
                    <p className="text-[9px] font-mono font-black uppercase text-slate-500 dark:text-slate-400">Guru</p>
                    <p className="text-sm font-black text-black dark:text-white">{dataSekolah?.total_guru || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center border border-green-300 dark:bg-emerald-500/10 dark:border-emerald-500/20">👥</div>
                  <div>
                    <p className="text-[9px] font-mono font-black uppercase text-slate-500 dark:text-slate-400">Siswa</p>
                    <p className="text-sm font-black text-black dark:text-white">{dataSekolah?.total_murid || 0}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center border border-orange-300 dark:bg-amber-500/10 dark:border-amber-500/20">🏢</div>
                  <div>
                    <p className="text-[9px] font-mono font-black uppercase text-slate-500 dark:text-slate-400">Tendik</p>
                    <p className="text-sm font-black text-black dark:text-white">{dataSekolah?.total_tendik || 0}</p>
                  </div>
                </div>
             </div>
          </div>

          {/* KARYA INOVASI TERBARU SEKOLAH */}
          <div className="mt-6 pt-4 border-t-2 border-black/10 dark:border-slate-800/50">
            <p className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">🚀 Unggahan Karya Terbaru Sekolah</p>
            {karyaTerbaruSekolah ? (
              <div className="bg-blue-50 border-2 border-black rounded-xl p-3 shadow-sm dark:bg-slate-800/50 dark:border-slate-700">
                <p className="text-xs font-black text-blue-700 dark:text-cyan-400 truncate">{karyaTerbaruSekolah.judul}</p>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 line-clamp-1 mt-0.5 italic">"{karyaTerbaruSekolah.deskripsi}"</p>
              </div>
            ) : (
              <div className="bg-slate-50 border-2 border-dashed border-black/20 rounded-xl p-3 dark:bg-slate-900/40 dark:border-slate-800">
                <p className="text-[10px] text-slate-500 font-bold italic text-center">Belum ada karya inovasi yang diunggah.</p>
              </div>
            )}
          </div>

        </div>

        {/* Kanan: Grafik Batang (Bisa Diklik) */}
        <div 
          onClick={() => setShowDetailPrestasi(true)}
          className="p-6 sm:p-8 rounded-3xl flex flex-col justify-center cursor-pointer transition-colors group relative bg-white border-4 border-black shadow-neo hover:bg-slate-50 dark:bg-slate-900/60 dark:border-2 dark:border-slate-800 dark:shadow-xl dark:hover:bg-slate-900/80 h-full"
        >
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider font-mono opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 border-2 bg-yellow-400 text-black border-black shadow-neo dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30 dark:shadow-lg dark:shadow-cyan-500/20 dark:border">
            <span>🔍</span> Lihat Daftar Nama Siswa
          </div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black font-mono uppercase tracking-widest flex items-center gap-2 transition-colors text-black group-hover:text-blue-600 dark:text-white dark:group-hover:text-cyan-400"><span>📈</span> Grafik Capaian Prestasi</h3>
              <p className="text-[10px] mt-0.5 font-bold text-slate-500 dark:text-slate-400">Klik area ini untuk melihat daftar peraih prestasi</p>
            </div>
            <div className="px-4 py-1.5 rounded-xl text-center transition-colors border-2 bg-white border-black shadow-sm dark:bg-slate-900 dark:border-slate-700 dark:border dark:group-hover:border-cyan-500/50">
              <span className="block text-xl font-black font-mono leading-none group-hover:scale-110 transition-transform text-orange-600 dark:text-amber-400">{grafikPrestasi.total}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400">Total Trofi</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="space-y-0.5"><div className="flex justify-between text-[10px] font-bold uppercase tracking-wider"><span className="text-orange-600 dark:text-amber-400">🥇 Juara 1 ({grafikPrestasi.juara1})</span><span className="font-mono font-black text-slate-700 dark:text-slate-500">{pJ1.toFixed(0)}%</span></div><div className="w-full rounded-full h-2 overflow-hidden border border-black bg-slate-200 dark:bg-slate-900 dark:border-slate-800"><div className="h-2 rounded-full transition-all duration-1000 bg-linear-to-r from-orange-500 to-yellow-400 dark:from-amber-600 dark:to-amber-400" style={{ width: `${pJ1}%` }}></div></div></div>
            <div className="space-y-0.5"><div className="flex justify-between text-[10px] font-bold uppercase tracking-wider"><span className="text-slate-600 dark:text-slate-300">🥈 Juara 2 ({grafikPrestasi.juara2})</span><span className="font-mono font-black text-slate-700 dark:text-slate-500">{pJ2.toFixed(0)}%</span></div><div className="w-full rounded-full h-2 overflow-hidden border border-black bg-slate-200 dark:bg-slate-900 dark:border-slate-800"><div className="h-2 rounded-full transition-all duration-1000 bg-linear-to-r from-slate-400 to-slate-300 dark:from-slate-500 dark:to-slate-300" style={{ width: `${pJ2}%` }}></div></div></div>
            <div className="space-y-0.5"><div className="flex justify-between text-[10px] font-bold uppercase tracking-wider"><span className="text-red-700 dark:text-amber-700">🥉 Juara 3 ({grafikPrestasi.juara3})</span><span className="font-mono font-black text-slate-700 dark:text-slate-500">{pJ3.toFixed(0)}%</span></div><div className="w-full rounded-full h-2 overflow-hidden border border-black bg-slate-200 dark:bg-slate-900 dark:border-slate-800"><div className="h-2 rounded-full transition-all duration-1000 bg-linear-to-r from-red-600 to-orange-500 dark:from-amber-800 dark:to-amber-600" style={{ width: `${pJ3}%` }}></div></div></div>
            <div className="space-y-0.5"><div className="flex justify-between text-[10px] font-bold uppercase tracking-wider"><span className="text-purple-600 dark:text-indigo-400">🏅 Lainnya ({grafikPrestasi.lainnya})</span><span className="font-mono font-black text-slate-700 dark:text-slate-500">{pJL.toFixed(0)}%</span></div><div className="w-full rounded-full h-2 overflow-hidden border border-black bg-slate-200 dark:bg-slate-900 dark:border-slate-800"><div className="h-2 rounded-full transition-all duration-1000 bg-linear-to-r from-purple-600 to-blue-500 dark:from-indigo-600 dark:to-indigo-400" style={{ width: `${pJL}%` }}></div></div></div>
          </div>
        </div>
      </div>

      {/* RENDER KOMPONEN ANAK */}

      {isEditing && (
        <FormEditSekolah 
          formNamaSekolah={formNamaSekolah} setFormNamaSekolah={setFormNamaSekolah}
          formKepsek={formKepsek} setFormKepsek={setFormKepsek}
          formNipKepsek={formNipKepsek} setFormNipKepsek={setFormNipKepsek}
          formAlamat={formAlamat} setFormAlamat={setFormAlamat}
          formTotalGuru={formTotalGuru} setFormTotalGuru={setFormTotalGuru}
          formTotalMurid={formTotalMurid} setFormTotalMurid={setFormTotalMurid}
          formTotalTendik={formTotalTendik} setFormTotalTendik={setFormTotalTendik}
          setFormLogoFile={setFormLogoFile} setIsEditing={setIsEditing}
          formCabdin={formCabdin} setFormCabdin={setFormCabdin}
          formKabKota={formKabKota} setFormKabKota={setFormKabKota}
          handleSimpanPemutakhiran={handleSimpanPemutakhiran} saving={saving}
        />
      )}

      <PapanKlasemen 
        filterKategori={filterKategori} 
        setFilterKategori={setFilterKategori}
        papanDataUtuh={papanPrestasi} 
      />

      <GaleriInovasi 
        galeriDitampilkan={galeriDitampilkan} galeriTotal={galeriTerfilter.length}
        tampilSemuaInovasi={tampilSemuaInovasi} setTampilSemuaInovasi={setTampilSemuaInovasi}
        renderKaryaInovasiCard={renderKaryaInovasiCard}
        kategoriShare={kategoriShare} setKategoriShare={setKategoriShare}
      />

      {showDetailPrestasi && (
        <ModalDetailPrestasi 
          myPrestasiDetail={myPrestasiDetail} setShowDetailPrestasi={setShowDetailPrestasi}
        />
      )}

    </div>
  );
}
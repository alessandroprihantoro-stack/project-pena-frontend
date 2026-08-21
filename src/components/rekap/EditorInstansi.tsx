/* eslint-disable */
// @ts-nocheck

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import EditorKurikulum from './EditorKurikulum';
import EditorBukuInduk, { LocalTeacherData } from './EditorBukuInduk';

export interface KurikulumItem {
  id?: number;
  sekolah?: string;
  npsn?: string;
  mapel: string;
  kategori_mapel?: string;
  rombel: number;
  rombel_gabungan?: number;
  jp: number;
  jp_p5?: number;
}

// 🌟 REVISI (FLATTEN): Menggabungkan Mapel Wajib, Pilihan, dan Muatan Lokal SMA jadi 1 List
const MAPEL_SMA = Array.from(new Set([
  'Pendidikan Agama Islam dan Budi Pekerti',
  'Pendidikan Agama Kristen dan Budi Pekerti',
  'Pendidikan Agama Katolik dan Budi Pekerti',
  'Pendidikan Agama Buddha dan Budi Pekerti',
  'Pendidikan Agama Hindu dan Budi Pekerti',
  'Pendidikan Agama Khonghucu dan Budi Pekerti',
  'Pendidikan Pancasila',
  'Bahasa Indonesia',
  'Matematika',
  'Ilmu Pengetahuan Alam (IPA)',
  'Ilmu Pengetahuan Sosial (IPS)',
  'Bahasa Inggris',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
  'Informatika',
  'Seni Budaya (dan Prakarya)',
  'Sejarah',
  'Bimbingan Konseling', 
  'Muatan Lokal',
  'Antropologi', 
  'Bahasa Arab', 
  'Bahasa Indonesia Tingkat Lanjut', 
  'Bahasa Inggris Tingkat Lanjut', 
  'Bahasa Jepang', 
  'Bahasa Jerman', 
  'Bahasa Korea', 
  'Bahasa Mandarin', 
  'Bahasa Prancis', 
  'Biologi', 
  'Ekonomi', 
  'Fisika', 
  'Geografi', 
  'Kimia', 
  'Koding dan Kecerdasan Artifisial', 
  'Mata pelajaran lainnya sesuai sumber daya',
  'Matematika Tingkat Lanjut', 
  'Prakarya dan Kewirausahaan', 
  'Sejarah Tingkat Lanjut', 
  'Sosiologi'
])).sort();

const MAPEL_SLB = ['Pendidikan Agama Islam', 'Pendidikan Agama Kristen', 'Pendidikan Agama Katolik', 'Pendidikan Agama Hindu', 'Pendidikan Agama Buddha', 'Pendidikan Pancasila', 'Bahasa Indonesia', 'Matematika', 'Bahasa Inggris', 'PJOK', 'Seni Budaya', 'Program Kebutuhan Khusus', 'Keterampilan Pilihan', 'Bimbingan Konseling', 'Muatan Lokal Bahasa Jawa'].sort();
const MAPEL_SMK = ['Pendidikan Agama Islam', 'Pendidikan Agama Kristen', 'Pendidikan Agama Katolik', 'Pendidikan Agama Hindu', 'Pendidikan Agama Buddha', 'Pendidikan Pancasila', 'Bahasa Indonesia', 'Bahasa Inggris', 'Matematika', 'PJOK', 'Sejarah', 'Seni Budaya', 'Informatika', 'Projek IPAS', 'Bimbingan Konseling', 'Muatan Lokal Bahasa Jawa'].sort();

const LIST_KECAMATAN = [
    'Colomadu', 'Gondangrejo', 'Jaten', 'Jatipuro', 'Jatiyoso', 'Jenawi', 'Jumantono', 'Jumapolo', 'Karanganyar', 'Karangpandan', 'Kebakkramat', 'Kerjo', 'Matesih', 'Mojogedang', 'Ngargoyoso', 'Tasikmadu', 'Tawangmangu',
    'Gemolong', 'Gesi', 'Gondang', 'Jenar', 'Kalijambe', 'Karangmalang', 'Kedawung', 'Masaran', 'Miri', 'Mondokan', 'Ngrampal', 'Plupuh', 'Sambirejo', 'Sambungmacan', 'Sidoharjo', 'Sragen', 'Sukodono', 'Sumberlawang', 'Tangen', 'Tanon',
    'Baturetno', 'Batuwarno', 'Bulukerto', 'Eromoko', 'Girimarto', 'Giritontro', 'Giriwoyo', 'Jatipurno', 'Jatiroto', 'Jatisrono', 'Karangtengah', 'Kismantoro', 'Manyaran', 'Ngadirojo', 'Nguntoronadi', 'Paranggupito', 'Pracimantoro', 'Puhpelem', 'Purwantoro', 'Selogiri', 'Slogohimo', 'Tirtomoyo', 'Wonogiri', 'Wuryantoro'
].sort();

interface MasterSekolah { npsn: string; nama_sekolah: string; jenjang: string; kabupaten: string; kecamatan: string; total_rombel?: number; jumlah_guru?: number; }

const EditorInstansi = () => {
  const [masterSekolahList, setMasterSekolahList] = useState<MasterSekolah[]>([]);
  const { profile } = useAuth();
  
  const userRole = profile?.role?.toLowerCase() || '';
  const isAdminOrCabdin = ['admin', 'super_admin', 'cabdin'].includes(userRole);
  
  const [liveSekolahBinaan, setLiveSekolahBinaan] = useState<string[]>([]);
  const [debugNip, setDebugNip] = useState<string>('');
  
  const [selectedNpsn, setSelectedNpsn] = useState<string>('');
  const [selectedSchoolData, setSelectedSchoolData] = useState<MasterSekolah | null>(null);
  
  // Menambahkan nama_sekolah ke dalam state profil agar bisa diedit jika sekolahnya baru/injeksi
  const [profilSekolah, setProfilSekolah] = useState({ jenjang: 'SMA', kabupaten: '', kecamatan: '', total_rombel: 0, jumlah_guru: 0, nama_sekolah: '' });
  
  const [schoolTeachers, setSchoolTeachers] = useState<LocalTeacherData[]>([]);
  const [kurikulum, setKurikulum] = useState<KurikulumItem[]>([]);
  
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const SECRET_PIN = "6irisaka"; 

  useEffect(() => {
    const fetchInitialData = async () => {
      // 1. Tarik Daftar Master Sekolah
      const { data: sekolahData } = await supabase.from('master_sekolah').select('*').order('jenjang').order('nama_sekolah');
      if (sekolahData) setMasterSekolahList(sekolahData as MasterSekolah[]);

      // 2. Tarik Binaan Khusus Pengawas Langsung dari master_users
      if (userRole === 'pengawas') {
          try {
              const { data: authData } = await supabase.auth.getUser();
              const email = authData.user?.email || '';
              const usernameAkurat = profile?.nomor_induk || profile?.username || email.split('@')[0];
              setDebugNip(usernameAkurat); 

              const { data: masterData } = await supabase
                  .from('master_users')
                  .select('sekolah_binaan')
                  .ilike('username', usernameAkurat)
                  .maybeSingle();

              if (masterData?.sekolah_binaan) {
                  let parsedArray: string[] = [];
                  if (Array.isArray(masterData.sekolah_binaan)) {
                      parsedArray = masterData.sekolah_binaan.map(String);
                  } else if (typeof masterData.sekolah_binaan === 'string') {
                      parsedArray = JSON.parse(masterData.sekolah_binaan).map(String);
                  }
                  setLiveSekolahBinaan(parsedArray.map(npsn => npsn.trim().toUpperCase()));
              }
          } catch (e) {
              console.error("Gagal menarik live sekolah binaan:", e);
          }
      }
    };
    fetchInitialData();
  }, [userRole, profile]);

  // 🌟 ENGINE PENYATUAN DAN INJEKSI DATA (SUPER PRESISI)
  const allowedSekolahList = masterSekolahList.filter(sek => {
      if (isAdminOrCabdin) return true;
      const npsnDb = String(sek.npsn).toUpperCase().trim();
      return liveSekolahBinaan.includes(npsnDb);
  });

  // 🌟 LAKUKAN INJEKSI JIKA ADA NPSN BINAAN YANG HILANG DARI TABEL MASTER
  if (!isAdminOrCabdin && liveSekolahBinaan.length > 0) {
      liveSekolahBinaan.forEach(npsnBinaan => {
          const isExistInMaster = allowedSekolahList.some(sek => String(sek.npsn).toUpperCase().trim() === npsnBinaan);
          if (!isExistInMaster) {
              // Masukkan sebagai sekolah hantu / baru agar tetap bisa dipilih oleh pengawas!
              allowedSekolahList.push({
                  npsn: npsnBinaan,
                  nama_sekolah: `⚠️ BELUM ADA DI DATABASE (NPSN: ${npsnBinaan})`,
                  jenjang: 'SMA', 
                  kabupaten: '',
                  kecamatan: ''
              });
          }
      });
  }

  const handleSelectSchool = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const npsn = e.target.value;
    setSelectedNpsn(npsn);
    const school = allowedSekolahList.find(s => s.npsn === npsn) || null;
    setSelectedSchoolData(school);
    setIsUnlocked(false);
    setPasswordInput('');
    setSchoolTeachers([]);
    setKurikulum([]);
  };

  const handleUnlock = async () => {
    if (passwordInput === SECRET_PIN && selectedSchoolData) {
        setIsUnlocked(true);
        setIsLoadingData(true);
        
        // Bersihkan nama sekolah jika itu adalah sekolah hasil injeksi
        const rawName = selectedSchoolData.nama_sekolah;
        const cleanName = rawName.includes('⚠️') ? '' : rawName;

        setProfilSekolah({ 
            jenjang: selectedSchoolData.jenjang || 'SMA', 
            kabupaten: selectedSchoolData.kabupaten || '', 
            kecamatan: selectedSchoolData.kecamatan || '', 
            total_rombel: selectedSchoolData.total_rombel || 0, 
            jumlah_guru: selectedSchoolData.jumlah_guru || 0,
            nama_sekolah: cleanName
        });
        
        try {
            const { data: teacherData } = await supabase.from('guru_kelebihan').select('*').eq('npsn', selectedNpsn);
            if (teacherData) {
                setSchoolTeachers(teacherData.map(t => ({
                   id: t.id, nama: t.nama, nip: t.nip, pangkat: t.pangkat, statusPegawai: t.status_pegawai, ijasah: t.ijasah, 
                   bidangStudi: t.bidang_studi, tugasMengajar: t.tugas_mengajar, jamMengajar: t.jam_mengajar, 
                   tugasNonLinier: t.tugas_non_linier || '', jamNonLinier: t.jam_non_linier || 0,
                   tugasNonLinier2: t.tugas_non_linier_2 || '', jamNonLinier2: t.jam_non_linier_2 || 0,
                   jamTambahan: t.jam_tambahan, rincianTugasTambahan: t.rincian_tugas_tambahan, totalJam: t.total_jam, kecamatan: t.kecamatan, alamat: t.alamat, 
                   bulanTahunPensiun: t.bulan_tahun_pensiun || '', sekolah: t.sekolah,
                   is_rekomendasi_internal: t.is_rekomendasi_internal || false,
                   alasanRekomendasi: t.alasan_rekomendasi || ''
                })));
            }

            const { data: kurikulumData } = await supabase.from('master_kurikulum').select('*').eq('npsn', selectedNpsn);
            if (kurikulumData && kurikulumData.length > 0) {
                setKurikulum(kurikulumData.map((d, index) => ({ 
                    id: d.id || (Date.now() + index), sekolah: d.sekolah, mapel: d.mapel, kategori_mapel: d.kategori_mapel || 'UMUM',
                    rombel: d.rombel, rombel_gabungan: d.rombel_gabungan || 0, jp: d.jp, jp_p5: d.jp_p5 || 0
                })));
            } else {
                setKurikulum([]);
            }
        } catch (error) { console.error(error); alert("Gagal menarik data dari server."); }
        setIsLoadingData(false);
    } else { 
        alert("Akses Ditolak! PIN salah atau Sekolah belum dipilih."); setPasswordInput(''); 
    }
  };

  const handleSimpanTerpadu = async () => {
    if (!selectedSchoolData) return;
    
    const nipList = schoolTeachers.map(t => t.nip).filter(n => n !== '');
    if (new Set(nipList).size !== nipList.length) { alert("❌ Ada NIP ganda! Silakan periksa kembali."); return; }
    
    // Validasi nama sekolah jika baru
    const finalSchoolName = profilSekolah.nama_sekolah.trim() || selectedSchoolData.nama_sekolah.replace('⚠️ BELUM ADA DI DATABASE (NPSN: ', '').replace(')', '');

    setIsSaving(true);
    try {
      // 🌟 REVISI: Menggunakan UPSERT agar sekolah yang baru diinjeksi bisa langsung terdaftar di database!
      await supabase.from('master_sekolah').upsert({ 
          npsn: selectedNpsn,
          nama_sekolah: finalSchoolName,
          jenjang: profilSekolah.jenjang, 
          kabupaten: profilSekolah.kabupaten, 
          kecamatan: profilSekolah.kecamatan, 
          total_rombel: profilSekolah.total_rombel, 
          jumlah_guru: profilSekolah.jumlah_guru 
      }, { onConflict: 'npsn' });
      
      await supabase.from('guru_kelebihan').delete().eq('npsn', selectedNpsn);
      if (schoolTeachers.length > 0) {
        await supabase.from('guru_kelebihan').insert(schoolTeachers.map(t => ({
          npsn: selectedNpsn, sekolah: finalSchoolName, nama: t.nama, nip: t.nip, pangkat: t.pangkat, status_pegawai: t.statusPegawai, ijasah: t.ijasah, 
          bidang_studi: t.bidangStudi, tugas_mengajar: t.tugasMengajar, jam_mengajar: Number(t.jamMengajar) || 0, 
          tugas_non_linier: t.tugasNonLinier || '', jam_non_linier: Number(t.jamNonLinier) || 0, 
          tugas_non_linier_2: t.tugasNonLinier2 || '', jam_non_linier_2: Number(t.jamNonLinier2) || 0,
          jam_tambahan: Number(t.jamTambahan) || 0, rincian_tugas_tambahan: t.rincianTugasTambahan || '', total_jam: Number(t.totalJam) || 0, kecamatan: t.kecamatan || '', alamat: t.alamat, bulan_tahun_pensiun: t.bulanTahunPensiun || '',
          is_rekomendasi_internal: t.is_rekomendasi_internal || false,
          alasan_rekomendasi: t.alasanRekomendasi || ''
        })));
      }

      await supabase.from('master_kurikulum').delete().eq('npsn', selectedNpsn);
      const validKurikulum = kurikulum.filter(k => k.mapel && k.rombel > 0);
      if (validKurikulum.length > 0) {
          await supabase.from('master_kurikulum').insert(validKurikulum.map(k => ({
              npsn: selectedNpsn, sekolah: finalSchoolName, mapel: k.mapel, kategori_mapel: k.kategori_mapel || 'UMUM', rombel: k.rombel, rombel_gabungan: k.rombel_gabungan || 0, jp: k.jp || 0, jp_p5: k.jp_p5 || 0
          })));
      }
      
      alert("🎉 Seluruh Data berhasil disimpan!");
      setTimeout(() => { window.location.reload(); }, 800); 
    } catch (error) { 
        console.error(error);
        alert("❌ Gagal menyimpan data."); 
        setIsSaving(false); 
    } 
  };

  const handleCancelEdit = () => { setSelectedNpsn(''); setSelectedSchoolData(null); setSchoolTeachers([]); setKurikulum([]); setIsUnlocked(false); setPasswordInput(''); };
  
  const baseMapels = profilSekolah.jenjang === 'SMK' ? MAPEL_SMK : profilSekolah.jenjang === 'SLB' ? MAPEL_SLB : MAPEL_SMA;
  const dynamicMapels = Array.from(new Set([...baseMapels, ...kurikulum.map(k => k.mapel).filter(m => m.trim() !== '')])).sort();

  const reportData = kurikulum.map(k => {
      let totalJP: number; 
      if (profilSekolah.jenjang === 'SMA') {
          totalJP = (k.rombel * (k.jp || 0)) + (k.rombel * (k.jp_p5 || 0));
      } else if (profilSekolah.jenjang === 'SLB') {
          const effRombel = k.rombel_gabungan && k.rombel_gabungan > 0 ? k.rombel_gabungan : k.rombel;
          totalJP = effRombel * (k.jp || 0);
      } else {
          totalJP = k.rombel * (k.jp || 0);
      }
      
      const ideal = Math.ceil(totalJP / 24);
      
      const riil = schoolTeachers.filter(t => 
          t.bidangStudi === k.mapel || 
          t.tugasMengajar === k.mapel || 
          t.tugasNonLinier === k.mapel || 
          t.tugasNonLinier2 === k.mapel
      ).length;

      const selisih = riil - ideal;
      return { mapel: k.mapel, ideal, riil, selisih };
  }).filter(item => item.mapel.trim() !== '' && item.mapel !== 'PRODUKTIF_PENDING' && item.mapel !== 'PILIHAN_PENDING');

  const listKekurangan = reportData.filter(d => d.selisih < 0);
  const listKelebihan = reportData.filter(d => d.selisih > 0);
  const listPas = reportData.filter(d => d.selisih === 0);

  return (
    <>
      <div className="border-t border-slate-700 pt-5 mt-5 print:hidden max-w-3xl mx-auto">
        <div className="bg-slate-900/40 p-5 rounded-xl border border-emerald-700/50 shadow-inner">
           <h2 className="text-sm font-bold text-emerald-500/80 uppercase tracking-wider mb-4 flex items-center gap-2">📝 Pusat Manajemen Pendidik (Terkunci)</h2>
           
           {!isAdminOrCabdin && allowedSekolahList.length === 0 ? (
               <div className="text-center py-6 px-4 bg-rose-950/30 rounded-lg border border-rose-900/50">
                   <p className="text-rose-400 font-bold text-base uppercase tracking-widest mb-1">⚠️ Akses Terkunci</p>
                   <p className="text-slate-400 text-xs mb-4">Anda belum memiliki daftar sekolah binaan. Hubungi Admin Cabdin.</p>
                   
                   {/* 🌟 VISUAL DEBUGGER 🌟 */}
                   <div className="text-left bg-slate-950 p-4 rounded-md border border-slate-800 text-[10px] font-mono text-slate-500 overflow-x-auto">
                       <p className="text-emerald-500 font-bold mb-1 border-b border-slate-800 pb-1">⚡ SYSTEM DEBUGGER:</p>
                       <p>Extracted Username : <span className="text-slate-300">{debugNip || 'Loading...'}</span></p>
                       <p>Fetched Binaan Data: <span className="text-slate-300">{JSON.stringify(liveSekolahBinaan)}</span></p>
                       <p>Matched Schools    : <span className="text-rose-400">0 from {masterSekolahList.length}</span></p>
                   </div>
               </div>
           ) : (
               <select className="w-full bg-slate-950 border border-emerald-600/50 text-emerald-400 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-400 shadow-sm" value={selectedNpsn} onChange={handleSelectSchool}>
                 <option value="">-- Pilih Master Instansi Pendidikan --</option>
                 {allowedSekolahList.map(sek => (
                      <option key={sek.npsn} value={sek.npsn}>
                          {sek.nama_sekolah.includes('⚠️') ? sek.nama_sekolah : `[${sek.jenjang}] ${sek.nama_sekolah} - NPSN: ${sek.npsn}`}
                      </option>
                 ))}
               </select>
           )}
        </div>
      </div>

      {selectedSchoolData && (
        <div className="bg-slate-800 p-6 rounded-xl border-2 border-emerald-600/50 shadow-2xl mt-6 print:hidden animate-fade-in-up">
          {!isUnlocked ? (
            <div className="py-12 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-red-900/30 text-red-400 flex items-center justify-center mb-4">🔒</div>
              <p className="text-sm text-slate-400 mb-6 text-center">Masukkan PIN Otorisasi untuk <b>{selectedSchoolData.nama_sekolah}</b></p>
              <div className="flex gap-2">
                <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-center text-white" />
                <button onClick={handleUnlock} className="bg-cyan-600 hover:bg-cyan-500 px-6 py-2 rounded-lg font-bold">Buka Akses</button>
              </div>
            </div>
          ) : isLoadingData ? (
             <div className="py-12 text-center text-emerald-400 font-bold animate-pulse">Menarik Data dari Server...</div>
          ) : (
            <div>
              <div className="mb-6 border-b border-slate-700 pb-4">
                 <h3 className="text-xl font-bold text-white uppercase">{selectedSchoolData.nama_sekolah}</h3>
                 <p className="text-xs text-slate-400 mt-1">Ikuti 3 langkah di bawah ini secara berurutan untuk mendapatkan Laporan Audit yang akurat.</p>
              </div>

              {/* 🌟 LANGKAH 1: PROFIL INSTANSI */}
              <div className="bg-slate-900/50 p-5 rounded-xl border border-blue-600/50 mb-8 shadow-inner">
                  <div className="mb-4 border-b border-slate-700 pb-3">
                      <h4 className="text-sm font-bold text-blue-400 uppercase tracking-wider">1. Profil & Identitas Instansi</h4>
                      <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
                          <b>PENTING:</b> Jumlah Rombel akan digunakan sebagai acuan pada <span className="text-fuchsia-400 font-bold">Tahap 2</span> untuk menentukan jumlah ideal guru. Total Guru digunakan untuk perbandingan saat input struktur kurikulum.
                      </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div><label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NPSN (Terkunci)</label><input type="text" value={selectedSchoolData.npsn} readOnly className="w-full bg-slate-950 border border-slate-700 text-slate-500 rounded px-3 py-2 text-sm cursor-not-allowed" /></div>
                      
                      {/* Form Penamaan Sekolah jika sekolahnya Injeksi / Baru */}
                      {selectedSchoolData.nama_sekolah.includes('⚠️') && (
                          <div className="md:col-span-2">
                              <label className="block text-[10px] font-bold text-rose-400 uppercase mb-1">Nama Instansi Resmi (Wajib Diisi)</label>
                              <input type="text" value={profilSekolah.nama_sekolah} onChange={(e) => setProfilSekolah({...profilSekolah, nama_sekolah: e.target.value})} placeholder="Contoh: SMA NEGERI 1 SRAGEN" className="w-full bg-slate-900 border border-rose-500/50 text-white rounded px-3 py-2 text-sm" />
                          </div>
                      )}

                      <div>
                          <label className="block text-[10px] font-bold text-blue-300 uppercase mb-1">Jenjang Pendidikan</label>
                          <select value={profilSekolah.jenjang} onChange={(e) => setProfilSekolah({...profilSekolah, jenjang: e.target.value})} className="w-full bg-slate-900 border border-blue-500/50 text-white font-bold rounded px-3 py-2 text-sm">
                              <option value="SMA">SMA</option>
                              <option value="SMK">SMK</option>
                              <option value="SLB">SLB</option>
                          </select>
                      </div>

                      <div><label className="block text-[10px] font-bold text-blue-300 uppercase mb-1">Total Rombel Aktif (Target)</label><input type="number" min="0" value={profilSekolah.total_rombel} onChange={(e) => setProfilSekolah({...profilSekolah, total_rombel: Number(e.target.value)})} className="w-full bg-slate-900 border border-blue-500/50 text-amber-300 font-black rounded px-3 py-2 text-sm" /></div>
                      <div><label className="block text-[10px] font-bold text-blue-300 uppercase mb-1">Total Guru di Sekolah (Target)</label><input type="number" min="0" value={profilSekolah.jumlah_guru} onChange={(e) => setProfilSekolah({...profilSekolah, jumlah_guru: Number(e.target.value)})} className="w-full bg-slate-900 border border-blue-500/50 text-emerald-300 font-black rounded px-3 py-2 text-sm" /></div>
                      
                      <div><label className="block text-[10px] font-bold text-blue-300 uppercase mb-1">Kabupaten</label><select value={profilSekolah.kabupaten} onChange={(e) => setProfilSekolah({...profilSekolah, kabupaten: e.target.value})} className="w-full bg-slate-900 border border-blue-500/50 text-white rounded px-3 py-2 text-sm"><option value="">Pilih...</option><option value="Karanganyar">Karanganyar</option><option value="Sragen">Sragen</option><option value="Wonogiri">Wonogiri</option></select></div>
                      <div><label className="block text-[10px] font-bold text-blue-300 uppercase mb-1">Kecamatan Domisili</label>
                      <select value={profilSekolah.kecamatan} onChange={(e) => setProfilSekolah({...profilSekolah, kecamatan: e.target.value})} className="w-full bg-slate-900 border border-blue-500/50 text-white rounded px-3 py-2 text-sm">
                          <option value="">Pilih Kecamatan...</option>
                          {LIST_KECAMATAN.map(kec => <option key={kec} value={kec}>{kec}</option>)}
                      </select></div>
                  </div>
              </div>

              {/* 🌟 LANGKAH 2: KURIKULUM */}
              <EditorKurikulum kurikulum={kurikulum} setKurikulum={setKurikulum} profilSekolah={profilSekolah} baseMapels={baseMapels} schoolTeachers={schoolTeachers} selectedSchoolData={selectedSchoolData} />
              
              {/* 🌟 LANGKAH 3: BUKU INDUK */}
              <EditorBukuInduk 
                  schoolTeachers={schoolTeachers} 
                  setSchoolTeachers={setSchoolTeachers} 
                  baseMapels={dynamicMapels} 
                  selectedSchoolData={selectedSchoolData} 
                  jenjangSekolah={profilSekolah.jenjang} 
                  isSekolahBinaan={true}
                  userRole={userRole} 
              />

              {/* 🌟 LANGKAH 4: RANGKUMAN AUDIT (LIVE) */}
              <div className="bg-slate-950 p-6 rounded-xl border-2 border-indigo-500/50 mb-8 shadow-2xl">
                  <h4 className="text-lg font-black text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">📊 4. Hasil Detail Laporan (Sekolah Ini)</h4>
                  
                  <p className="text-xs text-slate-400 mb-6 border-b border-slate-800 pb-4 leading-relaxed">
                      Laporan ini dibuat otomatis berdasarkan hasil persilangan antara <b>Tahap 2 (Kurikulum)</b> dan <b>Tahap 3 (Buku Induk)</b> dengan mengacu jumlah jam mapel saja, tidak termasuk jam tugas tambahan, agar penghitungannya berdasarkan jam mengajar tidak melibatkan jam tugas tambahan.
                  </p>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* BLOK KEKURANGAN */}
                      <div className="bg-rose-950/20 border border-rose-900/50 p-4 rounded-xl">
                          <h5 className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-4 border-b border-rose-900/50 pb-2">📉 Kekurangan Guru Mata Pelajaran</h5>
                          {listKekurangan.length === 0 ? ( <div className="text-slate-500 italic text-[10px]">Tidak ada kekurangan guru.</div> ) : (
                              <ul className="space-y-2">
                                  {listKekurangan.map(item => (
                                      <li key={item.mapel} className="flex justify-between items-center bg-rose-900/20 border border-rose-800/30 p-2 rounded">
                                          <span className="text-xs font-bold text-rose-100">{item.mapel}</span>
                                          <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-1 rounded">Kurang {Math.abs(item.selisih)}</span>
                                      </li>
                                  ))}
                              </ul>
                          )}
                      </div>

                      {/* BLOK KELEBIHAN */}
                      <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-xl">
                          <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4 border-b border-emerald-900/50 pb-2">📈 Kelebihan Guru Mata Pelajaran</h5>
                          {listKelebihan.length === 0 ? ( <div className="text-slate-500 italic text-[10px]">Tidak ada kelebihan guru.</div> ) : (
                              <div className="space-y-4">
                                  <p className="text-[10px] text-emerald-200/70 italic leading-tight">
                                      *Bila terdapat kelebihan guru, Pengawas Binaan dapat langsung memberikan <b>🌟 Rekomendasi Mutasi</b> dengan menekan tombol pada profil guru bersangkutan di Tahap 3.
                                  </p>
                                  <ul className="space-y-2">
                                      {listKelebihan.map(item => (
                                          <li key={item.mapel} className="flex justify-between items-center bg-emerald-900/20 border border-emerald-800/30 p-2 rounded">
                                              <span className="text-xs font-bold text-emerald-100">{item.mapel}</span>
                                              <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-1 rounded">Lebih {item.selisih}</span>
                                          </li>
                                      ))}
                                  </ul>
                              </div>
                          )}
                      </div>
                  </div>
                  
                  {listPas.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                           <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">✅ Mata Pelajaran Terpenuhi (Ideal):</h5>
                           <div className="flex flex-wrap gap-2">
                               {listPas.map(item => (
                                   <span key={item.mapel} className="bg-blue-900/20 border border-blue-800/50 text-blue-200 text-[9px] px-2 py-1 rounded">{item.mapel}</span>
                               ))}
                           </div>
                      </div>
                  )}

              </div>

              {/* TOMBOL SIMPAN */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-700 pt-6">
                <button onClick={handleCancelEdit} disabled={isSaving} className="w-full sm:w-auto px-6 py-3 rounded-lg font-bold transition-all text-slate-300 bg-slate-700 hover:bg-slate-600">❌ BATAL / TUTUP</button>
                <button onClick={handleSimpanTerpadu} disabled={isSaving} className={`w-full sm:w-auto px-10 py-3 rounded-lg font-black transition-all shadow-lg ${isSaving ? 'bg-emerald-800 text-emerald-500 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-900/50 hover:scale-105'}`}>
                  {isSaving ? '⏳ MENYIMPAN DATABASE TERPADU...' : '💾 SIMPAN SEMUA DATA'}
                </button>
              </div>

            </div>
          )}
        </div>
      )}
    </>
  );
};
export default EditorInstansi;
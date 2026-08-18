import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../../supabaseClient';
import { TeacherData } from './DashboardStatistik';

interface EditorProps {
  mapelList: string[]; // Tetap di interface agar file induk tidak error, meski tidak dipakai
  listSekolahFilter: string[];
  allTeachers: TeacherData[];
}

interface KurikulumItem {
  id: number;
  mapel: string;
  rombel: number;
  jp: number;
}

// =========================================================================
// FITUR BARU: KAMUS MATA PELAJARAN SPESIFIK BERDASARKAN JENJANG (KURIKULUM MERDEKA)
// =========================================================================
const MAPEL_SMA = [
  'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Pancasila', 'Bahasa Indonesia',
  'Bahasa Inggris', 'Matematika', 'PJOK', 'Sejarah', 'Seni Budaya', 'Informatika',
  'Fisika', 'Kimia', 'Biologi', 'Matematika Tingkat Lanjut', 
  'Ekonomi', 'Sosiologi', 'Geografi', 'Antropologi', 
  'Bahasa Jepang', 'Bahasa Mandarin', 'Bahasa Jerman', 'Bahasa Prancis', 'Bahasa Arab', 
  'Prakarya dan Kewirausahaan', 'Bimbingan Konseling'
].sort();

const MAPEL_SMK = [
  'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Pancasila', 'Bahasa Indonesia',
  'Bahasa Inggris', 'Matematika', 'PJOK', 'Sejarah', 'Seni Budaya', 'Informatika',
  'Pemrograman / Jaringan Komputer / Basis Data (TKJ/RPL)', 
  'Praktikum Akuntansi / Administrasi Keuangan', 
  'Pengolahan Makanan / Pastry / Gizi (Tata Boga)', 
  'Perawatan Kendaraan Ringan / Kelistrikan (Otomotif)', 
  'Desain Grafis / Animasi / Videografi (Multimedia)', 
  'Kejuruan Perhotelan', 'Kejuruan Farmasi', 'Kejuruan Keperawatan',
  'Projek IPAS', 'Bimbingan Konseling'
].sort();

const MAPEL_SLB = [
  'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Pancasila', 'Bahasa Indonesia',
  'Matematika', 'Bahasa Inggris', 'PJOK', 'Seni Budaya',
  'Program Kebutuhan Khusus', 'Keterampilan Pilihan', 'Bimbingan Konseling'
].sort();

const getJenjangSekolah = (namaSekolah: string): string => {
    if (!namaSekolah) return 'SMA';
    const upper = namaSekolah.toUpperCase();
    if (upper.includes('SMK')) return 'SMK';
    if (upper.includes('SLB')) return 'SLB';
    return 'SMA'; 
};
// =========================================================================

const calculatePensiunFromNIP = (nip: string, statusPegawai: string): string => {
    if (statusPegawai !== 'PNS' || !nip) return '';
    const cleanNIP = nip.replace(/[^0-9]/g, '');
    if (cleanNIP.length >= 8) {
        const yearStr = cleanNIP.substring(0, 4);
        const monthStr = cleanNIP.substring(4, 6);
        const birthYear = parseInt(yearStr);
        const birthMonth = parseInt(monthStr);

        if (birthYear > 1900 && birthYear < 2100 && birthMonth >= 1 && birthMonth <= 12) {
            let pensiunYear = birthYear + 60; 
            let pensiunMonth = birthMonth + 1; 
            if (pensiunMonth > 12) { pensiunMonth = 1; pensiunYear += 1; }
            return `${pensiunYear}-${String(pensiunMonth).padStart(2, '0')}`;
        }
    }
    return '';
};

const LIST_KECAMATAN = [
  'Colomadu', 'Gondangrejo', 'Jaten', 'Jatipuro', 'Jatiyoso', 'Jenawi', 'Jumantono', 'Jumapolo', 'Karanganyar', 'Karangpandan', 'Kebakkramat', 'Kerjo', 'Matesih', 'Mojogedang', 'Ngargoyoso', 'Tasikmadu', 'Tawangmangu',
  'Gemolong', 'Gesi', 'Gondang', 'Jenar', 'Kalijambe', 'Karangmalang', 'Kedawung', 'Masaran', 'Miri', 'Mondokan', 'Ngrampal', 'Plupuh', 'Sambirejo', 'Sambungmacan', 'Sidoharjo', 'Sragen', 'Sukodono', 'Sumberlawang', 'Tangen', 'Tanon',
  'Baturetno', 'Batuwarno', 'Bulukerto', 'Eromoko', 'Girimarto', 'Giritontro', 'Giriwoyo', 'Jatipurno', 'Jatiroto', 'Jatisrono', 'Karangtengah', 'Kismantoro', 'Manyaran', 'Ngadirojo', 'Nguntoronadi', 'Paranggupito', 'Pracimantoro', 'Puhpelem', 'Purwantoro', 'Selogiri', 'Slogohimo', 'Tirtomoyo', 'Wonogiri', 'Wuryantoro'
].sort();

// PERBAIKAN 1: Menghilangkan 'mapelList' dari kurung kurawal agar linter tidak marah
const EditorInstansi: React.FC<EditorProps> = ({ listSekolahFilter, allTeachers }) => {
  const [editSekolah, setEditSekolah] = useState<string>('');
  
  const [schoolTeachers, setSchoolTeachers] = useState<TeacherData[]>([]);
  const [kurikulum, setKurikulum] = useState<KurikulumItem[]>([]);
  
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const SECRET_PIN = "6irisaka"; 

  const handleSelectEditSekolah = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sek = e.target.value;
    setEditSekolah(sek);
    setIsUnlocked(false);
    setPasswordInput('');
    setSchoolTeachers([]);
    setKurikulum([]);
  };

  const handleUnlock = async () => {
    if (passwordInput === SECRET_PIN) {
        setIsUnlocked(true);
        setIsLoadingData(true);
        
        if (editSekolah === 'NEW') {
            setSchoolTeachers([]);
            setKurikulum([{ id: Date.now(), mapel: '', rombel: 0, jp: 0 }]);
        } else if (editSekolah) {
            const existingTeachers = allTeachers.filter(t => t.sekolah === editSekolah);
            setSchoolTeachers(existingTeachers);

            try {
                const { data } = await supabase.from('master_kurikulum').select('*').eq('sekolah', editSekolah);
                if (data && data.length > 0) {
                    setKurikulum(data.map(d => ({ id: d.id, mapel: d.mapel, rombel: d.rombel, jp: d.jp })));
                } else {
                    setKurikulum([{ id: Date.now(), mapel: '', rombel: 0, jp: 0 }]);
                }
            } catch (error) {
                console.error("Gagal menarik kurikulum:", error);
            }
        }
        setIsLoadingData(false);
    } else { 
        alert("Akses Ditolak! PIN salah."); 
        setPasswordInput(''); 
    }
  };

  const handleSimpanTerpadu = async () => {
    const targetSekolah = editSekolah === 'NEW' ? window.prompt("Masukkan Nama Sekolah Baru:")?.trim() : editSekolah;
    if (!targetSekolah) return;

    setIsSaving(true);

    try {
      await supabase.from('guru_kelebihan').delete().eq('sekolah', targetSekolah);
      if (schoolTeachers.length > 0) {
        const teacherPayload = schoolTeachers.map(t => ({
          sekolah: targetSekolah, nama: t.nama, nip: t.nip, pangkat: t.pangkat, status_pegawai: t.statusPegawai, ijasah: t.ijasah, bidang_studi: t.bidangStudi, tugas_mengajar: t.tugasMengajar, jam_mengajar: Number(t.jamMengajar) || 0, jam_tambahan: Number(t.jamTambahan) || 0, rincian_tugas_tambahan: t.rincianTugasTambahan || '', total_jam: Number(t.totalJam) || 0, kecamatan: t.kecamatan || '', alamat: t.alamat, bulan_tahun_pensiun: t.bulanTahunPensiun || ''
        }));
        const { error: errTeacher } = await supabase.from('guru_kelebihan').insert(teacherPayload);
        if (errTeacher) throw errTeacher;
      }

      await supabase.from('master_kurikulum').delete().eq('sekolah', targetSekolah);
      const validKurikulum = kurikulum.filter(k => k.mapel && k.rombel > 0 && k.jp > 0);
      if (validKurikulum.length > 0) {
          const kurikulumPayload = validKurikulum.map(k => ({
              sekolah: targetSekolah, mapel: k.mapel, rombel: k.rombel, jp: k.jp
          }));
          const { error: errKurikulum } = await supabase.from('master_kurikulum').insert(kurikulumPayload);
          if (errKurikulum) throw errKurikulum;
      }

      alert("🎉 Seluruh Data Kurikulum & Buku Induk Guru berhasil disimpan terpadu!");
      setTimeout(() => { window.location.href = window.location.pathname + '?refresh=' + new Date().getTime(); }, 800); 

    } catch (err: unknown) {
        if (err instanceof Error) alert("❌ Gagal menyimpan data: " + err.message);
        setIsSaving(false);
    } 
  };

  const handleCancelEdit = () => {
    setEditSekolah(''); setSchoolTeachers([]); setKurikulum([]); setIsUnlocked(false); setPasswordInput('');
  };

  const addKurikulumRow = () => setKurikulum([...kurikulum, { id: Date.now(), mapel: '', rombel: 0, jp: 0 }]);
  const removeKurikulumRow = (id: number) => setKurikulum(kurikulum.filter(k => k.id !== id));
  const updateKurikulumRow = (id: number, field: keyof KurikulumItem, value: string | number) => {
      setKurikulum(kurikulum.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  const addSurplusRow = () => setSchoolTeachers([...schoolTeachers, { id: Date.now(), nama: '', nip: '', pangkat: '', statusPegawai: '', ijasah: '', bidangStudi: '', tugasMengajar: '', jamMengajar: '', jamTambahan: '', rincianTugasTambahan: '', totalJam: '', kecamatan: '', alamat: '', bulanTahunPensiun: '' }]);
  const updateSurplusRow = (id: string | number, field: keyof TeacherData, value: string | number) => {
    setSchoolTeachers(schoolTeachers.map(teacher => {
      if (teacher.id === id) {
        const updated = { ...teacher, [field]: value };
        if (field === 'jamMengajar' || field === 'jamTambahan') updated.totalJam = (Number(updated.jamMengajar) || 0) + (Number(updated.jamTambahan) || 0);
        if (field === 'nip' || field === 'statusPegawai') {
            const autoPensiun = calculatePensiunFromNIP(updated.nip, updated.statusPegawai);
            if (autoPensiun) updated.bulanTahunPensiun = autoPensiun;
        }
        return updated;
      }
      return teacher;
    }));
  };
  const removeSurplusRow = (id: string | number) => setSchoolTeachers(schoolTeachers.filter(t => t.id !== id));

  const handleDownloadTemplate = () => {
    const headers = ["Nama Lengkap", "NIP", "Pangkat/Golongan", "Status Pegawai", "Ijazah S1", "Bidang Studi Serdik", "Tugas Mengajar", "Jam Mengajar", "Jam Tambahan", "Rincian Tambahan", "Total Jam", "Kecamatan Domisili", "Alamat Domisili"];
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(";") + "\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", "Template_Data_Semua_Guru.csv"); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!window.confirm("⚠️ PERHATIAN:\nData dari Excel akan MENGGANTIKAN seluruh data guru di tabel bawah. Lanjutkan?")) {
        if (fileInputRef.current) fileInputRef.current.value = ''; return;
    }
    Papa.parse(file, {
        header: true, skipEmptyLines: true,
        complete: function(results) {
            const parsedData = results.data as Record<string, string>[];
            const newTeachers: TeacherData[] = parsedData.map((row, idx) => {
                const jm = parseInt(row['Jam Mengajar']); const jt = parseInt(row['Jam Tambahan']); const tj = parseInt(row['Total Jam']);
                const parsedNip = row['NIP'] || ''; const parsedStatus = row['Status Pegawai'] || '';
                let pensiun = ''; if (parsedStatus.toUpperCase().includes('PNS')) pensiun = calculatePensiunFromNIP(parsedNip, 'PNS');
                const rawKecamatan = (row['Kecamatan Domisili'] || '').trim();
                let validKecamatan = '';
                if (LIST_KECAMATAN.some(k => k.toLowerCase() === rawKecamatan.toLowerCase())) validKecamatan = LIST_KECAMATAN.find(k => k.toLowerCase() === rawKecamatan.toLowerCase()) || '';
                return {
                    id: Date.now() + idx, nama: row['Nama Lengkap'] || '', nip: parsedNip, pangkat: row['Pangkat/Golongan'] || '', statusPegawai: parsedStatus, ijasah: row['Ijazah S1'] || '', bidangStudi: row['Bidang Studi Serdik'] || '', tugasMengajar: row['Tugas Mengajar'] || '', jamMengajar: isNaN(jm) ? '' : jm, jamTambahan: isNaN(jt) ? '' : jt, rincianTugasTambahan: row['Rincian Tambahan'] || '', totalJam: isNaN(tj) ? '' : tj, kecamatan: validKecamatan, alamat: row['Alamat Domisili'] || '', bulanTahunPensiun: pensiun 
                };
            });
            setSchoolTeachers(newTeachers);
            alert("✅ File berhasil diunggah! Kalkulator Rombel di atas otomatis ter-update.");
            if (fileInputRef.current) fileInputRef.current.value = '';
        },
        error: function(err) { alert("❌ Gagal membaca file: " + err.message); }
    });
  };

  const currentJenjang = getJenjangSekolah(editSekolah);
  const baseMapels = currentJenjang === 'SMK' ? MAPEL_SMK : currentJenjang === 'SLB' ? MAPEL_SLB : MAPEL_SMA;
  
  const usedMapels = new Set([
      ...schoolTeachers.map(t => t.bidangStudi),
      ...kurikulum.map(k => k.mapel)
  ]);
  
  const finalMapelList = Array.from(new Set([...baseMapels, ...Array.from(usedMapels)]))
                              .filter(m => m !== '')
                              .sort();

  return (
    <>
      <div className="border-t border-slate-700 pt-5 mt-5 print:hidden">
        <h2 className="text-xs font-bold text-emerald-500/80 uppercase tracking-wider mb-3">📝 Pusat Manajemen Terpadu Pendidik & Kurikulum Instansi</h2>
        <select className="w-full max-w-md bg-slate-950 border border-emerald-700/50 text-emerald-400 rounded-lg px-4 py-2.5 outline-none focus:border-emerald-400 shadow-inner" value={editSekolah} onChange={handleSelectEditSekolah}>
          <option value="">-- Pilih Sekolah untuk Dikelola --</option>
          <option value="NEW" className="text-cyan-400 font-bold">➕ INPUT SEKOLAH BARU</option>
          {listSekolahFilter.map(sek => <option key={sek} value={sek}>{sek}</option>)}
        </select>
      </div>

      {editSekolah && (
        <div className="bg-slate-800 p-6 rounded-xl border-2 border-emerald-600/50 shadow-2xl mt-6 print:hidden animate-fade-in-up">
          {!isUnlocked ? (
            <div className="py-12 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-red-900/30 text-red-400 flex items-center justify-center mb-4">🔒</div>
              <p className="text-sm text-slate-400 mb-6 text-center">Masukkan PIN Otorisasi Instansi</p>
              <div className="flex gap-2">
                <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-center text-white" />
                <button onClick={handleUnlock} className="bg-cyan-600 hover:bg-cyan-500 px-6 py-2 rounded-lg font-bold">Buka Akses</button>
              </div>
            </div>
          ) : isLoadingData ? (
             <div className="py-12 text-center text-emerald-400 font-bold animate-pulse">Sinkronisasi Database Pendidik & Kurikulum...</div>
          ) : (
            <div>
              <div className="mb-6 border-b border-slate-700 pb-4">
                 <h3 className="text-xl font-bold text-white uppercase">{editSekolah === 'NEW' ? 'Sekolah Baru' : editSekolah}</h3>
                 <div className="flex gap-2 items-center mt-1">
                     <span className="bg-indigo-900/50 text-indigo-300 border border-indigo-500 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">
                         JENJANG {currentJenjang}
                     </span>
                     <p className="text-xs text-emerald-400 font-medium">Sistem Integrasi Real-Time: Perubahan di Data Master Kurikulum akan otomatis membaca ketersediaan dari Buku Induk Guru.</p>
                 </div>
              </div>

              {/* ========================================================= */}
              {/* BAGIAN 1: MASTER KURIKULUM & KALKULATOR LIVE              */}
              {/* ========================================================= */}
              <div className="bg-slate-900/50 p-5 rounded-xl border border-fuchsia-600/50 mb-8 shadow-inner">
                  <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-3">
                      <h4 className="text-sm font-bold text-fuchsia-400 uppercase tracking-wider">1. Data Master Kurikulum & Kebutuhan Riil</h4>
                      <button onClick={addKurikulumRow} className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-lg">
                          ➕ Tambah Mapel
                      </button>
                  </div>

                  {/* PERBAIKAN 2: Mengganti max-h-[400px] menjadi max-h-100 */}
                  <div className="space-y-4 max-h-100 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                      {kurikulum.map((item, index) => {
                          const totalJP = (item.rombel || 0) * (item.jp || 0);
                          const idealBulat = Math.ceil(totalJP / 24);
                          const guruEksisting = item.mapel ? schoolTeachers.filter(t => t.bidangStudi === item.mapel).length : 0;
                          const selisih = guruEksisting - idealBulat;
                          
                          let bgStatus = "bg-slate-800 text-slate-400 border-slate-600";
                          let textStatus = "Menunggu Input...";
                          
                          if (item.mapel && totalJP > 0) {
                              if (selisih < 0) {
                                  bgStatus = "bg-rose-900/80 text-rose-200 border-rose-500 font-black";
                                  textStatus = `KURANG ${Math.abs(selisih)} GURU`;
                              } else if (selisih > 0) {
                                  bgStatus = "bg-emerald-900/50 text-emerald-300 border-emerald-500 font-black";
                                  textStatus = `LEBIH ${Math.abs(selisih)} GURU`;
                              } else {
                                  bgStatus = "bg-blue-900/50 text-blue-300 border-blue-500 font-black";
                                  textStatus = "PAS / IDEAL";
                              }
                          }

                          return (
                          <div key={item.id} className="flex flex-col bg-slate-950 p-4 rounded-xl border border-slate-700 shadow-sm relative">
                              <div className="flex flex-col md:flex-row gap-3 items-center">
                                  <div className="w-full md:w-8 flex justify-center items-center text-slate-500 font-bold">{index + 1}.</div>
                                  <div className="w-full md:flex-1">
                                      <select value={item.mapel} onChange={(e) => updateKurikulumRow(item.id, 'mapel', e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-fuchsia-500">
                                          <option value="">Pilih Mata Pelajaran {currentJenjang}...</option>
                                          {finalMapelList.map(m => <option key={m} value={m}>{m}</option>)}
                                      </select>
                                  </div>
                                  <div className="w-full md:w-28">
                                      <input type="number" min="0" placeholder="Jml Rombel" value={item.rombel || ''} onChange={(e) => updateKurikulumRow(item.id, 'rombel', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-fuchsia-500 text-center" />
                                  </div>
                                  <div className="w-full md:w-12 text-center text-slate-500 font-bold text-sm hidden md:block">X</div>
                                  <div className="w-full md:w-28">
                                      <input type="number" min="0" placeholder="JP/Rombel" value={item.jp || ''} onChange={(e) => updateKurikulumRow(item.id, 'jp', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-fuchsia-500 text-center" />
                                  </div>
                                  <div className="w-full md:w-12 flex justify-center">
                                      <button onClick={() => removeKurikulumRow(item.id)} className="bg-rose-900/50 hover:bg-rose-600 text-rose-300 hover:text-white p-2 rounded transition-colors font-bold" title="Hapus Mapel">X</button>
                                  </div>
                              </div>

                              {item.mapel && totalJP > 0 && (
                                  <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-4 items-center justify-between bg-slate-900/50 px-4 py-2 rounded-lg">
                                      <div className="flex gap-6">
                                          <div className="text-center">
                                              <span className="block text-[9px] text-slate-500 uppercase font-bold">Total JP</span>
                                              <span className="text-sm font-bold text-amber-400">{totalJP}</span>
                                          </div>
                                          <div className="text-center border-l border-slate-700 pl-6">
                                              <span className="block text-[9px] text-slate-500 uppercase font-bold">Kebutuhan (Ideal)</span>
                                              <span className="text-sm font-bold text-white">{idealBulat}</span>
                                          </div>
                                          <div className="text-center border-l border-slate-700 pl-6 relative">
                                              <span className="block text-[9px] text-cyan-500 uppercase font-bold">Guru Eksisting (Bawah)</span>
                                              <span className="text-sm font-bold text-cyan-400">{guruEksisting}</span>
                                              <span className="absolute -top-1 -right-3 flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                              </span>
                                          </div>
                                      </div>
                                      <div className={`px-4 py-1.5 rounded-lg border text-xs tracking-wider shadow-sm ${bgStatus}`}>
                                          {textStatus}
                                      </div>
                                  </div>
                              )}
                          </div>
                          );
                      })}
                      {kurikulum.length === 0 && <p className="text-center text-slate-500 py-4 italic">Belum ada struktur kurikulum ditambahkan.</p>}
                  </div>
              </div>

              {/* ========================================================= */}
              {/* BAGIAN 2: BUKU INDUK GURU EKSISTING                       */}
              {/* ========================================================= */}
              <div className="bg-slate-900/50 p-5 rounded-xl border border-cyan-600/50 mb-8 shadow-inner">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 border-b border-slate-700 pb-3">
                  <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">2. Buku Induk Pendidik Riil ({schoolTeachers.length} Guru)</h4>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={handleDownloadTemplate} className="bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">
                      ⬇️ Download Template
                    </button>
                    <div>
                        <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                        <button onClick={() => fileInputRef.current?.click()} className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded text-xs font-bold shadow-lg">
                          ⬆️ Upload Data CSV
                        </button>
                    </div>
                    <button onClick={addSurplusRow} className="bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 rounded text-xs font-bold shadow-lg">
                      ➕ Tambah Baris Manual
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto rounded-lg border border-slate-700 max-h-125" style={{ scrollbarWidth: 'thin' }}>
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-950 text-cyan-400 text-center whitespace-nowrap sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3 border-r border-slate-700">No</th>
                        <th className="p-3 border-r border-slate-700">Nama Lengkap</th>
                        <th className="p-3 border-r border-slate-700 text-amber-300">NIP (Auto Pensiun)</th>
                        <th className="p-3 border-r border-slate-700">Pangkat/Gol.</th>
                        <th className="p-3 border-r border-slate-700">Status Pegawai</th>
                        <th className="p-3 border-r border-slate-700">Ijasah S1</th>
                        <th className="p-3 border-r border-slate-700 text-fuchsia-300">Bidang Studi Serdik</th>
                        <th className="p-3 border-r border-slate-700">Tugas Mengajar</th>
                        <th className="p-3 border-r border-slate-700">Jam Mengajar</th>
                        <th className="p-3 border-r border-slate-700">Jam Tambahan</th>
                        <th className="p-3 border-r border-slate-700 text-amber-300">Rincian Tambahan</th>
                        <th className="p-3 border-r border-slate-700 text-emerald-400">Total Jam</th>
                        <th className="p-3 border-r border-slate-700 text-indigo-300">Kec. Domisili</th>
                        <th className="p-3 border-r border-slate-700 text-cyan-300">Bulan Pensiun</th>
                        <th className="p-3 border-r border-slate-700">Alamat Domisili</th>
                        <th className="p-3">Hapus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schoolTeachers.length === 0 ? (
                        <tr><td colSpan={16} className="text-center py-12 text-slate-500 italic font-medium">Belum ada data guru yang diinputkan di sekolah ini.</td></tr>
                      ) : (
                        schoolTeachers.map((teacher, index) => (
                          <tr key={teacher.id} className="border-b border-slate-700/50">
                            <td className="p-2 border-r border-slate-700/50 text-center text-slate-400">{index + 1}</td>
                            <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.nama} onChange={(e) => updateSurplusRow(teacher.id, 'nama', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none text-white" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.nip} onChange={(e) => updateSurplusRow(teacher.id, 'nip', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-amber-500 outline-none text-amber-100 placeholder-amber-900" placeholder="Ketik NIP..." /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.pangkat} onChange={(e) => updateSurplusRow(teacher.id, 'pangkat', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none text-white" /></td>
                            <td className="p-2 border-r border-slate-700/50">
                              <select value={teacher.statusPegawai} onChange={(e) => updateSurplusRow(teacher.id, 'statusPegawai', e.target.value)} className="w-full min-w-32 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none text-white">
                                <option value="">Pilih Status...</option><option value="PNS">PNS</option><option value="PPPK">PPPK</option><option value="PPPK Paruh Waktu">PPPK Paruh Waktu</option><option value="Non ASN">Non ASN</option>
                              </select>
                            </td>
                            <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.ijasah} onChange={(e) => updateSurplusRow(teacher.id, 'ijasah', e.target.value)} className="w-full min-w-32 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none text-white" /></td>
                            
                            <td className="p-2 border-r border-slate-700/50">
                              <select value={teacher.bidangStudi} onChange={(e) => updateSurplusRow(teacher.id, 'bidangStudi', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-fuchsia-600/50 rounded px-2 py-1.5 focus:border-fuchsia-500 outline-none text-fuchsia-100">
                                <option value="">Pilih Bidang Studi...</option>
                                {finalMapelList.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </td>
                            
                            <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.tugasMengajar} onChange={(e) => updateSurplusRow(teacher.id, 'tugasMengajar', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none text-white" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="number" min="0" value={teacher.jamMengajar} onChange={(e) => updateSurplusRow(teacher.id, 'jamMengajar', e.target.value)} className="w-full min-w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-center text-white" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="number" min="0" value={teacher.jamTambahan} onChange={(e) => updateSurplusRow(teacher.id, 'jamTambahan', e.target.value)} className="w-full min-w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-center text-white" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="text" placeholder="Wali Kelas" value={teacher.rincianTugasTambahan || ''} onChange={(e) => updateSurplusRow(teacher.id, 'rincianTugasTambahan', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-amber-600/50 rounded px-2 py-1.5 focus:border-amber-500 text-white" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="number" value={teacher.totalJam} readOnly className="w-full min-w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-emerald-400 font-bold text-center cursor-not-allowed" /></td>
                            <td className="p-2 border-r border-slate-700/50">
                              <select value={teacher.kecamatan || ''} onChange={(e) => updateSurplusRow(teacher.id, 'kecamatan', e.target.value)} className="w-full min-w-32 bg-slate-900 border border-indigo-500/50 rounded px-2 py-1.5 focus:border-indigo-400 text-indigo-100">
                                <option value="">Pilih Kec...</option>{LIST_KECAMATAN.map(kec => <option key={kec} value={kec}>{kec}</option>)}
                              </select>
                            </td>
                            <td className="p-2 border-r border-slate-700/50"><input type="month" value={teacher.bulanTahunPensiun || ''} onChange={(e) => updateSurplusRow(teacher.id, 'bulanTahunPensiun', e.target.value)} className="w-full min-w-32 bg-slate-900 border border-cyan-800/50 rounded px-2 py-1.5 text-white" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.alamat} onChange={(e) => updateSurplusRow(teacher.id, 'alamat', e.target.value)} className="w-full min-w-56 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-white" /></td>
                            <td className="p-2 text-center"><button onClick={() => removeSurplusRow(teacher.id)} className="text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded font-bold">X</button></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-700 pt-6">
                <button onClick={handleCancelEdit} disabled={isSaving} className="w-full sm:w-auto px-6 py-3 rounded-lg font-bold transition-all text-slate-300 bg-slate-700 hover:bg-slate-600">
                  ❌ BATAL / TUTUP
                </button>
                <button onClick={handleSimpanTerpadu} disabled={isSaving} className={`w-full sm:w-auto px-10 py-3 rounded-lg font-black transition-all shadow-lg ${isSaving ? 'bg-emerald-800 text-emerald-500 cursor-not-allowed shadow-none' : 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-emerald-900/50 hover:scale-105'}`}>
                  {isSaving ? '⏳ MENYIMPAN DATABASE TERPADU...' : '💾 SIMPAN SEMUA DATA (KURIKULUM & GURU)'}
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
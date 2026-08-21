import React, { useRef, useState } from 'react';
import Papa from 'papaparse';

export interface LocalTeacherData {
  id: string | number;
  nama: string; nip: string; pangkat: string; statusPegawai: string; ijasah: string;
  programKeahlian?: string; 
  bidangStudi: string; tugasMengajar: string; jamMengajar: number | string;
  tugasNonLinier?: string; jamNonLinier?: number | string;
  tugasNonLinier2?: string; jamNonLinier2?: number | string;
  jamTambahan: number | string; rincianTugasTambahan: string;
  totalJam: number | string; kecamatan: string; alamat: string;
  bulanTahunPensiun: string; sekolah?: string;
  is_rekomendasi_internal?: boolean;
  alasanRekomendasi?: string;
}

interface EditorBukuIndukProps {
  schoolTeachers: LocalTeacherData[];
  setSchoolTeachers: (val: LocalTeacherData[]) => void;
  baseMapels: string[];
  selectedSchoolData: { nama_sekolah: string } | null;
  jenjangSekolah?: string; 
  isSekolahBinaan?: boolean; 
  userRole?: string; 
}

const PROGRAM_KEAHLIAN_SMK = ['Agribisnis Perikanan', 'Agribisnis Tanaman', 'Agribisnis Ternak', 'Agriteknologi Pengolahan Hasil Pertanian', 'Akuntansi dan Keuangan Lembaga', 'Animasi', 'Broadcasting dan Perfilman', 'Busana', 'Desain Komunikasi Visual', 'Desain Pemodelan dan Informasi Bangunan', 'Desain dan Produksi Kriya', 'Kecantikan dan Spa', 'Kehutanan', 'Kimia Analisis', 'Konstruksi dan Perawatan Bangunan Sipil', 'Kuliner', 'Layanan Kesehatan', 'Manajemen Perkantoran dan Layanan Bisnis', 'Nautika Kapal Niaga', 'Nautika Kapal Penangkap Ikan', 'Pekerjaan Sosial', 'Pemasaran', 'Pengembangan Perangkat Lunak dan Gim', 'Perhotelan', 'Seni Pertunjukan', 'Seni Rupa', 'Teknik Elektronika', 'Teknik Energi Terbarukan', 'Teknik Furnitur', 'Teknik Geologi Pertambangan', 'Teknik Geospasial', 'Teknik Jaringan Komputer dan Telekomunikasi', 'Teknik Ketenagalistrikan', 'Teknik Kimia Industri', 'Teknik Konstruksi Kapal', 'Teknik Konstruksi dan Perumahan', 'Teknik Laboratorium Medik', 'Teknik Logistik', 'Teknik Mesin', 'Teknik Otomotif', 'Teknik Pengelasan dan Fabrikasi Logam', 'Teknik Perawatan Gedung', 'Teknik Perminyakan', 'Teknik Pesawat Udara', 'Teknik Tekstil', 'Teknika Kapal Niaga', 'Teknika Kapal Penangkap Ikan', 'Teknologi Farmasi', 'Usaha Layanan Pariwisata', 'Usaha Pertanian Terpadu'];

const TUGAS_SMA = ['Wakil Kepala Satuan Pendidikan', 'Kepala Perpustakaan', 'Kepala Laboratorium', 'Guru Wali - pendampingan menyeluruh peserta didik', 'Wali Kelas', 'Pembina OSIS', 'Pembina Ekstrakurikuler', 'Koordinator Pengembangan Kompetensi', 'Koordinator Pengelolaan Kinerja Guru', 'Koordinator Pembelajaran Berbasis Proyek', 'Koordinator Pembelajaran Pendidikan Inklusi', 'Anggota TPPK (Tim Pencegahan & Penanganan Kekerasan)', 'Guru Piket', 'Koordinator/Satgas PTK (TPPK)', 'Pengurus Kepanitiaan Acara Sekolah', 'Pengurus Organisasi Bidang Pendidikan', 'Tutor Pendidikan Kesetaraan', 'Instruktur/Narasumber/Fasilitator tingkat nasional', 'Peserta Program Pengembangan Kompetensi Terstruktur', 'Koordinator KKG/MGMP/Gugus', 'Pengurus Organisasi Kemasyarakatan Nonpolitik', 'Pengurus Organisasi Pemerintahan Nonstruktural'];
const TUGAS_SMK = ['Wakil Kepala Satuan Pendidikan', 'Ketua Program/Kompetensi Keahlian', 'Kepala Perpustakaan', 'Kepala Laboratorium', 'Kepala Bengkel', 'Kepala Unit Produksi/Teaching Factory', 'Guru Wali - pendampingan menyeluruh peserta didik', 'Wali Kelas', 'Pembina OSIS', 'Pembina Ekstrakurikuler', 'Koordinator Pengembangan Kompetensi', 'Pengurus Bursa Kerja Khusus (BKK) - Ketua', 'Koordinator Pengelolaan Kinerja Guru', 'Koordinator Pembelajaran Berbasis Proyek', 'Koordinator Pembelajaran Pendidikan Inklusi', 'Anggota TPPK (Tim Pencegahan & Penanganan Kekerasan)', 'Guru Piket', 'Koordinator/Satgas PTK (TPPK)', 'Pengurus Lembaga Sertifikasi Profesi (LSP-P1)', 'Pengurus Kepanitiaan Acara Sekolah', 'Pengurus Organisasi Bidang Pendidikan', 'Tutor Pendidikan Kesetaraan', 'Instruktur/Narasumber/Fasilitator tingkat nasional', 'Peserta Program Pengembangan Kompetensi Terstruktur', 'Koordinator KKG/MGMP/Gugus', 'Pengurus Organisasi Kemasyarakatan Nonpolitik', 'Pengurus Organisasi Pemerintahan Nonstruktural'];
const TUGAS_SLB = ['Wakil Kepala Satuan Pendidikan', 'Kepala Perpustakaan', 'Kepala Laboratorium', 'Guru Wali - pendampingan menyeluruh peserta didik', 'Wali Kelas', 'Pembina OSIS', 'Pembina Ekstrakurikuler', 'Koordinator Pengembangan Kompetensi', 'Koordinator Pengelolaan Kinerja Guru', 'Koordinator Pembelajaran Berbasis Proyek', 'Anggota TPPK (Tim Pencegahan & Penanganan Kekerasan)', 'Guru Piket', 'Koordinator/Satgas PTK (TPPK)', 'Pengurus Kepanitiaan Acara Sekolah', 'Pengurus Organisasi Bidang Pendidikan', 'Tutor Pendidikan Kesetaraan', 'Instruktur/Narasumber/Fasilitator tingkat nasional', 'Peserta Program Pengembangan Kompetensi Terstruktur', 'Koordinator KKG/MGMP/Gugus', 'Pengurus Organisasi Kemasyarakatan Nonpolitik', 'Pengurus Organisasi Pemerintahan Nonstruktural', 'GPK di Unit Layanan Disabilitas (ULD) - siklus Perencanaan-Pelaksanaan-Penilaian layanan khusus'];

const LIST_KECAMATAN = [
    'Colomadu', 'Gondangrejo', 'Jaten', 'Jatipuro', 'Jatiyoso', 'Jenawi', 'Jumantono', 'Jumapolo', 'Karanganyar', 'Karangpandan', 'Kebakkramat', 'Kerjo', 'Matesih', 'Mojogedang', 'Ngargoyoso', 'Tasikmadu', 'Tawangmangu',
    'Gemolong', 'Gesi', 'Gondang', 'Jenar', 'Kalijambe', 'Karangmalang', 'Kedawung', 'Masaran', 'Miri', 'Mondokan', 'Ngrampal', 'Plupuh', 'Sambirejo', 'Sambungmacan', 'Sidoharjo', 'Sragen', 'Sukodono', 'Sumberlawang', 'Tangen', 'Tanon',
    'Baturetno', 'Batuwarno', 'Bulukerto', 'Eromoko', 'Girimarto', 'Giritontro', 'Giriwoyo', 'Jatipurno', 'Jatiroto', 'Jatisrono', 'Karangtengah', 'Kismantoro', 'Manyaran', 'Ngadirojo', 'Nguntoronadi', 'Paranggupito', 'Pracimantoro', 'Puhpelem', 'Purwantoro', 'Selogiri', 'Slogohimo', 'Tirtomoyo', 'Wonogiri', 'Wuryantoro'
].sort();

const TARGET_FIELDS = [
    { key: 'nama', label: 'Nama Lengkap' }, { key: 'nip', label: 'NIP / NI-PPPK' }, { key: 'pangkat', label: 'Pangkat/Golongan' },
    { key: 'statusPegawai', label: 'Status Kepegawaian' }, { key: 'ijasah', label: 'Ijazah S1' }, 
    { key: 'bidangStudi', label: 'Bidang Studi Serdik / Mapel' },
    { key: 'tugasMengajar', label: 'Mapel Utama' }, { key: 'jamMengajar', label: 'Jam Mengajar Utama' }, 
    { key: 'tugasNonLinier', label: 'Mapel Tambahan Linier' }, { key: 'jamNonLinier', label: 'Jam Mapel Tambahan' }, 
    { key: 'tugasNonLinier2', label: 'Mapel Tambahan Linier 2' }, { key: 'jamNonLinier2', label: 'Jam Mapel Tambahan 2' }, 
    { key: 'rincianTugasTambahan', label: 'Rincian Tugas Tambahan' }, { key: 'jamTambahan', label: 'Jam Tugas Tambahan' },
    { key: 'kecamatan', label: 'Kecamatan Domisili' }, { key: 'alamat', label: 'Alamat Domisili' } 
];

const calculatePensiunFromNIP = (nip: string): string => {
    if (!nip) return '';
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

const EditorBukuInduk: React.FC<EditorBukuIndukProps> = ({ schoolTeachers, setSchoolTeachers, baseMapels, selectedSchoolData, jenjangSekolah, isSekolahBinaan, userRole }) => {
  const fileInputGuruRef = useRef<HTMLInputElement>(null);
  const [mappingState, setMappingState] = useState<{isOpen: boolean; headers: string[]; data: Record<string, string>[]; mapping: Record<string, string>;}>({ isOpen: false, headers: [], data: [], mapping: {} });
  const currentTugasList = jenjangSekolah === 'SMK' ? TUGAS_SMK : jenjangSekolah === 'SLB' ? TUGAS_SLB : TUGAS_SMA;
  
  const canRecommend = userRole === 'pengawas' ? isSekolahBinaan : false;
  
  const addSurplusRow = () => setSchoolTeachers([...schoolTeachers, { id: Date.now(), nama: '', nip: '', pangkat: '', statusPegawai: '', ijasah: '', bidangStudi: '', tugasMengajar: '', jamMengajar: '', tugasNonLinier: '', jamNonLinier: '', tugasNonLinier2: '', jamNonLinier2: '', jamTambahan: '', rincianTugasTambahan: '', totalJam: '', kecamatan: '', alamat: '', bulanTahunPensiun: '', is_rekomendasi_internal: false, alasanRekomendasi: '' }]);
  
  const updateSurplusRow = (id: string | number, field: keyof LocalTeacherData, value: string | number | boolean) => {
    setSchoolTeachers(schoolTeachers.map(teacher => {
      if (teacher.id === id) {
        let finalValue = value;
        if (field === 'nama' && typeof value === 'string') {
            finalValue = value.toUpperCase();
        }

        const updated = { ...teacher, [field]: finalValue };
        
        if (field === 'jamMengajar' || field === 'jamTambahan' || field === 'jamNonLinier' || field === 'jamNonLinier2') {
            updated.totalJam = (Number(updated.jamMengajar) || 0) + (Number(updated.jamNonLinier) || 0) + (Number(updated.jamNonLinier2) || 0) + (Number(updated.jamTambahan) || 0);
        }
        if (field === 'nip') {
            const autoPensiun = calculatePensiunFromNIP(String(value));
            if (autoPensiun) updated.bulanTahunPensiun = autoPensiun;
        }
        return updated;
      }
      return teacher;
    }));
  };
  
  const removeSurplusRow = (id: string | number) => setSchoolTeachers(schoolTeachers.filter(t => t.id !== id));
  
  const handleDownloadTemplateGuru = () => {
    const headers = ["Nama Lengkap", "NIP / NI-PPPK", "Pangkat/Golongan", "Status Kepegawaian", "Ijazah S1", "Bidang Studi Serdik / Mapel", "Mapel Utama", "Jam Mengajar Utama", "Mapel Tambahan Linier", "Jam Mapel Tambahan", "Mapel Tambahan Linier 2", "Jam Mapel Tambahan 2", "Rincian Tugas Tambahan", "Jam Tugas Tambahan", "Kecamatan Domisili", "Alamat Domisili"];
    const dummyData1 = ["BUDI SANTOSO", "198001012010011001", "Penata Tk. I (III/d)", "PNS", "S1 Pendidikan Matematika", "Matematika", "Matematika", "24", "", "", "", "", "Wali Kelas", "2", "Gondangrejo", "Jl. Merdeka No. 1"];
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers.join(";") + "\n" + dummyData1.join(";") + "\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a"); link.setAttribute("href", encodedUri); link.setAttribute("download", `Template_Buku_Induk_${jenjangSekolah || 'Instansi'}.csv`); document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const guessMapping = (headers: string[]) => {
      const map: Record<string, string> = {};
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
      TARGET_FIELDS.forEach(field => {
          const fNorm = normalize(field.key);
          const lNorm = normalize(field.label);
          const match = headers.find(h => {
              const hNorm = normalize(h);
              return hNorm === fNorm || hNorm === lNorm || hNorm.includes(fNorm) || lNorm.includes(hNorm);
          });
          if (match) map[field.key] = match;
      });
      return map;
  };

  const handleFileUploadGuruCerdas = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      Papa.parse(file, {
          header: true, skipEmptyLines: true,
          complete: function(results) {
              const parsedData = results.data as Record<string, string>[];
              if (parsedData.length === 0) { alert("File Excel/CSV Anda Kosong!"); return; }
              const headers = Object.keys(parsedData[0]);
              setMappingState({ isOpen: true, headers: headers, data: parsedData, mapping: guessMapping(headers) });
              if (fileInputGuruRef.current) fileInputGuruRef.current.value = '';
          },
          error: function(err) { alert("❌ Gagal membaca file: " + err.message); }
      });
  };

  const handleApplyGuruImport = () => {
      const { data, mapping } = mappingState;

      if (!mapping['nama']) {
          alert("⚠️ PERINGATAN SISTEM: Kolom 'NAMA LENGKAP' wajib dijodohkan (di-mapping) dengan kolom CSV Anda!");
          return;
      }

      const normalizeImportStatus = (raw: string) => {
          const s = String(raw).toUpperCase().replace(/[^A-Z0-9]/g, '');
          if (s.includes('PNS')) return 'PNS';
          if (s.includes('PPPKPARUHWAKTU') || s.includes('PW')) return 'PPPK Paruh Waktu';
          if (s.includes('PPPK') || s.includes('P3K')) return 'PPPK';
          if (s.includes('BKO') || s.includes('TERBANG')) return 'BKO / Guru Terbang';
          if (s === '') return '';
          return 'Non ASN';
      };
      
      const newTeachers: LocalTeacherData[] = data.map((row, idx) => {
          const getVal = (key: string) => mapping[key] ? (row[mapping[key]] || '') : '';
          const rawNip = String(getVal('nip')).replace(/[^0-9]/g, ''); 
          const jamM = Number(getVal('jamMengajar')) || 0;
          const jamNL = Number(getVal('jamNonLinier')) || 0;
          const jamNL2 = Number(getVal('jamNonLinier2')) || 0; 
          const jamT = Number(getVal('jamTambahan')) || 0;
          
          return {
              id: Date.now() + idx, 
              sekolah: selectedSchoolData?.nama_sekolah || '', 
              nama: String(getVal('nama')).toUpperCase().trim(),
              nip: rawNip, 
              pangkat: getVal('pangkat'),
              statusPegawai: normalizeImportStatus(getVal('statusPegawai')), 
              ijasah: getVal('ijasah'), 
              bidangStudi: getVal('bidangStudi'),
              tugasMengajar: getVal('tugasMengajar'), jamMengajar: jamM, 
              tugasNonLinier: getVal('tugasNonLinier'), jamNonLinier: jamNL, 
              tugasNonLinier2: getVal('tugasNonLinier2'), jamNonLinier2: jamNL2, 
              jamTambahan: jamT, rincianTugasTambahan: getVal('rincianTugasTambahan'),
              kecamatan: getVal('kecamatan'), alamat: getVal('alamat'), totalJam: jamM + jamNL + jamNL2 + jamT, bulanTahunPensiun: calculatePensiunFromNIP(rawNip),
              is_rekomendasi_internal: false, alasanRekomendasi: ''
          };
      });

      const mergedTeachers = [...schoolTeachers];
      let updateCount = 0;
      let addCount = 0;

      newTeachers.forEach(newT => {
          if (!newT.nama) return;

          const existIdx = mergedTeachers.findIndex(ex => {
              const cleanExNip = String(ex.nip || '').replace(/[^0-9]/g, '');
              const cleanNewNip = String(newT.nip || '').replace(/[^0-9]/g, '');
              const cleanExNama = String(ex.nama || '').toUpperCase().replace(/\s+/g, ' ').trim();
              const cleanNewNama = String(newT.nama || '').toUpperCase().replace(/\s+/g, ' ').trim();
              return (cleanNewNip !== '' && cleanExNip === cleanNewNip) || (cleanNewNama !== '' && cleanExNama === cleanNewNama);
          });

          if (existIdx !== -1) {
              mergedTeachers[existIdx] = {
                  ...newT,
                  id: mergedTeachers[existIdx].id,
                  is_rekomendasi_internal: mergedTeachers[existIdx].is_rekomendasi_internal,
                  alasanRekomendasi: mergedTeachers[existIdx].alasanRekomendasi
              };
              updateCount++;
          } else {
              mergedTeachers.push(newT);
              addCount++;
          }
      });

      alert(`🎉 Import Cerdas Selesai!\n\n- ${updateCount} Data Guru Lama Diperbarui\n- ${addCount} Data Guru Baru Ditambahkan`);
      setSchoolTeachers(mergedTeachers);
      setMappingState({ isOpen: false, headers: [], data: [], mapping: {} });
  };

  const renderDropdownMapel = (teacher: LocalTeacherData, field: keyof LocalTeacherData, placeholder: string) => {
    const val = teacher[field] as string || '';
    
    if (jenjangSekolah === 'SMK') {
        const isProd = PROGRAM_KEAHLIAN_SMK.includes(val) || val === 'PRODUKTIF_PENDING';
        return (
            <div className="flex flex-col gap-1 w-full min-w-40">
                <select 
                    value={isProd ? 'PRODUKTIF_PENDING' : val} 
                    onChange={(e) => updateSurplusRow(teacher.id, field, e.target.value)} 
                    className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-amber-500 outline-none text-white"
                >
                    <option value="">{placeholder}</option>
                    {field === 'tugasMengajar' && <option value="Kepala Sekolah" className="font-bold text-amber-300 bg-slate-800">👑 Kepala Sekolah</option>}
                    {baseMapels.map(m => <option key={m} value={m}>{m}</option>)}
                    <option value="PRODUKTIF_PENDING" className="font-bold text-amber-300 bg-amber-900">📦 MATA PELAJARAN PRODUKTIF ➔</option>
                </select>

                {isProd && (
                    <select 
                        value={val === 'PRODUKTIF_PENDING' ? '' : val} 
                        onChange={(e) => updateSurplusRow(teacher.id, field, e.target.value)} 
                        className="bg-amber-950 border border-amber-500 text-amber-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400 font-bold shadow-lg"
                    >
                        <option value="">-- Pilih Program Keahlian --</option>
                        {PROGRAM_KEAHLIAN_SMK.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                )}
            </div>
        );
    } else {
        return (
            <select value={val} onChange={(e) => updateSurplusRow(teacher.id, field, e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none text-white">
                <option value="">{placeholder}</option>
                {field === 'tugasMengajar' && <option value="Kepala Sekolah" className="font-bold text-amber-300 bg-slate-800">👑 Kepala Sekolah</option>}
                {baseMapels.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        );
    }
  };

  const sortedTeachers = [...schoolTeachers].sort((a, b) => {
      const aRek = a.is_rekomendasi_internal ? 1 : 0;
      const bRek = b.is_rekomendasi_internal ? 1 : 0;
      return bRek - aRek;
  });

  return (
    <>
      <div className="bg-slate-900/50 p-5 rounded-xl border border-cyan-600/50 mb-8 shadow-inner">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 border-b border-slate-700 pb-3">
          <h4 className="text-sm font-bold text-cyan-400 uppercase tracking-wider">3. Buku Induk Pendidik Riil ({schoolTeachers.length} Guru)</h4>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleDownloadTemplateGuru} className="bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors">
              ⬇️ Download Template
            </button>
            <input type="file" accept=".csv, .xlsx, .xls" ref={fileInputGuruRef} onChange={handleFileUploadGuruCerdas} className="hidden" />
            <button onClick={() => fileInputGuruRef.current?.click()} className="bg-cyan-800 hover:bg-cyan-700 text-white px-3 py-1.5 rounded text-xs font-bold transition-colors shadow-lg border border-cyan-600">
              ⬆️ Import Guru Cerdas
            </button>
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
                <th className="p-3 border-r border-slate-700 text-cyan-300">Mapel Utama</th>
                <th className="p-3 border-r border-slate-700 text-cyan-300">Jam Mengajar Utama</th>
                <th className="p-3 border-r border-slate-700 text-indigo-300">Mapel Tambahan Linier</th>
                <th className="p-3 border-r border-slate-700 text-indigo-300">Jam Linier 1</th>
                <th className="p-3 border-r border-slate-700 text-indigo-300">Mapel Tambahan Linier 2</th>
                <th className="p-3 border-r border-slate-700 text-indigo-300">Jam Linier 2</th>
                <th className="p-3 border-r border-slate-700 text-amber-300">Rincian Tambahan</th>
                <th className="p-3 border-r border-slate-700">Jam Tambahan</th>
                <th className="p-3 border-r border-slate-700 text-emerald-400">Total Jam</th>
                <th className="p-3 border-r border-slate-700 text-blue-300">Kec. Domisili</th>
                <th className="p-3 border-r border-slate-700 text-cyan-300">Bulan Pensiun</th>
                <th className="p-3 border-r border-slate-700 text-slate-300">Alamat Domisili</th>
                <th className="p-3">Hapus</th>
              </tr>
            </thead>
            <tbody>
              {sortedTeachers.length === 0 ? (
                <tr><td colSpan={20} className="text-center py-12 text-slate-500 italic font-medium">Belum ada data guru yang diinputkan di sekolah ini.</td></tr>
              ) : (
                sortedTeachers.map((teacher, index) => (
                  <tr key={teacher.id} className={`border-b border-slate-700/50 ${teacher.is_rekomendasi_internal ? 'bg-amber-900/10' : ''}`}>
                    <td className="p-2 border-r border-slate-700/50 text-center text-slate-400 align-top">{index + 1}</td>
                    
                    <td className="p-2 border-r border-slate-700/50 align-top">
                        <input type="text" value={teacher.nama} onChange={(e) => updateSurplusRow(teacher.id, 'nama', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none text-white uppercase" />
                        
                        {canRecommend && (
                            <div className="mt-2">
                                <button 
                                    onClick={() => {
                                       if (!teacher.is_rekomendasi_internal) {
                                           const hasRecommended = schoolTeachers.some(t => t.is_rekomendasi_internal);
                                           if (hasRecommended) {
                                               alert("⚠️ DITOLAK:\nPengawas HANYA BISA merekomendasikan MAKSIMAL 1 GURU pada satu Instansi.");
                                               return;
                                           }
                                           const alasan = window.prompt(`Berikan alasan pengusulan mutasi untuk ${teacher.nama}:`, teacher.alasanRekomendasi || '');
                                           if (alasan !== null && alasan.trim() !== '') {
                                               updateSurplusRow(teacher.id, 'is_rekomendasi_internal', true);
                                               updateSurplusRow(teacher.id, 'alasanRekomendasi', alasan);
                                           }
                                       } else {
                                           if (window.confirm(`Cabut rekomendasi mutasi untuk ${teacher.nama}?`)) {
                                               updateSurplusRow(teacher.id, 'is_rekomendasi_internal', false);
                                               updateSurplusRow(teacher.id, 'alasanRekomendasi', '');
                                           }
                                       }
                                    }}
                                    className={`w-full px-2 py-1.5 text-[9px] font-bold rounded transition-colors shadow-sm ${teacher.is_rekomendasi_internal ? 'bg-amber-900/80 text-amber-300 border border-amber-500' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'}`}
                                >
                                    {teacher.is_rekomendasi_internal ? '🌟 REKOMENDASI AKTIF' : '+ Beri Rekomendasi'}
                                </button>
                                {teacher.is_rekomendasi_internal && teacher.alasanRekomendasi && (
                                    <p className="text-[9px] text-amber-200 mt-1 italic whitespace-normal leading-tight bg-amber-950/30 p-1 rounded border border-amber-800/30">
                                        "{teacher.alasanRekomendasi}"
                                    </p>
                                )}
                            </div>
                        )}
                        {!canRecommend && teacher.is_rekomendasi_internal && (
                            <span className="text-[8px] text-amber-400 font-bold block mt-1 uppercase text-center bg-amber-900/50 rounded p-1">🌟 Direkomendasikan</span>
                        )}
                    </td>
                    
                    <td className="p-2 border-r border-slate-700/50 align-top">
                        <input type="text" value={teacher.nip} onChange={(e) => updateSurplusRow(teacher.id, 'nip', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-amber-500 outline-none text-amber-100 placeholder-amber-900" placeholder="Ketik NIP..." />
                    </td>
                    
                    <td className="p-2 border-r border-slate-700/50 align-top">
                        <input type="text" value={teacher.pangkat} onChange={(e) => updateSurplusRow(teacher.id, 'pangkat', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none text-white" />
                    </td>
                    
                    <td className="p-2 border-r border-slate-700/50 align-top">
                      <select value={teacher.statusPegawai} onChange={(e) => updateSurplusRow(teacher.id, 'statusPegawai', e.target.value)} className="w-full min-w-32 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none text-white">
                        <option value="">Pilih Status...</option><option value="PNS">PNS</option><option value="PPPK">PPPK</option><option value="PPPK Paruh Waktu">PPPK Paruh Waktu</option><option value="Non ASN">Non ASN</option><option value="BKO / Guru Terbang" className="font-bold text-sky-300 bg-slate-800">✈️ BKO / Guru Terbang</option>
                      </select>
                    </td>
                    
                    <td className="p-2 border-r border-slate-700/50 align-top">
                        <input type="text" value={teacher.ijasah} onChange={(e) => updateSurplusRow(teacher.id, 'ijasah', e.target.value)} className="w-full min-w-32 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none text-white" />
                    </td>
                    
                    <td className="p-2 border-r border-slate-700/50 align-top">
                        <input type="text" value={teacher.bidangStudi} onChange={(e) => updateSurplusRow(teacher.id, 'bidangStudi', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-fuchsia-600/50 rounded px-2 py-1.5 focus:border-fuchsia-500 outline-none text-fuchsia-100 placeholder-fuchsia-800/50" placeholder="Ketik Bidang Studi..." />
                    </td>
                    
                    <td className="p-2 border-r border-slate-700/50 bg-cyan-950/20 align-top">
                      {renderDropdownMapel(teacher, 'tugasMengajar', 'Pilih Mapel Utama...')}
                    </td>
                    
                    <td className="p-2 border-r border-slate-700/50 align-top">
                        <input type="number" min="0" value={teacher.jamMengajar} onChange={(e) => updateSurplusRow(teacher.id, 'jamMengajar', e.target.value)} className="w-full min-w-20 bg-slate-900 border border-cyan-800/50 rounded px-2 py-1.5 text-center text-white" />
                    </td>
                    
                    <td className="p-2 border-r border-slate-700/50 bg-indigo-950/20 align-top">
                      {renderDropdownMapel(teacher, 'tugasNonLinier', 'Pilih Mapel Linier 1...')}
                    </td>
                    <td className="p-2 border-r border-slate-700/50 align-top"><input type="number" min="0" value={teacher.jamNonLinier || ''} onChange={(e) => updateSurplusRow(teacher.id, 'jamNonLinier', e.target.value)} className="w-full min-w-20 bg-slate-900 border border-indigo-600/50 rounded px-2 py-1.5 text-center text-indigo-100" /></td>
                    
                    <td className="p-2 border-r border-slate-700/50 bg-indigo-950/20 align-top">
                      {renderDropdownMapel(teacher, 'tugasNonLinier2', 'Pilih Mapel Linier 2...')}
                    </td>
                    <td className="p-2 border-r border-slate-700/50 align-top"><input type="number" min="0" value={teacher.jamNonLinier2 || ''} onChange={(e) => updateSurplusRow(teacher.id, 'jamNonLinier2', e.target.value)} className="w-full min-w-20 bg-slate-900 border border-indigo-600/50 rounded px-2 py-1.5 text-center text-indigo-100" /></td>
                    
                    <td className="p-2 border-r border-slate-700/50 align-top">
                        <select 
                            value={teacher.rincianTugasTambahan || ''} 
                            onChange={(e) => updateSurplusRow(teacher.id, 'rincianTugasTambahan', e.target.value)} 
                            className="w-full min-w-48 bg-slate-900 border border-amber-600/50 rounded px-2 py-1.5 focus:border-amber-500 text-amber-100 outline-none"
                        >
                            <option value="">-- Pilih Tugas Tambahan --</option>
                            {teacher.rincianTugasTambahan && !currentTugasList.includes(teacher.rincianTugasTambahan) && (
                                <option value={teacher.rincianTugasTambahan}>{teacher.rincianTugasTambahan} (Data Lama)</option>
                            )}
                            {currentTugasList.map(t => <option key={t} value={t} title={t}>{t}</option>)}
                        </select>
                    </td>
                    <td className="p-2 border-r border-slate-700/50 align-top"><input type="number" min="0" value={teacher.jamTambahan} onChange={(e) => updateSurplusRow(teacher.id, 'jamTambahan', e.target.value)} className="w-full min-w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-center text-white" /></td>
                    
                    <td className="p-2 border-r border-slate-700/50 align-top">
                      <input type="number" value={teacher.totalJam} readOnly className={`w-full min-w-16 bg-slate-950 border rounded px-2 py-1.5 font-bold text-center cursor-not-allowed ${Number(teacher.totalJam) < 24 ? 'border-red-500 text-red-400' : 'border-slate-800 text-emerald-400'}`} />
                    </td>
                    
                    <td className="p-2 border-r border-slate-700/50 align-top">
                      <select value={teacher.kecamatan || ''} onChange={(e) => updateSurplusRow(teacher.id, 'kecamatan', e.target.value)} className="w-full min-w-32 bg-slate-900 border border-blue-500/50 rounded px-2 py-1.5 focus:border-blue-400 text-blue-100">
                        <option value="">Pilih Kec...</option>{LIST_KECAMATAN.map(kec => <option key={kec} value={kec}>{kec}</option>)}
                      </select>
                    </td>
                    
                    <td className="p-2 border-r border-slate-700/50 align-top">
                        <input type="month" value={teacher.bulanTahunPensiun || calculatePensiunFromNIP(teacher.nip) || ''} onChange={(e) => updateSurplusRow(teacher.id, 'bulanTahunPensiun', e.target.value)} className="w-full min-w-32 bg-slate-900 border border-cyan-800/50 rounded px-2 py-1.5 text-white shadow-inner focus:border-cyan-400 outline-none" title="Bulan TMT Pensiun" />
                    </td>
                    
                    <td className="p-2 border-r border-slate-700/50 align-top">
                        <input type="text" value={teacher.alamat} onChange={(e) => updateSurplusRow(teacher.id, 'alamat', e.target.value)} className="w-full min-w-56 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-white" placeholder="Cth: Jl. Raya No 1..." />
                    </td>
                    <td className="p-2 text-center align-top"><button onClick={() => removeSurplusRow(teacher.id)} className="text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded font-bold">X</button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mappingState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm print:hidden">
           <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl w-full max-w-4xl shadow-[0_0_40px_rgba(6,182,212,0.3)] flex flex-col max-h-[90vh]">
              <div className="p-5 border-b bg-cyan-950/40 border-cyan-800/50">
                 <h3 className="text-xl font-black text-white tracking-wider">🤖 Jodohkan Kolom (Smart Import)</h3>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar flex-1 bg-slate-950/50">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {TARGET_FIELDS.map(field => {
                        return (
                          <div key={field.key} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex flex-col gap-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{field.label}</label>
                              <select value={mappingState.mapping[field.key] || ''} onChange={(e) => setMappingState(prev => ({...prev, mapping: {...prev.mapping, [field.key]: e.target.value}}))} className="w-full bg-slate-950 border border-cyan-800/50 text-cyan-200 rounded px-3 py-2 text-sm outline-none focus:border-cyan-400">
                                 <option value="">-- Abaikan (Kosongkan) --</option>{mappingState.headers.map(h => <option key={h} value={h}>{h}</option>)}
                              </select>
                          </div>
                        );
                    })}
                 </div>
              </div>
              <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3">
                 <button onClick={() => setMappingState({isOpen: false, headers: [], data: [], mapping: {}})} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-sm font-bold transition-colors">Batal</button>
                 <button onClick={handleApplyGuruImport} className="px-6 py-2.5 rounded-lg text-sm font-black bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/50 transition-colors">✅ Sedot Data</button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default EditorBukuInduk;
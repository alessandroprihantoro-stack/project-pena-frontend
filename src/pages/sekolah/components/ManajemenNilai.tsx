import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../../../supabaseClient';
import { useAuth } from '../../../context/AuthContext';

type ExcelRow = Record<string, string | number>;

interface AnalitikSiswa {
  id: string;
  nisn: string;
  nama: string;
  kelas_terakhir: string;
  rataRataKeseluruhan: number;
  mapelTerkuat: { mapel: string; nilai: number }[];
  rekomendasiTka: string;
  rekomendasiProdi: string;
  statusAman: boolean;
}

export default function ManajemenNilai() {
  const { profile } = useAuth();
  
  const [activeView, setActiveView] = useState<'UPLOAD' | 'ANALITIK'>('UPLOAD');
  
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dataPreview, setDataPreview] = useState<ExcelRow[]>([]);
  
  const [dbSiswaList, setDbSiswaList] = useState<AnalitikSiswa[]>([]);
  const [isLoadingAnalitik, setIsLoadingAnalitik] = useState(false);

  const handleDownloadTemplate = () => {
    // 🌟 PERBAIKAN: Menambahkan kolom NILAI_TKA di akhir
    const header = [
      "NISN", "NAMA_SISWA", "KELAS", "SEMESTER", "AGAMA", "PANCASILA", "B_INDONESIA", 
      "MATEMATIKA", "B_INGGRIS", "PJOK", "INFORMATIKA", "SEJARAH", "SENI_BUDAYA", 
      "IPA_TERPADU", "IPS_TERPADU", "FISIKA", "KIMIA", "BIOLOGI", "SOSIOLOGI", 
      "EKONOMI", "GEOGRAFI", "MUATAN_LOKAL", "MATEMATIKA_LANJUT", "NILAI_TKA"
    ];
    
    // 🌟 PERBAIKAN: Menambahkan contoh nilai TKA (misal: 88)
    const contohData = [
      "0012345678", "Budi Santoso", "X.1", "1", 
      85, 88, 80, 90, 85, 89, 90, 82, 92, 82, 84, "", "", "", "", "", "", 85, "", 88
    ];

    const ws = XLSX.utils.aoa_to_sheet([header, contohData]);
    const wscols = header.map(h => ({ wch: Math.max(h.length, 12) }));
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_Nilai");
    XLSX.writeFile(wb, "Template_PENA_Input_Nilai_Lengkap.xlsx");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(worksheet, { defval: "" });
        
        setDataPreview(jsonData);
        alert(`✅ Ekstraksi selesai! ${jsonData.length} baris data berhasil dibaca.`);
      } catch (error) {
        console.error("Gagal membaca Excel:", error);
        alert("❌ File tidak valid atau rusak.");
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleSimpanKeDatabase = async () => {
    if (!profile?.id) return alert("Sesi tidak valid.");
    setIsSaving(true);
    
    try {
      const { data: prof } = await supabase.from('profiles').select('nomor_induk').eq('id', profile.id).single();
      const npsnSekolah = prof?.nomor_induk;

      if (!npsnSekolah || npsnSekolah === '-' || npsnSekolah === '') {
          alert("NPSN Sekolah belum diatur di Profil Anda.");
          setIsSaving(false); return;
      }

      let berhasilSiswa = 0; let berhasilNilai = 0;
      // 🌟 PERBAIKAN: Menambahkan NILAI_TKA agar ikut tersimpan ke database
      const mapelList = [
        "AGAMA", "PANCASILA", "B_INDONESIA", "MATEMATIKA", "B_INGGRIS", "PJOK", 
        "INFORMATIKA", "SEJARAH", "SENI_BUDAYA", "IPA_TERPADU", "IPS_TERPADU", 
        "FISIKA", "KIMIA", "BIOLOGI", "SOSIOLOGI", "EKONOMI", "GEOGRAFI", "MUATAN_LOKAL", "MATEMATIKA_LANJUT", "NILAI_TKA"
      ];

      for (const row of dataPreview) {
         const nisn = String(row['NISN'] || '').trim();
         const nama = String(row['NAMA_SISWA'] || '').trim();
         const kelas = String(row['KELAS'] || '').trim();
         const semester = parseInt(String(row['SEMESTER']) || '1');

         if (!nisn || !nama || !kelas) continue;

         let siswaId = null;
         const { data: existingSiswa } = await supabase.from('master_siswa').select('id').eq('npsn', npsnSekolah).eq('nisn', nisn).maybeSingle();

         if (existingSiswa) {
            siswaId = existingSiswa.id;
         } else {
            const { data: newSiswa, error: errInsert } = await supabase.from('master_siswa').insert({ npsn: npsnSekolah, nisn: nisn, nama_lengkap: nama, angkatan: new Date().getFullYear().toString() }).select('id').single();
            if (errInsert) throw errInsert;
            siswaId = newSiswa?.id;
         }

         if (siswaId) {
            berhasilSiswa++;
            const nilaiToInsert = [];
            for (const mapel of mapelList) {
               if (row[mapel] !== undefined && row[mapel] !== "") {
                  nilaiToInsert.push({ siswa_id: siswaId, npsn: npsnSekolah, kelas: kelas, semester: semester, mata_pelajaran: mapel, nilai: Number(row[mapel]) });
               }
            }

            if (nilaiToInsert.length > 0) {
               await supabase.from('riwayat_nilai').delete().eq('siswa_id', siswaId).eq('kelas', kelas).eq('semester', semester);
               const { error: errNilai } = await supabase.from('riwayat_nilai').insert(nilaiToInsert);
               if (errNilai) throw errNilai;
               berhasilNilai += nilaiToInsert.length;
            }
         }
      }

      alert(`✅ Sinkronisasi Selesai Secara Presisi!\n\n👨‍🎓 ${berhasilSiswa} Jejak siswa dikonfirmasi.\n📈 ${berhasilNilai} Data mata pelajaran & TKA berhasil disimpan.`);
      setDataPreview([]); 
      setActiveView('ANALITIK');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Kesalahan tidak dikenal";
      alert(`❌ Terjadi kendala saat menyuntikkan data: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const fetchAnalitikSiswa = async () => {
      if (!profile?.id) return;
      setIsLoadingAnalitik(true);
      
      try {
        const { data: prof } = await supabase.from('profiles').select('nomor_induk').eq('id', profile.id).single();
        const npsnSekolah = prof?.nomor_induk;
        if (!npsnSekolah) {
          setIsLoadingAnalitik(false);
          return;
        }
  
        const { data: siswaData } = await supabase.from('master_siswa').select('*').eq('npsn', npsnSekolah);
        const { data: nilaiData } = await supabase.from('riwayat_nilai').select('*').eq('npsn', npsnSekolah);
  
        if (!siswaData || !nilaiData) {
          setIsLoadingAnalitik(false);
          return;
        }
  
        const hasilAnalitik: AnalitikSiswa[] = siswaData.map(siswa => {
          const nilaiSiswaIni = nilaiData.filter(n => n.siswa_id === siswa.id);
          
          if (nilaiSiswaIni.length === 0) {
            return { id: siswa.id, nisn: siswa.nisn, nama: siswa.nama_lengkap, kelas_terakhir: '-', rataRataKeseluruhan: 0, mapelTerkuat: [], rekomendasiTka: 'Data Tidak Cukup', rekomendasiProdi: '-', statusAman: false };
          }
  
          const kelasTerakhir = nilaiSiswaIni.reduce((prev, current) => (prev.semester > current.semester) ? prev : current).kelas;
          
          // 🌟 PERBAIKAN: Hitung rata-rata tanpa memasukkan NILAI_TKA agar rata-rata rapor murni
          const nilaiRaporMurni = nilaiSiswaIni.filter(n => n.mata_pelajaran !== 'NILAI_TKA');
          const totalNilai = nilaiRaporMurni.reduce((sum, n) => sum + Number(n.nilai), 0);
          const rataRataKeseluruhan = nilaiRaporMurni.length > 0 ? Number((totalNilai / nilaiRaporMurni.length).toFixed(2)) : 0;
  
          const mapelAgg: Record<string, { total: number; count: number }> = {};
          nilaiRaporMurni.forEach(n => {
            if (!mapelAgg[n.mata_pelajaran]) mapelAgg[n.mata_pelajaran] = { total: 0, count: 0 };
            mapelAgg[n.mata_pelajaran].total += Number(n.nilai);
            mapelAgg[n.mata_pelajaran].count += 1;
          });
  
          const mapelAverages = Object.entries(mapelAgg).map(([mapel, stats]) => ({
            mapel,
            nilai: Number((stats.total / stats.count).toFixed(2))
          }));
  
          mapelAverages.sort((a, b) => b.nilai - a.nilai);
          const mapelTerkuat = mapelAverages.slice(0, 2);
  
          const rekomendasiTka: string[] = [];
          const rekomendasiProdi: string[] = [];
          const namaMapelTerkuat = mapelTerkuat.map(m => m.mapel);
  
          if (namaMapelTerkuat.includes('BIOLOGI') || namaMapelTerkuat.includes('KIMIA')) {
            rekomendasiTka.push('Biologi / Kimia'); rekomendasiProdi.push('Kedokteran, Farmasi, Keperawatan');
          }
          if (namaMapelTerkuat.includes('FISIKA') || namaMapelTerkuat.includes('MATEMATIKA_LANJUT') || namaMapelTerkuat.includes('MATEMATIKA')) {
            rekomendasiTka.push('Fisika / MTK Lanjut'); rekomendasiProdi.push('Teknik, Arsitektur, Ilmu Komputer');
          }
          if (namaMapelTerkuat.includes('SOSIOLOGI') || namaMapelTerkuat.includes('EKONOMI')) {
            rekomendasiTka.push('Sosiologi / Ekonomi'); rekomendasiProdi.push('Hukum, Manajemen, Akuntansi, Psikologi');
          }
          if (namaMapelTerkuat.includes('GEOGRAFI') || namaMapelTerkuat.includes('SEJARAH')) {
            rekomendasiTka.push('Geografi / Sejarah'); rekomendasiProdi.push('Hubungan Internasional, Ilmu Politik, Sastra');
          }
          if (namaMapelTerkuat.includes('SENI_BUDAYA')) {
            rekomendasiTka.push('Portofolio Seni'); rekomendasiProdi.push('DKV, Seni Rupa, Desain Interior');
          }
  
          if (rekomendasiTka.length === 0) {
            rekomendasiTka.push(mapelTerkuat[0]?.mapel || 'Sesuai Minat');
            rekomendasiProdi.push('Pendidikan, Ilmu Komunikasi');
          }
  
          return {
            id: siswa.id,
            nisn: siswa.nisn,
            nama: siswa.nama_lengkap,
            kelas_terakhir: kelasTerakhir,
            rataRataKeseluruhan,
            mapelTerkuat,
            rekomendasiTka: rekomendasiTka.join(' atau '),
            rekomendasiProdi: rekomendasiProdi.join(' / '),
            statusAman: rataRataKeseluruhan >= 85
          };
        });
  
        hasilAnalitik.sort((a, b) => b.rataRataKeseluruhan - a.rataRataKeseluruhan);
        setDbSiswaList(hasilAnalitik);
  
      } catch (error) {
        console.error("Gagal fetch analitik:", error);
      } finally {
        setIsLoadingAnalitik(false);
      }
    };

    if (activeView === 'ANALITIK') {
      fetchAnalitikSiswa();
    }
  }, [activeView, profile?.id]);

  return (
    <div className="bg-white dark:bg-slate-900 border-4 border-black shadow-neo rounded-3xl p-6 sm:p-8 animate-fade-in">
      <div className="border-b-4 border-black/10 pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest text-blue-600 dark:text-cyan-400 flex items-center gap-2">
            📊 Pusat Analitik Nilai Siswa
          </h2>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1">
            Pantau progres akademik kelas X-XII dan kelola data tanpa membebani server.
          </p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border-2 border-black dark:border-slate-700 font-mono text-xs font-black">
          <button 
            onClick={() => setActiveView('UPLOAD')} 
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeView === 'UPLOAD' ? 'bg-yellow-400 text-black shadow-sm border border-black' : 'text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white border border-transparent'}`}
          >
            📥 Olah Data Excel
          </button>
          <button 
            onClick={() => setActiveView('ANALITIK')} 
            className={`px-4 py-2 rounded-lg transition-all cursor-pointer ${activeView === 'ANALITIK' ? 'bg-blue-600 text-white shadow-sm border border-black dark:border-transparent' : 'text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white border border-transparent'}`}
          >
            🧠 Rasionalisasi SNBP
          </button>
        </div>
      </div>

      {activeView === 'UPLOAD' && (
        <div className="animate-fade-in">
          <div className="flex flex-col items-center justify-center p-8 border-4 border-dashed border-black/20 rounded-2xl bg-slate-50 dark:bg-slate-950">
            <span className="text-4xl mb-4">🎓</span>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-2">
              <button 
                onClick={handleDownloadTemplate}
                className="px-6 py-3 rounded-xl bg-emerald-400 text-black border-2 border-black font-mono font-black text-sm transition-transform shadow-neo hover:-translate-y-1 active:translate-y-0 active:shadow-none cursor-pointer"
              >
                📥 Unduh Template Standar
              </button>

              <label className={`px-6 py-3 rounded-xl bg-yellow-400 text-black border-2 border-black font-mono font-black text-sm transition-transform shadow-neo ${isUploading || isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 active:translate-y-0 active:shadow-none'}`}>
                {isUploading ? 'Mengekstrak Data...' : '📂 Unggah File Excel (.xlsx)'}
                <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} disabled={isUploading || isSaving} />
              </label>
            </div>

            <div className="mt-6 max-w-2xl text-center bg-blue-50 dark:bg-slate-800/50 p-4 rounded-xl border-2 border-blue-200 dark:border-slate-700">
              <p className="text-xs font-bold text-blue-800 dark:text-cyan-300 leading-relaxed flex justify-center items-center gap-1.5">
                {/* 🌟 PERBAIKAN: Ubah tahun menjadi 2027 */}
                <span>🚀</span> Mengawal Tren Nilai Menuju SNBP 2027
              </p>
              <p className="text-[11px] font-mono text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                {/* 🌟 PERBAIKAN: Ubah narasi menjadi semester 1-5 dan tahun 2027 */}
                TKA kini jadi bagian wajib dalam SNBP 2027. Gunakan template standar untuk memetakan nilai dari semester 1 sampai 5. Sistem akan mengkalkulasi tren akademik dan merekomendasikan mata uji TKA (validator nilai rapor) yang paling sesuai.
              </p>
            </div>
          </div>

          {dataPreview.length > 0 && (
            <div className="mt-8 animate-fade-in border-t-4 border-black/10 pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <div>
                  <h3 className="text-sm font-black font-mono uppercase tracking-widest text-slate-800 dark:text-slate-200">👀 Pratinjau Data Terekstrak</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono font-bold uppercase">Menampilkan 5 Baris Pertama • <span className="text-emerald-600 dark:text-emerald-400">{dataPreview.length} Baris Siap Disinkronisasi</span></p>
                </div>
                
                <button 
                  onClick={handleSimpanKeDatabase} disabled={isSaving}
                  className={`px-6 py-3 rounded-xl bg-blue-600 text-white border-2 border-black font-mono font-black text-xs uppercase tracking-wider transition-all shadow-neo ${isSaving ? 'opacity-70 cursor-wait' : 'hover:-translate-y-1 active:translate-y-0 active:shadow-none cursor-pointer'}`}
                >
                  {isSaving ? 'Menyinkronkan Data... ⏳' : 'Patenkan ke Satelit PENA ☁️'}
                </button>
              </div>

              <div className="overflow-x-auto border-2 border-black rounded-xl custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-orange-100 dark:bg-slate-800 border-b-2 border-black">
                    <tr>
                      {Object.keys(dataPreview[0]).map((key, idx) => (
                        <th key={idx} className="p-3 font-black text-[10px] uppercase tracking-wider text-slate-800 dark:text-slate-300">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/10 dark:divide-slate-700/50">
                    {dataPreview.slice(0, 5).map((row, rowIdx) => (
                      <tr key={rowIdx} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {Object.values(row).map((val, colIdx) => (
                          <td key={colIdx} className="p-3 font-mono text-xs font-bold text-slate-600 dark:text-slate-400">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'ANALITIK' && (
        <div className="animate-fade-in">
          
          <div className="bg-slate-900 text-white border-4 border-black p-6 rounded-2xl shadow-neo mb-8 relative overflow-hidden">
             <div className="absolute right-0 top-0 opacity-10 text-9xl pointer-events-none transform translate-x-4 -translate-y-8">🚀</div>
             {/* 🌟 PERBAIKAN: Ubah tahun menjadi 2027 */}
             <h3 className="text-xl font-black uppercase tracking-widest text-yellow-400 mb-2">Simulasi Rasionalisasi SNBP 2027</h3>
             <p className="text-xs text-slate-300 font-mono leading-relaxed max-w-3xl">
                Sistem membaca rekam jejak nilai rapor siswa di database. sistem akan merekomendasikan mata uji TKA yang relevan dengan rapor sebagai validator utama kelolosan.
             </p>
          </div>

          {isLoadingAnalitik ? (
            <div className="py-20 text-center font-mono text-blue-600 dark:text-cyan-400 font-black animate-pulse">
              Memindai Database Nilai Siswa...
            </div>
          ) : dbSiswaList.length === 0 ? (
            <div className="py-20 text-center font-mono text-slate-500 italic">
              Belum ada data nilai yang tersimpan. Silakan unggah Excel terlebih dahulu.
            </div>
          ) : (
            <div className="overflow-x-auto border-4 border-black rounded-2xl custom-scrollbar shadow-sm">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-blue-600 text-white border-b-4 border-black">
                  <tr>
                    <th className="p-4 font-black text-[10px] uppercase tracking-wider text-center w-16">No</th>
                    <th className="p-4 font-black text-[10px] uppercase tracking-wider">Identitas Siswa</th>
                    <th className="p-4 font-black text-[10px] uppercase tracking-wider text-center border-l-2 border-black/20">Rata-Rata Rapor</th>
                    <th className="p-4 font-black text-[10px] uppercase tracking-wider border-l-2 border-black/20">Mapel Terkuat (Rapor)</th>
                    <th className="p-4 font-black text-[10px] uppercase tracking-wider border-l-2 border-black/20">Saran TKA & Jurusan</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 dark:divide-slate-700/50">
                  {dbSiswaList.map((siswa, idx) => (
                    <tr key={siswa.id} className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4 text-center font-mono font-bold text-slate-500">{idx + 1}</td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{siswa.nama}</div>
                        <div className="text-[10px] font-mono text-slate-500">NISN: {siswa.nisn} • Kelas: {siswa.kelas_terakhir}</div>
                      </td>
                      <td className="p-4 text-center border-l-2 border-black/5 dark:border-slate-800/50">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-xl text-xs font-mono font-black border-2 ${siswa.statusAman ? 'bg-emerald-100 text-emerald-800 border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30' : 'bg-rose-100 text-rose-800 border-rose-400 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30'}`}>
                          {siswa.rataRataKeseluruhan}
                        </span>
                      </td>
                      <td className="p-4 border-l-2 border-black/5 dark:border-slate-800/50">
                        <div className="flex flex-col gap-1">
                          {siswa.mapelTerkuat.map((m, i) => (
                            <span key={i} className="text-[10px] font-bold text-slate-700 dark:text-slate-300">
                              {m.mapel.replace('_', ' ')} <span className="text-blue-600 dark:text-cyan-400">({m.nilai})</span>
                           </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-4 border-l-2 border-black/5 dark:border-slate-800/50">
                        <div className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-400 mb-1">TKA: {siswa.rekomendasiTka}</div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 max-w-xs truncate">Prospek: {siswa.rekomendasiProdi}</div>
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
  );
}
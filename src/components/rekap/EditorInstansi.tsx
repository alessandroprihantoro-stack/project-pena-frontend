import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import { calculateKebutuhan } from '../../utils/kalkulasiGuru';

export interface ProcessedData {
  kabupaten: string;
  sekolah: string;
  mapel: Record<string, { kurang: number; kelebihan: number; totalJam: number; guruAda: number }>;
}

export interface SurplusTeacher {
  id: string | number;
  nama: string;
  nip: string;
  pangkat: string;
  statusPegawai: string;
  ijasah: string;
  bidangStudi: string;
  tugasMengajar: string;
  jamMengajar: number | '';
  jamTambahan: number | '';
  rincianTugasTambahan?: string;
  totalJam: number | '';
  alamat: string;
  sekolah?: string;
}

interface EditMapelData {
  totalJam: number | '';
  guruTersedia: number | '';
  kurang: number;
  kelebihan: number;
}

interface EditorProps {
  data: ProcessedData[];
  mapelList: string[];
  listSekolahFilter: string[];
  allSurplusTeachers: SurplusTeacher[];
}

const EditorInstansi: React.FC<EditorProps> = ({ data, mapelList, listSekolahFilter, allSurplusTeachers }) => {
  const [editSekolah, setEditSekolah] = useState<string>('');
  const [editFormData, setEditFormData] = useState<ProcessedData | null>(null);
  const [editCalc, setEditCalc] = useState<Record<string, EditMapelData>>({});
  const [surplusTeachers, setSurplusTeachers] = useState<SurplusTeacher[]>([]);
  
  // FITUR ENTERPRISE: Kotak Pencarian Mapel
  const [searchMapel, setSearchMapel] = useState<string>('');
  
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  const SECRET_PIN = "6irisaka"; 
  const MASTER_PASSWORD = "SuperAdmin2026!"; 

  const uniqueKabupaten = Array.from(new Set(data.map(d => d.kabupaten).filter(Boolean)));

  const handleSelectEditSekolah = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sek = e.target.value;
    setEditSekolah(sek);
    setIsUnlocked(false);
    setPasswordInput('');
    setSearchMapel(''); // Reset pencarian saat ganti sekolah

    if (sek === 'NEW') {
      setEditFormData({ kabupaten: '', sekolah: '', mapel: {} });
      const initialCalc: Record<string, EditMapelData> = {};
      mapelList.forEach(m => { initialCalc[m] = { totalJam: '', guruTersedia: '', kurang: 0, kelebihan: 0 }; });
      setEditCalc(initialCalc);
      setSurplusTeachers([]);
    } else if (sek) {
      const schoolData = data.find(d => d.sekolah === sek);
      if (schoolData) {
        setEditFormData(JSON.parse(JSON.stringify(schoolData)));
        const initialCalc: Record<string, EditMapelData> = {};
        
        mapelList.forEach(m => {
           initialCalc[m] = { 
             totalJam: Number(schoolData.mapel[m]?.totalJam) > 0 ? schoolData.mapel[m].totalJam : '', 
             guruTersedia: Number(schoolData.mapel[m]?.guruAda) > 0 ? schoolData.mapel[m].guruAda : '', 
             kurang: schoolData.mapel[m]?.kurang || 0, 
             kelebihan: schoolData.mapel[m]?.kelebihan || 0 
           };
        });
        setEditCalc(initialCalc);
        
        const existingTeachers = allSurplusTeachers.filter(t => t.sekolah === sek);
        setSurplusTeachers(existingTeachers);
      }
    } else {
      setEditFormData(null);
      setSurplusTeachers([]);
    }
  };

  const handleUnlock = () => {
    if (passwordInput === SECRET_PIN) setIsUnlocked(true);
    else { alert("Akses Ditolak! PIN salah."); setPasswordInput(''); }
  };

  const handleCalculationUI = (mapel: string, field: 'totalJam' | 'guruTersedia', value: string) => {
    const numVal = value === '' ? '' : parseInt(value);
    
    setEditCalc(prev => {
      const currentMapel = prev[mapel] || { totalJam: '', guruTersedia: '', kurang: 0, kelebihan: 0 };
      const updatedMapel = { ...currentMapel, [field]: numVal };

      const T = updatedMapel.totalJam === '' ? 0 : Number(updatedMapel.totalJam);
      const G = updatedMapel.guruTersedia === '' ? 0 : Number(updatedMapel.guruTersedia);

      if (T > 0 || G > 0) {
          const { kurang, kelebihan } = calculateKebutuhan(mapel, T, G);
          updatedMapel.kurang = kurang;
          updatedMapel.kelebihan = kelebihan;
      } else {
          updatedMapel.kurang = 0;
          updatedMapel.kelebihan = 0;
      }

      return { ...prev, [mapel]: updatedMapel };
    });
  };

  const hasAnySurplus = Object.values(editCalc).some(calc => calc.kelebihan > 0);

  const handleSimpanData = async () => {
    if (!editFormData) return;
    const targetSekolah = editSekolah === 'NEW' ? editFormData.sekolah.trim() : editSekolah;
    if (!targetSekolah || !editFormData.kabupaten || editFormData.kabupaten === '-') { 
        alert("⚠️ Nama Sekolah dan Kabupaten wajib dipilih/diisi!"); 
        return; 
    }

    setIsSaving(true);

    try {
      // FITUR ENTERPRISE: SMART SAVE (Filter data kosong)
      const payloadToSave = mapelList.map(mapel => {
        const calc = editCalc[mapel];
        const originalMapel = editFormData.mapel[mapel] || {};
        
        const T = calc?.totalJam === '' ? 0 : Number(calc?.totalJam);
        const G = calc?.guruTersedia === '' ? 0 : Number(calc?.guruTersedia);
        
        let finalKurang = calc?.kurang || 0;
        let finalLebih = calc?.kelebihan || 0;

        if (T === 0 && G === 0) {
            finalKurang = originalMapel.kurang || 0;
            finalLebih = originalMapel.kelebihan || 0;
        }

        return {
          sekolah: targetSekolah, 
          kabupaten: editFormData.kabupaten, 
          mapel: mapel,
          kurang: finalKurang, 
          kelebihan: finalLebih,
          total_jam: T, 
          guru_ada: G,
          last_updated: new Date().toISOString()
        };
      }).filter(item => {
          // Hanya simpan jika SEKARANG ada isinya, atau SEBELUMNYA ada isinya (untuk ditimpa jadi 0)
          const hasDataNow = item.total_jam > 0 || item.guru_ada > 0 || item.kurang !== 0 || item.kelebihan !== 0;
          const original = editFormData.mapel[item.mapel];
          const hadDataBefore = original && (original.totalJam > 0 || original.guruAda > 0 || original.kurang !== 0 || original.kelebihan !== 0);
          return hasDataNow || hadDataBefore;
      });

      // Proses simpan payload yang sudah di-diet-kan (Dari 80 baris menjadi hanya belasan baris!)
      if (payloadToSave.length > 0) {
          const { error: errKebutuhan } = await supabase.from('kebutuhan_guru').upsert(payloadToSave, { onConflict: 'sekolah, mapel' });
          if (errKebutuhan) throw errKebutuhan;
      }

      await supabase.from('guru_kelebihan').delete().eq('sekolah', targetSekolah);

      if (surplusTeachers.length > 0) {
        const teacherPayload = surplusTeachers.map(t => ({
          sekolah: targetSekolah, nama: t.nama, nip: t.nip, pangkat: t.pangkat, status_pegawai: t.statusPegawai, ijasah: t.ijasah, bidang_studi: t.bidangStudi, tugas_mengajar: t.tugasMengajar, jam_mengajar: Number(t.jamMengajar) || 0, jam_tambahan: Number(t.jamTambahan) || 0, rincian_tugas_tambahan: t.rincianTugasTambahan || '', total_jam: Number(t.totalJam) || 0, alamat: t.alamat
        }));
        const { error: errTeacher } = await supabase.from('guru_kelebihan').insert(teacherPayload);
        if (errTeacher) throw errTeacher;
      }

      alert("🎉 Data instansi berhasil disimpan ke Database secara permanen!");
      
      setTimeout(() => {
        window.location.href = window.location.pathname + '?refresh=' + new Date().getTime();
      }, 800); 

    } catch (err) {
      alert("❌ Gagal menyimpan data: " + (err instanceof Error ? err.message : String(err)));
      setIsSaving(false);
    } 
  };

  const handleDeleteSekolah = async () => {
    if (!editSekolah || editSekolah === 'NEW') return;
    const pass = window.prompt("⚠️ OTORISASI DIPERLUKAN ⚠️\n\nMasukkan Master Password untuk menghapus sekolah ini:");
    if (pass !== MASTER_PASSWORD) {
        if (pass !== null) alert("❌ Akses Ditolak! Master Password salah.");
        return;
    }
    const confirmDelete = window.confirm(`🔥 PERINGATAN BAHAYA 🔥\n\nApakah Anda YAKIN ingin MENGHAPUS PERMANEN seluruh data instansi:\n"${editSekolah}"?\n\nData yang dihapus tidak akan dapat dikembalikan!`);
    if (!confirmDelete) return;

    setIsSaving(true);
    try {
      const { error: errKebutuhan } = await supabase.from('kebutuhan_guru').delete().eq('sekolah', editSekolah);
      if (errKebutuhan) throw errKebutuhan;
      const { error: errGuru } = await supabase.from('guru_kelebihan').delete().eq('sekolah', editSekolah);
      if (errGuru) throw errGuru;

      alert(`✅ Seluruh data untuk instansi ${editSekolah} berhasil dihapus permanen dari Database.`);
      
      setTimeout(() => {
        window.location.href = window.location.pathname + '?refresh=' + new Date().getTime();
      }, 800);

    } catch (err) {
      alert("❌ Gagal menghapus data: " + (err instanceof Error ? err.message : String(err)));
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditSekolah('');
    setEditFormData(null);
    setSurplusTeachers([]);
    setIsUnlocked(false);
    setPasswordInput('');
    setSearchMapel('');
  };

  const addSurplusRow = () => setSurplusTeachers([...surplusTeachers, { id: Date.now(), nama: '', nip: '', pangkat: '', statusPegawai: '', ijasah: '', bidangStudi: '', tugasMengajar: '', jamMengajar: '', jamTambahan: '', rincianTugasTambahan: '', totalJam: '', alamat: '' }]);
  const updateSurplusRow = (id: string | number, field: keyof SurplusTeacher, value: string | number) => {
    setSurplusTeachers(surplusTeachers.map(teacher => {
      if (teacher.id === id) {
        const updated = { ...teacher, [field]: value };
        if (field === 'jamMengajar' || field === 'jamTambahan') updated.totalJam = (Number(updated.jamMengajar) || 0) + (Number(updated.jamTambahan) || 0);
        return updated;
      }
      return teacher;
    }));
  };
  const removeSurplusRow = (id: string | number) => setSurplusTeachers(surplusTeachers.filter(t => t.id !== id));

  const currentKabupaten = (!editFormData?.kabupaten || editFormData.kabupaten === '-') ? '' : editFormData.kabupaten;

  // FITUR ENTERPRISE: AUTO-SORTING & FILTERING UI
  // Mapel yang ada isinya (T/G/K/L > 0) otomatis dikumpulkan di paling atas!
  const activeMapelsFirst = [...mapelList].sort((a, b) => {
    const aActive = Number(editCalc[a]?.totalJam) > 0 || Number(editCalc[a]?.guruTersedia) > 0 || editCalc[a]?.kurang !== 0 || editCalc[a]?.kelebihan !== 0;
    const bActive = Number(editCalc[b]?.totalJam) > 0 || Number(editCalc[b]?.guruTersedia) > 0 || editCalc[b]?.kurang !== 0 || editCalc[b]?.kelebihan !== 0;
    
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return a.localeCompare(b);
  });

  const displayedMapels = activeMapelsFirst.filter(m => m.toLowerCase().includes(searchMapel.toLowerCase()));

  return (
    <>
      <div className="border-t border-slate-700 pt-5 mt-5 print:hidden">
        <h2 className="text-xs font-bold text-emerald-500/80 uppercase tracking-wider mb-3">📝 Mode Editor Instansi & Input Sekolah Baru</h2>
        <select className="w-full max-w-md bg-slate-950 border border-emerald-700/50 text-emerald-400 rounded-lg px-4 py-2.5" value={editSekolah} onChange={handleSelectEditSekolah}>
          <option value="">-- Pilih Sekolah Untuk Diedit --</option>
          <option value="NEW" className="text-cyan-400 font-bold">➕ TAMBAH SEKOLAH BARU</option>
          {listSekolahFilter.map(sek => <option key={sek} value={sek}>{sek}</option>)}
        </select>
      </div>

      {editSekolah && editFormData && (
        <div className="bg-slate-800 p-6 rounded-xl border border-cyan-700/50 shadow-2xl mt-6 print:hidden">
          {!isUnlocked ? (
            <div className="py-12 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-red-900/30 text-red-400 flex items-center justify-center mb-4">🔒</div>
              <p className="text-sm text-slate-400 mb-6 text-center">Masukkan PIN Otorisasi</p>
              <div className="flex gap-2">
                <input type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-center text-white" />
                <button onClick={handleUnlock} className="bg-cyan-600 hover:bg-cyan-500 px-6 py-2 rounded-lg font-bold">Buka</button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-8 flex flex-col md:flex-row gap-4 border-b border-slate-700 pb-6">
                 <div className="flex-1">
                   <label className="block text-sm font-semibold text-slate-300 mb-2">Nama Sekolah</label>
                   {editSekolah === 'NEW' ? (
                       <input type="text" value={editFormData.sekolah} onChange={(e) => setEditFormData({...editFormData, sekolah: e.target.value.toUpperCase()})} placeholder="Ketik nama sekolah baru..." className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none" />
                   ) : (
                       <input type="text" value={editSekolah} disabled className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed font-bold" />
                   )}
                 </div>
                 <div className="flex-1">
                    <label className="block text-sm font-semibold text-slate-300 mb-2">Kabupaten / Kota</label>
                    <select value={currentKabupaten} onChange={(e) => setEditFormData({...editFormData, kabupaten: e.target.value})} className={`w-full bg-slate-900 border rounded-lg px-4 py-2 text-white focus:border-cyan-500 focus:outline-none ${!currentKabupaten ? 'border-rose-500 ring-1 ring-rose-500/50' : 'border-slate-600'}`}>
                      <option value="">-- Wajib Pilih Kabupaten --</option>
                      {uniqueKabupaten.filter(k => k !== '-').map(kab => <option key={kab} value={kab}>{kab}</option>)}
                      {currentKabupaten && !uniqueKabupaten.includes(currentKabupaten) && (
                          <option value={currentKabupaten}>{currentKabupaten}</option>
                      )}
                    </select>
                 </div>
              </div>

              <div className="mb-8">
                {/* FITUR ENTERPRISE: Live Search Bar UI */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                    <label className="block text-sm font-bold text-cyan-400">Kalkulator Kebutuhan Guru <span className="text-xs text-slate-400 font-normal ml-2">(Jam ideal: 30 jam pelajaran)</span></label>
                    <div className="relative w-full sm:w-72">
                       <span className="absolute left-3 top-2.5 text-slate-500">🔍</span>
                       <input 
                          type="text" 
                          placeholder="Cari Mata Pelajaran (cth: Agama, Teknik)" 
                          value={searchMapel}
                          onChange={(e) => setSearchMapel(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none transition-colors shadow-inner"
                       />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayedMapels.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-slate-500 border-2 border-dashed border-slate-700 rounded-xl">
                       Mata pelajaran tidak ditemukan. Coba gunakan kata kunci lain.
                    </div>
                  ) : (
                    displayedMapels.map(mapel => {
                      const isBK = mapel.toLowerCase().includes('bimbingan') || mapel.toLowerCase().includes('konseling') || mapel.toLowerCase() === 'bk';
                      const labelT = isBK ? 'TOTAL KELAS' : 'TOTAL JAM';
                      const labelG = isBK ? 'TOTAL GURU' : 'GURU SAAT INI';
                      
                      // Penanda visual untuk mapel yang ada isinya
                      const isActive = Number(editCalc[mapel]?.totalJam) > 0 || Number(editCalc[mapel]?.guruTersedia) > 0;

                      return (
                      <div key={mapel} className={`p-4 rounded-lg border transition-colors ${isActive ? 'bg-cyan-900/20 border-cyan-800/50 shadow-md' : 'bg-slate-900/50 border-slate-700'}`}>
                        <p className={`text-sm font-bold mb-3 truncate ${isActive ? 'text-cyan-300' : 'text-slate-400'}`}>{mapel}</p>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">{labelT}</label>
                            <input type="number" min="0" value={editCalc[mapel]?.totalJam} onChange={(e) => handleCalculationUI(mapel, 'totalJam', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-center text-white focus:border-cyan-500 focus:bg-slate-900 outline-none transition-colors"/>
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 mb-1">{labelG}</label>
                            <input type="number" min="0" value={editCalc[mapel]?.guruTersedia} onChange={(e) => handleCalculationUI(mapel, 'guruTersedia', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-2 text-center text-white focus:border-cyan-500 focus:bg-slate-900 outline-none transition-colors"/>
                          </div>
                        </div>
                        <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-lg border border-slate-800/50">
                          <div className="text-center"><span className="text-[10px] text-slate-500 block">KURANG</span><span className="text-sm font-bold text-amber-400">{editCalc[mapel]?.kurang || 0}</span></div>
                          <div className="text-center"><span className="text-[10px] text-slate-500 block">LEBIH</span><span className="text-sm font-bold text-emerald-400">{editCalc[mapel]?.kelebihan || 0}</span></div>
                        </div>
                      </div>
                      )
                    })
                  )}
                </div>
              </div>

              {hasAnySurplus && (
                <div className="bg-rose-900/30 border-l-4 border-rose-500 p-4 rounded-r-lg mb-6">
                  <p className="text-rose-400 font-bold text-lg mb-1">⚠️ Peringatan: Terdeteksi Kelebihan Guru!</p>
                  <p className="text-slate-300 text-sm">Sesuai prosedur, Anda diwajibkan untuk menginputkan <strong>SELURUH data rincian guru</strong> pada mata pelajaran yang berstatus "Lebih" ke dalam tabel di bawah ini.</p>
                </div>
              )}

              <div className="mb-8 border-t border-slate-700 pt-8">
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-semibold text-slate-300">Tabel Data Kelebihan Guru</label>
                  <button onClick={addSurplusRow} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/50">+ Tambah Baris Guru</button>
                </div>
                
                <div className="overflow-x-auto rounded-lg border border-slate-700">
                  <table className="w-full border-collapse text-sm">
                    <thead className="bg-slate-900 text-slate-300 text-center whitespace-nowrap">
                      <tr>
                        <th className="p-3 border-r border-slate-700">No</th>
                        <th className="p-3 border-r border-slate-700">Nama</th>
                        <th className="p-3 border-r border-slate-700">NIP</th>
                        <th className="p-3 border-r border-slate-700">Pangkat/Golongan</th>
                        <th className="p-3 border-r border-slate-700">PNS/P3K</th>
                        <th className="p-3 border-r border-slate-700">Ijasah S1</th>
                        <th className="p-3 border-r border-slate-700">Bidang Studi Serdik</th>
                        <th className="p-3 border-r border-slate-700">Tugas Mengajar</th>
                        <th className="p-3 border-r border-slate-700">Jam Mengajar</th>
                        <th className="p-3 border-r border-slate-700">Jam Tambahan</th>
                        <th className="p-3 border-r border-slate-700 min-w-40 text-amber-300">Rincian Tambahan</th>
                        <th className="p-3 border-r border-slate-700">Total Jam</th>
                        <th className="p-3 border-r border-slate-700">Alamat Domisili</th>
                        <th className="p-3">Hapus</th>
                      </tr>
                    </thead>
                    <tbody>
                      {surplusTeachers.length === 0 ? (
                        <tr><td colSpan={14} className="text-center py-8 text-slate-500 italic font-medium">Belum ada rincian data guru kelebihan.</td></tr>
                      ) : (
                        surplusTeachers.map((teacher, index) => (
                          <tr key={teacher.id} className="border-b border-slate-700/50">
                            <td className="p-2 border-r border-slate-700/50 text-center text-slate-400">{index + 1}</td>
                            <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.nama} onChange={(e) => updateSurplusRow(teacher.id, 'nama', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.nip} onChange={(e) => updateSurplusRow(teacher.id, 'nip', e.target.value)} className="w-full min-w-32 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.pangkat} onChange={(e) => updateSurplusRow(teacher.id, 'pangkat', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.statusPegawai} onChange={(e) => updateSurplusRow(teacher.id, 'statusPegawai', e.target.value)} className="w-full min-w-32 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.ijasah} onChange={(e) => updateSurplusRow(teacher.id, 'ijasah', e.target.value)} className="w-full min-w-32 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors" /></td>
                            <td className="p-2 border-r border-slate-700/50">
                              <select value={teacher.bidangStudi} onChange={(e) => updateSurplusRow(teacher.id, 'bidangStudi', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors">
                                <option value="">Pilih Bidang Studi...</option>
                                {mapelList.map(m => <option key={m} value={m}>{m}</option>)}
                              </select>
                            </td>
                            <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.tugasMengajar} onChange={(e) => updateSurplusRow(teacher.id, 'tugasMengajar', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="number" min="0" value={teacher.jamMengajar} onChange={(e) => updateSurplusRow(teacher.id, 'jamMengajar', e.target.value)} className="w-full min-w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none text-center transition-colors" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="number" min="0" value={teacher.jamTambahan} onChange={(e) => updateSurplusRow(teacher.id, 'jamTambahan', e.target.value)} className="w-full min-w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none text-center transition-colors" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="text" placeholder="Misal: Wali Kelas" value={teacher.rincianTugasTambahan || ''} onChange={(e) => updateSurplusRow(teacher.id, 'rincianTugasTambahan', e.target.value)} className="w-full min-w-40 bg-slate-900 border border-amber-600/50 rounded px-2 py-1.5 focus:border-amber-500 outline-none transition-colors" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="number" value={teacher.totalJam} readOnly className="w-full min-w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-emerald-400 font-bold outline-none text-center cursor-not-allowed" /></td>
                            <td className="p-2 border-r border-slate-700/50"><input type="text" value={teacher.alamat} onChange={(e) => updateSurplusRow(teacher.id, 'alamat', e.target.value)} className="w-full min-w-56 bg-slate-900 border border-slate-600 rounded px-2 py-1.5 focus:border-cyan-500 outline-none transition-colors" /></td>
                            <td className="p-2 text-center"><button onClick={() => removeSurplusRow(teacher.id)} className="text-red-400 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded transition-colors font-bold">X</button></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-700 pt-6">
                <div>
                  {editSekolah !== 'NEW' && (
                    <button onClick={handleDeleteSekolah} disabled={isSaving} className="px-6 py-3 rounded-lg font-bold transition-all text-red-100 bg-red-900/50 hover:bg-red-700 hover:text-white border border-red-800">
                      🗑️ HAPUS SEKOLAH INI
                    </button>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <button onClick={handleCancelEdit} disabled={isSaving} className="px-6 py-3 rounded-lg font-bold transition-all text-slate-300 bg-slate-700 hover:bg-slate-600 hover:text-white">
                    ❌ BATAL / TUTUP
                  </button>
                  <button onClick={handleSimpanData} disabled={isSaving} className={`px-8 py-3 rounded-lg font-bold transition-all shadow-lg ${isSaving ? 'bg-slate-600 text-slate-400 cursor-not-allowed shadow-none' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/50'}`}>
                    {isSaving ? '🔄 MENYIMPAN DATA...' : '💾 SIMPAN DATA SEKOLAH'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default EditorInstansi;
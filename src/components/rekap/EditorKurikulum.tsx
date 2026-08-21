import React, { useState } from 'react';
import { KurikulumItem } from './constantsKurikulum';
import ModalGeneratorKurikulum from './ModalGeneratorKurikulum';

interface EditorKurikulumProps {
  kurikulum: KurikulumItem[];
  setKurikulum: (val: KurikulumItem[]) => void;
  profilSekolah: { jenjang: string };
  baseMapels: string[];
  schoolTeachers: { bidangStudi: string; tugasMengajar?: string; tugasNonLinier?: string; tugasNonLinier2?: string }[];
  selectedSchoolData: { nama_sekolah: string } | null;
}

const EditorKurikulum: React.FC<EditorKurikulumProps> = ({
  kurikulum, setKurikulum, profilSekolah, schoolTeachers, selectedSchoolData
}) => {
  // State untuk mengontrol Modal mana yang terbuka
  const [activeModal, setActiveModal] = useState<'SMA_X' | 'SMA_XIXII' | 'SMK' | 'SLB' | null>(null);
  const [kelasTargetSMK, setKelasTargetSMK] = useState<'X' | 'XI' | 'XII'>('X');

  const removeKurikulumRow = (id?: number) => { 
      if (!id) return; 
      setKurikulum(kurikulum.filter(k => k.id !== id)); 
  };

  const updateKurikulumRow = (id: number | undefined, field: keyof KurikulumItem, value: string | number) => {
      if (!id) return; 
      setKurikulum(kurikulum.map(k => k.id === id ? { ...k, [field]: value } : k));
  };

  const handleGenerateComplete = (generatedItems: KurikulumItem[], modeGenerate: 'TIMPA' | 'TAMBAH') => {
      if (modeGenerate === 'TIMPA') {
          setKurikulum(generatedItems);
          alert(`✅ Berhasil! Struktur Kurikulum di-reset dan digenerate baru (${generatedItems.length} Mapel).`);
      } else {
          const currentData = [...kurikulum];
          generatedItems.forEach(newItem => {
              const existingIdx = currentData.findIndex(ex => ex.mapel.toUpperCase() === newItem.mapel.toUpperCase());
              if (existingIdx !== -1) {
                  currentData[existingIdx].rombel += newItem.rombel; 
              } else {
                  currentData.push(newItem);
              }
          });
          setKurikulum(currentData);
          alert(`✅ Berhasil! Rombel dari ${generatedItems.length} Mapel berhasil diakumulasikan ke tabel kurikulum.`);
      }
      setActiveModal(null); // Tutup modal setelah selesai
  };

  return (
    <div className="bg-slate-900/50 p-5 rounded-xl border border-fuchsia-600/50 mb-8 shadow-inner">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-700 pb-3 gap-4">
            <div>
               <h4 className="text-sm font-bold text-fuchsia-400 uppercase tracking-wider">2. Data Struktur Kurikulum & Rombel Instansi</h4>
               <span className="text-xs text-slate-400 font-bold bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block border border-slate-600">Mode Algoritma: {profilSekolah.jenjang}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              
              {profilSekolah.jenjang === 'SMA' && (
                  <>
                    <button onClick={() => setActiveModal('SMA_X')} className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded font-bold transition-colors shadow-lg">⚡ Generate Kelas X</button>
                    <button onClick={() => setActiveModal('SMA_XIXII')} className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded font-bold transition-colors shadow-lg">⚡ Generate Kelas XI / XII</button>
                  </>
              )}

              {profilSekolah.jenjang === 'SMK' && (
                  <>
                    <button onClick={() => {setKelasTargetSMK('X'); setActiveModal('SMK');}} className="bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded font-bold text-xs shadow-lg">⚡ Generate Kelas X</button>
                    <button onClick={() => {setKelasTargetSMK('XI'); setActiveModal('SMK');}} className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded font-bold text-xs shadow-lg">⚡ Generate Kelas XI</button>
                    <button onClick={() => {setKelasTargetSMK('XII'); setActiveModal('SMK');}} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded font-bold text-xs shadow-lg">⚡ Generate Kelas XII</button>
                  </>
              )}

              {profilSekolah.jenjang === 'SLB' && (
                  <button onClick={() => setActiveModal('SLB')} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded font-bold transition-colors shadow-lg">
                      ⚡ Generate Kurikulum SLB
                  </button>
              )}

            </div>
        </div>

        <div className="hidden md:flex gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">
            <div className="w-8"></div>
            {profilSekolah.jenjang === 'SMK' && <div className="w-32">Kategori</div>}
            <div className="flex-1">Mata Pelajaran</div>
            {profilSekolah.jenjang === 'SLB' ? (
                <><div className="w-24 text-center">Rombel Riil</div><div className="w-28 text-center text-emerald-400">Rombel Gabung</div></>
            ) : (<div className="w-24 text-center">Rombel</div>)}
            <div className="w-24 text-center">{profilSekolah.jenjang === 'SMA' || profilSekolah.jenjang === 'SMK' ? 'JP Tatap Muka' : 'JP Rombel'}</div>
            {(profilSekolah.jenjang === 'SMA' || profilSekolah.jenjang === 'SMK') && <div className="w-24 text-center text-amber-400">JP P5 (Koku)</div>}
            <div className="w-12 text-center">Hapus</div>
        </div>

        <div className="space-y-3 max-h-100 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
            {kurikulum.map((item, index) => {
                let totalJP: number;
                if (profilSekolah.jenjang === 'SMA' || profilSekolah.jenjang === 'SMK') {
                    totalJP = (item.rombel * (item.jp || 0)) + (item.rombel * (item.jp_p5 || 0));
                } else if (profilSekolah.jenjang === 'SLB') {
                    const effectiveRombel = item.rombel_gabungan && item.rombel_gabungan > 0 ? item.rombel_gabungan : item.rombel;
                    totalJP = effectiveRombel * (item.jp || 0);
                } else { 
                    totalJP = item.rombel * (item.jp || 0);
                }
                
                const idealBulat = Math.ceil(totalJP / 24);
                
                const guruEksisting = item.mapel ? schoolTeachers.filter(t => 
                    t.bidangStudi === item.mapel || 
                    t.tugasMengajar === item.mapel ||
                    t.tugasNonLinier === item.mapel ||
                    t.tugasNonLinier2 === item.mapel
                ).length : 0;
                
                const selisih = guruEksisting - idealBulat;
                
                let bgStatus = "bg-slate-800 text-slate-400 border-slate-600";
                let textStatus = "Menunggu Input...";
                
                if (item.mapel && totalJP > 0) {
                    if (selisih < 0) { bgStatus = "bg-rose-900/80 text-rose-200 border-rose-500 font-black"; textStatus = `KURANG ${Math.abs(selisih)} GURU`; } 
                    else if (selisih > 0) { bgStatus = "bg-emerald-900/50 text-emerald-300 border-emerald-500 font-black"; textStatus = `LEBIH ${Math.abs(selisih)} GURU`; } 
                    else { bgStatus = "bg-blue-900/50 text-blue-300 border-blue-500 font-black"; textStatus = "PAS / IDEAL"; }
                }

                return (
                <div key={item.id} className="flex flex-col bg-slate-950 p-4 rounded-xl border border-slate-700 shadow-sm relative">
                    <div className="flex flex-col md:flex-row gap-3 items-center">
                        <div className="w-full md:w-8 flex justify-center items-center text-slate-500 font-bold">{index + 1}.</div>
                        
                        {profilSekolah.jenjang === 'SMK' && (
                            <div className="w-full md:w-32">
                                <div className="w-full bg-slate-900 border border-slate-700 text-slate-400 rounded px-2 py-2 text-xs font-bold text-center">
                                    {item.kategori_mapel || 'UMUM'}
                                </div>
                            </div>
                        )}

                        <div className="w-full md:flex-1">
                            <div className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded px-3 py-2 text-sm font-bold shadow-inner truncate" title={item.mapel}>
                                {item.mapel}
                            </div>
                        </div>
                        
                        <div className="w-full md:w-24">
                            <input type="number" min="0" value={item.rombel || ''} onChange={(e) => updateKurikulumRow(item.id, 'rombel', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-fuchsia-500 text-center" title="Jumlah Rombel Fisik" />
                        </div>
                        
                        {profilSekolah.jenjang === 'SLB' && (
                            <div className="w-full md:w-28 relative">
                                <input type="number" min="0" value={item.rombel_gabungan || ''} onChange={(e) => updateKurikulumRow(item.id, 'rombel_gabungan', Number(e.target.value))} className="w-full bg-emerald-950 border border-emerald-600/50 text-emerald-300 rounded px-3 py-2 text-sm outline-none focus:border-emerald-500 text-center font-bold" title="Jumlah Rombel Setelah Diakui (Penggabungan Kelas Lintas Ketunaan)" placeholder="Gabung" />
                            </div>
                        )}

                        <div className="w-full md:w-24">
                            <input type="number" min="0" value={item.jp || ''} onChange={(e) => updateKurikulumRow(item.id, 'jp', Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 text-slate-200 rounded px-3 py-2 text-sm outline-none focus:border-fuchsia-500 text-center" />
                        </div>

                        {(profilSekolah.jenjang === 'SMA' || profilSekolah.jenjang === 'SMK') && (
                            <div className="w-full md:w-24">
                                <div className="w-full bg-amber-950/30 border border-amber-600/50 text-amber-300 rounded px-3 py-2 text-sm text-center font-bold">
                                    {item.jp_p5} JP
                                </div>
                            </div>
                        )}

                        <div className="w-full md:w-12 flex justify-center">
                            <button onClick={() => removeKurikulumRow(item.id)} className="bg-rose-900/50 hover:bg-rose-600 text-rose-300 hover:text-white p-2 rounded transition-colors font-bold" title="Hapus Mapel">X</button>
                        </div>
                    </div>

                    {item.mapel && totalJP > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap gap-4 items-center justify-between bg-slate-900/50 px-4 py-2 rounded-lg">
                            <div className="flex gap-6">
                                <div className="text-center">
                                    <span className="block text-[9px] text-slate-500 uppercase font-bold">Total Algoritma JP</span>
                                    <span className="text-sm font-bold text-amber-400">{totalJP}</span>
                                </div>
                                <div className="text-center border-l border-slate-700 pl-6">
                                    <span className="block text-[9px] text-slate-500 uppercase font-bold">Kebutuhan (Ideal)</span>
                                    <span className="text-sm font-bold text-white">{idealBulat}</span>
                                </div>
                                <div className="text-center border-l border-slate-700 pl-6 relative">
                                    <span className="block text-[9px] text-cyan-500 uppercase font-bold">Guru Eksisting (Bawah)</span>
                                    <span className="text-sm font-bold text-cyan-400">{guruEksisting}</span>
                                </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-lg border text-xs tracking-wider shadow-sm ${bgStatus}`}>{textStatus}</div>
                        </div>
                    )}
                </div>
                );
            })}

            {kurikulum.length === 0 && (
                <div className="text-center text-slate-400 py-10 bg-slate-900/50 rounded-lg border border-dashed border-slate-600">
                    <p className="mb-2 text-lg">📭</p>
                    <p className="font-bold">Struktur Kurikulum Belum Diisi</p>
                    <p className="text-xs mt-1">Silakan gunakan tombol <b>⚡ Generate</b> di atas untuk menarik data mapel secara otomatis.</p>
                </div>
            )}
        </div>

        {/* COMPONENT MODAL DIPISAH KE FILE TERSENDIRI */}
        <ModalGeneratorKurikulum 
            activeModal={activeModal} 
            kelasTarget={kelasTargetSMK} 
            onClose={() => setActiveModal(null)} 
            onGenerate={handleGenerateComplete} 
            namaSekolah={selectedSchoolData?.nama_sekolah || ''} 
        />

    </div>
  );
};

export default EditorKurikulum;
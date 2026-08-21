// src/components/rekap/ModalGeneratorKurikulum.tsx
import React, { useState } from 'react';
import { 
    AGAMA_LIST, SENI_LIST, WAJIB_KELAS_X, WAJIB_KELAS_XI_XII, PILIHAN_5JP, PILIHAN_2JP, 
    WAJIB_SMK_X, WAJIB_SMK_XI, WAJIB_SMK_XII, KEBUTUHAN_KHUSUS_SLB, KETERAMPILAN_SLB, 
    KurikulumItem 
} from './constantsKurikulum';

interface ModalGeneratorProps {
    activeModal: 'SMA_X' | 'SMA_XIXII' | 'SMK' | 'SLB' | null;
    kelasTarget: string; // 'X', 'XI', 'XII', atau 'I'-'VI'
    onClose: () => void;
    onGenerate: (items: KurikulumItem[], mode: 'TIMPA' | 'TAMBAH') => void;
    namaSekolah: string;
}

const ModalGeneratorKurikulum: React.FC<ModalGeneratorProps> = ({ activeModal, kelasTarget, onClose, onGenerate, namaSekolah }) => {
    const [modeGenerate, setModeGenerate] = useState<'TIMPA' | 'TAMBAH'>('TAMBAH');
    
    // Global State untuk semua jenis Modal
    const [rombel, setRombel] = useState<number>(0);
    const [rombelGabung, setRombelGabung] = useState<number>(0); // Khusus SLB
    const [jenjangSLB, setJenjangSLB] = useState<'SDLB' | 'SMPLB' | 'SMALB'>('SDLB');
    const [kelasSLB, setKelasSLB] = useState<string>('I');
    
    const [agamaSelections, setAgamaSelections] = useState<Record<string, boolean>>({'Pendidikan Agama Islam dan Budi Pekerti': true});
    const [seniSelection, setSeniSelection] = useState<string>('Seni Rupa');
    const [pilihanSelections, setPilihanSelections] = useState<Record<string, boolean>>({});
    
    const [includeKoding, setIncludeKoding] = useState<boolean>(false);
    const [includeMulok, setIncludeMulok] = useState<boolean>(true);
    
    // Khusus SLB
    const [hambatanSLB, setHambatanSLB] = useState<string>('C');
    const [keterampilanSLB, setKeterampilanSLB] = useState<Record<string, boolean>>({});

    if (!activeModal) return null;

    const executeGenerator = () => {
        const generated: KurikulumItem[] = [];
        let counter = 1;
        const getNewId = () => Date.now() + counter++;

        // --- ENGINE SMA ---
        if (activeModal === 'SMA_X' || activeModal === 'SMA_XIXII') {
            const isKelasX = activeModal === 'SMA_X';
            AGAMA_LIST.forEach(agama => { if (agamaSelections[agama]) generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: agama, kategori_mapel: 'UMUM', rombel, jp: 2, jp_p5: 1 }); });
            
            const wajibMapel = isKelasX ? WAJIB_KELAS_X : WAJIB_KELAS_XI_XII;
            wajibMapel.forEach(wajib => { generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: wajib.mapel, kategori_mapel: 'UMUM', rombel, jp: wajib.jp, jp_p5: wajib.jp_p5 }); });
            
            generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: seniSelection, kategori_mapel: 'UMUM', rombel, jp: 2, jp_p5: 0 });
            
            if (!isKelasX) {
                Object.entries(pilihanSelections).filter(item => item[1]).forEach(item => {
                    const is2JP = PILIHAN_2JP.includes(item[0]); 
                    generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: item[0], kategori_mapel: 'PILIHAN', rombel, jp: is2JP ? 2 : 5, jp_p5: 0 });
                });
            } else if (includeKoding) {
                generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: 'Koding dan Kecerdasan Artifisial', kategori_mapel: 'UMUM', rombel, jp: 2, jp_p5: 0 });
            }

            if (includeMulok) generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: 'Muatan Lokal', kategori_mapel: 'UMUM', rombel, jp: 2, jp_p5: 0 });
        }

        // --- ENGINE SMK ---
        else if (activeModal === 'SMK') {
            AGAMA_LIST.forEach(agama => { if (agamaSelections[agama]) generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: agama, kategori_mapel: 'UMUM', rombel, jp: 2, jp_p5: 1 }); });

            if (kelasTarget === 'X') {
                WAJIB_SMK_X.forEach(wajib => generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: wajib.mapel, kategori_mapel: wajib.kat, rombel, jp: wajib.jp, jp_p5: wajib.jp_p5 }));
                generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: seniSelection, kategori_mapel: 'UMUM', rombel, jp: 2, jp_p5: 0 });
                if (includeKoding) generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: 'Koding dan Kecerdasan Artifisial', kategori_mapel: 'PILIHAN', rombel, jp: 2, jp_p5: 0 });
            } else if (kelasTarget === 'XI') {
                WAJIB_SMK_XI.forEach(wajib => generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: wajib.mapel, kategori_mapel: wajib.kat, rombel, jp: wajib.jp, jp_p5: wajib.jp_p5 }));
            } else if (kelasTarget === 'XII') {
                WAJIB_SMK_XII.forEach(wajib => generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: wajib.mapel, kategori_mapel: wajib.kat, rombel, jp: wajib.jp, jp_p5: wajib.jp_p5 }));
            }

            if (includeMulok) generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: 'Muatan Lokal', kategori_mapel: 'UMUM', rombel, jp: 2, jp_p5: 0 });
        }

        // --- ENGINE SLB (BARU) ---
        else if (activeModal === 'SLB') {
            AGAMA_LIST.forEach(agama => { if (agamaSelections[agama]) generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: agama, kategori_mapel: 'UMUM', rombel, rombel_gabungan: rombelGabung, jp: 3 }); });

            if (jenjangSLB === 'SDLB') {
                generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: 'Pendidikan Pancasila', kategori_mapel: 'UMUM', rombel, rombel_gabungan: rombelGabung, jp: 2 });
                generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: 'Bahasa Indonesia', kategori_mapel: 'UMUM', rombel, rombel_gabungan: rombelGabung, jp: 3 });
                generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: 'Matematika', kategori_mapel: 'UMUM', rombel, rombel_gabungan: rombelGabung, jp: 3 });
                generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: 'Pendidikan Jasmani Olahraga dan Kesehatan', kategori_mapel: 'UMUM', rombel, rombel_gabungan: rombelGabung, jp: 2 });
                generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: seniSelection, kategori_mapel: 'UMUM', rombel, rombel_gabungan: rombelGabung, jp: 2 });
                
                if (['IV', 'V', 'VI'].includes(kelasSLB)) {
                    generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: 'Ilmu Pengetahuan Alam dan Sosial', kategori_mapel: 'UMUM', rombel, rombel_gabungan: rombelGabung, jp: 2 });
                    generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: 'Bahasa Inggris', kategori_mapel: 'UMUM', rombel, rombel_gabungan: rombelGabung, jp: 2 });
                }
            } else if (jenjangSLB === 'SMPLB') {
                ['Pendidikan Pancasila', 'Bahasa Indonesia', 'Matematika', 'Ilmu Pengetahuan Alam', 'Ilmu Pengetahuan Sosial', 'Bahasa Inggris', 'Pendidikan Jasmani Olahraga dan Kesehatan', seniSelection].forEach(m => {
                    generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: m, kategori_mapel: 'UMUM', rombel, rombel_gabungan: rombelGabung, jp: 2 });
                });
            } else if (jenjangSLB === 'SMALB') {
                ['Pendidikan Pancasila', 'Bahasa Indonesia', 'Matematika', 'Ilmu Pengetahuan Alam', 'Ilmu Pengetahuan Sosial', 'Bahasa Inggris', 'Pendidikan Jasmani Olahraga dan Kesehatan', seniSelection].forEach(m => {
                    generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: m, kategori_mapel: 'UMUM', rombel, rombel_gabungan: rombelGabung, jp: 2 });
                });
            }

            if (hambatanSLB) {
                generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: `Program Kebutuhan Khusus: ${KEBUTUHAN_KHUSUS_SLB[hambatanSLB]}`, kategori_mapel: 'KEBUTUHAN KHUSUS', rombel, rombel_gabungan: rombelGabung, jp: 2 });
            }

            if (jenjangSLB !== 'SDLB') {
                Object.entries(keterampilanSLB).filter(item => item[1]).forEach(item => {
                    generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: `Keterampilan Pilihan: ${item[0]}`, kategori_mapel: 'KETERAMPILAN', rombel, rombel_gabungan: rombelGabung, jp: 12 });
                });
            }

            generated.push({ id: getNewId(), sekolah: namaSekolah, mapel: 'Muatan Lokal', kategori_mapel: 'UMUM', rombel, rombel_gabungan: rombelGabung, jp: 2 });
        }

        onGenerate(generated, modeGenerate);
    };

    const isSMA = activeModal === 'SMA_X' || activeModal === 'SMA_XIXII';
    const isSMK = activeModal === 'SMK';
    const isSLB = activeModal === 'SLB';

    const selectedCountXIXII = Object.values(pilihanSelections).filter(Boolean).length;
    const selectedCountKetSLB = Object.values(keterampilanSLB).filter(Boolean).length;

    const borderColor = isSMA ? 'border-sky-500' : isSMK ? 'border-amber-500' : 'border-emerald-500';
    const bgColor = isSMA ? 'bg-sky-950/40' : isSMK ? 'bg-amber-950/40' : 'bg-emerald-950/40';
    const textColor = isSMA ? 'text-sky-400' : isSMK ? 'text-amber-400' : 'text-emerald-400';
    const btnColor = isSMA ? 'bg-sky-600 hover:bg-sky-500' : isSMK ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fade-in">
            <div className={`border-2 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-in bg-slate-900 ${borderColor}`}>
                <div className={`p-5 border-b ${bgColor} border-slate-700`}>
                    <h3 className={`text-xl font-black uppercase tracking-wider flex items-center gap-2 ${textColor}`}>
                        ⚡ Otomatisasi Kurikulum {isSMA ? 'SMA' : isSMK ? `SMK KELAS ${kelasTarget}` : 'SLB'}
                    </h3>
                </div>
                
                <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                    <div className="bg-slate-950 border border-slate-700 p-4 rounded-lg flex items-center justify-between">
                        <div><strong className="text-slate-200 text-sm block mb-1">Mode Eksekusi</strong></div>
                        <div className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700">
                            <button onClick={() => setModeGenerate('TAMBAH')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${modeGenerate === 'TAMBAH' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>➕ Tambah</button>
                            <button onClick={() => setModeGenerate('TIMPA')} className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${modeGenerate === 'TIMPA' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>🗑️ Reset</button>
                        </div>
                    </div>

                    {isSLB && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950 border border-slate-700 p-4 rounded-lg">
                                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-2">Jenjang SLB</label>
                                {/* 🌟 FIX ESLINT: as 'SDLB' | 'SMPLB' | 'SMALB' */}
                                <select value={jenjangSLB} onChange={(e) => setJenjangSLB(e.target.value as 'SDLB' | 'SMPLB' | 'SMALB')} className="w-full bg-slate-900 border border-slate-600 text-white rounded px-3 py-2 text-sm outline-none focus:border-emerald-400 font-bold">
                                    <option value="SDLB">SD Luar Biasa</option><option value="SMPLB">SMP Luar Biasa</option><option value="SMALB">SMA Luar Biasa</option>
                                </select>
                            </div>
                            <div className="bg-slate-950 border border-slate-700 p-4 rounded-lg">
                                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-2">Kelas Target</label>
                                <select value={kelasSLB} onChange={(e) => setKelasSLB(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white rounded px-3 py-2 text-sm outline-none focus:border-emerald-400 font-bold">
                                    {jenjangSLB === 'SDLB' ? ['I','II','III','IV','V','VI'].map(c => <option key={c} value={c}>Kelas {c}</option>) : ['VII','VIII','IX','X','XI','XII'].map(c => <option key={c} value={c}>Kelas {c}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className={`grid ${isSLB ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
                        <div className="bg-slate-950 border border-slate-700 p-4 rounded-lg">
                            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-2">Total Rombel Fisik</label>
                            <input type="number" min="1" value={rombel || ''} onChange={(e) => setRombel(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-600 text-white rounded px-3 py-2 outline-none focus:border-indigo-400 text-center font-bold" placeholder="Cth: 5" />
                        </div>
                        {isSLB && (
                            <div className="bg-slate-950 border border-emerald-700/50 p-4 rounded-lg shadow-inner">
                                <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-2">Rombel Gabungan</label>
                                <input type="number" min="0" value={rombelGabung || ''} onChange={(e) => setRombelGabung(Number(e.target.value))} className="w-full bg-emerald-950 border border-emerald-600 text-emerald-200 rounded px-3 py-2 outline-none focus:border-emerald-400 text-center font-bold" placeholder="Bila digabung" />
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-950 border border-slate-700 p-4 rounded-lg">
                        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-3">Agama Yang Diselenggarakan</label>
                        <div className="grid grid-cols-1 gap-2">
                            {AGAMA_LIST.map(agama => (
                                <label key={agama} className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer hover:text-white">
                                    <input type="checkbox" checked={agamaSelections[agama]} onChange={(e) => setAgamaSelections({...agamaSelections, [agama]: e.target.checked})} className="w-4 h-4 accent-indigo-500 rounded bg-slate-800" /> {agama}
                                </label>
                            ))}
                        </div>
                    </div>

                    {((isSMA && activeModal === 'SMA_X') || (isSMK && kelasTarget === 'X') || isSLB) && (
                        <div className="bg-slate-950 border border-slate-700 p-4 rounded-lg">
                            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-2">Pilih 1 Jenis Seni</label>
                            <select value={seniSelection} onChange={(e) => setSeniSelection(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-white rounded px-3 py-2 text-sm outline-none focus:border-indigo-400">
                                {SENI_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    )}

                    {isSLB && (
                        <div className="bg-slate-950 border border-slate-700 p-4 rounded-lg">
                            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-3">Jenis Ketunaan (Kebutuhan Khusus)</label>
                            <select value={hambatanSLB} onChange={(e) => setHambatanSLB(e.target.value)} className="w-full bg-slate-900 border border-slate-600 text-amber-300 rounded px-3 py-2 text-xs outline-none focus:border-emerald-400 font-bold">
                                {Object.entries(KEBUTUHAN_KHUSUS_SLB).map(([key, label]) => ( <option key={key} value={key}>{label}</option> ))}
                            </select>
                        </div>
                    )}

                    {isSLB && jenjangSLB !== 'SDLB' && (
                        <div className={`bg-slate-950 border p-4 rounded-lg ${jenjangSLB === 'SMPLB' && selectedCountKetSLB < 2 ? 'border-rose-500/50' : 'border-emerald-500/50'}`}>
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">Keterampilan Vokasi</label>
                                <span className={`text-[10px] font-black px-2 py-1 rounded ${jenjangSLB === 'SMPLB' && selectedCountKetSLB < 2 ? 'bg-rose-900 text-rose-300' : 'bg-emerald-900 text-emerald-300'}`}>Terpilih: {selectedCountKetSLB}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {KETERAMPILAN_SLB.map(ket => (
                                    <label key={ket} className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer hover:text-white bg-slate-900 p-2 rounded border border-slate-800">
                                        <input type="checkbox" checked={keterampilanSLB[ket] || false} onChange={(e) => setKeterampilanSLB({...keterampilanSLB, [ket]: e.target.checked})} className="w-3.5 h-3.5 mt-0.5 accent-indigo-500 bg-slate-800" /> <span className="leading-tight">{ket}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {isSMA && activeModal === 'SMA_XIXII' && (
                        <div className={`bg-slate-950 border p-4 rounded-lg ${selectedCountXIXII >= 4 && selectedCountXIXII <= 5 ? 'border-sky-500/50' : 'border-rose-500/50'}`}>
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block">Mata Pelajaran Pilihan</label>
                                <span className={`text-[10px] font-black px-2 py-1 rounded ${selectedCountXIXII >= 4 && selectedCountXIXII <= 5 ? 'bg-sky-900 text-sky-300' : 'bg-rose-900 text-rose-300'}`}>Terpilih: {selectedCountXIXII} / 5</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                                {[...PILIHAN_5JP, ...PILIHAN_2JP].map(mapel => (
                                    <label key={mapel} className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer hover:text-white bg-slate-900 p-2 rounded border border-slate-800">
                                        <input type="checkbox" checked={pilihanSelections[mapel] || false} onChange={(e) => setPilihanSelections({...pilihanSelections, [mapel]: e.target.checked})} className="w-3.5 h-3.5 mt-0.5 accent-indigo-500 bg-slate-800" />
                                        <span className="leading-tight">{mapel}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-950 border border-slate-700 p-4 rounded-lg">
                        <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest block mb-3">Opsi Tambahan</label>
                        <div className="space-y-3">
                            {((isSMA && activeModal === 'SMA_X') || (isSMK && kelasTarget === 'X')) && (
                                <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer hover:text-white">
                                    <input type="checkbox" checked={includeKoding} onChange={(e) => setIncludeKoding(e.target.checked)} className="w-4 h-4 accent-indigo-500 rounded bg-slate-800"/> Koding & Kecerdasan Artifisial (Pilihan)
                                </label>
                            )}
                            <label className="flex items-center gap-3 text-sm text-slate-300 cursor-pointer hover:text-white">
                                <input type="checkbox" checked={includeMulok} onChange={(e) => setIncludeMulok(e.target.checked)} className="w-4 h-4 accent-indigo-500 rounded bg-slate-800"/> Muatan Lokal (Maks. 2 JP)
                            </label>
                        </div>
                    </div>

                </div>
                <div className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-bold transition-colors">Batal</button>
                    <button onClick={executeGenerator} disabled={rombel <= 0} className={`px-6 py-2.5 rounded-lg text-sm font-black transition-colors shadow-lg ${rombel <= 0 ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : `${btnColor} text-white`}`}>⚡ Eksekusi!</button>
                </div>
            </div>
        </div>
    );
};

export default ModalGeneratorKurikulum;
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useReactToPrint } from 'react-to-print';

import CoverPDF from '../../components/TemplatePDF/CoverPDF';
import Bab1PDF from '../../components/TemplatePDF/Bab1PDF';
import Bab2PDF, { BarisJurnal, KegiatanManual as KegiatanBab2 } from '../../components/TemplatePDF/Bab2PDF';
import Bab3PDF from '../../components/TemplatePDF/Bab3PDF';
import LampiranPDF from '../../components/TemplatePDF/LampiranPDF';

const DATA_PENGAWAS = [
  { nama: "Tri Hartanto, S.Pd., M.Pd.", nip: "197210191998021003", pangkat: "Pembina Utama Muda", golongan: "IV/c" },
  { nama: "Sri Sutarni, S.Pd, M.Pd.", nip: "197208051997032005", pangkat: "Pembina Utama Muda", golongan: "IV/c" },
  { nama: "Nur Alviyanti Fauzi, S.S., M.Pd.", nip: "197602202010012009", pangkat: "Penata Tingkat I", golongan: "III/d" },
  { nama: "Gita Eka Setyasari, S.Pd.", nip: "198211252008042002", pangkat: "Penata Tingkat I", golongan: "III/d" },
  { nama: "Tri Lestari, S.Pd.", nip: "197406062001122004", pangkat: "Pembina Utama Muda", golongan: "IV/c" },
  { nama: "Wahyuni Rusdiyanti, S.Pd.", nip: "197411222003122005", pangkat: "Pembina", golongan: "IV/a" },
  { nama: "Retno Widianto, S.Pd.", nip: "197912032006041005", pangkat: "Pembina", golongan: "IV/a" },
  { nama: "Nana Wahyu Sri Rejeki, S.Psi., M.Si.", nip: "198302082008012008", pangkat: "Pembina Tingkat I", golongan: "IV/b" },
  { nama: "Anggrit Yusnanto, S.Kom.", nip: "198112172011011002", pangkat: "Penata Tingkat I", golongan: "III/d" },
  { nama: "Suratno, S.Pd.", nip: "198311092009031008", pangkat: "Penata Tingkat I", golongan: "III/d" },
  { nama: "Bambang Tri Wijayanto, S.Pd., M.Pd.", nip: "197408122000031007", pangkat: "Pembina Utama Muda", golongan: "IV/c" },
  { nama: "Uji Saputro, S.Si., M.Si.", nip: "198001142008011017", pangkat: "Penata Tingkat I", golongan: "III/d" },
  { nama: "Christianto Tri Cahyono, S.Pd.", nip: "197607282006041005", pangkat: "Pembina Utama Muda", golongan: "IV/c" },
  { nama: "Jarko Handoyo Putro, S.Pd.", nip: "197804292007011007", pangkat: "Penata Tingkat I", golongan: "III/d" },
  { nama: "Dwi Ristanto, S.Pd., M.Pd.", nip: "198310252006041003", pangkat: "Pembina Utama Muda", golongan: "IV/c" },
  { nama: "Joko Susilo, S.Pd, M.Si.", nip: "197308052008011006", pangkat: "Pembina", golongan: "IV/a" },
  { nama: "Puthut Prihantoro, S.Pd.", nip: "198609182011011011", pangkat: "Penata Tingkat I", golongan: "III/d" },
  { nama: "Sunarto, S.Pd.", nip: "197009071998011003", pangkat: "Pembina Tingkat I", golongan: "IV/b" },
  { nama: "Ribut Rustinah, S.Pd.", nip: "197105311997032003", pangkat: "Pembina Utama Muda", golongan: "IV/c" }
];

const MASTER_SHEET_ID = "1Ba5Gpi8Ox2MJ36Yd-i7GEKft5LS6lxW9hEgqDRRytFg";

const OPSI_APEL = ["KaCabDin", "Kasi SMA/SLB", "Seluruh Pengawas", "MKKS"];
const OPSI_TINDAKAN = ["Pendampingan", "Supervisi", "Monitoring", "Sosialisasi", "Zoom", "Observasi Kinerja Kepala Sekolah", "Verifikasi", "Desk", "Workshop"];
const OPSI_PROGRAM = ["OSN", "SPMB", "SPMI", "E-KSP", "RKT", "ARKAS", "O2SN", "FLS3N", "Program SMA Mantap", "Program Insersi Koperasi", "Program SBI", "ASTS", "ASAS", "ASAJ", "ASAT", "Pembelajaran Mendalam"];

// MESIN CERDAS: FORMAT TANGGAL
const formatExcelDate = (excelDate: string | number) => {
  if (!excelDate) return '-';
  const num = Number(excelDate);
  if (!isNaN(num)) {
    const date = new Date((num - 25569) * 86400 * 1000);
    const utcDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return `${String(utcDate.getDate()).padStart(2, '0')}/${String(utcDate.getMonth() + 1).padStart(2, '0')}/${utcDate.getFullYear()}`;
  }
  const str = String(excelDate).trim();
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
     return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }
  return str; 
};

// MESIN CERDAS: FILTER BULAN ANTI-GAGAL (Toleran Format US/UK/ID)
const isDateInPeriodeSafe = (rawDateStr: string, tw: string) => {
  if (!tw || !rawDateStr || rawDateStr === '-') return true;
  const parts = rawDateStr.split(/[-/]/);
  if (parts.length < 2) return true; 

  let m ;
  if (parts[0].length === 4) {
      m = parseInt(parts[1], 10); // Format YYYY-MM-DD
  } else {
      const p0 = parseInt(parts[0], 10);
      const p1 = parseInt(parts[1], 10);
      if (p0 > 12) m = p1; // Pasti DD/MM/YYYY
      else if (p1 > 12) m = p0; // Pasti MM/DD/YYYY
      else {
          const d = new Date(rawDateStr);
          if (!isNaN(d.getTime())) m = d.getMonth() + 1; // Deteksi otomatis bawaan JS
          else m = p1; // Fallback ke standar Indonesia (DD/MM/YYYY)
      }
  }

  if (m >= 1 && m <= 12) {
      if (tw === 'TW1') return m >= 1 && m <= 3;
      if (tw === 'TW2') return m >= 4 && m <= 6;
      if (tw === 'TW3') return m >= 7 && m <= 9;
      if (tw === 'TW4') return m >= 10 && m <= 12;
  }
  return true; // Jika benar-benar gagal dideteksi, loloskan datanya (jangan dibuang)
};

export interface KegiatanUIState extends KegiatanBab2 {
  mode: 'manual' | 'apel' | 'tindakan';
  opsiApel: string;
  customApel: string;
  opsiTindakan: string;
  customTindakan: string;
  opsiProgram: string;
  customProgram: string;
}

export default function GeneratorLaporan() {
  const [step, setStep] = useState<number>(1);
  const [nipPengawas, setNipPengawas] = useState<string>('');
  const [periode, setPeriode] = useState<string>('');
  const [tanggalCetak, setTanggalCetak] = useState<string>('');
  const [tempatCetak, setTempatCetak] = useState<string>(''); // STATE BARU
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [dataBulan1, setDataBulan1] = useState<BarisJurnal[]>([]);
  const [dataBulan2, setDataBulan2] = useState<BarisJurnal[]>([]);
  const [dataBulan3, setDataBulan3] = useState<BarisJurnal[]>([]);

  const getInitialKegiatan = (): KegiatanUIState[] => Array.from({ length: 4 }, () => ({ 
    mode: 'manual', opsiApel: '', customApel: '', opsiTindakan: '', customTindakan: '', opsiProgram: '', customProgram: '', 
    judul: '', deskripsi: '', fotoUrl: '' 
  }));
  
  const [manualBulan1, setManualBulan1] = useState<KegiatanUIState[]>(getInitialKegiatan());
  const [manualBulan2, setManualBulan2] = useState<KegiatanUIState[]>(getInitialKegiatan());
  const [manualBulan3, setManualBulan3] = useState<KegiatanUIState[]>(getInitialKegiatan());

  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const pengawasTerpilih = DATA_PENGAWAS.find(p => p.nip === nipPengawas);

  const handleProsesEkstraksi = async () => {
    if (!pengawasTerpilih) return;
    setIsProcessing(true);
    try {
      const urlCsv = `https://docs.google.com/spreadsheets/d/${MASTER_SHEET_ID}/gviz/tq?tqx=out:csv`;
      const response = await fetch(urlCsv);
      if (!response.ok) throw new Error("Gagal menghubungi server Google Sheets.");
      const csvText = await response.text();

      const workbook = XLSX.read(csvText, { type: 'string' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });

      const headers = rawData[0].map((h: any) => String(h || '').toLowerCase());
      const idxTanggal = headers.findIndex(h => h.includes('tanggal') || h.includes('hari') || h.includes('bulan'));
      const idxTempat = headers.findIndex(h => h.includes('tempat'));
      const idxKegiatan = headers.findIndex(h => h.includes('kegiatan') || h.includes('uraian'));
      const idxHasil = headers.findIndex(h => h.includes('hasil'));
      const idxFoto = headers.findIndex(h => h.includes('dokumentasi') || h.includes('foto') || h.includes('file'));

      const kegiatanValid: BarisJurnal[] = [];
      const namaPendek = pengawasTerpilih.nama.split(',')[0].toLowerCase(); 

      for (let i = 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;
        const rowStr = JSON.stringify(row).toLowerCase();
        
        if (rowStr.includes(pengawasTerpilih.nip) || rowStr.includes(namaPendek)) {
           const rawTanggal = String(row[idxTanggal] || '');
           
           // FILTER ANTI-GAGAL
           if (!isDateInPeriodeSafe(rawTanggal, periode)) continue;

           const parsedDate = idxTanggal !== -1 ? formatExcelDate(row[idxTanggal]) : '-';
           const kegiatanStr = String(row[idxKegiatan] || '');
           if (kegiatanStr && kegiatanStr !== 'undefined' && kegiatanStr.toLowerCase() !== 'kegiatan') {
              let fotoUrl = '';
              if (idxFoto !== -1) {
                const rawFoto = String(row[idxFoto] || '');
                const match = rawFoto.match(/(https?:\/\/[^\s,]+)/);
                if (match) fotoUrl = match[1];
              }

              kegiatanValid.push({
                tanggal: parsedDate,
                tempat: idxTempat !== -1 ? String(row[idxTempat] || '-').trim() : '-',
                kegiatan: kegiatanStr.trim(),
                hasil: idxHasil !== -1 ? String(row[idxHasil] || '-').trim() : '-',
                fotoUrl: fotoUrl, 
                terpilihUntukBab2: false 
              });
           }
        }
      }

      if (kegiatanValid.length > 0) {
        const chunkSize = Math.ceil(kegiatanValid.length / 3);
        setDataBulan1(kegiatanValid.slice(0, chunkSize));
        setDataBulan2(kegiatanValid.slice(chunkSize, chunkSize * 2));
        setDataBulan3(kegiatanValid.slice(chunkSize * 2));
      } else {
        setDataBulan1([]); setDataBulan2([]); setDataBulan3([]);
      }
      setStep(2);
    } catch (error: any) {
      alert(error.message || "Terjadi kesalahan sistem.");
      setStep(2);
    } finally {
      setIsProcessing(false);
    }
  };

  const recompileTemplate = (item: KegiatanUIState): KegiatanUIState => {
    let newJudul = item.judul;
    let newDesk = item.deskripsi;

    if (item.mode === 'apel') {
      const target = item.opsiApel === 'Lainnya' ? item.customApel : item.opsiApel;
      if (target) {
        newJudul = `Apel dan Koordinasi Rutin dengan ${target}`;
        newDesk = `Kegiatan apel dan koordinasi ini dilaksanakan sebagai sarana komunikasi, evaluasi program kerja, dan penyamaan persepsi dalam pelaksanaan tugas kepengawasan bersama ${target}. Berbagai isu strategis pendidikan dibahas, termasuk evaluasi pelaksanaan program sebelumnya serta penyusunan langkah-langkah strategis untuk mendukung peningkatan mutu pendidikan. Hasil kegiatan menunjukkan meningkatnya koordinasi dan sinergi antar pemangku kepentingan.`;
      } else {
        newJudul = ''; newDesk = '';
      }
    } else if (item.mode === 'tindakan') {
      const tindakan = item.opsiTindakan === 'Lainnya' ? item.customTindakan : item.opsiTindakan;
      const program = item.opsiProgram === 'Lainnya' ? item.customProgram : item.opsiProgram;
      
      if (tindakan && program) {
        newJudul = `${tindakan} ${program}`;
        let konteksProgram = "upaya peningkatan mutu dan layanan pendidikan di sekolah binaan.";
        if (program === "SPMI") konteksProgram = "pemenuhan 8 Standar Nasional Pendidikan dan memastikan siklus penjaminan mutu internal (SPMI) berjalan secara sistematis di sekolah.";
        else if (program === "SPMB") konteksProgram = "pelaksanaan penerimaan murid baru berjalan secara transparan, objektif, akuntabel, dan berkeadilan sesuai dengan regulasi yang berlaku.";
        else if (program === "E-KSP" || program.includes("KSP")) konteksProgram = "membantu sekolah menyusun dokumen Kurikulum Satuan Pendidikan (KSP) yang sesuai dengan karakteristik sekolah dan kebutuhan peserta didik.";
        else if (program === "ARKAS" || program === "RKT") konteksProgram = "penyusunan perencanaan program dan tata kelola keuangan sekolah yang transparan, efektif, dan akuntabel.";
        else if (program === "Pembelajaran Mendalam") konteksProgram = "pengembangan kemampuan berpikir kritis, kreatif, kolaboratif, dan komunikatif peserta didik melalui implementasi strategi pembelajaran mendalam (Deep Learning) di kelas.";
        else if (program === "OSN" || program === "O2SN" || program === "FLS3N") konteksProgram = "peningkatan prestasi, bakat, dan minat peserta didik melalui pembinaan kompetisi yang terstruktur dan terukur.";
        else if (program.includes("ASTS") || program.includes("ASAS") || program.includes("ASAJ") || program.includes("ASAT")) konteksProgram = "evaluasi capaian pembelajaran dan asesmen peserta didik secara objektif, komprehensif, dan tepat waktu.";
        else if (program === "Program Insersi Koperasi") konteksProgram = "mengintegrasikan nilai-nilai perkoperasian dalam pembelajaran untuk membangun karakter gotong royong, tanggung jawab, dan jiwa kewirausahaan peserta didik.";
        else if (program === "Program SBI") konteksProgram = "internalisasi rencana aksi program Sekolah Berkebinekaan (SBI) agar seluruh pihak memiliki pemahaman yang sama terhadap indikator kinerja.";

        let konteksTindakan = `Melalui langkah strategis ini, pengawas memberikan pendampingan, arahan teknis, serta evaluasi berkala untuk mendorong perbaikan sistem secara berkelanjutan.`;
        if (tindakan === "Monitoring" || tindakan === "Verifikasi") konteksTindakan = `Pengawas melakukan pemantauan ketat terhadap berbagai aspek pelaksanaan, mulai dari kesiapan administrasi hingga implementasi teknis di lapangan, guna memastikan kesesuaian dengan standar operasional baku.`;
        else if (tindakan === "Sosialisasi" || tindakan === "Workshop") konteksTindakan = `Kegiatan ini bertujuan memberikan pemahaman mendalam dan pelatihan teknis kepada pihak sekolah mengenai regulasi, mekanisme, dan prosedur pelaksanaan program.`;
        else if (tindakan === "Observasi Kinerja Kepala Sekolah") konteksTindakan = `Kegiatan ini difokuskan pada penilaian kompetensi manajerial dan kepemimpinan, guna memperkuat kapasitas kepala sekolah dalam merancang dan melaksanakan program pengembangan sekolah.`;
        else if (tindakan === "Supervisi") konteksTindakan = `Pengawas melakukan pengamatan dan pembinaan langsung untuk mengevaluasi efektivitas program, serta memberikan umpan balik (feedback) konstruktif guna peningkatan kualitas kinerja.`;
        else if (tindakan === "Desk") konteksTindakan = `Kegiatan desk (pemeriksaan dokumen) dilakukan untuk meneliti kelengkapan, keabsahan, dan kesesuaian dokumen administrasi sekolah dengan instrumen dan regulasi yang dipersyaratkan.`;

        newDesk = `Kegiatan ${tindakan.toLowerCase()} pada program ${program} ini difokuskan pada ${konteksProgram} ${konteksTindakan}`;
      } else {
        newJudul = ''; newDesk = '';
      }
    }

    return { ...item, judul: newJudul, deskripsi: newDesk };
  };

  const handleTemplateChange = (bulan: number, index: number, field: keyof KegiatanUIState, value: string) => {
    const updateState = (prev: KegiatanUIState[]) => {
      const newState = [...prev];
      newState[index] = { ...newState[index], [field]: value };
      
      if (field === 'mode') {
        newState[index].opsiApel = ''; newState[index].customApel = '';
        newState[index].opsiTindakan = ''; newState[index].customTindakan = '';
        newState[index].opsiProgram = ''; newState[index].customProgram = '';
        if (value !== 'manual') {
          newState[index].judul = ''; newState[index].deskripsi = '';
        }
      }
      
      if (newState[index].mode !== 'manual') {
        newState[index] = recompileTemplate(newState[index]);
      }
      
      return newState;
    };

    if (bulan === 1) setManualBulan1(updateState);
    else if (bulan === 2) setManualBulan2(updateState);
    else setManualBulan3(updateState);
  };

  const handleUploadManual = (bulan: number, index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    handleTemplateChange(bulan, index, 'fotoUrl', url);
  };

  const handlePrintAction = useReactToPrint({
    contentRef: pdfContainerRef,
    documentTitle: pengawasTerpilih ? `Laporan_Triwulan_${periode}_${pengawasTerpilih.nama.replace(/[^a-zA-Z0-9]/g, '_')}` : 'Laporan_Pengawas',
    onBeforePrint: () => { setIsGeneratingPDF(true); return Promise.resolve(); },
    onAfterPrint: () => setIsGeneratingPDF(false)
  });

  const handleExportWord = () => {
    if (!pengawasTerpilih || !pdfContainerRef.current) return;
    const htmlContent = pdfContainerRef.current.innerHTML;
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Laporan Pengawas</title></head><body>`;
    const footer = "</body></html>";
    const blob = new Blob(['\ufeff', header + htmlContent + footer], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Triwulan_${periode}_${pengawasTerpilih.nama.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const semuaDataGabungan = [...dataBulan1, ...dataBulan2, ...dataBulan3];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 flex flex-col items-center justify-center relative overflow-hidden">
      
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600 rounded-full mix-blend-screen filter blur-3xl"></div>
        <div className="absolute bottom-10 -left-20 w-72 h-72 bg-cyan-600 rounded-full mix-blend-screen filter blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-linear-to-r from-emerald-400 to-cyan-400">
              Alat Bantu Pengawas
            </h1>
            <p className="text-slate-400 text-sm font-mono mt-1">Sistem Otomasi Laporan Triwulan PENA</p>
          </div>
          <Link to="/login" className="px-4 py-2 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-xl text-xs font-bold text-slate-300 transition-all shadow-lg">
            ⬅️ Kembali
          </Link>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3 text-sm font-mono font-bold text-emerald-400 uppercase tracking-widest">
              <span className="text-2xl">📄</span> {step === 1 ? "Tahap 1: Konfigurasi Laporan" : "Tahap 2: Input Narasi & Foto BAB 2"}
            </div>
            {step === 2 && (
              <button onClick={() => setStep(1)} className="text-xs font-bold text-slate-400 hover:text-white underline">⬅️ Kembali ke Tahap 1</button>
            )}
          </div>
          
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase font-mono font-bold">Nama Pengawas:</label>
                  <select value={nipPengawas} onChange={(e) => setNipPengawas(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-emerald-500 cursor-pointer font-sans">
                    <option value="">-- Pilih Pengawas --</option>
                    {DATA_PENGAWAS.map((p) => <option key={p.nip} value={p.nip}>{p.nama}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase font-mono font-bold">Periode Laporan:</label>
                  <select value={periode} onChange={(e) => setPeriode(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-emerald-500 cursor-pointer font-sans">
                    <option value="">-- Pilih Triwulan --</option>
                    <option value="TW1">Triwulan I (Jan - Mar)</option>
                    <option value="TW2">Triwulan II (Apr - Jun)</option>
                    <option value="TW3">Triwulan III (Jul - Sep)</option>
                    <option value="TW4">Triwulan IV (Okt - Des)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase font-mono font-bold">Tempat Cetak:</label>
                  <select value={tempatCetak} onChange={(e) => setTempatCetak(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-emerald-500 cursor-pointer font-sans">
                    <option value="">-- Pilih Tempat --</option>
                    <option value="Karanganyar">Karanganyar</option>
                    <option value="Sragen">Sragen</option>
                    <option value="Wonogiri">Wonogiri</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-2 uppercase font-mono font-bold">Tanggal Cetak:</label>
                  <input type="date" value={tanggalCetak} onChange={(e) => setTanggalCetak(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white outline-none focus:border-emerald-500 cursor-pointer font-sans" />
                </div>
              </div>

              <div className="pt-4 flex justify-end border-t border-slate-800">
                <button onClick={handleProsesEkstraksi} disabled={!nipPengawas || !periode || !tempatCetak || !tanggalCetak || isProcessing} className="w-full sm:w-auto px-8 py-4 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 text-white font-black rounded-xl text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-40 transition-all">
                  {isProcessing ? "MENARIK DATA LAMPIRAN..." : "TARIK DATA & LANJUT TAHAP 2"}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in duration-500">
              
              {[
                { id: 1, title: 'Bulan Pertama', data: manualBulan1 },
                { id: 2, title: 'Bulan Kedua', data: manualBulan2 },
                { id: 3, title: 'Bulan Ketiga', data: manualBulan3 }
              ].map(blok => (
                <div key={blok.id} className="border border-slate-700 rounded-2xl overflow-hidden bg-slate-900 shadow-lg p-6">
                  <h3 className="text-cyan-400 font-bold mb-4 border-b border-slate-700 pb-2">📅 Input Laporan {blok.title}</h3>
                  <div className="grid grid-cols-1 gap-6">
                    {blok.data.map((item, index) => (
                      <div key={index} className="p-5 border border-slate-800 bg-slate-950 rounded-xl shadow-inner">
                        <p className="text-sm text-emerald-400 mb-4 font-black">Kegiatan Utama #{index + 1}</p>
                        
                        <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                          <label className="block text-[11px] text-slate-400 mb-2 uppercase font-bold">Mode Pengisian Laporan:</label>
                          <select 
                            value={item.mode} 
                            onChange={(e) => handleTemplateChange(blok.id, index, 'mode', e.target.value)}
                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none focus:border-cyan-500 transition-colors"
                          >
                            <option value="manual">✍️ Ketik Manual Bebas</option>
                            <option value="apel">👥 Auto-Generate: Apel & Koordinasi Rutin</option>
                            <option value="tindakan">🎯 Auto-Generate: Pelaksanaan Program Khusus</option>
                          </select>
                        </div>

                        {item.mode === 'apel' && (
                          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-2 uppercase font-bold">Apel/Koordinasi Dengan:</label>
                              <select value={item.opsiApel} onChange={(e) => handleTemplateChange(blok.id, index, 'opsiApel', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none">
                                <option value="">- Pilih Target -</option>
                                {OPSI_APEL.map(o => <option key={o} value={o}>{o}</option>)}
                                <option value="Lainnya">Lainnya (Ketik Sendiri)</option>
                              </select>
                            </div>
                            {item.opsiApel === 'Lainnya' && (
                              <div>
                                <label className="block text-[11px] text-slate-400 mb-2 uppercase font-bold">Tulis Target Spesifik:</label>
                                <input type="text" placeholder="Contoh: Panitia PPDB..." value={item.customApel} onChange={(e) => handleTemplateChange(blok.id, index, 'customApel', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none" />
                              </div>
                            )}
                          </div>
                        )}

                        {item.mode === 'tindakan' && (
                          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-2 uppercase font-bold">Jenis Tindakan:</label>
                              <select value={item.opsiTindakan} onChange={(e) => handleTemplateChange(blok.id, index, 'opsiTindakan', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none">
                                <option value="">- Pilih Tindakan -</option>
                                {OPSI_TINDAKAN.map(o => <option key={o} value={o}>{o}</option>)}
                                <option value="Lainnya">Lainnya (Ketik Sendiri)</option>
                              </select>
                              {item.opsiTindakan === 'Lainnya' && (
                                <input type="text" placeholder="Ketik jenis tindakan..." value={item.customTindakan} onChange={(e) => handleTemplateChange(blok.id, index, 'customTindakan', e.target.value)} className="w-full mt-2 bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none" />
                              )}
                            </div>
                            <div>
                              <label className="block text-[11px] text-slate-400 mb-2 uppercase font-bold">Nama Program/Kegiatan:</label>
                              <select value={item.opsiProgram} onChange={(e) => handleTemplateChange(blok.id, index, 'opsiProgram', e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none">
                                <option value="">- Pilih Program -</option>
                                {OPSI_PROGRAM.map(o => <option key={o} value={o}>{o}</option>)}
                                <option value="Lainnya">Lainnya (Ketik Sendiri)</option>
                              </select>
                              {item.opsiProgram === 'Lainnya' && (
                                <input type="text" placeholder="Ketik nama program..." value={item.customProgram} onChange={(e) => handleTemplateChange(blok.id, index, 'customProgram', e.target.value)} className="w-full mt-2 bg-slate-900 border border-slate-600 rounded p-2 text-sm text-white outline-none" />
                              )}
                            </div>
                          </div>
                        )}

                        <div className="mt-4 pt-4 border-t border-slate-800">
                          <label className="block text-[11px] text-emerald-400 mb-2 uppercase font-bold">Pratinjau / Input Laporan:</label>
                          <input 
                            type="text" placeholder="Judul Kegiatan..." 
                            value={item.judul} onChange={(e) => handleTemplateChange(blok.id, index, 'judul', e.target.value)}
                            disabled={item.mode !== 'manual'}
                            className="w-full mb-3 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500 disabled:opacity-70 disabled:bg-slate-900"
                          />
                          <textarea 
                            placeholder="Deskripsi/Narasi Laporan..." rows={3}
                            value={item.deskripsi} onChange={(e) => handleTemplateChange(blok.id, index, 'deskripsi', e.target.value)}
                            disabled={item.mode !== 'manual'}
                            className="w-full mb-3 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500 disabled:opacity-70 disabled:bg-slate-900"
                          />
                        </div>
                        
                        <div className="flex items-center gap-4 mt-2">
                          <input 
                            type="file" accept="image/*" onChange={(e) => handleUploadManual(blok.id, index, e)}
                            className="text-[10px] text-slate-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:font-bold file:bg-emerald-600/20 file:text-emerald-400 hover:file:bg-emerald-600/40 cursor-pointer"
                          />
                          {item.fotoUrl && <img src={item.fotoUrl} alt="Preview" className="w-12 h-12 object-cover rounded border border-slate-600" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-end gap-4">
                <button onClick={handleExportWord} className="w-full sm:w-auto px-6 py-4 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 text-white font-black rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                  📝 UNDUH WORD
                </button>
                <button onClick={handlePrintAction} disabled={isGeneratingPDF} className="w-full sm:w-auto px-6 py-4 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 text-white font-black rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  🖨️ CETAK PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'none' }}>
        <div ref={pdfContainerRef}>
          <CoverPDF pengawas={pengawasTerpilih || null} periode={periode} />
          <Bab1PDF />
          <Bab2PDF manualBulan1={manualBulan1} manualBulan2={manualBulan2} manualBulan3={manualBulan3} periode={periode} />
          <Bab3PDF manualBulan1={manualBulan1} manualBulan2={manualBulan2} manualBulan3={manualBulan3} periode={periode} />
          <LampiranPDF semuaData={semuaDataGabungan} pengawas={pengawasTerpilih || null} tanggalCetak={tanggalCetak} tempatCetak={tempatCetak} />
        </div>
      </div>
    </div>
  );
}
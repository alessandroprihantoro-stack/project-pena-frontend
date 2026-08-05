import React from 'react';
// @ts-expect-error - TS tidak mengenali ekstensi .png secara default
import logoJateng from '../../assets/logo_jateng.png';

interface CoverPDFProps {
  pengawas: {
    nama: string;
    nip: string;
    pangkat?: string; 
    golongan?: string; 
  } | null;
  periode: string;
}

export default function CoverPDF({ pengawas, periode }: CoverPDFProps) {
  if (!pengawas) return null;

  const getPeriodeText = () => {
    if (periode === 'TW1') return 'JANUARI - MARET';
    if (periode === 'TW2') return 'APRIL - JUNI';
    if (periode === 'TW3') return 'JULI - SEPTEMBER';
    if (periode === 'TW4') return 'OKTOBER - DESEMBER';
    return '';
  };

  // Logika cerdas pendeteksi Jabatan berdasarkan Golongan
  const getJabatan = (golongan?: string) => {
    if (!golongan) return 'Pengawas Sekolah';
    // Golongan III = Ahli Muda
    if (golongan.includes('III')) return 'Pengawas Sekolah Ahli Muda';
    // Golongan IV = Ahli Madya
    if (golongan.includes('IV')) return 'Pengawas Sekolah Ahli Madya';
    return 'Pengawas Sekolah';
  };

  return (
    <div className="w-[210mm] h-[297mm] bg-white text-black px-16 pt-24 pb-16 mx-auto flex flex-col items-center justify-between font-serif break-after-page relative overflow-hidden box-border">
      
      {/* INJEKSI CSS KHUSUS PRINT */}
      <style>
        {`
          @media print {
            @page { size: A4 portrait; margin: 0; }
          }
        `}
      </style>

      {/* Header */}
      <div className="text-center w-full">
        <h1 className="text-3xl font-bold uppercase tracking-wider">Laporan Pelaksanaan Tugas</h1>
        <h2 className="text-3xl font-bold uppercase tracking-wider mt-3">Pengawas Sekolah</h2>
        <p className="text-xl font-bold uppercase mt-12">Periode {getPeriodeText()} 2026</p>
      </div>

      {/* Logo Jawa Tengah - Ukuran w-[450px] dipertahankan */}
      <div className="flex-1 flex items-center justify-center w-full my-8">
        <img src={logoJateng} alt="Logo Jateng" className="w-[450px] h-auto object-contain" />
      </div>

      {/* Identitas - Jabatan disisipkan, Periode Laporan dihilangkan dari bawah */}
      <div className="w-fit mx-auto mb-16 text-[13pt]">
        <div className="grid grid-cols-[200px_auto] gap-3 mb-4">
          <span className="font-bold">Nama</span>
          <span>: {pengawas.nama}</span>
        </div>
        <div className="grid grid-cols-[200px_auto] gap-3 mb-4">
          <span className="font-bold">NIP</span>
          <span>: {pengawas.nip}</span>
        </div>
        <div className="grid grid-cols-[200px_auto] gap-3 mb-4">
          <span className="font-bold">Pangkat/Gol/Ruang</span>
          <span className="whitespace-nowrap">: {pengawas.pangkat}, {pengawas.golongan}</span>
        </div>
        <div className="grid grid-cols-[200px_auto] gap-3 mb-4">
          <span className="font-bold">Jabatan</span>
          <span className="whitespace-nowrap">: {getJabatan(pengawas.golongan)}</span>
        </div>
        <div className="grid grid-cols-[200px_auto] gap-3 mb-4">
          <span className="font-bold">Unit Kerja</span>
          <span>: Cabang Dinas Pendidikan Wilayah VI</span>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center w-full font-bold text-xl mb-2 leading-relaxed">
        <p>CABANG DINAS PENDIDIKAN WILAYAH VI</p>
        <p>DINAS PENDIDIKAN PROVINSI JAWA TENGAH</p>
        <p className="mt-3">TAHUN 2026</p>
      </div>
      
    </div>
  );
}
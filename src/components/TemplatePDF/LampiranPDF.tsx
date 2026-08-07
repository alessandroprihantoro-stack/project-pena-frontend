import React from 'react';
import { BarisJurnal } from './Bab2PDF';

interface LampiranPDFProps {
  semuaData: BarisJurnal[];
  pengawas: {
    nama: string;
    nip: string;
  } | null;
  tanggalCetak?: string; 
  tempatCetak?: string; 
}

export default function LampiranPDF({ semuaData, pengawas, tanggalCetak, tempatCetak }: LampiranPDFProps) {
  if (!pengawas) return null;

  // Helper untuk merubah format YYYY-MM-DD menjadi format tanggal Indonesia
  const formatTanggalCetak = (dateString?: string) => {
    if (!dateString) return '..........................';
    const date = new Date(dateString);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // ==============================================================================
  // MESIN CERDAS v2.0: KONVERTER SUPER GOOGLE DRIVE
  // ==============================================================================
  const getDirectImageUrl = (url?: string) => {
    if (!url) return '';
    
    // Membedah link untuk mengambil File ID (Mendukung format /d/ dan ?id=)
    const match = url.match(/id=([a-zA-Z0-9_-]+)/) || url.match(/d\/([a-zA-Z0-9_-]+)/);
    
    if (match && match[1]) {
      const fileId = match[1];
      // Menggunakan endpoint 'thumbnail' Google Drive. Ini jauh lebih tangguh 
      // untuk merender gambar di dalam tag <img> dan menembus beberapa blokir browser.
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
    }
    
    return url;
  };

  const lokasiCetak = tempatCetak || '..........................';

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-black px-10 py-16 mx-auto font-sans break-before-page relative box-border">
      
      {/* Judul Lampiran */}
      <div className="text-center w-full mb-8">
        <h1 className="text-[12pt] font-bold uppercase">LAPORAN HASIL PENDAMPINGAN PENGAWAS</h1>
        <h2 className="text-[12pt] font-bold uppercase">LAMPIRAN JURNAL KEGIATAN</h2>
      </div>

      {/* Identitas Pengawas */}
      <div className="w-full mb-6 text-[11pt] font-bold">
        <div className="grid grid-cols-[140px_auto] gap-2 mb-1">
          <span className="uppercase">NAMA</span>
          <span className="uppercase">: {pengawas.nama}</span>
        </div>
        <div className="grid grid-cols-[140px_auto] gap-2 mb-1">
          <span className="uppercase">NIP</span>
          <span className="uppercase">: {pengawas.nip}</span>
        </div>
        <div className="grid grid-cols-[140px_auto] gap-2">
          <span className="uppercase whitespace-nowrap">CABANG DINAS</span>
          <span className="uppercase">: DINAS PENDIDIKAN WILAYAH VI</span>
        </div>
      </div>

      {/* Tabel Lampiran */}
      <table className="w-full border-collapse border border-black text-[10pt] mb-12">
        <thead className="bg-gray-300">
          <tr>
            <th className="border border-black p-2 w-[5%] text-center">NO</th>
            <th className="border border-black p-2 w-[12%] text-center">HARI / TANGGAL</th>
            <th className="border border-black p-2 w-[18%] text-center">TEMPAT</th>
            <th className="border border-black p-2 w-[25%] text-center">KEGIATAN</th>
            <th className="border border-black p-2 w-[25%] text-center">HASIL</th>
            <th className="border border-black p-2 w-[15%] text-center">DOKUMENTASI</th>
          </tr>
        </thead>
        <tbody>
          {semuaData.length > 0 ? (
            semuaData.map((item, index) => (
              <tr key={index} className="break-inside-avoid">
                <td className="border border-black p-2 text-center align-top">{index + 1}</td>
                <td className="border border-black p-2 text-center align-top">{item.tanggal}</td>
                <td className="border border-black p-2 align-top">{item.tempat}</td>
                <td className="border border-black p-2 align-top">{item.kegiatan}</td>
                <td className="border border-black p-2 align-top">{item.hasil}</td>
                <td className="border border-black p-2 text-center align-middle">
                  {item.fotoUrl ? (
                    <div className="flex justify-center items-center flex-col">
                      <img 
                        src={getDirectImageUrl(item.fotoUrl)} 
                        alt="Dokumentasi" 
                        className="w-full max-w-30 h-auto object-contain mx-auto border border-gray-300 p-1" 
                        onError={(e) => {
                          // Jika gagal dimuat (biasanya karena hak akses Drive tertutup)
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.error-text')) {
                            const span = document.createElement('span');
                            span.className = 'error-text text-[8pt] text-red-500 italic mt-1 text-center block';
                            span.innerText = 'Akses Drive Tertutup';
                            parent.appendChild(span);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs italic">-</span>
                  )}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="border border-black p-4 text-center italic text-gray-500">
                Tidak ada data lampiran kegiatan yang ditarik dari Spreadsheet pada Triwulan ini.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Tanda Tangan Pengawas */}
      <div className="w-full flex justify-end text-[11pt] break-inside-avoid mt-8 pr-8">
        <div className="flex flex-col items-start w-75">
          <p className="mb-24">{lokasiCetak}, {formatTanggalCetak(tanggalCetak)}</p>
          <p className="font-bold underline uppercase">{pengawas.nama}</p>
          <p>NIP. {pengawas.nip}</p>
        </div>
      </div>

    </div>
  );
}
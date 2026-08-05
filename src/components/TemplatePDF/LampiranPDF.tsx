import React from 'react';
import { BarisJurnal } from './Bab2PDF';

interface LampiranPDFProps {
  semuaData: BarisJurnal[];
  pengawas: {
    nama: string;
    nip: string;
  } | null;
  tanggalCetak?: string; 
  tempatCetak?: string; // Menangkap data tempat cetak dari GeneratorLaporan
}

export default function LampiranPDF({ semuaData, pengawas, tanggalCetak, tempatCetak }: LampiranPDFProps) {
  if (!pengawas) return null;

  // Helper untuk merubah format YYYY-MM-DD menjadi format tanggal Indonesia (DD Bulan YYYY)
  const formatTanggalCetak = (dateString?: string) => {
    if (!dateString) return '..........................';
    const date = new Date(dateString);
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // MESIN CERDAS: KONVERTER LINK GOOGLE DRIVE KE DIRECT IMAGE
  const getDirectImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('drive.google.com')) {
      const match = url.match(/id=([^&]+)/) || url.match(/d\/([^/]+)/);
      if (match && match[1]) {
        return `https://drive.google.com/uc?export=view&id=${match[1]}`;
      }
    }
    return url;
  };

  // Variabel untuk menampilkan tempat cetak dengan fallback jika kosong
  const lokasiCetak = tempatCetak || '..........................';

  return (
    // break-before-page: Memaksa lampiran selalu berada di halaman baru terpisah dari Bab 3
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
                    <img 
                      src={getDirectImageUrl(item.fotoUrl)} 
                      alt="Dokumentasi" 
                      className="w-full max-w-30 h-auto object-contain mx-auto border border-gray-300 p-1" 
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
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

      {/* Tanda Tangan Pengawas - Menggunakan break-inside-avoid agar tidak terpotong beda halaman */}
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
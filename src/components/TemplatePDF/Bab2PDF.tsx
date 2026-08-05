import React from 'react';

export interface BarisJurnal {
  tanggal: string;
  tempat: string;
  kegiatan: string;
  hasil: string;
  terpilihUntukBab2?: boolean;
  fotoUrl?: string;
  fotoFile?: File;
}

export interface KegiatanManual {
  judul: string;
  deskripsi: string;
  fotoUrl: string;
}

interface Bab2PDFProps {
  manualBulan1: KegiatanManual[];
  manualBulan2: KegiatanManual[];
  manualBulan3: KegiatanManual[];
  periode: string;
}

const tahun = '2026';

const RenderBulanSection = ({ judulBulan, abjad, data }: { judulBulan: string, abjad: string, data: KegiatanManual[] }) => {
  const validData = data.filter(item => item.judul.trim() !== '' || item.deskripsi.trim() !== '');
  
  if (validData.length === 0) return null;
  
  return (
    <div className="mb-6">
      <h3 className="font-bold text-[12pt] mb-3">{abjad}. Pelaksanaan Kegiatan Bulan {judulBulan} {tahun}</h3>
      <div className="pl-5">
        {validData.map((item, index) => (
          <div key={index} className="mb-6 break-inside-avoid">
            <h4 className="font-bold text-[12pt] mb-2">{index + 1}. {item.judul}</h4>
            <p className="text-[12pt] text-justify indent-8 mb-3 leading-relaxed whitespace-pre-wrap">
              {item.deskripsi}
            </p>
            
            {item.fotoUrl && (
              <div className="flex flex-col items-center mt-4 mb-2">
                <img src={item.fotoUrl} alt={`Dokumentasi ${item.judul}`} className="max-w-100 max-h-75 object-contain border border-gray-300 p-1" />
                <p className="text-[10pt] italic mt-2 text-center">Gambar 2.{index + 1} Dokumentasi kegiatan {item.judul}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Bab2PDF({ manualBulan1, manualBulan2, manualBulan3, periode }: Bab2PDFProps) {
  const getBulanNames = () => {
    if (periode === 'TW1') return ['Januari', 'Februari', 'Maret'];
    if (periode === 'TW2') return ['April', 'Mei', 'Juni'];
    if (periode === 'TW3') return ['Juli', 'Agustus', 'September'];
    if (periode === 'TW4') return ['Oktober', 'November', 'Desember'];
    return ['Bulan 1', 'Bulan 2', 'Bulan 3'];
  };

  const [namaBulan1, namaBulan2, namaBulan3] = getBulanNames();

  // Menyaring data yang benar-benar diisi
  const validBulan1 = manualBulan1.filter(i => i.judul.trim() !== '' || i.deskripsi.trim() !== '');
  const validBulan2 = manualBulan2.filter(i => i.judul.trim() !== '' || i.deskripsi.trim() !== '');
  const validBulan3 = manualBulan3.filter(i => i.judul.trim() !== '' || i.deskripsi.trim() !== '');
  
  const semuaKegiatan = [...validBulan1, ...validBulan2, ...validBulan3];
  const totalKegiatan = semuaKegiatan.length;

  // ==============================================================================
  // MESIN CERDAS: KESIMPULAN OTOMATIS (BAGIAN D) BERDASARKAN AKTIVITAS
  // ==============================================================================
  const generateHasilUmum = () => {
    if (totalKegiatan === 0) return [];
    
    // Menggunakan Set agar tidak ada poin kesimpulan yang ganda/berulang
    const hasilSet = new Set<string>();
    
    // Poin Wajib Pertama
    hasilSet.add("Terlaksananya pembinaan dan pendampingan sekolah binaan secara berkelanjutan.");
    
    // Analisis Keyword dari Judul Kegiatan
    semuaKegiatan.forEach(kegiatan => {
      const judul = kegiatan.judul.toLowerCase();
      
      if (judul.includes("apel") || judul.includes("koordinasi")) {
        hasilSet.add("Terjalinnya koordinasi dan komunikasi yang efektif antar pemangku kepentingan pendidikan.");
      }
      if (judul.includes("spmb")) {
        hasilSet.add("Meningkatnya kesiapan dan kelancaran pelaksanaan Seleksi Penerimaan Murid Baru (SPMB) di sekolah binaan.");
      }
      if (judul.includes("spmi")) {
        hasilSet.add("Terlaksananya pemantauan dan penguatan Sistem Penjaminan Mutu Internal (SPMI) secara komprehensif.");
      }
      if (judul.includes("ksp") || judul.includes("kurikulum")) {
        hasilSet.add("Meningkatnya pemahaman dan kesiapan sekolah dalam penyusunan Kurikulum Satuan Pendidikan (KSP).");
      }
      if (judul.includes("monitoring") || judul.includes("supervisi") || judul.includes("observasi")) {
        hasilSet.add("Terukurnya kinerja dan ketercapaian program sekolah melalui kegiatan monitoring dan supervisi yang berkesinambungan.");
      }
      if (judul.includes("osn") || judul.includes("o2sn") || judul.includes("fls3n") || judul.includes("kompetisi")) {
        hasilSet.add("Meningkatnya dukungan terhadap pengembangan bakat, minat, dan prestasi peserta didik melalui ajang kompetisi terstruktur.");
      }
      if (judul.includes("pembelajaran mendalam") || judul.includes("deep learning")) {
        hasilSet.add("Meningkatnya pemahaman guru dan kepala sekolah mengenai strategi Pembelajaran Mendalam (Deep Learning).");
      }
    });

    // Poin Wajib Terakhir
    hasilSet.add("Tersusunnya berbagai rekomendasi tindak lanjut sebagai dasar peningkatan mutu pendidikan pada periode berikutnya.");
    
    return Array.from(hasilSet); // Mengubah Set kembali menjadi Array
  };

  const hasilUmum = generateHasilUmum();

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-black px-16 py-16 mx-auto font-serif break-before-page relative box-border">
      <div className="text-center w-full mb-10">
        <h1 className="text-[14pt] font-bold uppercase">BAB II</h1>
        <h2 className="text-[14pt] font-bold uppercase mt-1">LAPORAN KEGIATAN</h2>
      </div>

      {totalKegiatan === 0 ? (
        <p className="text-center italic text-gray-500 mt-20">Tidak ada dokumentasi kegiatan unggulan yang dilampirkan pada periode ini.</p>
      ) : (
        <div className="w-full text-[12pt]">
          <RenderBulanSection abjad="A" judulBulan={namaBulan1} data={validBulan1} />
          <RenderBulanSection abjad="B" judulBulan={namaBulan2} data={validBulan2} />
          <RenderBulanSection abjad="C" judulBulan={namaBulan3} data={validBulan3} />
          
          <div className="mb-6 mt-8 break-inside-avoid">
            <h3 className="font-bold text-[12pt] mb-3">D. Hasil Umum Pelaksanaan Tugas Kepengawasan</h3>
            <p className="text-[12pt] text-justify mb-2 leading-relaxed">
              Secara umum pelaksanaan tugas kepengawasan selama periode {namaBulan1}-{namaBulan3} {tahun} menunjukkan hasil yang positif, antara lain:
            </p>
            <ol className="list-decimal pl-10 text-[12pt] text-justify leading-relaxed">
              {/* Me-render hasil kesimpulan secara dinamis */}
              {hasilUmum.map((hasil, idx) => (
                <li key={idx}>{hasil}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
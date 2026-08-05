import React from 'react';
import { KegiatanManual } from './Bab2PDF'; // Mengimpor tipe data dari Bab 2

interface Bab3PDFProps {
  manualBulan1: KegiatanManual[];
  manualBulan2: KegiatanManual[];
  manualBulan3: KegiatanManual[];
  periode: string;
}

export default function Bab3PDF({ manualBulan1, manualBulan2, manualBulan3, periode }: Bab3PDFProps) {
  
  const getPeriodeLabel = () => {
    if (periode === 'TW1') return 'Januari - Maret';
    if (periode === 'TW2') return 'April - Juni';
    if (periode === 'TW3') return 'Juli - September';
    if (periode === 'TW4') return 'Oktober - Desember';
    return 'periode berjalan';
  };

  const periodeLabel = getPeriodeLabel();
  const tahun = '2026';

  // Menggabungkan seluruh kegiatan yang benar-benar diisi di Bab 2
  const semuaKegiatan = [...manualBulan1, ...manualBulan2, ...manualBulan3].filter(
    i => i.judul.trim() !== '' || i.deskripsi.trim() !== ''
  );

  // ==============================================================================
  // MESIN CERDAS: AUTO-GENERATE FOKUS KESIMPULAN
  // ==============================================================================
  const generateFokusKegiatan = () => {
    if (semuaKegiatan.length === 0) return "berbagai program pendidikan sesuai rencana kerja pengawas.";
    
    const fokus = new Set<string>();
    semuaKegiatan.forEach(k => {
      const j = k.judul.toLowerCase();
      if (j.includes("pembelajaran mendalam") || j.includes("deep learning")) fokus.add("Pembelajaran Mendalam (Deep Learning)");
      if (j.includes("spmb")) fokus.add("Sistem Penerimaan Murid Baru (SPMB)");
      if (j.includes("ksp") || j.includes("kurikulum") || j.includes("e-ksp")) fokus.add("penyusunan Kurikulum Satuan Pendidikan (KSP)");
      if (j.includes("kepemimpinan") || j.includes("observasi kinerja")) fokus.add("penguatan kepemimpinan kepala sekolah");
      if (j.includes("spmi")) fokus.add("Sistem Penjaminan Mutu Internal (SPMI)");
      if (j.includes("apel") || j.includes("koordinasi")) fokus.add("koordinasi dan sinergi antar pemangku kepentingan");
      if (j.includes("osn") || j.includes("o2sn") || j.includes("fls3n")) fokus.add("pembinaan kompetisi bakat dan minat peserta didik");
    });
    
    const fokusArr = Array.from(fokus);
    if (fokusArr.length === 0) return "implementasi kebijakan pendidikan dan program prioritas sekolah.";
    if (fokusArr.length === 1) return fokusArr[0] + ".";
    
    const last = fokusArr.pop();
    return fokusArr.join(", ") + ", serta " + last + ".";
  };

  // ==============================================================================
  // MESIN CERDAS: AUTO-GENERATE DAFTAR REKOMENDASI
  // ==============================================================================
  const generateRekomendasi = () => {
    const rek = new Set<string>();
    
    semuaKegiatan.forEach(k => {
      const j = k.judul.toLowerCase();
      if (j.includes("pembelajaran mendalam") || j.includes("deep learning")) {
        rek.add("Sekolah perlu terus memperkuat implementasi Pembelajaran Mendalam (Deep Learning) melalui peningkatan kompetensi guru dan optimalisasi praktik pembelajaran yang berpusat pada peserta didik.");
      }
      if (j.includes("ksp") || j.includes("kurikulum") || j.includes("e-ksp")) {
        rek.add(`Penyusunan dan implementasi Kurikulum Satuan Pendidikan (KSP) Tahun ${tahun} perlu terus didampingi agar sesuai dengan karakteristik sekolah dan kebutuhan peserta didik.`);
      }
      if (j.includes("kepemimpinan") || j.includes("observasi kinerja")) {
        rek.add("Kepala sekolah perlu meningkatkan peran sebagai pemimpin pembelajaran melalui penguatan budaya mutu, supervisi internal, dan pengembangan program inovasi sekolah.");
      }
      if (j.includes("spmb")) {
        rek.add("Evaluasi pelaksanaan SPMB perlu dilakukan secara menyeluruh guna perbaikan sistem penerimaan peserta didik di tahun mendatang.");
      }
      if (j.includes("spmi") || j.includes("mutu")) {
        rek.add("Sekolah diharapkan secara konsisten menjalankan siklus SPMI secara mandiri sebagai budaya mutu yang berkelanjutan.");
      }
      if (j.includes("osn") || j.includes("o2sn") || j.includes("fls3n")) {
        rek.add("Sekolah perlu menyusun peta jalan (roadmap) pembinaan prestasi yang terukur untuk mengoptimalkan potensi peserta didik pada ajang kompetisi di tingkat yang lebih tinggi.");
      }
    });

    // Rekomendasi Default jika sistem tidak menemukan keyword spesifik
    if (rek.size === 0) {
      rek.add("Kepala sekolah perlu meningkatkan peran sebagai pemimpin pembelajaran melalui penguatan budaya mutu dan supervisi internal.");
      rek.add("Program pengembangan kompetensi guru perlu disusun secara sistematis berdasarkan hasil evaluasi kinerja dan rapor pendidikan.");
    }
    
    return Array.from(rek);
  };

  const fokusKesimpulan = generateFokusKegiatan();
  const daftarRekomendasi = generateRekomendasi();

  return (
    <div className="w-[210mm] min-h-[297mm] bg-white text-black px-16 py-16 mx-auto font-serif break-before-page relative box-border">
      
      {/* SOLUSI TATA LETAK: Mengikat Header BAB III dan Paragraf 1 dalam satu wadah break-inside-avoid */}
      <div className="break-inside-avoid mb-4">
        <div className="text-center w-full mb-10">
          <h1 className="text-[14pt] font-bold uppercase">BAB III</h1>
          <h2 className="text-[14pt] font-bold uppercase mt-1">PENUTUP</h2>
        </div>
        
        <h3 className="font-bold text-[12pt] mb-3">A. Kesimpulan</h3>
        <p className="text-[12pt] text-justify indent-8 mb-3 leading-relaxed">
          Pelaksanaan tugas kepengawasan sekolah pada periode {periodeLabel} {tahun} telah terlaksana dengan baik sesuai program kerja yang telah direncanakan. Berbagai kegiatan yang meliputi pembinaan, pendampingan, monitoring, supervisi, koordinasi, evaluasi, serta pengembangan kompetensi profesional telah dilaksanakan secara berkelanjutan dalam rangka mendukung peningkatan mutu pendidikan pada sekolah binaan.
        </p>
      </div>

      <p className="text-[12pt] text-justify indent-8 mb-3 leading-relaxed">
        Kegiatan kepengawasan selama periode pelaporan difokuskan pada penguatan kebijakan pendidikan, antara lain {fokusKesimpulan} Selain itu, pengembangan kompetensi pengawas melalui berbagai pelatihan dan forum profesi juga memberikan kontribusi positif dalam meningkatkan kualitas pelaksanaan tugas kepengawasan.
      </p>
      
      <p className="text-[12pt] text-justify indent-8 mb-3 leading-relaxed">
        Hasil pelaksanaan kegiatan menunjukkan adanya peningkatan pemahaman dan kesiapan sekolah dalam mengimplementasikan berbagai program pendidikan, meningkatnya koordinasi antara pengawas sekolah, kepala sekolah, guru, dan pemangku kepentingan pendidikan, serta semakin kuatnya komitmen sekolah dalam mewujudkan layanan pendidikan yang berkualitas. Berbagai kendala yang ditemukan selama pelaksanaan kegiatan dapat diatasi melalui koordinasi, komunikasi, dan pendampingan yang berkesinambungan.
      </p>

      <p className="text-[12pt] text-justify indent-8 mb-8 leading-relaxed">
        Secara umum, pelaksanaan tugas kepengawasan pada periode {periodeLabel} {tahun} telah memberikan kontribusi yang positif terhadap peningkatan mutu pengelolaan sekolah dan proses pembelajaran pada sekolah binaan.
      </p>

      {/* SOLUSI TATA LETAK: Mengikat Header Rekomendasi agar tidak terpisah dari daftarnya */}
      <div className="break-inside-avoid mb-6">
        <h3 className="font-bold text-[12pt] mb-3">B. Rekomendasi</h3>
        <p className="text-[12pt] text-justify mb-3 leading-relaxed">
          Berdasarkan hasil pelaksanaan kegiatan kepengawasan selama periode {periodeLabel} {tahun}, disampaikan beberapa rekomendasi sebagai berikut:
        </p>
        <ol className="list-decimal pl-10 text-[12pt] text-justify leading-relaxed">
          {daftarRekomendasi.map((rek, idx) => (
            <li key={idx} className="mb-2">{rek}</li>
          ))}
        </ol>
      </div>

    </div>
  );
}
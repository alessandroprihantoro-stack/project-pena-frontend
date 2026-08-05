import React from 'react';

export default function Bab1PDF() {
  return (
    // Membungkus elemen dengan ukuran A4 dan 'html2pdf-page-break' agar terpisah halaman dari Cover
    <div className="w-[210mm] min-h-[297mm] bg-white text-black px-[20mm] py-[25mm] mx-auto font-serif text-[11pt] leading-relaxed html2pdf-page-break">
      
      {/* Judul Bab */}
      <div className="text-center font-bold mb-8">
        <p>BAB I</p>
        <p>PENDAHULUAN</p>
      </div>

      {/* A. Latar Belakang */}
      <div className="mb-6">
        <h3 className="font-bold mb-2">A. Latar Belakang</h3>
        <div className="space-y-3 text-justify">
          <p className="indent-10">
            Pendidikan merupakan salah satu pilar utama pembangunan sumber daya manusia yang berperan strategis dalam mewujudkan generasi bangsa yang unggul, berkarakter, dan berdaya saing di tengah dinamika perubahan global. Sekolah, sebagai satuan pendidikan yang menjadi ujung tombak penyelenggaraan proses belajar mengajar, dituntut untuk senantiasa meningkatkan mutu layanannya secara berkelanjutan agar mampu menjawab tantangan zaman, termasuk transformasi digital, penguatan karakter, dan penyesuaian terhadap berbagai kebijakan pendidikan yang terus berkembang dari waktu ke waktu.
          </p>
          <p className="indent-10">
            Pengawas sekolah memiliki peran strategis sebagai mitra kepala sekolah dan tenaga pendidik dalam mengawal implementasi kebijakan pendidikan di satuan pendidikan binaan. Melalui fungsi pengawasan akademik dan manajerial, pengawas sekolah melaksanakan pembinaan, pemantauan, supervisi, pendampingan, dan evaluasi secara terprogram guna memastikan proses pembelajaran berjalan sesuai standar mutu, serta membantu satuan pendidikan mengidentifikasi dan menyelesaikan permasalahan yang dihadapi dalam pelaksanaan program-program pendidikan, baik yang berasal dari pemerintah pusat maupun pemerintah daerah.
          </p>
          <p className="indent-10">
            Pada Tahun 2026, Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen) menegaskan komitmennya untuk melanjutkan dan memperkuat sejumlah program prioritas pendidikan nasional. Salah satu tonggak kebijakan penting adalah terbitnya Peraturan Menteri Pendidikan Dasar dan Menengah (Permendikdasmen) Nomor 1 Tahun 2026 tentang Standar Proses Pendidikan Anak Usia Dini, Jenjang Pendidikan Dasar, dan Jenjang Pendidikan Menengah, yang mulai berlaku sejak 5 Januari 2026 dan menggantikan Permendikbudristek Nomor 16 Tahun 2022. Peraturan ini membawa paradigma baru dalam proses pembelajaran melalui pendekatan pembelajaran mendalam (deep learning) yang menempatkan peserta didik sebagai subjek aktif yang membangun pengetahuan secara mandiri dan kolaboratif, dengan guru berperan sebagai perancang, fasilitator, dan pendamping belajar. Kebijakan ini juga diperkuat dengan Permendikdasmen Nomor 13 Tahun 2025 yang mengintegrasikan mata pelajaran pilihan Koding dan Kecerdasan Artifisial mulai kelas 10 pada jenjang SMA/SMK/MA secara bertahap sejak tahun ajaran 2025/2026.
          </p>
          <p className="indent-10">
            Selain penguatan proses pembelajaran, pemerintah pusat juga menjalankan sejumlah program prioritas lain pada tahun 2026, di antaranya perluasan Program Indonesia Pintar (PIP) dari jenjang PAUD hingga SMA/SMK/MA, program revitalisasi dan pembangunan satuan pendidikan, digitalisasi pembelajaran melalui distribusi Interactive Flat Panel (IFP) dan pendampingan pemanfaatannya, penguatan karakter peserta didik melalui kampanye Tujuh Kebiasaan Anak Indonesia Hebat (7KAIH) dan Gerakan Rukun Sama Teman, peningkatan kompetensi dan kesejahteraan guru, serta transformasi sistem evaluasi pembelajaran melalui Tes Kemampuan Akademik (TKA) yang menggantikan pola asesmen sebelumnya. Seluruh program tersebut menuntut peran aktif pengawas sekolah dalam mengawal kesiapan satuan pendidikan, mulai dari pemahaman regulasi, penyesuaian perangkat pembelajaran, hingga kesiapan sumber daya manusia di sekolah binaan.
          </p>
          <p className="indent-10">
            Sejalan dengan kebijakan nasional tersebut, Pemerintah Provinsi Jawa Tengah melalui Dinas Pendidikan dan Kebudayaan (Disdikbud) Provinsi Jawa Tengah juga menjalankan berbagai program strategis untuk jenjang SMA. Di antaranya adalah penyelenggaraan Sistem Penerimaan Murid Baru (SPMB) SMA Negeri dan Swasta Tahun Ajaran 2026/2027 yang dilaksanakan secara serentak dan daring melalui laman spmb.jatengprov.go.id, dengan sejumlah kebijakan baru seperti kuota domisili khusus sebesar 5 persen bagi calon murid di wilayah tanah kas desa yang digunakan untuk pembangunan sekolah negeri, kuota khusus 2 persen bagi Anak Tidak Sekolah (ATS), serta Program Kemitraan Perluasan Akses Layanan Pendidikan bagi SMA dan SMK Swasta. Selain itu, Disdikbud Jawa Tengah juga mengembangkan Petunjuk Teknis Penyelenggaraan Outing Class sebagai penguatan pembelajaran berbasis pengalaman di luar kelas, serta program studi lanjut dan magang kerja ke luar negeri bagi lulusan SMA/SMK sebagai bentuk perluasan wawasan dan kesempatan bagi peserta didik. Program-program tersebut memerlukan pengawalan yang cermat agar pelaksanaannya di tingkat satuan pendidikan berjalan tertib, transparan, akuntabel, dan tepat sasaran.
          </p>
          <p className="indent-10">
            Kompleksitas dan dinamika kebijakan pendidikan, baik dari pemerintah pusat maupun Pemerintah Provinsi Jawa Tengah, menuntut pendampingan yang terarah, berkesinambungan, dan berbasis data dari pengawas sekolah kepada satuan pendidikan binaan. Pendampingan bukan sekadar kegiatan administratif, melainkan proses kolaboratif untuk membantu kepala sekolah dan guru mengidentifikasi potensi, kendala, serta kebutuhan pengembangan dalam mengimplementasikan kebijakan secara efektif sesuai karakteristik dan kesiapan masing-masing sekolah. Melalui pendampingan yang terukur, diharapkan satuan pendidikan mampu meningkatkan mutu proses dan hasil pembelajaran, memperkuat tata kelola sekolah, serta mempercepat pencapaian tujuan pendidikan nasional maupun daerah.
          </p>
          <p className="indent-10">
            Sebagai bentuk pertanggungjawaban dan dokumentasi atas pelaksanaan tugas kepengawasan, disusunlah Laporan Pendampingan Triwulan ini yang memuat rangkaian kegiatan pendampingan yang telah dilaksanakan secara terencana dan berkelanjutan pada periode berjalan, meliputi koordinasi, pembinaan, monitoring, supervisi, pendampingan implementasi kebijakan kurikulum dan proses pembelajaran, evaluasi, serta pengembangan kompetensi profesional guru dan kepala sekolah, dan kegiatan lainnya yang mendukung peningkatan mutu pendidikan di wilayah binaan. Laporan ini disusun berdasarkan jurnal kegiatan pengawas sekolah selama periode triwulan berjalan, sebagai wujud akuntabilitas kinerja dan bahan evaluasi bagi perbaikan strategi pendampingan pada periode berikutnya.
          </p>
        </div>
      </div>

      {/* B. Tujuan */}
      <div className="mb-6">
        <h3 className="font-bold mb-2">B. Tujuan</h3>
        <p className="text-justify mb-2">
          Penyusunan laporan pelaksanaan tugas pengawas sekolah pada jenjang SMA periode Triwulan berjalan Tahun 2026 ini bertujuan untuk:
        </p>
        <ol className="list-decimal pl-8 space-y-1 text-justify">
          <li className="pl-2">Mendokumentasikan seluruh kegiatan kepengawasan yang telah dilaksanakan selama periode pelaporan, termasuk pendampingan implementasi Permendikdasmen Nomor 1 Tahun 2026 tentang Standar Proses dan pendekatan pembelajaran mendalam di sekolah binaan.</li>
          <li className="pl-2">Mendeskripsikan proses pelaksanaan kegiatan pembinaan, supervisi, monitoring, evaluasi, dan pendampingan sekolah binaan dalam menjalankan program prioritas pemerintah pusat, antara lain digitalisasi pembelajaran, penguatan karakter melalui 7 Kebiasaan Anak Indonesia Hebat (7KAIH), serta mata pelajaran pilihan Koding dan Kecerdasan Artifisial.</li>
          <li className="pl-2">Menyajikan capaian hasil pelaksanaan tugas kepengawasan, termasuk kesiapan sekolah binaan dalam mendukung program Pemerintah Provinsi Jawa Tengah seperti Sistem Penerimaan Murid Baru (SPMB), Program Kemitraan Perluasan Akses Layanan Pendidikan, dan Outing Class.</li>
          <li className="pl-2">Mengidentifikasi berbagai kendala yang dihadapi sekolah binaan dalam mengimplementasikan kebijakan kurikulum, digitalisasi, dan program pendidikan lainnya selama periode pelaporan.</li>
          <li className="pl-2">Menyusun rekomendasi dan rencana tindak lanjut sebagai upaya peningkatan mutu pembelajaran, tata kelola sekolah, serta kesiapan sekolah dalam melaksanakan kebijakan pendidikan pusat dan daerah pada periode berikutnya.</li>
          <li className="pl-2">Menjadi bentuk pertanggungjawaban pelaksanaan tugas kepada atasan, Cabang Dinas Pendidikan, dan pemangku kepentingan pendidikan lainnya.</li>
          <li className="pl-2">Menjadi bahan refleksi dalam penyusunan program kepengawasan pada periode berikutnya, sejalan dengan arah kebijakan pendidikan nasional dan daerah yang terus berkembang.</li>
        </ol>
      </div>

      {/* C. Manfaat */}
      <div className="mb-6">
        <h3 className="font-bold mb-2">C. Manfaat</h3>
        <p className="text-justify mb-2">
          Laporan ini diharapkan memberikan manfaat sebagai berikut:
        </p>
        <ol className="list-decimal pl-8 space-y-1 text-justify">
          <li className="pl-2">Sebagai bahan monitoring dan evaluasi terhadap pelaksanaan tugas kepengawasan serta sebagai dasar dalam penyusunan kebijakan peningkatan mutu pendidikan, khususnya dalam pengawalan implementasi pembelajaran mendalam dan digitalisasi di jenjang SMA.</li>
          <li className="pl-2">Sebagai bahan koordinasi, pengendalian, dan evaluasi program pendidikan pada wilayah kerja yang menjadi tanggung jawab Cabang Dinas Pendidikan, termasuk keterkaitannya dengan program SPMB dan Program Kemitraan Perluasan Akses Layanan Pendidikan Provinsi Jawa Tengah.</li>
          <li className="pl-2">Sebagai bahan evaluasi dan refleksi terhadap berbagai program yang telah dilaksanakan serta sebagai dasar penyusunan program peningkatan mutu sekolah yang lebih adaptif terhadap kebijakan pendidikan pusat dan daerah yang terkini.</li>
          <li className="pl-2">Sebagai bahan masukan dalam meningkatkan kompetensi profesional, pedagogik, sosial, dan manajerial guru serta kepala sekolah guna mendukung peningkatan kualitas pembelajaran berbasis pembelajaran mendalam dan pemanfaatan teknologi digital.</li>
          <li className="pl-2">Sebagai dokumen pertanggungjawaban profesional serta bahan penyusunan program kerja dan pengembangan kompetensi pengawas sekolah pada periode berikutnya.</li>
        </ol>
      </div>

    </div>
  );
}
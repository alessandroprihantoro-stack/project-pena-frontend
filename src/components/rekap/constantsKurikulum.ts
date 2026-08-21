// src/components/rekap/constantsKurikulum.ts

export interface KurikulumItem {
    id?: number;
    sekolah?: string;
    npsn?: string;
    mapel: string;
    kategori_mapel?: string;
    rombel: number;
    rombel_gabungan?: number;
    jp: number;
    jp_p5?: number;
}

export const AGAMA_LIST = [
    'Pendidikan Agama Islam dan Budi Pekerti', 'Pendidikan Agama Kristen dan Budi Pekerti', 'Pendidikan Agama Katolik dan Budi Pekerti',
    'Pendidikan Agama Buddha dan Budi Pekerti', 'Pendidikan Agama Hindu dan Budi Pekerti', 'Pendidikan Agama Khonghucu dan Budi Pekerti'
];

export const SENI_LIST = [
    'Seni Musik', 'Seni Rupa', 'Seni Teater', 'Seni Tari', 'Prakarya Budi Daya', 'Prakarya Kerajinan', 'Prakarya Rekayasa', 'Prakarya Pengolahan'
];

// --- MASTER SMA ---
export const WAJIB_KELAS_X = [
    { mapel: 'Pendidikan Pancasila', jp: 2, jp_p5: 0 }, { mapel: 'Bahasa Indonesia', jp: 3, jp_p5: 1 }, { mapel: 'Matematika', jp: 3, jp_p5: 1 },
    { mapel: 'Fisika', jp: 2, jp_p5: 1 }, { mapel: 'Kimia', jp: 2, jp_p5: 1 }, { mapel: 'Biologi', jp: 2, jp_p5: 1 },
    { mapel: 'Sosiologi', jp: 2, jp_p5: 1 }, { mapel: 'Ekonomi', jp: 2, jp_p5: 1 }, { mapel: 'Sejarah', jp: 2, jp_p5: 1 },
    { mapel: 'Geografi', jp: 2, jp_p5: 1 }, { mapel: 'Bahasa Inggris', jp: 3, jp_p5: 0 },
    { mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', jp: 2, jp_p5: 1 }, { mapel: 'Informatika', jp: 2, jp_p5: 0 }
];

export const WAJIB_KELAS_XI_XII = [
    { mapel: 'Pendidikan Pancasila', jp: 2, jp_p5: 0 }, { mapel: 'Bahasa Indonesia', jp: 3, jp_p5: 1 }, { mapel: 'Matematika', jp: 3, jp_p5: 1 },
    { mapel: 'Bahasa Inggris', jp: 3, jp_p5: 0 }, { mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', jp: 2, jp_p5: 1 },
    { mapel: 'Sejarah', jp: 2, jp_p5: 0 }
];

export const PILIHAN_5JP = [
    'Matematika Tingkat Lanjut', 'Fisika', 'Kimia', 'Biologi', 'Geografi', 'Sejarah Tingkat Lanjut', 'Sosiologi', 'Ekonomi',
    'Bahasa Indonesia Tingkat Lanjut', 'Bahasa Inggris Tingkat Lanjut', 'Bahasa Arab', 'Bahasa Jepang', 'Bahasa Jerman', 
    'Bahasa Korea', 'Bahasa Mandarin', 'Bahasa Prancis', 'Antropologi', 'Informatika'
];

export const PILIHAN_2JP = ['Prakarya dan Kewirausahaan', 'Koding dan Kecerdasan Artifisial'];

// --- MASTER SMK ---
export const WAJIB_SMK_X = [
    { mapel: 'Pendidikan Pancasila', jp: 2, jp_p5: 0, kat: 'UMUM' }, { mapel: 'Bahasa Indonesia', jp: 3, jp_p5: 1, kat: 'UMUM' },
    { mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', jp: 2, jp_p5: 1, kat: 'UMUM' }, { mapel: 'Sejarah', jp: 2, jp_p5: 0, kat: 'UMUM' },
    { mapel: 'Matematika', jp: 3, jp_p5: 1, kat: 'KEJURUAN' }, { mapel: 'Bahasa Inggris', jp: 3, jp_p5: 1, kat: 'KEJURUAN' },
    { mapel: 'Informatika', jp: 3, jp_p5: 1, kat: 'KEJURUAN' }, { mapel: 'Projek IPAS', jp: 5, jp_p5: 1, kat: 'KEJURUAN' },
    { mapel: 'Dasar-Dasar Program Keahlian', jp: 12, jp_p5: 0, kat: 'KEJURUAN' }
];

export const WAJIB_SMK_XI = [
    { mapel: 'Pendidikan Pancasila', jp: 2, jp_p5: 0, kat: 'UMUM' }, { mapel: 'Bahasa Indonesia', jp: 3, jp_p5: 0, kat: 'UMUM' },
    { mapel: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', jp: 2, jp_p5: 0, kat: 'UMUM' }, { mapel: 'Sejarah', jp: 2, jp_p5: 0, kat: 'UMUM' },
    { mapel: 'Matematika', jp: 3, jp_p5: 0, kat: 'KEJURUAN' }, { mapel: 'Bahasa Inggris', jp: 4, jp_p5: 0, kat: 'KEJURUAN' },
    { mapel: 'Konsentrasi Keahlian', jp: 18, jp_p5: 0, kat: 'KEJURUAN' }, { mapel: 'Kreativitas, Inovasi, dan Kewirausahaan', jp: 5, jp_p5: 0, kat: 'KEJURUAN' },
    { mapel: 'Mata Pelajaran Pilihan', jp: 4, jp_p5: 0, kat: 'KEJURUAN' }
];

export const WAJIB_SMK_XII = [
    { mapel: 'Pendidikan Pancasila', jp: 2, jp_p5: 0, kat: 'UMUM' }, { mapel: 'Bahasa Indonesia', jp: 3, jp_p5: 0, kat: 'UMUM' },
    { mapel: 'Matematika', jp: 3, jp_p5: 0, kat: 'KEJURUAN' }, { mapel: 'Bahasa Inggris', jp: 4, jp_p5: 0, kat: 'KEJURUAN' },
    { mapel: 'Konsentrasi Keahlian', jp: 22, jp_p5: 0, kat: 'KEJURUAN' }, { mapel: 'Kreativitas, Inovasi, dan Kewirausahaan', jp: 5, jp_p5: 0, kat: 'KEJURUAN' },
    { mapel: 'Mata Pelajaran Pilihan', jp: 4, jp_p5: 0, kat: 'KEJURUAN' }, { mapel: 'Praktik Kerja Lapangan (PKL)', jp: 46, jp_p5: 0, kat: 'PKL' }
];

// --- MASTER SLB (BARU) ---
export const KEBUTUHAN_KHUSUS_SLB: Record<string, string> = {
    'A': 'Pengembangan orientasi, mobilitas, sosial, dan komunikasi (Tunanetra)',
    'B': 'Pengembangan komunikasi, persepsi bunyi, dan irama (Tunarungu)',
    'C': 'Pengembangan diri (Tunagrahita)',
    'D': 'Pengembangan diri dan pengembangan gerak (Tunadaksa)',
    'Autis': 'Pengembangan komunikasi, interaksi sosial, dan perilaku (Autis)'
};

export const KETERAMPILAN_SLB = [
    'Tata Busana', 'Tata Boga', 'Tata Kecantikan', 'Tata Gerha', 'Teknologi Informasi Komunikasi', 
    'Perbengkelan Sepeda Motor', 'Cetak Saring/Sablon', 'Seni Membatik', 'Suvenir', 'Budidaya Tanaman Hortikultura', 
    'Pijat/Akupresur', 'Teknik Penyiaran Radio', 'Seni Musik', 'Fotografi', 'Desain Grafis', 'Seni Tari', 'Seni Lukis', 
    'Elektronika Alat Rumah Tangga', 'Budidaya Perikanan', 'Budidaya Peternakan'
];
import imageCompression from 'browser-image-compression';

export const compressImage = async (imageFile) => {
  // Pengaturan kompresi
  const options = {
    maxSizeMB: 0.3, // Maksimal ukuran file 300KB (sangat ringan untuk database)
    maxWidthOrHeight: 1280, // Resolusi maksimal, cukup tajam untuk layar komputer/HP
    useWebWorker: true, // Mencegah aplikasi menjadi lambat/lag saat proses kompresi berjalan
  };

  try {
    // Mengeksekusi proses kompresi
    const compressedFile = await imageCompression(imageFile, options);
    return compressedFile;
  } catch (error) {
    console.error('Terjadi kesalahan saat mengompresi gambar:', error);
    // Jika gagal, kembalikan file aslinya agar proses upload tidak macet
    return imageFile; 
  }
};
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

interface SekolahProfile {
  id: string;
  npsn: string;
  nama_sekolah: string;
  nama_kepala_sekolah: string;
  total_murid: number;
}

export default function KelolaSekolah() {
  const [sekolahList, setSekolahList] = useState<SekolahProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // State untuk Modal Form (Tambah & Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    npsn: "",
    nama_sekolah: "",
  });

  // === FUNGSI FETCH DATA ===
  const fetchSekolah = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sekolah")
      .select("id, npsn, nama_sekolah, nama_kepala_sekolah, total_murid")
      .order("created_at", { ascending: false });

    if (error) alert("Gagal mengambil data: " + error.message);
    else setSekolahList(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSekolah(); }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ npsn: "", nama_sekolah: "" });
    setEditMode(false); setActiveId(null); setIsModalOpen(false);
  };

  // === PEMICU MODAL EDIT ===
  const openEditModal = (s: SekolahProfile) => {
    setFormData({ npsn: s.npsn, nama_sekolah: s.nama_sekolah });
    setEditMode(true); setActiveId(s.id); setIsModalOpen(true);
  };

  // === FUNGSI SIMPAN: ABSOLUTE SESSION SHIELD & AUTO-RECOVERY BYPASS ===
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSubmitting(true);
    try {
      // 1. Sanitasi Mutlak
      const cleanNpsn = formData.npsn.trim();
      const cleanNama = formData.nama_sekolah.trim();

      if (editMode && activeId) {
        // PROSES EDIT NAMA SEKOLAH (NPSN TERKUNCI - CHECKPOINT PROTECTION)
        const { error: errSek } = await supabase.from('sekolah').update({ nama_sekolah: cleanNama }).eq('id', activeId);
        if (errSek) throw errSek;
        
        await supabase.from('profiles').update({ nama_lengkap: cleanNama }).eq('id', activeId);
        await supabase.from('sekolah_binaan').update({ nama_sekolah: cleanNama }).eq('npsn', cleanNpsn);

        alert(" ✅  Nama Sekolah berhasil diperbarui secara menyeluruh!");
      } else {
        // PROSES TAMBAH SEKOLAH BARU
        const emailSekolah = `${cleanNpsn}@sekolah.pena.com`;
        const passwordSekolah = cleanNpsn;
        if (cleanNpsn.length < 6) throw new Error("NPSN harus minimal 6 karakter!");

        let targetUserId: string | null = null;

        // 2. MULTI-LAYER LOOKUP: Cek terlebih dahulu di tabel profiles & sekolah
        const { data: existingProf } = await supabase
          .from('profiles')
          .select('id')
          .or(`nomor_induk.eq.${cleanNpsn},email.eq.${emailSekolah}`)
          .maybeSingle();

        if (existingProf) {
          targetUserId = existingProf.id;
        } else {
          const { data: existingSekolah } = await supabase
            .from('sekolah')
            .select('id, user_id')
            .eq('npsn', cleanNpsn)
            .maybeSingle();

          if (existingSekolah) {
            targetUserId = existingSekolah.user_id || existingSekolah.id;
          } else {
            // 3. 🛡️ CHECKPOINT PROTECTION: Backup Sesi Admin saat ini sebelum manipulasi Auth
            const { data: { session: adminSession } } = await supabase.auth.getSession();

            try {
              // 4. Eksekusi Pendaftaran Baru
              const { data: authData, error: authError } = await supabase.auth.signUp({ 
                email: emailSekolah, 
                password: passwordSekolah,
                options: {
                  data: {
                    role: 'SEKOLAH',
                    nama_lengkap: cleanNama,
                    nomor_induk: cleanNpsn
                  }
                }
              });

              // 💥 AUTO-RECOVERY BYPASS: Jika signUp error 500/422 atau email sudah ada di auth.users,
              // secara otomatis lakukan login cadangan untuk menarik ID pengguna tanpa crash!
              if (authError || !authData?.user?.id) {
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ 
                  email: emailSekolah, 
                  password: passwordSekolah 
                });
                
                if (loginError) {
                  throw new Error(`Gagal memverifikasi identitas sekolah: ${authError?.message || loginError.message}. Jika ini akun baru, pastikan fitur "Confirm email" di menu Authentication Supabase sudah dimatikan.`);
                }
                targetUserId = loginData?.user?.id || null;
              } else {
                targetUserId = authData.user.id;
              }
            } finally {
              // 5. 🛡️ RESTORE SESI ADMIN MUTLAK: Selalu kembalikan hak akses Admin terlepas apa pun yang terjadi!
              if (adminSession) {
                await supabase.auth.setSession({
                  access_token: adminSession.access_token,
                  refresh_token: adminSession.refresh_token
                });
              }
            }
          }
        }

        if (!targetUserId) {
          throw new Error("ID Autentikasi gagal didapatkan oleh sistem.");
        }

        // 6. Injeksi / Upsert ke Tabel Profiles (Aman tanpa merusak RLS)
        const { error: profErr } = await supabase.from('profiles').upsert([
          { id: targetUserId, role: 'SEKOLAH', nama_lengkap: cleanNama, nomor_induk: cleanNpsn, email: emailSekolah }
        ], { onConflict: 'id' });
        if (profErr) throw profErr;
        
        // 7. Injeksi / Upsert ke Tabel Master Sekolah
        const { error: sekErr } = await supabase.from('sekolah').upsert([
          { id: targetUserId, user_id: targetUserId, npsn: cleanNpsn, nama_sekolah: cleanNama }
        ], { onConflict: 'id' });
        if (sekErr) throw sekErr;

        alert(` ✅  Sekolah berhasil didaftarkan!\n\nEmail Login: ${emailSekolah}\nPassword: ${passwordSekolah}`);
      }
      resetForm(); 
      fetchSekolah();
    } catch (error: any) { 
      const pesanAsli = error?.message || error?.error_description || String(error);
      console.error("Detail Error Kelola Sekolah:", error);
      alert(`❌ Gagal memproses:\n\n${pesanAsli}`); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  // === FUNGSI HAPUS MUTLAK (THE EXECUTIONER) ===
  const handleDelete = async (id: string, nama: string) => {
    const konfirmasi = window.confirm(`🚨 PERINGATAN FATAL 🚨\n\nMenghapus total instansi "${nama}" akan mencabut seluruh data prestasi, inovasi, dan rapor mereka dari ekosistem.\n\nLanjutkan?`);
    if (konfirmasi) {
      const dbConfirm = window.prompt(`Ketik "HAPUS" untuk mengeksekusi penghapusan total:`);
      if (dbConfirm === 'HAPUS') {
        try {
          const { error } = await supabase.rpc('hapus_pengguna_total', { p_user_id: id });
          if (error) throw error;
          alert("💥 Instansi sekolah berhasil dibumihanguskan dari database."); fetchSekolah();
        } catch (err: any) { alert(`❌ Eksekusi Gagal: ${err.message}`); }
      } else {
        alert("Penghapusan dibatalkan. Kata kunci salah.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      
      {/* HEADER HALAMAN */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Sekolah</h2>
          <p className="text-slate-500 text-sm mt-1">Pantau daftar institusi sekolah di seluruh wilayah.</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm shadow-sm shadow-teal-100">
          + Tambah Sekolah
        </button>
      </div>

      {/* MODAL FORM TAMBAH / EDIT SEKOLAH */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className={`p-4 flex justify-between items-center text-white ${editMode ? 'bg-amber-500' : 'bg-teal-600'}`}>
              <h3 className="font-bold text-lg">{editMode ? 'Edit Nama Sekolah' : 'Registrasi Sekolah Baru'}</h3>
              <button onClick={resetForm} className="text-white/70 hover:text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">NPSN</label>
                {/* Input NPSN (Terkunci jika Edit Mode) */}
                <input 
                  type="text" name="npsn" value={formData.npsn} onChange={handleInputChange} required disabled={editMode} 
                  className={`w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 font-bold outline-none transition-all font-mono ${editMode ? 'bg-slate-200 cursor-not-allowed text-slate-500' : 'bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500'}`} 
                  placeholder="Contoh: 20328901" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Institusi Sekolah</label>
                {/* Input Nama Sekolah (Warna Teks Diperjelas) */}
                <input 
                  type="text" name="nama_sekolah" value={formData.nama_sekolah} onChange={handleInputChange} required 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all placeholder-slate-400" 
                  placeholder="SMAN 1 Nusantara" 
                />
              </div>
              
              {!editMode ? (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mt-2">
                  <p className="text-xs text-amber-700 font-medium"><span className="font-bold text-amber-800">Catatan Sistem:</span> Akun login akan otomatis dibuatkan. Password default adalah NPSN.</p>
                </div>
              ) : (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 mt-2">
                  <p className="text-xs text-amber-700 font-medium">⚠️ NPSN dikunci karena terikat dengan struktur database otentikasi. Anda hanya bisa mengedit Nama Sekolah.</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={resetForm} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className={`flex-1 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 ${editMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-teal-600 hover:bg-teal-700'}`}>
                  {isSubmitting ? "Menyimpan..." : (editMode ? "Simpan Perubahan" : "Daftarkan Sekolah")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AREA DATA TABEL */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium font-mono text-sm animate-pulse">Mengunduh data sekolah dari database...</div>
        ) : sekolahList.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            <p className="text-slate-700 font-bold text-lg">Belum Ada Data Sekolah</p>
            <p className="text-slate-400 text-sm mt-1 max-w-sm">Data sekolah belum diinputkan ke dalam sistem PENA.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 w-16">No</th>
                  <th className="py-4 px-6">NPSN</th>
                  <th className="py-4 px-6">Nama Sekolah</th>
                  <th className="py-4 px-6">Kepala Sekolah</th>
                  <th className="py-4 px-6 text-center w-24">Murid</th>
                  <th className="py-4 px-6 text-right w-40">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
                {sekolahList.map((sekolah, index) => (
                  <tr key={sekolah.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-400">{index + 1}</td>
                    <td className="py-4 px-6 font-mono font-bold text-teal-600">{sekolah.npsn}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">{sekolah.nama_sekolah}</td>
                    <td className="py-4 px-6">{sekolah.nama_kepala_sekolah || "-"}</td>
                    <td className="py-4 px-6 text-center">
                      <span className="bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-md">{sekolah.total_murid || 0}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        {/* TOMBOL EDIT */}
                        <button onClick={() => openEditModal(sekolah)} className="bg-amber-100 text-amber-600 hover:bg-amber-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">
                          Edit
                        </button>
                        {/* TOMBOL HAPUS */}
                        <button onClick={() => handleDelete(sekolah.id, sekolah.nama_sekolah)} className="bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
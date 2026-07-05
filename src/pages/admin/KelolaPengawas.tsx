/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";

interface PengawasProfile {
  id: string;
  nama_lengkap: string;
  nomor_induk: string;
  role: string;
  created_at: string;
}

export default function KelolaPengawas() {
  const [pengawasList, setPengawasList] = useState<PengawasProfile[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama_lengkap: "",
    nip: "",
    email: "",
    password: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPengawas = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("profiles").select("id, nama_lengkap, nomor_induk, role, created_at").eq("role", "PENGAWAS");
    if (error) alert("Koneksi Gagal: " + error.message);
    else setPengawasList(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPengawas(); }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ nama_lengkap: "", nip: "", email: "", password: "" });
    setEditMode(false); setActiveId(null); setIsModalOpen(false);
  };

  const openEditModal = (p: PengawasProfile) => {
    setFormData({
      nama_lengkap: p.nama_lengkap, nip: p.nomor_induk || "", email: "Email disembunyikan", password: "" 
    });
    setEditMode(true); setActiveId(p.id); setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      if (editMode && activeId) {
        const { error: errProf } = await supabase.from('profiles').update({ nama_lengkap: formData.nama_lengkap, nomor_induk: formData.nip }).eq('id', activeId);
        if (errProf) throw errProf;
        await supabase.from('pengawas').update({ nama_lengkap: formData.nama_lengkap }).eq('user_id', activeId);
        alert("✅ Data Pengawas berhasil diperbarui!");
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({ email: formData.email, password: formData.password });
        if (authError) throw authError;
        if (authData.user) {
          const { error: profileError } = await supabase.from('profiles').insert([{ id: authData.user.id, role: 'PENGAWAS', nama_lengkap: formData.nama_lengkap, nomor_induk: formData.nip, email: formData.email }]);
          if (profileError) throw profileError;
          alert("✅ Pengawas berhasil ditambahkan!");
        }
      }
      resetForm(); fetchPengawas();
    } catch (error: any) { alert("❌ Gagal memproses: " + error.message); } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (window.confirm(`🚨 PERINGATAN FATAL 🚨\n\nMenghapus "${nama}"?`)) {
      if (window.prompt(`Ketik "HAPUS" untuk mengeksekusi:`) === 'HAPUS') {
        try {
          const { error } = await supabase.rpc('hapus_pengguna_total', { p_user_id: id });
          if (error) throw error;
          alert("💥 Akun pengawas berhasil dibumihanguskan."); fetchPengawas();
        } catch (err: any) { alert(`❌ Eksekusi Gagal: ${err.message}`); }
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Manajemen Pengawas</h2>
          <p className="text-slate-500 text-sm mt-1">Kelola data akun dan penugasan pengawas sekolah.</p>
        </div>
        <button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors text-sm shadow-sm shadow-indigo-100">+ Tambah Pengawas</button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className={`p-4 flex justify-between items-center text-white ${editMode ? 'bg-amber-500' : 'bg-indigo-600'}`}>
              <h3 className="font-bold text-lg">{editMode ? 'Edit Data Pengawas' : 'Registrasi Pengawas Baru'}</h3>
              <button onClick={resetForm} className="text-white/70 hover:text-white"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nama Lengkap</label>
                {/* REVISI WARNA TEKS: text-slate-900 font-bold bg-slate-50 */}
                <input type="text" name="nama_lengkap" value={formData.nama_lengkap} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-400" placeholder="Dr. Budi Santoso, M.Pd" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">NIP (Nomor Induk)</label>
                <input type="text" name="nip" value={formData.nip} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-400" placeholder="198001012005011001" />
              </div>
              
              {!editMode && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email Login</label>
                    <input type="email" name="email" value={formData.email} onChange={handleInputChange} required className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-400" placeholder="budi.pengawas@pena.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Password Sementara</label>
                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} required minLength={6} className="w-full border border-slate-300 rounded-lg px-4 py-2 text-slate-900 font-bold bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-400" placeholder="Minimal 6 karakter" />
                  </div>
                </>
              )}
              
              {editMode && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 mt-2">
                  <p className="text-xs text-amber-700 font-medium">⚠️ Mode Edit diaktifkan. Anda hanya bisa mengubah Nama dan NIP. Email dan Sandi dikelola langsung oleh pemilik akun.</p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={resetForm} className="flex-1 bg-slate-100 text-slate-600 font-bold py-2.5 rounded-xl hover:bg-slate-200 transition-colors">Batal</button>
                <button type="submit" disabled={isSubmitting} className={`flex-1 text-white font-bold py-2.5 rounded-xl transition-colors disabled:opacity-50 ${editMode ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                  {isSubmitting ? "Menyimpan..." : (editMode ? "Simpan Perubahan" : "Simpan Data")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium font-mono text-sm animate-pulse">Menghubungkan ke satelit Supabase...</div>
        ) : pengawasList.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <p className="text-slate-700 font-bold text-lg">Belum Ada Data Pengawas</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 w-16">No</th>
                  <th className="py-4 px-6">Nama Lengkap</th>
                  <th className="py-4 px-6">NIP</th>
                  <th className="py-4 px-6">Otoritas</th>
                  <th className="py-4 px-6 text-right w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-sm text-slate-700">
                {pengawasList.map((pengawas, index) => (
                  <tr key={pengawas.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-400">{index + 1}</td>
                    <td className="py-4 px-6 font-bold text-slate-800">{pengawas.nama_lengkap}</td>
                    <td className="py-4 px-6 font-mono text-slate-600">{pengawas.nomor_induk || "-"}</td>
                    <td className="py-4 px-6"><span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-indigo-100">{pengawas.role}</span></td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(pengawas)} className="bg-amber-100 text-amber-600 hover:bg-amber-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">Edit</button>
                        <button onClick={() => handleDelete(pengawas.id, pengawas.nama_lengkap)} className="bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm">Hapus</button>
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
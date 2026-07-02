import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";

// Import Halaman Admin
import Login from "./pages/Login";
import Dashboard from "./pages/admin/Dashboard";
import PraktikBaik from "./pages/admin/PraktikBaik";
import KelolaPengawas from "./pages/admin/KelolaPengawas";
import KelolaSekolah from "./pages/admin/KelolaSekolah";

// Import Jantung Dasbor Utama
import DashboardPengawas from "./pages/pengawas/DashboardPengawas";
import DashboardSekolah from "./pages/sekolah/DashboardSekolah";

// IMPORT: Dapur Manajemen Sekolah
import ManajemenSekolah from "./pages/sekolah/ManajemenSekolah";

// Ruang Kelas & Log Jurnal Pengawas
import SekolahBinaan from "./pages/pengawas/SekolahBinaan";
import LogJurnalDiri from "./pages/pengawas/LogJurnalDiri";

// Komponen Loading Indikator Sederhana untuk mencegah Blank Screen saat fetch data auth
const LoadingScreen = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyan-500 mb-4"></div>
    <p className="text-xs font-mono tracking-widest text-slate-400">MEMUAT SISTEM OTENTIKASI...</p>
  </div>
);

const DetektorAwal = () => {
  const { profile, loading } = useAuth();
  
  if (loading) return <LoadingScreen />;
  if (!profile) return <Navigate to="/login" replace />;
  
  // Normalisasi string role ke uppercase untuk menghindari bug sensitivitas huruf
  const userRole = profile.role?.toUpperCase();
  
  switch (userRole) {
    case 'ADMIN': 
      return <Navigate to="/admin/dashboard" replace />;
    case 'PENGAWAS': 
      return <Navigate to="/pengawas/dashboard" replace />;
    case 'SEKOLAH': 
      return <Navigate to="/sekolah/dashboard" replace />;
    default: 
      return <Navigate to="/login" replace />;
  }
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* JANGKAR UTAMA: Deteksi Role & Otomatis Redirection */}
          <Route path="/" element={<DetektorAwal />} />
          <Route path="/login" element={<Login />} />

          {/* ================= ZONA GERBANG ADMIN ================= */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route element={<Layout />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/praktik-baik" element={<PraktikBaik />} />
              <Route path="/admin/pengawas" element={<KelolaPengawas />} />
              <Route path="/admin/sekolah" element={<KelolaSekolah />} />
            </Route>
          </Route>

          {/* ================= ZONA GERBANG PENGAWAS ================= */}
          <Route element={<ProtectedRoute allowedRoles={['PENGAWAS', 'ADMIN']} />}>
            <Route element={<Layout />}>
              <Route path="/pengawas/dashboard" element={<DashboardPengawas />} />
              <Route path="/pengawas/sekolah" element={<SekolahBinaan />} />
              <Route path="/pengawas/profil" element={<LogJurnalDiri />} />
            </Route>
          </Route>

          {/* ================= ZONA GERBANG SEKOLAH ================= */}
          <Route element={<ProtectedRoute allowedRoles={['SEKOLAH', 'ADMIN']} />}>
            <Route element={<Layout />}>
              <Route path="/sekolah/dashboard" element={<DashboardSekolah />} />
              <Route path="/sekolah/manajemen" element={<ManajemenSekolah />} />
            </Route>
          </Route>

          {/* PROTEKSI TERAKHIR: Alihkan rute antah-berantah ke halaman detektor awal */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
/* eslint-disable */
// @ts-nocheck

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import GeneratorLaporan from './pages/publik/GeneratorLaporan';

// Import Halaman Admin & Publik
import Login from "./pages/Login";
import EtalasePublik from "./pages/publik/EtalasePublik"; 
import Dashboard from "./pages/admin/Dashboard";
import PraktikBaik from "./pages/admin/PraktikBaik";
import KelolaPengawas from "./pages/admin/KelolaPengawas";
import KelolaSekolah from "./pages/admin/KelolaSekolah";
import KelolaPapanInformasi from "./pages/admin/KelolaPapanInformasi";
import RekapKebutuhanGuru from './pages/publik/RekapKebutuhanGuru';

// 🌟 IMPORT JALUR RAHASIA SUPER ADMIN
import AdminHapusSekolah from './pages/publik/AdminHapusSekolah';

// Import Jantung Dasbor Utama
import DashboardPengawas from "./pages/pengawas/DashboardPengawas";
import DashboardSekolah from "./pages/sekolah/DashboardSekolah";
import DashboardCabdin from "./pages/cabdin/DashboardCabdin";

// IMPORT: Dapur Manajemen Sekolah
import ManajemenSekolah from "./pages/sekolah/ManajemenSekolah";

// Ruang Kelas & Log Jurnal Pengawas
import SekolahBinaan from "./pages/pengawas/SekolahBinaan";

// 🌟 IMPORT MODUL VIEWER
import PapanInformasiViewer from "./components/PapanInformasiViewer";

// Komponen Loading Indikator
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
  
  const userRole = profile.role?.toUpperCase();
  
  switch (userRole) {
    case 'ADMIN': 
    case 'SUPER_ADMIN': 
      return <Navigate to="/admin/dashboard" replace />;
    case 'PENGAWAS': 
      return <Navigate to="/pengawas/dashboard" replace />;
    case 'SEKOLAH': 
      return <Navigate to="/sekolah/dashboard" replace />;
    case 'CABDIN': 
      return <Navigate to="/cabdin/dashboard" replace />;
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
          
          {/* 🌟 GERBANG PUBLIK (TANPA LOGIN) */}
          <Route path="/publik" element={<EtalasePublik />} />
          <Route path="/generator-laporan" element={<GeneratorLaporan />} />

          {/* 🚨 JALUR RAHASIA SUPER ADMIN */}
          <Route path="/panel-rahasia-hapus" element={<AdminHapusSekolah />} />

          {/* ================= ZONA REKAP GURU (DILINDUNGI & TANPA LAYOUT MENU) ================= */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'CABDIN', 'PENGAWAS']} />}>
            <Route path="/rekap-guru" element={<RekapKebutuhanGuru />} />
          </Route>

          {/* ================= ZONA UNIVERSAL (SEMUA AKUN TERVERIFIKASI) ================= */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'PENGAWAS', 'SEKOLAH', 'CABDIN']} />}>
            <Route element={<Layout />}>
              <Route path="/pusat-informasi" element={<PapanInformasiViewer />} />
            </Route>
          </Route>

          {/* ================= ZONA KELOLA INFO (DIBUKA UNTUK ADMIN DAN CABDIN) 🌟 ================= */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'CABDIN']} />}>
            <Route element={<Layout />}>
              <Route path="/admin/papan-informasi" element={<KelolaPapanInformasi />} />
            </Route>
          </Route>

          {/* ================= ZONA GERBANG ADMIN (TERBATAS) ================= */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN']} />}>
            <Route element={<Layout />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/praktik-baik" element={<PraktikBaik />} />
              <Route path="/admin/pengawas" element={<KelolaPengawas />} />
              <Route path="/admin/sekolah" element={<KelolaSekolah />} />
              {/* Rute Kelola Info sudah dipindah ke blok atas */}
            </Route>
          </Route>

          {/* ================= ZONA GERBANG CABANG DINAS ================= */}
          <Route element={<ProtectedRoute allowedRoles={['CABDIN', 'ADMIN', 'SUPER_ADMIN']} />}>
            <Route element={<Layout />}>
              <Route path="/cabdin/dashboard" element={<DashboardCabdin />} />
            </Route>
          </Route>

          {/* ================= ZONA GERBANG PENGAWAS ================= */}
          <Route element={<ProtectedRoute allowedRoles={['PENGAWAS', 'ADMIN', 'SUPER_ADMIN']} />}>
            <Route element={<Layout />}>
              <Route path="/pengawas/dashboard" element={<DashboardPengawas />} />
              <Route path="/pengawas/sekolah" element={<SekolahBinaan />} />
            </Route>
          </Route>

          {/* ================= ZONA GERBANG SEKOLAH ================= */}
          <Route element={<ProtectedRoute allowedRoles={['SEKOLAH', 'ADMIN', 'SUPER_ADMIN']} />}>
            <Route element={<Layout />}>
              <Route path="/sekolah/dashboard" element={<DashboardSekolah />} />
              <Route path="/sekolah/manajemen" element={<ManajemenSekolah />} />
            </Route>
          </Route>

          {/* PROTEKSI TERAKHIR */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
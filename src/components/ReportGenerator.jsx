import React, { useState } from 'react';

export default function ReportGenerator() {
  const [pengawas, setPengawas] = useState('');
  const [files, setFiles] = useState({ bulan1: null, bulan2: null, bulan3: null });

  const handleFileChange = (e, bulan) => {
    setFiles({ ...files, [bulan]: e.target.files[0] });
  };

  const handleGenerate = () => {
    // Logika proses file dan generate PDF akan ditambahkan di langkah selanjutnya
    console.log("Memproses laporan untuk:", pengawas, files);
    alert("Fitur generate sedang dibangun!");
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md space-y-4 border border-gray-200 mt-8">
      <h2 className="text-2xl font-bold text-center text-blue-700">Generator Laporan Triwulan Pengawas</h2>
      <p className="text-center text-gray-500 text-sm">Buat laporan triwulan tanpa perlu login</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Pilih Nama Pengawas</label>
          <select 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
            value={pengawas}
            onChange={(e) => setPengawas(e.target.value)}
          >
            <option value="">-- Pilih Pengawas --</option>
            <option value="Joko Susilo, S.Pd, M.Si.">Joko Susilo, S.Pd, M.Si.</option>
            <option value="Dwi Ristanto, S.Pd., M.Pd.">Dwi Ristanto, S.Pd., M.Pd.</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border p-3 rounded-md bg-gray-50">
            <label className="block text-sm font-medium mb-2">Rekapan Bulan 1</label>
            <input type="file" accept=".pdf,.xlsx,.csv" onChange={(e) => handleFileChange(e, 'bulan1')} className="text-sm w-full" />
          </div>
          <div className="border p-3 rounded-md bg-gray-50">
            <label className="block text-sm font-medium mb-2">Rekapan Bulan 2</label>
            <input type="file" accept=".pdf,.xlsx,.csv" onChange={(e) => handleFileChange(e, 'bulan2')} className="text-sm w-full" />
          </div>
          <div className="border p-3 rounded-md bg-gray-50">
            <label className="block text-sm font-medium mb-2">Rekapan Bulan 3</label>
            <input type="file" accept=".pdf,.xlsx,.csv" onChange={(e) => handleFileChange(e, 'bulan3')} className="text-sm w-full" />
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={!pengawas || !files.bulan1 || !files.bulan2 || !files.bulan3}
          className="w-full bg-blue-600 text-white p-3 rounded-md font-bold hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          Generate Laporan Triwulan
        </button>
      </div>
    </div>
  );
}
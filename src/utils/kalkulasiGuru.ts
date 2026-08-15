export interface KebutuhanResult {
  kurang: number;
  kelebihan: number;
  warningMessages: string[]; // Diubah dari angka menjadi deretan kalimat cerdas AI
  isBK: boolean;
}

export const calculateKebutuhan = (mapel: string, T: number, G: number): KebutuhanResult => {
  const isBK = mapel.toLowerCase().includes('bimbingan') || mapel.toLowerCase().includes('konseling') || mapel.toLowerCase() === 'bk';
  
  if (T === 0 && G === 0) return { kurang: 0, kelebihan: 0, warningMessages: [], isBK };

  let kurang = 0;
  let kelebihan = 0;
  const warningMessages: string[] = [];

  const minLoad = isBK ? 5 : 24;
  const maxLoad = isBK ? 8 : 40;
  const targetLoad = isBK ? 5 : 30; // Simulasi diutamakan mengisi 30 dulu
  const satuan = isBK ? 'kelas' : 'jam pelajaran';

  if (G === 0) {
      kurang = Math.ceil(T / maxLoad);
  } else {
      const currentLoad = T / G;
      if (currentLoad > maxLoad) {
          kurang = Math.ceil(T / maxLoad) - G; 
      } else if (currentLoad < minLoad) {
          const maxAllowed = Math.floor(T / minLoad);
          kelebihan = G - maxAllowed;
          
          // AI Simulasi Distribusi Beban untuk membuat kalimat peringatan yang spesifik
          let remaining = T;
          const loads = [];
          for (let i = 0; i < G; i++) {
              if (remaining >= targetLoad) {
                  loads.push(targetLoad);
                  remaining -= targetLoad;
              } else {
                  loads.push(remaining);
                  remaining = 0;
              }
          }
          
          // Mengelompokkan guru yang jamnya di bawah batas minimal (24)
          const deficits: Record<number, number> = {};
          loads.forEach(load => {
              if (load < minLoad) {
                  const deficit = minLoad - load;
                  deficits[deficit] = (deficits[deficit] || 0) + 1;
              }
          });
          
          Object.entries(deficits).forEach(([deficit, count]) => {
              warningMessages.push(`${count} guru perlu menambah minimal ${deficit} ${satuan}`);
          });
      }
  }

  return { kurang, kelebihan, warningMessages, isBK };
};

export const generateDistributionText = (mapel: string, T: number, G: number) => {
  if (G <= 1 || T === 0) return null;
  const isBK = mapel.toLowerCase().includes('bimbingan') || mapel.toLowerCase().includes('konseling') || mapel.toLowerCase() === 'bk';
  
  const targetLoad = isBK ? 5 : 30; 
  const satuan = isBK ? 'Kelas' : 'Jam';

  const teachers: number[] = [];
  let remaining = T;
  
  for (let i = 1; i <= G; i++) {
      if (remaining >= targetLoad) {
          teachers.push(targetLoad);
          remaining -= targetLoad;
      } else {
          teachers.push(remaining);
          remaining = 0;
      }
  }

  const fullTeachers = teachers.filter(h => h === targetLoad).length;
  const partial = teachers.findIndex(h => h > 0 && h < targetLoad);
  const zero = teachers.filter(h => h === 0).length;

  const textParts: string[] = [];
  if (fullTeachers > 0) {
      if (fullTeachers === 1) textParts.push(`Guru 1 = ${targetLoad} ${satuan}`);
      else {
          const names = Array.from({ length: fullTeachers }, (_, i) => "Guru " + (i + 1)).join(", ");
          textParts.push(`(${names}) = ${targetLoad} ${satuan}`);
      }
  }
  
  let nextIdx = fullTeachers + 1;
  if (partial !== -1) {
      const h = teachers[partial];
      textParts.push(`Guru ${nextIdx} = ${h} ${satuan} (kurang ${targetLoad - h} ${satuan})`);
      nextIdx++;
  }
  for (let i = 0; i < zero; i++) {
      textParts.push(`Guru ${nextIdx} = 0 ${satuan} (kurang ${targetLoad} ${satuan})`);
      nextIdx++;
  }
  return textParts.join(', ');
};
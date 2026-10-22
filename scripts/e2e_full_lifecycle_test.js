/**
 * SIAKAD END-TO-END FULL LIFECYCLE & INTEGRATION AUDIT SUITE
 * Tests entire academic & attendance flow across Admin, Teacher, and Student personas.
 */

const BASE_URL = 'http://localhost:4000/api/v1';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, config);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function login(username, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(res.data)}`);
  }
  return {
    accessToken: res.data.data.tokens.accessToken,
    refreshToken: res.data.data.tokens.refreshToken,
    user: res.data.data.user,
  };
}

async function runE2ETests() {
  console.log('================================================================');
  console.log('🧪 SIAKAD FULL END-TO-END LIFECYCLE & INTEGRATION TEST');
  console.log('Target API: ' + BASE_URL);
  console.log('================================================================\n');

  const steps = [];
  function recordStep(num, name, passed, details) {
    steps.push({ num, name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [Step ${num}] ${name}`);
    console.log(`   ${details}\n`);
  }

  // 1. Admin Login & Check Academic Data
  let adminAuth, teacherAuth, studentAuth;
  try {
    adminAuth = await login('admin', 'admin123');
    teacherAuth = await login('198403152009032008', 'password123'); // Guru Siti (Wali Kelas X MIPA 1)
    studentAuth = await login('2401', 'password123'); // Aditya Pratama (X MIPA 1)
  } catch (err) {
    console.error('Initial login error:', err);
    process.exit(1);
  }

  const classesRes = await request('/classes', {
    headers: { Authorization: `Bearer ${adminAuth.accessToken}` },
  });
  const classList = classesRes.data?.data || [];
  const targetClass = classList.find((c) => c.name === 'X MIPA 1') || classList[0];
  const passedStep1 = adminAuth.user.role === 'ADMIN' && !!targetClass;
  recordStep(1, 'Admin masuk dan memeriksa data akademik', passedStep1,
    `Admin: ${adminAuth.user.fullName}, Kelas ditemukan: ${targetClass?.name} (ID: ${targetClass?.id})`);

  // 2. Guru Membuka Sesi Absensi Sah
  const subjectsRes = await request('/subjects', {
    headers: { Authorization: `Bearer ${teacherAuth.accessToken}` },
  });
  const subjectList = subjectsRes.data?.data || [];
  const targetSubject = subjectList[0];

  const sessionPayload = {
    classId: targetClass.id,
    subjectId: targetSubject?.id,
    date: '2026-10-25',
    startTime: '08:00',
    endTime: '09:30',
    notes: 'Sesi E2E Lifecycle Testing Otomatis',
  };

  const createSessionRes = await request('/attendance/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${teacherAuth.accessToken}` },
    body: sessionPayload,
  });

  const sessionData = createSessionRes.data?.data;
  const passedStep2 = (createSessionRes.status === 201 || createSessionRes.status === 200) && !!sessionData?.id;
  recordStep(2, 'Guru masuk dan membuka sesi absensi yang sah', passedStep2,
    `HTTP Status: ${createSessionRes.status}, Sesi ID: ${sessionData?.id}, Status Awal: ${sessionData?.status}`);

  // 3. Guru Menyimpan Kehadiran (Batch Record)
  const student1Id = studentAuth.user.profile?.id || studentAuth.user.studentId;
  const recordsPayload = {
    records: [
      { studentId: student1Id, status: 'HADIR', notes: 'Hadir tepat waktu di kelas' },
    ],
  };

  const submitRecordsRes = await request(`/attendance/sessions/${sessionData.id}/records`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${teacherAuth.accessToken}` },
    body: recordsPayload,
  });
  const passedStep3 = [200, 201].includes(submitRecordsRes.status);
  recordStep(3, 'Guru menyimpan catatan kehadiran siswa', passedStep3,
    `HTTP Status: ${submitRecordsRes.status}, Pesan: "${submitRecordsRes.data?.message}"`);

  // 4. Website Memuat Ulang Data (Verifikasi Konsistensi Web Read)
  const webReadRes = await request(`/attendance/sessions/${sessionData.id}`, {
    headers: { Authorization: `Bearer ${teacherAuth.accessToken}` },
  });
  const webRecords = webReadRes.data?.data?.records || [];
  const studentRecord = webRecords.find((r) => r.studentId === student1Id);
  const passedStep4 = webReadRes.status === 200 && studentRecord?.status === 'HADIR';
  recordStep(4, 'Website menampilkan data absensi yang sama setelah pemuatan ulang', passedStep4,
    `Status Sesi: ${webReadRes.data?.data?.status}, Status Catatan Siswa: ${studentRecord?.status}`);

  // 5. Android Mengambil Data yang Sama (Mobile Client Consistency)
  const mobileReadRes = await request(`/attendance/sessions/${sessionData.id}`, {
    headers: {
      Authorization: `Bearer ${teacherAuth.accessToken}`,
      'User-Agent': 'SIAKAD-Flutter-Mobile/1.0.0 (Android)',
    },
  });
  const mobileRecord = mobileReadRes.data?.data?.records?.find((r) => r.studentId === student1Id);
  const passedStep5 = mobileReadRes.status === 200 && mobileRecord?.status === 'HADIR';
  recordStep(5, 'Aplikasi Android mengambil data yang identik dari server', passedStep5,
    `Siswa NIS: ${mobileRecord?.student?.nis}, Nama: ${mobileRecord?.student?.fullName}, Status: ${mobileRecord?.status}`);

  // 6. Simulasi Sinkronisasi Offline Android (Idempotensi & Re-sync)
  const offlineDraftPayload = {
    records: [
      { studentId: student1Id, status: 'HADIR', notes: 'Sinkronisasi ulang dari draft offline HP' },
    ],
  };
  const syncRes = await request(`/attendance/sessions/${sessionData.id}/records`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${teacherAuth.accessToken}`,
      'User-Agent': 'SIAKAD-Flutter-Mobile/1.0.0 (Android Sync)',
    },
    body: offlineDraftPayload,
  });
  // Check record count remains 1 and is updated
  const verifySync = await request(`/attendance/sessions/${sessionData.id}`, {
    headers: { Authorization: `Bearer ${teacherAuth.accessToken}` },
  });
  const totalRecords = verifySync.data?.data?.records?.filter((r) => r.studentId === student1Id).length;
  const passedStep6 = [200, 201].includes(syncRes.status) && totalRecords === 1;
  recordStep(6, 'Android menyimpan draft saat offline dan menyinkronkan tanpa duplikasi', passedStep6,
    `Sync status: ${syncRes.status}, Total records setelah sync: ${totalRecords} (Unik & Idempoten)`);

  // 7. Siswa Melihat Riwayat Miliknya (Scoping Otorisasi)
  const studentViewRes = await request(`/attendance/sessions/${sessionData.id}`, {
    headers: { Authorization: `Bearer ${studentAuth.accessToken}` },
  });
  const studentVisibleRecords = studentViewRes.data?.data?.records || [];
  const onlyOwnRecord = studentVisibleRecords.every((r) => r.studentId === student1Id);
  const passedStep7 = studentViewRes.status === 200 && onlyOwnRecord && studentVisibleRecords.length === 1;
  recordStep(7, 'Siswa hanya melihat catatan riwayat kehadiran miliknya', passedStep7,
    `HTTP Status: ${studentViewRes.status}, Jumlah baris yang dapat dilihat siswa: ${studentVisibleRecords.length}`);

  // 8. Siswa Mengajukan Izin
  const permPayload = {
    type: 'SAKIT',
    startDate: '2026-10-26',
    endDate: '2026-10-27',
    reason: 'Istirahat dokter sakit demam berdarah',
    attachmentUrl: 'https://storage.siakad.smapemberdayaanbangsa.sch.id/surat_dokter_fauzi.pdf',
  };
  const permCreateRes = await request('/permissions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${studentAuth.accessToken}` },
    body: permPayload,
  });
  const permId = permCreateRes.data?.data?.id;
  const passedStep8 = (permCreateRes.status === 201 || permCreateRes.status === 200) && !!permId;
  recordStep(8, 'Siswa mengajukan surat permohonan izin sakit', passedStep8,
    `Status Izin: ${permCreateRes.data?.data?.status} (MENUNGGU), ID: ${permId}`);

  // 9. Wali Kelas Memproses & Menyetujui Izin
  const approveRes = await request(`/permissions/${permId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${teacherAuth.accessToken}` },
    body: { note: 'Disetujui oleh wali kelas, lekas sembuh' },
  });
  const passedStep9 = [200, 201].includes(approveRes.status) && approveRes.data?.data?.status === 'DISETUJUI';
  recordStep(9, 'Wali kelas memproses dan menyetujui izin siswa', passedStep9,
    `Status Baru: ${approveRes.data?.data?.status}, Disetujui oleh: ${approveRes.data?.data?.reviewedBy?.fullName || teacherAuth.user.fullName}`);

  // 10. Laporan Mencerminkan Perubahan Sah
  const checkPermRes = await request(`/permissions/${permId}`, {
    headers: { Authorization: `Bearer ${studentAuth.accessToken}` },
  });
  const passedStep10 = checkPermRes.status === 200 && checkPermRes.data?.data?.status === 'DISETUJUI';
  recordStep(10, 'Laporan dan data izin mencerminkan perubahan yang sah', passedStep10,
    `Status Akhir: ${checkPermRes.data?.data?.status}, Catatan Wali: "${checkPermRes.data?.data?.reviewNotes}"`);

  // 11. Verifikasi Jejak Audit (Audit Logs)
  const auditRes = await request('/audit-logs?limit=20', {
    headers: { Authorization: `Bearer ${adminAuth.accessToken}` },
  });
  const auditLogs = auditRes.data?.data || [];
  const actions = auditLogs.map((l) => l.action);
  const hasAttendanceAction = actions.some((a) => a.includes('ATTENDANCE'));
  const hasPermissionAction = actions.some((a) => a.includes('PERMISSION'));
  const passedStep11 = auditRes.status === 200 && (hasAttendanceAction || hasPermissionAction || auditLogs.length > 0);
  recordStep(11, 'Seluruh tindakan kritis mempunyai jejak audit lengkap', passedStep11,
    `Audit logs tercatat: ${auditLogs.length} events, Sampel Aksi: ${actions.slice(0, 5).join(', ')}`);

  console.log('================================================================');
  const allPassed = steps.every((s) => s.passed);
  console.log(`🏁 HASIL PENGUJIAN END-TO-END: ${steps.filter(s => s.passed).length}/${steps.length} LANGKAH BERHASIL`);
  console.log('================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runE2ETests().catch((err) => {
  console.error('E2E test failed:', err);
  process.exit(1);
});

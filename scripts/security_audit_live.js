const BASE_URL = 'http://localhost:4000/api/v1';

async function request(path, options = {}) {
  const url = `${BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const res = await fetch(url, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function login(username, password) {
  const res = await request('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${username}: ${JSON.stringify(res.data)}`);
  }
  return {
    accessToken: res.data.data.tokens.accessToken,
    refreshToken: res.data.data.tokens.refreshToken,
    user: res.data.data.user,
  };
}

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('🛡️  SIAKAD COMPREHENSIVE SECURITY & AUTHORIZATION AUDIT (10 SCENARIOS)');
  console.log('Target: ' + BASE_URL);
  console.log('================================================================\n');

  const results = [];

  function record(id, title, passed, details) {
    results.push({ id, title, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [Skenario ${id}] ${title}`);
    console.log(`   Detail: ${details}\n`);
  }

  // Pre-fetch tokens
  let tokenAdmin, tokenTeacher1, tokenTeacher2, tokenStudent1, tokenStudent2, s1Auth, s2Auth;
  try {
    const adminAuth = await login('admin', 'admin123');
    tokenAdmin = adminAuth.accessToken;

    const t1Auth = await login('198403152009032008', 'password123'); // Siti Rahmawati (X MIPA 1 Wali)
    tokenTeacher1 = t1Auth.accessToken;

    const t2Auth = await login('197906122005011004', 'password123'); // Bambang Supriyanto (X MIPA 2 Wali)
    tokenTeacher2 = t2Auth.accessToken;

    s1Auth = await login('2401', 'password123'); // Aditya (X MIPA 1)
    tokenStudent1 = s1Auth.accessToken;

    s2Auth = await login('2402', 'password123'); // Budi Santoso (X MIPA 1)
    tokenStudent2 = s2Auth.accessToken;

    console.log('🔑 Authenticated 5 test personas successfully.\n');
  } catch (err) {
    console.error('Fatal: Could not setup test authentication tokens:', err.message);
    process.exit(1);
  }

  const student1Id = s1Auth.user.profile.id;
  const student2Id = s2Auth.user.profile.id;
  const student1ClassId = s1Auth.user.profile.classId;

  // Retrieve Teacher 1 valid teaching assignment for sessions
  const t1Me = await request('/auth/me', {
    headers: { Authorization: `Bearer ${tokenTeacher1}` },
  });
  const t1Assignments = t1Me.data.data.teacher?.teachingAssignments || [];
  const validClassId = t1Assignments[0]?.classId || student1ClassId;
  const validSubjectId = t1Assignments[0]?.subjectId;

  // 1. Pengguna tanpa login mengakses endpoint privat
  {
    const res = await request('/attendance/sessions');
    const passed = res.status === 401;
    record(1, 'Pengguna tanpa login mengakses endpoint privat', passed,
      `HTTP status ${res.status} (Pesan: "${res.data?.message || 'Unauthorized'}")`);
  }

  // 2. Siswa mencoba mengakses profil siswa lain
  {
    const res = await request(`/students/${student2Id}`, {
      headers: { Authorization: `Bearer ${tokenStudent1}` },
    });
    const passed = res.status === 403;
    record(2, 'Siswa mencoba mengakses profil siswa lain', passed,
      `HTTP status ${res.status} (Pesan: "${res.data?.message}")`);
  }

  // 3. Guru mencoba mengabsen kelas yang tidak ditugaskan
  {
    // Class XII IPS 1 is not assigned to Teacher 1 (Siti Rahmawati - only X MIPA 1 / Fisika)
    // Create session in unassigned class
    const res = await request('/attendance/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTeacher1}` },
      body: {
        classId: 'cmv9ozjaz002mul638pud1z02', // XII IPS 1
        subjectId: validSubjectId,
        date: '2026-10-25',
        startTime: '08:00',
        endTime: '09:30',
      },
    });
    const passed = res.status === 403 || res.status === 400;
    record(3, 'Guru mencoba mengabsen kelas yang tidak ditugaskan', passed,
      `HTTP status ${res.status} (Pesan: "${res.data?.message}")`);
  }

  // 4. Guru mencoba mengubah sesi yang sudah ditutup
  {
    // Create session by Teacher 1 for authorized class
    const createSessionRes = await request('/attendance/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTeacher1}` },
      body: {
        classId: validClassId,
        subjectId: validSubjectId,
        date: '2026-10-20',
        startTime: '07:00',
        endTime: '08:30',
      },
    });
    const testSessionId = createSessionRes.data?.data?.id;

    // Submit attendance first so it can be closed
    await request(`/attendance/sessions/${testSessionId}/records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTeacher1}` },
      body: {
        records: [{ studentId: student1Id, status: 'HADIR' }],
      },
    });

    // Close session
    await request(`/attendance/sessions/${testSessionId}/close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTeacher1}` },
    });

    // Now Teacher tries to submit records to closed session
    const res = await request(`/attendance/sessions/${testSessionId}/records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTeacher1}` },
      body: {
        records: [{ studentId: student1Id, status: 'TERLAMBAT' }],
      },
    });
    const passed = res.status === 400 || res.status === 403;
    record(4, 'Guru mencoba mengubah sesi yang sudah ditutup', passed,
      `HTTP status ${res.status} (Pesan: "${res.data?.message}")`);
  }

  // 5. Pengguna biasa mencoba memberikan role administrator
  {
    const res = await request('/users', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudent1}` },
      body: {
        username: 'hacker_admin',
        password: 'password123',
        fullName: 'Hacker Administrator',
        role: 'ADMIN',
      },
    });
    const passed = res.status === 403;
    record(5, 'Pengguna biasa mencoba memberikan role administrator', passed,
      `HTTP status ${res.status} (Pesan: "${res.data?.message}")`);
  }

  // 6. Pengguna mencoba menyetujui izin tanpa kewenangan
  {
    // Create permission request from Student 1
    const createPermRes = await request('/permissions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudent1}` },
      body: {
        type: 'SAKIT',
        startDate: '2026-10-22',
        endDate: '2026-10-23',
        totalDays: 2,
        reason: 'Demam tinggi dan istirahat dokter',
      },
    });
    const permId = createPermRes.data?.data?.id;

    // Student 2 tries to approve Student 1's permission
    const studentApproveRes = await request(`/permissions/${permId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenStudent2}` },
      body: { note: 'Disetujui oleh sesama siswa' },
    });

    // Teacher 2 (not homeroom of X MIPA 1) tries to approve Student 1's permission
    const teacher2ApproveRes = await request(`/permissions/${permId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTeacher2}` },
      body: { note: 'Disetujui oleh guru yang bukan wali kelas' },
    });

    const passed = studentApproveRes.status === 403 && teacher2ApproveRes.status === 403;
    record(6, 'Pengguna mencoba menyetujui izin tanpa kewenangan', passed,
      `Siswa approve: ${studentApproveRes.status} (${studentApproveRes.data?.message}), Guru non-wali approve: ${teacher2ApproveRes.status} (${teacher2ApproveRes.data?.message})`);

    // 7. Pengguna mencoba membaca lampiran milik orang lain (IDOR)
    {
      // Student 2 tries to read Student 1's permission & attachment
      const s2Read = await request(`/permissions/${permId}`, {
        headers: { Authorization: `Bearer ${tokenStudent2}` },
      });

      // Teacher 2 (non-homeroom) tries to read Student 1's permission & attachment
      const t2Read = await request(`/permissions/${permId}`, {
        headers: { Authorization: `Bearer ${tokenTeacher2}` },
      });

      const passed7 = s2Read.status === 403 && t2Read.status === 403;
      record(7, 'Pengguna mencoba membaca lampiran milik orang lain (IDOR)', passed7,
        `Siswa lain baca: ${s2Read.status} (${s2Read.data?.message}), Guru luar rombel baca: ${t2Read.status} (${t2Read.data?.message})`);
    }

    // 8. Pengguna mencoba mengubah ID pada request untuk mengakses data di luar kewenangan (IDOR)
    {
      const fakeId = 'cmv9ozfake00000000000000';
      const res = await request(`/students/${fakeId}`, {
        headers: { Authorization: `Bearer ${tokenStudent1}` },
      });
      // Student 1 trying to access an ID different from their own must be 403 Forbidden
      const passed = res.status === 403;
      record(8, 'Pengguna mencoba mengubah ID pada request untuk mengakses data di luar kewenangan', passed,
        `HTTP status ${res.status} (Pesan: "${res.data?.message}")`);
    }
  }

  // 9. Refresh token yang sudah dicabut digunakan kembali
  {
    // Login new session
    const tempAuth = await login('2401', 'password123');
    // Logout to revoke refresh token
    await request('/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tempAuth.accessToken}` },
    });

    // Try to refresh using the revoked token
    const res = await request('/auth/refresh', {
      method: 'POST',
      body: { refreshToken: tempAuth.refreshToken },
    });
    const passed = res.status === 401;
    record(9, 'Refresh token yang sudah dicabut digunakan kembali', passed,
      `HTTP status ${res.status} (Pesan: "${res.data?.message}")`);
  }

  // 10. Request berulang mencoba membuat absensi ganda (Idempotensi & Validasi duplikasi)
  {
    // Create new active session by Teacher 1
    const createSessionRes = await request('/attendance/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenTeacher1}` },
      body: {
        classId: validClassId,
        subjectId: validSubjectId,
        date: '2026-10-24',
        startTime: '09:00',
        endTime: '10:30',
      },
    });
    const newSessionId = createSessionRes.data?.data?.id;

    // 10a. Duplicate studentId inside single batch request
    const duplicateBatchRes = await request(`/attendance/sessions/${newSessionId}/records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: {
        records: [
          { studentId: student1Id, status: 'HADIR' },
          { studentId: student1Id, status: 'ALPA' },
        ],
      },
    });

    // 10b. Repeated submit request (idempotent upsert verification)
    const firstSubmit = await request(`/attendance/sessions/${newSessionId}/records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: {
        records: [{ studentId: student1Id, status: 'HADIR' }],
      },
    });

    const secondSubmit = await request(`/attendance/sessions/${newSessionId}/records`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAdmin}` },
      body: {
        records: [{ studentId: student1Id, status: 'HADIR' }],
      },
    });

    const sessionCheck = await request(`/attendance/sessions/${newSessionId}`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const recordsCount = sessionCheck.data?.data?.records?.filter((r) => r.studentId === student1Id).length;

    const passed =
      duplicateBatchRes.status === 400 &&
      [200, 201].includes(firstSubmit.status) &&
      [200, 201].includes(secondSubmit.status) &&
      recordsCount === 1;

    record(
      10,
      'Request berulang mencoba membuat absensi ganda',
      passed,
      `Duplikasi dalam batch: ${duplicateBatchRes.status} (${duplicateBatchRes.data?.message}), Idempoten: status ${secondSubmit.status}, Jumlah baris di DB: ${recordsCount} (Tidak terjadi duplikasi)`,
    );
  }

  console.log('================================================================');
  const totalPassed = results.filter(r => r.passed).length;
  console.log(`🏁 HASIL AUDIT KEAMANAN: ${totalPassed}/${results.length} SKENARIO LOLOS (PASS)`);
  console.log('================================================================\n');

  if (totalPassed !== results.length) {
    process.exit(1);
  }
}

runSecurityAudit().catch(err => {
  console.error('Audit execution error:', err);
  process.exit(1);
});

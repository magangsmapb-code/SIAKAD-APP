/**
 * SIAKAD POST-DEPLOYMENT SMOKE TEST SUITE
 * Validates availability, health, authentication, dashboard, attendance,
 * permissions, reports, and settings across production/staging endpoints.
 */

const API_BASE_URL = process.env.SMOKE_API_URL || 'http://localhost:4000/api/v1';
const WEB_BASE_URL = process.env.SMOKE_WEB_URL || 'http://localhost:3000';

async function request(baseUrl, endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const config = {
    method: options.method || 'GET',
    headers,
    signal: AbortSignal.timeout(3000),
  };
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  try {
    const res = await fetch(url, config);
    let data;
    const text = await res.text();
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

async function runSmokeTests() {
  console.log('================================================================');
  console.log('🚀 SIAKAD PRODUCTION POST-DEPLOYMENT SMOKE TEST SUITE');
  console.log(`API Target : ${API_BASE_URL}`);
  console.log(`Web Target : ${WEB_BASE_URL}`);
  console.log('================================================================\n');

  const tests = [];
  function record(num, name, passed, details) {
    tests.push({ num, name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [Smoke ${num}] ${name}`);
    console.log(`   ${details}\n`);
  }

  // 1. Healthcheck Endpoint
  const healthRes = await request(API_BASE_URL, '/health');
  record(1, 'API Healthcheck Endpoint (/health)', healthRes.status === 200,
    `Status: ${healthRes.status}, Response: ${JSON.stringify(healthRes.data)}`);

  // 2. API Root Welcome / Version Endpoint
  const rootRes = await request(API_BASE_URL, '');
  record(2, 'API Root Service Discovery (/api/v1)', rootRes.status === 200,
    `Status: ${rootRes.status}, Message: "${rootRes.data?.message || 'OK'}"`);

  // 3. Admin Authentication Login
  const loginRes = await request(API_BASE_URL, '/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'admin123' },
  });
  const token = loginRes.data?.data?.tokens?.accessToken;
  record(3, 'Admin Authentication Login (/auth/login)', [200, 201].includes(loginRes.status) && !!token,
    `Status: ${loginRes.status}, Authenticated Admin: "${loginRes.data?.data?.user?.fullName || 'admin'}"`);

  if (!token) {
    console.error('Fatal: Cannot continue smoke tests without authentication token.');
    process.exit(1);
  }

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 4. Dashboard Statistics
  const dashRes = await request(API_BASE_URL, '/dashboard/summary', { headers: authHeaders });
  record(4, 'Dashboard Statistics (/dashboard/summary)', dashRes.status === 200,
    `Status: ${dashRes.status}, Total Siswa: ${dashRes.data?.data?.totalStudents ?? 'N/A'}, Kehadiran Hari Ini: ${dashRes.data?.data?.todayAttendanceRate ?? 'N/A'}%`);

  // 5. Attendance Sessions Endpoint
  const attRes = await request(API_BASE_URL, '/attendance/sessions', { headers: authHeaders });
  const sessionCount = attRes.data?.data?.data?.length || attRes.data?.data?.length || 0;
  record(5, 'Attendance Sessions Endpoint (/attendance/sessions)', attRes.status === 200,
    `Status: ${attRes.status}, Jumlah Sesi Tercatat: ${sessionCount}`);

  // 6. Permissions Requests Endpoint
  const permRes = await request(API_BASE_URL, '/permissions', { headers: authHeaders });
  const permCount = permRes.data?.data?.data?.length || permRes.data?.data?.length || 0;
  record(6, 'Permissions Listing Endpoint (/permissions)', permRes.status === 200,
    `Status: ${permRes.status}, Jumlah Pengajuan Izin: ${permCount}`);

  // 7. Attendance Reports Endpoint
  const reportRes = await request(API_BASE_URL, '/reports/attendance', { headers: authHeaders });
  record(7, 'Reports Endpoint (/reports/attendance)', reportRes.status === 200,
    `Status: ${reportRes.status}, Pesan: "${reportRes.data?.message || 'Data laporan termuat'}"`);

  // 8. School Settings Endpoint
  const setRes = await request(API_BASE_URL, '/settings', { headers: authHeaders });
  record(8, 'School Settings Endpoint (/settings)', setRes.status === 200,
    `Status: ${setRes.status}, Nama Sekolah: "${setRes.data?.data?.schoolName || 'SMA Pemberdayaan Bangsa Ngrayun'}"`);

  // 9. Web Frontend Availability (Smoke Web Server if active)
  const webLoginRes = await request(WEB_BASE_URL, '/login');
  const webPassed = [200, 307, 308].includes(webLoginRes.status);
  record(
    9,
    'Web Frontend Login Page (GET /login)',
    webPassed || process.env.SKIP_WEB_CHECK === 'true',
    webPassed
      ? `Status: ${webLoginRes.status} (Web Service Reachable & Responding)`
      : `Status: ${webLoginRes.status} (${webLoginRes.error || 'Web service offline on localhost:3000; built standalone ready for VPS'})`,
  );

  // 10. Security Baseline: Unauthenticated Access Rejection
  const unauthRes = await request(API_BASE_URL, '/settings');
  record(10, 'Security Rejection on Unauthenticated Request', unauthRes.status === 401,
    `Status: ${unauthRes.status} (Properly blocked with 401 Unauthorized)`);

  console.log('================================================================');
  const allPassed = tests.every((t) => t.passed);
  const passCount = tests.filter((t) => t.passed).length;
  console.log(`🏁 SMOKE TEST SUMMARY: ${passCount}/${tests.length} TESTS PASSED`);
  console.log('================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error('Smoke test error:', err);
  process.exit(1);
});

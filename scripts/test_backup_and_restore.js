/**
 * SIAKAD DISASTER RECOVERY & BACKUP/RESTORE VALIDATION SUITE
 * Performs live backup of siakad_db, restores to isolated test DB siakad_restore_test_db,
 * verifies record counts across 9 core entities, measures RTO/RPO, and cleans up.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PG_BIN_DIR = 'C:\\Program Files\\PostgreSQL\\18\\bin';
const PG_DUMP = `"${path.join(PG_BIN_DIR, 'pg_dump.exe')}"`;
const PSQL = `"${path.join(PG_BIN_DIR, 'psql.exe')}"`;

const SOURCE_DB = 'siakad_db';
const TARGET_TEST_DB = 'siakad_restore_test_db';
const BACKUP_DIR = path.join(__dirname, '..', 'backups');
const BACKUP_FILE = path.join(BACKUP_DIR, `test_verification_${Date.now()}.sql`);

async function runBackupRestoreTest() {
  console.log('================================================================');
  console.log('🛡️  SIAKAD BACKUP & DISASTER RECOVERY RESTORE VERIFICATION');
  console.log('Source DB : ' + SOURCE_DB);
  console.log('Target DB : ' + TARGET_TEST_DB + ' (Isolated Sandbox)');
  console.log('================================================================\n');

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // 1. Measure Backup Creation (RPO / Speed)
  console.log('Step 1: Creating full database backup with pg_dump...');
  const backupStart = Date.now();
  execSync(`${PG_DUMP} -h localhost -p 5432 -U postgres -d ${SOURCE_DB} --clean --if-exists -f "${BACKUP_FILE}"`, {
    env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD || 'postgres' },
    stdio: 'inherit',
  });
  const backupDuration = ((Date.now() - backupStart) / 1000).toFixed(2);
  const fileSizeKb = (fs.statSync(BACKUP_FILE).size / 1024).toFixed(2);
  console.log(`✅ Backup successfully created: ${fileSizeKb} KB in ${backupDuration}s\n`);

  // 2. Prepare Isolated Target Database
  console.log('Step 2: Preparing isolated target database...');
  execSync(`${PSQL} -h localhost -p 5432 -U postgres -d postgres -c "DROP DATABASE IF EXISTS ${TARGET_TEST_DB};"`, {
    env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD || 'postgres' },
    stdio: 'inherit',
  });
  execSync(`${PSQL} -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE ${TARGET_TEST_DB};"`, {
    env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD || 'postgres' },
    stdio: 'inherit',
  });
  console.log(`✅ Sandbox database '${TARGET_TEST_DB}' initialized.\n`);

  // 3. Measure Restore Execution (RTO)
  console.log('Step 3: Restoring backup into isolated database...');
  const restoreStart = Date.now();
  execSync(`${PSQL} -h localhost -p 5432 -U postgres -d ${TARGET_TEST_DB} -f "${BACKUP_FILE}"`, {
    env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD || 'postgres' },
    stdio: 'pipe',
  });
  const restoreDuration = ((Date.now() - restoreStart) / 1000).toFixed(2);
  console.log(`✅ Restore executed successfully in ${restoreDuration}s (Measured RTO: ${restoreDuration} seconds)\n`);

  // 4. Data Consistency & Row-Count Parity Check
  console.log('Step 4: Verifying data consistency & table record parity...');
  const tables = [
    'users',
    'students',
    'teachers',
    'classes',
    'subjects',
    'schedules',
    'attendance_sessions',
    'attendance_records',
    'permission_requests',
    'audit_logs',
  ];

  let parityAllMatch = true;
  console.log('----------------------------------------------------------------');
  console.log('| Table Name           | Source Count | Restored Count | Status |');
  console.log('----------------------------------------------------------------');

  for (const table of tables) {
    const query = `SELECT COUNT(*) FROM "${table}";`;
    const srcOut = execSync(`${PSQL} -h localhost -p 5432 -U postgres -d ${SOURCE_DB} -t -c "${query}"`, {
      env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD || 'postgres' },
    }).toString().trim();

    const tgtOut = execSync(`${PSQL} -h localhost -p 5432 -U postgres -d ${TARGET_TEST_DB} -t -c "${query}"`, {
      env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD || 'postgres' },
    }).toString().trim();

    const match = srcOut === tgtOut;
    if (!match) parityAllMatch = false;
    const mark = match ? 'MATCH (OK)' : 'MISMATCH';
    console.log(`| ${table.padEnd(20)} | ${srcOut.padStart(12)} | ${tgtOut.padStart(14)} | ${mark.padEnd(6)} |`);
  }
  console.log('----------------------------------------------------------------\n');

  // 5. Clean up sandbox test DB and test backup file
  console.log('Step 5: Cleaning up sandbox resources...');
  execSync(`${PSQL} -h localhost -p 5432 -U postgres -d postgres -c "DROP DATABASE ${TARGET_TEST_DB};"`, {
    env: { ...process.env, PGPASSWORD: process.env.PGPASSWORD || 'postgres' },
    stdio: 'inherit',
  });
  if (fs.existsSync(BACKUP_FILE)) {
    fs.unlinkSync(BACKUP_FILE);
  }
  console.log('✅ Sandbox database dropped and temporary backup file purged.\n');

  console.log('================================================================');
  if (parityAllMatch) {
    console.log('🏁 RESULT: BACKUP & RESTORE VERIFICATION PASSED (100% PARITY)');
    console.log(`   - Verified Backup Size : ${fileSizeKb} KB`);
    console.log(`   - Measured Backup Time : ${backupDuration} seconds`);
    console.log(`   - Measured Restore RTO : ${restoreDuration} seconds`);
    console.log('================================================================\n');
  } else {
    console.error('❌ RESULT: DATA PARITY MISMATCH DETECTED DURING RESTORE!');
    process.exit(1);
  }
}

runBackupRestoreTest().catch((err) => {
  console.error('Fatal error during backup/restore verification:', err);
  process.exit(1);
});

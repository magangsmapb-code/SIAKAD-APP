const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe(`
    SELECT enumlabel 
    FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = 'SessionStatus'
    ORDER BY enumsortorder;
  `);
  console.log('PostgreSQL SessionStatus labels:', result);

  const attStatus = await prisma.$queryRawUnsafe(`
    SELECT enumlabel 
    FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = 'AttendanceStatus'
    ORDER BY enumsortorder;
  `);
  console.log('PostgreSQL AttendanceStatus labels:', attStatus);

  const permStatus = await prisma.$queryRawUnsafe(`
    SELECT enumlabel 
    FROM pg_enum 
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
    WHERE pg_type.typname = 'PermissionStatus'
    ORDER BY enumsortorder;
  `);
  console.log('PostgreSQL PermissionStatus labels:', permStatus);
}

main().catch(console.error).finally(() => prisma.$disconnect());

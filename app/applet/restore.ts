import { execSync } from 'child_process';
try {
  execSync('git checkout prisma/schema.prisma', { stdio: 'inherit' });
  console.log('Restored prisma/schema.prisma');
} catch (e) {
  console.error('Failed to restore prisma/schema.prisma:', e);
}
try {
  execSync('git checkout app/applet/prisma/schema.prisma', { stdio: 'inherit' });
  console.log('Restored app/applet/prisma/schema.prisma');
} catch (e) {
  console.error('Failed to restore app/applet/prisma/schema.prisma:', e);
}

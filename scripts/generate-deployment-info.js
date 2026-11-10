const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  let commit = 'unknown';
  let fullCommit = '';
  let message = 'Manual build';
  let author = 'Developer';
  let commitDate = '';

  try {
    commit = execSync('git rev-parse --short HEAD').toString().trim();
    fullCommit = execSync('git rev-parse HEAD').toString().trim();
    message = execSync('git log -1 --pretty=%s').toString().trim();
    author = execSync('git log -1 --pretty=%an').toString().trim();
    commitDate = execSync('git log -1 --pretty=%cd').toString().trim();
  } catch (err) {
    console.warn('Could not read git details, using fallback:', err.message);
  }

  const now = new Date();
  const deployedAt = now.toISOString();

  // Format explicitly into East African Time (Uganda / Kampala, UTC+3)
  const deployedAtEAT = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(now) + ' EAT';

  const deploymentData = {
    commit,
    fullCommit,
    message,
    author,
    commitDate,
    deployedAt,
    deployedAtEAT,
    timeZone: 'Africa/Kampala (EAT, UTC+3)',
    repository: 'derrickgenesism/flixonzero'
  };

  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(publicDir, 'deployment.json'),
    JSON.stringify(deploymentData, null, 2)
  );

  console.log('✅ Generated public/deployment.json successfully (East African Time):');
  console.log(deploymentData);
} catch (error) {
  console.error('Failed to generate deployment info:', error);
}

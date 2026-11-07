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

  const deployedAt = new Date().toISOString();

  const deploymentData = {
    commit,
    fullCommit,
    message,
    author,
    commitDate,
    deployedAt,
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

  console.log('✅ Generated public/deployment.json successfully:');
  console.log(deploymentData);
} catch (error) {
  console.error('Failed to generate deployment info:', error);
}

const fs = require('fs');
const path = require('path');

const backendDirectory = path.resolve(__dirname, '..');

test('legacy trained-model assets are absent from production-facing backend folders', () => {
  for (const folder of ['models', 'notebooks', 'raw']) {
    const folderPath = path.join(backendDirectory, folder);
    if (fs.existsSync(folderPath)) {
      expect(fs.readdirSync(folderPath)).toEqual([]);
    }
  }
});

test('the legacy neural/fusion prototype is quarantined as non-production history', () => {
  const archiveReadme = path.join(backendDirectory, 'archive', 'legacy-neural-fusion', 'README.md');
  expect(fs.existsSync(archiveReadme)).toBe(true);
  expect(fs.readFileSync(archiveReadme, 'utf8')).toMatch(/historical and non-production/i);
});

test('the Express runtime does not mount the retired model route', () => {
  const serverSource = fs.readFileSync(path.join(backendDirectory, 'index.js'), 'utf8');
  expect(serverSource).not.toContain("routes/models");
  expect(serverSource).not.toContain("/models");
});

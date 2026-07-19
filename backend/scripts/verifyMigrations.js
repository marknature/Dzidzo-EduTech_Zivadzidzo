const fs = require('fs');
const path = require('path');

const migrationsDirectory = path.resolve(__dirname, '..', 'migrations');
const migrationName = /^(\d{4})_([a-z0-9][a-z0-9_-]*)\.sql$/i;

function fail(message) {
  console.error(`Migration verification failed: ${message}`);
  process.exitCode = 1;
}

if (!fs.existsSync(migrationsDirectory)) {
  fail(`missing directory ${migrationsDirectory}`);
} else {
  const entries = fs.readdirSync(migrationsDirectory, { withFileTypes: true });
  const sqlFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.sql'));
  const invalidNames = sqlFiles.filter((entry) => !migrationName.test(entry.name));

  if (invalidNames.length) {
    fail(`SQL migrations must use the 0000_descriptive_name.sql convention: ${invalidNames.map((entry) => entry.name).join(', ')}`);
  } else if (!sqlFiles.length) {
    fail('no SQL migrations found');
  } else {
    const ordered = sqlFiles
      .map((entry) => ({ name: entry.name, number: Number(migrationName.exec(entry.name)[1]) }))
      .sort((left, right) => left.number - right.number || left.name.localeCompare(right.name));

    const problems = [];
    ordered.forEach((migration, index) => {
      if (migration.number !== index) {
        problems.push(`expected ${String(index).padStart(4, '0')} but found ${migration.name}`);
      }
      const sql = fs.readFileSync(path.join(migrationsDirectory, migration.name), 'utf8');
      const executableSql = sql
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith('--'))
        .join('')
        .trim();
      if (!executableSql) problems.push(`${migration.name} has no executable SQL`);
    });

    if (problems.length) {
      fail(problems.join('; '));
    } else {
      console.log(`Migration manifest is valid: ${ordered.length} files (${ordered[0].name} through ${ordered.at(-1).name}).`);
    }
  }
}

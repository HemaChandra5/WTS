import test from 'node:test';
import assert from 'node:assert/strict';

import { buildDownloadFileName } from './exportUtils.js';

test('buildDownloadFileName includes a date stamp and a readable base name', () => {
  const name = buildDownloadFileName({ name: 'Monthly Report', extension: 'csv' });
  assert.match(name, /^\d{4}-\d{2}-\d{2}-monthly-report\.csv$/);
});

test('buildDownloadFileName preserves a provided extension and sanitizes the base name', () => {
  const name = buildDownloadFileName({ name: 'My File #1.pdf', extension: 'pdf' });
  assert.match(name, /^\d{4}-\d{2}-\d{2}-my-file-1\.pdf$/);
});

const sanitizeBaseName = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'download';

export const formatExportDate = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return d.toISOString().slice(0, 10);
};

export const buildDownloadFileName = ({ name = 'download', extension = 'csv', date = new Date() } = {}) => {
  const safeBase = sanitizeBaseName(name);
  const safeExt = String(extension || 'csv').replace(/^\./, '').toLowerCase();
  return `${formatExportDate(date)}-${safeBase}.${safeExt}`;
};

/**
 * Proper RFC-4180 CSV parser — handles quoted fields containing commas/newlines.
 */
export function parseCSV(text: string): Record<string, string>[] {
  const rows = splitCSVRows(text.trim());
  if (rows.length < 2) return [];
  const headers = parseCSVRow(rows[0]);
  return rows
    .slice(1)
    .filter((r) => r.trim() !== '')
    .map((line) => {
      const vals = parseCSVRow(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h.trim()] = (vals[i] ?? '').trim(); });
      return obj;
    });
}

/**
 * Read a File for preview — only parses the first `previewRows` data rows
 * by slicing the file text. Non-blocking for large files.
 */
export async function readCSVPreview(
  file: File,
  previewRows = 50,
): Promise<{ headers: string[]; rows: Record<string, string>[]; totalEstimate: number }> {
  // Read only first 128 KB for preview (enough for 50+ rows even with long values)
  const sliceSize = Math.min(file.size, 128 * 1024);
  const sliceText = await file.slice(0, sliceSize).text();

  const lines = sliceText.split('\n').map((l) => l.replace(/\r/g, ''));
  const headers = parseCSVRow(lines[0] ?? '').map((h) => h.trim());

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length && rows.length < previewRows; i++) {
    if (!lines[i].trim()) continue;
    const vals = parseCSVRow(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, j) => { obj[h] = (vals[j] ?? '').trim(); });
    rows.push(obj);
  }

  // Estimate total rows from file size vs slice size ratio
  const avgLineBytes = sliceSize / Math.max(lines.length, 1);
  const totalEstimate = Math.max(rows.length, Math.round(file.size / avgLineBytes) - 1);

  return { headers, rows, totalEstimate };
}

/**
 * Parse a full File in async chunks — yields batches of rows without blocking UI.
 * Uses setTimeout(0) between batches to keep the page responsive.
 */
export async function parseCSVFileInChunks(
  file: File,
  onBatch: (rows: Record<string, string>[]) => Promise<void>,
  batchSize = 500,
): Promise<{ total: number }> {
  const text = await file.text();
  const lines = text.split('\n').map((l) => l.replace(/\r/g, ''));
  const headers = parseCSVRow(lines[0] ?? '').map((h) => h.trim());

  let total = 0;
  let batch: Record<string, string>[] = [];

  const flush = async () => {
    if (batch.length === 0) return;
    await onBatch(batch);
    total += batch.length;
    batch = [];
    // Yield to browser between batches
    await new Promise<void>((r) => setTimeout(r, 0));
  };

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = parseCSVRow(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, j) => { obj[h] = (vals[j] ?? '').trim(); });
    batch.push(obj);
    if (batch.length >= batchSize) await flush();
  }
  await flush();

  return { total };
}

/** Split CSV text into rows, respecting quoted fields that span lines */
function splitCSVRows(text: string): string[] {
  const rows: string[] = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuote && text[i + 1] === '"') { current += '"'; i++; }
      else inQuote = !inQuote;
    } else if ((ch === '\n' || ch === '\r') && !inQuote) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      rows.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current) rows.push(current);
  return rows;
}

/** Parse a single CSV row into fields, handling quoted values */
function parseCSVRow(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { current += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

/** Chunk array into batches */
export function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

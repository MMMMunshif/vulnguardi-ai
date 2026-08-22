const escapeCsvCell = (value: unknown) => {
  let text = value == null ? '' : String(value);

  // Prevent spreadsheet applications from evaluating exported values as formulas.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;

  return `"${text.replaceAll('"', '""')}"`;
};

export const downloadCsv = (filename: string, rows: unknown[][]) => {
  const csv = rows.map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
  const blob = new Blob([`\uFEFF${csv}`], {
    type: 'text/csv;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const ExcelJS = require('exceljs');
const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

const TEMPLATE_PATH = path.join(__dirname, '../../TEMPLATE INSPEKSI ALAT LAB_BENGKEL PPNS_Z.xlsx');

const MONTH_COLS = [
  { b: 9, k: 10 },  // Jan
  { b: 11, k: 12 },  // Feb
  { b: 13, k: 14 },  // Mar
  { b: 15, k: 16 },  // Apr
  { b: 17, k: 18 },  // Mei
  { b: 19, k: 20 }   // Jun
];

function formatDate(d) {
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric'
  });
}

function buildCategoryTree(results) {
  const categories = new Map();
  for (const r of results) {
    if (!categories.has(r.category_id)) {
      categories.set(r.category_id, {
        id: r.category_id,
        nama_kategori: r.nama_kategori,
        urutan: r.category_urutan,
        subitems: new Map()
      });
    }
    const cat = categories.get(r.category_id);
    if (!cat.subitems.has(r.subitem_id)) {
      cat.subitems.set(r.subitem_id, {
        nama_subitem: r.nama_subitem,
        urutan: r.subitem_urutan,
        months: {}
      });
    }
    cat.subitems.get(r.subitem_id).months[r.bulan_ke] = r.status;
  }
  return Array.from(categories.values()).sort((a, b) => a.urutan - b.urutan);
}

const exportInspection = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 1. Ambil Data dari Database
    const [inspections] = await pool.query(
      `SELECT i.*, u.name as inspector_name, l.nama_lab, l.lokasi,
              kalab.name as penanggung_jawab, kalab.nip,
              it.nama_barang, it.kode_barang, it.pembuat_alat, it.tanggal_pembelian
       FROM inspections i
       LEFT JOIN users u ON i.inspector_id = u.id
       LEFT JOIN laboratories l ON i.laboratory_id = l.id
       LEFT JOIN users kalab ON l.kalab_id = kalab.id
       LEFT JOIN items it ON i.item_id = it.id
       WHERE i.id = ?`, [id]
    );

    if (inspections.length === 0) {
      return res.status(404).json({ success: false, message: 'Inspeksi tidak ditemukan' });
    }
    const inspection = inspections[0];


    const [results] = await pool.query(
      `SELECT ir.status, ir.bulan_ke, is2.id as subitem_id, is2.nama_subitem,
              ic.id as category_id, ic.nama_kategori, ic.urutan as category_urutan, is2.urutan as subitem_urutan
       FROM inspection_results ir
       JOIN inspection_subitems is2 ON ir.subitem_id = is2.id
       JOIN inspection_categories ic ON is2.category_id = ic.id
       WHERE ir.inspection_id = ?
       ORDER BY ic.urutan ASC, is2.urutan ASC, ir.bulan_ke ASC`, [id]
    );

    const catsArray = buildCategoryTree(results);

    // 2. Load Template Excel
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(TEMPLATE_PATH);
    const sheet = wb.getWorksheet(1);

    const ws2 = wb.getWorksheet(2); if (ws2) wb.removeWorksheet(ws2.id);
    const ws3 = wb.getWorksheet(3); if (ws3) wb.removeWorksheet(ws3.id);

    // 3. Isi Data Metadata Bagian Atas
    const year = new Date(inspection.tanggal_inspeksi).getFullYear();

    sheet.getCell('A7').value = '';
    sheet.getCell('A8').value = '';

    sheet.getCell('D1').value = 'LABORATORIUM/BENGKEL ' + (inspection.nama_lab || '').toUpperCase();
    sheet.getCell('A5').value = 'Tahun ' + year;
    sheet.getCell('A7').value = 'Nama alat : ' + inspection.nama_barang + (inspection.kode_barang ? ' (' + inspection.kode_barang + ')' : '');
    sheet.getCell('A8').value = 'Pembuat alat : ' + (inspection.pembuat_alat || '-');
    if (inspection.tanggal_pembelian) {
      sheet.getCell('G8').value = 'Tanggal Pembelian : ' + formatDate(inspection.tanggal_pembelian);
    }
    if (inspection.lokasi) {
      const m = inspection.lokasi.match(/Gedung\s+(\S+)\s+Lantai\s+(\d+)(?:\s+Ruang\s+(.+))?/i);
      if (m) {
        sheet.getCell('S7').value = 'Gedung: ' + m[1];
        sheet.getCell('S8').value = 'Lantai   : ' + m[2];
        if (m[3]) {
          sheet.getCell('S6').value = 'Ruang: ' + m[3].trim();
        }
      }
    }

    // Update header bulan ke-1 s/d 6 di row 9-10
    for (let c = 9; c <= 24; c++) {
      try { sheet.unMergeCells(sheet.getCell(9, c).address + ':' + sheet.getCell(9, Math.min(c + 3, 24)).address); } catch (e) { }
    }
    for (let c = 9; c <= 24; c++) {
      try { sheet.unMergeCells(sheet.getCell(10, c).address + ':' + sheet.getCell(10, Math.min(c + 1, 24)).address); } catch (e) { }
    }
    for (let m = 0; m < MONTH_COLS.length; m++) {
      const bCol = MONTH_COLS[m].b;
      const kCol = MONTH_COLS[m].k;
      sheet.getCell(9, bCol).value = 'Bulan ke-' + (m + 1);
      sheet.getCell(9, kCol).value = null;
      sheet.mergeCells(sheet.getCell(9, bCol).address + ':' + sheet.getCell(9, kCol).address);
      sheet.getCell(10, bCol).value = 'B';
      sheet.getCell(10, kCol).value = 'K';
      sheet.getCell(9, bCol).font = { bold: true, size: 11, name: 'Calibri' };
      sheet.getCell(10, bCol).font = { bold: true, size: 11, name: 'Calibri' };
      sheet.getCell(10, kCol).font = { bold: true, size: 11, name: 'Calibri' };
      const thin = { style: 'thin', color: { argb: 'FF000000' } };
      const bdr = { left: thin, right: thin, top: thin, bottom: thin };
      sheet.getCell(9, bCol).border = bdr;
      sheet.getCell(9, kCol).border = bdr;
      sheet.getCell(10, bCol).border = bdr;
      sheet.getCell(10, kCol).border = bdr;
    }
    for (let c = 21; c <= 24; c++) {
      sheet.getCell(9, c).value = null;
      sheet.getCell(10, c).value = null;
    }

    // 4. Hitung Kebutuhan Baris Dinamis
    let totalDataRowsNeeded = 0;
    catsArray.forEach(cat => {
      totalDataRowsNeeded += 1;
      totalDataRowsNeeded += cat.subitems.size;
    });

    const TEMPLATE_DATA_ROWS = 31; // Baris 11 sampai 41 di template

    if (totalDataRowsNeeded < TEMPLATE_DATA_ROWS) {
      const rowsToDelete = TEMPLATE_DATA_ROWS - totalDataRowsNeeded;
      sheet.spliceRows(11 + totalDataRowsNeeded, rowsToDelete);
    } else if (totalDataRowsNeeded > TEMPLATE_DATA_ROWS) {
      const rowsToInsert = totalDataRowsNeeded - TEMPLATE_DATA_ROWS;
      for (let i = 0; i < rowsToInsert; i++) {
        sheet.insertRow(41, []);
      }
    }

    // 5. Inject Data Kategori dan Subitem ke Excel
    const lastFooterRow = 12 + totalDataRowsNeeded + 14; // NIP row
    for (let r = 11; r <= Math.min(lastFooterRow, sheet.rowCount); r++) {
      try { sheet.unMergeCells(`A${r}:H${r}`); } catch (e) { }
      try { sheet.unMergeCells(`A${r}:X${r}`); } catch (e) { }
    }

    let currentRowNum = 11;

    // Gunakan fungsi pembuat objek baru agar style tidak saling menular (Bug Hijau/Abu-abu beres)
    const getThinBorder = () => ({
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } }
    });

    for (const cat of catsArray) {
      const catRow = sheet.getRow(currentRowNum);
      catRow.height = 20;

      try {
        sheet.unMergeCells(`A${currentRowNum}:H${currentRowNum}`);
      } catch (e) { }

      try {
        sheet.unMergeCells(`A${currentRowNum}:X${currentRowNum}`);
      } catch (e) { }

      const catCell = sheet.getCell(`A${currentRowNum}`);
      catCell.value = cat.nama_kategori;
      catCell.style = {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } },
        font: { bold: true, size: 11, name: 'Calibri', color: { argb: 'FF000000' } },
        alignment: { horizontal: 'left', vertical: 'center' },
        border: getThinBorder()
      };

      sheet.mergeCells(`A${currentRowNum}:X${currentRowNum}`);

      currentRowNum++;

      const subitems = Array.from(cat.subitems.values()).sort((a, b) => a.urutan - b.urutan);
      for (const sub of subitems) {
        const subRow = sheet.getRow(currentRowNum);
        subRow.height = 28.5;

        for (let c = 1; c <= 24; c++) {
          const cell = subRow.getCell(c);
          cell.style = {
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
            font: { bold: false, size: 11, name: 'Calibri', color: { argb: 'FF000000' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: getThinBorder()
          };
        }

        try { sheet.unMergeCells(`A${currentRowNum}:H${currentRowNum}`); } catch (e) { }
        sheet.mergeCells(`A${currentRowNum}:H${currentRowNum}`);
        const descCell = subRow.getCell(1);
        descCell.value = sub.nama_subitem;
        descCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

        for (let m = 0; m < MONTH_COLS.length; m++) {
          const bulanKe = m + 1;
          const status = sub.months[bulanKe] || '';
          const bCol = MONTH_COLS[m].b;
          const kCol = MONTH_COLS[m].k;

          if (status === 'B') {
            const bCell = subRow.getCell(bCol);
            bCell.value = '\u2713';
            bCell.font = { size: 14, name: 'Calibri', bold: true, color: { argb: 'FF008000' } };
          } else if (status === 'K') {
            const kCell = subRow.getCell(kCol);
            kCell.value = '\u2717';
            kCell.font = { size: 14, name: 'Calibri', bold: true, color: { argb: 'FFFF0000' } };
          }
        }
        currentRowNum++;
      }
    }

    // 6. Hitung Posisi Footer Dinamis
    // Template asli: data rows 11-41, Tgl di row 43 (2 baris setelah data terakhir)
    const tglInspeksiRow = 12 + totalDataRowsNeeded;
    const inspectorNameRow = tglInspeksiRow + 1;
    const keteranganRow = tglInspeksiRow + 2;
    const legendRow1 = tglInspeksiRow + 3;   // B - Baik
    const legendRow2 = tglInspeksiRow + 4;   // K - Kurang
    const noteRow = tglInspeksiRow + 6;      // Berikan tanda check
    const headerRow = tglInspeksiRow + 8;    // Kepala Lab / PLP 1 / PLP 2
    const kalabNameRow = tglInspeksiRow + 13;
    const kalabNipRow = tglInspeksiRow + 14;

    // Bersihkan merge lama area footer
    try { sheet.unMergeCells(`A${tglInspeksiRow}:H${tglInspeksiRow}`); } catch (e) { }
    try { sheet.unMergeCells(`A${inspectorNameRow}:H${inspectorNameRow}`); } catch (e) { }
    sheet.mergeCells(`A${tglInspeksiRow}:H${tglInspeksiRow}`);
    sheet.mergeCells(`A${inspectorNameRow}:H${inspectorNameRow}`);

    // Set Nilai & Style Tgl Inspeksi
    const tglCell = sheet.getCell(`A${tglInspeksiRow}`);
    tglCell.value = 'Tgl Inspeksi      : ' + formatDate(inspection.tanggal_inspeksi);
    tglCell.font = { name: 'Calibri', size: 11, bold: false, color: { argb: 'FF000000' } };
    tglCell.fill = { type: 'pattern', pattern: 'none' };
    tglCell.alignment = { horizontal: 'left', vertical: 'center' };

    // Set Nilai & Style Pemeriksa
    const insCell = sheet.getCell(`A${inspectorNameRow}`);
    insCell.value = 'Diinspeksi oleh: ' + (inspection.inspector_name || '-');
    insCell.font = { name: 'Calibri', size: 11, bold: false, color: { argb: 'FF000000' } };
    insCell.fill = { type: 'pattern', pattern: 'none' };
    insCell.alignment = { horizontal: 'left', vertical: 'center' };

    // Border kanan kolom X baris 6-10 (Ruang, Gedung, Lantai, header)
    for (let r = 6; r <= 10; r++) {
      sheet.getCell(r, 24).border = { right: { style: 'thin', color: { argb: 'FF000000' } } };
    }
    // Border kolom U-X baris 9-10
    const thin = { style: 'thin', color: { argb: 'FF000000' } };
    const bdr = { left: thin, right: thin, top: thin, bottom: thin };
    for (let c = 21; c <= 24; c++) {
      sheet.getCell(9, c).border = bdr;
      sheet.getCell(10, c).border = bdr;
    }

    // Tulis Nama & NIP Kepala Laboratorium
    if (inspection.penanggung_jawab) {
      const nameCell = sheet.getCell(`A${kalabNameRow}`);
      nameCell.value = inspection.penanggung_jawab;
      nameCell.font = {
        name: 'Calibri', size: 11, bold: true, underline: true, color: { argb: 'FF000000' }
      };
    }
    if (inspection.nip) {
      const nipCell = sheet.getCell(`A${kalabNipRow}`);
      nipCell.value = `NIP. ${inspection.nip}`;
      nipCell.font = {
        name: 'Calibri', size: 11, bold: false, color: { argb: 'FF000000' }
      };
    }

    // =============================
    // FOTO INSPEKSI
    // =============================

    if (inspection.foto) {

      const fotoPath = path.join(
        __dirname,
        "../../",
        inspection.foto.replace(/^\//, "")
      );

      if (fs.existsSync(fotoPath)) {

        const ext = path.extname(fotoPath)
          .replace(".", "")
          .toLowerCase();

        const imageId = workbook.addImage({
          filename: fotoPath,
          extension: ext
        });

        sheet.addImage(imageId, {
          tl: { col: 24, row: 6 },
          ext: {
            width: 240,
            height: 180
          }
        });

      } else {

        console.log("Foto tidak ditemukan");

      }

    }

    // 7. Set Response Headers dan Kirim
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Inspeksi_' + inspection.nama_barang.replace(/\s+/g, '_') + '_' + year + '.xlsx"');

    const monthCells = [
      'A6', 'B6', 'C6', 'D6', 'E6', 'F6',
      'G6', 'H6', 'I6', 'J6', 'K6', 'L6'
    ];

    monthCells.forEach(addr => {
      const cell = sheet.getCell(addr);

      // Pertahankan style lama
      cell.font = {
        ...(cell.font || {}),
        color: { argb: 'FF000000' }
      };

      // Optional: paksa background putih
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' }
      };
    });

    for (let col = 1; col <= 12; col++) {
      const cell = sheet.getRow(6).getCell(col);

      cell.font = {
        ...(cell.font || {}),
        color: { argb: 'FF000000' }
      };
    }
    sheet.getCell('C7').font = {
      name: 'Calibri',
      size: 11,
      bold: false,
      color: { argb: 'FF000000' }
    };

    sheet.getCell('C8').font = {
      name: 'Calibri',
      size: 11,
      bold: false,
      color: { argb: 'FF000000' }
    };

    sheet.getCell('L8').font = {
      name: 'Calibri',
      size: 11,
      bold: false,
      color: { argb: 'FF000000' }
    };

    sheet.getCell('A7').font = {
      name: 'Calibri',
      size: 11,
      color: { argb: 'FF000000' }
    };

    sheet.getCell('A8').font = {
      name: 'Calibri',
      size: 11,
      color: { argb: 'FF000000' }
    };

    sheet.getCell('K8').font = {
      name: 'Calibri',
      size: 11,
      color: { argb: 'FF000000' }
    };


    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    next(err);
  }
};

const exportAllCompleted = async (req, res, next) => {
  try {
    const [inspections] = await pool.query(
      `SELECT i.id, i.tanggal_inspeksi,
              u.name as inspector_name, l.nama_lab, l.lokasi,
              it.nama_barang, it.kode_barang
       FROM inspections i
       LEFT JOIN users u ON i.inspector_id = u.id
       LEFT JOIN laboratories l ON i.laboratory_id = l.id
       LEFT JOIN items it ON i.item_id = it.id
       WHERE (
         SELECT COUNT(DISTINCT ir.bulan_ke)
         FROM inspection_results ir
         WHERE ir.inspection_id = i.id
       ) = 6
       ORDER BY l.nama_lab ASC, it.nama_barang ASC, i.tanggal_inspeksi ASC`
    );

    if (inspections.length === 0) {
      return res.status(404).json({ success: false, message: 'Tidak ada inspeksi yang sudah lengkap 6 bulan' });
    }

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Rekap Inspeksi Lengkap');

    ws.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Laboratorium', key: 'lab', width: 25 },
      { header: 'Nama Alat', key: 'alat', width: 30 },
      { header: 'Kode Barang', key: 'kode', width: 15 },
      { header: 'Inspektur', key: 'inspektur', width: 25 },
      { header: 'Tanggal Inspeksi', key: 'tanggal', width: 20 },
    ];

    const thinBorder = {
      left: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } },
      top: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } }
    };

    const headerRow = ws.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
      cell.font = { bold: true, size: 12, name: 'Calibri', color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'center' };
      cell.border = thinBorder;
    });

    let no = 1;
    for (const insp of inspections) {
      ws.addRow({
        no: no++,
        lab: insp.nama_lab,
        alat: insp.nama_barang + (insp.kode_barang ? ` (${insp.kode_barang})` : ''),
        kode: insp.kode_barang || '-',
        inspektur: insp.inspector_name || '-',
        tanggal: formatDate(insp.tanggal_inspeksi),
      });
    }

    for (let r = 2; r <= inspections.length + 1; r++) {
      const row = ws.getRow(r);
      row.alignment = { horizontal: 'center', vertical: 'center' };
      row.eachCell(c => { c.border = thinBorder; });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Rekap_Inspeksi_Lengkap.xlsx"');

    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    next(err);
  }
};

const checkLabInspectionsStatus = async (req, res, next) => {
  try {
    const { labId, tahun, semester } = req.query;

    if (!labId || !tahun || !semester) {
      return res.status(400).json({
        success: false,
        message: 'labId, tahun, dan semester harus diisi'
      });
    }

    // Get all items in lab
    const [labs] = await pool.query(
      'SELECT item_ids FROM laboratories WHERE id = ?',
      [labId]
    );

    if (labs.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Laboratorium tidak ditemukan'
      });
    }

    const itemIds = labs[0].item_ids ? labs[0].item_ids.split(',').map(Number).filter(Boolean) : [];

    if (itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Laboratorium tidak memiliki peralatan'
      });
    }

    // Check each item's inspection status
    const incompleteInspections = [];

    for (const itemId of itemIds) {
      const [inspections] = await pool.query(
        `SELECT i.id, i.item_id, i.tahun, i.semester, 
                it.nama_barang, it.kode_barang,
                COUNT(DISTINCT ir.bulan_ke) as total_months
         FROM inspections i
         LEFT JOIN inspection_results ir ON i.id = ir.inspection_id
         LEFT JOIN items it ON i.item_id = it.id
         WHERE i.item_id = ? AND i.laboratory_id = ? AND i.tahun = ? AND i.semester = ?
         GROUP BY i.id`,
        [itemId, labId, tahun, semester]
      );

      if (inspections.length === 0) {
        incompleteInspections.push({
          item_id: itemId,
          status: 'NOT_FOUND',
          message: 'Inspeksi belum dibuat'
        });
      } else {
        const inspection = inspections[0];
        // Check if all 6 months are completed
        if (Number(inspection.total_months) < 6) {
          incompleteInspections.push({
            item_id: itemId,
            inspection_id: inspection.id,
            nama_barang: inspection.nama_barang,
            kode_barang: inspection.kode_barang,
            status: 'INCOMPLETE',
            completed_months: Number(inspection.total_months),
            message: `Hanya ${Number(inspection.total_months)}/6 bulan yang selesai`
          });
        }
      }
    }

    res.json({
      success: true,
      canExport: incompleteInspections.length === 0,
      incompleteInspections,
      totalItems: itemIds.length,
      completedItems: itemIds.length - incompleteInspections.length
    });

  } catch (err) {
    next(err);
  }
};

function copyWorksheet(template, target) {

  // Copy lebar kolom
  template.columns.forEach((col, i) => {
    target.getColumn(i + 1).width = col.width;
  });

  // Copy tinggi baris + value + style
  template.eachRow({ includeEmpty: true }, (row, rowNumber) => {

    const targetRow = target.getRow(rowNumber);

    targetRow.height = row.height;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {

      const newCell = newRow.getCell(colNumber);

      // Value
      newCell.value = cell.value;

      // Font
      newCell.font = JSON.parse(
        JSON.stringify(cell.font || {})
      );

      // Fill
      newCell.fill = JSON.parse(
        JSON.stringify(cell.fill || {})
      );

      // Border
      newCell.border = JSON.parse(
        JSON.stringify(cell.border || {})
      );

      // Alignment
      newCell.alignment = JSON.parse(
        JSON.stringify(cell.alignment || {})
      );

      // Number format
      newCell.numFmt = cell.numFmt;

      // Protection
      newCell.protection = JSON.parse(
        JSON.stringify(cell.protection || {})
      );

    });

  });


  template.model.merges.forEach(range => {
    try {
      target.mergeCells(range);
    } catch (e) {
    }
  });

}

async function cloneTemplateSheet(workbook, sheetName) {

  // Buka template baru
  const tempBook = new ExcelJS.Workbook();
  await tempBook.xlsx.readFile(TEMPLATE_PATH);

  const source = tempBook.getWorksheet(1);

  // Buat sheet baru di workbook utama
  const target = workbook.addWorksheet(sheetName);

  // Copy worksheet properties
  target.properties = JSON.parse(
    JSON.stringify(source.properties)
  );

  // Copy page setup
  target.pageSetup = JSON.parse(
    JSON.stringify(source.pageSetup)
  );

  // Copy views
  target.views = JSON.parse(
    JSON.stringify(source.views)
  );

  // Copy header footer
  target.headerFooter = JSON.parse(
    JSON.stringify(source.headerFooter)
  );

  // Copy auto filter
  target.autoFilter = source.autoFilter;

  // Copy state
  target.state = source.state;
  // Copy column
  source.columns.forEach((col, i) => {
    target.getColumn(i + 1).width = col.width;
    target.getColumn(i + 1).hidden = col.hidden;
    target.getColumn(i + 1).style = JSON.parse(
      JSON.stringify(col.style || {})
    );
  });

  // Copy row
  source.eachRow({ includeEmpty: true }, (row, rowNumber) => {

    const newRow = target.getRow(rowNumber);

    newRow.height = row.height;
    newRow.hidden = row.hidden;

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {

      const newCell = newRow.getCell(colNumber);

      newCell.value = cell.value;

      newCell.style = JSON.parse(
        JSON.stringify(cell.style || {})
      );

    });

  });

  // Copy Merge
  source.model.merges.forEach(range => {
    try {
      target.mergeCells(range);
    } catch (e) { }
  });

  // Copy row style
  source.eachRow({ includeEmpty: true }, (row, rowNumber) => {

    target.getRow(rowNumber).style = JSON.parse(
      JSON.stringify(row.style || {})
    );

  });

  return target;

}

const exportLabItems = async (req, res, next) => {

  try {

    const { labId, tahun, semester } = req.query;

    if (!labId || !tahun || !semester) {
      return res.status(400).json({
        success: false,
        message: "labId, tahun, dan semester harus diisi"
      });
    }

    // ======================
    // Ambil data laboratorium
    // ======================

    const [labs] = await pool.query(
      `
      SELECT
          l.*,

          kalab.name AS kalab_name,
          kalab.nip AS kalab_nip,

          plp1.name AS plp1_name,
          plp1.nip AS plp1_nip,

          plp2.name AS plp2_name,
          plp2.nip AS plp2_nip

      FROM laboratories l

      LEFT JOIN users kalab
          ON l.kalab_id = kalab.id

      LEFT JOIN users plp1
          ON l.plp1_id = plp1.id

      LEFT JOIN users plp2
          ON l.plp2_id = plp2.id

      WHERE l.id = ?
  `,
      [labId]
    );

    if (labs.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Laboratorium tidak ditemukan"
      });
    }

    const lab = labs[0];

    // ======================
    // Ambil semua item di lab
    // ======================

    const itemIds = lab.item_ids
      ? lab.item_ids
        .split(",")
        .map(Number)
        .filter(Boolean)
      : [];

    if (itemIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Laboratorium belum memiliki peralatan"
      });
    }

    const inspectionList = [];

    for (const itemId of itemIds) {

      const [inspections] = await pool.query(
        `
    SELECT
      i.*,
      it.nama_barang,
      it.kode_barang,
      it.pembuat_alat,
      it.tanggal_pembelian,
      l.nama_lab,
      l.lokasi,
      u.name AS inspector_name,
      kalab.name AS penanggung_jawab,
      kalab.nip
    FROM inspections i
    JOIN items it
      ON i.item_id = it.id
    JOIN laboratories l
      ON i.laboratory_id = l.id
    LEFT JOIN users u
      ON i.inspector_id = u.id
    LEFT JOIN users kalab
      ON l.kalab_id = kalab.id
    WHERE
      i.item_id = ?
      AND i.laboratory_id = ?
      AND i.tahun = ?
      AND i.semester = ?
    `,
        [itemId, labId, tahun, semester]
      );

      if (inspections.length === 0) {


        return res.status(400).json({
          success: false,
          message: `Peralatan ID ${itemId} belum memiliki inspeksi`
        });

      }

      const inspection = inspections[0];

      const [pending] = await pool.query(
        `
  SELECT COUNT(*) AS total
  FROM inspection_results
  WHERE inspection_id = ?
    AND (status IS NULL OR status = '')
  `,
        [inspection.id]
      );

      if (pending[0].total > 0) {
        return res.status(400).json({
          success: false,
          message: `Peralatan "${inspection.nama_barang}" masih memiliki checklist yang belum selesai.`
        });
      }


      inspectionList.push(inspections[0]);
    }

    // =============================
    // Buat workbook
    // =============================

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(TEMPLATE_PATH);

    // Hapus sheet contoh, sisakan template
    while (workbook.worksheets.length > 1) {
      workbook.removeWorksheet(workbook.worksheets[workbook.worksheets.length - 1].id);
    }

    const templateSheet = workbook.getWorksheet(1);


    const logoId = workbook.addImage({
      filename: path.join(__dirname, "../../assets/Logo_PPNS.png"),
      extension: "png"
    });

    for (let i = 0; i < inspectionList.length; i++) {

      const inspection = inspectionList[i];

      let sheet;

      if (i === 0) {

        sheet = templateSheet;

        sheet.name = inspection.kode_barang || inspection.nama_barang;

      } else {

        sheet = await cloneTemplateSheet(
          workbook,
          inspection.kode_barang || inspection.nama_barang
        );

      }

      const [results] = await pool.query(
        `
          SELECT
              ir.status,
              ir.bulan_ke,
              is2.id as subitem_id,
              is2.nama_subitem,
              ic.id as category_id,
              ic.nama_kategori,
              ic.urutan as category_urutan,
              is2.urutan as subitem_urutan
          FROM inspection_results ir
          JOIN inspection_subitems is2
              ON ir.subitem_id=is2.id
          JOIN inspection_categories ic
              ON is2.category_id=ic.id
          WHERE ir.inspection_id=?
          ORDER BY
              ic.urutan,
              is2.urutan,
              ir.bulan_ke
          `,
        [inspection.id]
      );

      const catsArray = buildCategoryTree(results);

      // 3. Isi Data Metadata Bagian Atas
      const year = new Date(inspection.tanggal_inspeksi).getFullYear();

      sheet.getCell('A7').value = '';
      sheet.getCell('A8').value = '';

      sheet.getCell('D1').value = 'LABORATORIUM/BENGKEL ' + (inspection.nama_lab || '').toUpperCase();
      sheet.getCell('A5').value = 'Tahun ' + year;
      sheet.getCell('A7').value = 'Nama alat : ' + inspection.nama_barang + (inspection.kode_barang ? ' (' + inspection.kode_barang + ')' : '');
      sheet.getCell('A8').value = 'Pembuat alat : ' + (inspection.pembuat_alat || '-');
      if (inspection.tanggal_pembelian) {
        sheet.getCell('G8').value = 'Tanggal Pembelian : ' + formatDate(inspection.tanggal_pembelian);
      }
      if (inspection.lokasi) {
        const m = inspection.lokasi.match(/Gedung\s+(\S+)\s+Lantai\s+(\d+)(?:\s+Ruang\s+(.+))?/i);
        if (m) {
          sheet.getCell('S7').value = 'Gedung: ' + m[1];
          sheet.getCell('S8').value = 'Lantai   : ' + m[2];
          if (m[3]) {
            sheet.getCell('S6').value = 'Ruang: ' + m[3].trim();
          }
        }
      }
      // =====================
      // Header Bulan
      // =====================

      for (let c = 9; c <= 24; c++) {

        try {
          sheet.unMergeCells(
            sheet.getCell(9, c).address +
            ":" +
            sheet.getCell(9, Math.min(c + 3, 24)).address
          );
        } catch (e) { }

      }

      for (let c = 9; c <= 24; c++) {

        try {
          sheet.unMergeCells(
            sheet.getCell(10, c).address +
            ":" +
            sheet.getCell(10, Math.min(c + 1, 24)).address
          );
        } catch (e) { }

      }

      // Bersihkan dulu seluruh header bulan
      for (let c = 9; c <= 24; c++) {
        sheet.getCell(9, c).value = null;
        sheet.getCell(10, c).value = null;
      }

      // Baru isi ulang
      for (let m = 0; m < MONTH_COLS.length; m++) {

        const bCol = MONTH_COLS[m].b;
        const kCol = MONTH_COLS[m].k;

        sheet.getCell(9, bCol).value = `Bulan ke-${m + 1}`;

        sheet.mergeCells(
          sheet.getCell(9, bCol).address +
          ":" +
          sheet.getCell(9, kCol).address
        );

        sheet.getCell(10, bCol).value = "B";
        sheet.getCell(10, kCol).value = "K";
      }
      if (i > 0) {

        sheet.addImage(logoId, {
          tl: { col: 1, row: 0.2 },
          ext: {
            width: 60,
            height: 70
          }
        });

      }

      // 4. Hitung Kebutuhan Baris Dinamis
      let totalDataRowsNeeded = 0;
      catsArray.forEach(cat => {
        totalDataRowsNeeded += 1;
        totalDataRowsNeeded += cat.subitems.size;
      });

      const TEMPLATE_DATA_ROWS = 31; // Baris 11 sampai 41 di template

      if (totalDataRowsNeeded < TEMPLATE_DATA_ROWS) {
        const rowsToDelete = TEMPLATE_DATA_ROWS - totalDataRowsNeeded;
        sheet.spliceRows(11 + totalDataRowsNeeded, rowsToDelete);
      } else if (totalDataRowsNeeded > TEMPLATE_DATA_ROWS) {
        const rowsToInsert = totalDataRowsNeeded - TEMPLATE_DATA_ROWS;
        for (let i = 0; i < rowsToInsert; i++) {
          sheet.insertRow(41, []);
        }
      }

      // 5. Inject Data Kategori dan Subitem ke Excel
      const lastFooterRow = 12 + totalDataRowsNeeded + 14; // NIP row
      for (let r = 11; r <= Math.min(lastFooterRow, sheet.rowCount); r++) {
        try { sheet.unMergeCells(`A${r}:H${r}`); } catch (e) { }
        try { sheet.unMergeCells(`A${r}:X${r}`); } catch (e) { }
      }

      let currentRowNum = 11;

      // Gunakan fungsi pembuat objek baru agar style tidak saling menular (Bug Hijau/Abu-abu beres)
      const getThinBorder = () => ({
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } }
      });

      for (const cat of catsArray) {
        const catRow = sheet.getRow(currentRowNum);
        catRow.height = 20;

        try {
          sheet.unMergeCells(`A${currentRowNum}:H${currentRowNum}`);
        } catch (e) { }

        try {
          sheet.unMergeCells(`A${currentRowNum}:X${currentRowNum}`);
        } catch (e) { }

        const catCell = sheet.getCell(`A${currentRowNum}`);
        catCell.value = cat.nama_kategori;
        catCell.style = {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } },
          font: { bold: true, size: 11, name: 'Calibri', color: { argb: 'FF000000' } },
          alignment: { horizontal: 'left', vertical: 'center' },
          border: getThinBorder()
        };

        sheet.mergeCells(`A${currentRowNum}:X${currentRowNum}`);

        currentRowNum++;

        const subitems = Array.from(cat.subitems.values()).sort((a, b) => a.urutan - b.urutan);
        for (const sub of subitems) {
          const subRow = sheet.getRow(currentRowNum);
          subRow.height = 28.5;

          for (let c = 1; c <= 24; c++) {
            const cell = subRow.getCell(c);
            cell.style = {
              fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
              font: { bold: false, size: 11, name: 'Calibri', color: { argb: 'FF000000' } },
              alignment: { horizontal: 'center', vertical: 'center' },
              border: getThinBorder()
            };
          }

          try { sheet.unMergeCells(`A${currentRowNum}:H${currentRowNum}`); } catch (e) { }
          sheet.mergeCells(`A${currentRowNum}:H${currentRowNum}`);
          const descCell = subRow.getCell(1);
          descCell.value = sub.nama_subitem;
          descCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };

          for (let m = 0; m < MONTH_COLS.length; m++) {
            const bulanKe = m + 1;
            const status = sub.months[bulanKe] || '';
            const bCol = MONTH_COLS[m].b;
            const kCol = MONTH_COLS[m].k;

            if (status === 'B') {
              const bCell = subRow.getCell(bCol);
              bCell.value = '\u2713';
              bCell.font = { size: 14, name: 'Calibri', bold: true, color: { argb: 'FF008000' } };
            } else if (status === 'K') {
              const kCell = subRow.getCell(kCol);
              kCell.value = '\u2717';
              kCell.font = { size: 14, name: 'Calibri', bold: true, color: { argb: 'FFFF0000' } };
            }
          }
          currentRowNum++;
        }
      }
      // 6. Hitung Posisi Footer Dinamis
      // Template asli: data rows 11-41, Tgl di row 43 (2 baris setelah data terakhir)
      const tglInspeksiRow = 12 + totalDataRowsNeeded;
      const inspectorNameRow = tglInspeksiRow + 1;
      const keteranganRow = tglInspeksiRow + 2;
      const legendRow1 = tglInspeksiRow + 3;   // B - Baik
      const legendRow2 = tglInspeksiRow + 4;   // K - Kurang
      const noteRow = tglInspeksiRow + 6;      // Berikan tanda check
      const headerRow = tglInspeksiRow + 8;    // Kepala Lab / PLP 1 / PLP 2
      const kalabNameRow = tglInspeksiRow + 13;
      const kalabNipRow = tglInspeksiRow + 14;

      // Bersihkan merge lama area footer
      try { sheet.unMergeCells(`A${tglInspeksiRow}:H${tglInspeksiRow}`); } catch (e) { }
      try { sheet.unMergeCells(`A${inspectorNameRow}:H${inspectorNameRow}`); } catch (e) { }
      sheet.mergeCells(`A${tglInspeksiRow}:H${tglInspeksiRow}`);
      sheet.mergeCells(`A${inspectorNameRow}:H${inspectorNameRow}`);

      // Set Nilai & Style Tgl Inspeksi
      const tglCell = sheet.getCell(`A${tglInspeksiRow}`);
      tglCell.value = 'Tgl Inspeksi      : ' + formatDate(inspection.tanggal_inspeksi);
      tglCell.font = { name: 'Calibri', size: 11, bold: false, color: { argb: 'FF000000' } };
      tglCell.fill = { type: 'pattern', pattern: 'none' };
      tglCell.alignment = { horizontal: 'left', vertical: 'center' };

      // Set Nilai & Style Pemeriksa
      const insCell = sheet.getCell(`A${inspectorNameRow}`);
      insCell.value = 'Diinspeksi oleh: ' + (inspection.inspector_name || '-');
      insCell.font = { name: 'Calibri', size: 11, bold: false, color: { argb: 'FF000000' } };
      insCell.fill = { type: 'pattern', pattern: 'none' };
      insCell.alignment = { horizontal: 'left', vertical: 'center' };

      // Border kanan kolom X baris 6-10 (Ruang, Gedung, Lantai, header)
      for (let r = 6; r <= 10; r++) {
        sheet.getCell(r, 24).border = { right: { style: 'thin', color: { argb: 'FF000000' } } };
      }
      // Border kolom U-X baris 9-10
      const thin = { style: 'thin', color: { argb: 'FF000000' } };
      const bdr = { left: thin, right: thin, top: thin, bottom: thin };
      for (let c = 21; c <= 24; c++) {
        sheet.getCell(9, c).border = bdr;
        sheet.getCell(10, c).border = bdr;
      }

      // Tulis Nama & NIP Kepala Laboratorium
      if (inspection.penanggung_jawab) {
        const nameCell = sheet.getCell(`A${kalabNameRow}`);
        nameCell.value = inspection.penanggung_jawab;
        nameCell.font = {
          name: 'Calibri', size: 11, bold: true, underline: true, color: { argb: 'FF000000' }
        };
      }
      if (lab.plp1_name) {
        sheet.getCell(`G${kalabNameRow}`).value = lab.plp1_name;

        sheet.getCell(`G${kalabNameRow}`).font = {
          name: "Calibri",
          size: 11,
          bold: true,
          underline: true,
          color: { argb: "FF000000" }
        };

        sheet.getCell(`G${kalabNipRow}`).value =
          `NIP. ${lab.plp1_nip || "-"}`;
      }

      if (lab.plp2_name) {
        sheet.getCell(`P${kalabNameRow}`).value = lab.plp2_name;

        sheet.getCell(`P${kalabNameRow}`).font = {
          name: "Calibri",
          size: 11,
          bold: true,
          underline: true,
          color: { argb: "FF000000" }
        };

        sheet.getCell(`P${kalabNipRow}`).value =
          `NIP. ${lab.plp2_nip || "-"}`;
      }
      if (inspection.nip) {
        const nipCell = sheet.getCell(`A${kalabNipRow}`);
        nipCell.value = `NIP. ${inspection.nip}`;
        nipCell.font = {
          name: 'Calibri', size: 11, bold: false, color: { argb: 'FF000000' }
        };
      }

      // =============================
      // FOTO INSPEKSI
      // =============================

      if (inspection.foto) {

        const fotoPath = path.join(
          __dirname,
          "../../",
          inspection.foto.replace(/^\//, "")
        );

        if (fs.existsSync(fotoPath)) {

          const ext = path.extname(fotoPath)
            .replace(".", "")
            .toLowerCase();

          const imageId = workbook.addImage({
            filename: fotoPath,
            extension: ext
          });

          sheet.addImage(imageId, {
            tl: { col: 24, row: 6 },
            ext: {
              width: 240,
              height: 180
            }
          });

        } else {

          console.log("Foto tidak ditemukan");

        }

      }
    }

    // Download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Export_${lab.nama_lab}.xlsx"`
    );
    await workbook.xlsx.write(res);
    console.log("STEP 4 - Selesai");
    res.end();


  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

module.exports = { exportInspection, exportAllCompleted, checkLabInspectionsStatus, exportLabItems };
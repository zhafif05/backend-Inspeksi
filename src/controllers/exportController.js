  const ExcelJS = require('exceljs');
  const pool = require('../config/database');
  const path = require('path');
  const fs = require('fs');
  const JSZip = require('jszip');

  const TEMPLATE_PATH = path.join(__dirname, '../../TEMPLATE INSPEKSI ALAT LAB_BENGKEL PPNS_Z.xlsx');
  const DAMAGED_EQUIPMENT_TEMPLATE_PATH = path.join(__dirname, '../../DRAFT LAPORAN PERALATAN RUSAK LAB DAN BENGKEL.docx');
  const DOCX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  const MONTH_COLS = [
    { b: 9, k: 10 },  // Jan
    { b: 11, k: 12 },  // Feb
    { b: 13, k: 14 },  // Mar
    { b: 15, k: 16 },  // Apr
    { b: 17, k: 18 },  // Mei
    { b: 19, k: 20 }   // Jun
  ];

  function formatDate(d) {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  function escapeXml(value) {
    return String(value ?? '')
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  function normalizeSemester(value) {
    return String(value || '').trim().toUpperCase();
  }

  function isDamagedByHalfOrMore(totalResults, damagedResults) {
    return Number(totalResults) > 0 && Number(damagedResults) / Number(totalResults) >= 0.5;
  }

  function parseItemIds(itemIds) {
    return itemIds
      ? itemIds.split(',').map(id => Number(id.trim())).filter(Boolean)
      : [];
  }

  const sizeOf = require('image-size');

function calculateImageDimensionsEMU(absolutePath, maxWidthEMU = 1828800, maxHeightEMU = 1371600) {
  // maxWidth 2 inch, maxHeight 1.5 inch (sesuaikan sama lebar kolom foto di tabel)
  try {
    const dimensions = sizeOf(absolutePath);
    const aspectRatio = dimensions.width / dimensions.height;

    let width = maxWidthEMU;
    let height = Math.round(width / aspectRatio);

    if (height > maxHeightEMU) {
      height = maxHeightEMU;
      width = Math.round(height * aspectRatio);
    }

    return { width, height };
  } catch (e) {
    return { width: maxWidthEMU, height: maxHeightEMU };
  }
}

  function resolveUploadPath(filePath) {
    if (!filePath) return null;
    const normalized = String(filePath).replace(/\\/g, '/').replace(/^\//, '');
    const absolute = path.isAbsolute(normalized)
      ? normalized
      : path.join(__dirname, '../../', normalized);
    return fs.existsSync(absolute) ? absolute : null;
  }

  function docParagraph(text, options = {}) {
    const bold = options.bold ? '<w:b/>' : '';
    const align = options.align ? `<w:jc w:val="${options.align}"/>` : '';
    const spacing = options.spacingAfter ? `<w:spacing w:after="${options.spacingAfter}"/>` : '';
    const size = options.size ? `<w:sz w:val="${options.size}"/><w:szCs w:val="${options.size}"/>` : '';
    return `
      <w:p>
        <w:pPr>${align}${spacing}</w:pPr>
        <w:r>
          <w:rPr>${bold}${size}</w:rPr>
          <w:t xml:space="preserve">${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`;
  }

  function docCell(content, options = {}) {
    const width = options.width ? `<w:tcW w:w="${options.width}" w:type="dxa"/>` : '';
    const shade = options.shade ? `<w:shd w:fill="${options.shade}"/>` : '';
    const body = Array.isArray(content) ? content.join('') : docParagraph(content || '-', { size: 18 });
    return `<w:tc><w:tcPr>${width}${shade}</w:tcPr>${body}</w:tc>`;
  }

  function docTable(headers, rows) {
    const headerRow = `<w:tr>${headers.map(h => docCell(h, { shade: 'D9EAF7' })).join('')}</w:tr>`;
    const dataRows = rows.map(row => `<w:tr>${row.map(cell => docCell(cell)).join('')}</w:tr>`).join('');
    return `
      <w:tbl>
        <w:tblPr>
          <w:tblW w:w="0" w:type="auto"/>
          <w:tblBorders>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/>
            <w:insideV w:val="single" w:sz="4" w:space="0" w:color="000000"/>
          </w:tblBorders>
        </w:tblPr>
        ${headerRow}
        ${dataRows}
      </w:tbl>`;
  }

  function pageBreak() {
    return '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
  }

  function ensureImageContentTypes(contentTypesXml) {
    let xml = contentTypesXml;
    if (!xml.includes('Extension="png"')) {
      xml = xml.replace('</Types>', '<Default Extension="png" ContentType="image/png"/></Types>');
    }
    if (!xml.includes('Extension="jpg"')) {
      xml = xml.replace('</Types>', '<Default Extension="jpg" ContentType="image/jpeg"/></Types>');
    }
    if (!xml.includes('Extension="jpeg"')) {
      xml = xml.replace('</Types>', '<Default Extension="jpeg" ContentType="image/jpeg"/></Types>');
    }
    return xml;
  }

  function ensureDocumentNamespaces(documentXml) {
    const namespaces = [
      ['a', 'http://schemas.openxmlformats.org/drawingml/2006/main'],
      ['pic', 'http://schemas.openxmlformats.org/drawingml/2006/picture'],
      ['wp', 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing'],
      ['r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships']
    ];
    const rootMatch = documentXml.match(/<w:document\b[^>]*>/);
    const rootTag = rootMatch ? rootMatch[0] : '';

    return namespaces.reduce((xml, [prefix, uri]) => {
      if (rootTag.includes(`xmlns:${prefix}=`)) {
        return xml;
      }

      return xml.replace('<w:document ', `<w:document xmlns:${prefix}="${uri}" `);
    }, documentXml);
  }

  function imageParagraph(relId, docPrId, widthEMU, heightEMU) {
    return `
      <w:p>
        <w:pPr><w:jc w:val="center"/></w:pPr>
        <w:r>
          <w:drawing>
            <wp:inline xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" distT="0" distB="0" distL="0" distR="0">
              <wp:extent cx="${widthEMU}" cy="${heightEMU}"/>
              <wp:effectExtent l="0" t="0" r="0" b="0"/>
              <wp:docPr id="${docPrId}" name="Foto Kerusakan ${docPrId}"/>
              <wp:cNvGraphicFramePr>
                <a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/>
              </wp:cNvGraphicFramePr>
              <a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
                <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                  <pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:nvPicPr>
                      <pic:cNvPr id="0" name="Foto Kerusakan"/>
                      <pic:cNvPicPr/>
                    </pic:nvPicPr>
                    <pic:blipFill>
                      <a:blip r:embed="${relId}"/>
                      <a:stretch><a:fillRect/></a:stretch>
                    </pic:blipFill>
                    <pic:spPr>
                      <a:xfrm>
                        <a:off x="0" y="0"/>
                        <a:ext cx="914400" cy="685800"/>
                      </a:xfrm>
                      <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                    </pic:spPr>
                  </pic:pic>
                </a:graphicData>
              </a:graphic>
            </wp:inline>
          </w:drawing>
        </w:r>
      </w:p>`;
  }

function addImageToDocx(zip, imageState, filePath) {
  const absolutePath = resolveUploadPath(filePath);
  if (!absolutePath) {
    return plainCellParagraph('-');
  }

  const ext = path.extname(absolutePath).replace('.', '').toLowerCase();
  if (!['jpg', 'jpeg', 'png'].includes(ext)) {
    return plainCellParagraph('-');
  }

  // Hitung dimensi gambar dengan fungsi baru
  const { width, height } = calculateImageDimensionsEMU(absolutePath);

  const imageIndex = imageState.nextImageIndex++;
  const relId = `rIdDamage${imageIndex}`;
  const mediaExt = ext === 'jpg' ? 'jpeg' : ext;
  const mediaName = `damage-${imageIndex}.${mediaExt}`;

  zip.file(`word/media/${mediaName}`, fs.readFileSync(absolutePath));
  imageState.relsXml = imageState.relsXml.replace(
    '</Relationships>',
    `<Relationship Id="${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${mediaName}"/></Relationships>`
  );

  // Panggil imageParagraph dengan dimensi yang sudah dihitung
  return imageParagraph(relId, 2000 + imageIndex, width, height);
}

  function replaceText(xml, search, replacement) {
    return xml.split(search).join(escapeXml(replacement));
  }

  function replaceFirst(xml, search, replacement) {
    return xml.replace(search, escapeXml(replacement));
  }

  function clearFirst(xml, search) {
    return xml.replace(search, '');
  }

  function clearFirstTextRun(xml, text) {
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return xml.replace(new RegExp(`<w:t([^>]*)>${escaped}</w:t>`), '<w:t$1></w:t>');
  }

  function plainCellParagraph(text) {
    return `
      <w:p>
        <w:pPr>
          <w:spacing w:after="0" w:line="240" w:lineRule="auto"/>
          <w:rPr>
            <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
            <w:sz w:val="20"/><w:szCs w:val="20"/>
          </w:rPr>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
            <w:sz w:val="20"/><w:szCs w:val="20"/>
          </w:rPr>
          <w:t xml:space="preserve">${escapeXml(text || '-')}</w:t>
        </w:r>
      </w:p>`;
  }

  function setCellContent(cellXml, value) {
    const tcPrMatch = cellXml.match(/<w:tcPr[\s\S]*?<\/w:tcPr>/);
    const tcPr = tcPrMatch ? tcPrMatch[0] : '<w:tcPr/>';
    const body = Array.isArray(value) ? value.join('') : plainCellParagraph(value);
    return `<w:tc>${tcPr}${body}</w:tc>`;
  }

  function replaceRowCellBlock(rowXml, cellsXml) {
    const firstCellStart = rowXml.indexOf('<w:tc');
    const lastCellEnd = rowXml.lastIndexOf('</w:tc>');

    if (firstCellStart === -1 || lastCellEnd === -1) {
      return rowXml;
    }

    return `${rowXml.slice(0, firstCellStart)}${cellsXml}${rowXml.slice(lastCellEnd + '</w:tc>'.length)}`;
  }

  function buildTemplateTableRows(tableXml, rows) {
    const rowMatches = tableXml.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];
    if (rowMatches.length < 2) {
      return tableXml;
    }

    const headerRow = rowMatches[0];
    const dataTemplateRow = rowMatches[1];
    const cellTemplateMatches = dataTemplateRow.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];

    const dataRows = rows.map(row => {
      const cells = row.map((value, index) => {
        const templateCell = cellTemplateMatches[index] || '<w:tc><w:tcPr/></w:tc>';
        return setCellContent(templateCell, value);
      }).join('');

      return replaceRowCellBlock(dataTemplateRow, cells);
    }).join('');

    return tableXml.replace(rowMatches.join(''), `${headerRow}${dataRows}`);
  }

  function replaceRowCells(rowXml, values) {
    const cells = rowXml.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
    if (cells.length === 0) {
      return rowXml;
    }

    const nextCells = cells.map((cell, index) => setCellContent(cell, values[index] || '')).join('');
    return replaceRowCellBlock(rowXml, nextCells);
  }

function forceReportSectionToNewPage(body) {
  const marker = '<w:t>LAPORAN PER SEMESTER P</w:t>';
  const markerIndex = body.indexOf(marker);
  if (markerIndex === -1) {
    return body;
  }

  // HAPUS page break SEBELUM marker, bukan TAMBAH page break
  // Cari tag pembuka <w:p ...> yang mengandung marker
  const paragraphOpenRegex = /<w:p(?=[\s/>])/g;
  let paragraphStart = -1;
  let match;
  while ((match = paragraphOpenRegex.exec(body)) !== null) {
    if (match.index >= markerIndex) break;
    paragraphStart = match.index;
  }

  if (paragraphStart === -1) {
    return body;
  }

  // Cek apakah ada page break sebelum paragraf ini
  const beforeParagraph = body.slice(0, paragraphStart);
  const pageBreakRegex = /<w:br\s+w:type="page"\s*\/>/g;
  let lastPageBreak = -1;
  let pageBreakMatch;
  while ((pageBreakMatch = pageBreakRegex.exec(beforeParagraph)) !== null) {
    lastPageBreak = pageBreakMatch.index;
  }

  // Jika ada page break, hapus
  if (lastPageBreak !== -1) {
    // Cari tag pembuka w:p yang mengandung page break
    const pageBreakStart = beforeParagraph.lastIndexOf('<w:p', lastPageBreak);
    const pageBreakEnd = beforeParagraph.indexOf('</w:p>', lastPageBreak) + 6;
    if (pageBreakStart !== -1 && pageBreakEnd !== -1) {
      // Hapus seluruh paragraf yang berisi page break
      return body.slice(0, pageBreakStart) + body.slice(pageBreakEnd);
    }
  }

  return body;
}

  function replaceRowCellAt(rowXml, cellIndex, value) {
    const cells = rowXml.match(/<w:tc[\s\S]*?<\/w:tc>/g) || [];
    if (cells.length === 0 || !cells[cellIndex]) {
      return rowXml;
    }
    const nextCells = cells.map((cell, index) =>
      index === cellIndex ? setCellContent(cell, value) : cell
    ).join('');
    return replaceRowCellBlock(rowXml, nextCells);
  }

function replaceFooterSignatureBlock(body, lab) {
  const tables = body.match(/<w:tbl>[\s\S]*?<\/w:tbl>/g) || [];
  if (tables.length < 2) {
    return body;
  }

  const footerTable = tables[1];
  let rows = footerTable.match(/<w:tr[\s\S]*?<\/w:tr>/g) || [];

  if (rows.length === 0) {
    return body;
  }

  // Buat footer baru dengan format yang benar
  const tanggal = formatDate(new Date());
  const namaLab = escapeXml(lab.nama_lab || '-');
  const kalabName = escapeXml(lab.kalab_name || '-');
  const kalabNip = escapeXml(lab.kalab_nip || '-');

  // Buat row baru dengan 2 kolom (50%-50%)
  const newRows = [
    // Baris 1: Tanggal (kanan, bold)
    `<w:tr>
      <w:tc><w:tcPr><w:tcW w:w="50%" w:type="pct"/></w:tcPr><w:p><w:r><w:t/></w:r></w:p></w:tc>
      <w:tc><w:tcPr><w:tcW w:w="50%" w:type="pct"/><w:jc w:val="right"/></w:tcPr>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${tanggal}</w:t></w:r>
      </w:p></w:tc>
    </w:tr>`,
    
    // Baris 2: Mengetahui, (kiri) | Menyetujui, (kanan, bold)
    `<w:tr>
      <w:tc><w:tcPr><w:tcW w:w="50%" w:type="pct"/></w:tcPr>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Mengetahui,</w:t></w:r>
      </w:p></w:tc>
      <w:tc><w:tcPr><w:tcW w:w="50%" w:type="pct"/><w:jc w:val="right"/></w:tcPr>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Menyetujui,</w:t></w:r>
      </w:p></w:tc>
    </w:tr>`,
    
    // Baris 3: Ketua Jurusan (kiri) | Kepala Lab (kanan, bold)
    `<w:tr>
      <w:tc><w:tcPr><w:tcW w:w="50%" w:type="pct"/></w:tcPr>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Ketua Jurusan                </w:t></w:r>
      </w:p></w:tc>
      <w:tc><w:tcPr><w:tcW w:w="50%" w:type="pct"/><w:jc w:val="right"/></w:tcPr>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Kepala Lab./Bengkel ${namaLab}</w:t></w:r>
      </w:p></w:tc>
    </w:tr>`,
    
    `<w:tr>
      <w:tc><w:tcPr><w:tcW w:w="50%" w:type="pct"/></w:tcPr><w:p><w:r><w:t/></w:r></w:p></w:tc>
      <w:tc><w:tcPr><w:tcW w:w="50%" w:type="pct"/><w:jc w:val="right"/></w:tcPr><w:p><w:r><w:t/></w:r></w:p></w:tc>
    </w:tr>`,
    
    
    // Baris 4: Kosong
    `<w:tr>
      <w:tc><w:tcPr><w:tcW w:w="50%" w:type="pct"/></w:tcPr><w:p><w:r><w:t/></w:r></w:p></w:tc>
      <w:tc><w:tcPr><w:tcW w:w="50%" w:type="pct"/><w:jc w:val="right"/></w:tcPr><w:p><w:r><w:t/></w:r></w:p></w:tc>
    </w:tr>`,
    
    // Baris 5: Nama (underline)
    `<w:tr>
      <w:tc><w:tcPr><w:tcW w:w="50%" w:type="pct"/></w:tcPr>
        <w:p><w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>(                                      )</w:t></w:r>
      </w:p></w:tc>
      <w:tc><w:tcPr><w:tcW w:w="50%" w:type="pct"/><w:jc w:val="right"/></w:tcPr>
        <w:p><w:r><w:rPr><w:b/><w:u w:val="single"/></w:rPr><w:t>${kalabName}</w:t></w:r>
      </w:p></w:tc>
    </w:tr>`,
    
    // Baris 6: NIP
    `<w:tr>
      <w:tc><w:tcPr><w:tcW w:w="50%" w:type="pct"/></w:tcPr>
        <w:p><w:r><w:rPr><w:u w:val="single"/></w:rPr><w:t>NIP                                      </w:t></w:r>
      </w:p></w:tc>
      <w:tc><w:tcPr><w:tcW w:w="50%" w:type="pct"/><w:jc w:val="right"/></w:tcPr>
        <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>NIP. ${kalabNip}</w:t></w:r>
      </w:p></w:tc>
    </w:tr>`
  ];

  // Ganti seluruh isi tabel footer
  const newFooterTable = footerTable.replace(
    rows.join(''),
    newRows.join('')
  );

  return body.replace(footerTable, newFooterTable);
}

function removeInitialPageBreaks(body) {
  // Hapus semua page break di awal dokumen
  let cleaned = body;
  
  // Hapus page break yang berdiri sendiri di awal
  cleaned = cleaned.replace(/^(?:\s*<w:p>\s*<w:r>\s*<w:br\s+w:type="page"\s*\/>\s*<\/w:r>\s*<\/w:p>\s*)+/, '');
  
  // Hapus page break dalam paragraf kosong
  cleaned = cleaned.replace(/<w:p>\s*<w:r>\s*<w:br\s+w:type="page"\s*\/>\s*<\/w:r>\s*<\/w:p>/g, '');
  
  return cleaned;
}


function removeExtraPageBreaks(body) {
  // Hapus page break ganda (lebih dari 1 berturut-turut)
  let cleaned = body;
  
  // Hapus page break yang berurutan
  cleaned = cleaned.replace(/(<w:p>\s*<w:r>\s*<w:br\s+w:type="page"\s*\/>\s*<\/w:r>\s*<\/w:p>\s*){2,}/g, (match) => {
    // Ambil hanya satu page break
    const singlePageBreak = match.match(/<w:p>\s*<w:r>\s*<w:br\s+w:type="page"\s*\/>\s*<\/w:r>\s*<\/w:p>/);
    return singlePageBreak ? singlePageBreak[0] : '';
  });
  
  return cleaned;
}

function fillDamagedEquipmentTemplateBody(bodyTemplate, lab, damagedItems, tahun, semester, zip, imageState, skipHeader = false) {
  const staff = [lab.plp_name, lab.teknisi_name].filter(Boolean).join(' / ') || '-';
  const rows = damagedItems.map((item, itemIndex) => {
    const damageReport = item.damageReport || {};
    const photoXml = addImageToDocx(zip, imageState, damageReport.foto);

    return [
      String(itemIndex + 1),
      item.inspection.nama_barang || '-',
      item.inspection.kode_barang || '-',
      formatDate(damageReport.tanggal_ditemukan || item.stats.first_damage_date || item.inspection.tanggal_inspeksi),
      damageReport.kondisi_kerusakan || '-',
      damageReport.penyebab_kerusakan || '-',
      damageReport.status_peralatan || '-',
      damageReport.perbaikan_upt || '-',
      damageReport.perbaikan_pihak_ketiga || '-',
      [photoXml]
    ];
  });

  let body = bodyTemplate;
  
  // HAPUS page break yang tidak perlu di awal
  body = removeInitialPageBreaks(body);
  
  // HAPUS page break sebelum marker LAPORAN PER SEMESTER
  body = forceReportSectionToNewPage(body);
  
  // =============================================
  // ISI DATA (HANYA jika skipHeader = false)
  // =============================================
  if (!skipHeader) {
    // Hanya halaman PERTAMA yang mengisi header lengkap
    body = replaceText(body, 'NAMA BENGKEL/LABORATORIUM: (tulis nama lab/bengkel)', `NAMA BENGKEL/LABORATORIUM:`);
    body = replaceText(body, 'NAMA KALAB/KABENG  :', `NAMA KALAB/KABENG  :  `);
    body = replaceText(body, 'NAMA TEKNISI/ PLP :', `NAMA TEKNISI/ PLP : `);
    body = replaceText(body, 'PERIODE PELAPORAN: SEMESTER GENAP 2024/2025', `PERIODE PELAPORAN: SEMESTER ${semester} ${tahun}`);
    body = replaceText(body, 'Nama Lab./Bengkel', lab.nama_lab || '-');
    body = replaceFirst(body, 'Ganjil/Genap Tahun 20', `${semester} Tahun ${tahun}`);
    body = clearFirstTextRun(body, 'XX');
    body = clearFirstTextRun(body, '/2');
    body = clearFirstTextRun(body, '0');
    body = clearFirstTextRun(body, 'XX');
    body = replaceText(body, 'Surabaya, XX-XX-20XX', `Surabaya, ${formatDate(new Date())}`);
  }
  
  // =============================================
  // ISI UNIT KERJA DAN SEMESTER (SELALU diisi)
  // =============================================
  // Unit Kerja : Nama Lab./Bengkel -> ganti dengan lab saat ini
  body = replaceText(body, 'Unit Kerja : Nama Lab./Bengkel', `Unit Kerja : ${lab.nama_lab || '-'}`);
  
  // Semester : Ganjil/Genap Tahun 20XX/20XX -> ganti dengan semester dan tahun
  body = replaceText(body, 'Semester : Ganjil/Genap Tahun 20XX/20XX', `Semester : ${semester} Tahun ${tahun}`);
  
  // Juga handle format alternatif
  body = replaceText(body, 'Unit Kerja : COBA', `Unit Kerja : ${lab.nama_lab || '-'}`);
  body = replaceText(body, 'Semester : GENAP Tahun 2026', `Semester : ${semester} Tahun ${tahun}`);
  
  // Footer - selalu diisi
  body = replaceFooterSignatureBlock(body, lab);

  // Isi tabel data - selalu diisi
  const firstTableMatch = body.match(/<w:tbl>[\s\S]*?<\/w:tbl>/);
  if (firstTableMatch) {
    body = body.replace(firstTableMatch[0], buildTemplateTableRows(firstTableMatch[0], rows));
  }

  return body;
}

  function joinDistinct(values) {
    const list = values.filter(Boolean).map(String);
    return [...new Set(list)].join('; ') || '-';
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
                plp.name AS plp_name, plp.nip AS plp_nip,
                teknisi.name AS teknisi_name, teknisi.nip AS teknisi_nip,
                it.nama_barang, it.kode_barang, it.pembuat_alat, it.tanggal_pembelian
        FROM inspections i
        LEFT JOIN users u ON i.inspector_id = u.id
        LEFT JOIN laboratories l ON i.laboratory_id = l.id
        LEFT JOIN users kalab ON l.kalab_id = kalab.id
        LEFT JOIN users plp ON l.plp_id = plp.id
          LEFT JOIN users teknisi ON l.teknisi_id = teknisi.id
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
      if (inspection.plp_name) {
        sheet.getCell(`G${kalabNameRow}`).value = inspection.plp_name;

        sheet.getCell(`G${kalabNameRow}`).font = {
          name: "Calibri",
          size: 11,
          bold: true,
          underline: true,
          color: { argb: "FF000000" }
        };

        sheet.getCell(`G${kalabNipRow}`).value =
          `NIP. ${inspection.plp_nip || "-"}`;
      }

      if (inspection.teknisi_name) {
        sheet.getCell(`P${kalabNameRow}`).value = inspection.teknisi_name;

        sheet.getCell(`P${kalabNameRow}`).font = {
          name: "Calibri",
          size: 11,
          bold: true,
          underline: true,
          color: { argb: "FF000000" }
        };

        sheet.getCell(`P${kalabNipRow}`).value =
          `NIP. ${inspection.teknisi_nip || "-"}`;
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

          const imageId = wb.addImage({
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

            plp.name AS plp_name,
            plp.nip AS plp_nip,

            teknisi.name AS teknisi_name,
            teknisi.nip AS teknisi_nip

        FROM laboratories l

        LEFT JOIN users kalab
            ON l.kalab_id = kalab.id

        LEFT JOIN users plp
            ON l.plp_id = plp.id

        LEFT JOIN users teknisi
            ON l.teknisi_id = teknisi.id

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
        if (lab.plp_name) {
          sheet.getCell(`G${kalabNameRow}`).value = lab.plp_name;

          sheet.getCell(`G${kalabNameRow}`).font = {
            name: "Calibri",
            size: 11,
            bold: true,
            underline: true,
            color: { argb: "FF000000" }
          };

          sheet.getCell(`G${kalabNipRow}`).value =
            `NIP. ${lab.plp_nip || "-"}`;
        }

        if (lab.teknisi_name) {
          sheet.getCell(`P${kalabNameRow}`).value = lab.teknisi_name;

          sheet.getCell(`P${kalabNameRow}`).font = {
            name: "Calibri",
            size: 11,
            bold: true,
            underline: true,
            color: { argb: "FF000000" }
          };

          sheet.getCell(`P${kalabNipRow}`).value =
            `NIP. ${lab.teknisi_nip || "-"}`;
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
      res.end();


    } catch (err) {
      console.error(err);
      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  };

  async function getLaboratoryStaffColumns() {
    const [columns] = await pool.query('SHOW COLUMNS FROM laboratories');
    const names = new Set(columns.map(col => col.Field));

    return {
      kalab: names.has('kalab_id') ? 'kalab_id' : null,
      plp: names.has('plp_id') ? 'plp_id' : names.has('plp1_id') ? 'plp1_id' : null,
      teknisi: names.has('teknisi_id') ? 'teknisi_id' : names.has('plp2_id') ? 'plp2_id' : null
    };
  }

  async function getAllLaboratories() {
    const staffColumns = await getLaboratoryStaffColumns();
    const kalabJoin = staffColumns.kalab ? `LEFT JOIN users kalab ON l.${staffColumns.kalab} = kalab.id` : '';
    const plpJoin = staffColumns.plp ? `LEFT JOIN users plp ON l.${staffColumns.plp} = plp.id` : '';
    const teknisiJoin = staffColumns.teknisi ? `LEFT JOIN users teknisi ON l.${staffColumns.teknisi} = teknisi.id` : '';
    const kalabSelect = staffColumns.kalab ? 'kalab.name AS kalab_name, kalab.nip AS kalab_nip' : 'NULL AS kalab_name, NULL AS kalab_nip';
    const plpSelect = staffColumns.plp ? 'plp.name AS plp_name, plp.nip AS plp_nip' : 'NULL AS plp_name, NULL AS plp_nip';
    const teknisiSelect = staffColumns.teknisi ? 'teknisi.name AS teknisi_name, teknisi.nip AS teknisi_nip' : 'NULL AS teknisi_name, NULL AS teknisi_nip';

    const [labs] = await pool.query(
      `SELECT
        l.*,
        ${kalabSelect},
        ${plpSelect},
        ${teknisiSelect}
      FROM laboratories l
      ${kalabJoin}
      ${plpJoin}
      ${teknisiJoin}
      ORDER BY l.nama_lab ASC`
    );

    return labs;
  }

  async function getSemesterInspections(labId, itemIds, tahun, semester) {
    if (itemIds.length === 0) return [];

    const [inspections] = await pool.query(
      `SELECT
        i.id,
        i.laboratory_id,
        i.item_id,
        i.tahun,
        i.semester,
        i.tanggal_inspeksi,
        it.nama_barang,
        it.kode_barang
      FROM inspections i
      JOIN items it ON i.item_id = it.id
      WHERE i.laboratory_id = ?
        AND i.item_id IN (?)
        AND i.tahun = ?
        AND i.semester = ?
      ORDER BY it.nama_barang ASC`,
      [labId, itemIds, tahun, semester]
    );

    return inspections;
  }

  async function isLabSemesterComplete(lab, tahun, semester) {
    const itemIds = parseItemIds(lab.item_ids);
    if (itemIds.length === 0) {
      return { complete: false, inspections: [] };
    }

    const inspections = await getSemesterInspections(lab.id, itemIds, tahun, semester);
    const inspectedItemIds = new Set(inspections.map(inspection => Number(inspection.item_id)));
    const allItemsInspected = itemIds.every(itemId => inspectedItemIds.has(Number(itemId)));

    if (!allItemsInspected || inspections.length === 0) {
      return { complete: false, inspections: [] };
    }

    const inspectionIds = inspections.map(inspection => inspection.id);
    const [reviewRows] = await pool.query(
      `SELECT
        inspection_id,
        COUNT(DISTINCT bulan_ke) AS total_months,
        SUM(CASE WHEN review_status = 'APPROVED' THEN 1 ELSE 0 END) AS approved_months
      FROM inspection_monthly_reviews
      WHERE inspection_id IN (?)
        AND bulan_ke BETWEEN 1 AND 6
      GROUP BY inspection_id`,
      [inspectionIds]
    );

    const reviewMap = new Map(reviewRows.map(row => [Number(row.inspection_id), row]));
    const allReviewsApproved = inspectionIds.every(inspectionId => {
      const review = reviewMap.get(Number(inspectionId));
      return review && Number(review.total_months) === 6 && Number(review.approved_months) === 6;
    });

    return { complete: allReviewsApproved, inspections: allReviewsApproved ? inspections : [] };
  }

  async function getDamagedInspectionStats(inspectionIds) {
    if (inspectionIds.length === 0) return new Map();

    const [rows] = await pool.query(
      `SELECT
        inspection_id,
        COUNT(*) AS total_results,
        SUM(CASE WHEN status = 'K' THEN 1 ELSE 0 END) AS damaged_results,
        MIN(CASE WHEN status = 'K' THEN created_at ELSE NULL END) AS first_damage_date
      FROM inspection_results
      WHERE inspection_id IN (?)
      GROUP BY inspection_id`,
      [inspectionIds]
    );

    return new Map(rows.map(row => [Number(row.inspection_id), row]));
  }

  async function getDamageReportForInspection(inspectionId) {
    const [reports] = await pool.query(
      `SELECT dr.*, ir.created_at AS result_updated_at
      FROM inspection_damage_reports dr
      JOIN inspection_results ir ON dr.inspection_result_id = ir.id
      WHERE dr.inspection_id = ?
      ORDER BY dr.created_at ASC, dr.id ASC`,
      [inspectionId]
    );

    if (reports.length === 0) {
      return null;
    }

    const firstWithPhoto = reports.find(report => report.foto);
    const first = reports[0];

    return {
      tanggal_ditemukan: first.created_at || first.result_updated_at || null,
      kondisi_kerusakan: joinDistinct(reports.map(report => report.kondisi_kerusakan)),
      penyebab_kerusakan: joinDistinct(reports.map(report => report.penyebab_kerusakan)),
      status_peralatan: joinDistinct(reports.map(report => report.status_peralatan)),
      perbaikan_upt: joinDistinct(reports.map(report => report.perbaikan_upt)),
      perbaikan_pihak_ketiga: joinDistinct(reports.map(report => report.perbaikan_pihak_ketiga)),
      foto: firstWithPhoto ? firstWithPhoto.foto : null
    };
  }

  async function buildDamagedLabsData(tahun, semester) {
    const labs = await getAllLaboratories();
    const exportLabs = [];

    for (const lab of labs) {
      const { complete, inspections } = await isLabSemesterComplete(lab, tahun, semester);
      if (!complete) {
        continue;
      }

      const statsMap = await getDamagedInspectionStats(inspections.map(inspection => inspection.id));
      const damagedItems = [];

      for (const inspection of inspections) {
        const stats = statsMap.get(Number(inspection.id));
        if (!stats || !isDamagedByHalfOrMore(stats.total_results, stats.damaged_results)) {
          continue;
        }

        const damageReport = await getDamageReportForInspection(inspection.id);
        damagedItems.push({
          inspection,
          stats,
          damageReport
        });
      }

      if (damagedItems.length > 0) {
        exportLabs.push({ lab, damagedItems });
      }
    }

    return exportLabs;
  }

async function cloneTemplateWithDamagedEquipmentPages(labsData, tahun, semester) {
  const templateBuffer = fs.readFileSync(DAMAGED_EQUIPMENT_TEMPLATE_PATH);
  const zip = await JSZip.loadAsync(templateBuffer);
  const documentXml = await zip.file('word/document.xml').async('string');
  const contentTypesXml = await zip.file('[Content_Types].xml').async('string');
  const imageState = {
    relsXml: await zip.file('word/_rels/document.xml.rels').async('string'),
    nextImageIndex: 1
  };

  const bodyMatch = documentXml.match(/<w:body[\s\S]*?>([\s\S]*?)<\/w:body>/);
  const bodyContent = bodyMatch ? bodyMatch[1] : '';

  // Ambil sectPr
  const sectPrMatches = [...bodyContent.matchAll(/<w:sectPr[\s\S]*?<\/w:sectPr>/g)];
  const lastSectPrMatch = sectPrMatches.length > 0 ? sectPrMatches[sectPrMatches.length - 1] : null;
  const sectPr = lastSectPrMatch ? lastSectPrMatch[0] : '<w:sectPr/>';

  let bodyTemplate = lastSectPrMatch
    ? bodyContent.slice(0, lastSectPrMatch.index) +
      bodyContent.slice(lastSectPrMatch.index + lastSectPrMatch[0].length)
    : bodyContent;

  // =============================================
  // PISAHKAN HEADER (Logo + Nama Lab + dll)
  // =============================================
  
  // Cari marker "LAPORAN PER SEMESTER" untuk memisahkan header
  const marker = '<w:t>LAPORAN PER SEMESTER P</w:t>';
  const markerIndex = bodyTemplate.indexOf(marker);
  
  let headerTemplate = '';
  let bodyWithoutHeader = bodyTemplate;
  
  if (markerIndex !== -1) {
    // Cari paragraf yang mengandung marker
    const paragraphOpenRegex = /<w:p(?=[\s/>])/g;
    let paragraphStart = -1;
    let match;
    while ((match = paragraphOpenRegex.exec(bodyTemplate)) !== null) {
      if (match.index >= markerIndex) break;
      paragraphStart = match.index;
    }
    
    if (paragraphStart !== -1) {
      // Ambil header (sebelum paragraf LAPORAN PER SEMESTER)
      headerTemplate = bodyTemplate.slice(0, paragraphStart);
      // Body tanpa header (dari paragraf LAPORAN PER SEMESTER)
      bodyWithoutHeader = bodyTemplate.slice(paragraphStart);
    }
  }

  // =============================================
  // HAPUS LOGO DARI bodyWithoutHeader
  // =============================================
  // Cari dan hapus gambar (logo) dari bodyWithoutHeader
  // Pola: <w:p> yang mengandung <w:drawing> dengan gambar
  const logoRegex = /<w:p[\s\S]*?<w:drawing[\s\S]*?<wp:inline[\s\S]*?<a:blip[\s\S]*?r:embed="[^"]*"[\s\S]*?<\/a:blip>[\s\S]*?<\/wp:inline>[\s\S]*?<\/w:drawing>[\s\S]*?<\/w:p>/g;
  
  // Hapus semua gambar/logo dari bodyWithoutHeader
  bodyWithoutHeader = bodyWithoutHeader.replace(logoRegex, '');

  // Juga hapus paragraf kosong yang mungkin tersisa
  bodyWithoutHeader = bodyWithoutHeader.replace(/<w:p>\s*<\/w:p>/g, '');

  // =============================================
  // BUILD PAGES
  // =============================================
  const pages = labsData.map((entry, labIndex) => {
    let pageContent;
    
    if (labIndex === 0) {
      // Halaman PERTAMA: header + body (dengan logo)
      const fullTemplate = headerTemplate + bodyWithoutHeader;
      pageContent = fillDamagedEquipmentTemplateBody(
        fullTemplate,
        entry.lab,
        entry.damagedItems,
        tahun,
        semester,
        zip,
        imageState,
        false // skipHeader = false -> isi header lengkap
      );
    } else {
      // Halaman BERIKUTNYA: HANYA body (tanpa header, tanpa logo)
      pageContent = fillDamagedEquipmentTemplateBody(
        bodyWithoutHeader,
        entry.lab,
        entry.damagedItems,
        tahun,
        semester,
        zip,
        imageState,
        true // skipHeader = true -> hanya isi Unit Kerja dan Semester
      );
    }

    // Tambahkan page break antar lab
    return labIndex < labsData.length - 1
      ? `${pageContent}${pageBreak()}`
      : pageContent;
  }).join('');

  // =============================================
  // BUILD FINAL DOCUMENT
  // =============================================
  const nextDocumentXml = ensureDocumentNamespaces(documentXml.replace(
    /<w:body[\s\S]*?<\/w:body>/,
    `<w:body>${pages}${sectPr}</w:body>`
  ));
  
  zip.file('word/document.xml', nextDocumentXml);
  zip.file('word/_rels/document.xml.rels', imageState.relsXml);
  zip.file('[Content_Types].xml', ensureImageContentTypes(contentTypesXml));

  return zip.generateAsync({ type: 'nodebuffer' });
}

  const exportDamagedEquipmentReport = async (req, res, next) => {
    try {
      const { tahun, semester } = req.query;
      const normalizedSemester = normalizeSemester(semester);

      if (!tahun || !/^\d{4}$/.test(String(tahun)) || !['GANJIL', 'GENAP'].includes(normalizedSemester)) {
        return res.status(400).json({
          success: false,
          message: 'Query tahun dan semester wajib diisi. Semester harus GANJIL atau GENAP.'
        });
      }

      if (!fs.existsSync(DAMAGED_EQUIPMENT_TEMPLATE_PATH)) {
        return res.status(500).json({
          success: false,
          message: 'Template laporan peralatan rusak tidak ditemukan.'
        });
      }

      const labsData = await buildDamagedLabsData(Number(tahun), normalizedSemester);

      if (labsData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Tidak ada laboratorium yang memiliki alat rusak.'
        });
      }

      const buffer = await cloneTemplateWithDamagedEquipmentPages(labsData, Number(tahun), normalizedSemester);
      const filename = `Laporan_Peralatan_Rusak_${normalizedSemester}_${tahun}.docx`;

      res.setHeader('Content-Type', DOCX_CONTENT_TYPE);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      return res.send(buffer);
    } catch (err) {
      next(err);
    }
  };

  module.exports = {
    exportInspection,
    exportAllCompleted,
    checkLabInspectionsStatus,
    exportLabItems,
    exportDamagedEquipmentReport
  };

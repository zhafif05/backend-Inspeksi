const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

// ==================== CATEGORIES & SUBITEMS ====================

// Get all inspection categories with subitems
// ==================== INSPECTIONS WITH DETAILS ====================

const getUploadedFile = (req, fieldname) => {
  if (req.file && req.file.fieldname === fieldname) {
    return req.file;
  }
  if (Array.isArray(req.files)) {
    return req.files.find(file => file.fieldname === fieldname) || null;
  }
  if (req.files && Array.isArray(req.files[fieldname])) {
    return req.files[fieldname][0] || null;
  }
  return null;
};

const deleteUploadedFiles = (req) => {
  const files = [];
  if (req.file) {
    files.push(req.file);
  }
  if (Array.isArray(req.files)) {
    files.push(...req.files);
  } else if (req.files && typeof req.files === 'object') {
    Object.values(req.files).forEach(value => {
      if (Array.isArray(value)) {
        files.push(...value);
      }
    });
  }

  files.forEach(file => {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  });
};

// Create inspection with checklist results
const createInspectionWithChecklist = async (req, res, next) => {
  let connection;
  try {
    const { item_id, catatan } = req.body;
    let { checklist_results, results, damageReports } = req.body;
    if (!checklist_results && results) {
      checklist_results = results;
    }
    const inspectorId = req.user.id;
    const inspectionPhoto = getUploadedFile(req, 'foto');
    const foto = inspectionPhoto ? `/uploads/${inspectionPhoto.filename}` : null;

    let laboratory_id;
    if (req.user.role === 'admin') {
      if (!req.body.laboratory_id) {
        deleteUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Admin harus mengisi laboratory_id'
        });
      }
      laboratory_id = req.body.laboratory_id;
    } else {
      laboratory_id = req.body.laboratory_id || req.user.laboratory_id;
      if (!laboratory_id) {
        deleteUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Anda tidak terdaftar di laboratorium manapun'
        });
      }
      const [labCheck] = await pool.query(
        'SELECT id FROM laboratories WHERE id = ? AND kalab_id = ? OR plp_id = ? OR teknisi_id = ?',
        [laboratory_id, req.user.id, req.user.id, req.user.id]
      );
      if (labCheck.length === 0) {
        deleteUploadedFiles(req);
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses ke laboratorium ini'
        });
      }
    }

    // Parse checklist_results if it's a string (from form-data)
    if (typeof checklist_results === 'string') {
      try {
        checklist_results = JSON.parse(checklist_results);
      } catch (e) {
        deleteUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Format checklist_results JSON tidak valid'
        });
      }
    }

    // Parse damageReports if it's a string (from form-data)
    if (typeof damageReports === 'string') {
      try {
        damageReports = JSON.parse(damageReports);
      } catch (e) {
        deleteUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Format damageReports JSON tidak valid'
        });
      }
    }
    if (!damageReports || typeof damageReports !== 'object' || Array.isArray(damageReports)) {
      damageReports = {};
    }

    // Check if any category is PENDING or REJECTED
    const [nonApprovedCategories] = await pool.query(
      `SELECT COUNT(*) as count FROM inspection_categories
       WHERE item_id = ? AND status IN ('PENDING', 'REJECTED')`,
      [item_id]
    );
    if (Number(nonApprovedCategories[0].count) > 0) {
      deleteUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'Tidak dapat membuat inspeksi karena masih ada kategori yang PENDING atau REJECTED. Harap tunggu persetujuan admin.'
      });
    }

    // Validate required fields
    if (!item_id) {
      deleteUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'Field item_id harus diisi'
      });
    }

    // Determine tahun, semester, and tanggal_inspeksi
    const tanggal_inspeksi = req.body.tanggal_inspeksi ? new Date(req.body.tanggal_inspeksi) : new Date();
    const tahun = tanggal_inspeksi.getFullYear();
    const bulan = tanggal_inspeksi.getMonth() + 1;
    let semester = req.body.semester;
    if (!semester) {
      semester = bulan >= 2 && bulan <= 7 ? 'GENAP' : 'GANJIL';
    }
    let inspectionYear = req.body.tahun ? Number(req.body.tahun) : tahun;
    if (!req.body.tahun && !req.body.semester && bulan === 1) {
      semester = 'GANJIL';
      inspectionYear = tahun - 1;
    }

    // Check if inspection already exists for this item in this year+semester
    const [existing] = await pool.query(
      'SELECT id FROM inspections WHERE item_id = ? AND tahun = ? AND semester = ?',
      [item_id, inspectionYear, semester]
    );
    if (existing.length > 0) {
      deleteUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'Inspeksi untuk item ini sudah ada. Gunakan endpoint update untuk mengubah hasil.'
      });
    }

    // Check if item exists and belongs to user's lab
    const [items] = await pool.query(
      'SELECT id FROM items WHERE id = ?',
      [item_id]
    );
    if (items.length === 0) {
      deleteUploadedFiles(req);
      return res.status(404).json({
        success: false,
        message: 'Barang tidak ditemukan'
      });
    }

    // Verify item belongs to user's lab via item_ids (CSV)
    const [labs] = await pool.query(
      'SELECT id FROM laboratories WHERE id = ? AND FIND_IN_SET(?, item_ids)',
      [laboratory_id, item_id]
    );
    if (labs.length === 0) {
      deleteUploadedFiles(req);
      return res.status(403).json({
        success: false,
        message: 'Barang bukan milik laboratorium Anda'
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Insert inspection
    const [inspectionResult] = await connection.query(
      `INSERT INTO inspections 
       (laboratory_id, item_id, tahun, semester, inspector_id, tanggal_inspeksi, catatan, foto) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [laboratory_id, item_id, inspectionYear, semester, inspectorId, tanggal_inspeksi, catatan, foto]
    );

    const inspectionId = inspectionResult.insertId;

    // Create review records for all months in checklist_results
    if (checklist_results && Array.isArray(checklist_results) && checklist_results.length > 0) {
      const monthsSet = new Set(checklist_results.map(r => r.bulan_ke || 1));
      for (const bln of monthsSet) {
        await connection.query(
          `INSERT INTO inspection_monthly_reviews (inspection_id, bulan_ke, review_status)
           VALUES (?, ?, 'PENDING')
           ON DUPLICATE KEY UPDATE review_status = 'PENDING'`,
          [inspectionId, bln]
        );
      }
    }

    // Auto-populate results from approved subitems for 6 months
    if (!checklist_results || !Array.isArray(checklist_results) || checklist_results.length === 0) {
      const [approvedSubitems] = await connection.query(
        `SELECT si.id, si.nama_subitem FROM inspection_subitems si
         JOIN inspection_categories c ON si.category_id = c.id
         WHERE (c.laboratory_id = ? OR c.laboratory_id IS NULL OR c.created_by = ?) AND si.status = 'APPROVED' AND c.status = 'APPROVED'
         ORDER BY c.urutan ASC, si.urutan ASC`,
        [laboratory_id, inspectorId]
      );

      let totalRows = 0;
      for (const sub of approvedSubitems) {
        await connection.query(
          `INSERT INTO inspection_results (inspection_id, subitem_id, bulan_ke, status, keterangan)
           VALUES (?, ?, 1, NULL, NULL)`,
          [inspectionId, sub.id]
        );
        totalRows++;
      }

      // Create review record for bulan 1
      await connection.query(
        `INSERT INTO inspection_monthly_reviews (inspection_id, bulan_ke, review_status)
         VALUES (?, 1, 'PENDING')`,
        [inspectionId]
      );

      await connection.commit();
      connection.release();
      connection = null;

      return res.status(201).json({
        success: true,
        message: `Inspeksi berhasil dibuat, ${totalRows} hasil siap diisi untuk 6 bulan`,
        data: {
          id: inspectionId,
          laboratory_id,
          item_id,
          inspector_id: inspectorId,
          catatan,
          foto,
          tanggal_inspeksi,
          total_subitems: approvedSubitems.length,
          total_results: totalRows
        }
      });
    }

    const allowedStatuses = ['B', 'K', 'N/A'];
    for (const result of checklist_results) {
      const { subitem_id, status, keterangan, bulan_ke } = result;
      const normalizedStatus = status?.trim()?.toUpperCase();
      const bln = bulan_ke || 1;

      if (!subitem_id || !normalizedStatus) {
        continue;
      }

      if (!allowedStatuses.includes(normalizedStatus)) {
        continue;
      }

      const [inspectionResultRow] = await connection.query(
        `INSERT INTO inspection_results 
         (inspection_id, subitem_id, bulan_ke, status, keterangan)
         VALUES (?, ?, ?, ?, ?)`,
        [inspectionId, subitem_id, bln, normalizedStatus, keterangan || null]
      );

      const damageReport = damageReports[subitem_id] || damageReports[String(subitem_id)];
      if (normalizedStatus === 'K' && damageReport) {
        const damagePhoto = getUploadedFile(req, `damage_report_foto_${subitem_id}`);
        const [[subitem]] = await connection.query(
          `SELECT category_id
           FROM inspection_subitems
           WHERE id = ?
           LIMIT 1`,
          [subitem_id]
        );

        if (!subitem) {
          throw new Error(`Subitem ${subitem_id} tidak ditemukan`);
        }

        await connection.query(
          `INSERT INTO inspection_damage_reports
           (
             inspection_result_id,
             inspection_id,
             laboratory_id,
             item_id,
             category_id,
             subitem_id,
             kondisi_kerusakan,
             penyebab_kerusakan,
             status_peralatan,
             foto
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            inspectionResultRow.insertId,
            inspectionId,
            laboratory_id,
            item_id,
            subitem.category_id,
            subitem_id,
            damageReport.kondisi_kerusakan || null,
            damageReport.penyebab_kerusakan || null,
            damageReport.status_peralatan || null,
            damagePhoto ? `/uploads/${damagePhoto.filename}` : damageReport.foto || null
          ]
        );
      }
    }

    // Get overall status (K jika ada yang K, N/A jika semua N/A, B jika semua B)
    const allNA = checklist_results.every(r => {
      const s = r.status?.trim()?.toUpperCase();
      return s === 'N/A' || !s;
    });
    const anyK = checklist_results.some(r => r.status?.trim()?.toUpperCase() === 'K');
    const overallStatus = allNA ? 'N/A' : anyK ? 'K' : 'B';

    await connection.commit();
    connection.release();
    connection = null;

    res.status(201).json({
      success: true,
      message: 'Inspeksi berhasil dibuat',
      data: {
        id: inspectionId,
        laboratory_id,
        item_id,
        inspector_id: inspectorId,
        overall_status: overallStatus,
        catatan,
        foto,
        tanggal_inspeksi,
        results_count: checklist_results.length
      }
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Error rolling back inspection transaction:', rollbackErr);
      } finally {
        connection.release();
      }
    }
    deleteUploadedFiles(req);
    next(err);
  }
};

// Get inspection detail with all results
const getInspectionDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get inspection
    const [inspections] = await pool.query(
      `SELECT i.*, u.name as inspector_name, l.nama_lab, it.nama_barang, it.kode_barang
       FROM inspections i
       LEFT JOIN users u ON i.inspector_id = u.id
       LEFT JOIN laboratories l ON i.laboratory_id = l.id
       LEFT JOIN items it ON i.item_id = it.id
       WHERE i.id = ?`,
      [id]
    );

    if (inspections.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inspeksi tidak ditemukan'
      });
    }

    const inspection = inspections[0];

    // Get results with category, subitem info, and bulan_ke
    const [results] = await pool.query(
      `SELECT 
        ir.id,
        ir.status,
        ir.keterangan,
        ir.bulan_ke,
        ir.approval_status,
        ir.alasan_penolakan,
        is2.id as subitem_id,
        is2.nama_subitem,
        is2.deskripsi as subitem_deskripsi,
        ic.id as category_id,
        ic.nama_kategori,
        ic.urutan as category_urutan,
        is2.urutan as subitem_urutan
       FROM inspection_results ir
       JOIN inspection_subitems is2 ON ir.subitem_id = is2.id
       JOIN inspection_categories ic ON is2.category_id = ic.id
       WHERE ir.inspection_id = ?
       ORDER BY ir.bulan_ke ASC, ic.urutan ASC, is2.urutan ASC`,
      [id]
    );

    // Get all review statuses for this inspection
    const [reviews] = await pool.query(
      `SELECT imr.bulan_ke, imr.review_status, imr.reviewed_by, imr.alasan_penolakan, imr.reviewed_at,
              u.name as reviewer_name
       FROM inspection_monthly_reviews imr
       LEFT JOIN users u ON imr.reviewed_by = u.id
       WHERE imr.inspection_id = ?`,
      [id]
    );

    const reviewMap = {};
    reviews.forEach(r => {
      reviewMap[r.bulan_ke] = {
        review_status: r.review_status,
        reviewed_by: r.reviewed_by,
        reviewer_name: r.reviewer_name,
        alasan_penolakan: r.alasan_penolakan,
        reviewed_at: r.reviewed_at
      };
    });

    // Group results by bulan_ke, then by category
    const bulanGrouped = {};
    results.forEach(r => {
      const bln = r.bulan_ke;
      if (!bulanGrouped[bln]) {
        bulanGrouped[bln] = { bulan_ke: bln, categories: {} };
      }
      if (!bulanGrouped[bln].categories[r.category_id]) {
        bulanGrouped[bln].categories[r.category_id] = {
          category_id: r.category_id,
          nama_kategori: r.nama_kategori,
          urutan: r.category_urutan,
          items: []
        };
      }
      bulanGrouped[bln].categories[r.category_id].items.push({
        id: r.id,
        subitem_id: r.subitem_id,
        nama_subitem: r.nama_subitem,
        deskripsi: r.subitem_deskripsi,
        status: r.status,
        keterangan: r.keterangan,
        approval_status: r.approval_status,
        alasan_penolakan: r.alasan_penolakan,
        urutan: r.subitem_urutan
      });
    });

    const monthlyResults = Object.keys(bulanGrouped).sort().map(bln => {
      const catList = Object.values(bulanGrouped[bln].categories).sort((a, b) => a.urutan - b.urutan);
      const allItems = catList.flatMap(c => c.items);
      const totalItems = allItems.length;
      const baikCount = allItems.filter(i => i.status === 'B').length;
      const kurangCount = allItems.filter(i => i.status === 'K').length;
      const naCount = allItems.filter(i => i.status === 'N/A').length;
      const approvedCount = allItems.filter(i => i.approval_status === 'APPROVED').length;
      const rejectedCount = allItems.filter(i => i.approval_status === 'REJECTED').length;
      const pendingApprovalCount = allItems.filter(i => i.approval_status === 'PENDING').length;

      return {
        bulan_ke: Number(bln),
        categories: catList,
        statistics: {
          total_items: totalItems,
          baik: baikCount,
          kurang: kurangCount,
          na: naCount,
          overall_status: kurangCount > 0 ? 'K' : (baikCount > 0 ? 'B' : '-'),
          approval: {
            approved: approvedCount,
            rejected: rejectedCount,
            pending: pendingApprovalCount
          }
        },
        review: reviewMap[bln] || {
          review_status: 'PENDING',
          reviewed_by: null,
          reviewer_name: null,
          alasan_penolakan: null,
          reviewed_at: null
        }
      };
    });

    res.status(200).json({
      success: true,
      data: {
        inspection: inspection,
        monthly_results: monthlyResults
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get all inspections for month
const getInspectionsByMonth = async (req, res, next) => {
  try {
    const { bulan_ke } = req.params;

    const [inspections] = await pool.query(
      `SELECT i.id, i.laboratory_id, i.item_id, i.tanggal_inspeksi,
              u.name as inspector_name, l.nama_lab, it.nama_barang,
              COUNT(ir.id) as total_checks,
              SUM(CASE WHEN ir.status = 'B' THEN 1 ELSE 0 END) as baik_count,
              SUM(CASE WHEN ir.status = 'K' THEN 1 ELSE 0 END) as kurang_count
       FROM inspections i
       LEFT JOIN users u ON i.inspector_id = u.id
       LEFT JOIN laboratories l ON i.laboratory_id = l.id
       LEFT JOIN items it ON i.item_id = it.id
       LEFT JOIN inspection_results ir ON i.id = ir.inspection_id AND ir.bulan_ke = ?
       GROUP BY i.id
       ORDER BY i.tanggal_inspeksi DESC`,
      [bulan_ke]
    );

    res.status(200).json({
      success: true,
      data: inspections,
      total: inspections.length
    });
  } catch (err) {
    next(err);
  }
};

// Update inspection result
const updateInspectionResult = async (req, res, next) => {
  try {
    const { resultId } = req.params;
    let { status, keterangan } = req.body;

    // Trim and validate status
    status = status?.trim()?.toUpperCase();
    if (!status || !['B', 'K', 'N/A'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status harus B, K, atau N/A'
      });
    }

    // Check if result exists
    const [results] = await pool.query(
      'SELECT id, approval_status, inspection_id, bulan_ke, alasan_penolakan FROM inspection_results WHERE id = ?',
      [resultId]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hasil inspeksi tidak ditemukan'
      });
    }

    const result = results[0];

    // Check if monthly review is already APPROVED
    const [existingReview] = await pool.query(
      'SELECT review_status FROM inspection_monthly_reviews WHERE inspection_id = ? AND bulan_ke = ?',
      [result.inspection_id, result.bulan_ke]
    );

    if (existingReview.length > 0 && existingReview[0].review_status === 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: `Hasil inspeksi bulan ke-${result.bulan_ke} sudah disetujui. Tidak dapat mengubah hasil yang sudah disetujui.`
      });
    }

    // Update result - reset individual approval if previously rejected
    const wasRejected = result.approval_status === 'REJECTED';
    await pool.query(
      'UPDATE inspection_results SET status = ?, keterangan = ?, approval_status = ?, alasan_penolakan = ? WHERE id = ?',
      [status, keterangan || null, wasRejected ? 'PENDING' : result.approval_status, wasRejected ? null : result.alasan_penolakan, resultId]
    );

    // Set monthly review back to PENDING, admin must review
    await pool.query(
      `UPDATE inspection_monthly_reviews
       SET review_status = 'PENDING', reviewed_by = NULL, reviewed_at = NULL, alasan_penolakan = NULL
       WHERE inspection_id = ? AND bulan_ke = ? AND review_status = 'REJECTED'`,
      [result.inspection_id, result.bulan_ke]
    );

    res.status(200).json({
      success: true,
      message: 'Hasil inspeksi berhasil diperbarui',
      resubmitted: wasRejected
    });
  } catch (err) {
    next(err);
  }
};

// Update all inspection results at once (bulk)
const updateInspectionResults = async (req, res, next) => {
  let connection;
  try {
    const { id } = req.params;
    let { bulan_ke, results, damageReports } = req.body;

    if (typeof results === 'string') {
      try {
        results = JSON.parse(results);
      } catch (e) {
        deleteUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Format results JSON tidak valid'
        });
      }
    }

    if (typeof damageReports === 'string') {
      try {
        damageReports = JSON.parse(damageReports);
      } catch (e) {
        deleteUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: 'Format damageReports JSON tidak valid'
        });
      }
    }
    if (!damageReports || typeof damageReports !== 'object' || Array.isArray(damageReports)) {
      damageReports = {};
    }

    const month = Number(bulan_ke);

    if (!month || month < 1 || month > 6) {
      deleteUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'Field bulan_ke (1-6) harus diisi'
      });
    }

    if (!results || !Array.isArray(results) || results.length === 0) {
      deleteUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: 'Daftar hasil inspeksi harus diisi'
      });
    }

    const [inspections] = await pool.query(
      'SELECT id, laboratory_id, item_id FROM inspections WHERE id = ?',
      [id]
    );

    if (inspections.length === 0) {
      deleteUploadedFiles(req);
      return res.status(404).json({
        success: false,
        message: 'Inspeksi tidak ditemukan'
      });
    }

    // Check if month is already approved
    const [existingReview] = await pool.query(
      'SELECT review_status FROM inspection_monthly_reviews WHERE inspection_id = ? AND bulan_ke = ?',
      [id, month]
    );

    if (existingReview.length > 0 && existingReview[0].review_status === 'APPROVED') {
      deleteUploadedFiles(req);
      return res.status(400).json({
        success: false,
        message: `Hasil inspeksi bulan ke-${month} sudah disetujui. Tidak dapat mengubah hasil yang sudah disetujui.`
      });
    }

    // Check if previous month has been approved
    if (month > 1) {
      const [prevReview] = await pool.query(
        'SELECT review_status FROM inspection_monthly_reviews WHERE inspection_id = ? AND bulan_ke = ?',
        [id, month - 1]
      );
      if (prevReview.length === 0 || prevReview[0].review_status !== 'APPROVED') {
        deleteUploadedFiles(req);
        return res.status(400).json({
          success: false,
          message: `Bulan ke-${month - 1} belum disetujui. Selesaikan dan tunggu persetujuan admin terlebih dahulu.`
        });
      }
    }

    const allowedStatuses = ['B', 'K', 'N/A'];

    connection = await pool.getConnection();
    await connection.beginTransaction();

    for (const r of results) {
      const status = r.status?.trim()?.toUpperCase();

      if (!status || !allowedStatuses.includes(status)) {
        continue;
      }

      if (r.id) {
        await connection.query(
          'UPDATE inspection_results SET status = ?, keterangan = ?, approval_status = ? WHERE id = ? AND inspection_id = ? AND bulan_ke = ?',
          [status, r.keterangan || null, 'PENDING', r.id, id, month]
        );
      } else if (r.subitem_id) {
        await connection.query(
          `INSERT INTO inspection_results (inspection_id, subitem_id, bulan_ke, status, keterangan, approval_status)
           VALUES (?, ?, ?, ?, ?, 'PENDING')
           ON DUPLICATE KEY UPDATE status = VALUES(status), keterangan = VALUES(keterangan), approval_status = 'PENDING'`,
          [id, r.subitem_id, month, status, r.keterangan || null]
        );
      } else {
        continue;
      }

      const [resultRows] = await connection.query(
        `SELECT ir.id, ir.inspection_id, ir.subitem_id, si.category_id
         FROM inspection_results ir
         JOIN inspection_subitems si ON ir.subitem_id = si.id
         WHERE ir.inspection_id = ?
           AND ir.bulan_ke = ?
           AND ${r.id ? 'ir.id = ?' : 'ir.subitem_id = ?'}
         LIMIT 1`,
        [id, month, r.id || r.subitem_id]
      );

      if (resultRows.length === 0) {
        continue;
      }

      const inspectionResult = resultRows[0];
      const damageReport = damageReports[inspectionResult.subitem_id] || damageReports[String(inspectionResult.subitem_id)];

      if (status === 'K' && damageReport) {
        const damagePhoto = getUploadedFile(req, `damage_report_foto_${inspectionResult.subitem_id}`);
        const damageFoto = damagePhoto ? `/uploads/${damagePhoto.filename}` : damageReport.foto || null;

        const [existingDamageReports] = await connection.query(
          `SELECT id
           FROM inspection_damage_reports
           WHERE inspection_result_id = ?
           LIMIT 1`,
          [inspectionResult.id]
        );

        if (existingDamageReports.length > 0) {
          await connection.query(
            `UPDATE inspection_damage_reports
             SET
               inspection_id = ?,
               laboratory_id = ?,
               item_id = ?,
               category_id = ?,
               subitem_id = ?,
               kondisi_kerusakan = ?,
               penyebab_kerusakan = ?,
               status_peralatan = ?,
               foto = COALESCE(?, foto),
               updated_at = NOW()
             WHERE inspection_result_id = ?`,
            [
              id,
              inspections[0].laboratory_id,
              inspections[0].item_id,
              inspectionResult.category_id,
              inspectionResult.subitem_id,
              damageReport.kondisi_kerusakan || null,
              damageReport.penyebab_kerusakan || null,
              damageReport.status_peralatan || null,
              damageFoto,
              inspectionResult.id
            ]
          );
        } else {
          await connection.query(
            `INSERT INTO inspection_damage_reports
             (
               inspection_result_id,
               inspection_id,
               laboratory_id,
               item_id,
               category_id,
               subitem_id,
               kondisi_kerusakan,
               penyebab_kerusakan,
               status_peralatan,
               foto
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              inspectionResult.id,
              id,
              inspections[0].laboratory_id,
              inspections[0].item_id,
              inspectionResult.category_id,
              inspectionResult.subitem_id,
              damageReport.kondisi_kerusakan || null,
              damageReport.penyebab_kerusakan || null,
              damageReport.status_peralatan || null,
              damageFoto
            ]
          );
        }
      }
    }

    // Upsert review record: all months need admin approval
    await connection.query(
      `INSERT INTO inspection_monthly_reviews (inspection_id, bulan_ke, review_status, reviewed_by, reviewed_at)
       VALUES (?, ?, 'PENDING', NULL, NULL)
       ON DUPLICATE KEY UPDATE review_status = 'PENDING', reviewed_by = NULL, reviewed_at = NULL, alasan_penolakan = NULL`,
      [id, month]
    );

    const [updatedResults] = await connection.query(
      'SELECT status FROM inspection_results WHERE inspection_id = ? AND bulan_ke = ?',
      [id, month]
    );

    const total = updatedResults.length;
    const anyK = updatedResults.some(r => r.status === 'K');
    const allNA = total > 0 && updatedResults.every(r => r.status === 'N/A');
    const overallStatus = allNA ? 'N/A' : anyK ? 'K' : 'B';

    await connection.commit();
    connection.release();
    connection = null;

    res.status(200).json({
      success: true,
      message: `Hasil inspeksi bulan ke-${month} berhasil diperbarui dan menunggu review admin`,
      data: {
        bulan_ke: month,
        total_updated: results.length,
        overall_status: overallStatus,
        review_status: 'PENDING'
      }
    });
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Error rolling back inspection results transaction:', rollbackErr);
      } finally {
        connection.release();
      }
    }
    deleteUploadedFiles(req);
    next(err);
  }
};

// Delete inspection
const deleteInspection = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if inspection exists
    const [inspections] = await pool.query(
      'SELECT foto FROM inspections WHERE id = ?',
      [id]
    );

    if (inspections.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Inspeksi tidak ditemukan'
      });
    }

    // Delete foto if exists
    if (inspections[0].foto) {
      const fotoPath = path.join(__dirname, '../../' + inspections[0].foto);
      if (fs.existsSync(fotoPath)) {
        fs.unlinkSync(fotoPath);
      }
    }

    // Delete inspection (cascade delete will remove results)
    await pool.query('DELETE FROM inspections WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'Inspeksi berhasil dihapus'
    });
  } catch (err) {
    next(err);
  }
};

// ==================== REVIEW WORKFLOW ====================

// Approve monthly results (admin only)
const approveMonthlyResults = async (req, res, next) => {
  try {
    const { id, bulan_ke } = req.params;

    const [reviews] = await pool.query(
      'SELECT id, review_status FROM inspection_monthly_reviews WHERE inspection_id = ? AND bulan_ke = ?',
      [id, bulan_ke]
    );

    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Review untuk bulan ke-${bulan_ke} tidak ditemukan. Isi hasil inspeksi terlebih dahulu.`
      });
    }

    if (reviews[0].review_status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Review bulan ke-${bulan_ke} sudah memiliki status: ${reviews[0].review_status}`
      });
    }

    await pool.query(
      `UPDATE inspection_results 
       SET approval_status = 'APPROVED', alasan_penolakan = NULL
       WHERE inspection_id = ? AND bulan_ke = ? AND approval_status IN ('PENDING', 'REJECTED')`,
      [id, bulan_ke]
    );

    await pool.query(
      `UPDATE inspection_monthly_reviews 
       SET review_status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW(), alasan_penolakan = NULL 
       WHERE id = ?`,
      [req.user.id, reviews[0].id]
    );

    res.status(200).json({
      success: true,
      message: `Hasil inspeksi bulan ke-${bulan_ke} berhasil disetujui`
    });
  } catch (err) {
    next(err);
  }
};

// Reject monthly results (admin only)
const rejectMonthlyResults = async (req, res, next) => {
  try {
    const { id, bulan_ke } = req.params;
    const { alasan_penolakan } = req.body;

    const [reviews] = await pool.query(
      'SELECT id, review_status FROM inspection_monthly_reviews WHERE inspection_id = ? AND bulan_ke = ?',
      [id, bulan_ke]
    );

    if (reviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Review untuk bulan ke-${bulan_ke} tidak ditemukan.`
      });
    }

    if (reviews[0].review_status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Review bulan ke-${bulan_ke} sudah memiliki status: ${reviews[0].review_status}`
      });
    }

    await pool.query(
      `UPDATE inspection_results 
       SET approval_status = 'REJECTED', alasan_penolakan = ?
       WHERE inspection_id = ? AND bulan_ke = ? AND approval_status IN ('PENDING', 'APPROVED')`,
      [alasan_penolakan || null, id, bulan_ke]
    );

    await pool.query(
      `UPDATE inspection_monthly_reviews 
       SET review_status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW(), alasan_penolakan = ? 
       WHERE id = ?`,
      [req.user.id, alasan_penolakan || null, reviews[0].id]
    );

    res.status(200).json({
      success: true,
      message: `Hasil inspeksi bulan ke-${bulan_ke} berhasil ditolak`,
      alasan: alasan_penolakan
    });
  } catch (err) {
    next(err);
  }
};

// Get all pending reviews (admin only)
const getPendingReviews = async (req, res, next) => {
  try {
    const now = new Date();

    let currentYear = now.getFullYear();
    const month = now.getMonth() + 1;

    // Semester sama seperti yang kamu pakai saat createInspection
    let currentSemester = month >= 2 && month <= 7 ? "GENAP" : "GANJIL";

    // Januari masih masuk semester ganjil tahun sebelumnya
    if (month === 1) {
      currentSemester = "GANJIL";
      currentYear--;
    }
    let whereClause =
      'WHERE imr.review_status = ? AND i.tahun = ? AND i.semester = ?';

    let params = [
      'PENDING',
      currentYear,
      currentSemester
    ];


    const [pending] = await pool.query(
      `SELECT 
        imr.*,
        i.item_id, i.laboratory_id, i.inspector_id, i.tahun, i.semester,
        it.nama_barang, it.kode_barang,
        l.nama_lab,
        u.name as inspector_name,
        (SELECT COUNT(*) FROM inspection_results ir WHERE ir.inspection_id = i.id AND ir.bulan_ke = imr.bulan_ke) as total_checks,
        (SELECT COUNT(*) FROM inspection_results ir WHERE ir.inspection_id = i.id AND ir.bulan_ke = imr.bulan_ke AND ir.status = 'B') as baik_count,
        (SELECT COUNT(*) FROM inspection_results ir WHERE ir.inspection_id = i.id AND ir.bulan_ke = imr.bulan_ke AND ir.status = 'K') as kurang_count,
        (SELECT COUNT(*) FROM inspection_results ir WHERE ir.inspection_id = i.id AND ir.bulan_ke = imr.bulan_ke AND ir.status = 'N/A') as na_count
       FROM inspection_monthly_reviews imr
       JOIN inspections i ON imr.inspection_id = i.id
       JOIN items it ON i.item_id = it.id
       JOIN laboratories l ON i.laboratory_id = l.id
       LEFT JOIN users u ON i.inspector_id = u.id
       ${whereClause}
       ORDER BY imr.created_at DESC`,
      params
    );

    res.status(200).json({
      success: true,
      data: pending,
      total: pending.length
    });
  } catch (err) {
    next(err);
  }
};

// ==================== PER-ITEM APPROVAL WORKFLOW ====================

// Approve individual result item (admin only)
const approveResultItem = async (req, res, next) => {
  try {
    const { resultId } = req.params;

    const [results] = await pool.query(
      `SELECT ir.id, ir.inspection_id, ir.bulan_ke FROM inspection_results ir
       WHERE ir.id = ?`,
      [resultId]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hasil inspeksi tidak ditemukan'
      });
    }

    const r = results[0];

    await pool.query(
      'UPDATE inspection_results SET approval_status = ?, alasan_penolakan = NULL WHERE id = ?',
      ['APPROVED', resultId]
    );

    // Auto-approve monthly review if all results in this month are APPROVED
    const [monthStatus] = await pool.query(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN approval_status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count
       FROM inspection_results
       WHERE inspection_id = ? AND bulan_ke = ?`,
      [r.inspection_id, r.bulan_ke]
    );

    if (Number(monthStatus[0].total) > 0 && Number(monthStatus[0].total) === Number(monthStatus[0].approved_count)) {
      await pool.query(
        `UPDATE inspection_monthly_reviews
         SET review_status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW(), alasan_penolakan = NULL
         WHERE inspection_id = ? AND bulan_ke = ? AND review_status != 'APPROVED'`,
        [req.user.id, r.inspection_id, r.bulan_ke]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Hasil inspeksi berhasil disetujui'
    });
  } catch (err) {
    next(err);
  }
};

// Reject individual result item (admin only)
const rejectResultItem = async (req, res, next) => {
  try {
    const { resultId } = req.params;
    const { alasan_penolakan } = req.body;

    const [results] = await pool.query(
      `SELECT ir.id, ir.inspection_id, ir.bulan_ke FROM inspection_results ir
       WHERE ir.id = ?`,
      [resultId]
    );

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hasil inspeksi tidak ditemukan'
      });
    }

    const r = results[0];

    await pool.query(
      'UPDATE inspection_results SET approval_status = ?, alasan_penolakan = ? WHERE id = ?',
      ['REJECTED', alasan_penolakan || null, resultId]
    );

    // Set monthly review to REJECTED if currently PENDING
    await pool.query(
      `UPDATE inspection_monthly_reviews
       SET review_status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW(), alasan_penolakan = ?
       WHERE inspection_id = ? AND bulan_ke = ? AND review_status = 'PENDING'`,
      [req.user.id, alasan_penolakan || null, r.inspection_id, r.bulan_ke]
    );

    res.status(200).json({
      success: true,
      message: 'Hasil inspeksi berhasil ditolak',
      alasan_penolakan
    });
  } catch (err) {
    next(err);
  }
};

// ==================== BULK APPROVAL WORKFLOW ====================

const bulkApproveResults = async (req, res, next) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Daftar ID hasil inspeksi harus diisi'
      });
    }

    // Get unique inspection/month combos for auto-approve
    const [existing] = await pool.query(
      'SELECT DISTINCT inspection_id, bulan_ke FROM inspection_results WHERE id IN (?) AND approval_status IN (\'PENDING\', \'REJECTED\')',
      [ids]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada hasil inspeksi yang menunggu persetujuan'
      });
    }

    await pool.query(
      'UPDATE inspection_results SET approval_status = ?, alasan_penolakan = NULL WHERE id IN (?)',
      ['APPROVED', ids]
    );

    // Auto-approve monthly reviews where all results are now APPROVED
    for (const r of existing) {
      const [monthStatus] = await pool.query(
        `SELECT COUNT(*) as total,
                SUM(CASE WHEN approval_status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count
         FROM inspection_results
         WHERE inspection_id = ? AND bulan_ke = ?`,
        [r.inspection_id, r.bulan_ke]
      );

      if (Number(monthStatus[0].total) > 0 && Number(monthStatus[0].total) === Number(monthStatus[0].approved_count)) {
        await pool.query(
          `UPDATE inspection_monthly_reviews
           SET review_status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW(), alasan_penolakan = NULL
           WHERE inspection_id = ? AND bulan_ke = ? AND review_status != 'APPROVED'`,
          [req.user.id, r.inspection_id, r.bulan_ke]
        );
      }
    }

    res.status(200).json({
      success: true,
      message: `${ids.length} hasil inspeksi berhasil disetujui`
    });
  } catch (err) {
    next(err);
  }
};

const bulkRejectResults = async (req, res, next) => {
  try {
    const { ids, alasan_penolakan } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Daftar ID hasil inspeksi harus diisi'
      });
    }

    if (!alasan_penolakan) {
      return res.status(400).json({
        success: false,
        message: 'Alasan penolakan harus diisi'
      });
    }

    // Get unique inspection/month combos
    const [existing] = await pool.query(
      'SELECT DISTINCT inspection_id, bulan_ke FROM inspection_results WHERE id IN (?) AND approval_status IN (\'PENDING\', \'APPROVED\')',
      [ids]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada hasil inspeksi yang bisa ditolak'
      });
    }

    await pool.query(
      'UPDATE inspection_results SET approval_status = ?, alasan_penolakan = ? WHERE id IN (?)',
      ['REJECTED', alasan_penolakan, ids]
    );

    // Set monthly reviews to REJECTED if currently PENDING
    for (const r of existing) {
      await pool.query(
        `UPDATE inspection_monthly_reviews
         SET review_status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW(), alasan_penolakan = ?
         WHERE inspection_id = ? AND bulan_ke = ? AND review_status = 'PENDING'`,
        [req.user.id, alasan_penolakan, r.inspection_id, r.bulan_ke]
      );
    }

    res.status(200).json({
      success: true,
      message: `${ids.length} hasil inspeksi berhasil ditolak`,
      alasan: alasan_penolakan
    });
  } catch (err) {
    next(err);
  }
};

// Get my pending/rejected inspections (kalab)
const getMyPendingInspections = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [inspections] = await pool.query(
      `SELECT
        i.id, i.laboratory_id, i.item_id, i.tanggal_inspeksi,
        l.nama_lab, it.nama_barang, it.kode_barang,
        imr.bulan_ke, imr.review_status, imr.alasan_penolakan, imr.created_at as review_date,
        (SELECT COUNT(*) FROM inspection_results ir WHERE ir.inspection_id = i.id AND ir.bulan_ke = imr.bulan_ke) as total_items,
        (SELECT COUNT(*) FROM inspection_results ir WHERE ir.inspection_id = i.id AND ir.bulan_ke = imr.bulan_ke AND ir.approval_status = 'REJECTED') as rejected_count,
        (SELECT COUNT(*) FROM inspection_results ir WHERE ir.inspection_id = i.id AND ir.bulan_ke = imr.bulan_ke AND ir.approval_status = 'APPROVED') as approved_count
       FROM inspections i
       JOIN inspection_monthly_reviews imr ON i.id = imr.inspection_id
       JOIN laboratories l ON i.laboratory_id = l.id
       JOIN items it ON i.item_id = it.id
       WHERE i.inspector_id = ? AND imr.review_status IN ('PENDING', 'REJECTED')
       ORDER BY imr.review_status ASC, imr.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      success: true,
      data: inspections,
      total: inspections.length
    });
  } catch (err) {
    next(err);
  }
};

// ==================== ADMIN: VIEW RESULTS BY STATUS ====================

// Get all results filtered by approval_status (admin only)
const getResultsByStatus = async (req, res, next) => {
  try {
    const { approval_status, inspection_id, laboratory_id, tahun, semester } = req.query;
    let whereClauses = [];
    let params = [];

    if (approval_status) {
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
      if (!validStatuses.includes(approval_status.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: 'approval_status harus PENDING, APPROVED, atau REJECTED'
        });
      }
      whereClauses.push('ir.approval_status = ?');
      params.push(approval_status.toUpperCase());
    }

    if (inspection_id) {
      whereClauses.push('ir.inspection_id = ?');
      params.push(inspection_id);
    }

    if (laboratory_id) {
      whereClauses.push('i.laboratory_id = ?');
      params.push(laboratory_id);
    }



    const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const [results] = await pool.query(
      `SELECT
        ir.id as result_id,
        ir.status as hasil_status,
        ir.keterangan,
        ir.bulan_ke,
        ir.approval_status,
        ir.alasan_penolakan,
        is2.id as subitem_id,
        is2.nama_subitem,
        ic.id as category_id,
        ic.nama_kategori,
        i.id as inspection_id,
        i.tanggal_inspeksi,
        i.tahun, i.semester,
        it.nama_barang,
        it.kode_barang,
        l.nama_lab,
        l.id as laboratory_id,
        u.name as inspector_name
       FROM inspection_results ir
       JOIN inspections i ON ir.inspection_id = i.id
       JOIN inspection_subitems is2 ON ir.subitem_id = is2.id
       JOIN inspection_categories ic ON is2.category_id = ic.id
       JOIN items it ON i.item_id = it.id
       JOIN laboratories l ON i.laboratory_id = l.id
       LEFT JOIN users u ON i.inspector_id = u.id
       ${whereSQL}
       ORDER BY ir.bulan_ke ASC, l.nama_lab ASC, it.nama_barang ASC, ic.urutan ASC, is2.urutan ASC`,
      params
    );

    // Group by inspection for cleaner response
    const grouped = {};
    for (const r of results) {
      const key = `${r.inspection_id}-${r.bulan_ke}`;
      if (!grouped[key]) {
        grouped[key] = {
          inspection_id: r.inspection_id,
          bulan_ke: r.bulan_ke,
          tahun: r.tahun,
          semester: r.semester,
          tanggal_inspeksi: r.tanggal_inspeksi,
          nama_barang: r.nama_barang,
          kode_barang: r.kode_barang,
          nama_lab: r.nama_lab,
          laboratory_id: r.laboratory_id,
          inspector_name: r.inspector_name,
          items: []
        };
      }
      grouped[key].items.push({
        result_id: r.result_id,
        subitem_id: r.subitem_id,
        nama_subitem: r.nama_subitem,
        category_id: r.category_id,
        nama_kategori: r.nama_kategori,
        hasil_status: r.hasil_status,
        keterangan: r.keterangan,
        approval_status: r.approval_status,
        alasan_penolakan: r.alasan_penolakan
      });
    }

    res.status(200).json({
      success: true,
      data: Object.values(grouped),
      total: results.length
    });
  } catch (err) {
    next(err);
  }
};

const checkInspectionByItemId = async (req, res, next) => {
  try {
    const { item_id } = req.params;
    const { tahun, semester } = req.query;
    let whereClause = 'WHERE i.item_id = ?';
    let params = [item_id];
    if (tahun) {
      whereClause += ' AND i.tahun = ?';
      params.push(Number(tahun));
    }
    if (semester) {
      whereClause += ' AND i.semester = ?';
      params.push(semester);
    }
    const [rows] = await pool.query(
      `SELECT i.id, i.tahun, i.semester, imr.review_status, imr.bulan_ke, imr.alasan_penolakan,
               EXISTS(SELECT 1 FROM inspection_monthly_reviews WHERE inspection_id = i.id AND review_status = 'APPROVED') as has_approved_month,
               (SELECT COUNT(DISTINCT bulan_ke) FROM inspection_results WHERE inspection_id = i.id) as filled_months
        FROM inspections i
        LEFT JOIN inspection_monthly_reviews imr ON imr.inspection_id = i.id
        ${whereClause}
        ORDER BY imr.bulan_ke DESC
        LIMIT 1`,
      params
    );

    const [categoryPending] = await pool.query(
      `
      SELECT COUNT(*) total
      FROM inspection_categories
      WHERE item_id = ?
      AND status = 'PENDING'
      `,
      [item_id]
    );

    let pendingCount = Number(categoryPending[0].total);

    if (rows.length > 0) {
      const inspectionId = rows[0].id;

      const [reviewPending] = await pool.query(
        `
      SELECT COUNT(*) total
      FROM inspection_monthly_reviews
      WHERE inspection_id = ?
      AND review_status = 'PENDING'
      `,
        [inspectionId]
      );

      const [subPending] = await pool.query(
        `
      SELECT COUNT(*) total
      FROM inspection_results
      WHERE inspection_id = ?
      AND approval_status = 'PENDING'
      `,
        [inspectionId]
      );

      pendingCount +=
        Number(reviewPending[0].total) +
        Number(subPending[0].total);
    }

    const [rejectedCategory] = await pool.query(
      `
    SELECT COUNT(*) total
    FROM inspection_categories
    WHERE item_id = ?
    AND status = 'REJECTED'
    `,
      [item_id]
    );

    let rejectedInspectionCount = 0;

    if (rows.length > 0) {
      const inspectionId = rows[0].id;

      const [rejectReview] = await pool.query(
        `
    SELECT COUNT(*) total
    FROM inspection_monthly_reviews
    WHERE inspection_id = ?
    AND review_status = 'REJECTED'
    `,
        [inspectionId]
      );

      rejectedInspectionCount = Number(rejectReview[0].total);
    }

    let needFillNextMonth = false;

    if (rows.length > 0) {
      const latestApproved = rows[0].filled_months;

      if (
        rows[0].review_status === "APPROVED" &&
        latestApproved < 6
      ) {
        needFillNextMonth = true;
      }
    }

    res.status(200).json({
      success: true,
      exists: rows.length > 0,
      inspection_id: rows.length > 0 ? rows[0].id : null,
      tahun: rows.length > 0 ? rows[0].tahun : null,
      semester: rows.length > 0 ? rows[0].semester : null,
      review_status: rows.length > 0 ? rows[0].review_status : null,
      alasan_penolakan: rows.length > 0 ? rows[0].alasan_penolakan : null,
      has_approved_month: rows.length > 0 ? Boolean(rows[0].has_approved_month) : false,
      filled_months: rows.length > 0 ? Number(rows[0].filled_months) : 0,
      pendingCount: pendingCount,
      hasPending: pendingCount > 0,
      hasRejectedCategory: Number(rejectedCategory[0].total) > 0,
      hasRejectedInspection: rejectedInspectionCount > 0,
      needFillNextMonth,
    });
  } catch (err) {
    next(err);
  }
};

// Get distinct (tahun, semester) pairs for a lab (for dropdown)
const getLabSemesters = async (req, res, next) => {
  try {
    const { laboratoryId } = req.params;
    const [rows] = await pool.query(
      `SELECT DISTINCT i.tahun, i.semester
       FROM inspections i
       WHERE i.laboratory_id = ?
       ORDER BY i.tahun DESC, i.semester DESC`,
      [laboratoryId]
    );

    res.status(200).json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createInspectionWithChecklist,
  getInspectionDetail,
  getInspectionsByMonth,
  updateInspectionResult,
  updateInspectionResults,
  deleteInspection,
  approveMonthlyResults,
  rejectMonthlyResults,
  getPendingReviews,
  approveResultItem,
  rejectResultItem,
  bulkApproveResults,
  bulkRejectResults,
  getMyPendingInspections,
  getResultsByStatus,
  checkInspectionByItemId,
  getLabSemesters
};

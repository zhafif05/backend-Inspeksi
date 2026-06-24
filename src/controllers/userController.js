const bcrypt = require('bcryptjs');
const pool = require('../config/database');

const getAllUsers = async (req, res, next) => {
  try {
    const [users] = await pool.query(
      'SELECT u.id, u.name, u.nip, u.email, u.role, u.created_at FROM users u ORDER BY u.created_at DESC'
    );

    res.status(200).json({
      success: true,
      data: users,
      total: users.length
    });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, nip, email, password, role } = req.body;

    const [existingUser] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar'
      });
    }

    const allowedRoles = ['admin', 'kalab', 'plp'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role tidak valid'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (name, nip, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [
        name,
        nip || '',
        email,
        hashedPassword,
        role || 'kalab'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      data: {
        id: result.insertId,
        name,
        nip: nip || '',
        email,
        role: role || 'kalab'
      }
    });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, nip, email, role } = req.body;

    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    await pool.query(
      'UPDATE users SET name = ?, nip = ?, email = ?, role = ? WHERE id = ?',
      [name, nip || '', email, role, id]
    );

    res.status(200).json({
      success: true,
      message: 'User berhasil diperbarui'
    });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [users] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.status(200).json({
      success: true,
      message: 'User berhasil dihapus'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser
};

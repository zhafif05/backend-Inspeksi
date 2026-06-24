const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      'SELECT id, name, nip, email, password, role FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    const user = users[0];

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email atau password salah'
      });
    }

    // Ambil lab dari tabel laboratories tempat kalab ini terdaftar
    let laboratory_id = null;
    let lab_name = null;
    if (user.role === 'kalab') {
      const [labs] = await pool.query(
        'SELECT id, nama_lab FROM laboratories WHERE kalab_id = ?',
        [user.id]
      );
      laboratory_id = labs.length > 0 ? labs[0].id : null;
      lab_name = labs.length > 0 ? labs[0].nama_lab : null;
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        nip: user.nip,
        email: user.email,
        role: user.role,
        laboratory_id,
        lab_name
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login berhasil',
      data: {
        user: {
          id: user.id,
          name: user.name,
          nip: user.nip,
          email: user.email,
          role: user.role,
          laboratory_id,
          lab_name
        },
        token
      }
    });
  } catch (err) {
    next(err);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.query(
      'SELECT id, name, nip, email, role, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }

    const user = users[0];

    let laboratory_id = null;
    let lab_name = null;
    if (user.role === 'kalab') {
      const [labs] = await pool.query(
        'SELECT id, nama_lab FROM laboratories WHERE kalab_id = ?',
        [user.id]
      );
      laboratory_id = labs.length > 0 ? labs[0].id : null;
      lab_name = labs.length > 0 ? labs[0].nama_lab : null;
    }

    res.status(200).json({
      success: true,
      data: { ...user, laboratory_id, lab_name }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  getProfile
};

// server.js - Servidor mínimo para login con tabla usuarios
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware básico
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuración BD
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

// Verificar conexión con la BD
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a la BD exitosa');
        connection.release();
    } catch (error) {
        console.error('❌ Error al conectar con la BD:', error.message);
    }
})();


// ========== RUTA DE LOGIN ==========
app.post('/api/auth/login', async (req, res) => {
    console.log('📧 Login solicitado para:', req.body.email);

    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            error: 'Email y contraseña requeridos'
        });
    }

    try {
        // Buscar usuario en la tabla usuarios
        const [usuarios] = await pool.query(
            'SELECT * FROM usuarios WHERE email = ? AND estado = "active"',
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        const usuario = usuarios[0];

        // Verificar contraseña (columna "contraseña")
        const passwordValido = await bcrypt.compare(password, usuario.contraseña);

        if (!passwordValido) {
            return res.status(401).json({
                success: false,
                error: 'Contraseña incorrecta'
            });
        }

        // Generar token
        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                rol: usuario.rol
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Respuesta exitosa
        res.json({
            success: true,
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre, // ahora la columna es "nombre"
                email: usuario.email,
                rol: usuario.rol
            }
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            error: 'Error del servidor'
        });
    }
});

// Configuración de correo (usa variables .env)
// =======================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// =======================
// 1. Solicitar recuperación
// =======================
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    const codigo = Math.floor(100000 + Math.random() * 900000); // 6 dígitos
    const expira = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    try {
        const [rows] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
        if (!rows.length) return res.json({ success: false, error: 'Usuario no encontrado' });

        await pool.query(
            'UPDATE usuarios SET reset_code = ?, reset_expira = ? WHERE email = ?',
            [codigo, expira, email]
        );

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Recuperación de contraseña',
            text: `Tu código de recuperación es: ${codigo}. Expira en 15 minutos.`,
        });

        res.json({ success: true, message: 'Código enviado al correo' });
    } catch (err) {
        console.error('❌ Error en forgot-password:', err);
        res.status(500).json({ success: false, error: 'Error al enviar código' });
    }
});

// =======================
// 2. Verificar código
// =======================
app.post('/api/verify-code', async (req, res) => {
    const { email, codigo } = req.body;
    try {
        const [rows] = await pool.query(
            'SELECT reset_code, reset_expira FROM usuarios WHERE email = ?',
            [email]
        );
        if (!rows.length) return res.json({ success: false, error: 'Usuario no encontrado' });

        const user = rows[0];
        if (user.reset_code != codigo) return res.json({ success: false, error: 'Código inválido' });
        if (new Date() > user.reset_expira) return res.json({ success: false, error: 'Código expirado' });

        res.json({ success: true, message: 'Código válido' });
    } catch (err) {
        console.error('❌ Error en verify-code:', err);
        res.status(500).json({ success: false, error: 'Error al verificar código' });
    }
});

// =======================
// 3. Cambiar contraseña
// =======================
app.post('/api/reset-password', async (req, res) => {
    const { email, codigo, nuevaPassword } = req.body;
    try {
        const [rows] = await pool.query(
            'SELECT reset_code, reset_expira FROM usuarios WHERE email = ?',
            [email]
        );
        if (!rows.length) return res.json({ success: false, error: 'Usuario no encontrado' });

        const user = rows[0];
        if (user.reset_code != codigo) return res.json({ success: false, error: 'Código inválido' });
        if (new Date() > user.reset_expira) return res.json({ success: false, error: 'Código expirado' });

        const hash = await bcrypt.hash(nuevaPassword, 10);
        await pool.query(
            'UPDATE usuarios SET contraseña = ?, reset_code = NULL, reset_expira = NULL WHERE email = ?',
            [hash, email]
        );

        res.json({ success: true, message: 'Contraseña actualizada correctamente' });
    } catch (err) {
        console.error('❌ Error en reset-password:', err);
        res.status(500).json({ success: false, error: 'Error al actualizar contraseña' });
    }
});


// Ruta para estadísticas del dashboard
app.get('/api/dashboard/data', async (req, res) => {
    try {
        const [usuarios] = await pool.query(
            'SELECT COUNT(*) AS total FROM usuarios'
        );

        const [instructores] = await pool.query(
            'SELECT COUNT(*) AS total FROM usuarios WHERE rol = "instructor" AND estado = "active"'
        );

        const [estudiantes] = await pool.query(
            'SELECT COUNT(*) AS total FROM usuarios WHERE rol = "student" AND estado = "active"'
        );

        const [admins] = await pool.query(
            'SELECT COUNT(*) AS total FROM usuarios WHERE rol = "admin" AND estado = "active"'
        );

        const [inactivos] = await pool.query(
            'SELECT COUNT(*) AS total FROM usuarios WHERE estado = "inactive"'
        );

        const [actividades] = await pool.query(`
            SELECT 
                DATE_FORMAT(creado_en, '%h:%i %p') AS hora,
                tipo,
                descripcion,
                usuario_id,
                modulo
            FROM actividad
            ORDER BY creado_en DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            stats: {
                usuarios: usuarios[0].total,
                instructores: instructores[0].total,
                estudiantes: estudiantes[0].total,
                administradores: admins[0].total,
                inactivos: inactivos[0].total
            },
            actividad: actividades
        });

    } catch (error) {
        console.error('❌ Error en dashboard:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener datos del dashboard'
        });
    }
});

// Ruta para agregar usuario
app.post('/api/usuarios', async (req, res) => {
    try {
        const {
            nombre,
            documento_identidad,
            email,
            telefono,
            contraseña,
            rol,
            estado,
            foto_url,
            departamento,
            ubicacion
        } = req.body;

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(contraseña, 10);

        await pool.query(
            `INSERT INTO usuarios 
            (nombre, documento_identidad, email, telefono, contraseña, rol, estado, foto_url, departamento, ubicacion, activo, creado_en, actualizado_en) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())`,
            [
                nombre,
                documento_identidad,
                email,
                telefono,
                hashedPassword,
                rol,
                estado,
                foto_url,
                departamento,
                ubicacion
            ]
        );

        res.json({ success: true, message: 'Usuario agregado correctamente' });
    } catch (error) {
        console.error('❌ Error al agregar usuario:', error);
        res.status(500).json({ success: false, error: 'Error al agregar usuario' });
    }
});

// Listar usuarios
app.get('/api/usuarios', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM usuarios ORDER BY creado_en DESC');
        res.json({ success: true, usuarios: rows });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al obtener usuarios' });
    }
});

// Eliminar usuario
app.delete('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Error al eliminar usuario' });
    }
});

// Obtener un usuario por id numérico
app.get('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📋 Buscando usuario con id:', id);

        const [rows] = await pool.query(
            'SELECT * FROM usuarios WHERE id = ?',
            [id]
        );

        if (rows.length > 0) {
            console.log('✅ Usuario encontrado:', rows[0]);
            res.json({ success: true, usuario: rows[0] });
        } else {
            console.log('❌ Usuario no encontrado');
            res.json({ success: false, error: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('❌ Error al obtener usuario:', error);
        res.status(500).json({ success: false, error: 'Error al obtener usuario' });
    }
});

// Actualizar usuario por id numérico
app.put('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            documento_identidad,
            email,
            telefono,
            rol,
            estado,
            departamento,
            ubicacion
        } = req.body;

        console.log('📝 Actualizando usuario con id:', id);
        console.log('📦 Datos nuevos:', req.body);

        const [result] = await pool.query(
            `UPDATE usuarios 
       SET nombre=?, documento_identidad=?, email=?, telefono=?, rol=?, estado=?, departamento=?, ubicacion=?, actualizado_en=NOW() 
       WHERE id=?`,
            [nombre, documento_identidad, email, telefono, rol, estado, departamento, ubicacion, id]
        );

        if (result.affectedRows > 0) {
            console.log('✅ Usuario actualizado correctamente');
            res.json({ success: true, message: 'Usuario actualizado correctamente' });
        } else {
            console.log('❌ No se encontró el usuario para actualizar');
            res.json({ success: false, error: 'Usuario no encontrado' });
        }
    } catch (error) {
        console.error('❌ Error al actualizar usuario:', error);
        res.status(500).json({ success: false, error: 'Error al actualizar usuario' });
    }
});

// Ruta de perfil
app.get('/api/perfil/:id', async (req, res) => {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM usuarios WHERE id = ?', [id]);
    if (rows.length > 0) {
        res.json({ success: true, usuario: rows[0] });
    } else {
        res.json({ success: false, error: 'Usuario no encontrado' });
    }
});

// Ruta de actividad
app.get('/api/actividad/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📋 Obteniendo actividad de usuario id:', id);

        const [actividades] = await pool.query(`
      SELECT 
        id,
        tipo,
        descripcion,
        modulo,
        creado_en
      FROM actividad
      WHERE usuario_id = ?
      ORDER BY creado_en DESC
      LIMIT 10
    `, [id]);

        console.log(`✅ ${actividades.length} actividades encontradas`);

        res.json({
            success: true,
            actividad: actividades
        });
    } catch (error) {
        console.error('❌ Error al obtener actividad:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener actividad del usuario'
        });
    }
});

// =======================
// ROLES API
// =======================

// GET: listar roles con permisos y usuarios
app.get('/api/roles', async (req, res) => {
    console.log('📡 Solicitud GET /api/roles recibida');

    try {
        // 1. Obtener todos los roles con COUNT de usuarios
        const [roles] = await pool.query(`
            SELECT 
                r.id, 
                r.nombre, 
                r.descripcion, 
                r.es_sistema,
                COUNT(u.id) AS totalUsuarios
            FROM roles r
            LEFT JOIN usuarios u ON LOWER(u.rol) = LOWER(r.nombre)
            GROUP BY r.id, r.nombre, r.descripcion, r.es_sistema
            ORDER BY r.id ASC
        `);

        console.log(`📦 Se encontraron ${roles.length} roles`);

        // Log detallado para cada rol
        roles.forEach(rol => {
            console.log(`  ➜ Rol: ${rol.nombre}, Usuarios: ${rol.totalUsuarios}`);
        });

        // 2. Para cada rol, obtener sus permisos
        for (let rol of roles) {
            const [permisos] = await pool.query(`
                SELECT 
                    modulo, 
                    permiso, 
                    descripcion, 
                    permitido
                FROM permisos
                WHERE rol_id = ?
                ORDER BY permitido DESC, modulo ASC
            `, [rol.id]);

            rol.permisos = permisos;
        }

        // 3. Enviar respuesta
        res.json({
            success: true,
            roles: roles,
            total: roles.length
        });

        console.log('✅ Roles enviados correctamente al cliente');

    } catch (err) {
        console.error('❌ Error al listar roles:', err);
        res.status(500).json({
            success: false,
            error: 'Error al obtener roles desde la base de datos',
            detalles: err.message
        });
    }
});

// POST: crear rol
app.post('/api/roles', async (req, res) => {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
        return res.status(400).json({ success: false, error: 'Nombre requerido' });
    }

    try {
        await pool.query(
            'INSERT INTO roles (nombre, descripcion, es_sistema, usuarios_asignados) VALUES (?, ?, FALSE, 0)',
            [nombre.toLowerCase(), descripcion || '']
        );
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Error al crear rol:', err);
        res.status(500).json({ success: false, error: 'Error al crear rol' });
    }
});

// DELETE: eliminar rol
app.delete('/api/roles/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const [rol] = await pool.query(
            'SELECT es_sistema FROM roles WHERE id = ?',
            [id]
        );

        if (!rol.length) {
            return res.status(404).json({ success: false, error: 'Rol no encontrado' });
        }

        if (rol[0].es_sistema) {
            return res.status(403).json({ success: false, error: 'Rol del sistema no eliminable' });
        }

        await pool.query('DELETE FROM roles WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error('❌ Error al eliminar rol:', err);
        res.status(500).json({ success: false, error: 'Error al eliminar rol' });
    }
});





// Ruta para verificar que el servidor funciona
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Servidor funcionando' });
});

// Para todas las demás rutas, servir login.html
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en: http://localhost:${PORT}`);
    console.log(`🔐 Login API: POST http://localhost:${PORT}/api/auth/login`);
});
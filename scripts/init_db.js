const pool = require('../config/db');

async function initDB() {
    try {
        console.log(`Connecting to database at ${process.env.DB_HOST} as ${process.env.DB_USER}...`);
        const connection = await pool.getConnection();
        console.log('Connected!');

        // Create table
        console.log('Creating table test_connection...');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS test_connection (
                id INT AUTO_INCREMENT PRIMARY KEY,
                message VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Table created.');

        // Insert data
        console.log('Inserting sample data...');
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM test_connection');

        if (rows[0].count === 0) {
            await connection.query(`
                INSERT INTO test_connection (message) VALUES 
                ('Hola Mundo desde la Base de Datos!'),
                ('Conexión exitosa con MySQL'),
                ('SICFOR está funcionando correctamente')
            `);
            console.log('Data inserted.');
        } else {
            console.log('Table already has data, skipping insertion.');
        }

        connection.release();
        console.log('Database initialization complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initDB();

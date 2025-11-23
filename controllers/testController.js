const pool = require('../config/db');

exports.getTestData = async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM test_connection');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching test data:', error);
        res.status(500).json({ error: 'Database error' });
    }
};

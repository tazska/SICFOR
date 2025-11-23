-- Script para inicializar la tabla de prueba en la base de datos SICFOR

USE SICFOR;

-- Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS test_connection (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos de prueba (solo si la tabla está vacía)
INSERT INTO test_connection (message)
SELECT * FROM (SELECT 'Hola Mundo desde la Base de Datos!') AS tmp
WHERE NOT EXISTS (
    SELECT message FROM test_connection WHERE message = 'Hola Mundo desde la Base de Datos!'
) LIMIT 1;

INSERT INTO test_connection (message)
SELECT * FROM (SELECT 'Conexión exitosa con MySQL') AS tmp
WHERE NOT EXISTS (
    SELECT message FROM test_connection WHERE message = 'Conexión exitosa con MySQL'
) LIMIT 1;

INSERT INTO test_connection (message)
SELECT * FROM (SELECT 'SICFOR está funcionando correctamente') AS tmp
WHERE NOT EXISTS (
    SELECT message FROM test_connection WHERE message = 'SICFOR está funcionando correctamente'
) LIMIT 1;

-- Verificar los datos
SELECT * FROM test_connection;

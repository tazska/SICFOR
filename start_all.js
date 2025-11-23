const { spawn } = require('child_process');

// Códigos de color ANSI
const colors = {
    reset: "\x1b[0m",
    bright: "\x1b[1m",
    dim: "\x1b[2m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    bgBlue: "\x1b[44m",
};

const log = (color, text) => console.log(`${color}${text}${colors.reset}`);

console.clear();
console.log('\n');
log(colors.bgBlue + colors.bright, '  🚀  SISTEMA INTEGRAL DE GESTIÓN (SICFOR)  🚀  ');
console.log('');

// 1. Inicializar Base de Datos
log(colors.cyan + colors.bright, '┌── 🗄️  PASO 1: BASE DE DATOS');
log(colors.dim, '│   Verificando conexión e inicializando tablas...');

const initDb = spawn('node', ['scripts/init_db.js'], { stdio: 'inherit', shell: true });

initDb.on('close', (code) => {
    if (code === 0) {
        log(colors.green + colors.bright, '│   ✅ Base de Datos lista y sincronizada.');
        console.log(colors.cyan + '└─────────────────────────────────────────────\n');

        // 2. Iniciar Servidor
        log(colors.magenta + colors.bright, '┌── 🌐 PASO 2: SERVIDOR BACKEND');
        log(colors.dim, '│   Iniciando servidor Express...');

        const server = spawn('node', ['server.js'], { stdio: 'inherit', shell: true });

        server.on('close', (code) => {
            console.log(`\nServidor detenido con código ${code}`);
        });

        // Mostrar URL de acceso
        setTimeout(() => {
            console.log('\n');
            log(colors.bgBlue + colors.bright, '  🔗  ACCEDE A TU APLICACIÓN:  ');
            log(colors.cyan + colors.bright, '  👉  http://localhost:8080  ');
            console.log('\n');
        }, 1000); // Pequeño delay para asegurar que salga al final
    } else {
        log(colors.red + colors.bright, '│   ❌ Error crítico en la Base de Datos.');
        console.log(colors.red + '└─────────────────────────────────────────────\n');
        log(colors.red, '⚠️  El servidor no se iniciará debido a errores previos.');
        process.exit(1);
    }
});

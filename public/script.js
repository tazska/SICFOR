// Configuración
const API_BASE_URL = window.location.origin; // http://localhost:8080

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
        console.log('✅ Formulario de login detectado');
        inicializarLogin();
    }
});

function inicializarLogin() {
    const form = document.getElementById('loginForm');
    const errorDiv = document.getElementById('error-message');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        
        // Limpiar error
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        
        // Validar
        if (!email || !password) {
            mostrarError('Por favor complete todos los campos');
            return;
        }
        
        // Mostrar loading
        loginBtn.disabled = true;
        loginBtn.textContent = 'Ingresando...';
        
        try {
            console.log('Enviando login a:', `${API_BASE_URL}/api/auth/login`);
            
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error desconocido');
            }
            
            if (data.success) {
                // Guardar token y datos
                localStorage.setItem('token', data.token);
                localStorage.setItem('usuario', JSON.stringify(data.usuario));
                
                console.log('✅ Login exitoso! Redirigiendo a dashboard...');
                
                // 🔥 Aquí está lo que pediste: redirigir al dashboard
                window.location.href = 'dashboard.html';
            } else {
                throw new Error(data.error || 'Error en el login');
            }
            
        } catch (error) {
            console.error('❌ Error:', error);
            mostrarError(error.message);
            
            // Restaurar botón
            loginBtn.disabled = false;
            loginBtn.textContent = 'INGRESAR AL SISTEMA';
        }
    });
}

function mostrarError(mensaje) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = mensaje;
        errorDiv.style.display = 'block';
    } else {
        alert(mensaje);
    }
}
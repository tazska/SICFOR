console.log('SICFOR Frontend Loaded');

async function testDBConnection() {
    const resultsDiv = document.getElementById('db-results');
    resultsDiv.innerHTML = 'Cargando...';

    try {
        const response = await fetch('/api/test-db');
        const data = await response.json();

        if (response.ok) {
            let html = '<ul style="list-style: none; padding: 0;">';
            data.forEach(item => {
                html += `<li style="background: rgba(255,255,255,0.9); color: #333; padding: 0.5rem; margin-bottom: 0.5rem; border-radius: 4px;">
                            <strong>ID:</strong> ${item.id} <br>
                            <strong>Mensaje:</strong> ${item.message} <br>
                            <small>${new Date(item.created_at).toLocaleString()}</small>
                         </li>`;
            });
            html += '</ul>';
            resultsDiv.innerHTML = html;
        } else {
            resultsDiv.innerHTML = `<p style="color: #ffcccc;">Error: ${data.error}</p>`;
        }
    } catch (error) {
        console.error('Error:', error);
        resultsDiv.innerHTML = '<p style="color: #ffcccc;">Error de conexión</p>';
    }
}

import localtunnel from 'localtunnel';

async function startTunnel() {
  try {
    const tunnel = await localtunnel({ 
      port: 3000, 
      subdomain: 'vecinos-app-demo' 
    });
    
    console.log('>>> TUNNEL LISTO: ' + tunnel.url);

    tunnel.on('close', () => {
      console.log('El túnel se cerró. Reconectando en 3s...');
      setTimeout(startTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('Error de túnel:', err.message);
      setTimeout(startTunnel, 3000);
    });
  } catch (err) {
    console.warn('Subdominio ocupado, generando URL dinámica...');
    try {
      const fallbackTunnel = await localtunnel({ port: 3000 });
      console.log('>>> TUNNEL LISTO: ' + fallbackTunnel.url);
      fallbackTunnel.on('close', () => setTimeout(startTunnel, 3000));
    } catch (e) {
      console.error('Fallo en túnel secundario:', e.message);
      setTimeout(startTunnel, 5000);
    }
  }
}

startTunnel();

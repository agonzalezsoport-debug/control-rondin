const express = require('express');
const path = require('path');
const { kv } = require('@vercel/kv'); // Base de datos en la nube integrada
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Función para leer registros desde la nube de forma asincrónica
async function leerRegistros() {
    try {
        const registros = await kv.get('registros_orbis');
        return registros || [];
    } catch (error) {
        console.error("Error al leer de Vercel KV:", error);
        return [];
    }
}

app.post('/api/fichar', async (req, res) => {
    const nuevoRegistro = req.body;
    if (!nuevoRegistro.guardia || !nuevoRegistro.punto) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    const historial = await leerRegistros();
    historial.unshift(nuevoRegistro);

    try {
        // Guarda en la nube de forma permanente
        await kv.set('registros_orbis', historial);
        return res.json({ success: true, mensaje: "Fichada guardada en la nube" });
    } catch (error) {
        console.error("Error al escribir en Vercel KV:", error);
        return res.status(500).json({ error: "Error interno al guardar" });
    }
});

app.get('/api/historial', async (req, res) => {
    const historial = await leerRegistros();
    res.json(historial);
});

app.delete('/api/historial', async (req, res) => {
    try {
        await kv.set('registros_orbis', []);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "No se pudo borrar el historial" });
    }
});

app.get('/:catchall*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor de Rondines corriendo en el puerto ${PORT}`);
});

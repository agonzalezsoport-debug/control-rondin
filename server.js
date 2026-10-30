const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de almacenamiento persistente en la carpeta de Render
const FILE_PATH = path.join('/data', 'registros.json');

app.use(express.json());

// Optimización de caché agresiva para que el frontend cargue de forma instantánea
app.use(express.static(__dirname, {
    maxAge: '1d',
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'public, max-age=86400, must-revalidate');
    }
}));

function leerRegistros() {
    try {
        // Si no existe la carpeta o el archivo en el volumen persistente, lo creamos
        if (!fs.existsSync('/data')) {
            fs.mkdirSync('/data', { recursive: true });
        }
        if (!fs.existsSync(FILE_PATH)) {
            fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
            return [];
        }
        const contenido = fs.readFileSync(FILE_PATH, 'utf-8');
        return contenido ? JSON.parse(contenido) : [];
    } catch (error) {
        console.error("Error al leer el archivo de registros:", error);
        return [];
    }
}

app.post('/api/fichar', (req, res) => {
    const nuevoRegistro = req.body;
    if (!nuevoRegistro.guardia || !nuevoRegistro.punto) {
        return res.status(400).json({ error: "Datos incompletos" });
    }

    const historial = leerRegistros();
    historial.unshift(nuevoRegistro);

    try {
        fs.writeFileSync(FILE_PATH, JSON.stringify(historial, null, 2), 'utf-8');
        return res.json({ success: true, mensaje: "Fichada guardada en Render de forma segura" });
    } catch (error) {
        console.error("Error al escribir el archivo de registros:", error);
        return res.status(500).json({ error: "Error interno al guardar" });
    }
});

app.get('/api/historial', (req, res) => {
    res.json(leerRegistros());
});

app.delete('/api/historial', (req, res) => {
    try {
        fs.writeFileSync(FILE_PATH, JSON.stringify([], null, 2), 'utf-8');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "No se pudo borrar el historial" });
    }
});

app.get('/:catchall*', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor de Rondines corriendo en el puerto ${PORT}`);
});

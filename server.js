const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

const FILE_PATH = path.join(__dirname, 'registros.json');

app.use(express.json());
app.use(express.static(__dirname));

function leerRegistros() {
    try {
        if (!fs.existsSync(FILE_PATH)) return [];
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
        return res.json({ success: true, mensaje: "Fichada guardada en el servidor" });
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

// CORRECCIÓN ABSOLUTA: Se utiliza una ruta válida para versiones modernas de Express/Path-to-RegExp
app.get('/:catchall*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor de Rondines corriendo en el puerto ${PORT}`);
});

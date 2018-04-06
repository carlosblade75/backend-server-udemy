var express = require('express');
var fileUpload = require('express-fileupload');
var fs = require('fs'); // file system

var app = express();

var Usuario = require('../models/usuario');
var Hospital = require('../models/hospital');
var Medico = require('../models/medico');

// default options -- middleware
app.use(fileUpload());

app.put('/:tipo/:id', (req, res, next) => {

    var tipo = req.params.tipo;
    var ID = req.params.id;

    var tiposValidos = ['usuarios', 'medicos', 'hospitales'];

    if (tiposValidos.indexOf(tipo.toLowerCase()) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Tipo de colección no válida.',
            errors: { message: 'Los tipos válidos son ' + tiposValidos.join(', ') }
        });
    }

    if (!req.files) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No seleccionó nada.',
            errors: { message: 'Debe seleccionar una imagen' }
        });
    }

    // Obtener nombre el archivo

    var archivo = req.files.imagen;
    var nombreCortado = archivo.name.split('.');
    var extensionArchivo = nombreCortado[nombreCortado.length - 1];

    // Solo estas extensiones acceptamos

    var extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

    if (extensionesValidas.indexOf(extensionArchivo.toLowerCase()) < 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Extensión no válida.',
            errors: { message: 'Las extensiones válidas son ' + extensionesValidas.join(', ') }
        });
    }

    // Crear nombre archivo personalizado
    // El formato será: Id usuario y número random para evitar el cache del navegador y extensión: 123456789-123.png

    var nombreArchivo = `${ ID }-${ new Date().getMilliseconds() }.${ extensionArchivo }`;

    // Mover el archivo

    var path = `./uploads/${ tipo }/${ nombreArchivo }`;

    archivo.mv(path, err => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al mover archivo',
                errors: err
            });
        }

        subirPorTipo(tipo, ID, nombreArchivo, res);

    });

});

function subirPorTipo(tipo, id, nombreArchivo, res) {

    if (tipo === 'usuarios') {

        Usuario.findById(id, (err, usuario) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'El usuario no existe',
                    errors: err
                });
            }

            if (usuario.img) {

                var oldPath = './uploads/usuarios/' + usuario.img;

                // si existe el archivo de bbdd lo elimina con unlink
                if (fs.existsSync(oldPath)) {
                    fs.unlink(oldPath);
                }
            }

            usuario.img = nombreArchivo;

            usuario.save((err, usuarioActualizado) => {

                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al actualizar el usuario.',
                        errors: err
                    });
                }

                usuarioActualizado.password = ':)';

                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de usuario actualizada correctamente.',
                    usuarioActualizado: usuarioActualizado
                });
            });
        });

        return;
    }

    if (tipo === 'medicos') {

        Medico.findById(id, (err, medico) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'El medico no existe',
                    errors: err
                });
            }

            if (medico.img) {

                var oldPath = './uploads/medicos/' + medico.img;

                // si existe el archivo de bbdd lo elimina con unlink
                if (fs.existsSync(oldPath)) {
                    fs.unlink(oldPath);
                }
            }

            medico.img = nombreArchivo;

            medico.save((err, medicoActualizado) => {

                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al actualizar el medico.',
                        errors: err
                    });
                }

                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de medico actualizada correctamente.',
                    medicoActualizado: medicoActualizado
                });
            });
        });

        return;
    }

    if (tipo === 'hospitales') {

        Hospital.findById(id, (err, hospital) => {

            if (err) {
                return res.status(500).json({
                    ok: false,
                    mensaje: 'El hospital no existe',
                    errors: err
                });
            }

            if (hospital.img) {

                var oldPath = './uploads/hospitales/' + hospital.img;

                // si existe el archivo de bbdd lo elimina con unlink
                if (fs.existsSync(oldPath)) {
                    fs.unlink(oldPath);
                }
            }

            hospital.img = nombreArchivo;

            hospital.save((err, hospitalActualizado) => {

                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al actualizar el hospital.',
                        errors: err
                    });
                }

                return res.status(200).json({
                    ok: true,
                    mensaje: 'Imagen de hospital actualizada correctamente.',
                    hospitalActualizado: hospitalActualizado
                });
            });
        });

        return;
    }
}

module.exports = app;
var express = require('express');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

var middWaAutenticacion = require('../middlewares/autenticacion');

var app = express();

var Usuario = require('../models/usuario');

//=================================================
// Obtener todos los usuarios
//=================================================

app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Usuario.find({}, 'nombre email img role google')
        .skip(desde)
        .limit(5)
        .exec(
            (err, usuarios) => {

                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error cargando usuarios.',
                        errors: err
                    });
                }

                Usuario.count({}, (err, conteo) => {
                    return res.status(200).json({
                        ok: true,
                        usuarios: usuarios,
                        total: conteo
                    });
                });
            });
});

//=================================================
// Crear nuevo usuario
//=================================================
//app.post('/', middWaAutenticacion.verificaToken, (req, res) => {

app.post('/', (req, res) => {

    var body = req.body;

    var usuario = new Usuario({
        nombre: body.nombre,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        img: body.img,
        role: body.role
    });

    usuario.save((err, usuarioGuardado) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear usuario.',
                errors: err
            });
        }

        return res.status(201).json({
            ok: true,
            usuario: usuarioGuardado,
            usuarioToken: req.usuario
        });
    });

});

//=================================================
// Actualizar un usuario por ID
//=================================================

app.put('/:id', [middWaAutenticacion.verificaToken, middWaAutenticacion.verificaADMIN_o_MismoUsuario], (req, res) => {

    var id = req.params.id;

    var body = req.body;

    Usuario.findById(id, (err, usuario) => {

        if (err) {

            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar al usuario.',
                errors: err
            });
        }

        if (!usuario) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El usuario con el id ' + id + ' no existe.',
                errors: { message: 'No existe un usuario con es ID.' }
            });
        }

        usuario.nombre = body.nombre;
        usuario.email = body.email;
        usuario.role = body.role;

        usuario.save((err, usuarioGuardado) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar el usuario.',
                    errors: err
                });
            }

            return res.status(200).json({
                ok: true,
                usuario: usuarioGuardado
            });

        });
    });

});

//=================================================
// Borrar un usuario por ID
//=================================================

app.delete('/:id', middWaAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Usuario.findByIdAndRemove(id, (err, usuarioBorrado) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al borrar el usuario.',
                errors: err
            });
        }

        if (!usuarioBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe un usuario con ese ID.',
                errors: { message: 'No existe un usuario con es ID.' }
            });
        }

        return res.status(200).json({
            ok: true,
            usuario: usuarioBorrado
        });

    });
});

module.exports = app;
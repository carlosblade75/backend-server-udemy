var express = require('express');

var middWaAutenticacion = require('../middlewares/autenticacion');

var app = express();

var Medico = require('../models/medico');


//=================================================
// Obtener todos los medicos
//=================================================

app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Medico.find({})
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre email')
        .populate('hospital', 'nombre usuario')
        .exec(
            (err, medicos) => {

                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error cargando medicos.',
                        errors: err
                    });
                }


                Medico.count({}, (err, conteo) => {
                    return res.status(200).json({
                        ok: true,
                        medicos: medicos,
                        total: conteo
                    });
                });
            });
});

//=================================================
// Crear nuevo medico
//=================================================

app.post('/', middWaAutenticacion.verificaToken, (req, res) => {

    var body = req.body;

    var medico = new Medico({
        nombre: body.nombre,
        usuario: req.usuario._id,
        hospital: body.hospital
    });

    medico.save((err, medicoGuardado) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear un medico.',
                errors: err
            });
        }

        return res.status(201).json({
            ok: true,
            medico: medicoGuardado,
            medicoToken: req.medico
        });
    });
});


//=================================================
// Actualizar un medico por ID
//=================================================

app.put('/:id', middWaAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    var body = req.body;

    Medico.findById(id, (err, medico) => {

        if (err) {

            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar el medico.',
                errors: err
            });
        }

        if (!medico) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El medico con el id ' + id + ' no existe.',
                errors: { message: 'No existe un medico con es ID.' }
            });
        }

        medico.nombre = body.nombre;
        medico.usuario = body.usuario;
        medico.hospital = body.hospital;

        medico.save((err, medicoGuardado) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar el medico.',
                    errors: err
                });
            }

            return res.status(200).json({
                ok: true,
                medico: medicoGuardado
            });

        });
    });

});

//=================================================
// Borrar un medico por ID
//=================================================

app.delete('/:id', middWaAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Medico.findByIdAndRemove(id, (err, medicoBorrado) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al borrar el medico.',
                errors: err
            });
        }

        if (!medicoBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe un medico con ese ID.',
                errors: { message: 'No existe un medico con es ID.' }
            });
        }

        return res.status(200).json({
            ok: true,
            medico: medicoBorrado
        });

    });
});

module.exports = app;
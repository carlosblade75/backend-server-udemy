var express = require('express');

var middWaAutenticacion = require('../middlewares/autenticacion');

var app = express();

var Hospital = require('../models/hospital');


//=================================================
// Obtener todos los hospitales
//=================================================

app.get('/', (req, res, next) => {

    var desde = req.query.desde || 0;
    desde = Number(desde);

    Hospital.find({})
        .skip(desde)
        .limit(5)
        .populate('usuario', 'nombre email')
        .exec(
            (err, hospitales) => {

                if (err) {
                    return res.status(500).json({
                        ok: false,
                        mensaje: 'Error cargando hospitales.',
                        errors: err
                    });
                }

                Hospital.count({}, (err, conteo) => {
                    return res.status(200).json({
                        ok: true,
                        hospitales: hospitales,
                        total: conteo
                    });
                });
            });
});

//=================================================
// Crear nuevo hospital
//=================================================

app.post('/', middWaAutenticacion.verificaToken, (req, res) => {

    var body = req.body;

    var hospital = new Hospital({
        nombre: body.nombre,
        usuario: req.usuario._id
    });

    hospital.save((err, hospitalGuardado) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Error al crear un hospital.',
                errors: err
            });
        }

        return res.status(201).json({
            ok: true,
            hospital: hospitalGuardado
        });
    });
});

//=================================================
// Actualizar un hospital por ID
//=================================================

app.put('/:id', middWaAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    var body = req.body;

    Hospital.findById(id, (err, hospital) => {

        if (err) {

            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar el hospital.',
                errors: err
            });
        }

        if (!hospital) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El hospital con el id ' + id + ' no existe.',
                errors: { message: 'No existe un hospital con es ID.' }
            });
        }

        hospital.nombre = body.nombre;

        hospital.save((err, hospitalGuardado) => {

            if (err) {
                return res.status(400).json({
                    ok: false,
                    mensaje: 'Error al actualizar el hospital.',
                    errors: err
                });
            }

            return res.status(200).json({
                ok: true,
                hospital: hospitalGuardado
            });

        });
    });

});

//=================================================
// Borrar un hospital por ID
//=================================================

app.delete('/:id', middWaAutenticacion.verificaToken, (req, res) => {

    var id = req.params.id;

    Hospital.findByIdAndRemove(id, (err, hospitalBorrado) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al borrar el hospital.',
                errors: err
            });
        }

        if (!hospitalBorrado) {
            return res.status(400).json({
                ok: false,
                mensaje: 'No existe un hospital con ese ID.',
                errors: { message: 'No existe un hospital con es ID.' }
            });
        }

        return res.status(200).json({
            ok: true,
            hospital: hospitalBorrado
        });

    });
});

module.exports = app;
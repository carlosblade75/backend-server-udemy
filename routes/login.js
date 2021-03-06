var express = require('express');
var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

var app = express();

var Usuario = require('../models/usuario');

var mdAutenticacion = require('../middlewares/autenticacion');

// =================================================
// Renueva token
// =================================================

app.get('/renuevatoken', mdAutenticacion.verificaToken, (req, res) => {
	
		var token = jwt.sign({ usuario: req.usuario }, SEED, { expiresIn: 14400 }); // 4 horas en segundos
		
		return res.status(200).json({
		ok: true,
		token: token
    });
});
	
// =================================================
// Autentiicación Google
// =================================================

var CLIENT_ID = require('../config/config').CLIENT_ID;

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

async function verify(token) {

    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });


    const payload = ticket.getPayload();
    //const userid = payload['sub'];
    // If request specified a G Suite domain:
    //const domain = payload['hd'];

    return {
        nombre: payload.name,
        email: payload.email,
        img: payload.picture,
        google: true
    }
}

app.post('/google', async(req, res) => {

    var token = req.body.token;

    var googleuser = await verify(token)
        .catch(e => {
            return res.status(403).json({
                ok: false,
                mensaje: 'Token no válido'
            });
        });

    Usuario.findOne({ email: googleuser.email }, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario.',
                errors: err
            });
        }

        if (usuarioDB) {

            if (usuarioDB.google === false) {

                return res.status(400).json({
                    ok: false,
                    mensaje: 'Debe usar su autenticación normal.'
                });

            } else {

                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas en segundos

                return res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id,
					menu: obtenerMenu(usuarioDB.role)
                });
            }
        } else {

            //El usuario no existe. Debemos crearlo

            var usuario = new Usuario();

            usuario.nombre = googleuser.nombre;
            usuario.email = googleuser.email;
            usuario.img = googleuser.img;
            usuario.google = true;
            usuario.password = ':)';

            usuario.save((err, usuarioDB) => {

                if (err) {
                    return res.status(400).json({
                        ok: false,
                        mensaje: 'Error al crear usuario.',
                        errors: err
                    });
                }

                var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas en segundos

                return res.status(200).json({
                    ok: true,
                    usuario: usuarioDB,
                    token: token,
                    id: usuarioDB._id,
					menu: obtenerMenu(usuarioDB.role)
                });

            });
        }

    });

    // return res.status(200).json({
    //     ok: true,
    //     mensaje: 'OK!!!!',
    //     googleuser: googleuser
    // });

});

// =================================================
// Autentiicación normal
// =================================================
app.post('/', (req, res) => {

    var body = req.body;

    Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al buscar usuario.',
                errors: err
            });
        }

        if (!usuarioDB) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - email.',
                errors: err
            });
        }

        if (!bcrypt.compareSync(body.password, usuarioDB.password)) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Credenciales incorrectas - password.',
                errors: err
            });
        }

        // Crear un token!!
        usuarioDB.password = ':)'; // asi no mandamos la contraseña en el token

        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas en segundos

        return res.status(200).json({
            ok: true,
            usuario: usuarioDB,
            token: token,
            id: usuarioDB._id,
			menu: obtenerMenu(usuarioDB.role)
        });

    });

});

function obtenerMenu( role) {
	
	var menu = [
    {
      titulo: 'Principal',
      icono: 'mdi mdi.gauge',
      submenu: [
        { titulo: 'Dashboard', url: '/dashboard'},
        { titulo: 'ProgressBar', url: '/progress'},
        { titulo: 'Gráficas', url: '/graficas1'},
        { titulo: 'Promesas', url: '/promesas'},
        { titulo: 'Ajustes', url: '/account-settings'},
        { titulo: 'RxJS', url: '/rxjs'}
      ]
    },
    {
      titulo: 'Mantenimientos',
      icono: 'mdi mdi-folder-lock-open',
      submenu: [
        // { titulo: 'Usuarios', url: '/usuarios'},
        { titulo: 'Hospitales', url: '/hospitales'},
        { titulo: 'Medicos', url: '/medicos'}
      ]
    }
  ];
  
  if ( role === 'ADMIN_ROLE') {
	  // unshift te pone el item al principio
	  menu[1].submenu.unshift( { titulo: 'Usuarios', url: '/usuarios'} );
  }
  
  return menu;
  
}

module.exports = app;
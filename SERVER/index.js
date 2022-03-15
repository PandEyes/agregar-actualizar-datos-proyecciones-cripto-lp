require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const app = express();
const mysql = require('mysql2');
const { database } = require('./keys');
const {google} = require('googleapis');
const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets"
});
const PUERTO = 4300;

app.use(morgan('dev'));

app.get('/', async function (solicitud, respuesta) {
    const conexion = mysql.createConnection({
        host: database.host,
        user: database.user,
        password: database.password,
        port: database.port,
        database: database.database
    });
    const spreadsheetId = process.env.SPREADSHEET_ID;
    const client = await auth.getClient();
    const googleSheet = google.sheets({ version: 'v4', auth: client });
    var arreglo = [];
    var request = (await googleSheet.spreadsheets.values.get({
                auth,
                spreadsheetId,
                range: `${process.env.ID_HOJA}`
            })).data;
    var recogerDatos = request.values;
    let sql = `SELECT * FROM ${process.env.TABLE_CRIPTO}`;
    conexion.query(sql, function (err, resultado) {
        if (err) throw err;
        if (resultado.length > 0) {
            actualizarDatos(recogerDatos);
        }else {
            agregarDatos(recogerDatos);
        }
    });

    function agregarDatos(recogerDatos) {
        for(i = 0; i < recogerDatos.length; i++){
            var cripto = recogerDatos[i][0].toString();
            var fecha = recogerDatos[i][1].toString();
            var precio = parseFloat(recogerDatos[i][2]);
            var forecast = parseFloat(recogerDatos[i][3]);
            var optimista = parseFloat(recogerDatos[i][4]);
            var pesimista = parseFloat(recogerDatos[i][5]);
            arreglo.push([cripto, fecha, precio, forecast, optimista, pesimista]);
        };
        let sql = `INSERT INTO ${process.env.TABLE_CRIPTO} (cripto, fecha, precio, forecast, optimista, pesimista) VALUES ?`;
        conexion.query(sql, [arreglo], function (err, resultado) {
            if (err) throw err;
            console.log(resultado);
            conexion.end();
        });
    };
    function actualizarDatos(recogerDatos) {
        let sql = `DELETE FROM ${process.env.TABLE_CRIPTO}`;
        let sql2 = `ALTER TABLE ${process.env.TABLE_CRIPTO} AUTO_INCREMENT=1`;
        conexion.query(sql, function (err, resultado) {
            if (err) throw err;
            console.log(resultado);
        });
        conexion.query(sql2, function (err, resultado) {
            if (err) throw err;
            console.log(resultado);
        });
        for(i = 0; i < recogerDatos.length; i++){
            var cripto = recogerDatos[i][0].toString();
            var fecha = recogerDatos[i][1].toString();
            var precio = parseFloat(recogerDatos[i][2]);
            var forecast = parseFloat(recogerDatos[i][3]);
            var optimista = parseFloat(recogerDatos[i][4]);
            var pesimista = parseFloat(recogerDatos[i][5]);
            arreglo.push([cripto, fecha, precio, forecast, optimista, pesimista]);
        };
        let sql3 = `INSERT INTO ${process.env.TABLE_CRIPTO} (cripto, fecha, precio, forecast, optimista, pesimista) VALUES ?`;
        conexion.query(sql3, [arreglo], function (err, resultado) {
            if (err) throw err;
            console.log(resultado);
            conexion.end();
        });
    };
    respuesta.send("OK");
});

app.listen(PUERTO || process.env.PORT, () => {
    console.log(`Escuchando en el puerto ${PUERTO || process.env.PORT}`);
});

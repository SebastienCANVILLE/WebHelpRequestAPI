// imports
const express = require('express');
const bodyParser = require('body-parser');
const { Client } = require('pg');
const fs = require('fs'); // permet a node de lire des fichiers
require('dotenv').config()

// declarations
const app = express();
const port = 8000;
const client = new Client({
    user: process.env.DB_USERNAME,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME, 
    password: process.env.DB_PASSWORD,
    port: 5432,
});

client.connect();

app.use(express.json());

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
// routes

app.get('/api/tickets', async (req, res) => {
    try {
        const data = await client.query('SELECT * FROM tickets');

        res.status(200).json({
            status: 'OK',
            data: data.rows,
            message: "liste des tickets"
        });
    }
    catch (err) {
        console.log(err.stack)
        res.status(500).json({
            status: 'FAIL',
            data: undefined,
            message: "une erreur est survenue"
        });
    }
})

app.get('/api/tickets/:id', async (req, res) => {
    console.log(req.params)
    const id = req.params.id;

    try {
        const data = await client.query("SELECT * FROM tickets where ticket_id = $1", [id]);

        if (data.rowCount > 0) {
            res.status(200).json({
                status: "OK",
                data: data.rows,
                message: "TICKET CLIENT",
            });

            return;
        }

        res.status(404).json({
            status: "FAIL",
            data: undefined,
            message: "le ticket n'existe pas",
        });


    } catch (err) {
        console.log(err.stack);
        res.status(404).json({
            status: "FAIL",
            data: undefined,
            message: "erreur serveur",
        });
    }
});

app.post('/api/tickets', async (req, res) => {
    console.log(req.body);
    const message = req.body.message;

    if (typeof message !== 'string') { //créer la condition avant le try car il doit vérifier la condition avant de requeter soit vérification + SEND
        res.status(400).json({
            status: 'FAIL',
            data: undefined,
            message: "erreur de structure"
        });

        return;
    }

    try {
        const data = await client.query('INSERT INTO tickets (message, done) VALUES ($1, $2) RETURNING *', [message, false]); // done est créé avec une valeur par défautl false, plus besoin de le créé par une const, il va chercher la valeur dans INSERT TO

        res.status(201).json({
            status: "OK",
            data: data.rows[0],  // sachant qu'il fait un RETURNING du post créé, il ne retourne que sa valeur du ticket et de ses données grâce à [0]
            message: "le ticket a été crée"
        });

    }
    catch (err) {
        console.log(err.stack)
        res.status(404).json({
            status: 'Fail',
            data: undefined,
            message: "Erreur de status"
        });

    }
})

app.put('/api/tickets', async (req, res) => {
    // console.log(req.params);
    const { id, message, done } = req.body;

    if (typeof id !== 'number' || typeof message !== 'string' || typeof done !== 'boolean') { // permet de vérifier que la structure est correct
        res.status(400).json({
            status: 'FAIL',
            data: undefined,
            message: "erreur de structure"
        });
    }

    // check ticket
    const isTicketExist = await client.query('SELECT * FROM tickets WHERE ticket_id = $1', [id]); // permet de vérifier que l'id existe pour pouvoir modifier le ticket sinon il renvoi une erreur
    console.log(isTicketExist);

    if (isTicketExist.rows.length === 0) {
        res.status(404).json({
            status: 'FAIL',
            data: undefined,
            message: "Le ticket n'existe pas"
        });

        return;
    }

    //console.log(isTicketExist.rows[0].done);

    const data = await client.query('UPDATE tickets SET message = $2, done = $3 WHERE ticket_id = $1 RETURNING *;', [id, message, done]);

    if (data.rowCount === 1) {
        res.json({
            status: 'OK',
            data: data.rows[0],
            message: "edition ok"
        })
    }
    else {
        res.json({ done: false })
    }
})

app.delete('/api/tickets/:id', async (req, res) => {
    console.log(req.params);
    const id = req.params.id;

    const data = await client.query('DELETE FROM tickets WHERE ticket_id = $1', [id]);

    if (data.rowCount === 1) {
        //res.json({ deleted: true });
        res.status(200).json({
            status: 'OK',
            data: data.rows[0],
            message: "ticket supprimé"
        });
    }

    else {
        // res.json({ deleted: false });
        res.status(404).json({
            status: 'FAIL',
            data: data.rows[0],
            message: "Le ticket n'existe pas"
        });
    }
})





// ecoute le port 8000
app.listen(port, () => {
    console.log(`Example app listening on port http://localhost:${port}`)
})
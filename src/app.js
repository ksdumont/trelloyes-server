require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const {NODE_ENV} = require('./config')
const uuid = require('uuid/v4');
const cardRouter = require('./card/card-router');

const app = express()

const morganOption = (NODE_ENV === 'production') ? 'tiny' : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
app.use(express.json());


app.use(function validateBearerToken(req, res, next) {
    const apiToken = process.env.API_TOKEN;
    const authToken = req.get('Authorization');

    if (!authToken || authToken.split(' ')[1] !== apiToken) {
        logger.error(`Unauthorized request to path: ${req.path}`);
        return res.status(401).json({error: 'Unauthorized request'});
    }
    next();
})

app.use(cardRouter);


app.get('/list', (req, res) => {
    res.json(lists);
});

   

app.get('/list/:id', (req, res) => {
    const {id} = req.params;
    const list = lists.find(li => li.id == id);

    if (!list) {
        logger.error(`List with id ${id} not found.`);
        return res.status(404).send('List Not Found');
    }
    res.json(list);
});

// POST

app.post('/list', (req, res) => {
    const {header, cardIds = []} = req.body;

    if (!header) {
        logger.error(`Header is required`);
        return res.status(400).send('Invalid data');
    }
    if (cardIds.length > 0) {
        let valid = true;
        cardIds.forEach(cid => {
            const card = cards.find(c => c.id == cid);
            if (!card) {
                logger.error(`Card with id ${cid} not found in cards array.`);
                valid = false;
            }
        });
        if (!valid) {
            return res.status(400).send('Invalid data');
        }
    }
    const id = uuid();
    const list = {
        id, 
        header, 
        cardIds
    };
    lists.push(list);
    logger.info(`List with id ${id} created`);
    res.status(201).location(`http://localhost:8000/list/${id}`).json({id});
});

// Delete

app.delete('/list/:id', (req, res) => {
    const {id} = req.params;
    const listIndex = lists.findIndex(li => li.id == id);

    if (listIndex === -1) {
        logger.error(`List with id ${id} not found.`);
        return res.status(404).send('Not Found');
    }
    lists.splice(listIndex, 1);

    logger.info(`List with id ${id} deleted.`);
    res.status(204).end();
})


app.use(function errorHandler(error, req, res, next) {
    let response;
    if (NODE_ENV === 'production') {
        response = {error: {message: 'server error'}}
    } else {
        console.error(error)
        response = {message: error.message, error}
    }
    res.status(500).json(response)
})

module.exports = app
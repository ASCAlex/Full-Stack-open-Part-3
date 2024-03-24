require('dotenv').config()
const express = require("express")
const {request, json} = require("express");
const app = express()
const morgan = require("morgan")
const cors = require('cors')
const Entry = require('./models/entry')

app.use(cors())
app.use(express.json());
app.use(express.static('dist'))
app.use(morgan('tiny', {
    skip: function (req, res) { return req.method === 'POST' }
}))
app.use(morgan(":method :url :status :res[content-length] - :response-time ms :post-info", {
    skip: function (req, res) { return req.method !== 'POST' }
}))

morgan.token('post-info', (req, res) => {
    return JSON.stringify(req.body)
})


let persons = [
    {
        "id": 1,
        "name": "Arto Hellas",
        "number": "040-123456"
    },
    {
        "id": 2,
        "name": "Ada Lovelace",
        "number": "39-44-5323523"
    },
    {
        "id": 3,
        "name": "Dan Abramov",
        "number": "12-43-234345"
    },
    {
        "id": 4,
        "name": "Mary Poppendieck",
        "number": "39-23-6423122"
    }
]

app.get('', (request, response) => {
    response.send('<h1>Welcome, go to <a href="http://localhost:3001/api/persons">api/persons</a></h1>')
})

app.get('/api/info', (request, response) => {
    const personCount = persons.length
    const time = new Date()
    response.send(`<p>Phonebook has info for ${personCount} people<br/>${time}</p>`)
})

app.get('/api/persons', (request, response) => {
    Entry.find({}).then(entries => {
        response.json(entries)
    })
    .catch(error => {
        console.error('Error fetching phonebook entries:', error);
        response.status(500).json({ error: 'Internal server error' }); // Fehlerbehandlung
    });
})

app.get('/api/persons/:id', (request, response, next) => {
    Entry.findById(request.params.id)
        .then(entry => {
            if (entry) {
                response.json(entry)
            } else {
                response.status(404).end()
            }
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Entry.findByIdAndDelete(request.params.id)
        .then(result => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

app.post('/api/persons', (request, response) => {
    const body = request.body
    if (!body.name || !body.number) {
        return response.status(400).json({
            error: 'name or number is missing'
        })
    }
    /*
    if (persons.find(p => p.name.toLowerCase() === body.name.toLowerCase())) {
        return response.status(400).json({
            error: 'name must be unique'
        })
    }
    */

    const entry = new Entry({
        name: body.name,
        number: body.number
    })

    entry.save().then(savedEntry => {
        response.json(savedEntry)
    })
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body

    const updatedEntry = new Entry( {
        _id: request.params.id,
        name: body.name,
        number: body.number
    })

    Entry.findByIdAndUpdate(request.params.id, updatedEntry, {new: true})
        .then(updatedEntry => {
            response.json(updatedEntry)
        })
        .catch(error => next(error))
})

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on Port ${PORT}`)
})

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    }

    next(error)
}

app.use(errorHandler)
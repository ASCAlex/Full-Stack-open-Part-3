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

app.get('', (request, response) => {
    response.send('<h1>Welcome, go to <a href="http://localhost:3001/api/persons">api/persons</a></h1>')
})

app.get('/api/info', (request, response, next) => {
    const time = new Date()
    Entry.countDocuments()
        .then(personCount => {
            response.send(`<p>Phonebook has info for ${personCount} people<br/>${time}</p>`)
        })
        .catch(error => next(error))
})

app.get('/api/persons', (request, response) => {
    Entry.find({}).then(entries => {
        response.json(entries)
    })
    .catch(error => {
        console.error('Error fetching phonebook entries:', error);
        response.status(500).json({ error: 'Internal server error' });
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

app.post('/api/persons', (request, response, next) => {
    const { name, number } = request.body

    const entry = new Entry({
        name: name,
        number: number
    })

    entry.save()
        .then(savedEntry => {
            response.json(savedEntry)
        })
        .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body

    const updatedEntry = new Entry( {
        _id: request.params.id,
        name: body.name,
        number: body.number
    })

    Entry.findByIdAndUpdate(request.params.id, updatedEntry, {new: true, runValidators: true, context: 'query'})
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
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({error: error.message})
    }

    next(error)
}

app.use(errorHandler)
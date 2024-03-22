const mongoose = require('mongoose')

if (process.argv.length < 3) {
    console.log('give password as argument')
    process.exit(1)
}

const password = process.argv[2]

const url =
    `mongodb+srv://scheickalex:${password}@cluster0.navyvdc.mongodb.net/phonebook?retryWrites=true&w=majority&appName=phonebook`

mongoose.set('strictQuery', false)

mongoose.connect(url)

const phonebookSchema = new mongoose.Schema( {
    name: String,
    number: String
})

const PhonebookEntry = mongoose.model('Entry', phonebookSchema)

if (process.argv.length < 4) {
    PhonebookEntry.find({}).then(result => {
        console.log("phonebook:")
        result.forEach(entry => {
            console.log(entry.name + " " + entry.number)
        })
        mongoose.connection.close()
    })
} else {
    const entry = new PhonebookEntry({
        name: process.argv[3],
        number: process.argv[4],
    })

    entry.save().then(result => {
        console.log(`added ${process.argv[3]} number ${process.argv[4]} to phonebook`)
        mongoose.connection.close()
    })
}
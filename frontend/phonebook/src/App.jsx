import { useState, useEffect } from 'react'
import axios from "axios";
import personService from './services/persons.js'

const Filter = ({newFilter, handleFilterChange}) => {
    return (
        <>
            filter shown with <input value={newFilter} onChange={handleFilterChange}/>
        </>
    )
}

const PersonForm = ({addEntry, newName, newNumber, handleNameChange, handleNumberChange}) => {
    return(
        <form onSubmit={addEntry}>
            <div>
                name: <input value={newName} onChange={handleNameChange}/>
            </div>
            <div>
                number: <input value={newNumber} onChange={handleNumberChange}/>
            </div>
            <div>
                <button type="submit">add</button>
            </div>
        </form>
    )
}

const Persons = ({persons, newFilter, Person}) => {
    return (
        <p>
            {persons.filter(person =>
                person.name.toLowerCase().includes(newFilter.toLowerCase().trim())
            ).map(person =>
                <Person key={person.name} person={person} />
            )}
        </p>
    )
}

const App = () => {
    const [persons, setPersons] = useState([])
    const [newName, setNewName] = useState('')
    const [newNumber, setNewNumber] = useState('')
    const [newFilter, setNewFilter] = useState('')
    const [notificationMessage, setNotificationMessage] = useState(null)
    const [notificationColor, setNotificationColor] = useState('')

    useEffect(() => {
        console.log('effect')
        personService.getAll()
            .then(response => {
                setPersons(response)
            })
    }, [])
    console.log('render', persons.length, 'persons')

    const addEntry = (event) => {
        event.preventDefault()
        const phonebookEntry = { name: newName, number: newNumber}
        const checkEqual = persons.some((person) => person.name.toLowerCase() === phonebookEntry.name.toLowerCase())
        if (checkEqual) {
            if (window.confirm(`${newName} is already added to phonebook, replace the old number with a new one?`)) {
                const oldEntry = persons.find(p => p.name.toLowerCase() === phonebookEntry.name.toLowerCase())
                const newObject = { ...oldEntry, number: phonebookEntry.number}
                personService.update(oldEntry.id, newObject)
                    .then(returnedPerson => {
                        setPersons(persons.map(p => p.id !== oldEntry.id ? p : returnedPerson))
                        setNotificationMessage(
                            `Changed number of ${oldEntry.name}`
                        )
                        setNotificationColor('green')
                        setTimeout(() => {
                            setNotificationMessage(null)
                        }, 5000)
                    })
                    .catch( error => {
                        setNotificationMessage(
                            `Information of ${phonebookEntry.name} has already been removed from server`
                        )
                        setNotificationColor('red')
                        setPersons(persons.filter(p => p.id !== oldEntry.id))
                    })
            }
        } else {
            personService.create(phonebookEntry)
                .then(returnedPerson => {
                    setPersons(persons.concat(returnedPerson))
                    setNotificationMessage(
                        `Added ${phonebookEntry.name}`
                    )
                    setNotificationColor('green')
                    setTimeout(() => {
                        setNotificationMessage(null)
                    }, 5000)
                })
                .catch(error => {
                    setNotificationMessage(error.response.data.error)
                    console.log(error.response.data.error)
                })
        }
        setNewName('')
        setNewNumber('')
    }

    const deleteEntry = (id) => {
        const person = persons.find(p => p.id === id)
        personService.deletePerson(id)
            .then(response => {
                console.log(`Deleted ${response}`);
                setPersons(persons.filter(p => p.id !== id))
            })
            .catch(error => {
                alert(`${person} is already deleted`);
                setPersons(persons.filter(p => p.id !== id))
            });
    }

    const handleNameChange = (event) => {
        setNewName(event.target.value)
    }

    const handleNumberChange = (event) => {
        setNewNumber(event.target.value)
    }

    const handleFilterChange = (event) => {
        setNewFilter(event.target.value)
    }

    const handleDeleteClick = (id, name) => {
        if (window.confirm(`Do you really want to delete ${name}?`)) {
            deleteEntry(id)
        }
    }

    const Person = ({person}) => {
        return (
            <>{person.name} {person.number} <button onClick={() => handleDeleteClick(person.id, person.name)}>delete</button><br/></>
        )
    }

    const Notification = ( {message, color} ) => {
        if (message === null) {
            return null
        }
        const notificationStyle = {
            color: 'red',
            background: 'lightgrey',
            fontSize: 20,
            borderStyle: 'solid',
            borderBlockColor: 'red',
            borderRadius: 5,
            padding: 10,
            marginBottom: 10
        }

        return (
            <div style={notificationStyle}>
                {message}
            </div>
        )
    }

    return (
        <div>
            <h2>Phonebook</h2>

            <Notification message={notificationMessage} color={notificationColor}/>

            <Filter newFilter={newFilter} handleFilterChange={handleFilterChange} />

            <h3>add a new</h3>

            <PersonForm addEntry={addEntry} newName={newName} newNumber={newNumber}
                        handleNameChange={handleNameChange} handleNumberChange={handleNumberChange}
            />

            <h3>Numbers</h3>

            <Persons persons={persons} newFilter={newFilter} Person={Person}/>
        </div>
    )
}

export default App
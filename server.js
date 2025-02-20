/*** Express setup & start ***/

// Importeer het npm pakket express uit de node_modules map
import express, { application, json } from 'express'

// Importeer de zelfgemaakte functie fetchJson uit de ./helpers map
import fetchJson from './helpers/fetch-json.js'

// Maak een nieuwe express app aan
const app = express()

// Stel ejs in als template engine
app.set('view engine', 'ejs')

// Stel de map met ejs templates in
app.set('views', './views')

// Gebruik de map 'public' voor statische resources, zoals stylesheets, afbeeldingen en client-side JavaScript
app.use(express.static('public'))

app.use(express.urlencoded({extended: true }))

/***  Routes & data  ***/

// Stel het basis endpoint in
const apiUrl = 'https://fdnd.directus.app/items'

// Haal alle squads uit de WHOIS API op
const squadData = await fetchJson(apiUrl + '/squad')

// Hier heb ik een lege array lijst gemaakt voor de berichten
const messages = []

// Maak een GET route voor de index
app.get('/', function (request, response) {
  // Haal alle personen uit de WHOIS API op

  //Hier heb ik een filter gemaakt met nickname door nempty true te gebruiken worden ook de nicknames die ze hebben zichtbaar
  fetchJson(apiUrl + '/person?filter={"nickname": {"_nempty":true}}').then((apiData) => {
    // apiData bevat gegevens van alle personen uit alle squads
    // Je zou dat hier kunnen filteren, sorteren, of zelfs aanpassen, voordat je het doorgeeft aan de view

    // Render index.ejs uit de views map en geef de opgehaalde data mee als variabele, genaamd persons
    response.render('index', {persons: apiData.data, squads: squadData.data, messages:messages})
  })
})

// Maak een POST route voor de index
app.post('/', function (request, response) {
  // Er is nog geen afhandeling van POST, redirect naar GET op /
  // console.log(request.body);
  messages.push(request.body.bericht)

  response.redirect(303, '/')
})

// Maak een GET route voor een detailpagina met een request parameter id
app.get('/person/:id', function (request, response) {
  // Gebruik de request parameter id en haal de juiste persoon uit de WHOIS API op
  fetchJson(apiUrl + '/person/' + request.params.id).then((apiData) => {
    // console.log(apiData)
    // Render person.ejs uit de views map en geef de opgehaalde data mee als variable, genaamd person
    response.render('person', {person: apiData.data, squads: squadData.data})
  })
})

// Als we vanuit de browser een POST doen op de person pagina
app.post('/person/:id/like-or-unlike', function (request, response) {

  // console.log('/person/'+request.params.id + ' route werkt!')

  // Stap 1: Haal de huidige gegevens op voor deze persoon
  fetchJson('https://fdnd.directus.app/items/person/' + request.params.id).then((apiUrl) => {

  try {
    apiUrl.data.custom = JSON.parse(apiUrl.data.custom)
  } catch (error) {
    apiUrl.data.custom ={}
  }

  // Stap 2 voeg like toe aan custom object 

  if (request.body.actie == 'leuk-hoor') {
    apiUrl.data.custom.like = true 
  } else if (request.body.actie == 'niet-zo-leuk-sorry')  {
    apiUrl.data.custom.like = false
  }

  // Stap 3 overschrijf het custom field voor deze persoon 

  fetchJson('https://fdnd.directus.app/items/ /' + request.params.id, {
  method: 'PATCH',
  body: JSON.stringify({
    custom: apiUrl.data.custom 
  }),
  headers: {'Content-type': 'application/json; charset=UTF-8'
}
  }).then(() => {
    response.redirect(303, '/person/' + request.params.id)
  });
  });
});

app.get('/squad', function (request, response) {
  fetchJson(apiUrl + '/person').then((apiData) => {
      // apiData bevat gegevens van alle personen uit alle squads
      // Je zou dat hier kunnen filteren, sorteren, of zelfs aanpassen, voordat je het doorgeeft aan de view
  
      // Render index.ejs uit de views map en geef de opgehaalde data mee als variabele, genaamd persons
      response.render('index', {persons: apiData.data, squads: squadData.data})

  })
})



// Stel het poortnummer in waar express op moet gaan luisteren
app.set('port', process.env.PORT || 8000)

// Start express op, haal daarbij het zojuist ingestelde poortnummer op
app.listen(app.get('port'), function () {
  // Toon een bericht in de console en geef het poortnummer door
  console.log(`Application started on http://localhost:${app.get('port')}`)
});

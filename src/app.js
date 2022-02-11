'use strict';

const axios = require('axios');
const express = require('express');
const { dialogflow, SimpleResponse } = require('actions-on-google');

const app = express();
app.use(express.json())

const token = ""; // to set manually with Bearer

//Linkage of intent to function
const dialogflowApp = dialogflow();
dialogflowApp.intent('Default Fallback Intent', fallback);
dialogflowApp.intent('Default Welcome Intent', welcome);
dialogflowApp.intent('Forfait réponse : oui', oui);
dialogflowApp.intent('BirthDate', setBirthDate);
dialogflowApp.intent('BirthDepartement', setBirthDepartement);
dialogflowApp.intent('Name', setName);
dialogflowApp.intent('Title', setTitle);
dialogflowApp.intent('Phone', setPhoneNumber);
dialogflowApp.intent('Email', setEmail);
dialogflowApp.intent('Creation', createCustomer);

function welcome(conv) {
    conv.add(`Bonjour.`);
}

function fallback(conv) {
    conv.add(`I didn't understand.`);
}

function oui(conv) {
    conv.add(`Nous allons donc procéder à la création du compte, nous nécessiterons des informations personnelles. Veuillez saisir votre date de naissance.`);
}
// Setup the email, and make a post request with axios to check if the email is valid
function setEmail(conv) {
    if (!token) {
        conv.add('Utilisateur non connecté.');
        return;
    }
    conv.contexts.set('forfait', { email: conv.parameters.email });
    console.log('auth: ' + token);
    return axios.post('https://open.api.sandbox.bouyguestelecom.fr/ap4/v1/customer-management/email-addresses/check', {
        emailAddress: conv.parameters.email
    }, {
        headers: {
            Authorization: token
        },
    }).then((res) => {
        console.log('checkEmail response: ' + JSON.stringify(res.data));
        if ((res.data.validEmailAddress && res.data.contactEmailAddress)) { // res.data.contactEmailAddress == false mais si c'est le vrai code
            conv.add('votre email est valide, veuillez écrire "Je veux procéder à création de mon compte".');
        } else {
            conv.add('wrong email, or you already have a bouygues telecom account.');
        }
        return conv;
    }).catch((error) => {
        console.error(error);
        conv.close('impossible de vérifier l\'email');
    })
}

function setBirthDate(conv) {
    //conv.parameters.birthDate is a parameter set in the intent section
    conv.parameters.birthDate = conv.parameters.birthDate.replace('-', '');
    conv.parameters.birthDate = conv.parameters.birthDate.replace('-', '');
    conv.parameters.birthDate = conv.parameters.birthDate.slice(0, 8);
    conv.contexts.set('forfait', { birthDate: conv.parameters.birthDate });
    conv.add(`Vous êtes né le ${conv.parameters.birthDate}. Dans quel département êtes-vous né ?`);
}

function setBirthDepartement(conv) {
    conv.contexts.set('forfait', { birthDepartement: conv.parameters.birthDepartement });
    conv.add(`Vous êtes né dans le ${conv.parameters.birthDepartement}. Quel est votre nom ?`);
}

function setName(conv) {
    conv.contexts.set('forfait', { name: conv.parameters.Name.name });
    conv.add(`Vous vous appelez ${conv.parameters.Name.name}. Vous êtes un M/MME ?`);
}

function setPhoneNumber(conv) {
    conv.contexts.set('forfait', { phoneNumber: conv.parameters.phoneNumber });
    conv.add(`Votre numéro de téléphone est ${conv.parameters.phoneNumber}. Quel est votre addresse email ?`);
}

function setTitle(conv) {
    conv.contexts.set('forfait', { Title: conv.parameters.title });
    conv.add(`Vous êtes ${conv.parameters.title}. Quel est votre numéro de téléphone ?`);
}

// function getOauth2token(conv) {
//     axios.post(`https://oauth2.sandbox.bouyguestelecom.fr/ap4/token`, {
//         grant_type: "client_credentials"
//     }, {
//         headers: {
//             Authorization: "Basic cGFydGVuYWlyZS5lbGJhLmJvdXlndWVzdGVsZWNvbS5mcjpuazZYRnNtREpTNmRtZVBy"
//         },
//     }).then((res) => {
//         agent.add(res);
//         token = res.data.token_type + " " + res.data.access_token;
//     });
// }

function createCustomer(conv) {
    //Checking if every values is set (not null)
    if (!conv.contexts.input.forfait.parameters.birthDate || !conv.contexts.input.forfait.parameters.birthDepartement ||
        !conv.contexts.input.forfait.parameters.Name.name || !conv.contexts.input.forfait.parameters.phoneNumber ||
        !conv.contexts.input.forfait.parameters.title || !token) {
        !conv.close('Not all values are set.');
        return;
    }
    //Making the variables be in the right format
    var bDay = conv.contexts.input.forfait.parameters.birthDate;
    bDay = bDay.replace('-', '');
    bDay = bDay.replace('-', '');
    bDay = bDay.slice(0, 8);

    var fullName = conv.contexts.input.forfait.parameters.Name.name.split(' ');
    var firstName = fullName[0];
    var lastName = fullName[1];
    var title = "M";
    if (conv.contexts.input.forfait.parameters.title == "Madame")
        title = "MME";
    var bDeptmp = conv.contexts.input.forfait.parameters.birthDepartement;
    var bDepartment = bDeptmp.toString();
    console.log(bDay, bDepartment, conv.contexts.input.forfait.parameters.email,
        firstName, lastName, conv.contexts.input.forfait.parameters.phoneNumber, title);

    // Axios post request to create an user account everythings should be a string
    return axios.post('https://open.api.sandbox.bouyguestelecom.fr/ap4/customer-management/v1/customer-accounts', {
        birthDate: bDay,
        birthDepartment: bDepartment,
        emailAddress: conv.contexts.input.forfait.parameters.email,
        firstName: firstName,
        lastName: lastName,
        phoneNumber: conv.contexts.input.forfait.parameters.phoneNumber,
        title: title,
    }, {
        headers: {
            "x-banc": "ap23",
            "x-version": 4,
            Authorization: token
        }
    }).then((res) => {
        if (res.status == 204) {
            conv.close('Votre compte Bouygues Telecom a été crée :).');
        }
    }).catch((error) => {
        console.error(error);
        conv.close('Bad response from API, your account has not been created.');
    });
}

app.get("/", (req, res) => {
    res.send("Up and running");
});

app.post('/webhook', dialogflowApp);

// Called each time a function with conv parameters is called
dialogflowApp.middleware(function (conv) {
    console.log('intent: ' + conv.intent);
    console.log('params: ' + JSON.stringify(conv.parameters));

    dialogflowApp.conv = conv;
    return conv;
});


//Server listening on port 3000 with ngrok http 3000
app.listen(3000, () => {
    console.log("consodata webhook running on port 3000");
});

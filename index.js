///////////////////////////voici les preriquis pour le bon fonctionnement du back end///////////////////


const { PrismaClient } = require('@prisma/client');
const cors = require('cors')
const { Vonage } = require('@vonage/server-sdk');
const fs = require('fs').promises;

const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET
});
const express = require('express');
const app = express()
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json()) 

/////////////////fonction a utiliser pour le bon fonctionnement/////////////////
function normalizePhoneNumber(phone) {
    if (phone.startsWith('0')) {
        phone = '33' + phone.slice(1);
    } else if (!phone.startsWith('+')) {
        phone = '33' + phone;
    }
    return phone;
}

async function getClientBynumber(numb) {
    const client = await prisma.client.findUnique({
        where: {
            phone: parseInt(numb, 10),
        },
    });
    if (!client) {
        throw new Error('Client not found');
    }
    return client;
}

async function getMessageAndSend(id, mess) {
    const message = await prisma.client.findUnique({
        where: { id_user: id },
    });
    let numero = message.phone.toString();
    console.log(normalizePhoneNumber(numero));

    await vonage.sms.send({
        to: normalizePhoneNumber(numero),
        from: "semloh",
        text: mess
    })
    .then(resp => console.log('SMS envoyé !', resp))
    .catch(err => {
        console.error('Erreur envoi SMS :', err);
        if (err.response && err.response.messages) {
            console.log('Détail Vonage :', err.response.messages[0]);
        }
    });
}
async function creatorcode() {
    try {
        let selectedData = [];
        let text ="";
        const data = await fs.readFile('../rebus.json', 'utf-8');
        const json = JSON.parse(data);
        for (let i = 0; i < 4; i++) {
            switch (i) {
                case 0:
                    text += "Merci de participer à cette évenement, voici le début de l'enquete! on nous à laisser une rébus, a toi de trouver le code a 4 lettre! Quand tu auras trouver dirige toi vers l'ecran a ta disposition pour rentré ton code et recevoir l'emplacement de notre evenement spécial autrement dit cela sert a rien de répondre a se message! Voici le code : Mon premier"
                    break;
                case 1:
                    text += "Mon second"
                    break;
                case 2:
                    text += "Mon troisième"
                    break;
                case 3:
                    text += "et mon quatrième"
                    break;
            }
            let data;
            do {
                data = Math.floor((Math.random() * json.length))
            }while (selectedData.includes(data)) 
        
        selectedData.push(json[data].lettre);
        text += ` ${json[data].phrase}`;
        }

        console.log(selectedData);
        console.log(text);
        return [selectedData, text];
    } catch (error) {
        console.error('Erreur lors de la récupération du code :', error);
    }
}

async function findClientByPhone(phone) {
    // Si tu stockes le numéro comme Int dans la base :
    const phoneInt = parseInt(phone, 10);
    const client = await prisma.client.findUnique({
        where: { phone: phoneInt },
    });
    return client;
}
///////////////////////////les routes de l'API/////////////////////////////////

app.get('/api/getClient', async (req, res) => {
    const { phone } = req.query;
    const client = await findClientByPhone(phone);

    res.json({ client });
});

app.get('/api/createUser', async (req, res) => {
    let code = await creatorcode();
    const { firstName, name, mail, phone } = req.query;
    const phoneInt = parseInt(phone, 10);
    if (!firstName || !name || !mail || !phone) {
        return res.status(400).json({ error: 'Paramètres manquants' });
    }
    const newClient = await prisma.client.create({
        data: {
            firstName,
            name,
            mail,
            phone: phoneInt,
            message: code[1],
            code: code[0].join(''),
        },
    });
    const response = await res.json({ client: newClient }); 
    getMessageAndSend(newClient.id_user, newClient.message)
        .then(() => console.log('Message envoyé avec succès'))
    return response;
});

app.listen(3000, () => {
    console.log('Serveur démarré sur http://localhost:3000');
});
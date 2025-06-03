///////////////////////////voici les preriquis pour le bon fonctionnement du back end///////////////////
const express = require('express');
const app = express()
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient()
const fs = require('fs').promises;

const cors = require('cors')
const { Vonage } = require('@vonage/server-sdk');

const vonage = new Vonage({
    apiKey: process.env.VONAGE_API_KEY,
    apiSecret: process.env.VONAGE_API_SECRET
});


const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    service: 'gmail', // ou ton service SMTP
    auth: {
        user: process.env.MAIL_USER, // ton adresse email
        pass: process.env.MAIL_PASS  // app password
    },
    tls: {
        rejectUnauthorized: false
    }
});

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
        return false;
    }
    return client;
}

async function getMessageAndSend(phone) {
    const message = await prisma.client.findUnique({
        where: { phone: parseInt(phone, 10) },
    });
    let numero = message.phone;
    await vonage.sms.send({
        to: numero,
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
        let text = "";
        const data = await fs.readFile('rebus.json', 'utf-8');
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
            let index;
            do {
                index = Math.floor((Math.random() * json.length))
            } while (selectedData.includes(json[index].lettre))

            selectedData.push(json[index].lettre);
            text += ` ${json[index].phrase}`;
        }
        return [selectedData, text];
    } catch (error) {
        console.error('Erreur lors de la récupération du code :', error);
    }
}


///////////////////////////les routes de l'API/////////////////////////////////

app.post('/api/getClient', async (req, res) => {
    const { phone } = req.body;
    try {
        const client = await getClientBynumber(phone);
        res.json({ client, success: true });
    } catch (error) {
        res.json({ error: 'aucun profil correspond au numéro', success: false });
    }
});

app.post('/api/createUser', async (req, res) => {

    async function createClient(firstName, name, mail, phoneInt, message, code) {
        try {
            await prisma.client.create({
                data: { firstName, name, mail, phone: phoneInt, message, code }
            });
            return true; // Succès
        } catch (err) {
            console.error('Erreur Prisma:', err);
            return false; // Échec
        }
    }


    let code = await creatorcode();
    const { firstName, name, mail, phone } = req.body;
    let phoneInt = normalizePhoneNumber
    phoneInt = parseInt(phone, 10);

    // Tente de créer le client
    let user = await createClient(firstName, name, mail, phoneInt, code[1], code[0].join(''));
    if (user === false) {
        return res.json({ success: false });
    } else {
        getMessageAndSend(phoneInt)
        return res.json({ success: true });
    }

})

app.post('/api/sendMail', async (req, res) => {
    const { phone } = req.body; // ou phone si tu préfères
    const user = await getClientBynumber(phone);
    const mailOptions = {
        from: process.env.MAIL_USER,
        to: user.mail,
        subject: "BRAVO, tu as réussi à trouver le code !",
        text: `Bonjour ${user.firstName},\n\nMerci pour votre participation ! \n\n tu trouveras la carte pour trouver les pépites du web a traevrs la foule`,
        attachments: [
            {
                filename: 'troll.png',
            }
        ]
    }

        // Envoie le mail
        await transporter.sendMail(mailOptions);

    });



app.listen(3000, () => {
    console.log('http://localhost:3000');
});
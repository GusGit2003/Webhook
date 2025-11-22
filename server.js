require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "plasticos";

//GET para verificación del webhook de Meta
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if(mode && token) {
    if(mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('Webhook verificado por Meta.');
      return res.status(200).send(challenge);
    } 
    else {
      console.warn('Webhook verificación fallida. Tokens no coinciden.');
      return res.sendStatus(403);
    }
  }
  res.sendStatus(400);
});

//POST para recibir eventos de Instagram (webhook)
app.post('/webhook', (req, res) => {
  try {
    console.log('---------- Evento recibido ----------');
    console.log(JSON.stringify(req.body, null, 2));
    const body = req.body;

    //Manejo común cuando Instagram envía mensajes (campo "entry[].messaging[]")
    if (body.object && body.entry) {
      
      body.entry.forEach(entry => {
        if(entry.messaging && Array.isArray(entry.messaging)) {
          entry.messaging.forEach(m => {
            if(m.sender && m.sender.id) {
              console.log('PSID (sender.id) detectado:', m.sender.id);
            }
            if(m.message && m.message.text) {
              console.log('Texto:', m.message.text);
            }
          });
        }
       


        //Otras variantes:
        if(entry.changes && Array.isArray(entry.changes)) {
          entry.changes.forEach(change => {
            if(change.value && change.value.sender && change.value.sender.id) {
              console.log('PSID (change.value.sender.id):', change.value.sender.id);
            }
            
            if(change.value && change.value.messages && Array.isArray(change.value.messages)) {
              change.value.messages.forEach(mes => {
                if(mes.from) console.log('PSID (from):', mes.from);
                if(mes.text && mes.text.body) console.log('Texto:', mes.text.body);
              });
            }
          });
        }
      });
      return res.sendStatus(200);
    }

    console.log('Evento no reconocido por el handler. Body:', JSON.stringify(body));
    return res.sendStatus(200);
  } 
  catch(err) {
    console.error('Error procesando webhook:', err);
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
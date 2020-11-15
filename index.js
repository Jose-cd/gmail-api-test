const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");
const { resolve } = require("dns");
const { gmail } = require("googleapis/build/src/apis/gmail");
// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Gmail API.
  authorize(JSON.parse(content), getRecentEmail);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error("Error retrieving access token", err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */

function getRecentEmail(auth) {
  const gmail = google.gmail({ version: "v1", auth });
  // obtener solo los emails recientes con este parametro - 'maxResults'
  gmail.users.messages.list({
    auth: auth,
    userId: 'me',
    }, function(err, response) {
      if (err) {
          console.log('The API returned an error: ' + err);
          return;
      }
    // con este id obtenemos el primero mensaje (el mas reciente) QUE ESTE EN UNREAD
    var message_id = response['data']['messages'][0]['id'];

    //mostrar el id del primer mensaje
    // console.log(message_id);

    // obtener el mensaje con el id que ya tenemos
      gmail.users.messages.get({
        auth: auth,
        userId: "me",
        'id': message_id,
        format: 'FULL'
      }, function (err, response){
        if(err){
          console.log("ha ocurrido un error obteniendo el mensaje actual");
          return;
        }
        // imprimimos la data del mensaje seleccionado
        console.log(response['data']);

        //Accedemos al contenido del email que esta codificado en base64
        message_raw = response.data.payload.parts[0].body.data;
        
        //Mostrar el mensaje codeado en base64
        // console.log(message_raw);

        // Luego hay que decodear el mensaje que esta en base 64
        data = message_raw;
        const buff = Buffer.from(data, 'base64')
        text = buff.toString();
        console.log(text);
      });
  });
}












// function listLabels(auth) {
//   const gmail = google.gmail({ version: "v1", auth });
//   gmail.users.messages.list(
//     {
//       userId: "me",
//       q: "subject:Alerta de seguridad"
//     },function (err, res){
//       if(err){
//         console.log("error en la api");
//       } else{
//         console.log(res.data.messages);
//       }
//     }
//   );
// }


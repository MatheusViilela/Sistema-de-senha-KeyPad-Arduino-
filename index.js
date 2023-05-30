const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const mysql = require('mysql2/promise');
const express = require('express');
const app = express();


const port = new SerialPort({ path: 'COM8', baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'casa',
};

console.log('Seja bem-vindo ao sistema de controle de acesso!\nDigite sua senha:');

let cadastrarSenha = false;
let novaSenha = '';
let acessoLiberado = false;
let fechandoCortina = false;

function enviarSinal(comando) {
  console.log(typeof port);

  port.write(comando, (err) => {
    if (err) {
      console.error(`Erro ao enviar comando para abrir a porta: ${err.message}`);
    } else {
      console.log(comando);
      console.log('Comando enviado');
    }
  });
}

async function saveDataToDatabase(senha) {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute(
      'INSERT INTO controle_acesso (senha, tms_cadastro) VALUES (PASSWORD(?), NOW())',
      [senha]
    );
    console.log(`Dados salvos no banco de dados: ${senha}`);
    cadastrarSenha = null;
  } catch (error) {
    console.error(`Erro ao salvar dados no banco de dados: ${error.message}`);
  }
}

async function acesso(senha) {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute(
      'SELECT * FROM controle_acesso WHERE senha = PASSWORD(?)',
      [senha]
    );
    if (rows.length > 0) {
      console.log('Acesso Liberado');
      acessoLiberado = true;
      enviarSinal('-1');
    } else {
      console.log('Acesso Negado');
      acessoLiberado = false;
      enviarSinal('-2');
    }
  } catch (error) {
    console.error(`Erro ao salvar dados no banco de dados: ${error.message}`);
  }
}

parser.on('data', async function (data) {
  console.log('Dados recebidos:', data);
  const senhaIndex = data.indexOf('Senha Digitada:');
  const prontoIndex = data.indexOf('Pronto para cadastrar nova senha:');

  if (senhaIndex === 0) {
    const senha = data.split(':');
    const numero = senha[1].trim();
    console.log(`Senha digitada: ${numero}`);

    if (cadastrarSenha === false) {
      await acesso(numero);
    }

    if (cadastrarSenha === true) {
      novaSenha = numero;
      cadastrarSenha = false;
      await saveDataToDatabase(novaSenha);
    }
  } else if (prontoIndex === 0 && acessoLiberado === true) {
    console.log(data);
    cadastrarSenha = true;
  } else {
    console.log('Você precisa acessar para cadastrar nova senha');
  }
});

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Quarto Inteligente</title>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/semantic-ui@2.5.0/dist/semantic.min.css" />
        <script src="https://code.jquery.com/jquery-3.1.1.min.js" integrity="sha256-hVVnYaiADRTO2PzUGmuLJr8BLUSjGIZsDYGmIJLv2b8=" crossorigin="anonymous"></script>
        <script src="https://cdn.jsdelivr.net/npm/semantic-ui@2.5.0/dist/semantic.min.js"></script>
        <link rel="stylesheet" href="styles.css" />
      </head>
      <style>
      html,
body {
    text-align: center !important;
    align-items: center !important;
    display: flex !important;
    margin-left: auto !important;
    margin-right: auto !important;
    background-color: rgb(241, 93, 39) !important;
}
      </style>
      <body>
        <div class="ui raised very padded text container segment">
          <h2 class="ui header">Olá! O que você deseja?</h2>
          <div class="ui compact menu">
            <a class="item" id="acender-lampada">
              <i class="lightbulb outline icon"></i>
              Acender Lâmpada
            </a>
            <a class="item">
              <i class="lightbulb icon"></i>
              Apagar Lâmpada
            </a>
          </div>
          <br />
          <br />
          <div class="ui compact menu">
            <a class="item">
              <i class="sun icon"></i>
              Abrir Cortina
            </a>
            <a class="item" href="/fechar-cortina">
              <i class="moon icon"></i>
              Fechar Cortina
            </a>

          </div>
        </div>
        
        <script src="script.js"></script>
      </body>
    </html>
  `);
});

app.get('/fechar-cortina', async (req, res) => {
  console.log("entrei");
  enviarSinal('-3');

  res.send('Fechando cortina...');
});

app.listen(5000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});

port.on('error', function (err) {
  console.error(`Erro na porta serial: ${err.message}`);
});

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const express = require('express');
const app = express();
const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');



const port = new SerialPort({ path: 'COM4', baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

function enviarSinal(comando) {
  port.write(comando, (err) => {
    if (err) {
      console.error(`Erro ao enviar comando para abrir a porta: ${err.message}`);
    } else {
      console.log('Comando enviado');
    }
  });
}
// Configuração do banco de dados
const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'casa',
};
parser.on('data', async function (data) {
});

// Criação da conexão com o banco de dados
const connection = mysql.createConnection(dbConfig);

// Conexão com o banco de dados
connection.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conexão com o banco de dados estabelecida');
});
app.use(session({
  secret: 'chave-secreta', // Chave secreta para assinar a sessão
  resave: false, // Evita que a sessão seja regravada no servidor a cada requisição
  saveUninitialized: false // Evita que uma sessão nova seja criada para cada requisição não autenticada
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.post('/', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Consulta no banco de dados para verificar as informações de login
  const query = `SELECT * FROM usuarios WHERE email = ? AND senha = PASSWORD(?)`;
  connection.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Erro ao executar a consulta:', err);
      res.send('Erro ao fazer login');
      return;
    }


    if (results.length > 0) {
      req.session.username = username; // Salva o nome de usuário na sessão
      req.session.loggedIn = true; // Marca a sessão como autenticada
      res.redirect('/home');
    } else {
      // Caso as informações não correspondam, exibe uma mensagem de erro
      res.send('<script>alert("Login ou senha invalida"); window.location.href = "/";</script>');
    }
  });
});
app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
  <html>
  <head>
    <title>Formulário de Login</title>
    <!-- Adicione os arquivos CSS do Bootstrap -->
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/css/bootstrap.min.css">
  </head>
  <body>
  <form action="/" method="POST">
    <div class="container">
      <div class="row justify-content-center">
        <div class="col-md-6">
          <div class="card mt-5">
            <div class="card-body">
              <h2 class="text-center">Formulário de Login</h2>
              <form>
                <div class="form-group">
                  <label for="username">Usuário:</label>
                  <input type="text" class="form-control" id="username" name="username" placeholder="Digite seu usuário">
                </div>
                <div class="form-group">
                  <label for="password">Senha:</label>
                  <input type="password" class="form-control" id="password" name="password"placeholder="Digite sua senha">
                </div>
                <div class="text-center">
                  <button type="submit" class="btn btn-primary">Entrar</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Adicione os arquivos JavaScript do Bootstrap -->
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.0/js/bootstrap.min.js"></script>
  </body>
  </form>
  </html>`);
});

function requireLogin(req, res, next) {
  if (req.session.loggedIn) {
    next();
  } else {

    res.send('<script>alert("Você precisa efetuar login para acessar!"); window.location.href = "/";</script>');
  }
}
app.get('/home', requireLogin, (req, res) => {
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
        <script src="https://unpkg.com/@phosphor-icons/web"></script>
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
           <a class="item" href="/abrir-cortina">
              <i class="sun icon"></i>
              Abrir Cortina
            </a>
            <a class="item" href="/fechar-cortina">
              <i class="moon icon"></i>
              Fechar Cortina
            </a>

          </div>
          <div class="ui compact menu">
          <a class="item" href="/trancar-porta">
          <i class="ph-fill ph-door"></i>
             Trancar Porta
           </a>
           <a class="item" href="/abrir-porta">
           <i class="ph-fill ph-door-open"></i>
             Abrir a porta
           </a>
           </div>

         </div>
        </div>
        
        <script src="script.js"></script>
      </body>
    </html>
  `);
});
app.get('/abrir-cortina', (req, res) => {
  enviarSinal('-1');
  res.send('<script>alert("Abrindo cortina"); window.location.href = "/home";</script>');
});
app.get('/fechar-cortina', (req, res) => {
  enviarSinal('-2');
  res.send('<script>alert("Fechando cortina"); window.location.href = "/home";</script>');
});
app.get('/abrir-porta', (req, res) => {
  enviarSinal('-3');
  res.send('<script>alert("Porta destrancada"); window.location.href = "/home";</script>');
});
app.get('/trancar-porta', (req, res) => {
  enviarSinal('-4');
  res.send('<script>alert("Porta Trancada"); window.location.href = "/home";</script>');
});


app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});

port.on('error', function (err) {
  console.error(`Erro na porta serial: ${err.message}`);
});

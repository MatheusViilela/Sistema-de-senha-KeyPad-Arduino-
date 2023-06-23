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
      req.session.userId = results[0].id; // Salva o id do usuário na sessão
      req.session.username = username; // Salva o nome de usuário na sessão
      req.session.loggedIn = true; // Marca a sessão como autenticada
      res.redirect('/home');
    } else {
      // Caso as informações não correspondam, exibe uma mensagem de erro
      res.send('<script>alert("Login ou senha invalida"); window.location.href = "/";</script>');
    }
  });
});
app.post('/cadastrar', requireLogin, (req, res) => {
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.senha;
  const passwordConfirmation = req.body.senha1;


  // Verifique se todos os campos foram preenchidos
  if (!name || !email || !password) {
    res.send('<script>alert("Por favor, preencha todos os campos"); window.location.href = "/cadastrar";</script>');
    return;
  }
  if (password != passwordConfirmation) {
    res.send('<script>alert("As senhas não conferem"); window.location.href = "/cadastrar";</script>');
    return;
  }

  // Consulta no banco de dados para verificar se o email já está cadastrado
  const emailQuery = `SELECT * FROM usuarios WHERE email = ?`;
  connection.query(emailQuery, [email], (err, results) => {
    if (err) {
      console.error('Erro ao executar a consulta:', err);
      res.send('Erro ao cadastrar usuário');
      return;
    }

    if (results.length > 0) {
      // Caso o email já esteja cadastrado, exiba uma mensagem de erro
      res.send('<script>alert("O email informado já está cadastrado"); window.location.href = "/cadastrar";</script>');
    } else {
      // Insira os dados do novo usuário no banco de dados
      const insertQuery = `INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, PASSWORD(?))`;
      connection.query(insertQuery, [name, email, password], (err, results) => {
        if (err) {
          console.error('Erro ao cadastrar usuário:', err);
          res.send('Erro ao cadastrar usuário');
          return;
        }
        // Redirecione para a página de login após o cadastro bem-sucedido
        res.send('<script>alert("Cadastrado com Sucesso"); window.location.href = "/home";</script>');
      });
    }
  });
});
app.get('/encerrar-sessao', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao encerrar sessão:', err);
      res.status(500).send('Erro ao encerrar sessão');
    } else {
      res.redirect('/'); // Redireciona para a página inicial ou outra página desejada
    }
  });
})
app.post('/redefinir-senha', requireLogin, (req, res) => {
  const password = req.body.senha;
  const passwordConfirmation = req.body.senha1;
  const userId = req.session.userId;

  console.log(userId);
  console.log(password);
  console.log(passwordConfirmation);

  // Verifica se as senhas fornecidas são iguais
  if (password != passwordConfirmation) {
    res.send('<script>alert("As senhas não conferem"); window.location.href = "/redefinir-senha";</script>');
    return;
  }

  // Executa a consulta para atualizar a senha do usuário no banco de dados
  const query = 'UPDATE usuarios SET senha = PASSWORD(?) WHERE id = ?';
  connection.query(query, [password, userId], (err, results) => {
    if (err) {
      console.error('Erro ao executar a consulta:', err);
      res.send('Erro ao redefinir a senha');
      return;
    }

    res.send('<script>alert("Senha alterada com sucesso!"); window.location.href = "/home";</script>');
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
              <h2 class="text-center">Faça seu login para acessar sua casa!</h2>
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
        background-color:gray !important; 
        };
ui{
  border-radius: 40px !important;
}
#navbar {
  position: fixed;
  top: 0%;
  display: flex, inline;
  align-items: center;
  left: 35%;
  }
</style>
      <body>
      <div class="ui compact menu" id="navbar">
      <div class="header item">
        Seja bem vindo!
      </div>
      <a class="item" href="/redefinir-senha">
        Alterar senha
      </a>
      <a class="item" href="/cadastrar">
        Cadastrar novo usuário
      </a>
      <a class="item" href="/encerrar-sessao">
        Sair
      </a>
    </div>
        <div class="ui raised very padded text container segment">
          <h2 class="ui header">Olá! O que você deseja?</h2>
          <div class="ui compact menu">
            <a class="item" id="acender-lampada" href="/acender-luz">
              <i class="lightbulb outline icon"></i>
              Acender Lâmpada
            </a>
            <a class="item" href="/apagar-luz">
              <i class="lightbulb icon"></i>
              Apagar Lâmpada
            </a>
          </div>
          <br />
          <br />
          <div class="ui compact menu">
           <a class="item" href="/ligar-ventilador">
              <i class="ph-fill ph-fan"></i>
             Ligar Ventilador
            </a>
          </div>
          <div class="ui compact menu">
          <a class="item" href="/ligar-exaustor">
             <i class="ph-fill ph-fan"></i>
            Ligar Exaustor
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

app.get('/cadastrar', requireLogin, (req, res) => {
  res.send(`
  <!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quarto Inteligente</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/semantic-ui@2.5.0/dist/semantic.min.css" />
    <script src="https://code.jquery.com/jquery-3.1.1.min.js"
        integrity="sha256-hVVnYaiADRTO2PzUGmuLJr8BLUSjGIZsDYGmIJLv2b8=" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/semantic-ui@2.5.0/dist/semantic.min.js"></script>
    <script src="https://unpkg.com/@phosphor-icons/web"></script>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet"
        integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
        <script src="https://unpkg.com/@phosphor-icons/web"></script>
</head>
<style>
    html,
    body {
        align-items: center !important;
        display: flex !important;
        margin-left: auto !important;
        margin-right: auto !important;

    }
</style>

<body>
    <form method="POST" action="/cadastrar">
    <div class="">
        <h1 style=" text-align: center;">Cadastro de Usuário</h1>
        <div class="card-body shadow" style="
        width: 80vw;">
            <div class="form-group row">
                <div class="col-sm-6 mt-3 mb-sm-0">
                    <label for="nome">Nome Completo</label>
                    <input id="name" class="form-control" type="text" name="name" placeholder="Digite o nome completo">
                </div>
                <div class="col-sm-6 mt-3 mb-sm-0">
                    <label for="">Email</label>
                    <input id="email" class="form-control" type="email" name="email" placeholder="Digite o email">
                </div>

            </div>
            <div class="form-group row">
                <div class="col-sm-6 mt-3 mb-sm-0">
                    <label for="senha1">Digite sua senha</label>
                    <input id="senha1" class="form-control" type="password" name="senha1"
                        placeholder="Digite a sua senha">
                </div>
                <div class="col-sm-6 mt-3 mb-sm-0">
                    <label for="senha">Confirme sua senha</label>
                    <input class="form-control" id="senha" type="password" name="senha" placeholder="Confirme sua senha">
                </div>

            </div>
            <div class="col-sm12 mt-5">
                <div class="d-flex justify-content-center">
                    <button type="submit" value="submit" class="btn btn-success">Cadastrar</button>
                    </div>
                    <a href="/home" class="btn btn-primary"><i class="ph-fill ph-rewind"></i> Voltar</a>
            </div>
        </div>
    </div>
</form>
</body>

</html>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"
    integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM"
    crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.2/dist/umd/popper.min.js"
    integrity="sha384-IQsoLXl5PILFhosVNubq5LC7Qb9DXgDA9i+tQ8Zj3iwWAwPtgFTxbJ8NT4GN1R8p"
    crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.min.js"
    integrity="sha384-cVKIPhGWiC2Al4u+LWgxfKTRIcfu0JTxR+EQDz/bgldoEyl4H0zUF0QKbrJ0EcQF"
    crossorigin="anonymous"></script>
  `);
});
app.get('/redefinir-senha', requireLogin, (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html lang="en">
  
  <head>
      <meta charset="UTF-8" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Quarto Inteligente</title>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/semantic-ui@2.5.0/dist/semantic.min.css" />
      <script src="https://code.jquery.com/jquery-3.1.1.min.js"
          integrity="sha256-hVVnYaiADRTO2PzUGmuLJr8BLUSjGIZsDYGmIJLv2b8=" crossorigin="anonymous"></script>
      <script src="https://cdn.jsdelivr.net/npm/semantic-ui@2.5.0/dist/semantic.min.js"></script>
      <script src="https://unpkg.com/@phosphor-icons/web"></script>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet"
          integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
  </head>
  <style>
      html,
      body {
          align-items: center !important;
          display: flex !important;
          margin-left: auto !important;
          margin-right: auto !important;
  
      }
  </style>
  
  <body>
      <form method="POST" action="/redefinir-senha">
          <div class="">
              <h1 style=" text-align: center;">Redefinir Senha</h1>
              <div class="card-body shadow" style="
          width: 80vw;">
                  <div class="form-group row">
                      <div class="col-sm-6 mt-3 mb-sm-0">
                          <label for="senha1">Digite sua nova senha</label>
                          <input id="senha1" class="form-control" type="password" name="senha1"
                              placeholder="Digite a sua senha">
                      </div>
                      <div class="col-sm-6 mt-3 mb-sm-0">
                          <label for="senha">Confirme sua nova senha</label>
                          <input class="form-control" id="senha" type="password" name="senha"
                              placeholder="Confirme sua senha">
                      </div>
  
                  </div>
                  <div class="col-sm12 mt-5">
                      <div class="d-flex justify-content-center">
                          <button type="submit" value="submit" class="btn btn-success">Alterar senha</button>
                      </div>
                      <a href="/home" class="btn btn-primary"><i class="ph-fill ph-rewind"></i> Voltar</a>
  
                  </div>
              </div>
          </div>
      </form>
  </body>
  
  </html>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js"
      integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM"
      crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.2/dist/umd/popper.min.js"
      integrity="sha384-IQsoLXl5PILFhosVNubq5LC7Qb9DXgDA9i+tQ8Zj3iwWAwPtgFTxbJ8NT4GN1R8p"
      crossorigin="anonymous"></script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.min.js"
      integrity="sha384-cVKIPhGWiC2Al4u+LWgxfKTRIcfu0JTxR+EQDz/bgldoEyl4H0zUF0QKbrJ0EcQF"
      crossorigin="anonymous"></script>
  `);
});
app.get('/encerrar-sessao', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao encerrar sessão:', err);
      res.status(500).send('Erro ao encerrar sessão');
    } else {
      res.redirect('/'); // Redireciona para a página de login
    }
  });
});
app.get('/ligar-ventilador', (req, res) => {
  enviarSinal('-1');
  res.send('<script>alert("Ventilador Ligado"); window.location.href = "/home";</script>');
});
app.get('/ligar-exaustor', (req, res) => {
  enviarSinal('-2');
  res.send('<script>alert("Exaustor ligado"); window.location.href = "/home";</script>');
});
app.get('/abrir-porta', (req, res) => {
  enviarSinal('-3');
  res.send('<script>alert("Porta destrancada"); window.location.href = "/home";</script>');
});
app.get('/trancar-porta', (req, res) => {
  enviarSinal('-4');
  res.send('<script>alert("Porta Trancada"); window.location.href = "/home";</script>');
});
app.get('/acender-luz', (req, res) => {
  enviarSinal('-5');
  res.send('<script>alert("Luz Acessa!"); window.location.href = "/home";</script>');
});
app.get('/apagar-Luz', (req, res) => {
  enviarSinal('-6');
  res.send('<script>alert("Luz apagada!"); window.location.href = "/home";</script>');
});


app.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});

port.on('error', function (err) {
  console.error(`Erro na porta serial: ${err.message}`);
});

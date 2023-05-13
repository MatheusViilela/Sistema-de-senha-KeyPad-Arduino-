const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
const mysql = require('mysql2/promise');

const port = new SerialPort({ path: 'COM4', baudRate: 9600 })
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

const dbConfig = {
  host: '127.0.0.1',
  user: 'root',
  password: '',
  database: 'casa',
};
console.log("Seja bem vindo ao sistema de controle de acesso! \nDigite sua senha:");
let cadastrarSenha = false; // Variável de controle para indicar se está pronto para cadastrar nova senha
let novaSenha = ''; // Variável para armazenar a nova senha digitada

parser.on('data', async function (data) {

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

  } else if (prontoIndex === 0) {
    console.log(data);
    cadastrarSenha = true;

  }
});

async function saveDataToDatabase(senha) {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows, fields] = await connection.execute(
      'INSERT INTO controle_acesso (senha, tms_cadastro) VALUES (PASSWORD(?), NOW())',
      [senha]
    );
    console.log(`Dados salvos no banco de dados: ${senha}`);
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
    } else {
      console.log('Acesso Negado');
    }
  } catch (error) {
    console.error(`Erro ao salvar dados no banco de dados: ${error.message}`);
  }
}




port.on('error', function (err) {
  console.error(`Erro na porta serial: ${err.message}`);
});
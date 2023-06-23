# SmartHome

Este é um projeto desenvolvido utilizando [Node.js](https://nodejs.org) e [MySQL](https://www.mysql.com/).

## Descrição

O Projeto é uma aplicação web para gerenciar usuários e permitir a redefinição de senhas. Ele oferece um formulário de login seguro e um recurso de redefinição de senha para usuários autenticados. O projeto utiliza o Node.js como ambiente de execução do servidor, e o banco de dados MySQL para armazenar os dados dos usuários. E apos efeturar seu login utilizando a biblioteca serialPort eu mando comando para o arduino, no exemplo que eu utilize eu faço para abrir/fechar porta, ligar/desligar lampada e ligar um ventilador

## Recursos

- Autenticação de usuário
- Formulário de login seguro
- Redefinição de senha
- Acender/Apagar Luz
- Fechar/Abrir Porta

## Instalação

1. Certifique-se de ter o Node.js e o MySQL instalados em sua máquina.
2. Clone este repositório: `git clone https://github.com/seu-usuario/projeto-xyz.git`
3. Navegue até o diretório do projeto: `cd projeto-xyz`
4. Instale as dependências: `npm install`
5. Configure as variáveis de ambiente no arquivo `.env` com as informações do seu banco de dados MySQL.
6. Execute a aplicação: `npm start`
7. Acesse a aplicação em seu navegador através do endereço: `http://localhost:3000`

## Configuração do Banco de Dados

Antes de executar a aplicação, é necessário configurar o banco de dados MySQL. Siga os passos abaixo:

1. Crie um banco de dados no MySQL.
2. Execute o script SQL fornecido no arquivo `database.sql` para criar a tabela necessária.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para enviar pull requests ou relatar problemas encontrados.

## Licença

Este projeto está licenciado sob a [Licença MIT](https://opensource.org/licenses/MIT).

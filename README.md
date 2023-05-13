# Sistema de senha KeyPad Arduino
Essa aplicação Node.js recebe dados de KeyPad em um dispositivo Arduino via porta serial. Os dados são salvos em um banco MySQL e faz a verificação se a senha digitada está cadastrada no banco de dados, caso esteja ele irá acionar um motor de passo. Utiliza as bibliotecas SerialPort e mysql2.

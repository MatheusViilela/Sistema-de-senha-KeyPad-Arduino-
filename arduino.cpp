#include <Servo.h>
#include <Keypad.h>

Servo servoMotor;



const byte LINHAS = 4;
const byte COLUNAS = 4;

const char TECLAS_MATRIZ[LINHAS][COLUNAS] = {
  { '1', '2', '3', 'A' },
  { '4', '5', '6', 'B' },
  { '7', '8', '9', 'C' },
  { '*', '0', '#', 'D' }
};

const byte PINOS_LINHAS[LINHAS] = { 9, 8, 7, 6 };
const byte PINOS_COLUNAS[COLUNAS] = { 5, 4, 3, 2 };

Keypad teclado_personalizado = Keypad(makeKeymap(TECLAS_MATRIZ), PINOS_LINHAS, PINOS_COLUNAS, LINHAS, COLUNAS);

void setup() {
  servoMotor.write(0);
  Serial.begin(9600);
  servoMotor.attach(42);  // Conecta o servo motor ao pino 42 do Arduino
}

void loop() {
  String palavra = "";     // Variável para armazenar a palavra
  int contador = 0;        // Contador de dígitos
  int contadorApagar = 0;  // Contador para a tecla de apagar "#"

  while (contador < 6) {  // Aguarda a digitação de 6 dígitos
    char tecla = teclado_personalizado.getKey();

    if (tecla) {  // Se alguma tecla foi pressionada
      if (tecla == '#') {
        contadorApagar++;           // Incrementa o contador para a tecla de apagar
        if (contadorApagar == 4) {  // Se a tecla de apagar foi pressionada 4 vezes
          palavra = "";             // Reinicia a palavra
          contador = 0;             // Reinicia o contador de dígitos
          contadorApagar = 0;       // Reinicia o contador da tecla de apagar
          Serial.println("Pronto para cadastrar nova senha: ");
        }
      } else {
        palavra += tecla;  // Concatena o dígito na palavra
        contador++;        // Incrementa o contador de dígitos
      }
    }
  }

  Serial.println("Senha Digitada: " + palavra);  // Imprime a palavra na porta serial
  contador = 0;
  while (contador < 1) {
    int c = Serial.parseInt();
    if (c == -1) {
      abrirPorta();
      contador = 1;
    } else if (c == -2) {
      contador = 1;
    }
  }
}
void abrirPorta() {
  servoMotor.write(180);
  delay(5000);
  servoMotor.write(0);
}

#include <Stepper.h>

#include <Servo.h>


Servo servoMotor;

// Defina os pinos de controle do motor de passo
const int passoPino1 = 30;
const int passoPino2 = 32;
const int passoPino3 = 34;
const int passoPino4 = 36;
const int pinRelay = 6;

const int passosPorRevolucao = 200;

Stepper motor(passosPorRevolucao, passoPino1, passoPino3, passoPino2, passoPino4);

void setup() {
  servoMotor.write(0);
  Serial.begin(9600);
  servoMotor.attach(42);  // Conecta o servo motor ao pino 42 do Arduino
  pinMode(pinRelay, OUTPUT);
}
int contadorAcesso = 0;
void loop() {
  servoMotor.write(0);
  while (contadorAcesso < 1) {
    int c = Serial.parseInt();
    if (c == -1) {
      abrirCortina();
      delay(1000);
      contadorAcesso = 0;

    } else if (c == -2) {
      fecharCortina();
      contadorAcesso = 0;
    } else if (c == -3) {
      abrirPorta();

      contadorAcesso = 0;
    } else if (c == -4) {
      fecharPorta();
      contadorAcesso = 0;
    } else if (c == -5) {
      acenderLuz();
      contadorAcesso = 0;
    } else if (c == -6) {
      apagarLuz();
      contadorAcesso = 0;
    }
  }
}

void abrirCortina() {
  unsigned long tempoInicial = millis();    // Obtém o tempo inicial em milissegundos
  const unsigned long tempoLimite = 10000;  // 10s
  while (true) {
    motor.setSpeed(100);  // Defina a velocidade do motor (ajuste conforme necessário)
    motor.step(passosPorRevolucao);
    if (millis() - tempoInicial >= tempoLimite) {
      break;  // Saia do loop
    }
  }
}
void fecharCortina() {
  unsigned long tempoInicial = millis();    // Obtém o tempo inicial em milissegundos
  const unsigned long tempoLimite = 10000;  // 10s
  while (true) {
    motor.setSpeed(100);  // Defina a velocidade do motor (ajuste conforme necessário)
    motor.step(-passosPorRevolucao);
    if (millis() - tempoInicial >= tempoLimite) {
      break;  // Saia do loop
    }
  }
}

void abrirPorta() {
  servoMotor.write(180);
}
void fecharPorta() {
  servoMotor.write(0);
}

void acenderLuz() {
  digitalWrite(pinRelay, HIGH);
}
void apagarLuz() {
  digitalWrite(pinRelay, LOW);
}

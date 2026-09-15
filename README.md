# Rotor Balance Pro

PROYECTO: BALANCEADOR DINÁMICO INDUSTRIAL — 1 Y 2 PLANOS

Diseña y desarrolla el FRONTEND completo de una aplicación profesional para una máquina de balanceo dinámico de rotores.

El sistema debe estar preparado para trabajar con hardware real mediante ESP32 o PLC industrial + variador de frecuencia.

NO quiero únicamente un dashboard visual o un prototipo estático.

Quiero una aplicación frontend funcional, estructurada y preparada para recibir variables reales, ejecutar el flujo de medición y mostrar los resultados de balanceo.

La aplicación debe tener dos niveles de operación:

MODO AFICIONADO / BÁSICO

MODO PROFESIONAL / INDUSTRIAL

La interfaz debe permitir cambiar entre ambos niveles desde configuración.

1. OBJETIVO DEL SISTEMA

El software controla y supervisa una máquina de balanceo dinámico.

La máquina debe permitir realizar:

Balanceo de 1 plano.

Balanceo de 2 planos.

Medición de RPM.

Medición de vibración.

Medición de fase.

Captura de referencia angular.

Análisis de la componente 1X.

FFT/espectro de vibración.

Medición inicial.

Medición con masa de prueba.

Cálculo de corrección.

Aplicación de corrección.

Medición posterior.

Verificación del resultado.

Registro histórico.

Generación de reportes.

El frontend debe estar diseñado para que posteriormente pueda conectarse directamente a:

ESP32 → API/WebSocket → Frontend

o

PLC → API/OPC UA/Modbus Gateway → Backend → Frontend

o

PLC + variador → sistema de adquisición → Backend → Frontend.

NO acoplar la interfaz directamente a una marca específica de PLC o ESP32.

Crear una capa de comunicación desacoplada.

2. TECNOLOGÍA DEL FRONTEND

Utilizar:

React

TypeScript

Vite

Tailwind CSS

Componentes reutilizables

Arquitectura modular

Diseño responsive para PC industrial, laptop y tablet

Estado global organizado

Validaciones de datos

Manejo de errores

Estados de conexión

Modo simulación

Modo hardware real

La interfaz debe sentirse como software de instrumentación industrial, no como una página web administrativa.

3. ESTILO VISUAL

Crear una interfaz:

Industrial.

Profesional.

Moderna.

Oscura.

Alta legibilidad.

Alto contraste.

Sin exceso de decoración.

Pensada para operadores.

Pensada para ingenieros.

Información importante visible rápidamente.

Inspiración conceptual:

Instrumentación industrial.

HMI/SCADA moderno.

Equipos de análisis de vibraciones.

Software profesional de balanceo.

No copiar visualmente ninguna aplicación existente.

Usar:

Panel lateral.

Barra superior.

Tarjetas de variables.

Indicadores de estado.

Gráficos técnicos.

Diagramas de rotor.

Indicadores de fase.

Tablas.

Wizards de procedimiento.

Alarmas.

Estados de máquina.

La interfaz debe poder utilizarse con mouse, teclado y pantalla táctil.

4. ESTRUCTURA PRINCIPAL

Crear un menú lateral con:

Inicio

Máquina

Medición

Balanceo 1 Plano

Balanceo 2 Planos

Análisis de vibración

Corrección

Resultados

Historial

Reportes

Calibración

Configuración

Diagnóstico

Modo simulación

En la parte superior mostrar permanentemente:

Estado de comunicación.

Estado de máquina.

RPM.

Modo seleccionado.

Usuario.

Fecha/hora.

Paro de emergencia si corresponde al estado recibido del PLC.

5. ESTADOS DE LA MÁQUINA

Crear estados claramente diferenciados:

DESCONECTADA

CONECTANDO

CONECTADA

LISTA

ESPERANDO

ACELERANDO

ESTABILIZANDO

MIDIENDO

PROCESANDO

CORRECCIÓN CALCULADA

ESPERANDO CORRECCIÓN

VERIFICANDO

BALANCEADO

ADVERTENCIA

FALLA

Los colores y símbolos deben ser consistentes.

Nunca indicar "máquina lista" si el backend/hardware no informa realmente ese estado.

6. VARIABLES EN TIEMPO REAL

Preparar componentes para mostrar:

RPM

Vibración:

mm/s RMS

mm/s Peak

Aceleración

componente 1X

componente 2X

componente 3X

Fase:

0–360°

Además:

Temperatura de sensor.

Estado de acelerómetro.

Estado de sensor de RPM.

Estado del motor.

Frecuencia del variador.

Corriente del motor.

Estado del variador.

Estado de seguridad.

Tiempo de medición.

Las unidades deben ser configurables.

7. COMUNICACIÓN CON HARDWARE

Crear una abstracción llamada, por ejemplo:

HardwareCommunicationService

Debe permitir inicialmente:

MODE_SIMULATION

MODE_ESP32

MODE_PLC

MODE_API

MODE_WEBSOCKET

El frontend no debe asumir cómo se comunica físicamente el hardware.

Crear una estructura de datos normalizada.

Ejemplo conceptual:

machineState
rpm
vibration
phase
frequency
motorCurrent
temperature
sensorStatus
driveStatus
safetyStatus
timestamp

Preparar la interfaz para recibir datos mediante REST y WebSocket.

Para el desarrollo inicial incluir un SIMULADOR DE HARDWARE.

El simulador debe generar:

RPM variable.

Vibración variable.

Fase variable.

Señal 1X.

Estado de máquina.

Aceleración y desaceleración.

Esto permitirá probar completamente la interfaz antes de conectar el ESP32 o PLC.

8. NIVEL AFICIONADO / BÁSICO

Crear una interfaz simplificada para usuarios que no necesitan conocer todos los parámetros de análisis de vibración.

El flujo debe ser tipo asistente:

PASO 1 — Configurar rotor

Solicitar:

Nombre del rotor.

Tipo de rotor.

Diámetro.

Masa.

Radio de corrección.

RPM objetivo.

Número de planos.

Seleccionar:

[ 1 PLANO ]

o

[ 2 PLANOS ]

PASO 2 — Medición inicial

Mostrar:

RPM

Vibración

Fase

Estado

Botón:

INICIAR MEDICIÓN

El sistema debe indicar visualmente cuándo la velocidad se encuentre estable.

Mostrar:

"Velocidad estable"

antes de aceptar la medición.

PASO 3 — Masa de prueba

Solicitar:

Masa de prueba.

Radio donde se coloca.

Ángulo donde se coloca.

Mostrar un diagrama circular del rotor.

El usuario debe poder seleccionar el ángulo visualmente.

PASO 4 — Segunda medición

Mostrar nuevamente:

RPM

Vibración

Fase

Comparar con la medición inicial.

PASO 5 — Corrección

Mostrar de forma extremadamente clara:

MASA DE CORRECCIÓN

ÁNGULO DE CORRECCIÓN

PLANO

Ejemplo:

6.8 g

246°

PLANO 1

Mostrar visualmente dónde colocar la masa.

PASO 6 — Verificación

Después de colocar la masa:

INICIAR VERIFICACIÓN

Mostrar:

ANTES

4.2 mm/s

DESPUÉS

0.8 mm/s

REDUCCIÓN

80.9 %

Estado:

BALANCEADO

o

NECESITA CORRECCIÓN

9. NIVEL PROFESIONAL / INDUSTRIAL

El modo profesional debe permitir acceso a todas las variables y análisis.

Dashboard profesional:

RPM.

Vibración RMS.

Vibración Peak.

1X.

2X.

3X.

Fase.

FFT.

Forma de onda temporal.

Coherencia/calidad de señal.

Estado de sensores.

Estado del variador.

Estado del PLC/ESP32.

Mostrar simultáneamente:

GRÁFICO FFT

GRÁFICO DE FORMA DE ONDA

VECTOR DE VIBRACIÓN

FASE

RPM

10. BALANCEO DE 1 PLANO

Crear una pantalla específica.

Mostrar:

DIAGRAMA DEL ROTOR

Referencia 0°

0° / 90° / 180° / 270°

Dirección de giro.

Vector de vibración.

Amplitud.

Fase.

Masa de prueba.

Radio.

Vector de corrección.

Resultado.

El cálculo debe manejar conceptualmente:

Vibración inicial:

V0 = A0 ∠ φ0

Vibración con masa de prueba:

V1 = A1 ∠ φ1

Masa de prueba:

Wt

Radio:

Rt

A partir de la respuesta del sistema determinar:

Masa de corrección.

Radio.

Ángulo.

Magnitud del vector de corrección.

IMPORTANTE:

El frontend NO debe inventar resultados de ingeniería.

Los cálculos finales deben estar preparados para ejecutarse en un motor matemático del backend.

El frontend debe recibir el resultado calculado y representarlo correctamente.

11. BALANCEO DE 2 PLANOS

Crear una interfaz independiente para balanceo de dos planos.

Mostrar:

PLANO A

ROTOR

PLANO B

Cada plano debe mostrar:

Vibración.

Fase.

Masa de prueba.

Radio.

Ángulo.

Corrección.

Crear un diagrama lateral del rotor:

PLANO A
│
▼
─────── ROTOR ───────
▲
│
PLANO B

Permitir configurar:

Distancia entre planos.

Radio de cada plano.

Masa de prueba A.

Masa de prueba B.

Ángulo de prueba A.

Ángulo de prueba B.

El sistema debe permitir representar los vectores de corrección de ambos planos.

Resultado:

PLANO A

Masa: XX g

Ángulo: XXX°

PLANO B

Masa: XX g

Ángulo: XXX°

12. SISTEMA DE VECTORES

Crear un componente gráfico reutilizable llamado:

VectorBalanceChart

Debe representar:

Referencia 0°.

Vector de vibración.

Vector de masa de prueba.

Vector de corrección.

Ángulo.

Magnitud.

Debe funcionar tanto para:

1 plano

como

2 planos.

El operador debe poder entender visualmente la corrección.

13. FFT

Crear un módulo profesional de análisis de vibraciones.

Gráfico:

Frecuencia Hz

vs

Amplitud

Mostrar marcadores:

1X

2X

3X

y permitir zoom.

Ejemplo:

1800 RPM

1X = 30 Hz

Mostrar claramente el pico correspondiente a 1X.

También mostrar una tabla:

| Componente | Frecuencia | Amplitud |
| 1X | XX Hz | XX mm/s |
| 2X | XX Hz | XX mm/s |
| 3X | XX Hz | XX mm/s |

14. FORMA DE ONDA

Crear gráfico de:

Vibración vs tiempo.

Mostrar:

Tiempo.

Amplitud.

RPM.

Frecuencia de muestreo.

Permitir zoom y desplazamiento.

15. CALIDAD DE MEDICIÓN

Crear un indicador de calidad.

Por ejemplo:

SEÑAL

████████████████ 95 %

Mostrar advertencias cuando:

RPM inestable.

Señal insuficiente.

Sensor desconectado.

Ruido excesivo.

Referencia angular perdida.

Datos insuficientes.

No permitir finalizar una medición cuando los datos no cumplan las condiciones mínimas configuradas.

16. CONTROL DEL VARIADOR

Crear una sección para el control lógico del variador.

Mostrar:

Estado.

Frecuencia.

RPM estimadas.

Corriente.

Potencia.

Sentido de giro.

Alarmas.

Controles:

INICIAR

DETENER

PARO

RESET FALLA

CONTROL DE RPM

IMPORTANTE:

Estos botones deben estar preparados para enviar comandos al backend/PLC.

No conectar directamente lógica crítica de seguridad desde el frontend.

El paro de emergencia y las protecciones críticas deben permanecer en el sistema físico/PLC de seguridad.

17. CALIBRACIÓN

Crear módulo de calibración.

Permitir calibrar:

Sensor de vibración.

Sensor de RPM.

Referencia angular.

Canal A.

Canal B.

Mostrar:

Valor medido

Valor esperado

Error

Factor de calibración

Fecha

Usuario

Estado

Guardar historial de calibraciones.

18. HISTORIAL

Crear historial de trabajos.

Cada trabajo debe contener:

Fecha.

Rotor.

Operador.

Tipo de balanceo.

RPM.

Vibración inicial.

Vibración final.

Corrección.

Resultado.

Estado.

Permitir:

Buscar.

Filtrar.

Ordenar.

Abrir trabajo.

Repetir medición.

Generar reporte.

19. REPORTE

Crear una pantalla de reporte profesional.

Debe incluir:

Datos de máquina.

Datos del rotor.

Operador.

Fecha.

RPM.

Vibración inicial.

Vibración final.

Fase.

FFT.

Corrección aplicada.

Diagrama del rotor.

Plano A.

Plano B.

Resultado final.

Observaciones.

Preparar botón:

GENERAR PDF

y

EXPORTAR DATOS

20. CONFIGURACIÓN

Crear:

Configuración general

Configuración de sensores

Configuración de máquina

Configuración de unidades

Configuración de RPM

Configuración de límites de vibración

Configuración de comunicación

Configuración de usuario

Configuración de tolerancias

Configuración del modo:

AFICIONADO

PROFESIONAL

21. SEGURIDAD

La interfaz debe mostrar claramente:

Estado de emergencia.

Puerta/protección.

Permiso de giro.

Estado del motor.

Estado del variador.

Estado del PLC.

Estado de sensores.

Si el hardware informa una condición insegura:

BLOQUEAR MEDICIÓN

BLOQUEAR ARRANQUE

mostrar la causa.

Nunca implementar la seguridad funcional exclusivamente en React.

22. MODO SIMULACIÓN

Esto es obligatorio para el desarrollo inicial.

Crear un simulador de rotor.

Permitir seleccionar:

Rotor equilibrado

Rotor con desbalance

Rotor con ruido

Rotor con vibración elevada

Rotor con señal de RPM inestable

El simulador debe cambiar dinámicamente:

RPM

Vibración

Fase

FFT

Forma de onda

Esto debe permitir demostrar el flujo completo sin hardware.

23. ARQUITECTURA DE COMPONENTES

Crear componentes reutilizables:

RealtimeValue

RpmGauge

VibrationGauge

PhaseIndicator

RotorDiagram

BalanceVector

FftChart

WaveformChart

MachineStatus

SensorStatus

DriveStatus

MeasurementWizard

CorrectionPanel

TwoPlaneCorrection

AlarmPanel

CalibrationPanel

MeasurementHistory

ReportPreview

CommunicationStatus

24. ESTADOS Y FLUJO DE TRABAJO

Implementar una máquina de estados clara:

IDLE

CONFIGURATION

INITIAL_MEASUREMENT

TEST_WEIGHT

TEST_MEASUREMENT

CALCULATION

CORRECTION

VERIFICATION

COMPLETED

FAULT

No permitir saltos lógicos incorrectos.

Por ejemplo:

No permitir:

VERIFICACIÓN

si no existe una CORRECCIÓN calculada.

No permitir:

CORRECCIÓN

si no existe una medición válida.

No permitir:

MEDICIÓN

si la máquina no está estable.

25. DATOS MOCK

Crear datos simulados realistas para demostrar:

Ejemplo 1:

RPM: 1800

Vibración: 4.2 mm/s

Fase: 132°

1X: 4.2 mm/s

2X: 0.8 mm/s

3X: 0.3 mm/s

Después:

RPM: 1800

Vibración: 0.8 mm/s

Reducción: 80.9 %

Resultado:

BALANCEADO

26. IMPORTANTE SOBRE LOS CÁLCULOS

No colocar fórmulas de ingeniería inventadas dentro del frontend.

Separar:

INTERFAZ

↓

SERVICIO DE DATOS

↓

MOTOR DE CÁLCULO

↓

RESULTADO

El frontend solamente debe:

Recibir variables.

Validarlas.

Mostrar variables.

Solicitar mediciones.

Enviar comandos.

Mostrar resultados.

Representar vectores.

Mostrar gráficos.

Registrar estados.

El backend/motor matemático posteriormente será responsable de los cálculos de balanceo.

La arquitectura debe permitir reemplazar el algoritmo de cálculo sin rediseñar la interfaz.

27. DISEÑO RESPONSIVE

Optimizar especialmente para:

1920×1080

1600×900

1366×768

tablets industriales.

La pantalla principal debe poder verse completa sin desplazamientos innecesarios.

Los elementos críticos:

RPM

VIBRACIÓN

FASE

ESTADO

CORRECCIÓN

deben tener prioridad visual.

28. EXPERIENCIA DEL OPERADOR

El operador debe saber siempre:

Qué está haciendo la máquina.

Qué está midiendo.

Si puede continuar.

Qué resultado obtuvo.

Qué debe hacer físicamente.

Por ejemplo:

MEDICIÓN INICIAL
✓ Completada

MASA DE PRUEBA
✓ Registrada

SEGUNDA MEDICIÓN
✓ Completada

CORRECCIÓN

PLANO A
6.8 g @ 246°

ACCIÓN:

"Colocar 6.8 g en el plano A a 246° respecto a la referencia 0°."

Después:

[ VERIFICAR BALANCEO ]

29. DISEÑO FINAL

El resultado debe parecer el software de una máquina industrial profesional.

NO hacer:

Landing page.

Dashboard empresarial genérico.

Tarjetas excesivamente grandes.

Animaciones innecesarias.

Gráficos decorativos.

Datos ficticios sin indicar simulación.

SÍ hacer:

Instrumentación.

Datos en tiempo real.

Diagramas técnicos.

Estados claros.

Alarmas.

Procedimientos guiados.

Gráficos de ingeniería.

Historial.

Diagnóstico.

Configuración.

Comunicación.

30. ENTREGABLE

Construir el frontend funcional completo con:

Navegación.

Todas las pantallas.

Componentes reutilizables.

Estado global.

Modo simulación.

Datos mock.

WebSocket preparado.

API preparada.

Manejo de conexión/desconexión.

Estados de error.

Estados de máquina.

Balanceo 1 plano.

Balanceo 2 planos.

FFT.

Forma de onda.

Corrección.

Historial.

Calibración.

Reportes.

Configuración.

Utilizar datos simulados para que TODO EL FLUJO pueda probarse actualmente.

La arquitectura debe quedar preparada para sustituir posteriormente el simulador por:

ESP32

o

PLC + variador de frecuencia.

No cambiar la interfaz cuando se conecte el hardware real.

El objetivo es que el mismo frontend pueda evolucionar desde:

AFICIONADO → PROTOTIPO → PROFESIONAL → INDUSTRIAL

sin tener que reconstruir el proyecto desde cero.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c5279525-d3e2-41ac-8bad-03d545929d68).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

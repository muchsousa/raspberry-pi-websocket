const express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http),
    gpio = require('pigpio').Gpio;


const led = new gpio(4, { mode: gpio.OUTPUT });
const button = new gpio(17, {
    mode: gpio.INPUT,
    pullUpDown: gpio.PUD_UP,
    alert: true
});

app.use('/', express.static(`${__dirname}/src`));

button.glitchFilter(1000);
button.on('alert', (level) => {
    if (level === 0) {
        const state = !led.digitalRead();

        console.log(`botão físico pressionado: ${state}`);

        led.digitalWrite(state);
        io.sockets.emit('state', state);

    }
});

io.on('connection', (socket) => {
    console.log('a socket connected');

    socket.emit('state', led.digitalRead()); // initial value

    socket.on('state', (state) => {
        console.log(`botão virtual pressionado: ${state}`);
        led.digitalWrite(state);

        io.sockets.emit('state', state);
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

process.on('SIGINT', () => {
    led.digitalWrite(0);
    process.exit();
});

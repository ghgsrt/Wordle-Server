const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3001;

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: {
		origin: 'http://127.0.0.1:3000',
	},
});

io.on('connection', (socket) => {
	console.log('Client connected (' + socket.id + ')');

	socket.on('room:join', (roomId, displayName) => {
		socket.join(roomId);
		socket.to(roomId).emit('client:joined', { id: socket.id, displayName });
	});

	socket.on('room:members', (message) => {
		console.log('Updating Room Members for client: ' + message.target);
		io.to(message.target).emit('room:members', message.payload);
	});

	socket.on('game:start', (word) => {
		console.log('Starting game in room ' + socket.id);
		io.to(socket.id).emit('game:start', word);
	});

    socket.on('game:end', (roomId, gameStats) => {
        io.to(roomId).emit('game:end', socket.id, gameStats);
    });

	socket.on('disconnecting', () => {
		for (const roomId of socket.rooms) {
			if (roomId !== socket.id) {
				socket.to(roomId).emit('client:left', socket.id);
			}
		}
	});

	socket.on('disconnect', () =>
		console.log('Client disconnected (' + socket.id + ')')
	);
});

httpServer.listen(PORT, () => console.log(`Listening on ${PORT}`));

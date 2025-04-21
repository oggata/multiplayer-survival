const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');

app.use(express.static('public'));

// プレイヤーの状態を管理
const players = new Map();

io.on('connection', (socket) => {
    console.log('プレイヤーが接続しました');

    // 新規プレイヤーの初期化
    players.set(socket.id, {
        id: socket.id,
        position: { x: Math.random() * 5000, y: 0, z: Math.random() * 5000 },
        rotation: { y: 0 },
        health: 100
    });

    // 既存のプレイヤー情報を送信
    socket.emit('currentPlayers', Array.from(players.values()));
    
    // 新規プレイヤーの情報を他のプレイヤーに通知
    socket.broadcast.emit('newPlayer', players.get(socket.id));

    // プレイヤーの移動更新
    socket.on('playerMove', (data) => {
        const player = players.get(socket.id);
        if (player) {
            player.position = data.position;
            player.rotation = data.rotation;
            socket.broadcast.emit('playerMoved', player);
        }
    });

    // 弾の発射
    socket.on('shoot', (data) => {
        console.log('弾が発射されました:', {
            playerId: socket.id,
            position: data.position,
            direction: data.direction
        });
        
        socket.broadcast.emit('bulletFired', {
            playerId: socket.id,
            position: data.position,
            direction: data.direction
        });
    });

    // プレイヤーがダメージを受けた
    socket.on('playerHit', (data) => {
        console.log('プレイヤーがダメージを受けました:', data);
        const player = players.get(data.targetId);
        if (player) {
            const damage = data.damage || 25; // クライアントから送信されたダメージ量を使用、なければ25
            player.health -= damage;
            if (player.health <= 0) {
                // プレイヤーが死亡
                players.delete(data.targetId);
                io.emit('playerDied', data.targetId);
            } else {
                io.emit('playerHealthUpdate', {
                    id: data.targetId,
                    health: player.health
                });
            }
        }
    });

    // プレイヤーがリスタートした
    socket.on('playerRestart', () => {
        const player = players.get(socket.id);
        if (player) {
            player.health = 100;
            player.position = { x: Math.random() * 5000, y: 0, z: Math.random() * 5000 };
            player.rotation = { y: 0 };
            
            // リスタートしたプレイヤーの情報を送信
            socket.emit('playerRestarted', player);
            
            // 他のプレイヤーにリスタートを通知
            socket.broadcast.emit('playerRestarted', {
                id: socket.id,
                position: player.position,
                rotation: player.rotation
            });
        }
    });

    // 切断時の処理
    socket.on('disconnect', () => {
        console.log('プレイヤーが切断しました');
        players.delete(socket.id);
        io.emit('playerDisconnected', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`サーバーが起動しました: http://localhost:${PORT}`);
}); 
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Garantir que a pasta de dados exista (necessário para o Docker Volume no Coolify)
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

// Conexão com o Banco de Dados SQLite (salvo localmente na VPS)
const db = new sqlite3.Database(path.join(dataDir, 'database.sqlite'), (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite local.');
        
        // Criar tabela se não existir
        db.run(`CREATE TABLE IF NOT EXISTS leads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            empresa TEXT NOT NULL,
            telefone TEXT NOT NULL,
            respostas JSON NOT NULL,
            data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    }
});

// Rota para receber os dados do formulário
app.post('/api/checkup', (req, res) => {
    const { nome, empresa, telefone, respostas } = req.body;

    if (!nome || !empresa || !telefone || !respostas) {
        return res.status(400).json({ error: 'Dados incompletos' });
    }

    const query = `INSERT INTO leads (nome, empresa, telefone, respostas) VALUES (?, ?, ?, ?)`;
    db.run(query, [nome, empresa, telefone, JSON.stringify(respostas)], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Erro ao salvar os dados' });
        }
        res.status(200).json({ message: 'CheckUP salvo com sucesso!', id: this.lastID });
    });
});

// Rota para listar os dados no Painel (Dashboard)
app.get('/api/leads', (req, res) => {
    db.all(`SELECT * FROM leads ORDER BY data_criacao DESC`, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Erro ao buscar dados' });
        }
        // Parse JSON para facilitar no frontend
        const dadosFormatados = rows.map(row => ({
            ...row,
            respostas: JSON.parse(row.respostas)
        }));
        res.json(dadosFormatados);
    });
});

// Rotas do Frontend
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/painel', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

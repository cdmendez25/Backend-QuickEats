const express = require('express');
const cors = require('cors');
const app = express();

const JWT_SECRET = 'clave_super_secreta';

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/auth', require('./routes/auth')(JWT_SECRET));

const PORT = 3001;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
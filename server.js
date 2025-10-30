import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import manageClip from './routes/manageClip.js';
import { connectToDatabase } from './db/init.js';

dotenv.config();
const app = express();

const PORT = process.env.PORT;

connectToDatabase();

app.use(cors({
    origin: '*'
}));


app.use(express.json());

app.use('/', manageClip);

app.listen(PORT, () => {
    console.log(`clip is running on port ${PORT}`);
});
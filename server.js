import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import manageClip from './routes/manageClip.js';
import { connectToDatabase } from './db/init.js';

dotenv.config();
const app = express();

const PORT = process.env.PORT;
async function startServer() {
    try {
        await connectToDatabase();
        
        app.use(cors({
            origin: '*'
        }));
        
        app.get('/', (req, res) => {
            res.send('Clip Service is running');
        });
        app.use(express.json());
        
        app.use('/', manageClip);
        
        app.listen(PORT, () => {
            console.log(`clip is running on port ${PORT}`);
        });

    }
    catch (error) {
        console.error('❌ Server startup error:', error);
        process.exit(1);
    }
}

startServer();
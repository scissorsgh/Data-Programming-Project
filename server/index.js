import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import db from './db.js';
import usersRouter from './routes/users.js';
import bucketlistsRouter from './routes/bucketlists.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ message: 'Bucketlist API is running.' });
});

app.use('/api/users', usersRouter);
app.use('/api/bucketlists', bucketlistsRouter);

app.use((req, res) => {
  res.status(404).json({ message: '요청한 주소를 찾을 수 없습니다.' });
});

app.use((error, req, res, next) => {
  console.error('처리되지 않은 서버 오류:', error);
  res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
});

app.listen(PORT, async () => {
  console.log(`✅ 서버 실행: http://localhost:${PORT}`);
  try {
    const connection = await db.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ MySQL 데이터베이스 연결 성공');
  } catch (error) {
    console.error('❌ MySQL 연결 실패:', error.message);
    console.error('server/.env의 DB_HOST, DB_USER, DB_PASSWORD, DB_NAME을 확인해 주세요.');
  }
});

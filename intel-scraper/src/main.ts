import express from 'express';
import scrapeRouter from './routes/scrape';

const app = express();
const port = 3000;

app.use(express.json());

app.use('/api', scrapeRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

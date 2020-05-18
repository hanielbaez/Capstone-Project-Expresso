const express = require('express');

const cors = require('cors');
const bodyParser = require('body-parser');
const errorHandler = require('errorhandler');
const morgan = require('morgan');

//routes
const apiRouter = require('./api/api');

const app = express();
app.use(cors());
morgan('dev');

// parse application/json
app.use(bodyParser.json())
// only use in development
app.use(errorHandler())

//api route mount  
app.use('/api', apiRouter);

//port server will listen on
const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`))

module.exports = app;
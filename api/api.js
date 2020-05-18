const express = require('express');
const artistsRouter = require('./artists');
const seriesRouter = require('./series');
const apiRoute = express.Router();

apiRoute.use('/artists', artistsRouter);
apiRoute.use('/series', seriesRouter);




module.exports = apiRoute;
const express = require('express');
const sqlite3 = require('sqlite3');
const issuesRouter = require('./issues');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const seriesRouter = express.Router();

seriesRouter.use('/:seriesId/issues', issuesRouter);


seriesRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Series`,
        function (err, rows) {
            if (err) {
                next(err);
            } else {
                res.send({ series: rows });
            }
        })
});

seriesRouter.param('seriesId', (req, res, next, id) => {
    db.get(`SELECT * FROM Series WHERE id = $id`,
        {
            $id: id
        },
        function (err, series) {
            if (err) {
                next(err);
            } else {
                req.series = series;
                next();
            }
        })
})

seriesRouter.get('/:seriesId', (req, res, next) => {
    if (req.series) {
        res.send({ series: req.series });
    }
    else {
        res.status(404).send();
    }
});

//helper function, check if the need data is present
function checkValidData(req, res, next) {
    if (!req.body.series.name || !req.body.series.description) {
        res.status(400).send();
    } else {
        next();
    }
}

seriesRouter.post('/', checkValidData, (req, res, next) => {

    db.run(`INSERT INTO Series (name, description) VALUES ($name, $description)`,
        {
            $name: req.body.series.name,
            $description: req.body.series.description
        }, function (err) {
            if (err) {
                next(err);
            } else {
                db.get(`SELECT * FROM Series WHERE id = $id`,
                    {
                        $id: this.lastID
                    },
                    function (err, serie) {
                        if (err) {
                            next(err);
                        } else {
                            res.status(201).send({ series: serie });
                        }
                    })
            }
        });
});

seriesRouter.put('/:seriesId', checkValidData, (req, res, next) => {
    const series = req.body.series;
    db.run(`UPDATE Series
            SET name = $name,
                description = $description
                WHERE id = ${req.params.seriesId}`,
        {
            $name: series.name,
            $description: series.description,
            $id: req.body.series.id
        },
        function (err) {

            db.get(`SELECT * FROM Series WHERE id = ${req.series.id}`,
                function (err, serie) {
                    if (err) {
                        next(err);
                    } else {
                        res.send({ series: serie });
                    }
                })
        })
});

function hasSeries(req, res, next) {
    db.get(`SELECT * FROM Issue WHERE series_id = ${req.params.seriesId}`,
        function (err, row) {
            if (row) {
                res.status(400).send();
            } else {
                next();
            }
        }
    )
}

seriesRouter.delete('/:seriesId', hasSeries, (req, res, next) => {
    db.run(`DELETE FROM Series WHERE id = ${req.params.seriesId}`,
        function (err) {
            if (err) {
                res.status(400).send();
            } else {
                res.status(204).send();
            }
        })
});
module.exports = seriesRouter;
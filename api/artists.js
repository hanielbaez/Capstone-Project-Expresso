const express = require('express');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const artistsRoute = express.Router();

artistsRoute.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Artist WHERE is_currently_employed = 1`, (err, rows) => {
        if (err) {
            next(err);
        } else {
            res.status(200).json({ artists: rows });
        }
    })
});

artistsRoute.param('artistId', (req, res, next, id) => {
    db.get(`SELECT * FROM Artist WHERE id = $id`,
        {
            $id: id
        },
        function (err, rows) {
            if (err) {
                next(err);
            } else if (rows) {
                req.artist = rows;
                next();
            } else {
                res.status(404).send();
            }
        }
    )
});

artistsRoute.get('/:artistId', (req, res, next) => {
    res.status(200).json({ artist: req.artist });
});

//check to ensure all required fields are present in the request body, if not send a 400 response
const checkRequiredFields = (req, res, next) => {
    let artist = req.body.artist;
    if (!artist.name || !artist.dateOfBirth || !artist.biography) {
        res.status(400).send();
    }
    else {
        next();
    }
}

artistsRoute.post('/', checkRequiredFields, (req, res, next) => {
    let artist = req.body.artist;

    const isCurrentlyEmployed = artist.isCurrentlyEmployed === 0 ? 0 : 1;

    db.run(`INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed) 
                VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed)`,
        {
            $name: artist.name,
            $dateOfBirth: artist.dateOfBirth,
            $biography: artist.biography,
            $isCurrentlyEmployed: isCurrentlyEmployed
        },
        function (err) {
            if (err) {
                next(err);
            } else {
                db.get(`SELECT * FROM Artist WHERE id = ${this.lastID}`,
                    function (err, artist) {
                        if (err) {
                            next(err);
                        } else {
                            res.status(201).send({ artist: artist });
                        }
                    });
            }
        })
});

artistsRoute.put('/:artistId', checkRequiredFields, (req, res, next) => {
    const artist = req.body.artist;

    const isCurrentlyEmployed = artist.isCurrentlyEmployed === 0 ? 0 : 1;
    db.run(`UPDATE Artist
            SET name = $name,
                date_of_birth = $dateOfBirth,
                biography = $biography,
                is_currently_employed = $isCurrentlyEmployed
            WHERE id = ${req.params.artistId}`,
        {
            $name: artist.name,
            $dateOfBirth: artist.dateOfBirth,
            $biography: artist.biography,
            $isCurrentlyEmployed: isCurrentlyEmployed
        },
        function (err) {
            if (err) {
                next(err);
            }
            else {
                db.get(`SELECT * FROM Artist WHERE id = ${req.params.artistId}`,
                    function (err, artist) {
                        if (err) {
                            next(err);
                        } else {
                            res.status(200).send({ artist: artist });
                        }
                    });
            }
        }
    );
});

artistsRoute.delete('/:artistId', (req, res, next) => {
    db.serialize(() => {

        db.run(`UPDATE Artist 
            SET is_currently_employed = 0
            WHERE id = ${req.params.artistId}`,
            function (err) {
                if (err) {
                    next(err);
                }
            });

        db.get(`SELECT * FROM Artist WHERE id = ${req.params.artistId}`,
            function (err, artist) {
                if (err) {
                    next(err);
                } else {
                    res.send({ artist: artist });
                }
            });

    });

})
module.exports = artistsRoute;
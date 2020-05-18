const express = require('express');
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

const issuesRouter = express.Router({ mergeParams: true });


function checkSerieId(req, res, next) {
    db.get(`SELECT * FROM Series WHERE id = ${req.params.seriesId}`,
        function (err, series) {
            if (err) {
                next(err);
            } else if (!series) {
                res.status(404).send();
            } else {
                next();
            }
        })
};

issuesRouter.get('/', checkSerieId, (req, res, next) => {

    db.all(`SELECT * FROM Issue WHERE series_id = ${req.params.seriesId}`,
        function (err, rows) {
            if (err) {
                next(err);
            } else {
                res.send({ issues: rows });
            }
        })
});

//helper function required fields (name, issueNumber, publicationDate, or artistId)
function requiredFields(req, res, next) {
    const issue = req.body.issue;
    if (!issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId) {
        res.status(400).send();
    } else {
        next();
    }
}

issuesRouter.post('/', requiredFields, (req, res, next) => {
    const issue = req.body.issue;
    db.run(`INSERT INTO Issue 
                (name, issue_number, publication_date, artist_id, series_id)
            VALUES 
                ($name, $issueNumber, $publicationDate, $artistId, $seriesId)`,
        {
            $name: issue.name,
            $issueNumber: issue.issueNumber,
            $publicationDate: issue.publicationDate,
            $artistId: issue.artistId,
            $seriesId: req.params.seriesId
        },
        function (err) {
            if (err) {
                next(err);
            } else {
                db.get(`SELECT * FROM Issue WHERE id = $id`,
                    {
                        $id: this.lastID
                    },
                    function (err, row) {
                        if (err) {
                            next(err);
                        } else {
                            res.status(201).send({ issue: row });
                        }
                    }
                )
            }
        })
});

issuesRouter.param('issueId', (req, res, next) => {
    db.get(`SELECT * FROM Issue WHERE id = ${req.params.issueId}`,
        function (err, row) {
            if (!row) {
                res.status(404).send()
            } else {
                next();
            }
        })
});

//helper check for valid data
function checkData(req, res, next) {
    const issue = req.body.issue;
    if (!issue.name || !issue.issueNumber || !issue.publicationDate || !issue.artistId) {
        res.status(400).send();
    } else {
        next();
    }
}

issuesRouter.put('/:issueId', checkData, (req, res, next) => {
    const issue = req.body.issue;
    db.run(`UPDATE Issue
            SET name = $name, issue_number = $issueNumber, publication_date = $publicationDate,
                artist_id = $artistId, series_id = $seriesId
            WHERE id = $id`,
        {
            $name: issue.name,
            $issueNumber: issue.issueNumber,
            $publicationDate: issue.publicationDate,
            $artistId: issue.artistId,
            $seriesId: req.params.seriesId,
            $id: req.params.issueId
        },
        function (err) {
            if (err) {
                next(err);
            } else {
                db.get(`SELECT * FROM Issue WHERE ${this.lastID}`,
                    function (err, row) {
                        if (err) {
                            next(err);
                        } else {
                            res.send({ issue: row });
                        }
                    }
                )
            }
        }

    )
})

issuesRouter.delete('/:issueId', (req, res, next) => {
    db.run(`DELETE FROM Issue WHERE id = ${req.params.issueId}`,
        function (err) {
            if (err) {
                next(err);
            } else {
                res.status(204).send();
            }
        }
    )
});
module.exports = issuesRouter;
/**
 * Created by Kseniya on 2/3/2017.
 */
var express = require('express');
var router = express.Router();
var exec = require('child_process').exec;
var log4js = require('log4js');
var $RefParser = require('json-schema-ref-parser');
var parser = new $RefParser();

log4js.configure({
    appenders: [
        {type: 'console'},
        {type: 'file', filename: 'app.log', category: 'app'}
    ]
});
var logger = log4js.getLogger('app');


router.get('/', function (req, res, next) {
    exec('bash sh/init.sh', function (err, stdout, stderr) {
        logger.error(err)
        logger.log(stdout)
        logger.error(stderr);
    });

    res.send('init started');
});

/* GET home page. */
router.post('/', function (req, res, next) {
    var eventType = req.get('X-GitHub-Event');
    if (eventType == 'push') {
        console.log("Push Received:\n")
        var repoURL = req.body.repository.git_url;
        var repoName = req.body.repository.name;
        var authorEmail = req.body.head_commit.author.email;
        var authorName = req.body.head_commit.author.name;
        var commitMessage = req.body.head_commit.message;
        logger.log("repoURL - ", repoURL);
        logger.log("repoName - ", repoName);
        logger.log("authorEmail - ", authorEmail);
        logger.log("authorName - ", authorName);
        logger.log("commitMessage - ", commitMessage);
        exec('bash sh/git-pull.sh'
            + ' -n ' + repoName
            + ' -u ' + repoURL
            + ' -a "' + authorName + '"'
            + ' -b ' + authorEmail
            + ' -c "' + commitMessage.replace(/"/g, '\'') + '"'
            + ' -t ' + 'ausdigital.github.io'
            + ' -r ' + 'git@github.com:ausdigital/ausdigital.github.io.git'
            , function (err, stdout, stderr) {
                logger.error(err)
                logger.log(stdout)
                logger.error(stderr)

                //post processing of API files
                fs.readdir('/opt/ausdigital.github.io/_data/', function(err, items) {
                    console.log(items);

                    for (var i=0; i<items.length; i++) {
                        console.log(items[i]);
                    }
                });

                res.send('webhook was received');
            });
    } else {
        res.send(eventType + ' was received');
    }
});

module.exports = router;

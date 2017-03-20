/**
 * Created by Kseniya on 2/3/2017.
 */
var express = require('express');
var router = express.Router();
var exec = require('child_process').exec;
var log4js = require('log4js');
var deref = require('json-schema-deref-sync');
var fs = require('fs');
var path = require('path');

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
        logger.log("Push Received:\n")
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


                processAPI(repoURL, authorEmail, authorName, commitMessage);


                res.send('webhook was received');
            });
    } else {
        res.send(eventType + ' was received');
    }
});


function processAPI(repoURL, authorEmail, authorName, commitMessage) {
    var repoNames = ["ausdigital-bill", "ausdigital-dcl", "ausdigital-dcp", "ausdigital-idp", "ausdigital-nry",
        "ausdigital-syn", "ausdigital-tap", "ausdigital-tap-gw", "ausdigital-code"];

    for (var i = 0; i < repoNames.length; i++) {
        var repoName = repoNames[i];
        var baseFrom = "/opt/" + repoName + "/docs/";
        var copyTo = "/opt/ausdigital.github.io/_data/"
        var docs = fs.readdirSync(baseFrom);
        for (var j = 0; j < docs.length; j++) {
            var version = docs[j];
            var baseFromPath = path.join(baseFrom, version);
            var stat = fs.stat(baseFromPath)

            if (stat.isFile())
                logger.log("'%s' is a file.", baseFromPath);
            else if (stat.isDirectory()) {
                logger.log("'%s' is a directory.", baseFromPath);

                var copyFrom = baseFromPath;
                var files = fs.readdirSync(copyFrom);

                for (var k = 0; k < files.length; k++) {
                    var file = files[k];
                    if (file == "swagger.json") {
                        // Make one pass and make the file complete
                        var fromPath = path.join(copyFrom, file);
                        var fileName = repoName + "_" + version.replace(".", "-") + "_" + file;
                        logger.log(fileName);
                        var toPath = path.join(copyTo, fileName);

                        var stat = fs.statSync(fromPath);
                        if (stat.isFile())
                            logger.log("'%s' is a file.", fromPath);
                        else if (stat.isDirectory())
                            logger.log("'%s' is a directory.", fromPath);

                        var result = JSON.parse(fs.readFileSync(fromPath));

                        var schema = deref(result);

                        // `schema` is just a normal JavaScript object that contains your entire JSON Schema,
                        // including referenced files, combined into a single object
                        fs.writeFileSync(toPath, JSON.stringify(schema));
                    }
                }
            }
        }
    }

    exec('bash sh/git-push.sh'
        + ' -n ' + repoName
        + ' -u ' + repoURL
        + ' -a "' + authorName + '"'
        + ' -b ' + authorEmail
        + ' -c "' + commitMessage.replace(/"/g, '\'') + '"'
        + ' -t ' + 'ausdigital.github.io'
        + ' -r ' + 'git@github.com:kshychko/ausdigital.github.io.git'
        , function (err, stdout, stderr) {
            logger.error(err)
            logger.log(stdout)
            logger.error(stderr)

        });


}

module.exports = router;

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
var execSync = require('sync-exec');

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
        logger.error(stdout)
        logger.error(stderr);
    });

    res.send('init started');
});

/* GET home page. */
router.post('/', function (req, res, next) {
    var eventType = req.get('X-GitHub-Event');
    if (eventType == 'push') {
        logger.error("Push Received:\n")
        var repoURL = req.body.repository.git_url;
        var repoName = req.body.repository.name;
        var authorEmail = req.body.head_commit.author.email;
        var authorName = req.body.head_commit.author.name;
        var commitMessage = req.body.head_commit.message;
        logger.error("repoURL - ", repoURL);
        logger.error("repoName - ", repoName);
        logger.error("authorEmail - ", authorEmail);
        logger.error("authorName - ", authorName);
        logger.error("commitMessage - ", commitMessage);

        res.send('webhook was received');

        gitPull();
        /*execSync('bash sh/jekyll-build.sh'
            + ' -t ' + 'ausdigital.github.io');

        logger.error("Jekyll build is finished. Commit and push changes.", "Jekyll build is finished. Commit and push changes.")
        execSync('bash sh/git-push.sh'
            + ' -n ' + repoName
            + ' -u ' + repoURL
            + ' -a "' + authorName + '"'
            + ' -b ' + authorEmail
            + ' -c "' + commitMessage.replace(/"/g, '\'') + '"'
            + ' -t ' + 'ausdigital.github.io'
            + ' -r ' + 'git@github.com:ausdigital/ausdigital.github.io.git');*/




    } else {
        res.send(eventType + ' was received');
    }
});

function gitPull() {


    var repoNames = ["ausdigital.github.io", "ausdigital-bill", "ausdigital-dcl", "ausdigital-dcp", "ausdigital-idp", "ausdigital-nry",
        "ausdigital-syn", "ausdigital-tap", "ausdigital-tap-gw", "ausdigital-code"];

    for (var i = 0; i < repoNames.length; i++) {
        var repoName = repoNames[i];
        require('simple-git')('/opt' + '/' + repoName)
            .pull(function (err, update) {
                logger.error('repoName ' + repoName + ' was updated')
            });

    }
}
function processAPI() {
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
                logger.error("'%s' is a file.", baseFromPath);
            else if (stat.isDirectory()) {
                logger.error("'%s' is a directory.", baseFromPath);

                var copyFrom = baseFromPath;
                var files = fs.readdirSync(copyFrom);

                for (var k = 0; k < files.length; k++) {
                    var file = files[k];
                    if (file == "swagger.json") {
                        // Make one pass and make the file complete
                        var fromPath = path.join(copyFrom, file);
                        var fileName = repoName + "_" + version.replace(".", "-") + "_" + file;
                        logger.error(fileName);
                        var toPath = path.join(copyTo, fileName);

                        var stat = fs.statSync(fromPath);
                        if (stat.isFile())
                            logger.error("'%s' is a file.", fromPath);
                        else if (stat.isDirectory())
                            logger.error("'%s' is a directory.", fromPath);

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
}

module.exports = router;

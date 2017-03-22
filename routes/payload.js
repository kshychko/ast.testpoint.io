/**
 * Created by Kseniya on 2/3/2017.
 */
var express = require('express');
var router = express.Router();
var exec = require('child_process').exec;
var log4js = require('log4js');
var fs = require('fs');
var fse = require('fs-extra')
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

/*
    gitPullNextRepo(0);
*/
    res.send('init started');
});

/* GET home page. */
router.post('/', function (req, res, next) {
    var eventType = req.get('X-GitHub-Event');
    if (eventType == 'push') {
        logger.error("Push Received:\n")

        res.send('webhook was received');

        gitPullNextRepo(0, req);
        /**/


    } else {
        res.send(eventType + ' was received');
    }
});

var repoNames = ["ausdigital.github.io", /*"ausdigital-bill", "ausdigital-dcl", */"ausdigital-dcp"/*, "ausdigital-idp", "ausdigital-nry",
    "ausdigital-syn", "ausdigital-tap", "ausdigital-tap-gw", "ausdigital-code"*/];

var baseDir = '/opt/'
/*
var baseDir = 'd://work/aus-tp-github/'
*/
function gitPullNextRepo(index, req) {

    var repoName = repoNames[index];

    require('simple-git')(baseDir + repoName)
        .then(function () {
            logger.error('Starting pull... ' + repoName);
        })
        .pull(function (err, update) {
            logger.error('repoName ' + repoName + ' was updated')
        }).then(function () {
        logger.error(repoName + ' pull done.');
        if (index + 1 < repoNames.length) {
            gitPullNextRepo(index + 1, req)
        } else {
            cleanUpSpecs(1, req);
        }
    });
}

function cleanUpSpecs(index, req) {

    var repoName = repoNames[index];

    logger.error('about to delete ' + baseDir + repoNames[0] + '/specs/' + repoName)
    fse.emptyDirSync(baseDir + repoNames[0] + '/specs/' + repoName);

    if (index + 1 < repoNames.length) {
        cleanUpSpecs(index + 1, req)
    } else {
        //copy from docs
        copyFromDocs(1, req);
    }
}

function copyFromDocs(index, req) {
    var repoName = repoNames[index];

    logger.error('about to copy ' + baseDir + repoNames[0] + '/specs/' + repoName)
    fse.copySync(baseDir + repoName + '/docs',
        baseDir + repoNames[0] + '/specs/' + repoName);

    if (index + 1 < repoNames.length) {
        copyFromDocs(index + 1, req)
    } else {
        //processAPI

        processAPI();

        execSync('bash sh/jekyll-build.sh'
            + ' -t ' + 'ausdigital.github.io');

        logger.error("Jekyll build is finished. Commit and push changes.", "Jekyll build is finished. Commit and push changes.");

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

        execSync('bash sh/git-push.sh'
            + ' -n ' + repoName
            + ' -u ' + repoURL
            + ' -a "' + authorName + '"'
            + ' -b ' + authorEmail
            + ' -c "' + commitMessage.replace(/"/g, '\'') + '"'
            + ' -t ' + 'ausdigital.github.io'
            + ' -r ' + 'git@github.com:ausdigital/ausdigital.github.io.git');
    }
}
function processAPI() {
    for (var i = 1; i < repoNames.length; i++) {
        var repoName = repoNames[i];
        var baseFrom = baseDir + repoName + '/docs/';
        logger.error(baseFrom)
        var copyTo = baseDir+'ausdigital.github.io/_data/'
        var docs = fs.readdirSync(baseFrom);
        for (var j = 0; j < docs.length; j++) {
            var version = docs[j];
            var baseFromPath = path.join(baseFrom, version);
            var stat = fs.statSync(baseFromPath)

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

                        // `schema` is just a normal JavaScript object that contains your entire JSON Schema,
                        // including referenced files, combined into a single object

                     /*   SwaggerParser.dereference(fromPath)
                            .then(function(api) {
                                logger.error(fromPath + ' was derefed')
                                fs.writeFileSync(toPath, JSON.stringify(api));
                            });
*/

                        var deref = require('deref');
                        $ = deref();
                        fs.writeFileSync(toPath, JSON.stringify($(result)));
                    }
                }
            }
        }
    }
}

module.exports = router;

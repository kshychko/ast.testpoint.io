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
        {type: 'logger'},
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

                //post processing of API files
                var repoNames = ["ausdigital-bill", "ausdigital-dcl", "ausdigital-dcp", "ausdigital-idp", "ausdigital-nry",
                    "ausdigital-syn", "ausdigital-tap", "ausdigital-tap-gw", "ausdigital-code"];
                repoNames.forEach(function (repoName) {
                    var baseFrom = "/opt/" + repoName + "/docs/";
                    var copyTo = "/opt/ausdigital.github.io/_data/"
                    fs.readdir(baseFrom, function (err, files) {
                        if (err) {
                            logger.error("Could not list the directory.", err);
                            process.exit(1);
                        }

                        files.forEach(function (version, index) {
                            var baseFromPath = path.join(baseFrom, version);
                            fs.stat(baseFromPath, function (error, stat) {
                                if (error) {
                                    logger.error("Error stating file.", error);
                                    return;
                                }

                                if (stat.isFile())
                                    logger.log("'%s' is a file.", baseFromPath);
                                else if (stat.isDirectory()) {
                                    logger.log("'%s' is a directory.", baseFromPath);

                                    var copyFrom = baseFromPath;
                                    fs.readdir(copyFrom, function (err, files) {
                                        if (err) {
                                            logger.error("Could not list the directory.", err);
                                            process.exit(1);
                                        }

                                        files.forEach(function (file, index) {

                                            if (file == "swagger.json") {
                                                // Make one pass and make the file complete
                                                var fromPath = path.join(copyFrom, file);
                                                var fileName = repoName + "_" + version.replace(".", "-") + "_" + file;
                                                logger.log(fileName);
                                                var toPath = path.join(copyTo, fileName);

                                                fs.stat(fromPath, function (error, stat) {
                                                    if (error) {
                                                        logger.error("Error stating file.", error);
                                                        return;
                                                    }

                                                    if (stat.isFile())
                                                        logger.log("'%s' is a file.", fromPath);
                                                    else if (stat.isDirectory())
                                                        logger.log("'%s' is a directory.", fromPath);

                                                    var result = JSON.parse(fs.readFileSync(fromPath));

                                                    parser.dereference(result, function(err, schema) {
                                                        if (err) {
                                                            logger.error(err);
                                                        }
                                                        else {
                                                            // `schema` is just a normal JavaScript object that contains your entire JSON Schema,
                                                            // including referenced files, combined into a single object
                                                            fs.writeFileSync(toPath, JSON.stringify(schema));
                                                            exec('bash sh/git-push.sh'
                                                                + ' -n ' + repoName
                                                                + ' -u ' + repoURL
                                                                + ' -a "' + authorName + '"'
                                                                + ' -b ' + authorEmail
                                                                + ' -c "' + commitMessage.replace(/"/g, '\'') + '"'
                                                                + ' -t ' + 'ausdigital.github.io'
                                                                + ' -r ' + 'git@github.com:kshychko/ausdigital.github.io.git'
                                                                + ' -f "' + toPath + '"'
                                                                , function (err, stdout, stderr) {
                                                                    logger.error(err)
                                                                    logger.log(stdout)
                                                                    logger.error(stderr)
                                                                });
                                                        }
                                                    });

                                                });
                                            }
                                        });
                                    });
                                }

                            });
                        });

                    });
                });


                res.send('webhook was received');
            });
    } else {
        res.send(eventType + ' was received');
    }
});

module.exports = router;

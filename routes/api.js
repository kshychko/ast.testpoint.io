/**
 * Created by Kseniya on 2/3/2017.
 */
var express = require('express');
var router = express.Router();
var exec = require('child_process').exec;
var log4js = require('log4js');
var jsref = require('json-schema-ref-parser');
var parser = new jsref();
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
    var repoNames = ["ausdigital-bill", "ausdigital-dcl", "ausdigital-dcp", "ausdigital-idp", "ausdigital-nry",
        "ausdigital-syn", "ausdigital-tap", "ausdigital-tap-gw", "ausdigital-code"];
    repoNames.forEach(function (repoName) {
        var baseFrom = "/opt/" + repoName + "/docs/";
        var copyTo = "/opt/ausdigital.github.io/_data/"
        fs.readdir(baseFrom, function (err, files) {
            if (err) {
                console.error("Could not list the directory.", err);
                process.exit(1);
            }

            files.forEach(function (version, index) {
                var baseFromPath = path.join(baseFrom, version);
                fs.stat(baseFromPath, function (error, stat) {
                    if (error) {
                        console.error("Error stating file.", error);
                        return;
                    }

                    if (stat.isFile())
                        console.log("'%s' is a file.", baseFromPath);
                    else if (stat.isDirectory()) {
                        console.log("'%s' is a directory.", baseFromPath);

                        var copyFrom = baseFromPath;
                        fs.readdir(copyFrom, function (err, files) {
                            if (err) {
                                console.error("Could not list the directory.", err);
                                process.exit(1);
                            }

                            files.forEach(function (file, index) {

                                if (file == "swagger.json") {
                                    // Make one pass and make the file complete
                                    var fromPath = path.join(copyFrom, file);
                                    var fileName = repoName + "_" + version.replace(".", "-") + "_" + file;
                                    console.log(fileName);
                                    var toPath = path.join(copyTo, fileName);

                                    fs.stat(fromPath, function (error, stat) {
                                        if (error) {
                                            console.error("Error stating file.", error);
                                            return;
                                        }

                                        if (stat.isFile())
                                            console.log("'%s' is a file.", fromPath);
                                        else if (stat.isDirectory())
                                            console.log("'%s' is a directory.", fromPath);

                                        var result = JSON.parse(fs.readFileSync(fromPath));

                                        parser.dereference(result, function(err, schema) {
                                            if (err) {
                                                console.error(err);
                                            }
                                            else {
                                                // `schema` is just a normal JavaScript object that contains your entire JSON Schema,
                                                // including referenced files, combined into a single object
                                                fs.writeFileSync(toPath, JSON.stringify(schema));

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

    res.send('init started');
});
module.exports = router;

var fs = require('fs');
var cfg = require('./../conf/cfg.json');


var fileSolrConf = cfg.solr_conf+'solrconfig.xml';

fs.readFile(fileSolrConf,'utf-8' ,function (err, data) {
  if (err) throw err;

  // set autoSoftCommit mode
  console.log('set autoSoftCommit mode in '+fileSolrConf);
  data = data.replace('</autoCommit>','</autoCommit>\n<autoSoftCommit><maxTime>3</maxTime></autoSoftCommit>');

  fs.writeFile(fileSolrConf, data, function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("The file "+fileSolrConf+" was saved!");
    }
  });
});


var fileSchema = cfg.solr_conf+'managed-schema';

fs.readFile(fileSchema,'utf-8' ,function (err, data) {
  if (err) throw err;

  // set autoSoftCommit mode
  console.log('add extra_source field '+fileSchema);
  data = data.replace('<field name="_version_" type="long" indexed="true" stored="true"/>',
                      '<field name="_version_" type="long" indexed="true" stored="true"/>'+
                      "\n"+'<field name="extra_source" type="string" indexed="false" stored="true"/>');

  fs.writeFile(fileSchema, data, function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("The file "+fileSchema+" was saved!");
    }
  });
});
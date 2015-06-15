
/* Tools
to migrate from one solr to another (but respect same schema)
to backup in json file
to do!! restore
 */

var bunyan = require('bunyan');
var solr = require('solr-client');

var cfg = require(process.argv[2]);

var start = cfg.start;
var rows  = cfg.rows;
var limit = 1000;
var count = 0;


var log = bunyan.createLogger({
  name: 'migrate-solr',
  streams: [{
    path: '/tmp/solr_backup.log'
    // `type: 'file'` is implied
  }]
});


// Create a client
log.info('Create solr From client '+cfg.from_host+':'+cfg.from_port);

var solrFrom = solr.createClient(cfg.from_host,cfg.from_port,cfg.from_core);
var solrTo = solr.createClient(cfg.to_host,cfg.to_port,cfg.to_core);


var searchAll = function() {

// DixMax query

//  var query = solrFrom.createQuery()
//    .q(cfg.query)
//    .start(start)
//    .rows(rows)
//    .sort("created_at_dt asc");




  var query = solrFrom.createQuery()
    .q(cfg.query)
    .sort(cfg.sort)
    .start(start)
    .rows(rows);

  log.info("Querying starting at " + start + " for " + rows + "rows");
  solrFrom.search(query, function (err, obj) {
    if (err) {
      log.info(err);
    } else {
      //console.log(obj);return;
      var res = obj.response;

      start += rows;
      limit -= rows;
      processRes(res);
      //return;
      //if (limit<1) { return};

      if ((res.numFound <= start)) {
        return;
      }
      else {
        searchAll();
      }

    }
  });
};

var processRes = function(res){
  log.info("Write docs for " + start);
  //console.log(res.docs[0]);
  for (var i in res.docs) {
    count++;
    delete(res.docs[i]['_version_']);
  }
  if (cfg.mode == 'migrate') {
    solrTo.add(res.docs, function (err, obj) {
      if (err) {
        log.info(err);
      } else {
        //log.info(obj);
      }
    });
  }
  else if (cfg.mode == 'backup'){
    console.log(res.docs);

  }
};

//___________

searchAll();
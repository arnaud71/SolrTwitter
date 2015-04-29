var bunyan = require('bunyan');
var solr = require('solr-client');
var cfg = require('./conf_migrate.json');

var start = cfg.start;
var rows  = cfg.rows;
var limit = 10;

var log = bunyan.createLogger({name: 'migrate-solr'});


// Create a client
log.info('Create solr From client '+cfg.from_host+':'+cfg.from_port);

var solrFrom = solr.createClient(cfg.from_host,cfg.from_port,cfg.from_core);
var solrTo = solr.createClient(cfg.to_host,cfg.to_port,cfg.to_core);

var searchAll = function() {

// DixMax query
  var query = solrFrom.createQuery()
    .q('*:*')
    .start(start)
    .rows(rows)
    .sort('created_at_dt asc');


  log.info("Querying starting at " + start);
  solrFrom.search(query, function (err, obj) {
    if (err) {
      console.log(err);
    } else {
      //console.log(obj);
      var res = obj.response;
      //console.log(res);return;
      start += rows;
      limit -= rows;
      processRes(res);
      //if (limit<1) { return};
      if (res.numFound < start) {
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
    delete(res.docs[i]['_version_']);
  }
  solrTo.add(res.docs,function(err,obj){
    if(err){
      console.log(err);
    }else{
      console.log(obj);
    }
  });
};



//___________

searchAll();
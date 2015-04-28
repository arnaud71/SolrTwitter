var bunyan = require('bunyan');             // for log
var Twitter = require('twitter');           // for twitter client api
var solr = require('solr-client');          // for solr-client
var cfg = require('./conf/cfg.json');       // general configuration file

var to_solr = require('./field_tweet2solr.json');

var log = bunyan.createLogger({name: 'tweets2solr'});

function process(o_key,o_value,p_value,params,tweet) {

  if (o_value !== undefined) {
    if (p_value.search(/_dt$/) != -1) {
      var date = new Date(o_value);
      o_value = date.toISOString();
    }
    else if (p_value.search(/_p$/) != -1) {
      o_value = o_value[0]+','+o_value[1];
    }
    else if (p_value.search(/^(coordinates_s|geo_s)$/) != -1) {

      o_value = o_value[0]+','+o_value[1];
      //console.log(p_value+" =!! "+o_value);
      //o_value = JSON.stringify(o_value);

    }
    else if (p_value.search(/_(coordinates_s)$/) != -1) {

      //o_value = o_value[0]+','+o_value[1];
      o_value = JSON.stringify(o_value);
      //console.log("add: p:'"+p_value+"' o:'"+o_value);

    }
    // default
    params[p_value] = o_value;

    if (p_value == 'geo_s') {
      params['geo_p'] = o_value;
    }
    else if (p_value == 'coordinates_s') {
      params['coordinates_p'] = o_value;
    }
    else if (p_value == 'text_t') {
      //console.log(tweet);return;
      var lang = tweet.lang;
      if (lang == 'und') {
        // to do something?? else still on text_t
      }
      else {
        // to verify for dynamic fields which don't exist ???
        params['text_txt_'+lang] = o_value;
      }
    }
  }

}

function traverse(o,p,params,func,tweet) {


  for (var i in o) {

    //console.log("traverse:  o_i:"+o[i] + " i:"+i+ " ->p_i:"+p[i]);
    if (i == 0) {
      //console.log('coordinates break');
      break;
    };

    if (p[i] === undefined ||p[i] == null) {
      //console.log('undefined continue');
      continue;
    };   // complete the field_tweet2solr.json if needed


    if ((typeof(p[i])!="object")&& (typeof(o[i])!="object"||(p[i].search(/(coordinates|geo)_(s|p)$/) != -1)) && o[i]!=null) {
      func.apply(this, [i, o[i], p[i], params,tweet]);
    }

    if (o[i] !== null && typeof(o[i])=="object") {
      //going on step down in the object tree!!
      traverse(o[i],p[i],params,func,tweet);
    }
  }
}

// Create a client
log.info('Create a solr client at '+cfg.solr_host+':'+cfg.solr_port);
var clientSolr = solr.createClient(cfg.solr_host,cfg.solr_port,cfg.solr_core);

var getTwitterAgent = function (err,res) {
  if(err){
    log.warn(err);
  }else{
    log.info('SoftCommit OK');
    log.info('Search twitter_agent');
    var query = clientSolr.createQuery()
      .q({type_s : 'twitter_agent'})
      .start(0)
      .rows(cfg.max_agents);

    clientSolr.search(query,startTwitterAgent);
  }

}

var writeStreamToSolr = function(stream,agent) {
  //console.log(agent);
  stream.on('data', function (tweet) {
    //console.log(tweet);
    log.info('tweet received: '+tweet.text+' at'+tweet.created_at+' for '+agent.name_s);
    var params = {};

    // main type of db
    params['type_s'] = agent.type_doc_s;
    // added extra information from agent
    params['extra_filter_s']        = agent.type_filter_s;
    params['extra_api_s']           = agent.type_api_s;
    params['extra_agent_id_s']      = agent.id;
    params['extra_filter_type_ss']  = agent.filter_type_ss;
    params['extra_filter_t']        = agent.filter_t;
    params['extra_stream_s']        = agent.stream_s;

    // if keep tweeter source activated keep it in default 'content' solr field which is not indexed
    if (cfg.keep_source) {
      params['extra_source'] = JSON.stringify(tweet);
    }
    traverse(tweet,to_solr,params,process,tweet);

    params['id'] = params['id']+'_'+agent.id;

    log.info('tweet converted: '+params.text_t+' at'+params.created_at_dt+' for '+params.extra_agent_s);

    clientSolr.add(
      params
    ,function(err,obj){
      if(err){
        log.error(err);
      }else{
        log.info('Tweet added to solr');
      }
    });

  });

  stream.on('error', function (error) {
    log.fatal(error);
    throw error;
  });
}



var startTwitterAgent = function (err,data) {

  if(err){
    log.warn(err);
  }else {

    log.info('agents found:' + data.response.numFound);

    var agents = data.response.docs;

    for (var i in agents) {
      log.info('start twitter agent :' + agents[i].name_s);


      var clientTwitter = new Twitter({
        consumer_key        : agents[i].consumer_key_s,
        consumer_secret     : agents[i].consumer_secret_s,
        access_token_key    : agents[i].access_token_key_s,
        access_token_secret : agents[i].access_token_secret_s
      });

      var filter = JSON.parse(agents[i].filter_t);

      //var filter = JSON.stringify(filter);

      var agent = agents[i];

      clientTwitter.stream('statuses/'+agents[i].stream_s, filter , function(stream) {writeStreamToSolr(stream,agent) });
      //console.log(clientTwitter);
    }
  }
}


// do a soft commit, must be set in solr config
log.info('Do softCommit');
clientSolr.softCommit(getTwitterAgent);


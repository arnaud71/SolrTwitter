var solr  = require('solr-client');
var cfg = require('./conf/cfg.json');



if (process.argv.length != 3) {
  console.log('please specify a twitter agent to add (in json format)');
  return;
}


var agent1 = require('./'+process.argv[2]);


// Create a client
var clientSolr = solr.createClient(cfg.solr_host,cfg.solr_port,cfg.solr_core);





// do a soft commit, must be set in solr config
clientSolr.softCommit(function(err,res){
  console.log('SoftCommit');
  if(err){
    console.log(err);
  }else{
    console.log(res);
    addTwitterAgent(agent1,clientSolr);
    //addTwitterAgent(agent2,clientSolr);
  }
});


function addTwitterAgent (agent,clientSolr) {
  console.log(agent);

  // prepare filter type
  var filter_types = [];
  for (i in agent.filter) {
    console.log(i);
    filter_types.push(i);
  }


  clientSolr.add({

    type_s                : 'twitter_agent',              // agent type (here twitter), main type of db
    type_doc_s            : agent.type_doc,
    type_filter_s         : agent.type_filter,
    type_api_s            : agent.type_api,
    id                    : agent.type_doc+'_'+agent.type_filter+'_'+agent.type_api+'_'+agent.name,  // id of the agent
    name_s                : agent.name,                   // name of the agent
    filter_t              : JSON.stringify(agent.filter), // string of filter type and content
    filter_type_ss        : filter_types,                 // tab of filter types (locations, tracks, follower,lang)
    stream_s              : agent.stream,                 // twitter stream type (firehose, filter, sample)
    consumer_key_s        : agent.consumer_key,           // consumer_key
    consumer_secret_s     : agent.consumer_secret,        // consumer_secret
    access_token_key_s    : agent.access_token_key,       // access_token_key
    access_token_secret_s : agent.access_token_secret     // access_token_secret
  },function(err,obj) {
      if (err) {
        console.log(err);
      } else {
        console.log('Solr response[addTwitterAgent]:', obj);
      }
    }
  )
}



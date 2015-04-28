var to_solr = require('./field_tweet2solr.json');
var tweets = require('./test.json');

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


for (var tweet in tweets) {
  var params = {};
  //console.log(tweets[tweet]);return;
  traverse(tweets[tweet],to_solr,params,process,tweets[tweet]);
  console.log(params);
  //console.log(JSON.stringify(tweets[tweet],null,2));
  return;
}

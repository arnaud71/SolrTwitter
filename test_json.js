var to_solr = require('./field_tweet2solr.json');
var tweets = require('./test.json');

function process(o_key,o_value,p_value,params) {


  if (o_value !== undefined) {
    if (p_value.search(/_dt$/) != -1) {
      var date = new Date(o_value);
      o_value = date.toISOString();
    }
    else if (p_value.search(/_p$/) != -1) {
      o_value = o_value[0]+','+o_value[1];
    }
    else if (p_value.search(/^(coordinates_s|geo_s)$/) != -1) {

      //o_value = o_value[0]+','+o_value[1];
      //console.log(p_value+" =!! "+o_value);

    }
    else if (p_value.search(/_(coordinates_s)$/) != -1) {

      //o_value = o_value[0]+','+o_value[1];
      o_value = JSON.stringify(o_value);
      //console.log("add: p:'"+p_value+"' o:'"+o_value);

    }
    params[p_value] = o_value;

  }

}

function traverse(o,p,params,func) {
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
      func.apply(this, [i, o[i], p[i], params]);
    }

    if (o[i] !== null && typeof(o[i])=="object") {
      //going on step down in the object tree!!
      traverse(o[i],p[i],params,func);
    }
  }
}

for (var tweet in tweets) {
  var params = {};
  traverse(tweets[tweet],to_solr,params,process);
  console.log(params);
  //console.log(JSON.stringify(tweets[tweet],null,2));
  return;
}

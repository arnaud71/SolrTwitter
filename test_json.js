var to_solr = require('./field_tweet2solr.json');
var tweets = require('./tweets_geneva.json');


function process(o_key,o_value,p_value,params) {
  //console.log(o_key + " : "+o_value+ " ->"+p_value);

  if (o_value) {
    if (p_value.search(/_dt$/) != -1) {
      var date = new Date(o_value);
      o_value = date.toISOString();
    }
    else if (p_value.search(/_p$/) != -1) {
      o_value = o_value[0]+','+o_value[1];
    }
    else if (p_value.search(/coordinates_s$/) != -1) {
      o_value = JSON.stringify(o_value);
    }
    //console.log(p_value+" = "+o_value);
    params[p_value] = o_value;
  }
}

function traverse(o,p,params,func) {
  for (var i in o) {
    //if ((i==0)||(i == 'media')) {break};
    if (i == 0) {
     //console.log('coordinates break');
     break;
     };

    if (p[i] === undefined ||p[i] == null) {
      //console.log('undifined continue');
      continue;
    };   // complete the field_tweet2solr.json if needed

    //console.log("traverse:  o_i:"+o[i] + " i:"+i+ " ->p_i:"+p[i]);
    if ((typeof(p[i])!="object")&& (typeof(o[i])!="object"||(p[i].search(/_coordinates_(s|p)$/) != -1)) && o[i]!=null) {
      //console.log('apply');
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
  console.log(JSON.stringify(tweets[tweet],null,2));
}

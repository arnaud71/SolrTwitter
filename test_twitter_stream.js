var bunyan = require('bunyan');             // for log
var Twitter = require('twitter');           // for twitter client api


var log = bunyan.createLogger({name: 'test_twitter_stream'});

var cfg = require(process.argv[2]);




var writeStream = function(stream) {

  stream.on('data', function (tweet) {
    log.info('tweet received: '+tweet.text+' at'+tweet.created_at);
  });

  stream.on('error', function (error) {
    log.fatal(error);
    throw error;
  });
}




var clientTwitter = new Twitter({
        consumer_key        : cfg.consumer_key,
        consumer_secret     : cfg.consumer_secret,
        access_token_key    : cfg.access_token_key,
        access_token_secret : cfg.access_token_secret
});

log.info(cfg.filter);

//var filter = JSON.parse(cfg.filter);

clientTwitter.stream('statuses/'+cfg.stream, cfg.filter , function(stream) {writeStream(stream) });




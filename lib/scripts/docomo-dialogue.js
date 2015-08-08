// Description
//   A Hubot script that calls the docomo dialogue API
//
// Dependencies:
//   None
//
// Configuration:
//   HUBOT_DOCOMO_DIALOGUE_API_KEY
//   HUBOT_DOCOMO_DIALOGUE_T
//   HUBOT_DOCOMO_DIALOGUE_PLACE
//
// Commands:
//   hubot * - calls the docomo dialogue API
//
// Author:
//   bouzuya <m@bouzuya.net>
//
module.exports = function(robot) {
  var commands = [];
  robot.brain.data.dialogue = {};
  return robot.respond(/(.*)/, function(res) {
    if(!res.match[1]) {
      return;
    }
    if(commands.length === 0){
      commands = robot.helpCommands().filter(function(cmd) {
        // get respond command
        return cmd.indexOf('hubot') === 0;
      }).map(function(cmd) {
        // get command name
        return cmd.split(' ')[1];
      }).filter(function(cmd, index, array) {
        // get unique command name
        return array.indexOf(cmd) === index;
      });
    }
    var commandExists = commands.some(function(cmd) {
      return cmd === res.match[1].split(' ')[0].toLowerCase();
    });
    if(commandExists){
      return;
    }
    var ctx, payload, room_id;
    payload = {
      utt: res.match[0],
      nickname: res.message.user.name,
      t: process.env.HUBOT_DOCOMO_DIALOGUE_T,
      place: process.env.HUBOT_DOCOMO_DIALOGUE_PLACE
    };
    room_id = res.message.user.reply_to || res.message.user.room;
    if (ctx = robot.brain.data.dialogue[room_id]) {
      payload.context = ctx.context;
      payload.mode = ctx.mode;
    }
    return res.http('https://api.apigw.smt.docomo.ne.jp/dialogue/v1/dialogue').header('Content-Type', 'application/json').query({
      APIKEY: process.env.HUBOT_DOCOMO_DIALOGUE_API_KEY
    }).post(JSON.stringify(payload))(function(err, _, body) {
      var data;
      if (err != null) {
        robot.logger.error(e);
        return res.send('docomo-dialogue: error');
      } else {
        data = JSON.parse(body);
        res.send(data.utt);
        return robot.brain.data.dialogue[room_id] = {
          context: data.context,
          mode: data.mode
        };
      }
    });
  });
};

const Discord = require("discord.js");
const client = new Discord.Client();
const secret = require("./secret.json")
const config = require("./config.json")
const fs = require('fs');

raunchyRegex = null

function sanitize(text)
{
  return text.replace("~~","")
    .replace("*","")
}

// load raunchy words
setInterval(function(){
  try {
    raunchyRegexString = String(fs.readFileSync("./dirty.txt"))
  } catch (err) {
    console.log("Error: require dirty.txt, a list of regexes for dirty words")
  }

  raunchyRegex = new RegExp(raunchyRegexString.split("\n").join("|"), "gi")
}, 2000)

// ignore contents of message
function message_blindeye(msg) {
  // mods are exempt
  if (msg.member) {
    if (msg.member.roles) {
      if (msg.member.roles.find(role => config.modRoles.includes(role.name)) != null)
        if (!msg.content.startsWith("!test"))
          return true;
    }
  }
  
  // bots are exempt
  if (msg.author.bot)
    return true;
  
  return false;
}

// returns a list of raunchy phrases in the message
function get_raunchy(msg) {
  if (raunchyRegex == null)
    return [];
  results = sanitize(msg.content).match(raunchyRegex)
  if (results == null)
    return [];
  return results.filter(word => word.length > 0);
}

// logs raunchiness from a message
function report_message(msg, raunch) {
  report_to(
    "" + msg.author.username + "#" + msg.author.discriminator + " said in " + msg.channel + ": \""
      + raunch.join(",\" \"") + "\".\n\n> " + msg.content,
    msg.guild
  )
}

// logs the given text message / report
function report_to(str, guild)
{
  console.log(str);
  channel = guild.channels.find(channel => channel.name == config.logChannel)
  if (channel)
  {
    channel.send(str)
  }
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  
  setInterval(function(){
    client.user.setStatus("invisible")
  }, 300);
});

client.on('message', msg => {
  process.stdout.write(">")
  if (!message_blindeye(msg))
  {
    raunch = get_raunchy(msg);
    if (raunch)
      if (raunch.length > 0)
        report_message(msg, raunch);
  }
});

client.login(secret.token);

client.on('disconnected', () => 
{
  console.log("DISCONNECTED");
  client.login(secret.token);
})

setInterval(function(){
    console.log("auto-reconnect...")
    client.login(secret.token);
}, 300000);
/*
 * Copyright 2016 Joachim Bakke
 * Borrowed shamelessly from https://github.com/sbender9/signalk-raymarine-autopilot,
 * https://github.com/SignalK/signalk-to-nmea0183 and
 * http://www.vermontficks.org/remkc.htm among others
 * 'sudo DEBUG=raymarine-seatalk1-autopilot ./bin/Kristina' to debug
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * npm require suncalc to switch on display on dusk or sunset
 */

const debug = require('debug')('raymarine-seatalk1-autopilot')

const Bacon = require('baconjs');

const util = require('util')

const utilSK = require('@signalk/nmea0183-utilities')

const _ = require('lodash')


const state_commands = {
    "auto":    "86,11,01,FE", //tested ok on ST2000+
    "wind":    "86,21,23,DC", //tested ok on ST2000+
    "route":   "86,11,03,FC", //tested ok on ST2000+
    "standby": "86,11,02,FD" //tested ok on ST2000+
  }
const heading_command = "84,06,%s0,%s,02,00,00,00,00"

const heading_plusOne = "86,11,07,F8" //tested ok on ST2000+
const heading_lessOne = "86,11,05,FA" //tested ok on ST2000+
const heading_plusTen = "86,11,08,F7" //tested ok on ST2000+
const heading_lessTen = "86,11,06,F9" //tested ok on ST2000+

//const wind_direction_command = "10,01,%s,%s"

/*
In case of a waypoint change, sentence 85, indicating the new bearing and distance,
should be transmitted prior to sentence 82 (which indicates the waypoint change).
Since no waypoint short name is available in Signal K, 'SK01' to 'SK99' will be counted.
*/

//const raymarine_ttw_Mode = "85,%s6,%s,%s,&s,%s,%s,00,%s"
//const raymarine_ttw = "82,05,%s,%s,%s,%s,%s,%s"

const target_heading_path = "steering.autopilot.target.headingMagnetic.value"
const current_wind_path = "environment.wind.angleApparent.value"
const target_wind_path = "steering.autopilot.target.windAngleApparent"
const target_wind_path_value = "steering.autopilot.target.windAngleApparent.value"
const state_path = "steering.autopilot.state.value"
const cross_track_path = "navigation.courseRhumbline.crossTrackError.value"
const bearing_magnetic_path = "navigation.courseRhumbline.bearingTrackMagnetic.value"
const next_wp_name_path = ""

module.exports = function(app) {
  var unsubscribe = undefined
  var plugin = {}

  plugin.start = function(props) {
    debug("starting...")
    debug("started")
  }


  plugin.registerWithRouter = function(router) {
    router.post("/command", (req, res) => {
      debug("command: " + util.inspect(req.body))
      sendCommand(app,  req.body)
      res.send("Executed command for plugin " + plugin.id)
    })
  }

  plugin.stop = function() {
    debug("stopping")
    if (unsubscribe) {
      unsubscribe()
    }
    debug("stopped")
  }

  plugin.id = "raymarineautopilot"
  plugin.name = "Raymarine Seatalk1 Autopilot"
  plugin.description = "Plugin that controls a Raymarine Seatalk 1 autopilot"

  plugin.schema = {
    title: "Raymarine Seatalk1 Autopilot Control",
    type: "object",
    properties: {
      }
  }

  return plugin;
}

function padd(n, p, c)
{
  var pad_char = typeof c !== 'undefined' ? c : '0';
  var pad = new Array(1 + p).join(pad_char);
  return (pad + n).slice(-pad.length);
}

function changeHeading(app, command_json)
{
  var ammount = command_json["value"]

  var state = _.get(app.signalk.self, state_path)
  var new_value
  var command_format
  var nmea0183_msgs

  debug("changeHeading: " + state + " " + ammount)
  if ( state == "auto" )
  {
    if (ammount == 1){return heading_plusOne}
    if (ammount == -1){return heading_lessOne}
    if (ammount == 10){return heading_plusTen}
    if (ammount == -10){return heading_lessTen}
  }
  else if ( state == "wind" )
  {
    var current = _.get(app.signalk.self, target_wind_path_value)
    var context = app.selfId
    debug("current wind angle: " + radsToDeg(current))
    new_value = radsToDeg(current)

    if ( new_value < 0 )
      new_value = 360 + new_value
    new_value += ammount
    debug("new wind target: " + new_value)

    const data = {
    context: "vessels." + app.selfId,
    updates: [
      {
        source: {"type":"NMEA0183","sentence":"STALK","label":"nmeaSTALK","talker":"AP-plugin"},
        timestamp: utilSK.timestamp(),
        values: [
          {
            'path': target_wind_path,
            'value': degsToRad(new_value)
          }
        ]
      }
    ],
  }
  debug("SK Delta: " + (JSON.stringify(data)))
  app.signalk.addDelta(data)

    if (ammount == 1){return heading_plusOne}
    if (ammount == -1){return heading_lessOne}
    if (ammount == 10){return heading_plusTen}
    if (ammount == -10){return heading_lessTen}
    }

  else
  {
    //error
  }

// not in use as MWV is passed through signalk-to-nmea0183:
/*  if ( new_value && command_format == wind_direction_command)
  {
    new_value = Math.trunc(degsToRad(new_value) * 10000)
    new_value = new_value * 2
    nmea0183_msgs = [util.format(command_format, padd((new_value & 0xff).toString(16), 2), padd(((new_value >> 8) & 0xff).toString(16), 2))]
  */
  /*
  target wind path structure "10,01,%s,%s" where 10  01  XX  YY  Apparent Wind Angle: XXYY/2 degrees right of bow
  

  }*/
  return nmea0183_msgs
}

function setState(app, command_json)
{
  var state = command_json["value"]
  if (state == "wind"){
    current = _.get(app.signalk.self, current_wind_path)
      const data = {
      context: "vessels." + app.selfId,
      updates: [
        {
          source: {"type":"NMEA0183","sentence":"STALK","label":"nmeaSTALK","talker":"AP-plugin"},
          timestamp: utilSK.timestamp(),
          values: [
            {
              'path': target_wind_path,
              'value': current
            }
          ]
        }
      ],
    }
    debug("SK Delta: " + (JSON.stringify(data)))
    app.signalk.addDelta(data)
  }
  debug("setState: " + state)
  return state_commands[state]
}

/*function advanceWaypoint(app, command_json)
{
  return [util.format(raymarine_ttw_Mode, (new Date()).toISOString()),
          util.format(raymarine_ttw, (new Date()).toISOString())]
}*/
/*
ttw_Mode 85:
 85  X6  XX  VU ZW ZZ YF 00 yf   Navigation to waypoint information
                  Cross Track Error: XXX/100 nautical miles
                   Example: X-track error 2.61nm => 261 dec => 0x105 => X6XX=5_10
                  Bearing to destination: (U & 0x3) * 90° + WV / 2°
                   Example: GPS course 230°=180+50=2*90 + 0x64/2 => VUZW=42_6
                   U&8: U&8 = 8 -> Bearing is true, U&8 = 0 -> Bearing is magnetic
                  Distance to destination: Distance 0-9.99nm: ZZZ/100nm, Y & 1 = 1
                                           Distance >=10.0nm: ZZZ/10 nm, Y & 1 = 0
                  Direction to steer: if Y & 4 = 4 Steer right to correct error
                                      if Y & 4 = 0 Steer left  to correct error
                  Example: Distance = 5.13nm, steer left: 5.13*100 = 513 = 0x201 => ZW ZZ YF=1_ 20 1_
                           Distance = 51.3nm, steer left: 51.3*10  = 513 = 0x201 => ZW ZZ YF=1_ 20 0_
                  Track control mode:
                     F= 0x1: Display x-track error and Autopilot course
                     F= 0x3: Enter Track Control Mode, i.e. lock on to GPS.
                             Display x-track error, autopilot course and bearing
                             to destination
                     F= 0x5: Display x-track error, distance to waypoint,
                             autopilot course and bearing to destination
           normal--> F= 0x7: Enter Track Control Mode, i.e. lock on to GPS.
                             Display x-track error, distance to waypoint,
                             autopilot course and bearing to destination
                     F= 0xF: As 0x7 but with x-track error alarm
                     F= 2, 4, 6, 8 ... causes data errors
ttw 82 :
82  05  XX  xx YY yy ZZ zz   Target waypoint name
                 XX+xx = YY+yy = ZZ+zz = FF (allows error detection)
                 Takes the last 4 chars of name, assumes upper case only
                 Char= ASCII-Char - 0x30
                 XX&0x3F: char1
                 (YY&0xF)*4+(XX&0xC0)/64: char2
                 (ZZ&0x3)*16+(YY&0xF0)/16: char3
                 (ZZ&0xFC)/4: char4
*/

function sendCommand(app, command_json)
{
  var nmea0183_msgs = null
  var action = command_json["action"]
  debug("action: " + action)
  if ( action == "setState" )
  {
    nmea0183_msgs = setState(app, command_json)
  }
  else if ( action == "changeHeading" )
  {
    nmea0183_msgs = changeHeading(app, command_json)
  }
  /*else if ( action == 'advanceWaypoint' )
  {
    nmea0183_msgs = advanceWaypoint(app, command_json)
  }*/
  if ( nmea0183_msgs )
  {
    debug("nmea0183_msg: " + nmea0183_msgs)
    nmea0183out = toSentence([
      '$STALK',
      nmea0183_msgs
    ]);

    debug("nmea0183out: " + nmea0183out)
    app.emit('nmea0183out', nmea0183out)
  }
}

function radsToDeg(radians) {
  return radians * 180 / Math.PI
}

function degsToRad(degrees) {
  return degrees * (Math.PI/180.0);
}

function toSentence(parts) {
  var base = parts.join(',');
  return base + computeChecksum(base);
}
var m_hex = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F'
];

function computeChecksum(sentence) {
  var c1;
  var i;

  // skip the $
  i = 1;

  // init to first character    var count;

  c1 = sentence.charCodeAt(i);

  // process rest of characters, zero delimited
  for (i = 2; i < sentence.length; ++i) {
    c1 = c1 ^ sentence.charCodeAt(i);
  }

  return '*' + toHexString(c1);
};

function toHexString(v) {
  var lsn;
  var msn;

  msn = (v >> 4) & 0x0f;
  lsn = (v >> 0) & 0x0f;
  return m_hex[msn] + m_hex[lsn];
};

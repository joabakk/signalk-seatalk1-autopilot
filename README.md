# signalk-seatalk1-autopilot

[![Greenkeeper badge](https://badges.greenkeeper.io/joabakk/signalk-seatalk1-autopilot.svg)](https://greenkeeper.io/)

Enables Signal K control of Raymarine Seatalk 1 autopilots. Tested with WilhelmSK iOS app and with ST2000+ autopilot. 

Requires 
* a recent version of signal-server-node with the ability to send NMEA0183 to the interface 
* signalk-to-nmea0183 plugin with APB (for route control) and MWV (for wind steer) enabled (or directly from NMEA0183)
* An NMEA0183 to seatalk device which can transmit $STALK enclosed datagrams (such as http://www.gadgetpool.de/nuke/modules.php?name=News&file=article&sid=28)

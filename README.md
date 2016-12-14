# signalk-seatalk1-autopilot

Enables Signal K control of Raymarine Seatalk 1 autopilots. Tested with WilhelmSK iOS app and with ST2000+ autopilot. 

Requires 
* a node server with the ability to send NMEA0183 to the interface (under development also)
* signalk-to-nmea0183 plugin with APB (for route control) and MWV (for wind steer) enabled
* An NMEA0183 to seatalk device which can transmit $STALK enclosed datagrams (such as http://www.gadgetpool.de/nuke/modules.php?name=News&file=article&sid=28) with the line `"toStdout": "nmea0183out"` after `"baudrate": 4800,` under `"options"` in the settings json file.

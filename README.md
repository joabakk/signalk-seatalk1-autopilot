# signalk-seatalk1-autopilot

DEPRECATED, use SignalK/signalk-autopilot instead

Enables Signal K control of Raymarine Seatalk 1 autopilots. Tested with WilhelmSK iOS app and with ST2000+ autopilot.

Requires
* a recent version of signal-server-node with the ability to send NMEA0183 to the interface
* signalk-to-nmea0183 plugin with APB (for route control) and MWV (for wind steer) enabled (or directly from NMEA0183)
* An NMEA0183 to seatalk device which can transmit $STALK enclosed datagrams (such as these from [gadgetpool](http://www.gadgetpool.de/nuke/modules.php?name=News&file=article&sid=28) or [Digital Yacht](https://digitalyachtamerica.com/product/st-nmea-usb/)). PLease note that there are other units that translate from SEATALK1 to NMEA0183, but many of these are not bidirectional
* the line ```"toStdout": "nmea0183out"``` 	
after `"baudrate": 4800,` under `"options"` in the settings json file.

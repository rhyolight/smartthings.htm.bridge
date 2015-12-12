import os

from influxdb import InfluxDBClient

# This is only necessary for Python < 2.7.9
# import urllib3.contrib.pyopenssl
# urllib3.contrib.pyopenssl.inject_into_urllib3()


INFLUX_HOST = os.environ["INFLUX_HOST"]
INFLUX_PORT = os.environ["INFLUX_PORT"]
INFLUX_USER = 'numenta' #os.environ["INFLUX_USER"]
INFLUX_PASS = 'PWXucoyNe7n8' #os.environ["INFLUX_PASS"]
INFLUX_DB = "smartthings"

print("Connecting to {0}:{1}@{2}:{3}".format(
  INFLUX_USER, INFLUX_PASS, INFLUX_HOST, INFLUX_PORT
))
client = InfluxDBClient(
  host=INFLUX_HOST, 
  port=INFLUX_PORT, 
  username=INFLUX_USER, 
  password=INFLUX_PASS, 
  database=INFLUX_DB,
  ssl=True
)


def saveResult(result, point):
  print "Saving data and HTM result"
  anomalyScore = result["inferences"]["anomalyScore"]
  anomalyLikelihood = result["anomalyLikelihood"]
  payload = [{
    "tags": {
      "component": point["component"]
    },
    "time": point["time"],
    "measurement": point["stream"],
    "fields": {
      "value": float(point["value"]),
      "anomalyScore": anomalyScore,
      "anomalyLikelihood": anomalyLikelihood
    }
  }]
  print payload
  client.write_points(payload)


def listSensors():
  return client.get_list_series()


def getSensorData(measurement, component):
  return client.query(
    "select * from " + measurement + " where component = '" + component + "'"
  )
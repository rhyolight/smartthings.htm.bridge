#!/usr/bin/env python
# -*- coding: utf-8 -*-
# ----------------------------------------------------------------------
# Numenta Platform for Intelligent Computing (NuPIC)
# Copyright (C) 2015-2016, Numenta, Inc.  Unless you have an agreement
# with Numenta, Inc., for a separate license for this software code, the
# following terms and conditions apply:
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License version 3 as
# published by the Free Software Foundation.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
# ----------------------------------------------------------------------
import sys
import json
from optparse import OptionParser

import iso8601

from runapp import getHitcClient, runOneDataPoint
from influxclient import SensorClient


get_class = lambda x: globals()[x]

def createOptionsParser():
  parser = OptionParser(
    usage="%prog <subject>:<action> [options]"
  )

  parser.add_option(
    "-v",
    "--verbose",
    action="store_true",
    default=False,
    dest="verbose",
    help="Print debugging statements.")
  parser.add_option(
    "-g",
    "--guid",
    dest="guid",
    help="Model id.")
  parser.add_option(
    "-p",
    "--param-path",
    dest="paramPath",
    help="Path to model params JSON file.")
  parser.add_option(
    "-c",
    "--component",
    dest="component",
    help="Sensor component.")
  parser.add_option(
    "-m",
    "--measurement",
    dest="measurement",
    help="Sensor measurement.")
  parser.add_option(
    "-l",
    "--limit",
    dest="limit",
    help="Sensor data limit when fetching.")
  parser.add_option(
    "-s",
    "--since",
    dest="since",
    help="Provides a lower bound for time-based queries. Should be a time string.")
  parser.add_option(
    "-f",
    "--from",
    dest="from",
    help="InfluxDB database name.")
  parser.add_option(
    "-t",
    "--to",
    dest="to",
    help="InfluxDB database name.")
  parser.add_option(
    "-a",
    "--aggregate",
    dest="aggregate",
    help="Time period to aggregate a MEAN over the data.")

  return parser


# Subjects / Actions

class models:


  def __init__(self, hitcClient, sensorClient):
    self._hitcClient = hitcClient
    self._sensorClient = sensorClient


  def list(self, **kwargs):
    models = self._hitcClient.get_all_models()
    if len(models) < 1:
      print "NO MODELS"
    else:
      print "CURRENT MODELS:"
      for m in models:
        print " - %s" % m.guid


  def create(self, **kwargs):
    validateOptions(["paramPath"], kwargs)
    paramPath = kwargs["paramPath"]
    with(open(paramPath, "r")) as paramFile:
      params = json.loads(paramFile.read())
      if "guid" in kwargs and kwargs["guid"] is not None:
        params["guid"] = kwargs["guid"]
      elif kwargs["measurement"] is not None and kwargs["component"] is not None:
        params["guid"] = kwargs["component"] + "_" + kwargs["measurement"]
        kwargs["guid"] = params["guid"]
      try:
        model = self._hitcClient.create_model(params)
      except KeyError as e:
        print "Model with id '%s' already exists." % params["guid"]
      print "Created model '%s'" % model.guid
      if kwargs["measurement"] is not None and kwargs["component"] is not None:
        self.loadData(**kwargs)


  def delete(self, **kwargs):
    validateOptions(["guid"], kwargs)
    guid = kwargs["guid"]
    for model in self._hitcClient.get_all_models():
      if model.guid == guid:
        model.delete()
        print "Deleted model '%s' from HITC" % guid
    component, measurement = guid.split('_')
    self._sensorClient.deleteInferences(measurement + "_inference", component)
    print "Deleted all inferences for {}_{}".format(component, measurement);

  def deleteAll(self, **kwargs):
    for model in self._hitcClient.get_all_models():
      model.delete()
      print "Deleted model '%s'" % model.guid


  def loadData(self, **kwargs):
    validateOptions(["component", "measurement", "guid"], kwargs)
    data = self._sensorClient.getSensorData(
      kwargs["measurement"],
      kwargs["component"],
      limit=kwargs["limit"],
      since=kwargs["since"],
      aggregate=kwargs["aggregate"],
      verbose=kwargs["verbose"]
    )["series"][0]
    guid = kwargs["guid"]
    results = []
    for point in data["values"]:
      pointTime = point[0]
      pointValue = point[1]
      if pointValue is not None:
        result = runOneDataPoint(
          self._hitcClient,
          guid,
          iso8601.parse_date(pointTime),
          pointValue,
          verbose=kwargs["verbose"]
        )
        timezone = "unknown"
        if "timezone" in data:
          timezone = data["timezone"]
        self._sensorClient.saveHtmInference(
          result, kwargs["component"], kwargs["measurement"], pointTime, timezone
        )
        results.append(result)
    print "Loaded %i data points into model '%s'." % (len(results), guid)



class sensors:


  def __init__(self, hitcClient, sensorClient):
    self._hitcClient = hitcClient
    self._sensorClient = sensorClient


  def data(self, **kwargs):
    validateOptions(["component", "measurement"], kwargs)
    data = self._sensorClient.queryMeasurement(
      kwargs["measurement"], kwargs["component"],
      limit=kwargs["limit"]
    )["series"][0]
    values = data["values"]
    columns = data["columns"]
    print columns
    for v in values:
      print(v)


  def inference(self, **kwargs):
    validateOptions(["component", "measurement"], kwargs)
    data = self._sensorClient.queryMeasurement(
      kwargs["measurement"] + "_inference", kwargs["component"],
      limit=kwargs["limit"], verbose=kwargs["verbose"]
    )["series"][0]
    values = data["values"]
    columns = data["columns"]
    print columns
    for v in values:
      print(v)


  def list(self, **kwargs):
    print "{0:<28} {1:<30}".format("measurement", "component").upper()
    print "{0:<28} {1:<30}".format("===========", "=========")
    for s in self._sensorClient.listSensors():
      name = s["name"]
      print "{0:<28} {1:<30}".format(name, s["tags"][0]["component"])
    print "{0:<28} {1:<30}".format("===========", "=========")


  def transfer(self, **kwargs):
    validateOptions(["from", "to", "component", "measurement"], kwargs)
    self._sensorClient.transfer(**kwargs)



# Helper functions

def validateOptions(required, options):
  for r in required:
    if r not in options.keys() or options[r] is None:
      raise Exception("The command executed requires the '{}' option.".format(r))


def extractIntent(command):
  if ":" in command:
    return command.split(":")
  else:
    return command, None


def displayInfo(hitcClient, sensorClient):
  print "Using InfluxDb at {}".format(sensorClient)
  print "\tdefault database is '{}'".format(sensorClient._database)
  print "Using HITC at {}".format(hitcClient.url)



def runAction(subject, action, **kwargs):
  hitcClient = getHitcClient()
  sensorClient = SensorClient(
    "smartthings_htm_bridge", verbose=kwargs["verbose"]
  )
  if subject == "info":
    displayInfo(hitcClient, sensorClient)
  else:
    subjectType = get_class(subject)(hitcClient, sensorClient)
    actionFunction = getattr(subjectType, action)
    print "\n* * *\n"
    actionFunction(**kwargs)


# Start here

if __name__ == "__main__":
  parser = createOptionsParser()
  options, args = parser.parse_args(sys.argv[1:])
  if len(args) < 1:
    raise ValueError("Please provide a command.")
  subject, action = extractIntent(args[0])
  runAction(subject, action, **vars(options))

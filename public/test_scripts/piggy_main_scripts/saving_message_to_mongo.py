# this test file takes an encoded emai, decodes it, parese out order information and saves it to the database
# also changes the status of the messages db from "need to scrape" to "scraped"
#
#
#
#required encoding for scraping, otherwise defaults to unicode and screws things up
from bs4 import BeautifulSoup
import requests
import sys;
import json;
#reload(sys);
#sys.setdefaultencoding("utf8")
import re
import pandas as pd
import pprint
import numpy as np
import csv, sys
import base64
import datefinder

import pymongo
from pymongo import MongoClient


uri = 'mongodb://heroku_4jtg3rvf:r9nq5ealpnfrlda5la4fj8r192@ds161503.mlab.com:61503/heroku_4jtg3rvf'
client = MongoClient(uri)
db = client['heroku_4jtg3rvf']

#client = MongoClient('mongodb://localhost:27017/test')
#db = client.test

#Read data from stdin
def read_in():
    lines = sys.stdin.readlines()
    # Since our input would only be having one line, parse our JSON data from that
    return json.loads(lines[0])

def main():
    #get our data as an array from read_in()
    lines = read_in()

    #create a dictonlary
    dic = {
       'email': lines[0],
       'date_extracted': lines[1],
       'thread_id': lines[2],
       'encoded_message': lines[3],
       'status': lines[4]
    }

    result = db.messages.insert_one(dic)


    print('MIMZEY did it')

# Start process
if __name__ == '__main__':
    main()

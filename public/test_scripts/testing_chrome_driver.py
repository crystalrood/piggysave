#required encoding for scraping, otherwise defaults to unicode and screws things up
from bs4 import BeautifulSoup
import requests
import sys
import re
import pandas as pd
import pprint
import numpy as np
import csv, sys
import base64

import pymongo
from pymongo import MongoClient

from lxml import html  
import csv,json
#from exceptions import ValueError
from time import sleep
import webbrowser
import selenium
from selenium.webdriver.common.keys import Keys
from selenium import webdriver
import time
import os

client = MongoClient('mongodb://heroku_4jtg3rvf:r9nq5ealpnfrlda5la4fj8r192@ds161503.mlab.com:61503/heroku_4jtg3rvf')
db = client['heroku_4jtg3rvf']


# initiating chrome driver --https://stackoverflow.com/questions/41059144/running-chromedriver-with-python-selenium-on-herokup

GOOGLE_CHROME_BIN = '/app/.apt/usr/bin/google-chrome'
CHROMEDRIVER_PATH = '/usr/bin/google-chrome'
#GOOGLE_CHROME_BIN = '/app/.apt/opt/google/chrome/chrome'
#GOOGLE_CHROME_SHIM = '/app/.apt/usr/bin/google-chrome-stable'


#chrome_options = webdriver.ChromeOptions()
#chrome_options.binary_location = GOOGLE_CHROME_BIN
#chrome_options.add_argument('--disable-gpu')
#chrome_options.add_argument('--no-sandbox')
#driver = webdriver.Chrome(executable_path=CHROMEDRIVER_PATH, chrome_options=chrome_options)

#chrome_options= webdriver.ChromeOptions()
#chrome_options.binary_location = os.environ.get('GOOGLE_CHROME_SHIM', None)
#driver = webdriver.Chrome(chrome_options=chrome_options)


chrome_bin = os.environ.get('GOOGLE_CHROME_SHIM', None)
opts = ChromeOptions()
opts.binary_location = chrome_bin
driver = webdriver.Chrome(executable_path="chromedriver", chrome_options=opts)
webdriver.Chrome(DRIVER)

## used for local testing
#chromedriver = "/Users/crystalm/Downloads/chromedriver"
#os.environ["webdriver.chrome.driver"] = chromedriver
#chrome_options = webdriver.ChromeOptions()
#chrome_options.add_argument('--no-sandbox')
#driver = webdriver.Chrome(chromedriver, chrome_options=chrome_options)


driver.get('https://www.amazon.com/gp/sign-in.html')
time.sleep(1) # Let the user actually see something!
email = driver.find_element_by_name('email')
email.clear()
email.send_keys('crystal.wesnoski@gmail.com')
driver.find_element_by_id('continue').click()
password = driver.find_element_by_name('password')
password.clear()
password.send_keys('cw1992')
driver.find_element_by_name('rememberMe').click()
driver.find_element_by_id('signInSubmit').click()
driver.get('https://www.amazon.com/dp/B01MCULB3G')
time.sleep(1)
driver.find_element_by_id('amzn-ss-text-link').click()
time.sleep(2)
url = driver.find_element_by_id("amzn-ss-text-shortlink-textarea").text
time.sleep(2)
driver.quit()


url
dic = {
   'url_short': url
  }
result = db.test_submit.insert_one(dic)

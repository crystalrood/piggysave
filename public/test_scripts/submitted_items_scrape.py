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

#client = MongoClient('localhost', 27017)
#client = MongoClient('mongodb://localhost:27017/')
#db = client.test
#mydb = client.test.submitted_items
client = MongoClient('mongodb://heroku_4jtg3rvf:r9nq5ealpnfrlda5la4fj8r192@ds161503.mlab.com:61503/heroku_4jtg3rvf')
db = client['heroku_4jtg3rvf']
mydb = db.submitted_items
submissions = pd.DataFrame(list(mydb.find()))
submissions = submissions[(submissions.added== 'no')]
submisission = submissions[['email', 'item_url', 'date']]

#setting up dataframe to input all information
columns = ['retailer','url', 'price', 'image_link', 'name', 'email', 'has_account', \
          'date_submitted', 'followup_date', 'send_email_flag', \
          'last_price', 'last_date_checked', 'low_price', 'low_price_date',\
          'high_price', 'high_price_date']
df = pd.DataFrame(columns=columns)

for index, row in submisission.iterrows():
    item_url = row['item_url']
    email = row['email']
    has_account = 'no'
    date_submitted = row['date']
    followup_date = '0'
    send_email_flag = 'no'
    
    #print(item_url)

##-------------------------------------    
#getting the retailer
##-------------------------------------
    if "nordstrom.com" in item_url: 
        retailer = 'norstrom'
    elif "amazon.com" in item_url:
        retailer = 'amazon'
    elif "walmart.com" in item_url:
        retailer = 'walmart'
    elif "macys.com" in item_url:
        retailer = 'macys'
    elif "costco.com" in item_url:
        retailer = 'costco'
    elif "qvc.com" in item_url:
        retailer = 'qvc'
    elif "target.com" in item_url:
        retailer = 'target'
    elif "nike.com" in item_url:
        retailer = 'nike'
    else:
        retailer = 'other'
        
##-------------------------------------
#if the retailer is nordstrom, then grab all of the info needed 
##-------------------------------------
    if retailer == 'norstrom':
        
       
        ##-------------------------------------
        ## getting the price of the item
        ##-------------------------------------
        html = requests.get(item_url).text
        soup = BeautifulSoup(html, "html.parser")

        #this class appears only if the item is on sale
        divTagSale = soup.find_all("div", {"class": "current-price price-display-sale"})

        #this appears regarldless of sale
        divTagNoSale = soup.find_all("div", {"class": "current-price"})


        #if divtagsale exists then use divtagsale, else use no sale
        if len(divTagSale)>0:
            divTag = divTagSale
        else:
            divTag = divTagNoSale

        price = divTag[0].string

        #print(price)
        
        ##-------------------------------------
        ## getting the item name + item image link
        ##-------------------------------------
        html2 = requests.get(item_url).text
        soup2 = BeautifulSoup(html2, "html.parser")
        divTag2 = soup2.find_all("div", {"class": "main-content-image-wrapper"})
        if len(divTag2)>0:
            image_link = divTag2[0].find('img')['src']
            item_name = divTag2[0].find('img')['alt']
        else:
            image_link = 'mimzey fix this shit'

        #print(image_link)
        #print(item_name)

        ##-------------------------------------
        ## shortening the URL
        ##-------------------------------------
        condensed = item_url.split('?')[0]
        #print(condensed)
    
    
##-------------------------------------
#if the retailer is amazon, then grab all of the info needed 
##-------------------------------------
    elif retailer == 'amazon':
        
        ##-------------------------------------
        ## getting the price of the item
        ##-------------------------------------
        ###html = requests.get(item_url).text
        ###soup = BeautifulSoup(html, "html.parser")

        #this class appears only if the item is on sale
        ###divTag = soup.find_all("span", {"id": "priceblock_ourprice"})
        ###price = divTag[0].string
        price = 0
        #print(price)
        
        ##-------------------------------------
        ## getting the item name + item image link 
        ##-------------------------------------
        ###html2 = requests.get(item_url).text
        ###soup2 = BeautifulSoup(html2, "html.parser")
        ###divTag2 = soup2.find_all("div", {"id": "imgTagWrapperId"})

        ###if len(divTag2)>0:
            ###image_link = divTag2[0].find('img')['src']
            ###item_name = divTag2[0].find('img')['alt']
        ###else:
            ###image_link = 'mimzey fix this shit'

        #print(item_name)
        #print(image_link)

        image_link = 0
        item_name = 0
        ##-------------------------------------
        ## shortening the URL
        ##-------------------------------------
        if "/ref" in item_url: 
            condensed = item_url.split('/ref')[0]
        elif "?ref" in item_url:
            condensed = item_url.split('?ref')[0]
        else:
            condensed = 'mimsey get your shit together'
        #print(condensed)
        
     
    last_price = price
    last_date_checked = row['date']
    low_price = price
    low_price_date = row['date']
    high_price = price
    high_price_date = row['date']
    #adding items to dataframe
    df.loc[len(df)]=[retailer, condensed, price, image_link, item_name,\
                     email, has_account, date_submitted, followup_date, \
                     send_email_flag, last_price, last_date_checked, low_price, \
                     low_price_date, high_price, high_price_date
                    ]


for index, row in df.iterrows():
    dic = {
       'retailer': row['retailer'],
       'url': row['url'],
       'price': row['price'],
       'image_link': row['image_link'],
       'name': row['name'],
       'email': row['email'],
       'has_account': row['has_account'],
       'date_submitted': row['date_submitted'],
       'followup_date': row['followup_date'],
       'send_email_flag': row['send_email_flag'],
       'last_price': row['last_price'],
       'last_date_checked': row['last_date_checked'],
       'low_price': row['low_price'],
       'low_price_date': row['low_price_date'],
       'high_price': row['high_price'],
       'high_price_date': row['high_price_date']
      }
    result = db.item_to_user.insert_one(dic)

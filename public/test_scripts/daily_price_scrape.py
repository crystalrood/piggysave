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
import datetime
import time

import pymongo
from pymongo import MongoClient

client = MongoClient('localhost', 27017)
#client = MongoClient('mongodb://localhost:27017/')
db = client.test
mydb = client.test.item_to_user
itemsToUsers = pd.DataFrame(list(mydb.find()))

for index, row in itemsToUsers.iterrows():
    item_url = row['url']
    retailer = row['retailer']
    last_price = row['last_price']
    low_price = row['low_price']
    high_price = row['high_price']
    first_price = row['price']
    #print(item_url)
    #print(index)
    
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
        
        
        
    elif retailer == 'amazon':
        ##-------------------------------------
        ## getting the price of the item
        ##-------------------------------------
        html = requests.get(item_url).text
        soup = BeautifulSoup(html, "html.parser")

        #this class appears only if the item is on sale
        divTag = soup.find_all("span", {"id": "priceblock_ourprice"})
        price = divTag[0].string
        #print(price)
        
    
    #checking conditions
    #getting the date in unixtime today
    today = str(round(time.time()))

    # 1 compare new price with last price
    ### if new price < first price then set send_email_flag = yes

    if first_price > price:
        itemsToUsers.at[index, 'send_email_flag'] = 'yes'

    # 2 update last price with new price + the date
    ### last price = new price
    itemsToUsers.at[index, 'last_price'] = price
    itemsToUsers.at[index, 'last_date_checked'] = today
                

    # 2 compare new price with high price
    ### if high price < new price -- update high price 

    if float(price.lstrip('$')) > float(high_price.lstrip('$')):
        itemsToUsers.at[index, 'high_price'] = price
        itemsToUsers.at[index, 'high_price_date'] = today

    # 3 compare new price with low price
    ### if low price > new price -- update low price 
    if float(price.lstrip('$')) < float(low_price.lstrip('$')):
        itemsToUsers.at[index, 'low_price'] = price
        itemsToUsers.at[index, 'low_price_date'] = today


for index, row in itemsToUsers.iterrows():
    db.item_to_user.update_many(
        {"_id": row['_id']},
        {"$set": {
            "retailer": row['retailer'],
            "url": row['url'],
            "price": row['price'],
            "image_link": row['image_link'],
            "name": row['name'],
            "email": row['email'],
            "has_account": row['has_account'],
            "date_submitted": row['date_submitted'],
            "followup_date": row['followup_date'],
            "send_email_flag": row['send_email_flag'],
            "last_price": row['last_price'],
            "last_date_checked": row['last_date_checked'],
            "low_price": row['low_price'],
            "low_price_date": row['low_price_date'],
            "high_price": row['high_price'],
            "high_price_date": row['high_price_date']

            }
        }
    )


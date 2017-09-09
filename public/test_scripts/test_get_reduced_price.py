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
import datefinder
import datetime

import pymongo
from pymongo import MongoClient
local_host = 'mongodb://localhost:27017/test'
uri = 'mongodb://crystalrood:Crystal1992@ds161503.mlab.com:61503/heroku_4jtg3rvf'
client = MongoClient(uri)

## consolidating big block of code

db = client.test
orders = db.order_info_item_scrapes
orders = pd.DataFrame(list(orders.find()))

#setting the data frame to only have things that were tracked the previous check
orders = orders[(orders.status == 'tracking')]

#going through everything that was pulled in the table
for index, row in orders.iterrows():

    #setting up date things that are able to be compared
    datestring = row['date_placed'].encode('utf-8')
    split_date = datestring.split('/')
    today = datetime.date.today()
    margin = datetime.timedelta(days = 14)
    #status available tracking, not eligible, contacted, confirmed


    #if something is eligable to be checked, then we're going to
    if today - margin <= datetime.date(int(split_date[2]), int(split_date[0]), int(split_date[1])):

        url = row['link_to_product'].encode('utf-8')
        html = requests.get(url).text
        soup = BeautifulSoup(html, "html.parser")

        #this class appears only if the item is on sale
        divTag = soup.find_all("div", {"class": "current-price price-display-sale"})
        orders.set_value(index, 'last_date_checked', today)

        #check to see if there is even a sale price listed for the item
        if len(divTag)>0:
            price = divTag[0].string
            price = price.lstrip('Sale: ').encode('utf-8')
            orders.set_value(index,'price_last_check',price)

            # another check to ensure that the price found is less than the current price
            # if it is less the DF will be updated in the code below
            if price < row['purchase_price']:

                #trying to convert non-numeric price to get the price difference
                non_decimal = re.compile(r'[^\d.]+')
                value = non_decimal.sub('', test.encode('utf-8'))
                price_difference = float(value.lstrip('$')) - float(price.lstrip('$'))

                #setting price difference, status, reduced price and date the price reduced field
                orders.set_value(index, 'price_difference', price_difference)
                orders.set_value(index,'status', 'need_to_contact')
                orders.set_value(index,'reduced_price', price)
                orders.set_value(index,'date_price_reduced',today)

    #if the date over the 14 day period, update the status to relfect not eligable
    if today - margin > datetime.date(int(split_date[2]), int(split_date[0]), int(split_date[1])):
        orders.set_value(index,'status','not_eligible')


db = client.test
for index, row in orders.iterrows():
    db.order_info_item_scrapes.update_many(
        {"_id": row['_id']},
        {"$set": {
            "order_num": row['order_num'].encode('utf-8'),
            "zipcode": row['zipcode'].encode('utf-8'),
            "image": row['image'].encode('utf-8'),
            "quantity": row['quantity'].encode('utf-8'),
            "purchase_price": row['purchase_price'].encode('utf-8'),
            "item_name": row['item_name'].encode('utf-8'),
            "size": row['size'].encode('utf-8'),
            "style": row['style'].encode('utf-8'),
            "tracking_num": row['tracking_num'].encode('utf-8'),
            "date_placed": row['date_placed'],
            "email": row['email'].encode('utf-8'),
            "retailer": row['retailer'].encode('utf-8'),
            "thread_id": row['thread_id'].encode('utf-8'),
            "status": row['status'].encode('utf-8'),
            "last_date_checked": str(row['last_date_checked']),
            "price_last_check": row['price_last_check'],
            "date_price_reduced": str(row['date_price_reduced']),
            "reduced_price": row['reduced_price'],
            "date_refunded_difference": str(row['date_refunded_difference']),
            "price_difference": row['price_difference'],
            "link_to_product": row['link_to_product'].encode('utf-8'),
            "image_link_2": row['image_link_2'].encode('utf-8'),
            "item_name_2": row['item_name_2']
            }
        }
    )

print 'testandsuccess'

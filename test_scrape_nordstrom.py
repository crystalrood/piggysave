#required encoding for scraping, otherwise defaults to unicode and screws things up
from bs4 import BeautifulSoup
import requests
import sys;
import re
import pandas as pd
import pprint
import numpy as np
import csv, sys
import base64
import datefinder

import pymongo
from pymongo import MongoClient
client = MongoClient('mongodb://localhost:27017/test')


## consolidating big block of code

db = client.test
orders = db.order_info_from_email
orders = pd.DataFrame(list(orders.find()))
#removing duplicates
del orders['_id']
orders = orders.drop_duplicates()


columns = ['order_num','zipcode', 'image', 'quantity', 'unit_price', 'item_name', 'size', 'style', 'tracking_num']
#setting up dataframe
df = pd.DataFrame(columns=columns)


for index, row in orders.iterrows():
    order_num = row['order_num']
    if (order_num != 'not available'):
        print order_num
        match = re.search(r'\b\d{5}(?:-\d{4})?\b',  row['billing_address'])
        zipcode = match.group(0)

        url = 'https://secure.nordstrom.com/OrderLookupStatus.aspx?ordernum='+order_num+'&zipcode='+zipcode+'&origin=orderinfo'

        html = requests.get(url).text
        soup = BeautifulSoup(html, "html.parser")
        divTag = soup.find_all("div", {"class": "ostatIRBox"})

        order_info = []
        for div in divTag:
             #getting each row
            image = ''
            item_name = ''
            quantity = ''
            unit_price = ''
            style = ''
            tracking_num = ''
            shipping_info = ''
            size = ''

            image = div.find_all('tr')[1].find_all('td')[1].img['src'].encode('utf-8')
            quantity =  div.find_all('tr')[1].find_all('td')[3].text.strip().encode('utf-8')
            unit_price = div.find_all('tr')[1].find_all('td')[4].text.strip().encode('utf-8')
            #shipping_info = div.find_all('tr')[1].find_all('td')[5].text.strip().encode('utf-8')
            item_name = div.find_all('tr')[1].find_all('td')[2].text.strip().encode('utf-8').splitlines()[0]
            size = div.find_all('tr')[1].find_all('td')[2].text.strip().encode('utf-8').splitlines()[6].lstrip()
            style = div.find_all('tr')[1].find_all('td')[2].text.strip().encode('utf-8').splitlines()[12].lstrip()
            try:
                tracking_num = div.find_all('tr')[1].find_all('td')[5].text.strip().encode('utf-8').splitlines()[3]
            except:
                tracking_num = 'not available'
                pass
            
            df.loc[len(df)]=[order_num, 
                               zipcode,
                               image,
                               quantity,
                               unit_price,
                               item_name,
                               size,
                               style,
                               tracking_num] 
            order_info.append((order_num, 
                               zipcode,
                               image,
                               quantity,
                               unit_price,
                               item_name,
                               size,
                               style,
                               tracking_num
                              ))
db = client.test
for index, row in df.iterrows():
    dic = {'order_num': row['order_num'],
       'zipcode': row['zipcode'],
       'image': row['image'],
       'quantity': row['quantity'],
       'unit_price': row['unit_price'],
       'item_name': row['item_name'],
       'size': row['size'],
       'style': row['style'],
       'tracking_num': row['tracking_num'],
      }
    result = db.order_info_item_scrape.insert_one(dic)
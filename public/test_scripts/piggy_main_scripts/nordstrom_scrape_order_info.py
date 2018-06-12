# this file scrapes the order number from the nordstrom website
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

import pymongo
from pymongo import MongoClient

#uri = 'mongodb://heroku_4jtg3rvf:r9nq5ealpnfrlda5la4fj8r192@ds161503.mlab.com:61503/heroku_4jtg3rvf'
#client = MongoClient(uri)
#db = client['heroku_4jtg3rvf']


client = MongoClient('mongodb://localhost:27017/test')
db = client.test

## consolidating big block of code

orders = db.order_info_from_email
orders = pd.DataFrame(list(orders.find()))
if len(orders) > 0:
  #removing duplicates
  del orders['_id']
  orders = orders.drop_duplicates()
  ##here i'm filter out ones that i need to scrape
  orders = orders[(orders.status == 'need to scrape')]



  columns = ['order_num','zipcode', 'image', 'quantity', 'unit_price', 'item_name', 'size', 'style', 'tracking_num']
  #setting up dataframe
  df = pd.DataFrame(columns=columns)


  for index, row in orders.iterrows():
      order_num = row['order_num']
      if (order_num != 'not available'):
          # print order_num
          match = re.search(r'\b\d{5}(?:-\d{4})?\b',  row['billing_address'])
          zipcode = row['zipcode']

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
              if size == 'Size:':
                  size = div.find_all('tr')[1].find_all('td')[2].text.strip().encode('utf-8').splitlines()[7].lstrip()
              if style == 'Style:':
                  style = div.find_all('tr')[1].find_all('td')[2].text.strip().encode('utf-8').splitlines()[13].lstrip()

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
  ##deleting some of the unnecessary stuff from the orders df to merge
  del orders['billing_address']
  del orders['status']
  del orders['zipcode']

  df = pd.merge(df, orders, on='order_num')


  ##getting additional information and adding to the data frame
  for index, row in df.iterrows():
      url2 ='http://shop.nordstrom.com/sr?origin=keywordsearch&keyword=' + row['style']

      html2 = requests.get(url2).text
      soup2 = BeautifulSoup(html2, "html.parser")
      divTag2 = soup2.find_all("article", {"class": re.compile("npr-ahINh npr-product-module large")})

      #if search returns more than 1 result, only look at 1st result
      if len(divTag2) >1: divTag2 = divTag2[0]

      for th2 in divTag2:
              try:
                  link3 ='http://shop.nordstrom.com'+th2.find_all('a')[1].get('href')
              except:
                  pass
              try:
                  image_link_2 = th2.find('img')['src'].encode('utf-8')
                  item_name2 = th2.find('img')['alt'].encode('utf-8')
              except:
                  image_link_2 = row['image']
                  item_name2 = row['item_name']
      df.set_value(index,'link3',link3)
      df.set_value(index,'image_link_2',image_link_2)
      df.set_value(index,'item_name2',item_name2)



  ##this piece of code saves it to the database :)
  for index, row in df.iterrows():
      if (((pd.to_datetime('today') - pd.to_datetime(row['date'])) / np.timedelta64(1, 'D')).astype(int) <15):
          status = 'tracking'
      else:
          status = 'not_eligible'

      dic = {
         'order_num': row['order_num'],
         'zipcode': row['zipcode'],
         'image': row['image'],
         'quantity': row['quantity'],
         'purchase_price': row['unit_price'],
         'item_name': row['item_name'],
         'size': row['size'],
         'style': row['style'],
         'tracking_num': row['tracking_num'],
         'date_placed': row['date'],
         'email': row['email'],
         'retailer': row['retailer'],
         'thread_id': row['thread_id'],
         'link_to_product': row['link3'],
         'image_link_2': row['image_link_2'],
         'item_name_2':row['item_name2'],
         'status': status,
         'last_date_checked': '',
         'price_last_check': '',
         'date_price_reduced': '',
         'reduced_price': '',
         'date_refunded_difference': '',
         'price_difference': ''
      }
      result = db.order_info_item_scrapes.insert_one(dic)


  #this changes the status from "need to scrape" to "scraped" in
  #the messages database
  for index, row in df.iterrows():
      db.order_info_from_email.update_many(
          {"order_num": row['order_num']},
          {"$set": {"status": "scraped"}}
      )


  print('testandsuccess')
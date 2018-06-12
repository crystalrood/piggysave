from bs4 import BeautifulSoup
import requests
import sys;
#reload(sys);
#sys.setdefaultencoding("utf8")
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
import quopri
#uri = 'mongodb://heroku_4jtg3rvf:r9nq5ealpnfrlda5la4fj8r192@ds161503.mlab.com:61503/heroku_4jtg3rvf'
#client = MongoClient(uri)
#db = client['heroku_4jtg3rvf']

client = MongoClient('mongodb://localhost:27017/test')
db = client.test
import email


messages = db.messages
messages = pd.DataFrame(list(messages.find()))
    
# all this code below is to remove duplicates
del messages['_id']
del messages['createdAt']
del messages['date_extracted']
del messages['__v']
del messages['updatedAt']
del messages['status']
messages = messages.drop_duplicates()

#setting up dataframe for scrapting
columns = ['thread_id','email', 'retailer', 'date', 'order_num', 'zipcode', 'url', 'item_num', 'quantity', 'color', 'price']
#setting up dataframe
df_items = pd.DataFrame(columns=columns)

messages = db.messages
messages = pd.DataFrame(list(messages.find()))


# ###if there are actually messages in the DB, then go ahead and proceed
if len(messages) > 0:
    
    # all this code below is to remove duplicates
    del messages['_id']
    del messages['createdAt']
    del messages['date_extracted']
    del messages['__v']
    del messages['updatedAt']
    del messages['status']
    messages = messages.drop_duplicates()

    # ###only filter on emails that need to be scraped
    #messages = messages[(messages.status == 'need to scrape')]

    #setting up dataframe for scrapting
    columns = ['thread_id','email', 'retailer', 'date', 'order_num', 'zipcode', 'url', 'item_num', 'quantity', 'color', 'price']
    #setting up dataframe
    df_items = pd.DataFrame(columns=columns)

    for index, row in messages.iterrows():

        # ###decodes message and splits into lines
        msg_decoded = quopri.decodestring(base64.urlsafe_b64decode(row['encoded_message'].encode('utf8', 'replace')))
        msg_decoded = msg_decoded.decode('ISO-8859-1')
        string = msg_decoded.split('\r\n')

        # ###EMAIL of user
        email = row['email']


        # ###DATE email was sent
        recieved = 'received'
        for idx, text in enumerate(string):
            if recieved in text.lower():
                break;
        
        matches = datefinder.find_dates(string[idx+1])
        for match in matches:
            date = match.strftime('%m/%d/%Y')


        # ###RETAILER of order
        retailers = ['nordstrom']

        # ####getting retailer information
        for num in retailers:
            for idx, text in enumerate(string):
                if num in text.lower():
                    retailer = num
                    break;
                    
        # ####ORDER NUMBER if retailer is nordstrom            
        if retailer == 'nordstrom':
            order_num = ['order #']

        for num in order_num:
            find = False
            for idx, text in enumerate(string):
                if num in text.lower():
                    find = True
                    text = text
                    # print(idx, text)
                    break;
            if find:
                break

        order_number = ''

        if retailer == 'nordstrom':
            try:
                order_number = re.findall(r'\d+', text )
                order_number = order_number[0]
            except:
                order_number = 'not available'
                pass


            # ####ZIPCODE if retailer is nordstrom     
            try:
                if retailer == 'nordstrom':
                    billing = ['billing address start']
                    for bill in billing:
                        find = False
                        for bill_idx, text in enumerate(string):
                            if bill in text.lower():
                                find = True
                                #print(bill_idx, text)
                                break;
                        if find:
                            break
                    address = ''

                    for i in range (0,40):
                        address += string[bill_idx+i] + ' '

                    match = re.search(r'\b\d{5}(?:-\d{4})?\b',  address)
                    zip_code = match.group(0)
                    # print "zipcode" + zip_code

            except:
                address_string = 'not available'
                zip_code = 'not available'
                pass

            # ####EMAIL THREAD ID
            thread_id = row['thread_id']


            ###################################################################
            ###### GETTING ITEMS INFORMATION  #################################
            ###################################################################


            order_num = ['description:']


            # print order_num
            #getting order num
            line_number = []
            find = False
            for idx, text in enumerate(string):
                if 'description:' in text.lower():
                    find = True
                    text = text
                    line_number.append(idx)
                    description_text = ''
                    for x in range(idx, idx+200):
                        description_text += string[x]

                    # ###ITEM URL
                    soup = BeautifulSoup(description_text, "html.parser")
                    url = soup.find_all('a', href=True)[0]['href']
                    r = requests.get(url) 
                   # print(r.url)


                    # ###ITEM NUMBER
                    index1 = description_text.find('\t#')
                    item_number=''
                    for x in range(index1, index1+40):
                        if description_text[x].isdigit():
                            item_number += description_text[x]
                    #print(item_number)


                    # ###ITEM COLOR
                    index2 = description_text.find('Color:')
                    color=''
                    for x in range(index2, index2+100):
                        color += description_text[x]

                    soup = BeautifulSoup(color, "html.parser")
                    color_name = soup.find('span').text

                   # print(color_name)

                    # ###ITEM PRICE 
                    index3 = description_text.find('Price:')
                    price=''
                    for x in range(index3, index3+100):
                        price += description_text[x]

                    soup = BeautifulSoup(price, "html.parser")
                    price_name = soup.find('span').text
                    #print(price_name)

                    # ###ITEM QUANTITY
                    index4 = description_text.find('Qty:')
                    quantity=''
                    for x in range(index4, index4+100):
                        quantity += description_text[x]

                    soup = BeautifulSoup(quantity, "html.parser")
                    quantity_name = soup.find('span').text
                    #print(quantity_name)


                    #inserting fow into dataframe

                    df_items.loc[len(df_items)]=[
                            thread_id, 
                            email, 
                            retailer, 
                            date, 
                            order_number, 
                            zip_code, 
                            r.url,
                            item_number,
                            quantity_name,
                            color_name,
                            price_name
                            ]
                    df_items[['price']] = df_items[['price']].replace('[\$,]','',regex=True).astype(float)
                    df_items = df_items[(df_items.order_num != 'not available') \
                                        &(df_items.price > 0)].reset_index(drop=True)

        today = datetime.date.today()
        for index, row in df_items.iterrows():
            dic = {
               'thread_id': row['thread_id'],
               'email': row['email'],
               'retailer': row['retailer'],
               'date': row['date'],
               'order_num': row['order_num'],
               'zipcode': row['zipcode'],
               'url': row['url'],
               'item_num': row['item_num'],
               'quantity': row['quantity'],
               'color': row['color'],
               'price': row['price'],
               'last_date_checked': str(today),
               'status': 'tracking'
              }
            result = db.order_info_item_scrapes.insert_one(dic)
  
  
        #this changes the status from "need to scrape" to "scraped" in
        #the messages database
        for index, row in df.iterrows():
            db.messages.update_many(
                {"thread_id": row['thread_id']},
                {"$set": {"status": "scraped"}}
            )


        print('testedandsuccess')


        #print df.head()
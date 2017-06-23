# this test file takes an encoded emai, decodes it, parese out order information and saves it to the database
##
#
#
#
#required encoding for scraping, otherwise defaults to unicode and screws things up
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

import pymongo
from pymongo import MongoClient

client = MongoClient('mongodb://localhost:27017/test')
db = client.test
messages = db.messages
messages = pd.DataFrame(list(messages.find()))

columns = ['thread_id','email', 'retailer', 'date', 'order_num', 'billing_address']
#setting up dataframe
df = pd.DataFrame(columns=columns)

for index, row in messages.iterrows():
    
    ##allows us to decode message :)
    msg_decoded = base64.urlsafe_b64decode(row['encoded_message'].encode('ASCII'))
    
    #splits above message into lines of text
    string = msg_decoded.split('\r\n')
    
    #getting email
    delivered_to = 'delivered-to'

    for idx, text in enumerate(string):
        if delivered_to in text.lower():
            #print(idx, text)
            break;

    ## extracting email from string
    match = re.search(r'[\w\.-]+@[\w\.-]+', text)
    email = match.group(0)
    #print(email)

    #date
    recieved = 'received'
    for idx, text in enumerate(string):
        if recieved in text.lower():
            #print(idx+1, string[idx+1])
            break;

    ## extracting date from string
    matches = datefinder.find_dates(string[idx+1])
    for match in matches:
        date = match.strftime('%m/%d/%Y')
        #print match
        
        
    #retailer information
    retailers = ['nordstrom', 'walmart', '''victoria's secret''', 'best buy']

    #getting retailer information
    for num in retailers:
        for idx, text in enumerate(string):
            if num in text.lower():
                retailer = num
                break;

    #print retailer
    
    if retailer != 'best buy':
    #order number
        order_num = ['order number', 'order id', 'order #']

    if retailer == 'best buy':
        order_num = ['order id', 'order #']

    #getting order num
    for num in order_num:
        find = False 
        for idx, text in enumerate(string):
            if num in text.lower():
                find = True
                text = text
                #print(idx, text)
                break;
        if find:
            break
            
    order_number = ''
            
    if retailer == 'walmart':
        order_number = re.findall(r'\w+(?:-\w+)+',text)
        order_number = order_number[0]
        
    if retailer == 'best buy':
        #print string[idx+1]
        order_number = string[idx+1]
        
    if retailer == '''victoria's secret''':
        #print  text + ' ' +string[idx+1]
        order_number = re.findall(r'\d+', text + ' ' +string[idx+1] )
        order_number = order_number[0]
        
    if retailer == 'nordstrom':     
        order_number = re.findall(r'\d+', text )
        order_number = order_number[0]
        #print order_number
    

    
    
    
    #billing informaiton
    #getting billing information is a bitch
    # https://www.codeproject.com/Tips/989012/Validate-and-Find-Addresses-with-RegEx
 
    try:
        if retailer != '''victoria's secret''':
            billing = ['billing address', 'billed to', 'bill to', 'estimated pickup date', 'get it by']
            for bill in billing:
                find = False 
                for bill_idx, text in enumerate(string):
                    if bill in text.lower():
                        find = True
                        #print(bill_idx, text)
                        break;
                if find:
                    break
            #print bill_idx
            address = ''
            for i in range (0,30):
                address += string[bill_idx+i] + ' '

            address_string_1 = re.search(r'\d{1,6}( \w+){1,6}', address).group(0)

            if retailer == 'walmart':
                #gets city + state
                address_string_2 = re.search(r'\s+((?:[\w+\s*\-])+)[\,]\s+([a-zA-Z]+)\s+([0-9a-zA-Z]+)', address).group(0)
                #gest zipcode
                match = re.search(r'\b\d{5}(?:-\d{4})?\b',  address)
                zip_code = match.group(0)
                zip_code
                #putting the two together
                address_string_2= address_string_2+' '+zip_code
            else:
                address_string_2 = re.search(r'\d{1,4}( \w+){1,3},( \w+){1,3} [A-Z]{2}', address).group(0)
            #address_string_2 = re.search(r'\d{1,4}( \w+){1,3},( \w+){1,3} [A-Z]{2}', address).group(0)
            #address_string_2 = re.search(r'\s+((?:[\w+\s*\-])+)[\,]\s+([a-zA-Z]+)\s+([0-9a-zA-Z]+)', address).group(0)
            spt_address_string_1 = address_string_1.split(' ')
            spt_address_string_2 = address_string_2.split(' ')

            address_seg = spt_address_string_1[len(spt_address_string_1)-1].lower()

            for idx, text in enumerate(spt_address_string_2):
                if address_seg in text.lower():
                    #print(idx, text)
                    break;

            address_string = ''
            
            #if no overlap was found then just concatenate the two threads
            if idx == len(spt_address_string_2)-1:
                #print "made it here1"
                for i in range(0,len(spt_address_string_1)-1):
                    address_string += spt_address_string_1[i] + ' '

                for i in range(0,len(spt_address_string_2)-1):
                    address_string += spt_address_string_2[i] + ' '
            #if overlap was found do this
            else:
                #print "made it here 2"
                for i in range(0,len(spt_address_string_1)-1):
                    address_string += spt_address_string_1[i] + ' '

                for i in range(idx,len(spt_address_string_2)-1):
                    address_string += spt_address_string_2[i] + ' '

            #print(address_string)

        else:
            address_string = 'not available'
    except:
        address_string = 'not available'
        pass
    thread_id = row['thread_id']
    #inserting fow into dataframe
    df.loc[len(df)]=[thread_id, email, retailer, date, order_number, address_string] 
    
    
    
    
    db = client.test
    for index, row in df.iterrows():
        dic = {'thread_id': row['thread_id'],
           'email': row['email'],
           'retailer': row['retailer'],
           'date': row['date'],
           'order_num': row['order_num'],
           'billing_address': row['billing_address'],
          }
        result = db.order_info_from_email.insert_one(dic, { unique: true })
    
    print 'testedandsuccess'
    
    
    #print df.head()
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
import os


import pymongo
from pymongo import MongoClient
import smtplib  
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.image import MIMEImage

from IPython.core.display import display, HTML
import requests

client = MongoClient('localhost', 27017)
#client = MongoClient('mongodb://localhost:27017/')
db = client.test
mydb = client.test.item_to_user
itemsToUsers = pd.DataFrame(list(mydb.find()))


today = round(time.time())

for index, row in itemsToUsers.iterrows():
    
    if (int(row['followup_date']) < today - (60*60*24*3)) & (row['send_email_flag'] == 'yes'):
        print('yay!')
        msg = MIMEMultipart('alternative')
        
        
        ##---------------------- 
        ## setting up variables
        ##----------------------
        product_name = row['name']
        
        #shortening product name for email title
        if len(product_name) > 50:
            short_product_name = product_name[:50] + '...'
        else:
            short_product_name = product_name

        product_url = row['url']
        image_url = row['image_link']
        retailer = row['retailer']
        
        submitted_date = datetime.datetime.utcfromtimestamp(int(row['date_submitted'])/1000.0).strftime('%m-%d-%Y')
        reduced_date = datetime.datetime.utcfromtimestamp(int(row['low_price_date'])/1000.0).strftime('%m-%d-%Y')
        
        submitted_price = row['price']
        reduced_price = row['low_price']
        price_delta = int(float(row['price'].lstrip('$')) - float(row['low_price'].lstrip('$')))
 
        
        from_address = "crystal.rood.1@gmail.com"
        to_address = row['email']
        
        
        ##---------------------- 
        ## creating email
        ##----------------------
        subject_message = '$'+str(int(price_delta))+' on '+product_name
        

        msg['Subject'] = "Piggy Price Drop Alert - Save "+subject_message
        msg['From'] = from_address
        msg['To'] = to_address
        
        # Create the body of the message (a plain-text and an HTML version).
        html = """\
        <html>
          <head>
            <style>
              .colored {
                font-size:16px;
              }
              .font_info {
                font-size:16px;
                font-color: #ff63d5;
                font-weight:5px;
              }
               .footer {
                font-size:12px;
                font-color: #777;
              }
              .reddit_table {
                border-spacing: 25px;
                font-size:16px;
                padding-left:0px;

              }
              .row_title {
                font-weight:bold;
                color:#115fd8;

                }
              .container{
                padding-left:20px;

              }
              .col-md-8{
                  max-width:75%;

              }
              .col-md-4{
                  max-width:50%;

              }
              .center {
                display: block;
                margin-left: 25%;
                margin-right: auto;
                max-width:30%;
                }
              .column {
                float: left;
                width: 35%;
                }

               .row:after {
                content: "";
                display: table;
                clear: both;
                }

              #body {
                font-size:16px;
              }
              #tr {

            }
            </style>
          </head>
          <div class="container">
          <body>
            <p class='colored'>Hi,<br>
            <br>
            We noticed that the price of
          """

        html += product_name + """ has dropped from """ + '<span>&#36;</span>' + str(submitted_price)+' '

        html +=  """to $""" + str(reduced_price)+'.' + """<br></br><br></br>"""

        html +=\
        """<div class="center">
            <a href=" """

        html += product_url
        
        html += """ ">
            <img src="cid:image2" style="width:250px;"></img>
            </div> 
        """

        html +=\
            """
            </p>

            <div class="col-md-8">
                <hr>
            </div>

            <div class="row">
              <div class="column"> 
                  <img src="cid:image1" style="width:60%;">
              </div>

              <div class="column"> 

            """



        html += """<p class='font_info'>Product name: """ + product_name + """<br>"""
        html += """<p class='font_info'>Date submitted: """ + submitted_date + """<br>"""
        html += """<p class='font_info'>Date price dropped: """ + reduced_date + """<br>"""
        html += """<p class='font_info'>Original price: """  + str(submitted_price) + """<br>"""
        html += """<p class='font_info'>Reduced price: """ + str(reduced_price) + """<br>""" 

        html +=\
        """     
              </div>
            </div>
            <br></br>
            </thead>
            """ 


        #for above need to add the href to make the link clickable    


        # Record the MIME types of both parts - text/plain and text/html.
        part2 = MIMEText(html, 'html')

        # Attach parts into message container.
        msg.attach(part2)


        # We reference the image in the IMG SRC attribute by the ID we give it below
        #msgText = MIMEText('<b>Some <i>HTML</i> text</b> and an image.<br><img src="cid:image1"><br>Nifty!', 'html')
        #msg.attach(msgText)

        # This example assumes the image is in the current directory
        #/Users/crystalm/Desktop/peanuts.png
        img_data = requests.get(image_url).content
        with open('/Users/crystalm/desktop/piggysave/public/image_name.png', 'wb') as handler:
            handler.write(img_data)

        fp = open('/Users/crystalm/desktop/piggysave/public/image_name.png', 'rb')
        msgImage = MIMEImage(fp.read())
        fp.close()

        # Define the image's ID as referenced above
        msgImage.add_header('Content-ID', '<image1>')
        msg.attach(msgImage)

        # attaching button
        fp = open('/Users/crystalm/desktop/piggysave/public/email_button.png', 'rb')
        msgImage2 = MIMEImage(fp.read())
        fp.close()

        # Define the image's ID as referenced above
        msgImage2.add_header('Content-ID', '<image2>')
        msg.attach(msgImage2)



        # Credentials
        username = 'crystal.rood.1@gmail.com'
        password = 'nyrpeltdwzfmryzg'
        
        # The actual mail send  
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.ehlo()
        server.starttls()
        server.login(username,password)  
        server.sendmail(from_address, to_address, msg.as_string())  
        server.quit()  


        os.remove('/Users/crystalm/desktop/piggysave/public/image_name.png')
        #SendEmail(to_email)
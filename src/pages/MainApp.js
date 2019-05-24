/*
 *   Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.

 *  Licensed under the Apache License, Version 2.0 (the "License").
 *  You may not use this file except in compliance with the License.
 *  A copy of the License is located at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  or in the "license" file accompanying this file. This file is distributed
 *  on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 *  express or implied. See the License for the specific language governing
 *  permissions and limitations under the License.
 */
import React from 'react';
import Amplify from 'aws-amplify';
import { Auth, API } from 'aws-amplify';
import awsConfig from '../amplify-config';
import '../public/css/app.css';
import '../public/css/gridforms.css';
import logo from '../public/images/LTLogo.png';
import Customer  from './Customer';
import Product  from './Product';
import CreateOrder  from './CreateOrder';
import Variant  from './Variant';
import ViewOrders  from './ViewOrders';
import ViewCustomers  from './ViewCustomers';
import Accordian  from './Accordian';
import { withRouter, Link, Redirect } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import './quicksight-2018-04-01.min.json';
import AWS from 'aws-sdk';
import * as QuickSight from "aws-sdk/clients/quicksight";
const https = require('https');
 var QuickSightEmbedding = require("amazon-quicksight-embedding-sdk");


const customersAPI = 'CustomersAPI';
const getAllPath = '/all';

const productsAPI = 'ProductsAPI';

const currenciesAPI = 'CurrencyAPI';

const createPath = '/create';
const orderAPI = 'OrdersAPI';

class MainApp extends React.Component {
  constructor(props) {
    super(props);

    Amplify.Logger.LOG_LEVEL = 'DEBUG';

    this.signOut = this.signOut.bind(this);

    this.state = {
      authToken: null,
      idToken: null,
      redirect: false
    };
    var currentSession = Auth.currentSession().then(data => {
      console.log("Session")
      console.log(data.accessToken);
      AWS.config.region = 'ap-southeast-2';
      AWS.config.credentials = new AWS.CognitoIdentityCredentials({
             IdentityPoolId:"ap-southeast-2:687f1ba1-1242-4f22-8adf-da49297c8005",
             Logins: {
                 "cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_3e18SkGuR": data.getIdToken().getJwtToken()
             }
         });

      var params = {
              RoleArn: "arn:aws:iam::276219036989:role/Cognito_logtag_identity_poolAuth_Role",
              RoleSessionName: "richardheald335@gmail.com"
          };
      var sts = new AWS.STS();
      sts.assumeRole(params, (err, data) => {
              if (err) console.log( err, err.stack); // an error occurred
              else {
                  console.log(data);
                  AWS.config.update({
                    credentials: new AWS.Credentials(data.Credentials.AccessKeyId, data.Credentials.SecretAccessKey, data.Credentials.SessionToken)});

                  //this.quicksightRegisterUser()
                  this.quicksightGetEmbedURL(data);
              }
            });
    });





  }

  quicksightListUser() {
    var quicksight = new QuickSight();
    quicksight.listUsers({
    // Enter your actual AWS account ID
    'AwsAccountId': '276219036989',
    'Namespace': 'default',
  }, function(err, data) {
    console.log('---');
    console.log('Errors: ');
    console.log(err);
    console.log('---');
    console.log('Response: ');
    console.log(data);
  });


  }

  quicksightRegisterUser(data) {
    var params = {
                   AwsAccountId: '276219036989',
                   Email: 'richardheald335@gmail.com',
                   IdentityType: 'IAM' ,
                   Namespace: 'default',
                   UserRole: "READER",
                   IamArn: 'arn:aws:iam::276219036989:role/Cognito_logtag_identity_poolAuth_Role',
                   SessionName: 'richardheald335@gmail.com',
                   UserName:'richardheald335@gmail.com'
               };

    console.log(AWS.config.credentials);
    var quicksight = new QuickSight({credentials: AWS.config.credentials});
    quicksight.registerUser(params, function (err, data1) {
      if (err) {
        console.log("err register user");
        console.log(err);
    } // an error occurred
      else {
          console.log("Register User1");
          console.log(data1)
      }
    })
  }



  quicksightGetEmbedURL(data) {
    console.log('Embed credentials are:');
    console.log(AWS.config.credentials);
    var quicksight = new QuickSight({credentials: AWS.config.credentials, region:'ap-southeast-2'});

    var params = {
    AwsAccountId: "276219036989",
    DashboardId: "d50c0576-71f2-4dc7-8f66-833091cb5584",
    IdentityType: "IAM",
                ResetDisabled: true,
                SessionLifetimeInMinutes: 600,
                UndoRedoDisabled: true
    }
    quicksight.getDashboardEmbedUrl(params,
                             function (err, data) {
                               if (!err) {
                                 console.log( data);
                               } else {
                                 console.log(err);
                               }
                             }
                           );
  }




  async signOut() {
    console.log("Sign Out")
    Auth.signOut()
        .then(data => console.log(data))
        .catch(err => console.log(err));
    this.setState({
          redirect: true
        })

  }

  renderRedirect() {
    console.log(this.state.redirect)
    if(this.state.redirect) {
      return <Redirect to='/signin' />;
    }
  }


  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken, idToken: session.idToken.jwtToken });
    this.getCustomers();
    this.getProducts();
    this.getCurrencies();
    //this.embedDashboard();
  }

  async getProductConfig(id) {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    return await API.get(productsAPI, '/'+id, apiRequest)
  }

  async getCustomers() {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    API.get(customersAPI, getAllPath, apiRequest)
    .then(response =>
    {
        this.setState({customers: response.body});
    })
    .catch(error =>
    {
        console.log(error.response)
        if(!error.response || error.response.status == 401){
             alert('Please Sign In')
        }
    });
  }

  async getProducts() {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    API.get(productsAPI, getAllPath, apiRequest)
    .then(response =>
    {
        this.setState({products: response.body});
    });
  }

  async getCurrencies() {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    API.get(currenciesAPI, getAllPath, apiRequest)
    .then(response =>
    {
        this.setState({currencies: response.body});
    });
  }


  generateCustomerList() {
    var customers = [];
    if(this.state.customers){
      customers = JSON.parse(this.state.customers);
    }

    var customerOptions = [];
    try{
      customerOptions = customers.map((customer) =>
      {
        return {value:customer.ID, label: customer.Name}
      });
    } catch(err)
    {
      console.log('Error rendering Customers: '+err);
    }
    return customerOptions;
  }

  parseProducts() {
     var products = [];
     if(this.state.products) {
       products = JSON.parse(this.state.products);
     }

      var productOptions = [];
      try{
        productOptions = products.map((product) =>
        {
          return {value:product.ID, label: product.Name, product:product}
        });
      } catch(err)
      {
        console.log('Error rendering Products: '+err);
      }
      return productOptions;
  }

  parseCurrencies() {
    var unParsedCurrencies = [];
    if(this.state.currencies) {
      unParsedCurrencies = JSON.parse(this.state.currencies);
    }

     var parsedCurrencies = [];
     try{
       parsedCurrencies = unParsedCurrencies.map((currency) =>
       {
         return {value:currency.ID, label: currency.ShortName}
       });
     } catch(err)
     {

     }
     return parsedCurrencies;

  }

  embedDashboard() {
           var containerDiv = document.getElementById("dashboardContainer");
           var params = {
               url: "https://ap-southeast-2.quicksight.aws.amazon.com/embed/d0a4408507bc431d9b19adcbf934e31c/dashboards/d50c0576-71f2-4dc7-8f66-833091cb5584?isauthcode=true&identityprovider=quicksight&code=AYABeDJ3G35XgpzwcmS0-Wzm0mIAAAABAAdhd3Mta21zAFBhcm46YXdzOmttczphcC1zb3V0aGVhc3QtMjo4OTc4MjcyODg1NDM6a2V5LzZlZjA0ZTAyLTIyZmMtNDFmYS1iZGY1LTg0Y2Q3OWY0MmYxOQC4AQIBAHjBrDhHw_ETeeWTp2SAgpQYxdz7hv6a4_0dE90TaLLdlwEUbBR7TkEoENl-4sW7ww79AAAAfjB8BgkqhkiG9w0BBwagbzBtAgEAMGgGCSqGSIb3DQEHATAeBglghkgBZQMEAS4wEQQMZZyQADT7BqbVaQTWAgEQgDuONWWsADY-G7xOqZqgUhhhk_xc-uGxWVnteo-IHuWTL_DUeT8r4JNb3yQeMya5I_bFRR65kPLwhRPvCwIAAAAADAAAEAAAAAAAAAAAAAAAAAAoxu5S0_d8ixO_mewTSzW5_____wAAAAEAAAAAAAAAAAAAAAEAAACbHmbsJpcItRMoAU37worh1QDo-S49pHT7m7A4SyyxT4Ggkjf_fR-xsE5sbumctpzpHWy4H5ZK22jyP-OfP4wq57ezm_q-jDLKCHQpXbsIyn4xNk-mj1D1p6Atj1r0osr67-HvDBMPKQcwV-gBvBetZiVxcCoGrBx9MliHiyFajjLkKiS9th94Uiw6CH_v-BDBmF4yFBx71ZNl7v1a4q70ODN58mZedJGYILSC",
               container: containerDiv,

               height: "700px",
               width: "1000px"
           };
           var dashboard = QuickSightEmbedding.embedDashboard(params);
           dashboard.on('error', function() {});
           dashboard.on('load', function() {});
       }


  render() {
    return (
    <div className="app">
      <header>
        <img src={logo}/>
         <button type="button" id="signout" onClick={this.signOut}>Sign Out</button>
         {this.renderRedirect()}
      </header>
      <NotificationContainer/>
      <Accordian>
        <div label="Create Order" id="1">
          <CreateOrder customers={this.generateCustomerList()} products={this.parseProducts()} currencies = {this.parseCurrencies()} />
        </div>
        <div label="Create or Update Customer" id="2">
          <Customer customers={this.generateCustomerList()} get_all_customers={this.getCustomers.bind(this)}/>
        </div>
        <div label='Create or Update Product' id="3">
          <Product get_all_products={this.getProducts.bind(this)} products={this.parseProducts()}  />
        </div>
        <div label='Create Variant' id="4">
          <Variant customers={this.generateCustomerList()} products={this.parseProducts()} />
        </div>
        <div label='View Orders' id="5">
          <ViewOrders customers={this.generateCustomerList()} products={this.parseProducts()}   />
        </div>
        <div label='View Customers' id="6">
          <ViewCustomers customers={this.generateCustomerList()} get_all_customers={this.getCustomers.bind(this)} />
        </div>
      </Accordian>
      <div id="dashboardContainer"></div>

    </div>
      );
  }
}

export default withRouter(MainApp);

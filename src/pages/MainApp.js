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
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import "react-tabs/style/react-tabs.css";
import Customer  from './Customer';
import Product  from './Product';
import CreateOrder  from './CreateOrder';
import UpdateOrder  from './UpdateOrder';
import Variant  from './Variant';
import ViewOrders  from './ViewOrders';
import ViewCustomers  from './ViewCustomers';
import ViewCustomerPriceList  from './priceList/ViewCustomerPriceList';
import ReportingDashboard  from './ReportingDashboard';
import Accordian  from './Accordian';
import { withRouter, Link, Redirect } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import 'react-notifications/lib/notifications.css';
import moment from 'moment'
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
  }

  async signOut() {
    Auth.signOut()
        .then(data => console.log(data))
        .catch(err => console.log(err));
    this.setState({
          redirect: true
        })

  }

  renderRedirect() {
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
    this.getQuicksightURL(session.getIdToken())

  }

  async getQuicksightURL(idToken) {
    let apiRequest = { // OPTIONAL
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }, // OPTIONAL
      response: true, // OPTIONAL (return the entire Axios response object instead of only response.data)
      queryStringParameters: {  // OPTIONAL
        username: idToken.payload.email,
        sessionName: idToken.payload.sub
      }
    }
    API.get('EmbedURL', '', apiRequest)
    .then(response =>
    {
        this.setState({reportingURL: JSON.parse(response.data.body).EmbedUrl});
        //this.embedDashboard();
    })
    .catch(error =>
    {
        console.log(error)
    });

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
        else if(error.response.status == 504){
            console.log('Gateway Timeout: Retrying...')
            this.getCustomers()
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
    }).catch(error =>
    {
        console.log(error.response)
        if(error.response.status == 504){
            console.log('Gateway Timeout: Retrying...')
            this.getProducts()
        }
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
    }).catch(error =>
    {
        console.log(error.response)
        if(error.response.status == 504){
            console.log('Gateway Timeout: Retrying...')
            this.getCurrencies()
        }
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

  embedDashboard(url) {
           var containerDiv = document.getElementById("dashboardContainer");
           var params = {
               url: url,
               container: containerDiv,
               scrolling: "yes",
               height: "700px",
               parameters: {
                        StartDate: moment(new Date()).subtract(1, 'month').format('YYYY-MM-DD hh:mm'),
                        EndDate: moment(new Date()).format('YYYY-MM-DD hh:mm')
                    }
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
      <Tabs>
        <TabList>
          <Tab>Orders</Tab>
          <Tab>Reports</Tab>
        </TabList>
        <TabPanel>
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
            <div label='View Price Lists' id="7">
              <ViewCustomerPriceList customers={this.generateCustomerList()} products={this.parseProducts()} />
            </div>
            <div label='Update Order' id="8">
              <UpdateOrder customers={this.generateCustomerList()} products={this.parseProducts()} currencies = {this.parseCurrencies()} />
            </div>
          </Accordian>
        </TabPanel>
        <TabPanel>
          <ReportingDashboard url={this.state.reportingURL} />
        </TabPanel>
      </Tabs>
    </div>
      );
  }
}

export default withRouter(MainApp);

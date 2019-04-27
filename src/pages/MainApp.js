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


const customersAPI = 'CustomersAPI';
const getAllPath = '/all';

const productsAPI = 'ProductsAPI';

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
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
    this.getCustomers();
    this.getProducts();
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
          <CreateOrder customers={this.generateCustomerList()} products={this.parseProducts()} />
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
          <ViewOrders customers={this.generateCustomerList()}  />
        </div>
        <div label='View Customers' id="6">
          <ViewCustomers customers={this.generateCustomerList()} get_all_customers={this.getCustomers.bind(this)} />
        </div>
      </Accordian>
    </div>
      );
  }
}

export default withRouter(MainApp);

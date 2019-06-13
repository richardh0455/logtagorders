import React from 'react';
import { withRouter } from 'react-router-dom';
import {NotificationManager} from 'react-notifications';
import Select from 'react-select';
import { Auth, API } from 'aws-amplify';
import Accordian  from './Accordian';
import DayPickerInput  from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';

import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';


const getAll = '/all';
const ordersAPI = 'OrdersAPI';

class ViewOrders extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
        currentlySelectedCustomer: null,
        currentlySelectedOrder: {Order:{}, OrderLines:[]},
        orders: []
      };
  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
  }

  handleCustomerChange = (event) => {
    this.setState({currentlySelectedCustomer: event})
    this.getOrders(event.value)
  }


  async getOrders(customerID) {
    const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        },
        queryStringParameters: {  // OPTIONAL
          'customer-id': customerID
        }
      };
      API.get(ordersAPI, '', apiRequest)
	  .then(response => {
      console.log(response.body)
      this.setState({orders: JSON.parse(response.body)});
	  })
	  .catch(err => {

	  })
  }

  async getSingleOrder(customerID, orderID) {
    const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        }
      };
    API.get(ordersAPI, '/'+orderID+'/order-lines', apiRequest)
	  .then(response => {
      var responseBody = JSON.parse(response.body);
      responseBody.ID = orderID;
      this.setState({currentlySelectedOrder:{Order: this.state.currentlySelectedOrder.Order, OrderLines:responseBody} })

	  })
	  .catch(err => {

	  })
  }

  getOrderDetails = (invoiceID) => {
    //reset to default before retrieving new data
    this.setState({currentlySelectedOrder: {Order:{}, OrderLines:[]}});
    this.getSingleOrder(this.state.currentlySelectedCustomer.value,invoiceID )
  }

  getProductName = (id) => {
    var product = this.props.products.find(product => product.value === id)
    if(product) {
      return product.label
    }

  }


  paymentDateChanged = (selectedDay, modifiers, dayPickerInput) => {
    var fieldName = "PurchaseDate";
    var date = dayPickerInput.getInput().value;
    this.updateDate(fieldName, date);
  }

  shipmentDateChanged = (selectedDay, modifiers, dayPickerInput) => {
    var fieldName = "ShippingDate";
    var date = dayPickerInput.getInput().value;
    this.updateDate(fieldName, date);

  }

  updateDate = (fieldName, date) => {
    var customerID = this.state.currentlySelectedCustomer.value;
    var orderID = this.state.currentlySelectedOrder.ID;
    this.updateOrder(customerID, orderID, fieldName, date);
  }

  async updateOrder(customerID, orderID, fieldName, fieldValue) {
    var body ={};
    body[fieldName] = fieldValue;

    const apiRequest = {
        headers: {
          'Authorization': this.state.idToken,
          'Content-Type': 'application/json'
        },
        body: body
      };
    API.post(ordersAPI, '/'+customerID+'/'+orderID+'/update', apiRequest)
	  .then(response => {
      NotificationManager.success('', 'Order Successfully Updated', 3000);
      this.getSingleOrder(customerID, orderID)
	  })
	  .catch(err => {
      NotificationManager.error('Order Updating Failed', 'Error', 5000, () => {});
	  })
  }


  render() {
    return (
      <div>
        <section>
          <form className="grid-form">
            <fieldset>
			        <div data-row-span="2">
                <div data-field-span="1">
                  <label>Customer</label>
                  <Select value={this.state.currentlySelectedCustomer} onChange={this.handleCustomerChange} options={this.props.customers} isSearchable="true" placeholder="Select a Customer"/>
                </div>
              </div>
            </fieldset>
          </form>
        </section>
        <section>
          <Accordian onClick={this.getOrderDetails}>
            {this.state.orders.map((item) => (
              <div label={'ID: '+item.LogtagInvoiceNumber} id={item.InvoiceID} key={item.InvoiceID}>
                <span>Invoice Number: {this.state.currentlySelectedOrder["LogtagInvoiceNumber"]}</span>
                <br/>
                <span>Payment Date:</span>
                <DayPickerInput
                  formatDate={formatDate}
                  parseDate={parseDate}
                  placeholder={`${formatDate(this.state.currentlySelectedOrder["PaymentDate"])}`}
                  onDayChange ={this.paymentDateChanged}
                />
                <br/>
                <span>Shipped Date: </span>
                <DayPickerInput
                  formatDate={formatDate}
                  parseDate={parseDate}
                  placeholder={`${formatDate(this.state.currentlySelectedOrder["ShippedDate"])}`}
                  onDayChange ={this.shipmentDateChanged}
                />
                <br/>
                <table>
                  <tbody>
                  <tr>
                    <th>Product</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    </tr>
                {this.state.currentlySelectedOrder["OrderLines"].map((line) => (
                    <tr key={line["ProductID"]}>
                      <td>{this.getProductName(line["ProductID"])}</td>
                      <td>{line["Pricing"]}</td>
                      <td>{line["Quantity"]}</td>
                    </tr>
                ))}
                </tbody>
                </table>
              </div>
            ))}
          </Accordian>
        </section>
      </div>
    );
  }
}

export default withRouter(ViewOrders);

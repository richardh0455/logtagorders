import React from 'react';
import Amplify from 'aws-amplify';
import { Auth, API } from 'aws-amplify';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import OrderList from './updateOrder/OrderList';
import Select from 'react-select';
import DayPickerInput  from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';

import '../public/css/loader.css'

const Loader = () => <div className="loader">Loading...</div>

const customersAPI = 'CustomersAPI';
const getAllPath = '/all';

const productsAPI = 'ProductsAPI';

const orderAPI = 'OrdersAPI';

class UpdateOrder extends React.Component{

  constructor(props) {
    super(props);



	this.state = {
    isUpdate:false,
    firstChoiceMade:false,
      currentlySelectedCustomer: null,
      currentlySelectedShippingAddress: null,
      currentlySelectedCourierAccount: null,
      currentlySelectedHSCode: null,
      currentlySelectedCurrency: null,
      currentlySelectedOrder: null,
	  customer: null,
    purchaseOrderNumber:'',
    shipping_addresses:[],
    orders:[],
    hs_codes:[],
    courier_accounts:[],
    order_items:[],
    shipping_date: null,
    payment_date: null
    };
  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });


  }


  async getCustomer(id) {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    return await API.get(customersAPI, '/'+id, apiRequest)
  }

  async getShippingAddresses(id) {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    return await API.get(customersAPI, '/'+id+'/shipping-addresses', apiRequest)
  }

  async getOrders(id) {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      queryStringParameters: {
        'customer-id': id
      }
    };
    return await API.get(orderAPI, '', apiRequest)
  }

  async getOrderLines(orderID) {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    return await API.get(orderAPI, '/'+orderID+'/order-lines', apiRequest)
  }


  async updateInvoice(invoiceLines) {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: {
      "PurchaseOrderNumber":this.state.purchaseOrderNumber,
      "Currency":this.state.currentlySelectedCurrency ? this.state.currentlySelectedCurrency.label : '',
      "CourierAccountID":this.state.currentlySelectedCourierAccount ? this.state.currentlySelectedCourierAccount.value : null,
      "HSCodeID":this.state.currentlySelectedHSCode ? this.state.currentlySelectedHSCode.value : null,
      "ShippingAddressID":this.state.currentlySelectedShippingAddress ? this.state.currentlySelectedShippingAddress.value : null,
      "BillingAddressID":"", //::TODO::Add Billing Addresses in later.
      "ShippingDate":this.state.shipping_date === "None" ? null : this.state.shipping_date,//::TODO::Add Shipping Date in later.
      "PaymentDate":this.state.payment_date === "None" ? null : this.state.shipping_date //::TODO::Add Payment Date in later.
      }
    };
    return API.put(orderAPI, '/'+this.state.currentlySelectedOrder.value, apiRequest).then(response => {
      this.state.order_items.map(item => {
        this.updateInvoiceLine(this.state.currentlySelectedOrder.value, item).catch(err =>
          NotificationManager.error('Updating Order Failed', 'Error', 5000, () => {})
        )
      })
      return {LogtagInvoiceNumber:this.state.currentlySelectedOrder.label}

    }).catch(err =>
      NotificationManager.error('Updating Order Failed', 'Error', 5000, () => {})
    )
  }
  async updateInvoiceLine(invoiceID, invoiceLine) {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: {"Quantity": invoiceLine.Quantity, "ProductID": invoiceLine.ProductID, "Price": invoiceLine.Pricing, "VariationID": invoiceLine.VariationID}
    };
    API.put(orderAPI, '/'+invoiceID+'/order-lines/'+invoiceLine.LineID, apiRequest).then(response => {
    })

  }

  async createInvoiceLineHandler(event) {
    event.preventDefault();
    this.createInvoiceLine(this.state.currentlySelectedOrder.value, {Quantity:"0",ProductID:"0",Pricing:"0", VariationID:"0"})

  }

  async createInvoiceLine(invoiceID, invoiceLine) {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: {"Quantity": invoiceLine.Quantity, "ProductID": invoiceLine.ProductID, "Price": invoiceLine.Pricing, "VariationID": invoiceLine.VariationID}
    };
    API.post(orderAPI, '/'+invoiceID+'/order-lines', apiRequest).then(response => {
      var invoice_lines = this.state.order_items;
      invoiceLine.LineID = response.body.ID
      invoice_lines.push(invoiceLine)
      this.setState({order_items:invoice_lines});
    })

  }

  async deleteInvoiceLineHandler(lineID) {
    this.deleteInvoiceLine(this.state.currentlySelectedOrder.value, lineID)

  }

  async deleteInvoiceLine(invoiceID, lineID) {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    API.del(orderAPI, '/'+invoiceID+'/order-lines/'+lineID, apiRequest).then(response => {
      this.getOrderLines(invoiceID)
      .then(response => {
        this.setState({order_items:JSON.parse(response.body)})
      });
    })

  }

  orderItemUpdated = (items) => {
   this.setState({order_items: items});
  }

  handleCustomerChange = (event) => {
	   this.setState({currentlySelectedCustomer: event})
     this.getCustomer(event.value)
     .then(response => {
       this.setState({customer: response.body, currentlySelectedOrder:null, order_items:[] })
       this.generateHSCodeList(JSON.parse(response.body))
       this.generateCourierAccountList(JSON.parse(response.body))
       this.getShippingAddresses(event.value).then(response => this.generateShippingAddressList(JSON.parse(response.body)))
       this.getOrders(event.value).then(response => {
         this.setState({orders: JSON.parse(response.body)})})
       this.handleShippingAddressChange(null);
       this.handleCourierAccountChange(null);
       this.handleHSCodeChange(null);
       this.handlePurchaseOrderNumberChange({target:{value:''}});
       this.handleCurrencyChange(null);
     });
  }

  handleOrderChange = (event) => {
     this.setState({currentlySelectedOrder: event,
       currentlySelectedCurrency: this.findMatchingElementByValue(event.details.Currency, this.props.currencies),
       currentlySelectedCourierAccount: this.findMatchingElementByID(event.details.CourierAccountID, this.state.courier_accounts),
       currentlySelectedShippingAddress: this.findMatchingElementByID(event.details.ShippingAddressID, this.state.shipping_addresses),
       currentlySelectedHSCode: this.findMatchingElementByID(event.details.HSCodeID, this.state.hs_codes),
       purchaseOrderNumber: event.details.PurchaseOrderNumber || '',
       shipping_date: event.details.ShippedDate,
       payment_date: event.details.PaymentDate,


     })
     this.getOrderLines(event.value)
     .then(response => {
       this.setState({order_items:JSON.parse(response.body)})
     });
  }

  findMatchingElementByValue(value, list) {
      return list.find(element => element.label===value);

  }

  findMatchingElementByID(value, list) {
      return list.find(element => element.value===value);

  }



  handleShippingAddressChange = (event) => {
	   this.setState({currentlySelectedShippingAddress: event})
  }

  handleCourierAccountChange = (event) => {
	   this.setState({currentlySelectedCourierAccount: event})
  }

  handleHSCodeChange = (event) => {
	   this.setState({currentlySelectedHSCode: event})
  }

  handlePurchaseOrderNumberChange = (event) => {
    this.setState({purchaseOrderNumber: event.target.value})
  }

  handleCurrencyChange = (event) => {
    this.setState({currentlySelectedCurrency: event})
  }

  handleShippingDateChange = (event) => {
    this.setState({shipping_date: event})
  }

  handlePaymentDateChange = (event) => {
    this.setState({payment_date: event})
  }

   generateShippingAddressList(shipping_addresses) {

    var shippingAddresses =  shipping_addresses.map((address) =>
			{
        return {value:address.ID, label: this.buildAddress(address).join(', '), address:address}
      });
    this.setState({shipping_addresses: shippingAddresses});
  }

  buildAddress(address){
    var addressArray = [];
    if(this.fieldHasValidValue(address.Street))
    {
      addressArray.push(address.Street)
    }
    if(this.fieldHasValidValue(address.Suburb))
    {
      addressArray.push(address.Suburb)
    }
    if(this.fieldHasValidValue(address.City))
    {
      addressArray.push(address.City)
    }
    if(this.fieldHasValidValue(address.State))
    {
      addressArray.push(address.State)
    }
    if(this.fieldHasValidValue(address.Country))
    {
      addressArray.push(address.Country)
    }
    if(this.fieldHasValidValue(address.PostCode))
    {
      addressArray.push(address.PostCode)
    }
    return addressArray;
  }

  fieldHasValidValue(field)
  {
    return field && field.trim() !== "" && field.trim() !== "None"
  }

  generateCourierAccountList(customer) {
   let courierAccounts = [];
   if(customer && "CourierAccounts" in customer){
       courierAccounts = customer.CourierAccounts.map((account) =>
     {return {value:account.ID, label: account.CourierAccount}}
       );
   }
   this.setState({courier_accounts: courierAccounts})
 }

 generateHSCodeList(customer) {
  let hsCodes = [];
  if(customer && "HSCodes" in customer){
      hsCodes = customer.HSCodes.map((code) =>
    {return {value:code.ID, label: code.HSCode}}
      );
  }
  this.setState({hs_codes: hsCodes})
}

 required(field) {
   if(field  === null) {
    return <span style={{'font-size': '12px', 'color':'#ba090c'}}>Please Select a Value</span>

   }

 }

  render() {
    let customerSelect;
    let orderSelect;
    let currencySelect;
    let hsCodeSelect;
    let courierAccountSelect;
    if(this.props.customers && this.props.customers.length > 0){
      customerSelect = <Select value={this.state.currentlySelectedCustomer} onChange={this.handleCustomerChange} options={this.props.customers} isSearchable="true" placeholder="Select a Customer"/>
    }else{
      customerSelect = <Loader/>
    }

    if(this.state.orders && this.state.orders.length > 0){
      orderSelect = <Select value={this.state.currentlySelectedOrder} onChange={this.handleOrderChange} options={
        this.state.orders.filter(order => {return !this.fieldHasValidValue(order.ShippedDate)}).map(order => {return {value:order.InvoiceID, label: order.LogtagInvoiceNumber, details:order}})} isSearchable="true" placeholder="Select an Order"/>
    }else{
      orderSelect = <Loader/>
    }

    if(this.props.currencies && this.props.currencies.length > 0){
      currencySelect = <Select value={this.state.currentlySelectedCurrency} onChange={this.handleCurrencyChange} options={this.props.currencies} isSearchable="true" placeholder="Select a Currency"/>
    }else{
      currencySelect = <Loader/>
    }

    if(this.state.hs_codes && this.state.hs_codes.length > 0){
      hsCodeSelect = <Select value={this.state.currentlySelectedHSCode} onChange={this.handleHSCodeChange} options={this.state.hs_codes} placeholder="Select a HS Code"/>
    }else{
      hsCodeSelect = <Loader/>
    }

    if(this.state.courier_accounts && this.state.courier_accounts.length > 0){
      courierAccountSelect = <Select value={this.state.currentlySelectedCourierAccount} onChange={this.handleCourierAccountChange} options={this.state.courier_accounts} placeholder="Select a Courier Account"/>
    }else{
      courierAccountSelect = <Loader/>
    }

    return (
      <div >

      <section>
        <form className="grid-form">
        <div data-row-span="2" >
        <div data-field-span="1" >
          <label>Customer</label>
          {customerSelect}
      </div>
      <div data-field-span="1" >
        <label>Order</label>
        {orderSelect}
       </div>
       </div>
          <fieldset>
            <h2>Customer</h2>
            <div data-row-span="2">

              <div data-field-span="1" >
                <label>Shipping Address</label>
                <Select value={this.state.currentlySelectedShippingAddress} onChange={this.handleShippingAddressChange} options={this.state.shipping_addresses} placeholder="Select a Shipping Address"/>
                {this.required(this.state.currentlySelectedShippingAddress)}
              </div>

              <div data-field-span="1">
                <label>Shipping Date</label>
                <DayPickerInput
                  formatDate={formatDate}
                  parseDate={parseDate}
                  placeholder={`Shipping Date`}
                  onDayChange ={this.handleShippingDateChange}
                />
              </div>

            </div>
            <div data-row-span="4">
              <div data-field-span="1" >
                <label>Purchase Order Number</label>
                <input type="text" value={this.state.purchaseOrderNumber}  onChange={this.handlePurchaseOrderNumberChange} />
              </div>
              <div data-field-span="1">
        				<label>Currency</label>
        				{currencySelect}
                {this.required(this.state.currentlySelectedCurrency)}
              </div>
              <div data-field-span="1" >
                <label>Courier Account</label>
                {courierAccountSelect}
                {this.required(this.state.currentlySelectedCourierAccount)}
              </div>
              <div data-field-span="1" >
                <label>HS Code</label>
                {hsCodeSelect}
                {this.required(this.state.currentlySelectedHSCode)}
              </div>
            </div>
            <div className="OrderList" style={{marginTop: 50 + 'px'}}>
				      <h2>Product</h2>
                <OrderList
                  create_invoice_handler={this.updateInvoice.bind(this)}
                  create_invoice_line_handler={this.createInvoiceLineHandler.bind(this)}
                  delete_invoice_line_handler={this.deleteInvoiceLineHandler.bind(this)}
                  products={this.props.products}
                  shippingAddress ={this.state.currentlySelectedShippingAddress}
                  courierAccount ={this.state.currentlySelectedCourierAccount}
                  hsCode ={this.state.currentlySelectedHSCode}
                  purchaseOrderNumber={this.state.purchaseOrderNumber}
                  customer={{...this.state.currentlySelectedCustomer,...JSON.parse(this.state.customer)}}
                  currency = {this.state.currentlySelectedCurrency}
                  order_items = {this.state.order_items}
                  order_item_updated = {this.orderItemUpdated.bind(this)}
                  />
            </div>
        </fieldset>
        </form>
      </section>


      </div>
    );
  }

}

export default withRouter(UpdateOrder);

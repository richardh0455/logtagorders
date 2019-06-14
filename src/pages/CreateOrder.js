import React from 'react';
import Amplify from 'aws-amplify';
import { Auth, API } from 'aws-amplify';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import OrderList from './createOrder/OrderList';
import Select from 'react-select';

const customersAPI = 'CustomersAPI';
const getAllPath = '/all';

const productsAPI = 'ProductsAPI';

const createPath = '/create';
const orderAPI = 'OrdersAPI';

class CreateOrder extends React.Component{

  constructor(props) {
    super(props);



	this.state = {
    isUpdate:false,
      currentlySelectedCustomer: null,
      currentlySelectedShippingAddress: null,
      currentlySelectedCourierAccount: null,
      currentlySelectedHSCode: null,
      currentlySelectedCurrency: null,
      currenltySelectedOrder: null,
	  customer: null,
    purchaseOrderNumber:'',
    shipping_addresses:[],
    orders:[]
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


  async createInvoice(invoiceLines) {
    var currency = this.state.currentlySelectedCurrency.label || ''
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: {"CustomerID": this.state.currentlySelectedCustomer.value, "PurchaseOrderNumber":this.state.purchaseOrderNumber, "Currency":currency}
    };
    return API.post(orderAPI, '', apiRequest).then(response => {
      invoiceLines.map((line, key) =>
        this.createInvoiceLine(response.body["InvoiceID"], line)
      );
      return response.body

    })
  }

  async createInvoiceLine(invoiceID, invoiceLine) {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: {"Quantity": invoiceLine.Quantity, "ProductID": invoiceLine.ProductID, "Price": invoiceLine.Price, "VariationID": invoiceLine.VariationID}
    };
    API.post(orderAPI, '/'+invoiceID+'/order-lines', apiRequest).then(response => {
      console.log(response.body)
    })

  }

  handleCustomerChange = (event) => {
	   this.setState({currentlySelectedCustomer: event})
     this.getCustomer(event.value)
     .then(response => {
       this.setState({customer: response.body})
       this.getShippingAddresses(event.value).then(response => this.generateShippingAddressList(JSON.parse(response.body)))
       this.getOrders(event.value).then(response => this.setState({orders: JSON.parse(response.body)}))
       this.handleShippingAddressChange(null);
       this.handleCourierAccountChange(null);
       this.handleHSCodeChange(null);
       this.handlePurchaseOrderNumberChange({target:{value:''}});
       this.handleCurrencyChange(null);
     });
  }

  handleOrderChange = (event) => {
     this.getOrderLines(event.value)
     .then(response => {
       console.log('Getting Order Lines:')
       console.log(response.body)
       this.setState({currentlySelectedOrder: response.body})
     });
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
   return courierAccounts;
 }

 generateHSCodeList(customer) {
  let hsCodes = [];
  if(customer && "HSCodes" in customer){
      hsCodes = customer.HSCodes.map((code) =>
    {return {value:code.ID, label: code.HSCode}}
      );
  }
  return hsCodes;
}

 required(field) {
   if(field  === null) {
    return <span style={{'font-size': '12px', 'color':'#ba090c'}}>Please Select a Value</span>

   }

 }

 createOrderChangeHandler = () => {
   this.resetInputFields();
   this.setState({isUpdate:false})
 }

 updateOrderChangeHandler = () => {
   this.resetInputFields();
   this.setState({isUpdate:true})

 }

 createOrUpdate() {
   if(this.state.isUpdate){
     return (
       <div data-row-span="2" >
       <div data-field-span="1" >
         <label>Customer</label>
         <Select value={this.state.currentlySelectedCustomer} onChange={this.handleCustomerChange} options={this.props.customers} isSearchable="true" placeholder="Select a Customer"/>
     </div>
     <div data-field-span="1" >
       <label>Order</label>
       <Select value={this.state.currentlySelectedOrder} onChange={this.handleOrderChange} options={this.state.orders.map(order => {return {value:order.InvoiceID, label: order.LogtagInvoiceNumber, order: order}}) isSearchable="true" placeholder="Select an Order"/>
      </div>
      </div>


   );
   }
 }

 createOrderChoice = () => {
   this.setState({firstChoiceMade: true})
 }

 updateOrderChoice = () => {
   this.setState({firstChoiceMade: true, isUpdate: true})
 }

 renderOperationChoices() {
   if(!this.state.firstChoiceMade){
     return (
       <div>
         <button onClick={this.createOrderChoice}>Create Order</button>
         <button onClick={this.updateOrderChoice}>Update Order</button>
       </div>
       )
   } else {
     return (
       <div>
         {this.renderDetailFields()}
       </div>
     )

   }

 }

  renderDetailFields() {
    return (
      <div >
      <section>
        <form className="grid-form">
        <div data-row-span="2">
          <div className="radio">
            <label>
              <input type="radio" checked={!this.state.isUpdate} onChange={this.createOrderChangeHandler} />
              Create Order
            </label>

            <label style={{marginLeft: 20 + 'px'}}>
              <input type="radio" checked={this.state.isUpdate} onChange={this.updateOrderChangeHandler} />
              Update Order
            </label>
          </div>
          {this.createOrUpdate()}
        </div>
          <fieldset>
            <h2>Customer</h2>
            <div data-row-span="2">
              <div data-field-span="1" >
                <label>Customer</label>
                <Select value={this.state.currentlySelectedCustomer} onChange={this.handleCustomerChange} options={this.props.customers} isSearchable="true" placeholder="Select a Customer"/>
                {this.required(this.state.currentlySelectedCustomer)}
              </div>
              <div data-field-span="1" >
                <label>Shipping Address</label>
                <Select value={this.state.currentlySelectedShippingAddress} onChange={this.handleShippingAddressChange} options={this.state.shipping_addresses} placeholder="Select a Shipping Address"/>
                {this.required(this.state.currentlySelectedShippingAddress)}
              </div>

            </div>
            <div data-row-span="4">
              <div data-field-span="1" >
                <label>Purchase Order Number</label>
                <input type="text" value={this.state.purchaseOrderNumber}  onChange={this.handlePurchaseOrderNumberChange} />
              </div>
              <div data-field-span="1">
        				<label>Currency</label>
        				<Select value={this.state.currentlySelectedCurrency} onChange={this.handleCurrencyChange} options={this.props.currencies} isSearchable="true" placeholder="Select a Currency"/>
                {this.required(this.state.currentlySelectedCurrency)}
              </div>
              <div data-field-span="1" >
                <label>Courier Account</label>
                <Select value={this.state.currentlySelectedCourierAccount} onChange={this.handleCourierAccountChange} options={this.generateCourierAccountList(JSON.parse(this.state.customer))} placeholder="Select a Courier Account"/>
                {this.required(this.state.currentlySelectedCourierAccount)}
              </div>
              <div data-field-span="1" >
                <label>HS Code</label>
                <Select value={this.state.currentlySelectedHSCode} onChange={this.handleHSCodeChange} options={this.generateHSCodeList(JSON.parse(this.state.customer))} placeholder="Select a HS Code"/>
                {this.required(this.state.currentlySelectedHSCode)}
              </div>
            </div>
            <div className="OrderList" style={{marginTop: 50 + 'px'}}>
				      <h2>Product</h2>
                <OrderList
                  create_invoice_handler={this.createInvoice.bind(this)}
                  products={this.props.products}
                  shippingAddress ={this.state.currentlySelectedShippingAddress}
                  courierAccount ={this.state.currentlySelectedCourierAccount}
                  hsCode ={this.state.currentlySelectedHSCode}
                  purchaseOrderNumber={this.state.purchaseOrderNumber}
                  customer={{...this.state.currentlySelectedCustomer,...JSON.parse(this.state.customer)}}
                  currency = {this.state.currentlySelectedCurrency}
                  />
            </div>
        </fieldset>
        </form>
      </section>


      </div>
    );
  }

  render() {
    return (
      <div>
        <section>
          <form className="grid-form">
              {this.renderOperationChoices()}
         </form>
       </section>
     </div>
    );
  }
}

export default withRouter(CreateOrder);

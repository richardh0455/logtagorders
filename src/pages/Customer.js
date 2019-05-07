import React from 'react';
import Amplify from 'aws-amplify';
import { Auth, API } from 'aws-amplify';
import logo from '../public/images/LTLogo.png';
import { withRouter } from 'react-router-dom';
import {NotificationContainer, NotificationManager} from 'react-notifications';
import ShippingAddress from './ShippingAddress';
import Select from 'react-select';

const customersAPI = 'CustomersAPI';
const updatePath = '/update';
const createPath = '/create';
const deletePath = '/delete';

class Customer extends React.Component{
  constructor(props) {
    super(props);

    this.state = {
      isUpdate:false,
      currentlySelectedCustomer:{},
      name: '',
      currentlySelectedRegion: {value:""},
      email: '',
      billing_address: '',
      shipping_addresses:[{ID:'0', ShippingAddress:'', created:true}],
      counter:'0',
      regions: [{value:"NA", label: "North America"},{value:"LATAM", label: "Latin America"},{value:"EMEA", label: "Europe, Middle East and Africa"},{value:"C", label: "Central"},{value:"A", label: "Asia"},{value:"OC", label: "Oceania"}],
      primary_contact_name:'',
      primary_contact_phone:'',
      primary_contact_fax:'',
    };

  }

  async componentDidMount() {
    const session = await Auth.currentSession();
    this.setState({ authToken: session.accessToken.jwtToken });
    this.setState({ idToken: session.idToken.jwtToken });
  }


  handleCustomerChange = (event) => {
	   this.setState({currentlySelectedCustomer: event, customerDataRetrieved: false})
     this.getCustomer(event.value).then(response => {
       var parsed_customer = JSON.parse(response.body);
       var contactInfo = parsed_customer.ContactInfo;
       var region =this.state.regions.find(region => region.value === contactInfo.Region);
       if(!region){
         region = {value:""}
       }
       var shippingAddresses = parsed_customer.ShippingAddresses
       if ( shippingAddresses === undefined || parsed_customer.ShippingAddresses.length == 0) {
         this.addShippingAddress(event);
       }
       this.setState({
         name: contactInfo.Name,
         currentlySelectedRegion: region,
         email: contactInfo.Contact_Email,
         billing_address: contactInfo.Billing_Address,
         shipping_addresses: parsed_customer.ShippingAddresses,
         primary_contact_name: contactInfo.PrimaryContact.Name,
         primary_contact_phone: contactInfo.PrimaryContact.Phone,
         primary_contact_fax: contactInfo.PrimaryContact.Fax,
       });
       this.setState({customerDataRetrieved: true})
     }).catch(err =>
     {
       console.log(err);

     })

  }

  handleRegionChange = (event) => {
    this.setState({currentlySelectedRegion: event})
  }

  handleNameChange = (event) => {
    this.setState({name: event.target.value})
  }

  handleEmailChange = (event) => {
    this.setState({email: event.target.value})
  }

  handleBillingAddressChange = (event) => {
    this.setState({billing_address: event.target.value})
  }

  handlePrimaryContactNameChange = (event) => {
    this.setState({primary_contact_name: event.target.value})
  }

  handlePrimaryContactPhoneChange = (event) => {
    this.setState({primary_contact_phone: event.target.value})
  }

  handlePrimaryContactFaxChange = (event) => {
    this.setState({primary_contact_fax: event.target.value})
  }

  async nameOnFocus() {
    if(this.state.name === 'Name' || this.state.name === '')
    {
      this.value = '';
    }
  }


  async updateCustomerEventHandler(e)
  {
    e.preventDefault();
    this.updateCustomer(
      {
        customer_id: this.state.currentlySelectedCustomer.value,
        name: this.state.name,
        email: this.state.email,
        billing_address: this.state.billing_address,
        region: this.state.currentlySelectedRegion.value,
        shipping_addresses: this.state.shipping_addresses,
        primary_contact_name: this.state.primary_contact_name,
        primary_contact_phone: this.state.primary_contact_phone,
        primary_contact_fax: this.state.primary_contact_fax
      }
    );
  }

  async createCustomerEventHandler(e)
  {
    e.preventDefault();
    this.createCustomer(
      {
        name: this.state.name,
        email: this.state.email,
        billing_address: this.state.billing_address,
        region: this.state.currentlySelectedRegion.value,
        shipping_addresses: this.state.shipping_addresses,
        primary_contact_name: this.state.primary_contact_name,
        primary_contact_phone: this.state.primary_contact_phone,
        primary_contact_fax: this.state.primary_contact_fax
      }
    );
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

  updateCustomer = (customer) =>
  {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: {
        "Name": customer.name,
        "EmailAddress": customer.email,
        "BillingAddress": customer.billing_address,
        "Region": customer.region,
        "PrimaryContact":{
            "Name":customer.primary_contact_name,
            "Phone":customer.primary_contact_phone,
            "Fax":customer.primary_contact_fax

        }
      }
    };
    API.post(customersAPI, '/'+customer.customer_id+updatePath, apiRequest)
    .then(response =>
    {
      var affectedRows = response.body["AffectedRows"];
      const shippingAddressSuccess = this.updateCustomerShippingAddresses(customer.customer_id, customer.shipping_addresses);
      if(parseInt(affectedRows, 10)==1 && shippingAddressSuccess)
      {
        NotificationManager.success('', 'Customer Successfully Updated', 3000);
        //Refresh Customer List
        this.props.get_all_customers();
      }
      else {
        NotificationManager.error('Creating Customer Shipping Addresses Failed', 'Error', 5000, () => {});
      }
    })
    .catch(err =>
    {
      console.log(err);
      NotificationManager.error('Updating Customer Failed', 'Error', 5000, () => {});
    })
  }

  createCustomer = (customer) =>
  {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body: {
        "Name": customer.name,
        "EmailAddress": customer.email,
        "BillingAddress": customer.billing_address,
        "Region": customer.region,
        "PrimaryContact":{
            "Name":customer.primary_contact_name,
            "Phone":customer.primary_contact_phone,
            "Fax":customer.primary_contact_fax

        }
      }
    };
    API.post(customersAPI, createPath, apiRequest)
    .then(response =>
    {
      var customerID = JSON.parse(JSON.parse(response.body))["CustomerID"];
      const success = this.createShippingAddresses(customerID, customer.shipping_addresses);
      if(success)
      {
        NotificationManager.success('', 'Customer Successfully Created', 3000);
        this.setState({
          billing_address:'',
          email:'',
          name:'',
          region:'',
          shipping_addresses:[],
          counter:'0',
          primary_contact_name:'',
          primary_contact_phone:'',
          primary_contact_fax:''
        })
        //Refresh Customer List
        this.props.get_all_customers();
      }
      else {
        NotificationManager.error('Creating Customer Shipping Addresses Failed', 'Error', 5000, () => {});
      }
    })
    .catch(err =>
    {
      console.log(err);
      NotificationManager.error('Customer creation Failed', 'Error', 5000, () => {});
    })
  }

  async createShippingAddresses(customerID, shipping_addresses)
  {
    for(var index = 0; index < shipping_addresses.length; index++) {
      var result = await this.createShippingAddress(customerID, shipping_addresses[index].ShippingAddress);
      if(!result)
      {
        return false;
      }
    }
    return true;
  }

  async updateCustomerShippingAddresses(customerID, shipping_addresses)
  {
    for(var index = 0; index < shipping_addresses.length; index++) {
      if(shipping_addresses[index].created)
      {
        var result = await this.createShippingAddress(customerID, shipping_addresses[index].ShippingAddress);
        if(!result)
        {
          return false;
        }
      } else {
        var result = await this.updateShippingAddress(customerID,shipping_addresses[index].ID, shipping_addresses[index].ShippingAddress);
        if(!result)
        {
          return false;
        }

      }

    }
    return true;

  }

  async createShippingAddress(customerID, shipping_address)
  {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body:{"ShippingAddress": shipping_address}
    };
    const success = API.post(customersAPI, "/"+customerID+"/shipping-addresses/create", apiRequest)
    .then(response =>
    {
      return true;
    })
    .catch(err =>
    {
      NotificationManager.error('Address creation Failed', 'Error', 5000, () => {});
      return false;
    })
    return success;
  }

  async updateShippingAddress(customerID, shipping_address_id, shipping_address)
  {
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      },
      body:{"ShippingAddress": shipping_address}
    };
    const success = API.post(customersAPI, "/"+customerID+"/shipping-addresses/"+shipping_address_id+"/update", apiRequest)
    .then(response =>
    {
      return true;
    })
    .catch(err =>
    {
      NotificationManager.error('Address updating Failed', 'Error', 5000, () => {});
      return false;
    })
    return success;
  }

  async deleteShippingAddress(shipping_address_id) {

    var customerID = this.state.currentlySelectedCustomer.value
    if(!customerID || !shipping_address_id) {
      return ;
    }
    const apiRequest = {
      headers: {
        'Authorization': this.state.idToken,
        'Content-Type': 'application/json'
      }
    };
    API.del(customersAPI, "/"+customerID+"/shipping-addresses/"+shipping_address_id+deletePath, apiRequest)
    .then(response =>
    {
      var affectedRows = response.body["AffectedRows"];
      if(parseInt(affectedRows, 10)==1)
      {
        NotificationManager.success('', 'Shipping Address Deleted', 3000);

      }
      else {
        NotificationManager.error('Deleting Shipping Address Failed', 'Error', 5000, () => {});
      }
    })
    .catch(err =>
    {
      console.log(err);
      NotificationManager.error('Deleting Shipping Addres', 'Error', 5000, () => {});
    })
  }

  shippingAddressUpdated = (key, item) =>
  {
     var addresses = this.state.shipping_addresses;
     for(var i = 0; i < addresses.length; i++) {

       if(addresses[i] && addresses[i].ID === key) {
         if(item == null){
           if(!addresses[i].created){
             this.deleteShippingAddress(addresses[i].ID)
           }

           addresses.splice(i, 1);

         }
         else {
           addresses[i].ShippingAddress = item
         }
       }
     }
     this.setState({shipping_addresses: addresses});
  }

  addShippingAddress = (e) => {
    try{
      e.preventDefault();
    } catch (error) {
      //Some events have no default. Expected behavior
    }
    var key = Number(this.state.counter) + 1;
    var default_item = {ID:'0', ShippingAddress:'', created:true};
    var cloneOfDefault = JSON.parse(JSON.stringify(default_item));
    cloneOfDefault.ID = key;
    var shipping_addresses = this.state.shipping_addresses;
    shipping_addresses.push(cloneOfDefault);
    this.setState({counter: key, shipping_addresses: shipping_addresses });
  }

  createOrUpdate() {
    if(this.state.isUpdate){
      return (
        <div data-field-span="1" >
          <label>Customer</label>
          <Select value={this.state.currentlySelectedCustomer} onChange={this.handleCustomerChange} options={this.props.customers} isSearchable="true" placeholder="Select a Customer"/>
      </div>);
    }
  }

  resetInputFields() {
    this.setState({
      customerDataRetrieved: false,
      currentlySelectedCustomer:{},
      name: '',
      currentlySelectedRegion: {},
      email: '',
      billing_address: '',
      shipping_addresses:[],
      primary_contact_name:'',
      primary_contact_phone:'',
      primary_contact_fax:'',

    });

  }

  createCustomerChangeHandler = () => {
    this.setState({isUpdate:false})
    this.resetInputFields();
  }

  updateCustomerChangeHandler = () => {
    this.setState({isUpdate:true})
    this.resetInputFields();

  }

  getButtonText() {
    if(this.state.isUpdate){
      return (<button style={{marginTop: 50 + 'px'}} onClick={(e) => {this.updateCustomerEventHandler(e)} }>Update Customer</button>);
    }
    else {
      return (<button style={{marginTop: 50 + 'px'}} onClick={(e) => {this.createCustomerEventHandler(e)} }>Create Customer</button>);

    }

  }

  renderDetailFields() {
    return (
      <fieldset>
      <div data-row-span="2">
        <div className="radio">
          <label>
            <input type="radio" checked={!this.state.isUpdate} onChange={this.createCustomerChangeHandler} />
            Create Customer
          </label>

          <label style={{marginLeft: 20 + 'px'}}>
            <input type="radio" checked={this.state.isUpdate} onChange={this.updateCustomerChangeHandler} />
            Update Customer
          </label>
        </div>
        {this.createOrUpdate()}
      </div>
      <div data-row-span="2">
        <div data-field-span="1">
          <label>Name</label>
          <input type="text" value={this.state.name}  onChange={this.handleNameChange} />
        </div>
       <div data-field-span="1">
         <label>Email</label>
         <input type="text" value={this.state.email}  onChange={this.handleEmailChange} />
       </div>
     </div>
     <div data-row-span="2">
       <div data-field-span="1">
         <label>Billing Address</label>
         <input type="text" value={this.state.billing_address}  onChange={this.handleBillingAddressChange} />
       </div>
       <div data-field-span="1">
         <label>Region</label>
         <Select value={this.state.currentlySelectedRegion} onChange={this.handleRegionChange.bind(this)} options={this.state.regions} placeholder="Select a region"/>
       </div>
     </div>
     <div data-row-span="3">
       <div data-field-span="1">
         <label>Primary Contact Name</label>
         <input type="text" value={this.state.primary_contact_name}  onChange={this.handlePrimaryContactNameChange} />
       </div>
       <div data-field-span="1">
         <label>Phone Number</label>
         <input type="text" value={this.state.primary_contact_phone}  onChange={this.handlePrimaryContactPhoneChange} />
       </div>
       <div data-field-span="1">
         <label>Fax Number</label>
         <input type="text" value={this.state.primary_contact_fax}  onChange={this.handlePrimaryContactFaxChange} />
       </div>
     </div>
     <fieldset>
       {this.state.shipping_addresses.map(address => (
       <ShippingAddress address={address} update_address_handler={this.shippingAddressUpdated} />
       ))}
       <button onClick={this.addShippingAddress}>Add Shipping Address</button>
     </fieldset>
     <div>
       {this.getButtonText()}
     </div>
     </fieldset>

    )

  }
  createCustomerChoice = () => {
    this.setState({firstChoiceMade: true})
  }

  updateCustomerChoice = () => {
    this.setState({firstChoiceMade: true, isUpdate: true})
  }



  renderOperationChoices() {
    if(!this.state.firstChoiceMade){
      return (
        <div>
          <button onClick={this.createCustomerChoice}>Create Customer</button>
          <button onClick={this.updateCustomerChoice}>Update Customer</button>
        </div>
        )
    } else if(!this.state.isUpdate) {
      return (
        <div>
          {this.renderDetailFields()}
        </div>
      )
    } else if(!this.state.customerDataRetrieved) {
      return (
        <div>
          {this.createOrUpdate()}
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

export default withRouter(Customer);
